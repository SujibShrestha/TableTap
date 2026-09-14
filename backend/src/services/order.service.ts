import { prisma } from "../config/db.js";
import { generateEsewaSignature } from "../utils/esewa.js";
import { getIo } from "../utils/socket.js";
import { getOrCreateActiveSession } from "./table.service.js";
import logger from "../config/logger.js";

export const createOrder = async (data: {
  sessionId?: string;
  tableId?: string;
  items: { menuItemId: string; quantity: number }[];
  specialInstructions?: string;
  paymentStatus?: "UNPAID" | "AWAITING_PAYMENT" | "PAID";
  paymentId?: string;
}) => {
  let sessionId = data.sessionId;

  if (!sessionId) {
    if (!data.tableId) {
      throw new Error("Either sessionId or tableId is required");
    }
    const session = await getOrCreateActiveSession(data.tableId);
    sessionId = session.id;
  } else {
    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.status !== "ACTIVE") {
      throw new Error("Invalid or inactive session");
    }
  }

  const menuItemIds = data.items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
  });

  const unavailable: string[] = [];
  for (const item of data.items) {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId);
    if (!menuItem || !menuItem.isAvailable) {
      unavailable.push(menuItem?.name || item.menuItemId);
    }
  }

  if (unavailable.length > 0) {
    throw new Error(
      `The following menu items are unavailable: ${unavailable.join(", ")}`,
    );
  }

  let totalAmount = 0;
  const orderItemsData = data.items.map((item) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
    const lineTotal = Number(menuItem.price) * item.quantity;
    totalAmount += lineTotal;

    return {
      menuItemId: menuItem.id,
      quantity: item.quantity,
      unitPrice: menuItem.price,
      costPriceAtOrder: menuItem.costPrice,
    };
  });

  const order = await prisma.order.create({
    data: {
      sessionId,
      specialInstructions: data.specialInstructions ?? null,
      totalAmount,
      status: "PENDING",
      paymentStatus: data.paymentStatus ?? "UNPAID",
      paymentId: data.paymentId ?? null,
      items: { create: orderItemsData },
    },
    include: { items: { include: { menuItem: true } } },
  });

  if (!order) {
    throw new Error("Failed to create order");
  }

  // Only emit to kitchen/waiter if paymentStatus is PAID (order is ready for kitchen)
  if (order.paymentStatus === "PAID") {
    getIo().to("kitchen").to("waiter").emit("order:new", order);
  }

  return order;
};

export const getOrdersBySession = async (sessionId: string) => {
  return prisma.order.findMany({
    where: { sessionId },
    include: { items: { include: { menuItem: true } } },
    orderBy: { createdAt: "desc" },
  });
};

export const getOrdersByTable = async (tableId: string) => {
  const session = await prisma.tableSession.findFirst({
    where: { tableId, status: "ACTIVE" },
    select: { id: true },
  });

  if (!session) {
    return [];
  }

  return getOrdersBySession(session.id);
};

export const updateOrderStatus = async (
  orderId: string,
  status: string,
  updatedByStaffId?: string,
) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    throw new Error("Order not found");
  }

  const validStatuses = [
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "SERVED",
    "CANCELLED",
  ];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: status as any, updatedByStaffId: updatedByStaffId ?? null },
    include: { items: { include: { menuItem: true } }, session: true },
  });

  // notify the specific customer session, AND the waiter/kitchen rooms
  try {
    const io = getIo();
    io.to(`session:${updated.sessionId}`)
      .to("waiter")
      .to("kitchen")
      .emit("order:statusUpdated", updated);
  } catch (err) {
    // socket may not be initialized in some environments; don't fail the operation
  }

  return updated;
};

export const getOrderById = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { menuItem: true } }, session: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};

/**
 * Customer-facing cancel — no staff auth. The sessionId acts as the credential
 * (same pattern as the other public customer endpoints).
 */
export const cancelOrderAsCustomer = async (
  orderId: string,
  sessionId: string,
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { session: { select: { id: true, status: true } } },
  });

  if (
    !order ||
    order.sessionId !== sessionId ||
    !order.session ||
    order.session.status !== "ACTIVE"
  ) {
    throw new Error("Order not found");
  }
  if (order.status !== "PENDING") {
    throw new Error("Only pending orders can be cancelled");
  }

  // reuses updateOrderStatus so existing socket broadcasts fire
  return updateOrderStatus(orderId, "CANCELLED");
};

export const getActiveKitchenOrders = async () => {
  return prisma.order.findMany({
    where: {
      paymentStatus: "PAID",
      status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] },
    },
    include: {
      items: { include: { menuItem: true } },
      session: { include: { table: true } },
    },
    orderBy: { createdAt: "asc" },
  });
};

export const getReadyWaiterOrders = async () => {
  return prisma.order.findMany({
    where: {
      paymentStatus: "PAID",
      status: "READY",
    },
    include: {
      items: { include: { menuItem: true } },
      session: { include: { table: true } },
    },
    orderBy: { updatedAt: "asc" },
  });
};

export const listOrders = async ({
  page,
  limit,
  status,
  tableId,
  from,
  to,
}: {
  page: number;
  limit: number;
  status?: string;
  tableId?: string;
  from?: Date;
  to?: Date;
}) => {
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (tableId) where.session = { tableId };
  if (from || to) {
    where.createdAt = {
      ...(from && { gte: from }),
      ...(to && { lte: to }),
    };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: { include: { menuItem: true } },
        session: { include: { table: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Create order with payment in a single atomic transaction.
 * Used by customer-facing "pay first" flow.
 */
export const createOrderWithPayment = async (data: {
  sessionId: string;
  items: { menuItemId: string; quantity: number }[];
  specialInstructions?: string;
  paymentMethod: "ONLINE" | "AT_COUNTER";
}) => {
  const { sessionId, items, specialInstructions, paymentMethod } = data;

  const session = await prisma.tableSession.findUnique({
    where: { id: sessionId },
    include: { orders: true, payments: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }
  if (session.status !== "ACTIVE") {
    throw new Error("Invalid or inactive session");
  }

  // Validate items
  const menuItemIds = items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
  });

  const unavailable: string[] = [];
  for (const item of items) {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId);
    if (!menuItem || !menuItem.isAvailable) {
      unavailable.push(menuItem?.name || item.menuItemId);
    }
  }

  if (unavailable.length > 0) {
    throw new Error(
      `The following menu items are unavailable: ${unavailable.join(", ")}`,
    );
  }

  let totalAmount = 0;
  const orderItemsData = items.map((item) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
    const lineTotal = Number(menuItem.price) * item.quantity;
    totalAmount += lineTotal;

    return {
      menuItemId: menuItem.id,
      quantity: item.quantity,
      unitPrice: menuItem.price,
      costPriceAtOrder: menuItem.costPrice,
    };
  });

  // Validate total
  if (totalAmount <= 0) {
    throw new Error("No orders to pay for");
  }

  return prisma.$transaction(async (tx) => {
    if (paymentMethod === "ONLINE") {
      // ONLINE: Create order with AWAITING_PAYMENT.
      // Actual payment status is confirmed later via verify-esewa.

      const order = await tx.order.create({
        data: {
          sessionId,
          specialInstructions: specialInstructions ?? null,
          totalAmount,
          status: "PENDING",
          paymentStatus: "AWAITING_PAYMENT",
          paymentId: null,
          items: { create: orderItemsData },
        },
        include: { items: { include: { menuItem: true } } },
      });

      const signature = generateEsewaSignature({
        amount: totalAmount,
        transactionUuid: order.id,
      });

      const successUrl = `${process.env.FRONTEND_SUCCESS_URL}/${order.id}`;
      const failureUrl = `${process.env.FRONTEND_FAILURE_URL}/${order.id}`;

      return {
        order,
        payment: null,
        esewa: {
          paymentUrl: process.env.ESEWA_PAYMENT_URL!,
          fields: {
            amount: totalAmount.toFixed(2),
            tax_amount: "0.00",
            total_amount: totalAmount.toFixed(2),
            transaction_uuid: order.id,
            product_code: process.env.ESEWA_MERCHANT_CODE!,
            product_service_charge: "0.00",
            product_delivery_charge: "0.00",
            success_url: successUrl,
            failure_url: failureUrl,
            signed_field_names: "total_amount,transaction_uuid,product_code",
            signature,
          },
        },
      };
    } else {
      // AT_COUNTER: Create order with AWAITING_PAYMENT, no payment yet
      const order = await tx.order.create({
        data: {
          sessionId,
          specialInstructions: specialInstructions ?? null,
          totalAmount,
          status: "PENDING",
          paymentStatus: "AWAITING_PAYMENT",
          paymentId: null,
          items: { create: orderItemsData },
        },
        include: { items: { include: { menuItem: true } } },
      });

      return { order, payment: null };
    }
  });
};

/**
 * Get orders awaiting payment (AT_COUNTER) or pending verification for staff bills page
 */
export const getAwaitingPaymentOrders = async () => {
  return prisma.order.findMany({
    where: {
      paymentStatus: { in: ["AWAITING_PAYMENT", "PENDING_VERIFICATION"] },
      status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] },
      session: { status: "ACTIVE" },
    },
    include: {
      items: { include: { menuItem: true } },
      session: { include: { table: true } },
      payment: true,
    },
    orderBy: { createdAt: "asc" },
  });
};


//verify esewa payment
export const verifyEsewaPayment = async (orderId: string) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { session: { include: { table: true } } },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.paymentStatus === "PAID") {
      // already verified previously — idempotent, don't double-process
      return { order, alreadyVerified: true } as const;
    }

    if (order.paymentStatus !== "AWAITING_PAYMENT") {
      throw new Error("Order is not awaiting online payment");
    }

    const amount = Number(order.totalAmount).toFixed(2);
    const statusUrl = `${process.env.ESEWA_STATUS_CHECK_URL}?product_code=${process.env.ESEWA_MERCHANT_CODE}&total_amount=${amount}&transaction_uuid=${order.id}`;

    logger.info(`eSewa status check: ${statusUrl}`);

    const statusRes = await fetch(statusUrl);
    const statusData = await statusRes.json();

    if (statusData.status !== "COMPLETE") {
      return { order, payment: null, status: statusData.status } as const;
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          sessionId: order.sessionId,
          orderId: order.id,
          method: "ONLINE",
          amount: order.totalAmount,
          status: "PAID",
          gatewayReferenceId: statusData.ref_id,
        },
      });
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: "PAID", paymentId: payment.id },
        include: { items: { include: { menuItem: true } }, session: { include: { table: true } } },
      });

      logger.info(`Esewa payment verified for order ${order.id}, payment ${payment.id}`);
      return { order: updatedOrder, payment };
    });

    try {
      getIo().to("kitchen").to("waiter").emit("order:new", result.order);
    } catch {
      // socket may not be initialized
    }

    return result;
  } catch (error) {
    logger.error(`Error verifying Esewa payment for order ${orderId}:`, error);
    throw error;
  }
};