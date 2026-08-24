import { Router } from "express";
import {
  createOrderController,
  getOrdersBySessionController,
  getOrdersByTableController,
  updateOrderStatusController,
  getOrderByIdController,
} from "../controllers/order.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Public endpoint for customer ordering (no auth required)
router.post("/table/:tableId", createOrderController);

// Protected endpoints
router.post("/", requireAuth, createOrderController);
router.get("/session/:sessionId", requireAuth, getOrdersBySessionController);
router.get("/table/:tableId", requireAuth, getOrdersByTableController);
router.get("/:orderId", requireAuth, getOrderByIdController);
router.patch("/:orderId/status", requireAuth, requireRole("ADMIN", "WAITER", "KITCHEN"), updateOrderStatusController);

export default router;