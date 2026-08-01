import { Router } from 'express';
import {
  uploadResume,
  getAllResumes,
  getSingleResume,
  updateResumeStatus,
  deleteResume,
  downloadResume,
} from '../controllers/resume.controller.js';
import uploadResumeMiddleware from '../middleware/upload.middleware.js';
import {
  validateUploadResume,
  validateUpdateResumeStatus,
} from '../validators/resume.validator.js';

const router = Router();

// POST /api/resume - Upload resume submission
router.post(
  '/',
  uploadResumeMiddleware.single('resume'),
  validateUploadResume,
  uploadResume
);

// GET /api/resume - List all resumes
router.get('/', getAllResumes);

// GET /api/resume/download/:id - Download resume file by ID
router.get('/download/:id', downloadResume);

// GET /api/resume/:id - Get single resume by ID
router.get('/:id', getSingleResume);

// PATCH /api/resume/:id - Update resume status
router.patch('/:id', validateUpdateResumeStatus, updateResumeStatus);

// DELETE /api/resume/:id - Delete resume by ID
router.delete('/:id', deleteResume);

export default router;
