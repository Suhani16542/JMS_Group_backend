import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import {
  createContactService,
  getAllContactsService,
  getSingleContactService,
  updateContactStatusService,
  deleteContactService,
} from '../services/contact.service.js';

/**
 * @desc    Create a new contact submission
 * @route   POST /api/contact
 * @access  Public
 */
export const createContact = asyncHandler(async (req, res) => {
  const result = await createContactService(req.body);
  return ApiResponse.success(res, 201, 'Contact inquiry submitted successfully', result);
});

/**
 * @desc    Get all contact submissions
 * @route   GET /api/contact
 * @access  Private/Admin
 */
export const getAllContacts = asyncHandler(async (req, res) => {
  const result = await getAllContactsService(req.query);
  return ApiResponse.success(res, 200, 'Contact inquiries retrieved successfully', result);
});

/**
 * @desc    Get a single contact submission by ID
 * @route   GET /api/contact/:id
 * @access  Private/Admin
 */
export const getSingleContact = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await getSingleContactService(id);
  return ApiResponse.success(res, 200, 'Contact inquiry retrieved successfully', result);
});

/**
 * @desc    Update status of a contact submission
 * @route   PATCH /api/contact/:id
 * @access  Private/Admin
 */
export const updateContactStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await updateContactStatusService(id, status);
  return ApiResponse.success(res, 200, 'Contact status updated successfully', result);
});

/**
 * @desc    Delete a contact submission by ID
 * @route   DELETE /api/contact/:id
 * @access  Private/Admin
 */
export const deleteContact = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await deleteContactService(id);
  return ApiResponse.success(res, 200, 'Contact inquiry deleted successfully', result);
});

export default {
  createContact,
  getAllContacts,
  getSingleContact,
  updateContactStatus,
  deleteContact,
};
