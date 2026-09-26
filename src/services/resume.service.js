import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import Resume from '../models/Resume.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryDeliveryUrl,
  fetchCloudinaryAsset,
} from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';
import { sendResumeNotificationEmail } from './email.service.js';
import logger from '../utils/logger.js';

/**
 * Resolves standard canonical MIME type from file extension.
 */
const getCanonicalMimeType = (originalName, mimetype) => {
  const ext = path.extname(originalName || '').toLowerCase();
  const mimeMap = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  return mimeMap[ext] || mimetype || 'application/octet-stream';
};

/**
 * Helper to enrich resume objects with working view & download URLs.
 * Ensures consistent, high-compatibility endpoint URLs for the frontend.
 */
export const enrichResumeWithSignedUrls = (resumeDoc) => {
  if (!resumeDoc) return null;
  const obj = resumeDoc.toObject ? resumeDoc.toObject() : { ...resumeDoc };
  const idStr = String(obj._id || resumeDoc._id || '');

  const ext = path.extname(obj.originalFileName || '').toLowerCase();
  const isPdf = ext === '.pdf' || obj.mimeType === 'application/pdf';

  // Point viewUrl and downloadUrl to reliable backend delivery endpoints
  obj._id = idStr;
  obj.id = idStr;
  obj.viewUrl = `/api/resumes/download/${idStr}?mode=view`;
  obj.downloadUrl = `/api/resumes/download/${idStr}?mode=download`;

  // Ensure stored resumeUrl is clean (fallback to delivery URL if empty)
  if (!obj.resumeUrl && obj.cloudinaryPublicId) {
    obj.resumeUrl = getCloudinaryDeliveryUrl(obj.cloudinaryPublicId, isPdf ? 'image' : 'raw');
  }

  return obj;
};

/**
 * Uploads file buffer to Cloudinary and saves metadata to MongoDB.
 * Stores only permanent, stable Cloudinary delivery URLs in the database.
 *
 * @param {Object} resumeData - Text fields from request body
 * @param {Object} file - Multer memory storage file object
 */
export const uploadResumeService = async (resumeData, file) => {
  if (!file || !file.buffer) {
    throw new ApiError(400, 'Resume file is required (PDF, DOC, or DOCX up to 5MB).');
  }

  // Upload memory buffer directly to Cloudinary with automatic resource_type
  const cloudinaryResult = await uploadToCloudinary(file.buffer, file.originalname);

  const fileMetadata = {
    resumeUrl: cloudinaryResult.secure_url,
    cloudinaryPublicId: cloudinaryResult.public_id,
    originalFileName: file.originalname,
    mimeType: getCanonicalMimeType(file.originalname, file.mimetype),
    fileSize: file.size,
  };

  const newResume = await Resume.create({
    ...resumeData,
    ...fileMetadata,
  });

  // Dispatch background HR email notification via Brevo
  sendResumeNotificationEmail(newResume).catch((hrEmailErr) => {
    logger.error(`[HR Resume Email Notification Error] ${hrEmailErr.message}`);
  });

  return enrichResumeWithSignedUrls(newResume);
};

/**
 * Fetches all uploaded resume submissions with search, filtering, and pagination.
 * @param {Object} queryParams - Query parameters (search, status, page, limit)
 */
export const getAllResumesService = async (queryParams = {}) => {
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
      { preferredJobRole: searchRegex },
      { highestQualification: searchRegex },
      { referenceName: searchRegex },
      { referenceNumber: searchRegex },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [total, resumes] = await Promise.all([
    Resume.countDocuments(filter),
    Resume.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  return {
    resumes: resumes.map(enrichResumeWithSignedUrls),
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
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
    await deleteFromCloudinary(resume.cloudinaryPublicId, 'auto');
  }

  const deletedResume = await Resume.findByIdAndDelete(id);
  return deletedResume;
};

/**
 * Retrieves the resume file binary buffer and metadata for direct backend delivery.
 * Supports Cloudinary storage, local storage fallback, and legacy files.
 *
 * @param {string} id - Resume ID
 * @param {string} mode - 'view' or 'download'
 * @returns {Promise<{ buffer: Buffer, mimeType: string, originalFileName: string, fileSize: number, isPdf: boolean }>}
 */
export const getResumeFileStreamService = async (id, mode = 'view') => {
  if (!id || id === '[object Object]' || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid Resume ID: ${id}`);
  }
  const resume = await Resume.findById(id);
  if (!resume) {
    throw new ApiError(404, 'Resume record not found');
  }

  const originalFileName = resume.originalFileName || 'resume.pdf';
  const ext = path.extname(originalFileName).toLowerCase();
  const isPdf = ext === '.pdf' || resume.mimeType === 'application/pdf';
  const canonicalMime = getCanonicalMimeType(originalFileName, resume.mimeType);

  // 1. Cloudinary Asset Retrieval
  if (resume.cloudinaryPublicId) {
    const asset = await fetchCloudinaryAsset(
      resume.cloudinaryPublicId,
      'auto'
    );

    return {
      buffer: asset.buffer,
      mimeType: isPdf ? 'application/pdf' : canonicalMime,
      originalFileName,
      fileSize: asset.contentLength,
      isPdf,
    };
  }


  // 2. Legacy Local Storage Fallback (/uploads/resumes/...)
  if (resume.resumeUrl && (resume.resumeUrl.startsWith('/uploads') || resume.resumeUrl.includes('/uploads/'))) {
    const localRelPath = resume.resumeUrl.replace(/^[a-zA-Z]+:\/\/[^/]+/, '');
    const cleanRelPath = localRelPath.replace(/^\//, '');
    const localFullPath = path.resolve(process.cwd(), cleanRelPath);

    if (fs.existsSync(localFullPath)) {
      const buffer = fs.readFileSync(localFullPath);
      return {
        buffer,
        mimeType: canonicalMime,
        originalFileName,
        fileSize: buffer.length,
        isPdf,
      };
    }

    throw new ApiError(
      404,
      'This resume was stored in temporary local storage during an earlier deployment and is no longer recoverable.'
    );
  }

  // 3. Fallback: Fetch external URL if stored
  if (resume.resumeUrl && resume.resumeUrl.startsWith('http')) {
    try {
      const resp = await fetch(resume.resumeUrl);
      if (resp.ok) {
        const arrayBuf = await resp.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        return {
          buffer,
          mimeType: isPdf ? 'application/pdf' : canonicalMime,
          originalFileName,
          fileSize: buffer.length,
          isPdf,
        };
      }
    } catch (e) {
      logger.warn(`Failed to fetch legacy resumeUrl directly: ${e.message}`);
    }
  }

  throw new ApiError(404, 'Resume file binary could not be located.');
};

/**
 * Backward compatible helper for download URL retrieval.
 */
export const downloadResumeService = async (id, mode = 'view') => {
  const resume = await Resume.findById(id);
  if (!resume || (!resume.resumeUrl && !resume.cloudinaryPublicId)) {
    throw new ApiError(404, 'Resume file not found');
  }

  const ext = path.extname(resume.originalFileName || '').toLowerCase();
  const isPdf = ext === '.pdf' || resume.mimeType === 'application/pdf';
  const downloadUrl = `/api/resumes/download/${id}?mode=${mode}`;

  return { resume, downloadUrl, isPdf };
};

export default {
  uploadResumeService,
  getAllResumesService,
  getSingleResumeService,
  updateResumeStatusService,
  deleteResumeService,
  getResumeFileStreamService,
  downloadResumeService,
};

