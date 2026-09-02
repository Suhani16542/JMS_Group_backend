import { Router } from 'express';
import {
  createContact,
  getAllContacts,
  getSingleContact,
  updateContactStatus,
  deleteContact,
} from '../controllers/contact.controller.js';
import {
  validateCreateContact,
  validateUpdateContactStatus,
} from '../validators/contact.validator.js';
import adminAuthMiddleware from '../middleware/adminAuth.middleware.js';

const router = Router();

// POST /api/contacts (and /api/contact) - Submit contact inquiry (Public)
router.post('/', validateCreateContact, createContact);

// GET /api/contacts - List all contact inquiries (Admin / Dashboard)
router.get('/', adminAuthMiddleware, getAllContacts);

// GET /api/contacts/:id - Get single contact inquiry (Admin / Dashboard)
router.get('/:id', adminAuthMiddleware, getSingleContact);

// PATCH /api/contacts/:id - Update contact inquiry status (Admin / Dashboard)
router.patch('/:id', adminAuthMiddleware, validateUpdateContactStatus, updateContactStatus);

// DELETE /api/contacts/:id - Delete contact inquiry (Admin / Dashboard)
router.delete('/:id', adminAuthMiddleware, deleteContact);

export default router;
