import Resume from '../models/Resume.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';
import { sendResumeNotificationEmail } from './email.service.js';

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

  const fileMetadata = {
    resumeUrl: cloudinaryResult.secure_url,
    cloudinaryPublicId: cloudinaryResult.public_id,
    originalFileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
  };

  const newResume = await Resume.create({
    ...resumeData,
    ...fileMetadata,
  });

  // Dispatch background email notification via Brevo SMTP (if configured)
  sendResumeNotificationEmail(newResume);

  return newResume;
};

/**
 * Fetches all uploaded resume submissions.
 * @param {Object} queryParams - Query parameters
 */
export const getAllResumesService = async (queryParams = {}) => {
  const resumes = await Resume.find(queryParams).sort({ createdAt: -1 });
  return resumes;
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
  return resume;
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
  return updatedResume;
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
 * Gets Cloudinary download URL for a resume file.
 * @param {string} id - Resume ID
 */
export const downloadResumeService = async (id) => {
  const resume = await Resume.findById(id);
  if (!resume || !resume.resumeUrl) {
    throw new ApiError(404, 'Resume file not found');
  }
  return { resumeUrl: resume.resumeUrl };
};

export default {
  uploadResumeService,
  getAllResumesService,
  getSingleResumeService,
  updateResumeStatusService,
  deleteResumeService,
  downloadResumeService,
};
