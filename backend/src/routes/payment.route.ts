import { Router } from "express";
import {
  createPaymentController,
  getPaymentBySessionController,
  getPaymentsByTableController,
} from "../controllers/payment.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, requireRole("ADMIN", "CASHIER"), createPaymentController);
router.get("/session/:sessionId", requireAuth, getPaymentBySessionController);
router.get("/table/:tableId", requireAuth, getPaymentsByTableController);

export default router;