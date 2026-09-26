import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import {
  submitCandidateApplicationService,
  getAllCandidateApplicationsService,
  getSingleCandidateApplicationService,
  updateCandidateApplicationStatusService,
  deleteCandidateApplicationService,
  getCandidateDocumentStreamService,
} from '../services/candidateApplication.service.js';

/**
 * @desc    Submit a new candidate application with photo and supporting documents
 * @route   POST /api/applications
 * @access  Public
 */
export const submitCandidateApplication = asyncHandler(async (req, res) => {
  const result = await submitCandidateApplicationService(req.body, req.files);
  return ApiResponse.success(res, 201, 'Candidate application submitted successfully', result);
});

/**
 * @desc    Get all candidate applications
 * @route   GET /api/applications
 * @access  Private/Admin
 */
export const getAllCandidateApplications = asyncHandler(async (req, res) => {
  const result = await getAllCandidateApplicationsService(req.query);
  return ApiResponse.success(res, 200, 'Candidate applications retrieved successfully', result);
});

/**
 * @desc    Get a single candidate application by ID
 * @route   GET /api/applications/:id
 * @access  Private/Admin
 */
export const getSingleCandidateApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await getSingleCandidateApplicationService(id);
  return ApiResponse.success(res, 200, 'Candidate application retrieved successfully', result);
});

/**
 * @desc    Update status of a candidate application
 * @route   PATCH /api/applications/:id
 * @access  Private/Admin
 */
export const updateCandidateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await updateCandidateApplicationStatusService(id, status);
  return ApiResponse.success(res, 200, 'Candidate application status updated successfully', result);
});

/**
 * @desc    Delete a candidate application and remove uploaded files from Cloudinary
 * @route   DELETE /api/applications/:id
 * @access  Private/Admin
 */
export const deleteCandidateApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await deleteCandidateApplicationService(id);
  return ApiResponse.success(res, 200, 'Candidate application and files deleted successfully', result);
});

/**
 * @desc    Download or view candidate application supporting document by ID and index
 * @route   GET /api/candidateapplications/document/:id/:index
 * @access  Public or Admin
 */
export const downloadCandidateDocument = asyncHandler(async (req, res) => {
  const { id, index } = req.params;
  const mode = req.query.mode || 'view';

  const fileData = await getCandidateDocumentStreamService(id, index, mode);

  const isViewPdf = mode === 'view' && fileData.isPdf;
  const disposition = isViewPdf ? 'inline' : 'attachment';

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
  submitCandidateApplication,
  getAllCandidateApplications,
  getSingleCandidateApplication,
  updateCandidateApplicationStatus,
  deleteCandidateApplication,
  downloadCandidateDocument,
};

