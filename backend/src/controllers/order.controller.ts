import type { Request, Response } from "express";
import { createOrderSchema, updateOrderStatusSchema } from "../validations/order.validation.js";
import logger from "../config/logger.js";
import {
  createOrder,
  getOrdersBySession,
  getOrdersByTable,
  getActiveKitchenOrders,
  getReadyWaiterOrders,
  updateOrderStatus,
  getOrderById,
} from "../services/order.service.js";

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