import {Router} from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { orderSummary } from '../controllers/analytics.controller.js';

const router = Router();

router.use(requireAuth,requireRole('ADMIN'));


router.get("/summary",orderSummary);


export default router;