import {Router} from "express";
import { createCategory, getAllCategories, deleteCategory } from "../controllers/category.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/",requireAuth,requireRole("ADMIN"), createCategory);
router.get("/", getAllCategories);
router.delete("/:id", requireAuth, requireRole("ADMIN"), deleteCategory);

export default router;