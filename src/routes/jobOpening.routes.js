import { Router } from 'express';
import {
  createJobOpening,
  getJobOpenings,
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

// GET /api/jobopenings (and /api/jobs) - Get job openings (Supports status=Active/Closed, search, sector, location, page, limit)
router.get('/', getJobOpenings);

// GET /api/jobopenings/admin/all - Admin: Get all job openings (Active + Closed) with statistics
router.get('/admin/all', adminAuthMiddleware, getAllJobOpenings);

// GET /api/jobopenings/:id - Get single job opening by ID
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
