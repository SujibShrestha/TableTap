import { Router } from "express";
import {
  createOrderController,
  getOrdersBySessionController,
  getOrdersByTableController,
  getActiveKitchenOrdersController,
  updateOrderStatusController,
  getOrderByIdController,
} from "../controllers/order.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Public endpoint for customer ordering (no auth required)
router.post("/", createOrderController);
router.post("/table/:tableId", createOrderController);
router.get("/table/:tableId", getOrdersByTableController);

// Public endpoint for customer to view order by session (no auth required)
router.get("/session/:sessionId", getOrdersBySessionController);

// Kitchen dashboard - get all active orders (kitchen/admin only)
router.get("/kitchen/active", requireAuth, requireRole("ADMIN", "KITCHEN"), getActiveKitchenOrdersController);

// Protected endpoints - admin/waiter/kitchen only
router.get("/:orderId", requireAuth, getOrderByIdController);
router.patch("/:orderId/status", requireAuth, requireRole("ADMIN", "WAITER", "KITCHEN"), updateOrderStatusController);

// real-time socket notifications handled in the service layer

export default router;