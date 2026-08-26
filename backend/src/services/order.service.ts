import { prisma } from "../config/db.js";
import { getIo } from "../utils/socket.js";
import { getOrCreateActiveSession } from "./table.service.js";

export const createOrder = async (data: {
  sessionId?: string;
  tableId?: string;
  items: { menuItemId: string; quantity: number }[];
  specialInstructions?: string;
}) => {
  let sessionId = data.sessionId;

  if (!sessionId) {
    if (!data.tableId) {
      throw new Error("Either sessionId or tableId is required");
    }
    const session = await getOrCreateActiveSession(data.tableId);
    sessionId = session.id;
  } else {
    const session = await prisma.tableSession.findUnique({ where: { id: sessionId } });
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
    throw new Error(`The following menu items are unavailable: ${unavailable.join(", ")}`);
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
      items: { create: orderItemsData },
    },
    include: { items: { include: { menuItem: true } } },
  });

  if (!order) {
    throw new Error("Failed to create order");
  }
  getIo().to('kitchen').to('waiter').emit('order:new', order);

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

export const updateOrderStatus = async (orderId: string, status: string, updatedByStaffId?: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    throw new Error("Order not found");
  }

  const validStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "CANCELLED"];
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
      .to('waiter')
      .to('kitchen')
      .emit('order:statusUpdated', updated);
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
export const cancelOrderAsCustomer = async (orderId: string, sessionId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { session: { select: { id: true, status: true } } },
  });

  if (!order || order.sessionId !== sessionId || !order.session || order.session.status !== "ACTIVE") {
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