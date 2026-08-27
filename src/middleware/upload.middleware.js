import multer from 'multer';
import path from 'path';
import ApiError from '../utils/ApiError.js';

// Configure Multer to use Memory Storage (RAM buffer)
const storage = multer.memoryStorage();

// File Filter Configuration (PDF, DOC, DOCX)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        'Invalid file type. Only PDF, DOC, and DOCX files are allowed.'
      ),
      false
    );
  }
};

// Multer Middleware Instance for Resume with 5MB limit
export const uploadResumeMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Candidate Application File Filter (Photo: JPG/JPEG/PNG; Documents: PDF/DOC/DOCX/JPG/PNG)
const candidateApplicationFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'photo') {
    const allowedPhotoMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const allowedPhotoExts = ['.jpg', '.jpeg', '.png', '.webp'];

    if (allowedPhotoMimes.includes(file.mimetype) || allowedPhotoExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid photo format. Only JPG, JPEG, and PNG images are allowed for candidate photo.'), false);
    }
  } else if (file.fieldname === 'signature') {
    const allowedSigMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml'];
    const allowedSigExts = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];

    if (allowedSigMimes.includes(file.mimetype) || allowedSigExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid signature image format. Only PNG, JPG, JPEG, or SVG are allowed for signature.'), false);
    }
  } else if (file.fieldname === 'documents') {
    const allowedDocMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];
    const allowedDocExts = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

    if (allowedDocMimes.includes(file.mimetype) || allowedDocExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, `Invalid document format for "${file.originalname}". Only PDF, DOC, DOCX, JPG, and PNG are allowed.`), false);
    }
  } else {
    cb(new ApiError(400, `Unexpected file field: ${file.fieldname}`), false);
  }
};

// Candidate Application Multi-field Multer Instance
export const uploadCandidateApplicationMiddleware = multer({
  storage,
  fileFilter: candidateApplicationFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
}).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'documents', maxCount: 10 },
]);

export default uploadResumeMiddleware;

