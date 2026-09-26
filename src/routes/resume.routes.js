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
import adminAuthMiddleware, { optionalAdminAuthMiddleware } from '../middleware/adminAuth.middleware.js';

const router = Router();

// POST /api/resumes (and /api/resume) - Upload resume submission (Public)
router.post(
  '/',
  uploadResumeMiddleware.single('resume'),
  validateUploadResume,
  uploadResume
);

// GET /api/resumes - List all resumes (Admin / Dashboard)
router.get('/', adminAuthMiddleware, getAllResumes);

// GET /api/resumes/download/:id - Download/View resume file by ID
router.get('/download/:id', optionalAdminAuthMiddleware, downloadResume);

// GET /api/resumes/view/:id - Inline view resume file by ID
router.get('/view/:id', optionalAdminAuthMiddleware, downloadResume);

// GET /api/resumes/file/:id - Direct resume file by ID
router.get('/file/:id', optionalAdminAuthMiddleware, downloadResume);

// GET /api/resumes/:id - Get single resume by ID (Admin / Dashboard)
router.get('/:id', adminAuthMiddleware, getSingleResume);

// PATCH /api/resumes/:id - Update resume status (Admin / Dashboard)
router.patch('/:id', adminAuthMiddleware, validateUpdateResumeStatus, updateResumeStatus);

// DELETE /api/resumes/:id - Delete resume by ID (Admin / Dashboard)
router.delete('/:id', adminAuthMiddleware, deleteResume);

export default router;

