// src/controllers/payment.controller.ts
import type { Request, Response } from "express";
import { createPaymentSchema, createOnlinePaymentSchema, markCashPaymentSchema } from "../validations/payment.validation.js";
import logger from "../config/logger.js";
import { createPayment, getPaymentBySession, getPaymentsByTable, linkPaymentToOrder } from "../services/payment.service.js";
import { getAwaitingPaymentOrders } from "../services/order.service.js";
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

// Customer-facing — no auth, sessionId from URL is the credential
export const createOnlinePaymentController = async (req: Request, res: Response) => {
  try {
    const parsed = createOnlinePaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payment data", details: parsed.error.flatten() });
    }

    const sessionId = paramToString(req.params.sessionId);
    if (!sessionId) return res.status(400).json({ error: "Missing or invalid sessionId parameter" });

    const { method } = parsed.data;

    const payment = await createPayment(sessionId, method, "SYSTEM");

    logger.info("Online payment created successfully");
    return res.status(201).json({ message: "Payment processed successfully", payment });
  } catch (error) {
    logger.error("Error creating online payment:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return res.status(statusCodeForError(message)).json({ error: message });
  }
};

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

    // First check if there are AWAITING_PAYMENT orders for this session
    const awaitingOrders = await getAwaitingPaymentOrders();
    const sessionAwaitingOrders = awaitingOrders.filter((o) => o.sessionId === sessionId);

    let payment;
    if (sessionAwaitingOrders.length > 0) {
      // Link payment to the first awaiting order
      const order = sessionAwaitingOrders[0]!; // length > 0 guarantees this exists
      
      // Check if order already has a payment in the database
      const existingPayment = await prisma.payment.findFirst({
        where: { orderId: order.id },
      });
      
      if (existingPayment) {
        // Payment already exists, just link it
        payment = await linkPaymentToOrder(existingPayment.id, order.id);
      } else if (order.paymentId) {
        // Order already has a paymentId (ONLINE flow), link it
        payment = await linkPaymentToOrder(order.paymentId, order.id);
      } else {
        // AT_COUNTER flow - create payment and link to order
        payment = await createPayment(sessionId, method, "STAFF", order.id);
        await linkPaymentToOrder(payment.id, order.id);
      }
    } else {
      // Legacy flow - create payment and close session
      payment = await createPayment(sessionId, method, "STAFF");
    }

    logger.info("Cash payment marked by staff");
    return res.status(201).json({ message: "Payment marked as paid", payment });
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