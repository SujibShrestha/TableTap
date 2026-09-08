// src/services/payment.service.ts
import { prisma } from "../config/db.js";
import { getIo } from "../utils/socket.js";

export const createPayment = async (
  sessionId: string,
  method: "CASH" | "CARD" | "ONLINE",
  closedBy: "SYSTEM" | "STAFF",
  orderId?: string,
  needsVerification = false
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
        status: needsVerification ? "PENDING_VERIFICATION" : "PAID",
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

  // Only notify session closed when the session is actually closed (legacy flow, no orderId).
  // For AT_COUNTER flow (orderId provided), the session stays open until the customer leaves.
  if (!orderId) {
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
  }

  return payment;
};

export const linkPaymentToOrder = async (paymentId: string, orderId: string) => {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { orderId },
  });

  // Only mark order as PAID immediately if payment is already verified (ONLINE flow).
  // For AT_COUNTER flow, payment is PENDING_VERIFICATION — order stays AWAITING_PAYMENT
  // until a cashier verifies.
  if (payment.status === "PAID") {
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
        paymentStatus: "PAID",
      });
    } catch {
      // socket may not be initialized
    }
  } else {
    // Payment is PENDING_VERIFICATION — just link it, keep order as AWAITING_PAYMENT
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentId, paymentStatus: "AWAITING_PAYMENT" },
    });
  }

  return payment;
};

export const verifyPayment = async (paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status !== "PENDING_VERIFICATION") {
    throw new Error("Payment is not pending verification");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "PAID" },
    });

    // Mark ALL orders in this session as PAID (not just the linked one)
    const sessionOrders = await tx.order.findMany({
      where: { sessionId: payment.sessionId, paymentStatus: { in: ["AWAITING_PAYMENT", "PENDING_VERIFICATION"] } },
    });

    for (const order of sessionOrders) {
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: "PAID" },
      });
    }

    return p;
  });

  // Notify kitchen and waiter for ALL orders in the session
  try {
    const sessionOrders = await prisma.order.findMany({
      where: { sessionId: payment.sessionId },
    });
    for (const order of sessionOrders) {
      getIo().to('kitchen').to('waiter').emit('order:new', {
        id: order.id,
        sessionId: payment.sessionId,
        status: order.status,
        paymentStatus: "PAID",
      });
    }
  } catch {
    // socket may not be initialized
  }

  return updated;
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