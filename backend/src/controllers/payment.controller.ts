import type { Request, Response } from "express";
import { createPaymentSchema } from "../validations/payment.validation.js";
import logger from "../config/logger.js";
import { createPayment, getPaymentBySession, getPaymentsByTable } from "../services/payment.service.js";

export const createPaymentController = async (req: Request, res: Response) => {
  try {
    const parsed = createPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payment data", details: parsed.error.flatten() });
    }

    const { sessionId, amount, method, gatewayReferenceId } = parsed.data;

    const paymentData: { sessionId: string; amount: number; method: "CASH" | "CARD" | "ONLINE"; gatewayReferenceId?: string } = { sessionId, amount, method };
    if (gatewayReferenceId) paymentData.gatewayReferenceId = gatewayReferenceId;

    const payment = await createPayment(paymentData);

    logger.info("Payment created successfully");
    return res.status(201).json({ message: "Payment processed successfully", payment });
  } catch (error) {
    logger.error("Error creating payment:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const statusCode = message.includes("not found") ? 404 : message.includes("less than total") ? 400 : 500;
    return res.status(statusCode).json({ error: message });
  }
};

export const getPaymentBySessionController = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "sessionId is required" });
    }
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
    const { tableId } = req.params;
    if (!tableId || typeof tableId !== "string") {
      return res.status(400).json({ error: "tableId is required" });
    }
    const payments = await getPaymentsByTable(tableId);
    return res.status(200).json({ message: "Payments retrieved successfully", payments });
  } catch (error) {
    logger.error("Error fetching payments:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};