import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import adminAuthMiddleware from '../middleware/adminAuth.middleware.js';

const router = Router();

// GET /api/admin/dashboard/stats - Admin Dashboard Statistics
router.get('/stats', adminAuthMiddleware, getDashboardStats);

export default router;
