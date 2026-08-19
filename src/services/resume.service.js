import path from 'path';
import Resume from '../models/Resume.js';
import { uploadToCloudinary, deleteFromCloudinary, getCloudinaryDownloadUrl } from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';
import { sendResumeNotificationEmail } from './email.service.js';

/**
 * Resolves standard canonical MIME type from file extension if needed.
 */
const getCanonicalMimeType = (originalName, mimetype) => {
  const ext = path.extname(originalName).toLowerCase();
  const mimeMap = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeMap[ext] || mimetype || 'application/octet-stream';
};

/**
 * Helper to attach working signed view & download URLs to resume documents.
 * Ensures existing and new MongoDB records always return accessible HTTPS URLs.
 */
const enrichResumeWithSignedUrls = (resumeDoc) => {
  if (!resumeDoc) return null;
  const obj = resumeDoc.toObject ? resumeDoc.toObject() : { ...resumeDoc };
  if (obj.cloudinaryPublicId) {
    const signedView = getCloudinaryDownloadUrl(obj.cloudinaryPublicId, false);
    const signedDownload = getCloudinaryDownloadUrl(obj.cloudinaryPublicId, true);
    obj.viewUrl = signedView || obj.resumeUrl;
    obj.downloadUrl = signedDownload || obj.resumeUrl;
    // Overwrite resumeUrl with the working signed view URL
    obj.resumeUrl = signedView || obj.resumeUrl;
  }
  return obj;
};

/**
 * Resume Service Layer (Cloudinary Storage)
 */

/**
 * Uploads file buffer to Cloudinary and saves metadata to MongoDB.
 *
 * @param {Object} resumeData - Text fields from request body
 * @param {Object} file - Multer memory storage file object
 */
export const uploadResumeService = async (resumeData, file) => {
  if (!file || !file.buffer) {
    throw new ApiError(400, 'Resume file is required (PDF, DOC, or DOCX up to 5MB).');
  }

  // Upload memory buffer directly to Cloudinary folder (jms-group/resumes)
  const cloudinaryResult = await uploadToCloudinary(file.buffer, file.originalname);

  const signedViewUrl = getCloudinaryDownloadUrl(cloudinaryResult.public_id, false);

  const fileMetadata = {
    resumeUrl: signedViewUrl || cloudinaryResult.secure_url,
    cloudinaryPublicId: cloudinaryResult.public_id,
    originalFileName: file.originalname,
    mimeType: getCanonicalMimeType(file.originalname, file.mimetype),
    fileSize: file.size,
  };

  const newResume = await Resume.create({
    ...resumeData,
    ...fileMetadata,
  });

  // Dispatch background email notification via Brevo SMTP (if configured)
  sendResumeNotificationEmail(newResume);

  return enrichResumeWithSignedUrls(newResume);
};

/**
 * Fetches all uploaded resume submissions.
 * @param {Object} queryParams - Query parameters
 */
export const getAllResumesService = async (queryParams = {}) => {
  const resumes = await Resume.find(queryParams).sort({ createdAt: -1 });
  return resumes.map(enrichResumeWithSignedUrls);
};

/**
 * Fetches a single resume submission by ID.
 * @param {string} id - Resume ID
 */
export const getSingleResumeService = async (id) => {
  const resume = await Resume.findById(id);
  if (!resume) {
    throw new ApiError(404, 'Resume submission not found');
  }
  return enrichResumeWithSignedUrls(resume);
};

/**
 * Updates status of a resume submission.
 * @param {string} id - Resume ID
 * @param {string} status - New status
 */
export const updateResumeStatusService = async (id, status) => {
  const updatedResume = await Resume.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!updatedResume) {
    throw new ApiError(404, 'Resume submission not found');
  }
  return enrichResumeWithSignedUrls(updatedResume);
};

/**
 * Deletes a resume submission by ID and removes file asset from Cloudinary.
 * @param {string} id - Resume ID
 */
export const deleteResumeService = async (id) => {
  const resume = await Resume.findById(id);
  if (!resume) {
    throw new ApiError(404, 'Resume submission not found');
  }

  // Delete file asset from Cloudinary
  if (resume.cloudinaryPublicId) {
    await deleteFromCloudinary(resume.cloudinaryPublicId);
  }

  const deletedResume = await Resume.findByIdAndDelete(id);
  return deletedResume;
};

/**
 * Gets Cloudinary download/view URL and metadata for a resume file.
 * @param {string} id - Resume ID
 * @param {string} mode - 'view' or 'download'
 */
export const downloadResumeService = async (id, mode = 'view') => {
  const resume = await Resume.findById(id);
  if (!resume || (!resume.resumeUrl && !resume.cloudinaryPublicId)) {
    throw new ApiError(404, 'Resume file not found');
  }

  const isDownload = mode === 'download';
  const downloadUrl =
    getCloudinaryDownloadUrl(resume.cloudinaryPublicId, isDownload) || resume.resumeUrl;
  return { resume, downloadUrl };
};

export default {
  uploadResumeService,
  getAllResumesService,
  getSingleResumeService,
  updateResumeStatusService,
  deleteResumeService,
  downloadResumeService,
};
