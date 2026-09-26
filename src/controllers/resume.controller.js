import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import {
  uploadResumeService,
  getAllResumesService,
  getSingleResumeService,
  updateResumeStatusService,
  deleteResumeService,
  getResumeFileStreamService,
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
 * @desc    Download or view resume file by ID directly from backend
 * @route   GET /api/resumes/download/:id, GET /api/resumes/view/:id
 * @access  Public or Admin
 */
export const downloadResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const mode = req.query.mode || (req.path.includes('/view/') ? 'view' : 'download');

  const fileData = await getResumeFileStreamService(id, mode);

  const isViewPdf = mode === 'view' && fileData.isPdf;
  const disposition = isViewPdf ? 'inline' : 'attachment';

  // Set HTTP headers for high-fidelity document delivery
  res.setHeader('Content-Type', fileData.mimeType || 'application/octet-stream');
  res.setHeader(
    'Content-Disposition',
    `${disposition}; filename="${encodeURIComponent(fileData.originalFileName)}"`
  );
  res.setHeader('Content-Length', fileData.fileSize);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  return res.status(200).send(fileData.buffer);
});

export default {
  uploadResume,
  getAllResumes,
  getSingleResume,
  updateResumeStatus,
  deleteResume,
  downloadResume,
};

