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
 * Fetches all contact submissions.
 * @param {Object} queryParams - Query parameters for pagination/filtering
 */
export const getAllContactsService = async (queryParams = {}) => {
  const contacts = await Contact.find(queryParams).sort({ createdAt: -1 });
  return contacts;
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

