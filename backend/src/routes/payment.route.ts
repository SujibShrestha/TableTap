import { Router } from "express";
import {
  markCashPaymentController,       // staff-facing, cashier/admin only
  getPaymentBySessionController,
  getPaymentsByTableController,
  getTodayPaymentsController,
  verifyPaymentController,         // cashier-only verification
} from "../controllers/payment.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Staff marks a session as paid via cash/card — staff only
router.post("/session/:sessionId/mark-cash-paid", requireAuth, requireRole("ADMIN", "CASHIER", "WAITER"), markCashPaymentController);

// Cashier/waiter verifies a pending payment
router.post("/:paymentId/verify", requireAuth, requireRole("ADMIN", "CASHIER", "WAITER"), verifyPaymentController);

router.get("/session/:sessionId", requireAuth, getPaymentBySessionController);
router.get("/table/:tableId", requireAuth, getPaymentsByTableController);
router.get("/today", requireAuth, requireRole("ADMIN", "CASHIER"), getTodayPaymentsController);

export default router;