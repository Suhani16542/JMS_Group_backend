import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

/**
 * Helper to safely read and trim environment variables
 */
const getEnv = (key, defaultValue = '') => {
  const val = process.env[key];
  return val ? val.trim() : defaultValue;
};

/**
 * Helper to mask email address for safe logging
 */
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email || '[NOT SET]';
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user.slice(0, 1)}***@${domain}`;
  }
  return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
};

/**
 * Helper to mask sensitive keys/passwords for safe logging
 */
const maskSecret = (secret) => {
  if (!secret) return '[NOT SET]';
  if (secret.length <= 6) return '******';
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
};

/**
 * Creates and configures Nodemailer transporter for Brevo SMTP.
 * Only uses standard variables: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
 */
const createTransporter = () => {
  const host = getEnv('SMTP_HOST', 'smtp-relay.brevo.com');
  const port = parseInt(getEnv('SMTP_PORT', '587'), 10);
  const secureEnv = getEnv('SMTP_SECURE');
  const isSecure = secureEnv ? secureEnv === 'true' : port === 465;
  const user = getEnv('SMTP_USER', '');
  const pass = getEnv('SMTP_PASS', '');

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
  });
};

export const transporter = createTransporter();

/**
 * Verifies Brevo SMTP transporter connection status and prints diagnostic logs.
 */
export const verifySMTP = async () => {
  // Read and trim standard SMTP environment variables
  const host = getEnv('SMTP_HOST');
  const port = getEnv('SMTP_PORT');
  const secure = getEnv('SMTP_SECURE');
  const user = getEnv('SMTP_USER');
  const pass = getEnv('SMTP_PASS');
  const fromEmail = getEnv('FROM_EMAIL');
  const hrEmail = getEnv('HR_EMAIL');

  // Print all variable values (masking sensitive fields) before validation
  logger.info(`SMTP_HOST loaded: ${host || '[NOT SET]'}`);
  logger.info(`SMTP_PORT loaded: ${port || '[NOT SET]'}`);
  logger.info(`SMTP_SECURE loaded: ${secure || '[NOT SET]'}`);
  logger.info(`SMTP_USER loaded: ${maskEmail(user)}`);
  logger.info(`SMTP_PASS loaded: ${maskSecret(pass)}`);
  logger.info(`FROM_EMAIL loaded: ${fromEmail || '[NOT SET]'}`);
  logger.info(`HR_EMAIL loaded: ${hrEmail || '[NOT SET]'}`);

  // Track which required variables are missing or empty
  const missingVars = [];
  if (!host) missingVars.push('SMTP_HOST');
  if (!port) missingVars.push('SMTP_PORT');
  if (!user) missingVars.push('SMTP_USER');
  if (!pass) missingVars.push('SMTP_PASS');
  if (!fromEmail) missingVars.push('FROM_EMAIL');
  if (!hrEmail) missingVars.push('HR_EMAIL');

  if (missingVars.length > 0) {
    logger.warn(`[SMTP] Missing or empty environment variables: ${missingVars.join(', ')}`);
    logger.warn('[SMTP] Brevo SMTP credentials pending in .env.');
    return false;
  }

  try {
    // Re-create transporter to ensure latest process.env values are used
    const activeTransporter = createTransporter();
    await activeTransporter.verify();
    logger.success('✅ Brevo SMTP Connected Successfully');
    return true;
  } catch (error) {
    logger.warn(`[SMTP Warning] Brevo SMTP connection check failed: ${error.message}`);
    return false;
  }
};

export default transporter;

