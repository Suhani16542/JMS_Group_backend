import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Sanitizes MongoDB connection string for safe console logging (masks user password).
 * @param {string} uri - MongoDB URI
 * @returns {string} Sanitized URI
 */
export const sanitizeMongoURI = (uri) => {
  if (!uri) return '';
  return uri.replace(/\/\/(.*?):(.*?)@/, (match, user, pass) => {
    const maskedPass = '*'.repeat(Math.min(pass.length, 8));
    return `//${user}:${maskedPass}@`;
  });
};

// Register Mongoose connection event listeners
mongoose.connection.on('connected', () => {
  logger.success('[Database] Mongoose event: Connected to MongoDB cluster.');
});

mongoose.connection.on('error', (err) => {
  logger.error(`[Database Error] Mongoose event error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('[Database Warning] Mongoose event: Disconnected from MongoDB cluster.');
});

/**
 * Connects to MongoDB database using Mongoose.
 * Reads connection string from process.env.MONGODB_URI.
 * Throws error if connection fails to prevent server from accepting requests in a broken state.
 */
export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : '';

  if (!mongoURI) {
    const errorMsg = '[Database Error] MONGODB_URI is missing or empty in environment configuration (.env).';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Common placeholder patterns check
  const placeholderPatterns = [
    'YOUR_USER',
    'YOUR_PASSWORD',
    '<db_username>',
    '<db_password>',
    '<username>',
    '<password>',
    'YOUR_MONGODB_URI',
  ];

  const foundPlaceholder = placeholderPatterns.find((pattern) => mongoURI.includes(pattern));

  if (foundPlaceholder) {
    const errorMsg = `[Database Error] MONGODB_URI contains placeholder '${foundPlaceholder}' (${sanitizeMongoURI(mongoURI)}). Please configure valid credentials in .env.`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  const sanitizedURI = sanitizeMongoURI(mongoURI);
  logger.info(`[Database] Connecting to MongoDB: ${sanitizedURI}`);

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
    });
    logger.success(`[Database] MongoDB Connected Successfully: ${conn.connection.host} / Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error(`[Database Error] Failed to connect to MongoDB (${sanitizedURI}): ${error.message}`);
    throw error; // Rethrow to ensure server initialization aborts on connection failure
  }
};

export default connectDB;
