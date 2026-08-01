import transporter from '../config/smtp.js';
import logger from '../utils/logger.js';

/**
 * Parses and validates HR email recipients from environment configuration.
 * Reads HR_EMAIL strictly from process.env, splits comma-separated emails,
 * trims whitespace, removes empty entries, and eliminates duplicate addresses.
 * Throws an error if no valid recipient exists in process.env.HR_EMAIL.
 * @returns {string[]} Array of unique, cleaned HR recipient email addresses
 */
const getHrRecipients = () => {
  const rawEmails = process.env.HR_EMAIL || '';

  // Split by comma, trim whitespace, filter empty values, and remove duplicates using Set
  const hrRecipients = Array.from(
    new Set(
      rawEmails
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email.length > 0)
    )
  );

  // Throw clear error if no valid HR email exists
  if (hrRecipients.length === 0) {
    throw new Error('No valid HR email recipient configured in process.env.HR_EMAIL.');
  }

  return hrRecipients;
};

/**
 * Sends notification email for new contact form submissions.
 * @param {Object} contactData - Saved contact object
 */
export const sendContactNotificationEmail = async (contactData) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.info('[Email Service] Skipping notification email: Brevo SMTP credentials not configured yet.');
      return;
    }

    // Parse and validate HR recipients (supports multiple comma-separated emails)
    const hrRecipients = getHrRecipients();

    // Log recipient list before sending
    logger.info(`Sending HR notification to:\n${hrRecipients.map((email) => `- ${email}`).join('\n')}`);

    const mailOptions = {
      from: `"${contactData.fullName}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      replyTo: contactData.email,
      to: hrRecipients,
      subject: `New Contact Inquiry: ${contactData.subject}`,
      html: `
        <h3>New Contact Submission Received</h3>
        <p><strong>Full Name:</strong> ${contactData.fullName}</p>
        <p><strong>Email:</strong> ${contactData.email}</p>
        <p><strong>Phone:</strong> ${contactData.phone}</p>
        <p><strong>Subject:</strong> ${contactData.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${contactData.message}</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.success(`[Email Service] Contact notification email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`[Email Service Error] Contact notification failed: ${error.message}`);
  }
};

/**
 * Sends notification email for new candidate resume submissions.
 * @param {Object} resumeData - Saved resume object with Cloudinary URL
 */
export const sendResumeNotificationEmail = async (resumeData) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.info('[Email Service] Skipping notification email: Brevo SMTP credentials not configured yet.');
      return;
    }

    // Parse and validate HR recipients (supports multiple comma-separated emails)
    const hrRecipients = getHrRecipients();

    // Log recipient list before sending
    logger.info(`Sending HR notification to:\n${hrRecipients.map((email) => `- ${email}`).join('\n')}`);

    const mailOptions = {
      from: `"JMS Group Careers" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      replyTo: resumeData.email,
      to: hrRecipients,
      subject: `New Candidate Resume: ${resumeData.fullName} (${resumeData.preferredJobRole})`,
      html: `
        <h3>New Candidate Resume Application</h3>
        <p><strong>Candidate Name:</strong> ${resumeData.fullName}</p>
        <p><strong>Email:</strong> ${resumeData.email}</p>
        <p><strong>Phone:</strong> ${resumeData.phone}</p>
        <p><strong>Qualification:</strong> ${resumeData.highestQualification}</p>
        <p><strong>Experience:</strong> ${resumeData.experience}</p>
        <p><strong>Preferred Role:</strong> ${resumeData.preferredJobRole}</p>
        <p><strong>Resume Document:</strong> <a href="${resumeData.resumeUrl}">${resumeData.originalFileName}</a></p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.success(`[Email Service] Resume notification email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`[Email Service Error] Resume notification failed: ${error.message}`);
  }
};

export default {
  sendContactNotificationEmail,
  sendResumeNotificationEmail,
};

