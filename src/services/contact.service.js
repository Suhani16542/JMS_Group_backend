import Contact from '../models/Contact.js';
import ApiError from '../utils/ApiError.js';
import { sendContactNotificationEmail } from './email.service.js';

/**
 * Contact Service Layer
 * Business logic handlers for contact submissions.
 */

/**
 * Creates a new contact submission.
 * @param {Object} contactData - Contact payload from request body
 */
export const createContactService = async (contactData) => {
  const newContact = await Contact.create(contactData);

  // Dispatch background email notification via Brevo SMTP (if configured)
  sendContactNotificationEmail(newContact);

  return newContact;
};

/**
 * Fetches all contact submissions with search, filtering, and pagination.
 * @param {Object} queryParams - Query parameters (search, status, page, limit)
 */
export const getAllContactsService = async (queryParams = {}) => {
  const { search, status, page = 1, limit = 20 } = queryParams;

  const filter = {};

  if (status && typeof status === 'string' && status.trim()) {
    filter.status = { $regex: new RegExp(`^${status.trim()}$`, 'i') };
  }

  if (search && typeof search === 'string' && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { subject: searchRegex },
      { message: searchRegex },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [total, contacts] = await Promise.all([
    Contact.countDocuments(filter),
    Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  return {
    contacts,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
};

/**
 * Fetches a single contact submission by ID.
 * @param {string} id - Contact ID
 */
export const getSingleContactService = async (id) => {
  const contact = await Contact.findById(id);
  if (!contact) {
    throw new ApiError(404, 'Contact submission not found');
  }
  return contact;
};

/**
 * Updates status of a contact submission.
 * @param {string} id - Contact ID
 * @param {string} status - New status
 */
export const updateContactStatusService = async (id, status) => {
  const updatedContact = await Contact.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!updatedContact) {
    throw new ApiError(404, 'Contact submission not found');
  }
  return updatedContact;
};

/**
 * Deletes a contact submission by ID.
 * @param {string} id - Contact ID
 */
export const deleteContactService = async (id) => {
  const deletedContact = await Contact.findByIdAndDelete(id);
  if (!deletedContact) {
    throw new ApiError(404, 'Contact submission not found');
  }
  return deletedContact;
};

export default {
  createContactService,
  getAllContactsService,
  getSingleContactService,
  updateContactStatusService,
  deleteContactService,
};

