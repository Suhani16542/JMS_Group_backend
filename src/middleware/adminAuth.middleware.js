import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * Admin Authentication Middleware
 * Protects admin/management routes via Bearer JWT, query token, or cookie.
 */
export const adminAuthMiddleware = (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === 'string') {
      const parts = authHeader.trim().split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token && req.query?.token) {
      token = req.query.token;
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token && req.cookies?.adminToken) {
      token = req.cookies.adminToken;
    }

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

/**
 * Optional Admin Auth Middleware for document viewing/downloading.
 * Authenticates if a token is present, but permits access to public delivery.
 */
export const optionalAdminAuthMiddleware = (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === 'string') {
      const parts = authHeader.trim().split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }
    if (!token && req.query?.token) token = req.query.token;
    if (!token && req.cookies?.token) token = req.cookies.token;
    if (!token && req.cookies?.adminToken) token = req.cookies.adminToken;

    if (token && process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = { email: decoded.email, role: decoded.role || 'admin' };
    }
  } catch (_) {
    // Non-blocking for optional auth
  }
  next();
};

export default adminAuthMiddleware;

