import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import {
  createJobOpeningService,
  getActiveJobOpeningsService,
  getAllJobOpeningsService,
  getJobOpeningByIdService,
  updateJobOpeningService,
  deleteJobOpeningService,
} from '../services/jobOpening.service.js';

/**
 * @desc    Create a new job opening
 * @route   POST /api/jobs
 * @access  Admin / Backend
 */
export const createJobOpening = asyncHandler(async (req, res) => {
  const result = await createJobOpeningService(req.body);
  return ApiResponse.success(res, 201, 'Job opening created successfully', result);
});

/**
 * @desc    Get active job openings (Public)
 * @route   GET /api/jobs (or /api/openings)
 * @access  Public
 */
export const getActiveJobOpenings = asyncHandler(async (req, res) => {
  const result = await getActiveJobOpeningsService(req.query);
  return ApiResponse.success(res, 200, 'Active job openings retrieved successfully', result);
});

/**
 * @desc    Get all job openings with statistics (Admin)
 * @route   GET /api/jobs/admin/all
 * @access  Admin / Backend
 */
export const getAllJobOpenings = asyncHandler(async (req, res) => {
  const result = await getAllJobOpeningsService(req.query);
  return ApiResponse.success(res, 200, 'All job openings retrieved successfully', result);
});

/**
 * @desc    Get single job opening by ID
 * @route   GET /api/jobs/:id
 * @access  Public
 */
export const getSingleJobOpening = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await getJobOpeningByIdService(id);
  return ApiResponse.success(res, 200, 'Job opening retrieved successfully', result);
});

/**
 * @desc    Update a job opening by ID (e.g. edit details or toggle Active/Closed status)
 * @route   PUT /api/jobs/:id, PATCH /api/jobs/:id
 * @access  Admin / Backend
 */
export const updateJobOpening = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await updateJobOpeningService(id, req.body);
  return ApiResponse.success(res, 200, 'Job opening updated successfully', result);
});

/**
 * @desc    Delete a job opening by ID
 * @route   DELETE /api/jobs/:id
 * @access  Admin / Backend
 */
export const deleteJobOpening = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await deleteJobOpeningService(id);
  return ApiResponse.success(res, 200, 'Job opening deleted successfully', result);
});

export default {
  createJobOpening,
  getActiveJobOpenings,
  getAllJobOpenings,
  getSingleJobOpening,
  updateJobOpening,
  deleteJobOpening,
};
