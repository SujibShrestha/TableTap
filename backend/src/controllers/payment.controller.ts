// src/controllers/payment.controller.ts
import type { Request, Response } from "express";
import { markCashPaymentSchema } from "../validations/payment.validation.js";
import logger from "../config/logger.js";
import { createPayment, getPaymentBySession, getPaymentsByTable, getTodayPayments, linkPaymentToOrder, verifyPayment } from "../services/payment.service.js";
import { prisma } from "../config/db.js";

function statusCodeForError(message: string) {
  if (message.includes("not found")) return 404;
  if (message.includes("already been paid")) return 409;
  if (message.includes("not active") || message.includes("No orders")) return 400;
  return 500;
}

function paramToString(param?: string | string[]) {
  if (Array.isArray(param)) return param[0];
  return param;
}

// Staff-facing — cashier/waiter marks a session/order as paid via cash/card, requires auth
export const markCashPaymentController = async (req: Request, res: Response) => {
  try {
    const parsed = markCashPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payment data", details: parsed.error.flatten() });
    }

    const sessionId = paramToString(req.params.sessionId);
    if (!sessionId) return res.status(400).json({ error: "Missing or invalid sessionId parameter" });

    const { method } = parsed.data;

    // Check if a payment already exists for this session
    const existingPayment = await prisma.payment.findFirst({
      where: { sessionId, orderId: { not: null } },
      orderBy: { createdAt: "asc" },
    });

    let payment;
    if (existingPayment) {
      // Payment already exists — mark all awaiting orders as PENDING_VERIFICATION
      await prisma.order.updateMany({
        where: { sessionId, paymentStatus: { in: ["AWAITING_PAYMENT"], not: "PENDING_VERIFICATION" } },
        data: { paymentStatus: "PENDING_VERIFICATION" },
      });
      payment = existingPayment;
    } else {
      // No payment yet — create one and mark all awaiting orders as PENDING_VERIFICATION
      const sessionAwaitingOrders = await prisma.order.findMany({
        where: { sessionId, paymentStatus: "AWAITING_PAYMENT" },
      });

      if (sessionAwaitingOrders.length > 0) {
        // Link payment to first order, mark rest as PENDING_VERIFICATION
        payment = await createPayment(sessionId, method, "STAFF", sessionAwaitingOrders[0]!.id, true);
        await linkPaymentToOrder(payment.id, sessionAwaitingOrders[0]!.id);

        if (sessionAwaitingOrders.length > 1) {
          const remainingIds = sessionAwaitingOrders.slice(1).map((o) => o.id);
          await prisma.order.updateMany({
            where: { id: { in: remainingIds } },
            data: { paymentStatus: "PENDING_VERIFICATION" },
          });
        }
      } else {
        // No awaiting orders found — cannot process payment
        return res.status(400).json({ error: "No pending orders found for this session" });
      }
    }

    logger.info("Cash payment marked by staff");
    return res.status(201).json({ 
      message: payment.status === "PENDING_VERIFICATION" 
        ? "Payment recorded — pending cashier verification" 
        : "Payment marked as paid", 
      payment 
    });
  } catch (error) {
    logger.error("Error marking cash payment:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return res.status(statusCodeForError(message)).json({ error: message });
  }
};

export const getPaymentBySessionController = async (req: Request, res: Response) => {
  try {
    const sessionId = paramToString(req.params.sessionId);
    if (!sessionId) return res.status(400).json({ error: "Missing or invalid sessionId parameter" });

    const payment = await getPaymentBySession(sessionId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    return res.status(200).json({ message: "Payment retrieved successfully", payment });
  } catch (error) {
    logger.error("Error fetching payment:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getPaymentsByTableController = async (req: Request, res: Response) => {
  try {
    const tableId = paramToString(req.params.tableId);
    if (!tableId) return res.status(400).json({ error: "Missing or invalid tableId parameter" });

    const payments = await getPaymentsByTable(tableId);
    return res.status(200).json({ message: "Payments retrieved successfully", payments });
  } catch (error) {
    logger.error("Error fetching payments:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyPaymentController = async (req: Request, res: Response) => {
  try {
    const paymentId = paramToString(req.params.paymentId);
    if (!paymentId) return res.status(400).json({ error: "Missing or invalid paymentId parameter" });

    const payment = await verifyPayment(paymentId);

    logger.info("Payment verified by cashier");
    return res.status(200).json({ message: "Payment verified successfully", payment });
  } catch (error) {
    logger.error("Error verifying payment:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return res.status(statusCodeForError(message)).json({ error: message });
  }
};

export const getTodayPaymentsController = async (_req: Request, res: Response) => {
  try {
    const data = await getTodayPayments();
    return res.status(200).json({ message: "Today's payments fetched successfully", data });
  } catch (error) {
    logger.error("Error fetching today's payments:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};