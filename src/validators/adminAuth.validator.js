import ApiError from '../utils/ApiError.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates admin login credentials payload
 */
export const validateAdminLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required.');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Validation Error', errors);
  }

  next();
};

export default {
  validateAdminLogin,
};
