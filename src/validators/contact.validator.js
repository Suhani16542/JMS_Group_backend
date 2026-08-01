import ApiError from '../utils/ApiError.js';
import { STATUS_ENUM } from '../constants/status.constants.js';

/**
 * Validates request payload for creating a contact submission.
 */
export const validateCreateContact = (req, res, next) => {
  const { fullName, email, phone, subject, message } = req.body;
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

  // Validate subject
  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    errors.push('Subject is required.');
  }

  // Validate message
  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    errors.push('Message is required and must be at least 10 characters long.');
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Validation Error', errors);
  }

  next();
};

/**
 * Validates request payload for updating contact status.
 */
export const validateUpdateContactStatus = (req, res, next) => {
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
  validateCreateContact,
  validateUpdateContactStatus,
};
