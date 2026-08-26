import type { Request, Response } from "express";
import { createOrderSchema, updateOrderStatusSchema } from "../validations/order.validation.js";
import logger from "../config/logger.js";
import {
  createOrder,
  getOrdersBySession,
  getOrdersByTable,
  getActiveKitchenOrders,
  getReadyWaiterOrders,
  listOrders,
  updateOrderStatus,
  getOrderById,
  cancelOrderAsCustomer,
} from "../services/order.service.js";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "CANCELLED"];

export const createOrderController = async (req: Request, res: Response) => {
  try {
    const body = { ...req.body };
    if (req.params.tableId && !body.tableId) {
      body.tableId = req.params.tableId;
    }

    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid order data", details: parsed.error.flatten() });
    }

    const { sessionId, tableId, items, specialInstructions } = parsed.data;

    const orderData: { sessionId?: string; tableId?: string; items: { menuItemId: string; quantity: number }[]; specialInstructions?: string } = { items };
    if (sessionId) orderData.sessionId = sessionId;
    if (tableId) orderData.tableId = tableId;
    if (specialInstructions) orderData.specialInstructions = specialInstructions;

    const order = await createOrder(orderData);

    logger.info("Order created successfully");
    return res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    logger.error("Error creating order:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const statusCode = message.includes("unavailable") ? 400 : message.includes("not found") ? 404 : 500;
    return res.status(statusCode).json({ error: message });
  }
};

export const getOrdersBySessionController = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "sessionId is required" });
    }
    const orders = await getOrdersBySession(sessionId);
    return res.status(200).json({ message: "Orders retrieved successfully", orders });
  } catch (error) {
    logger.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getOrdersByTableController = async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params;
    if (!tableId || typeof tableId !== "string") {
      return res.status(400).json({ error: "tableId is required" });
    }
    const orders = await getOrdersByTable(tableId);
    return res.status(200).json({ message: "Orders retrieved successfully", orders });
  } catch (error) {
    logger.error("Error fetching orders by table:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateOrderStatusController = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ error: "orderId is required" });
    }
    const parsed = updateOrderStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const userId = (req as any).user?.sub;
    const order = await updateOrderStatus(orderId, parsed.data.status, userId);
    logger.info(`Order ${orderId} status updated to ${parsed.data.status} by ${userId ?? 'system'}`);
    return res.status(200).json({ message: "Order status updated successfully", order });
  } catch (error) {
    logger.error("Error updating order status:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const statusCode = message === "Order not found" ? 404 : message === "Invalid status" ? 400 : 500;
    return res.status(statusCode).json({ error: message });
  }
};

export const getOrderByIdController = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ error: "orderId is required" });
    }
    const order = await getOrderById(orderId);
    return res.status(200).json({ message: "Order retrieved successfully", order });
  } catch (error) {
    logger.error("Error fetching order:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const statusCode = message === "Order not found" ? 404 : 500;
    return res.status(statusCode).json({ error: message });
  }
};

export const cancelOrderAsCustomerController = async (req: Request, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId : "";
    if (!orderId || !sessionId) {
      return res.status(400).json({ error: "orderId and sessionId are required" });
    }

    const order = await cancelOrderAsCustomer(orderId, sessionId);
    logger.info(`Order ${orderId} cancelled by customer session ${sessionId.slice(0, 8)}`);
    return res.status(200).json({ message: "Order cancelled successfully", order });
  } catch (error) {
    logger.error("Error cancelling order:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const statusCode = message === "Order not found" ? 404 : message === "Only pending orders can be cancelled" ? 409 : 500;
    return res.status(statusCode).json({ error: message });
  }
};

export const getActiveKitchenOrdersController = async (req: Request, res: Response) => {
  try {
    const orders = await getActiveKitchenOrders();
    return res.status(200).json({ message: "Active kitchen orders retrieved successfully", orders });
  } catch (error) {
    logger.error("Error fetching active kitchen orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getReadyWaiterOrdersController = async (req: Request, res: Response) => {
  try {
    const orders = await getReadyWaiterOrders();
    return res.status(200).json({ message: "Ready waiter orders retrieved successfully", orders });
  } catch (error) {
    logger.error("Error fetching ready waiter orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const listOrdersController = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const status = typeof req.query.status === "string" && VALID_STATUSES.includes(req.query.status)
      ? req.query.status
      : undefined;
    const tableId = typeof req.query.tableId === "string" ? req.query.tableId : undefined;

    const parseDate = (value: unknown): Date | undefined => {
      if (typeof value !== "string" || value.length === 0) return undefined;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? undefined : date;
    };
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);

    const data = await listOrders({
      page,
      limit,
      ...(status && { status }),
      ...(tableId && { tableId }),
      ...(from && { from }),
      ...(to && { to }),
    });

    return res.status(200).json({ message: "Orders fetched successfully", data });
  } catch (error) {
    logger.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};