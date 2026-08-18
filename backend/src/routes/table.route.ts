import Router from "express";
import { createTable, getTableById, getTables, updateTable, deleteTable, checkTableStatus, closeTableSession } from "../controllers/table.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/:id", getTableById);
router.post("/", requireAuth, requireRole("ADMIN"), createTable);
router.get("/", requireAuth, getTables);
router.put("/:id", requireAuth, requireRole("ADMIN"), updateTable);
router.delete("/:id", requireAuth, requireRole("ADMIN"), deleteTable);

router.get("/:id/status", checkTableStatus);
router.patch("/:id/status", requireAuth, requireRole("ADMIN"), closeTableSession);

export default router;