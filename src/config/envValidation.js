import logger from '../utils/logger.js';

/**
 * Validates environment variables from process.env.
 * Logs warnings for unconfigured credentials without throwing errors during setup.
 */
export const validateEnv = () => {
  const requiredEnvVars = [
    'PORT',
    'MONGODB_URI',
    'CLIENT_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'FROM_EMAIL',
    'HR_EMAIL',
    'JWT_SECRET',
  ];

  const missingVars = [];

  requiredEnvVars.forEach((varName) => {
    const val = process.env[varName];
    if (!val || val.trim() === '') {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    logger.warn(
      `Pending environment configuration for: ${missingVars.join(', ')}`
    );
    logger.info('Paste real credentials into .env before establishing live connections.');
  } else {
    logger.success('All environment variables loaded successfully.');
  }
};

export default validateEnv;
