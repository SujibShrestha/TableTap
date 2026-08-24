import { prisma } from "../config/db.js";
import { closeTableSession } from "./table.service.js";

export const createPayment = async (data: {
  sessionId: string;
  amount: number;
  method: "CASH" | "CARD" | "ONLINE";
  gatewayReferenceId?: string;
}) => {
  const session = await prisma.tableSession.findUnique({
    where: { id: data.sessionId },
    include: { orders: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.status !== "ACTIVE") {
    throw new Error("Session is not active");
  }

  const totalOrderAmount = session.orders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0
  );

  if (data.amount < totalOrderAmount - 0.01) {
    throw new Error(`Payment amount ${data.amount} is less than total order amount ${totalOrderAmount}`);
  }

  const payment = await prisma.payment.create({
    data: {
      sessionId: data.sessionId,
      amount: data.amount,
      method: data.method,
      status: "PAID",
      gatewayReferenceId: data.gatewayReferenceId ?? null,
    },
  });

  await closeTableSession(session.tableId, "SYSTEM");

  return payment;
};

export const getPaymentBySession = async (sessionId: string) => {
  return prisma.payment.findUnique({
    where: { sessionId },
  });
};

export const getPaymentsByTable = async (tableId: string) => {
  return prisma.payment.findMany({
    where: { session: { tableId } },
    include: { session: true },
    orderBy: { createdAt: "desc" },
  });
};