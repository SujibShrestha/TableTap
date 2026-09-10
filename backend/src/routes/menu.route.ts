import {Router} from 'express'; 
import { createMenuItem, getMenuItems, getMenuItemById, updateMenuItem, deleteMenuItem, getMenuItemByCategoryId } from '../controllers/menu.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/',requireAuth,requireRole("ADMIN"), createMenuItem);

router.get('/', getMenuItems);
router.get('/category/:id', getMenuItemByCategoryId);
router.get('/:id', getMenuItemById);

router.patch('/:id', requireAuth, requireRole("ADMIN"), updateMenuItem);

router.delete('/:id', requireAuth, requireRole("ADMIN"), deleteMenuItem);

export default router;