import logger from '../utils/logger.js';

/**
 * Helper to safely read and trim environment variables
 */
const getEnv = (key, defaultValue = '') => {
  const val = process.env[key];
  return val ? val.trim() : defaultValue;
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
 * Sends transactional email via Brevo REST API v3 over HTTPS.
 * Eliminates port 587/465 SMTP connection timeouts on cloud hosts like Render.
 */
export const sendBrevoEmail = async ({ sender, replyTo, to, subject, htmlContent }) => {
  const apiKey = getEnv('BREVO_API_KEY');
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured in process.env.');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender,
      replyTo,
      to,
      subject,
      htmlContent,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.message || data.code || `HTTP Status ${response.status}`;
    throw new Error(`Brevo API Response Error (${response.status}): ${errorMsg}`);
  }

  return data;
};

/**
 * Verifies Brevo API configuration and credentials at startup
 */
export const verifySMTP = async () => {
  const apiKey = getEnv('BREVO_API_KEY');
  const fromEmail = getEnv('FROM_EMAIL');
  const hrEmail = getEnv('HR_EMAIL');

  logger.info(`BREVO_API_KEY loaded: ${maskSecret(apiKey)}`);
  logger.info(`FROM_EMAIL loaded: ${fromEmail || '[NOT SET]'}`);
  logger.info(`HR_EMAIL loaded: ${hrEmail || '[NOT SET]'}`);

  if (!apiKey || !fromEmail || !hrEmail) {
    logger.warn('[Brevo API] Missing environment variables (BREVO_API_KEY, FROM_EMAIL, HR_EMAIL).');
    return false;
  }

  logger.success('✅ Brevo REST API configured successfully.');
  return true;
};

export default {
  sendBrevoEmail,
  verifySMTP,
};

