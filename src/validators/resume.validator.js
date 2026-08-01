import ApiError from '../utils/ApiError.js';
import { STATUS_ENUM } from '../constants/status.constants.js';

/**
 * Validates request payload and uploaded file for resume submission.
 */
export const validateUploadResume = (req, res, next) => {
  const { fullName, email, phone, highestQualification, experience, preferredJobRole } = req.body;
  const errors = [];

  // Validate fullName
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.push('Full name is required and must be at least 2 characters long.');
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  // Validate phone
  const phoneDigits = phone ? String(phone).replace(/\D/g, '') : '';
  if (!phone || phoneDigits.length < 10) {
    errors.push('Phone number is required and must contain at least 10 digits.');
  }

  // Validate highestQualification
  if (!highestQualification || typeof highestQualification !== 'string' || highestQualification.trim().length === 0) {
    errors.push('Highest qualification is required.');
  }

  // Validate experience
  if (!experience || typeof experience !== 'string' || experience.trim().length === 0) {
    errors.push('Experience is required.');
  }

  // Validate preferredJobRole
  if (!preferredJobRole || typeof preferredJobRole !== 'string' || preferredJobRole.trim().length === 0) {
    errors.push('Preferred job role is required.');
  }

  // Validate uploaded file presence
  if (!req.file) {
    errors.push('Resume file is required (PDF, DOC, or DOCX up to 5MB).');
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Validation Error', errors);
  }

  next();
};

/**
 * Validates request payload for updating resume status.
 */
export const validateUpdateResumeStatus = (req, res, next) => {
  const { status } = req.body;

  if (!status || !STATUS_ENUM.includes(status)) {
    throw new ApiError(
      400,
      `Invalid status. Status must be one of: ${STATUS_ENUM.join(', ')}`
    );
  }

  next();
};

export default {
  validateUploadResume,
  validateUpdateResumeStatus,
};
