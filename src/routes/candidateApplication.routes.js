import { Router } from 'express';
import {
  submitCandidateApplication,
  getAllCandidateApplications,
  getSingleCandidateApplication,
  updateCandidateApplicationStatus,
  deleteCandidateApplication,
} from '../controllers/candidateApplication.controller.js';
import { uploadCandidateApplicationMiddleware } from '../middleware/upload.middleware.js';
import {
  validateCandidateApplication,
  validateUpdateApplicationStatus,
} from '../validators/candidateApplication.validator.js';
import adminAuthMiddleware from '../middleware/adminAuth.middleware.js';

const router = Router();

// POST /api/candidateapplications (and /api/applications) - Submit candidate application (Public)
router.post(
  '/',
  uploadCandidateApplicationMiddleware,
  validateCandidateApplication,
  submitCandidateApplication
);

// GET /api/candidateapplications - List all candidate applications (Admin / Dashboard)
router.get('/', adminAuthMiddleware, getAllCandidateApplications);

// GET /api/candidateapplications/:id - Get single application by ID (Admin / Dashboard)
router.get('/:id', adminAuthMiddleware, getSingleCandidateApplication);

// PATCH /api/candidateapplications/:id - Update application status (Admin / Dashboard)
router.patch('/:id', adminAuthMiddleware, validateUpdateApplicationStatus, updateCandidateApplicationStatus);

// DELETE /api/candidateapplications/:id - Delete application by ID (Admin / Dashboard)
router.delete('/:id', adminAuthMiddleware, deleteCandidateApplication);

export default router;
