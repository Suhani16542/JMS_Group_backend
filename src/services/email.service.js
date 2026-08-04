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

    const serverBaseUrl = process.env.SERVER_URL || process.env.BACKEND_URL || 'http://localhost:5000';
    const viewUrl = `${serverBaseUrl}/api/resume/download/${resumeData._id}?mode=view`;
    const downloadUrl = `${serverBaseUrl}/api/resume/download/${resumeData._id}?mode=download`;

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
        <h3>New Candidate Resume Application</h3>
        <p><strong>Candidate Name:</strong> ${resumeData.fullName}</p>
        <p><strong>Email:</strong> ${resumeData.email}</p>
        <p><strong>Phone:</strong> ${resumeData.phone}</p>
        <p><strong>Qualification:</strong> ${resumeData.highestQualification}</p>
        <p><strong>Experience:</strong> ${resumeData.experience}</p>
        <p><strong>Preferred Role:</strong> ${resumeData.preferredJobRole}</p>
        <p><strong>Original File Name:</strong> ${resumeData.originalFileName}</p>
        <br />
        <p>
          <a href="${viewUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">View Resume</a>
          <a href="${downloadUrl}" target="_blank" style="background-color: #059669; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Download Resume</a>
        </p>
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

