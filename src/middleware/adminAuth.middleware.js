import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * Admin Authentication Middleware
 * Protects admin/management routes via Bearer JWT.
 */
export const adminAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      throw new ApiError(401, 'Unauthorized: Authorization token is required');
    }

    const parts = authHeader.trim().split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new ApiError(401, 'Unauthorized: Invalid authorization format. Format must be: Bearer <token>');
    }

    const token = parts[1];
    if (!token) {
      throw new ApiError(401, 'Unauthorized: Authorization token is required');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET is not configured in environment variables');
      throw new ApiError(500, 'Server configuration error: JWT_SECRET missing');
    }

    const decoded = jwt.verify(token, jwtSecret);

    // Attach verified admin payload to request object
    req.admin = {
      email: decoded.email,
      role: decoded.role || 'admin',
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Unauthorized: JSON Web Token has expired. Please log in again.'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Unauthorized: Invalid JSON Web Token.'));
    }
    if (error instanceof ApiError) {
      return next(error);
    }
    return next(new ApiError(401, 'Unauthorized: Authentication failed.'));
  }
};

export default adminAuthMiddleware;
