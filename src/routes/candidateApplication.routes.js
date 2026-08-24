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

const router = Router();

// POST /api/applications - Submit candidate application with photo & documents
router.post(
  '/',
  uploadCandidateApplicationMiddleware,
  validateCandidateApplication,
  submitCandidateApplication
);

// GET /api/applications - List all candidate applications
router.get('/', getAllCandidateApplications);

// GET /api/applications/:id - Get single application by ID
router.get('/:id', getSingleCandidateApplication);

// PATCH /api/applications/:id - Update application status
router.patch('/:id', validateUpdateApplicationStatus, updateCandidateApplicationStatus);

// DELETE /api/applications/:id - Delete application by ID
router.delete('/:id', deleteCandidateApplication);

export default router;
