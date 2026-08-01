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

const router = Router();

// POST /api/contact - Submit contact inquiry
router.post('/', validateCreateContact, createContact);

// GET /api/contact - List all contact inquiries
router.get('/', getAllContacts);

// GET /api/contact/:id - Get single contact inquiry
router.get('/:id', getSingleContact);

// PATCH /api/contact/:id - Update contact inquiry status
router.patch('/:id', validateUpdateContactStatus, updateContactStatus);

// DELETE /api/contact/:id - Delete contact inquiry
router.delete('/:id', deleteContact);

export default router;
