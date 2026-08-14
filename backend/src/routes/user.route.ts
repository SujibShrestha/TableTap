import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import {
    changeMyPassword,
    createUser,
    deleteUser,
    getMe,
    getUser,
    getUsers,
    resetPassword,
    updateUser,
} from "../controllers/user.controller.js";

const router = Router();

// Self routes (any authenticated user)
router.get("/me", requireAuth, getMe);
router.patch("/me/password", requireAuth, changeMyPassword);

// Admin-only routes
router.post("/", requireAuth, requireRole('ADMIN'), createUser);
router.get("/", requireAuth, requireRole('ADMIN'), getUsers);
router.get("/:id", requireAuth, requireRole('ADMIN'), getUser);
router.patch("/:id", requireAuth, requireRole('ADMIN'), updateUser);
router.patch("/:id/password", requireAuth, requireRole('ADMIN'), resetPassword);
router.delete("/:id", requireAuth, requireRole('ADMIN'), deleteUser);

export default router;