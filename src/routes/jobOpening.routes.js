import { Router } from 'express';
import {
  createJobOpening,
  getActiveJobOpenings,
  getAllJobOpenings,
  getSingleJobOpening,
  updateJobOpening,
  deleteJobOpening,
} from '../controllers/jobOpening.controller.js';
import {
  validateCreateJobOpening,
  validateUpdateJobOpening,
} from '../validators/jobOpening.validator.js';
import adminAuthMiddleware from '../middleware/adminAuth.middleware.js';

const router = Router();

// GET /api/jobs - Public: Get all active job openings (supports filters: sector, location, experience, search, page, limit)
router.get('/', getActiveJobOpenings);

// GET /api/jobs/admin/all - Admin: Get all job openings (Active + Closed) with statistics
router.get('/admin/all', adminAuthMiddleware, getAllJobOpenings);

// GET /api/jobs/:id - Public: Get single job opening by ID
router.get('/:id', getSingleJobOpening);

// POST /api/jobs - Admin: Create new monthly job opening
router.post('/', adminAuthMiddleware, validateCreateJobOpening, createJobOpening);

// PUT /api/jobs/:id - Admin: Update job opening by ID
router.put('/:id', adminAuthMiddleware, validateUpdateJobOpening, updateJobOpening);

// PATCH /api/jobs/:id - Admin: Partial update / status toggle by ID
router.patch('/:id', adminAuthMiddleware, validateUpdateJobOpening, updateJobOpening);

// DELETE /api/jobs/:id - Admin: Delete job opening by ID
router.delete('/:id', adminAuthMiddleware, deleteJobOpening);

export default router;
