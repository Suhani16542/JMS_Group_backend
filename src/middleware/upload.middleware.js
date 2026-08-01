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

// Multer Middleware Instance with 5MB limit
export const uploadResumeMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export default uploadResumeMiddleware;
