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

/**
 * Sends notification email for new candidate application form submissions via Brevo API.
 * @param {Object} applicationData - Saved candidate application object with Cloudinary URLs
 */
export const sendCandidateApplicationEmail = async (applicationData) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      logger.info('[Email Service] Skipping candidate application email: BREVO_API_KEY not configured.');
      return;
    }

    const hrRecipients = getHrRecipients();
    const fromEmail = process.env.FROM_EMAIL || 'jmsplacement@gmail.com';

    logger.info(`Sending Candidate Application HR notification to:\n${hrRecipients.map((r) => `- ${r.email}`).join('\n')}`);

    const formattedDob = applicationData.dob
      ? new Date(applicationData.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'N/A';

    // Format supporting documents rows
    const docsHtml = applicationData.documents && applicationData.documents.length > 0
      ? applicationData.documents.map((doc, idx) => `
          <div style="margin-bottom: 6px;">
            <strong>Doc #${idx + 1}:</strong> ${doc.originalFileName} 
            (<a href="${doc.url}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 600;">View / Download</a>)
          </div>
        `).join('')
      : '<p style="color: #64748b; font-style: italic; margin: 0;">No additional documents submitted.</p>';

    const photoUrl = applicationData.photo?.url || '';

    const subject = `New Candidate Application – ${applicationData.fullName} – ${applicationData.jobAppliedForA}`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff; color: #1e293b;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8B1E5C 0%, #B82E78 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">JMS GROUP — CANDIDATE APPLICATION</h2>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Candidate Registration & Terms & Conditions Submission</p>
        </div>

        <div style="padding: 20px; border: 1px solid #f1f5f9; border-top: none; border-radius: 0 0 8px 8px;">

          <!-- Candidate Photo & Basic Info Banner -->
          <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; padding: 16px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            ${photoUrl ? `
              <div style="margin-right: 16px;">
                <img src="${photoUrl}" alt="${applicationData.fullName}" style="width: 100px; height: 120px; object-fit: cover; border-radius: 6px; border: 2px solid #8B1E5C; display: block;" />
              </div>
            ` : ''}
            <div style="flex: 1; min-width: 200px;">
              <h3 style="margin: 0 0 6px 0; color: #8B1E5C; font-size: 18px;">${applicationData.fullName}</h3>
              <p style="margin: 2px 0; font-size: 13px;"><strong>Application ID:</strong> <span style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: #8B1E5C;">${applicationData.applicationId || applicationData._id}</span></p>
              <p style="margin: 2px 0; font-size: 13px;"><strong>Job Applied For (A):</strong> <span style="color: #2563eb; font-weight: 600;">${applicationData.jobAppliedForA}</span></p>
              ${applicationData.jobAppliedForB ? `<p style="margin: 2px 0; font-size: 13px;"><strong>Job Applied For (B):</strong> ${applicationData.jobAppliedForB}</p>` : ''}
              <p style="margin: 2px 0; font-size: 13px;"><strong>Mobile:</strong> <a href="tel:${applicationData.mobileNumber}" style="color: #059669; text-decoration: none;">${applicationData.mobileNumber}</a></p>
              <p style="margin: 2px 0; font-size: 13px;"><strong>Email:</strong> <a href="mailto:${applicationData.email}" style="color: #2563eb; text-decoration: none;">${applicationData.email}</a></p>
            </div>
          </div>

          <!-- Section 1: Personal Details -->
          <h4 style="margin: 18px 0 8px; color: #334155; border-bottom: 2px solid #8B1E5C; padding-bottom: 4px; font-size: 15px;">1. Personal & Contact Details</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
            <tr style="background-color: #f8fafc;"><td style="padding: 6px 8px; font-weight: 600; width: 38%;">Father's / Husband's Name:</td><td style="padding: 6px 8px;">${applicationData.fatherOrHusbandName || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 8px; font-weight: 600;">Date of Birth:</td><td style="padding: 6px 8px;">${formattedDob}</td></tr>
            <tr style="background-color: #f8fafc;"><td style="padding: 6px 8px; font-weight: 600;">Permanent Address:</td><td style="padding: 6px 8px;">${applicationData.permanentAddress || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 8px; font-weight: 600;">Current Location:</td><td style="padding: 6px 8px;">${applicationData.currentLocation || 'N/A'}</td></tr>
            <tr style="background-color: #f8fafc;"><td style="padding: 6px 8px; font-weight: 600;">Alternate Number:</td><td style="padding: 6px 8px;">${applicationData.alternateNumber || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 8px; font-weight: 600;">Father's Contact Number:</td><td style="padding: 6px 8px;">${applicationData.fatherNumber || 'N/A'}</td></tr>
          </table>

          <!-- Section 2: Education & Preferences -->
          <h4 style="margin: 18px 0 8px; color: #334155; border-bottom: 2px solid #8B1E5C; padding-bottom: 4px; font-size: 15px;">2. Qualification & Preferences</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
            <tr style="background-color: #f8fafc;"><td style="padding: 6px 8px; font-weight: 600; width: 38%;">Highest Qualification:</td><td style="padding: 6px 8px;">${applicationData.qualification}</td></tr>
            <tr><td style="padding: 6px 8px; font-weight: 600;">Specialization:</td><td style="padding: 6px 8px;">${applicationData.specialization || 'N/A'}</td></tr>
            <tr style="background-color: #f8fafc;"><td style="padding: 6px 8px; font-weight: 600;">Location Preference - A:</td><td style="padding: 6px 8px;">${applicationData.locationPreferenceA}</td></tr>
            <tr><td style="padding: 6px 8px; font-weight: 600;">Location Preference - B:</td><td style="padding: 6px 8px;">${applicationData.locationPreferenceB || 'N/A'}</td></tr>
          </table>

          <!-- Section 3: Professional & CTC -->
          <h4 style="margin: 18px 0 8px; color: #334155; border-bottom: 2px solid #8B1E5C; padding-bottom: 4px; font-size: 15px;">3. Current Employment & Salary Details</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
            <tr style="background-color: #f8fafc;"><td style="padding: 6px 8px; font-weight: 600; width: 38%;">Current Company:</td><td style="padding: 6px 8px;">${applicationData.currentCompany || applicationData.currentBankOrNbfc || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 8px; font-weight: 600;">Current Bank / NBFC:</td><td style="padding: 6px 8px;">${applicationData.currentBankOrNbfc || 'N/A'}</td></tr>
            <tr style="background-color: #f8fafc;"><td style="padding: 6px 8px; font-weight: 600;">Current CTC:</td><td style="padding: 6px 8px;">${applicationData.currentCtc || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 8px; font-weight: 600;">Expected Salary:</td><td style="padding: 6px 8px;">${applicationData.expectedSalary || 'N/A'}</td></tr>
            <tr style="background-color: #f8fafc;"><td style="padding: 6px 8px; font-weight: 600;">Notice Period:</td><td style="padding: 6px 8px;">${applicationData.noticePeriod || 'N/A'}</td></tr>
          </table>

          <!-- Section 4: Family Details & References -->
          <h4 style="margin: 18px 0 8px; color: #334155; border-bottom: 2px solid #8B1E5C; padding-bottom: 4px; font-size: 15px;">4. Family Background & Reference</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
            <tr style="background-color: #f8fafc;"><td style="padding: 6px 8px; font-weight: 600; width: 38%;">Father/Husband Occupation:</td><td style="padding: 6px 8px;">${applicationData.fatherOrHusbandOccupation || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 8px; font-weight: 600;">Mother's Occupation:</td><td style="padding: 6px 8px;">${applicationData.motherOccupation || 'N/A'}</td></tr>
            <tr style="background-color: #f8fafc;"><td style="padding: 6px 8px; font-weight: 600;">Siblings:</td><td style="padding: 6px 8px;">${applicationData.siblings || 'N/A'}</td></tr>
            <tr><td style="padding: 6px 8px; font-weight: 600;">Siblings Occupation:</td><td style="padding: 6px 8px;">${applicationData.siblingsOccupation || 'N/A'}</td></tr>
            <tr style="background-color: #f8fafc;"><td style="padding: 6px 8px; font-weight: 600;">Reference Name & No.:</td><td style="padding: 6px 8px;">${applicationData.referenceNameAndNo || 'N/A'}</td></tr>
          </table>

          <!-- Section 5: Documents & Declarations -->
          <h4 style="margin: 18px 0 8px; color: #334155; border-bottom: 2px solid #8B1E5C; padding-bottom: 4px; font-size: 15px;">5. Uploaded Documents & Declaration</h4>
          <div style="padding: 12px; background-color: #f8fafc; border-radius: 6px; font-size: 13px; margin-bottom: 16px;">
            ${applicationData.resumeUrl ? `
              <div style="margin-bottom: 8px;">
                <strong>Linked Resume:</strong> <a href="${applicationData.resumeUrl}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 600;">View Candidate Resume</a>
              </div>
            ` : ''}
            ${docsHtml}
          </div>

          <div style="padding: 12px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 12px; color: #166534;">
            <p style="margin: 0 0 4px 0;"><strong>Digital Signature:</strong> ${applicationData.signature || applicationData.signatureUrl || applicationData.candidateSignatureName || applicationData.fullName}</p>
            <p style="margin: 0;"><strong>Terms & Conditions:</strong> Agreed & Accepted (Yes)</p>
          </div>

          <!-- Direct Photo View Button -->
          ${photoUrl ? `
            <div style="margin-top: 20px; text-align: center;">
              <a href="${photoUrl}" target="_blank" style="background-color: #8B1E5C; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">View Candidate Photo</a>
            </div>
          ` : ''}

        </div>

        <p style="margin-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
          This application was received automatically through the JMS Group Candidate Portal.
        </p>
      </div>
    `;

    const result = await sendBrevoEmail({
      sender: {
        name: 'JMS Group Application Portal',
        email: fromEmail,
      },
      replyTo: {
        name: applicationData.fullName,
        email: applicationData.email,
      },
      to: hrRecipients,
      subject,
      htmlContent,
    });

    logger.success(`[Email Service] Candidate application notification sent via Brevo: ${result.messageId || 'Success'}`);
    return result;
  } catch (error) {
    logger.error(`[Email Service Error] Candidate application email failed: ${error.message}`);
  }
};

export default {
  sendContactNotificationEmail,
  sendResumeNotificationEmail,
  sendCandidateApplicationEmail,
};


