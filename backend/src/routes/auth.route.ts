import { Router } from "express";
import { loginController, logoutController, refreshController } from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", loginController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);


export default router;