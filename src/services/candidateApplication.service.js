import path from 'path';
import CandidateApplication from '../models/CandidateApplication.js';
import Resume from '../models/Resume.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryDownloadUrl,
} from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';
import { sendCandidateApplicationEmail } from './email.service.js';
import logger from '../utils/logger.js';

/**
 * Resolves standard canonical MIME type from file extension.
 */
const getCanonicalMimeType = (originalName, mimetype) => {
  const ext = path.extname(originalName).toLowerCase();
  const mimeMap = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return mimeMap[ext] || mimetype || 'application/octet-stream';
};

/**
 * Determines whether the file is an image based on extension or mimetype.
 */
const isImageFile = (originalName, mimetype) => {
  const ext = path.extname(originalName).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
  return imageExts.includes(ext) || (mimetype && mimetype.startsWith('image/'));
};

/**
 * Helper to enrich application file attachments with signed download and view URLs.
 */
const enrichApplicationWithSignedUrls = (appDoc) => {
  if (!appDoc) return null;
  const obj = appDoc.toObject ? appDoc.toObject() : { ...appDoc };

  if (obj.photo && obj.photo.cloudinaryPublicId) {
    const isImg = isImageFile(obj.photo.originalFileName, obj.photo.mimeType);
    if (!isImg) {
      const signedUrl = getCloudinaryDownloadUrl(obj.photo.cloudinaryPublicId, false);
      if (signedUrl) obj.photo.url = signedUrl;
    }
  }

  if (Array.isArray(obj.documents)) {
    obj.documents = obj.documents.map((doc) => {
      const isImg = isImageFile(doc.originalFileName, doc.mimeType);
      if (!isImg && doc.cloudinaryPublicId) {
        const signedUrl = getCloudinaryDownloadUrl(doc.cloudinaryPublicId, false);
        const signedDownload = getCloudinaryDownloadUrl(doc.cloudinaryPublicId, true);
        return {
          ...doc,
          url: signedUrl || doc.url,
          downloadUrl: signedDownload || doc.url,
        };
      }
      return doc;
    });
  }

  return obj;
};

/**
 * Creates and uploads a new candidate application.
 *
 * @param {Object} rawBody - Form text fields
 * @param {Object} files - Multer req.files object { photo: [file], signature: [file], documents: [files] }
 */
export const submitCandidateApplicationService = async (rawBody, files = {}) => {
  // 1. Process candidate photo if optionally provided (photo is no longer required)
  let photoAttachment = null;
  const photoFile = files.photo?.[0];
  if (photoFile && photoFile.buffer) {
    try {
      const photoUpload = await uploadToCloudinary(
        photoFile.buffer,
        photoFile.originalname,
        'jms-group/applications/photos',
        'image'
      );

      photoAttachment = {
        url: photoUpload.secure_url,
        cloudinaryPublicId: photoUpload.public_id,
        originalFileName: photoFile.originalname,
        mimeType: getCanonicalMimeType(photoFile.originalname, photoFile.mimetype),
        fileSize: photoFile.size,
      };
    } catch (photoErr) {
      logger.warn(`[Photo Upload Optional] Could not upload photo: ${photoErr.message}`);
    }
  }

  // 2. Process digital signature (file upload, base64, or text string)
  let signatureUrl = rawBody.signatureUrl || rawBody.signature || '';
  let signatureValue = rawBody.signature || rawBody.signatureUrl || rawBody.candidateSignatureName || '';
  const signatureFile = files.signature?.[0];

  if (signatureFile && signatureFile.buffer) {
    try {
      const sigUpload = await uploadToCloudinary(
        signatureFile.buffer,
        signatureFile.originalname,
        'jms-group/applications/signatures',
        'image'
      );
      signatureUrl = sigUpload.secure_url;
      signatureValue = sigUpload.secure_url;
    } catch (sigErr) {
      logger.warn(`[Signature Upload] Could not upload signature file to Cloudinary: ${sigErr.message}`);
    }
  }

  // 3. Upload supporting documents to Cloudinary (if any)
  const docFiles = files.documents || [];
  const uploadedDocuments = [];

  for (const docFile of docFiles) {
    const isDocImg = isImageFile(docFile.originalname, docFile.mimetype);
    const resourceType = isDocImg ? 'image' : 'raw';

    const docUpload = await uploadToCloudinary(
      docFile.buffer,
      docFile.originalname,
      'jms-group/applications/documents',
      resourceType
    );

    const docSignedUrl = !isDocImg
      ? getCloudinaryDownloadUrl(docUpload.public_id, false)
      : null;

    uploadedDocuments.push({
      url: docSignedUrl || docUpload.secure_url,
      cloudinaryPublicId: docUpload.public_id,
      originalFileName: docFile.originalname,
      mimeType: getCanonicalMimeType(docFile.originalname, docFile.mimetype),
      fileSize: docFile.size,
    });
  }

  // 4. Resume + Application Linking
  let linkedResumeId = null;
  let linkedResumeUrl = rawBody.resumeUrl || '';

  if (rawBody.resumeId) {
    try {
      const existingResume = await Resume.findById(rawBody.resumeId);
      if (existingResume) {
        linkedResumeId = existingResume._id;
        linkedResumeUrl = existingResume.resumeUrl || linkedResumeUrl;
      }
    } catch (err) {
      logger.warn(`[Resume Link Warning] Invalid resumeId passed: ${rawBody.resumeId}`);
    }
  }

  // If resumeId was not passed explicitly, attempt relationship lookup by email or phone
  if (!linkedResumeId && (rawBody.email || rawBody.mobileNumber)) {
    try {
      const searchCriteria = [];
      if (rawBody.email) searchCriteria.push({ email: rawBody.email.trim().toLowerCase() });
      if (rawBody.mobileNumber) searchCriteria.push({ phone: rawBody.mobileNumber.trim() });

      const matchedResume = await Resume.findOne({ $or: searchCriteria }).sort({ createdAt: -1 });
      if (matchedResume) {
        linkedResumeId = matchedResume._id;
        if (!linkedResumeUrl) {
          linkedResumeUrl = matchedResume.resumeUrl;
        }
        logger.info(`[Resume Link] Automatically linked application to Resume ID: ${matchedResume._id}`);
      }
    } catch (matchErr) {
      logger.warn(`[Resume Link Match Error] ${matchErr.message}`);
    }
  }

  // 5. Prepare schema data
  const termsAccepted = rawBody.termsAccepted === true || rawBody.termsAccepted === 'true';

  const applicationPayload = {
    fullName: rawBody.fullName,
    fatherOrHusbandName: rawBody.fatherOrHusbandName,
    dob: new Date(rawBody.dob),
    qualification: rawBody.qualification,
    specialization: rawBody.specialization || '',
    permanentAddress: rawBody.permanentAddress,
    email: rawBody.email,
    mobileNumber: rawBody.mobileNumber,
    alternateNumber: rawBody.alternateNumber || '',
    fatherNumber: rawBody.fatherNumber || '',
    jobAppliedForA: rawBody.jobAppliedForA,
    jobAppliedForB: rawBody.jobAppliedForB || '',
    currentLocation: rawBody.currentLocation,
    locationPreferenceA: rawBody.locationPreferenceA,
    locationPreferenceB: rawBody.locationPreferenceB || '',
    currentCtc: rawBody.currentCtc || '',
    expectedSalary: rawBody.expectedSalary || '',
    noticePeriod: rawBody.noticePeriod || '',
    currentCompany: rawBody.currentCompany || rawBody.currentBankOrNbfc || '',
    currentBankOrNbfc: rawBody.currentBankOrNbfc || '',
    fatherOrHusbandOccupation: rawBody.fatherOrHusbandOccupation || '',
    motherOccupation: rawBody.motherOccupation || '',
    siblings: rawBody.siblings || '',
    siblingsOccupation: rawBody.siblingsOccupation || '',
    referenceNameAndNo: rawBody.referenceNameAndNo || '',
    resumeId: linkedResumeId,
    resumeUrl: linkedResumeUrl,
    photo: photoAttachment,
    documents: uploadedDocuments,
    signature: signatureValue,
    signatureUrl,
    candidateSignatureName: rawBody.candidateSignatureName || rawBody.fullName,
    termsAccepted,
  };

  // 6. Save to Database (Application is safely persisted first)
  const newApplication = await CandidateApplication.create(applicationPayload);
  logger.success(`[Candidate Application] Successfully saved application ID: ${newApplication.applicationId || newApplication._id} for ${newApplication.fullName}`);

  // Populate resume if linked for richer notification payload
  let populatedApp = newApplication;
  if (newApplication.resumeId) {
    try {
      populatedApp = await CandidateApplication.findById(newApplication._id).populate('resumeId');
    } catch (e) {
      populatedApp = newApplication;
    }
  }

  // 7. Non-blocking Email Notification via Brevo
  sendCandidateApplicationEmail(populatedApp).catch((emailErr) => {
    logger.error(`[Email Notification Async Error] ${emailErr.message}`);
  });

  return enrichApplicationWithSignedUrls(newApplication);
};

/**
 * Fetches all candidate application submissions with search, filtering, and pagination.
 * @param {Object} queryParams - Query parameters (search, status, jobRole, qualification, location, page, limit)
 */
export const getAllCandidateApplicationsService = async (queryParams = {}) => {
  const { search, status, jobRole, qualification, location, page = 1, limit = 20 } = queryParams;

  const filter = {};

  // Status filter (case-insensitive or exact match)
  if (status && typeof status === 'string' && status.trim()) {
    filter.status = { $regex: new RegExp(`^${status.trim()}$`, 'i') };
  }

  // Job role filter
  if (jobRole && typeof jobRole === 'string' && jobRole.trim()) {
    const roleRegex = new RegExp(jobRole.trim(), 'i');
    filter.$or = [{ jobAppliedForA: roleRegex }, { jobAppliedForB: roleRegex }];
  }

  // Qualification filter
  if (qualification && typeof qualification === 'string' && qualification.trim()) {
    const qualRegex = new RegExp(qualification.trim(), 'i');
    filter.$or = [{ qualification: qualRegex }, { specialization: qualRegex }];
  }

  // Location filter
  if (location && typeof location === 'string' && location.trim()) {
    const locRegex = new RegExp(location.trim(), 'i');
    filter.$or = [
      { currentLocation: locRegex },
      { locationPreferenceA: locRegex },
      { locationPreferenceB: locRegex },
    ];
  }

  // Search filter across candidate name, email, phone, job role, and applicationId
  if (search && typeof search === 'string' && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    const searchConditions = [
      { fullName: searchRegex },
      { email: searchRegex },
      { mobileNumber: searchRegex },
      { alternateNumber: searchRegex },
      { jobAppliedForA: searchRegex },
      { jobAppliedForB: searchRegex },
      { applicationId: searchRegex },
    ];

    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
      delete filter.$or;
    } else {
      filter.$or = searchConditions;
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [total, applications] = await Promise.all([
    CandidateApplication.countDocuments(filter),
    CandidateApplication.find(filter)
      .populate('resumeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  return {
    applications: applications.map(enrichApplicationWithSignedUrls),
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
};

/**
 * Fetches a single candidate application submission by ID with populated resume and signed asset URLs.
 * @param {string} id - Application ID
 */
export const getSingleCandidateApplicationService = async (id) => {
  const application = await CandidateApplication.findById(id).populate('resumeId');
  if (!application) {
    throw new ApiError(404, 'Candidate application not found');
  }
  return enrichApplicationWithSignedUrls(application);
};

/**
 * Updates status of a candidate application.
 * @param {string} id - Application ID
 * @param {string} status - New status
 */
export const updateCandidateApplicationStatusService = async (id, status) => {
  const updatedApp = await CandidateApplication.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!updatedApp) {
    throw new ApiError(404, 'Candidate application not found');
  }
  return enrichApplicationWithSignedUrls(updatedApp);
};

/**
 * Deletes a candidate application and its uploaded Cloudinary assets.
 * @param {string} id - Application ID
 */
export const deleteCandidateApplicationService = async (id) => {
  const application = await CandidateApplication.findById(id);
  if (!application) {
    throw new ApiError(404, 'Candidate application not found');
  }

  // Delete photo from Cloudinary
  if (application.photo?.cloudinaryPublicId) {
    await deleteFromCloudinary(application.photo.cloudinaryPublicId, 'image').catch((err) =>
      logger.warn(`Photo deletion error: ${err.message}`)
    );
  }

  // Delete documents from Cloudinary
  if (Array.isArray(application.documents)) {
    for (const doc of application.documents) {
      if (doc.cloudinaryPublicId) {
        const isImg = isImageFile(doc.originalFileName, doc.mimeType);
        await deleteFromCloudinary(doc.cloudinaryPublicId, isImg ? 'image' : 'raw').catch((err) =>
          logger.warn(`Document deletion error: ${err.message}`)
        );
      }
    }
  }

  const deletedApp = await CandidateApplication.findByIdAndDelete(id);
  return deletedApp;
};

export default {
  submitCandidateApplicationService,
  getAllCandidateApplicationsService,
  getSingleCandidateApplicationService,
  updateCandidateApplicationStatusService,
  deleteCandidateApplicationService,
};
