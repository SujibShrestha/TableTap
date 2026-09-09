import {Router} from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { bestSellers, daily, orderSummary } from '../controllers/analytics.controller.js';

const router = Router();

router.use(requireAuth,requireRole('ADMIN'));


router.get("/summary",orderSummary);
router.get("/best-sellers",bestSellers);
router.get("/daily",daily);


export default router;