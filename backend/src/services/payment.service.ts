// src/services/payment.service.ts
import { prisma } from "../config/db.js";
import { getIo } from "../utils/socket.js";

export const createPayment = async (
  sessionId: string,
  method: "CASH" | "CARD" | "ONLINE",
  closedBy: "SYSTEM" | "STAFF",
  orderId?: string
) => {
  const session = await prisma.tableSession.findUnique({
    where: { id: sessionId },
    include: { orders: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }
  if (session.status !== "ACTIVE") {
    throw new Error("Session is not active");
  }

  const totalAmount = session.orders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0
  );

  if (totalAmount <= 0) {
    throw new Error("No orders to pay for in this session");
  }

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        sessionId,
        orderId: orderId ?? null,
        amount: totalAmount, // always server-computed, never client input
        method,
        status: "PAID",
        gatewayReferenceId: method === "ONLINE" ? `stub_${Date.now()}` : null,
      },
    });

    // Only close session if no orderId provided (legacy flow)
    if (!orderId) {
      await tx.tableSession.update({
        where: { id: sessionId },
        data: { status: "CLOSED", closedBy, closedAt: new Date() },
      });
    }

    return created;
  });

  // notify the customer session and staff rooms that the table closed
  try {
    getIo().to(`session:${sessionId}`)
        .to('waiter')
        .to('kitchen')
        .emit('session:closed', {
            sessionId,
            closedAt: new Date(),
            paidAmount: payment.amount,
        });
  } catch {
    // socket may not be initialized in some environments; don't fail the payment
  }

  return payment;
};

export const linkPaymentToOrder = async (paymentId: string, orderId: string) => {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { orderId },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { paymentId, paymentStatus: "PAID" },
  });

  // Emit order:new since the order is now paid and ready for kitchen
  try {
    getIo().to('kitchen').to('waiter').emit('order:new', {
      id: orderId,
      sessionId: payment.sessionId,
      status: "PENDING",
      // Order will be fetched by frontend via websocket or refetch
    });
  } catch {
    // socket may not be initialized
  }

  return payment;
};

export const getPaymentBySession = async (sessionId: string) => {
  return prisma.payment.findMany({ where: { sessionId }, orderBy: { createdAt: "desc" } });
};

export const getPaymentsByTable = async (tableId: string) => {
  return prisma.payment.findMany({
    where: { session: { tableId } },
    include: { session: true },
    orderBy: { createdAt: "desc" },
  });
};