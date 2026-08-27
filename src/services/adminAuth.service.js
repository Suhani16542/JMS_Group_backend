import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * Authenticates admin credentials and returns signed JWT token.
 * @param {Object} credentials - { email, password }
 */
export const adminLoginService = async ({ email, password }) => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';

  if (!adminEmail || !adminPassword || !jwtSecret) {
    logger.error('[Admin Auth] Admin credentials or JWT_SECRET not configured in .env');
    throw new ApiError(500, 'Server configuration error: Admin authentication unconfigured');
  }

  const inputEmail = email?.trim().toLowerCase();
  const targetEmail = adminEmail.toLowerCase();
  const inputPassword = password?.trim();

  // Validate credentials
  if (inputEmail !== targetEmail || inputPassword !== adminPassword) {
    logger.warn(`[Admin Auth] Failed login attempt for email: "${email}"`);
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      email: adminEmail,
      role: 'admin',
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );

  logger.success(`[Admin Auth] Admin logged in successfully: ${adminEmail}`);

  return {
    token,
    admin: {
      email: adminEmail,
      role: 'admin',
    },
  };
};

export default {
  adminLoginService,
};
