import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * Global Centralized Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error stack for debugging
  logger.error(`${err.name || 'Error'}: ${err.message}`);
  if (process.env.NODE_ENV === 'development' && err.stack) {
    console.error(err.stack);
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid field: ${err.path}`;
    error = new ApiError(400, message);
  }

  // Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    error = new ApiError(400, message);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map((val) => val.message);
    const message = `Validation Failed: ${validationErrors.join(', ')}`;
    error = new ApiError(400, message, validationErrors);
  }

  // JWT Invalid Token Error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid JSON Web Token. Please log in again.';
    error = new ApiError(401, message);
  }

  // JWT Expired Token Error
  if (err.name === 'TokenExpiredError') {
    const message = 'JSON Web Token has expired. Please log in again.';
    error = new ApiError(401, message);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errors = error.errors || null;

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export default errorHandler;
