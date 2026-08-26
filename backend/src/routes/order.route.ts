import { Router } from "express";
import {
  createOrderController,
  getOrdersBySessionController,
  getOrdersByTableController,
  getActiveKitchenOrdersController,
  getReadyWaiterOrdersController,
  listOrdersController,
  updateOrderStatusController,
  getOrderByIdController,
  cancelOrderAsCustomerController,
} from "../controllers/order.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Public endpoint for customer ordering (no auth required)
router.post("/", createOrderController);
router.post("/table/:tableId", createOrderController);
router.get("/table/:tableId", getOrdersByTableController);

// Public endpoint for customer to view order by session (no auth required)
router.get("/session/:sessionId", getOrdersBySessionController);

// Public customer cancel — sessionId in body is the credential; PENDING orders only
router.patch("/:orderId/cancel", cancelOrderAsCustomerController);

// Kitchen dashboard - get all active orders (kitchen/admin only)
router.get("/kitchen/active", requireAuth, requireRole("ADMIN", "KITCHEN"), getActiveKitchenOrdersController);

// Waiter dashboard - get all orders ready to be served (waiter/admin only)
router.get("/waiter/ready", requireAuth, requireRole("ADMIN", "WAITER"), getReadyWaiterOrdersController);

// Staff orders page - paginated list of all orders with filters (waiter/admin only)
router.get("/all", requireAuth, requireRole("ADMIN", "WAITER"), listOrdersController);

// Protected endpoints - admin/waiter/kitchen only
router.get("/:orderId", requireAuth, getOrderByIdController);
router.patch("/:orderId/status", requireAuth, requireRole("ADMIN", "WAITER", "KITCHEN"), updateOrderStatusController);

// real-time socket notifications handled in the service layer

export default router;