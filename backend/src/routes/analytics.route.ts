import {Router} from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { bestSellers, orderSummary } from '../controllers/analytics.controller.js';

const router = Router();

router.use(requireAuth,requireRole('ADMIN'));


router.get("/summary",orderSummary);
router.get("/best-sellers",bestSellers);


export default router;