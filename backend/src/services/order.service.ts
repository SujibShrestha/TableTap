import { prisma } from "../config/db.js";
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

export const updateOrderStatus = async (orderId: string, status: string) => {
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
    data: { status: status as any },
    include: { items: { include: { menuItem: true } } },
  });

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