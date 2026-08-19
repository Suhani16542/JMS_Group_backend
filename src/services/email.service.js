import { sendBrevoEmail } from '../config/smtp.js';
import { getCloudinaryDownloadUrl } from '../config/cloudinary.js';
import logger from '../utils/logger.js';

/**
 * Parses and validates HR email recipients from process.env.HR_EMAIL.
 * Reads HR_EMAIL from process.env, splits comma-separated emails,
 * trims whitespace, removes empty entries, and eliminates duplicate addresses.
 * Converts recipients to Brevo API payload format [{ email: '...' }].
 * @returns {Array<{email: string}>} Array of Brevo recipient objects
 */
const getHrRecipients = () => {
  const rawEmails = process.env.HR_EMAIL || 'jmsplacement@gmail.com,suhaniyadav1402@gmail.com';

  const uniqueEmails = Array.from(
    new Set(
      rawEmails
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email.length > 0)
    )
  );

  if (uniqueEmails.length === 0) {
    throw new Error('No valid HR email recipient configured in process.env.HR_EMAIL.');
  }

  return uniqueEmails.map((email) => ({ email }));
};

/**
 * Sends notification email for new contact form submissions via Brevo API.
 * @param {Object} contactData - Saved contact object
 */
export const sendContactNotificationEmail = async (contactData) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      logger.info('[Email Service] Skipping notification email: BREVO_API_KEY not configured.');
      return;
    }

    const hrRecipients = getHrRecipients();
    const fromEmail = process.env.FROM_EMAIL || 'jmsplacement@gmail.com';

    logger.info(`Sending HR notification to:\n${hrRecipients.map((r) => `- ${r.email}`).join('\n')}`);

    const result = await sendBrevoEmail({
      sender: {
        name: contactData.fullName || 'JMS Group Website',
        email: fromEmail,
      },
      replyTo: {
        name: contactData.fullName,
        email: contactData.email,
      },
      to: hrRecipients,
      subject: `New Contact Inquiry: ${contactData.subject}`,
      htmlContent: `
        <h3>New Contact Submission Received</h3>
        <p><strong>Full Name:</strong> ${contactData.fullName}</p>
        <p><strong>Email:</strong> ${contactData.email}</p>
        <p><strong>Phone:</strong> ${contactData.phone}</p>
        <p><strong>Subject:</strong> ${contactData.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${contactData.message}</p>
      `,
    });

    logger.success(`[Email Service] Contact notification sent via Brevo API: ${result.messageId || 'Success'}`);
    return result;
  } catch (error) {
    logger.error(`[Email Service Error] Contact notification failed: ${error.message}`);
  }
};

/**
 * Sends notification email for new candidate resume submissions via Brevo API.
 * @param {Object} resumeData - Saved resume object with Cloudinary URL
 */
export const sendResumeNotificationEmail = async (resumeData) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      logger.info('[Email Service] Skipping notification email: BREVO_API_KEY not configured.');
      return;
    }

    const hrRecipients = getHrRecipients();
    const fromEmail = process.env.FROM_EMAIL || 'jmsplacement@gmail.com';

    logger.info(`Sending HR notification to:\n${hrRecipients.map((r) => `- ${r.email}`).join('\n')}`);

    // Generate direct, secure HTTPS signed URLs from Cloudinary
    const signedViewUrl = resumeData.cloudinaryPublicId
      ? getCloudinaryDownloadUrl(resumeData.cloudinaryPublicId, false)
      : resumeData.resumeUrl;

    const signedDownloadUrl = resumeData.cloudinaryPublicId
      ? getCloudinaryDownloadUrl(resumeData.cloudinaryPublicId, true)
      : resumeData.resumeUrl;

    const viewUrl = signedViewUrl || resumeData.resumeUrl;
    const downloadUrl = signedDownloadUrl || resumeData.resumeUrl;

    const result = await sendBrevoEmail({
      sender: {
        name: 'JMS Group Careers',
        email: fromEmail,
      },
      replyTo: {
        name: resumeData.fullName,
        email: resumeData.email,
      },
      to: hrRecipients,
      subject: `New Candidate Resume: ${resumeData.fullName} (${resumeData.preferredJobRole})`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #1e3a8a; margin-top: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">New Candidate Resume Application</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr><td style="padding: 8px 0; font-weight: bold; color: #475569; width: 35%;">Candidate Name:</td><td style="padding: 8px 0; color: #0f172a;">${resumeData.fullName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Email:</td><td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${resumeData.email}" style="color: #2563eb;">${resumeData.email}</a></td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Phone:</td><td style="padding: 8px 0; color: #0f172a;"><a href="tel:${resumeData.phone}" style="color: #2563eb;">${resumeData.phone}</a></td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Highest Qualification:</td><td style="padding: 8px 0; color: #0f172a;">${resumeData.highestQualification}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Experience:</td><td style="padding: 8px 0; color: #0f172a;">${resumeData.experience}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Preferred Role:</td><td style="padding: 8px 0; color: #0f172a; font-weight: 600; color: #1d4ed8;">${resumeData.preferredJobRole}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Reference Number:</td><td style="padding: 8px 0; color: #0f172a;">${resumeData.referenceNumber}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Reference Name:</td><td style="padding: 8px 0; color: #0f172a;">${resumeData.referenceName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #475569;">Original File:</td><td style="padding: 8px 0; color: #0f172a;">${resumeData.originalFileName}</td></tr>
          </table>
          <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <a href="${viewUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 12px; font-size: 14px;">View Resume</a>
            <a href="${downloadUrl}" target="_blank" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">Download Resume</a>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
            This email was sent automatically by JMS Group Job Application System.
          </p>
        </div>
      `,
    });

    logger.success(`[Email Service] Resume notification sent via Brevo API: ${result.messageId || 'Success'}`);
    return result;
  } catch (error) {
    logger.error(`[Email Service Error] Resume notification failed: ${error.message}`);
  }
};

export default {
  sendContactNotificationEmail,
  sendResumeNotificationEmail,
};

