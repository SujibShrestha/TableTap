import Router from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { createUser } from "../controllers/user.controller.js";

const router = Router();

router.post("/",requireAuth, requireRole('ADMIN'), createUser);


export default router;