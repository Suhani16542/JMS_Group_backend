import { Router } from 'express';
import { adminLogin } from '../controllers/adminAuth.controller.js';
import { validateAdminLogin } from '../validators/adminAuth.validator.js';

const router = Router();

// POST /api/admin/login (or /api/auth/login) - Admin / HR Login
router.post('/login', validateAdminLogin, adminLogin);

export default router;
