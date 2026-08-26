import { Router } from "express";
import {
  createOnlinePaymentController,   // customer-facing, no auth
  markCashPaymentController,       // staff-facing, cashier/admin only
  getPaymentBySessionController,
  getPaymentsByTableController,
} from "../controllers/payment.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Customer pays online — no auth, session ID is the credential
router.post("/session/:sessionId/pay-online", createOnlinePaymentController);

// Staff marks a session as paid via cash/card — staff only
router.post("/session/:sessionId/mark-cash-paid", requireAuth, requireRole("ADMIN", "CASHIER", "WAITER"), markCashPaymentController);

router.get("/session/:sessionId", requireAuth, getPaymentBySessionController);
router.get("/table/:tableId", requireAuth, getPaymentsByTableController);

export default router;