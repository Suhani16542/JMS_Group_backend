import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import {
  uploadResumeService,
  getAllResumesService,
  getSingleResumeService,
  updateResumeStatusService,
  deleteResumeService,
  downloadResumeService,
} from '../services/resume.service.js';

/**
 * @desc    Upload a new resume submission to Cloudinary
 * @route   POST /api/resume
 * @access  Public
 */
export const uploadResume = asyncHandler(async (req, res) => {
  const result = await uploadResumeService(req.body, req.file);
  return ApiResponse.success(res, 201, 'Resume uploaded successfully to Cloudinary', result);
});

/**
 * @desc    Get all resume submissions
 * @route   GET /api/resume
 * @access  Private/Admin
 */
export const getAllResumes = asyncHandler(async (req, res) => {
  const result = await getAllResumesService(req.query);
  return ApiResponse.success(res, 200, 'Resumes retrieved successfully', result);
});

/**
 * @desc    Get a single resume submission by ID
 * @route   GET /api/resume/:id
 * @access  Private/Admin
 */
export const getSingleResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await getSingleResumeService(id);
  return ApiResponse.success(res, 200, 'Resume retrieved successfully', result);
});

/**
 * @desc    Update status of a resume submission
 * @route   PATCH /api/resume/:id
 * @access  Private/Admin
 */
export const updateResumeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await updateResumeStatusService(id, status);
  return ApiResponse.success(res, 200, 'Resume status updated successfully', result);
});

/**
 * @desc    Delete a resume submission by ID (and remove from Cloudinary)
 * @route   DELETE /api/resume/:id
 * @access  Private/Admin
 */
export const deleteResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await deleteResumeService(id);
  return ApiResponse.success(res, 200, 'Resume deleted successfully from Cloudinary & database', result);
});

/**
 * @desc    Download/Redirect to Cloudinary secure_url for a resume file
 * @route   GET /api/resume/download/:id
 * @access  Private/Admin
 */
export const downloadResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resumeUrl } = await downloadResumeService(id);

  // Redirect client directly to the Cloudinary asset URL
  return res.redirect(resumeUrl);
});

export default {
  uploadResume,
  getAllResumes,
  getSingleResume,
  updateResumeStatus,
  deleteResume,
  downloadResume,
};
