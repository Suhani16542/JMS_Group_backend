import path from 'path';
import CandidateApplication from '../models/CandidateApplication.js';
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
  };
  return mimeMap[ext] || mimetype || 'application/octet-stream';
};

/**
 * Determines whether the file is an image based on extension or mimetype.
 */
const isImageFile = (originalName, mimetype) => {
  const ext = path.extname(originalName).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
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
 * @param {Object} files - Multer req.files object { photo: [file], documents: [files] }
 */
export const submitCandidateApplicationService = async (rawBody, files = {}) => {
  const photoFile = files.photo?.[0];
  if (!photoFile || !photoFile.buffer) {
    throw new ApiError(400, 'Candidate photo is mandatory (JPG, JPEG, PNG).');
  }

  // 1. Upload candidate photo to Cloudinary
  const photoUpload = await uploadToCloudinary(
    photoFile.buffer,
    photoFile.originalname,
    'jms-group/applications/photos',
    'image'
  );

  const photoAttachment = {
    url: photoUpload.secure_url,
    cloudinaryPublicId: photoUpload.public_id,
    originalFileName: photoFile.originalname,
    mimeType: getCanonicalMimeType(photoFile.originalname, photoFile.mimetype),
    fileSize: photoFile.size,
  };

  // 2. Upload supporting documents to Cloudinary (if any)
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

  // 3. Prepare schema data
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
    currentBankOrNbfc: rawBody.currentBankOrNbfc || '',
    currentVertical: rawBody.currentVertical || '',
    fatherOrHusbandOccupation: rawBody.fatherOrHusbandOccupation || '',
    motherOccupation: rawBody.motherOccupation || '',
    siblings: rawBody.siblings || '',
    siblingsOccupation: rawBody.siblingsOccupation || '',
    referenceNameAndNo: rawBody.referenceNameAndNo || '',
    photo: photoAttachment,
    documents: uploadedDocuments,
    candidateSignatureName: rawBody.candidateSignatureName || rawBody.fullName,
    termsAccepted,
  };

  // 4. Save to Database
  const newApplication = await CandidateApplication.create(applicationPayload);
  logger.success(`[Candidate Application] Saved application ID: ${newApplication._id} for ${newApplication.fullName}`);

  // 5. Send notification email via Brevo REST API
  sendCandidateApplicationEmail(newApplication);

  return enrichApplicationWithSignedUrls(newApplication);
};

/**
 * Fetches all candidate application submissions.
 * @param {Object} queryParams - Query parameters
 */
export const getAllCandidateApplicationsService = async (queryParams = {}) => {
  const applications = await CandidateApplication.find(queryParams).sort({ createdAt: -1 });
  return applications.map(enrichApplicationWithSignedUrls);
};

/**
 * Fetches a single candidate application submission by ID.
 * @param {string} id - Application ID
 */
export const getSingleCandidateApplicationService = async (id) => {
  const application = await CandidateApplication.findById(id);
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
