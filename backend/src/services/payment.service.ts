// src/services/payment.service.ts
import { prisma } from "../config/db.js";

export const createPayment = async (
  sessionId: string,
  method: "CASH" | "CARD" | "ONLINE",
  closedBy: "SYSTEM" | "STAFF"
) => {
  const session = await prisma.tableSession.findUnique({
    where: { id: sessionId },
    include: { orders: true, payment: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }
  if (session.status !== "ACTIVE") {
    throw new Error("Session is not active");
  }
  if (session.payment) {
    throw new Error("This session has already been paid");
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
        amount: totalAmount, // always server-computed, never client input
        method,
        status: "PAID",
        gatewayReferenceId: method === "ONLINE" ? `stub_${Date.now()}` : null,
      },
    });

    await tx.tableSession.update({
      where: { id: sessionId },
      data: { status: "CLOSED", closedBy, closedAt: new Date() },
    });

    return created;
  });

  return payment;
};

export const getPaymentBySession = async (sessionId: string) => {
  return prisma.payment.findUnique({ where: { sessionId } });
};

export const getPaymentsByTable = async (tableId: string) => {
  return prisma.payment.findMany({
    where: { session: { tableId } },
    include: { session: true },
    orderBy: { createdAt: "desc" },
  });
};