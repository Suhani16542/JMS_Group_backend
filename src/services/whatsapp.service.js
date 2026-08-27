import logger from '../utils/logger.js';

/**
 * Normalizes phone number into E.164 without '+' or leading symbols (e.g. 919876543210).
 */
const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  // Default to India country code 91 if 10 digits
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
};

/**
 * Returns the official Meta WhatsApp Flow JSON (v3.1) definition for JMS Group
 * Candidate Application Form across 4 structured screens.
 * Ready to copy/paste or import directly into Meta WhatsApp Flow Builder.
 */
export const getJmsApplicationFlowSchema = () => {
  return {
    version: '3.1',
    data_api_version: '3.0',
    routing_model: {
      SCREEN_PERSONAL: ['SCREEN_QUALIFICATIONS'],
      SCREEN_QUALIFICATIONS: ['SCREEN_EMPLOYMENT'],
      SCREEN_EMPLOYMENT: ['SCREEN_TERMS_SIGNATURE'],
      SCREEN_TERMS_SIGNATURE: [],
    },
    screens: [
      {
        id: 'SCREEN_PERSONAL',
        title: 'Personal & Contact Info',
        terminal: false,
        data: {},
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'TextHeading',
              text: 'Candidate Application (1/4)',
            },
            {
              type: 'TextSubheading',
              text: 'Please enter your personal and contact details accurately.',
            },
            {
              type: 'TextInput',
              name: 'fullName',
              label: 'Full Name *',
              required: true,
              'input-type': 'text',
            },
            {
              type: 'TextInput',
              name: 'fatherOrHusbandName',
              label: "Father's / Husband's Name *",
              required: true,
              'input-type': 'text',
            },
            {
              type: 'DatePicker',
              name: 'dob',
              label: 'Date of Birth *',
              required: true,
            },
            {
              type: 'TextInput',
              name: 'mobileNumber',
              label: 'Mobile Number *',
              required: true,
              'input-type': 'phone',
            },
            {
              type: 'TextInput',
              name: 'alternateNumber',
              label: 'Alternate Number',
              required: false,
              'input-type': 'phone',
            },
            {
              type: 'TextInput',
              name: 'fatherNumber',
              label: "Father's Contact Number",
              required: false,
              'input-type': 'phone',
            },
            {
              type: 'TextInput',
              name: 'email',
              label: 'Email ID *',
              required: true,
              'input-type': 'email',
            },
            {
              type: 'TextArea',
              name: 'permanentAddress',
              label: 'Permanent Address *',
              required: true,
            },
            {
              type: 'TextInput',
              name: 'currentLocation',
              label: 'Current City/Location *',
              required: true,
              'input-type': 'text',
            },
            {
              type: 'Footer',
              label: 'Next: Qualifications →',
              'on-click-action': {
                name: 'navigate',
                next: {
                  type: 'screen',
                  name: 'SCREEN_QUALIFICATIONS',
                },
                payload: {
                  fullName: '${form.fullName}',
                  fatherOrHusbandName: '${form.fatherOrHusbandName}',
                  dob: '${form.dob}',
                  mobileNumber: '${form.mobileNumber}',
                  alternateNumber: '${form.alternateNumber}',
                  fatherNumber: '${form.fatherNumber}',
                  email: '${form.email}',
                  permanentAddress: '${form.permanentAddress}',
                  currentLocation: '${form.currentLocation}',
                },
              },
            },
          ],
        },
      },
      {
        id: 'SCREEN_QUALIFICATIONS',
        title: 'Education & Preferences',
        terminal: false,
        data: {},
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'TextHeading',
              text: 'Education & Role (2/4)',
            },
            {
              type: 'TextInput',
              name: 'qualification',
              label: 'Highest Qualification *',
              required: true,
              'input-type': 'text',
            },
            {
              type: 'TextInput',
              name: 'specialization',
              label: 'Specialization (e.g. Finance, IT, Sales)',
              required: false,
              'input-type': 'text',
            },
            {
              type: 'TextInput',
              name: 'jobAppliedForA',
              label: 'Job Applied For - A *',
              required: true,
              'input-type': 'text',
            },
            {
              type: 'TextInput',
              name: 'jobAppliedForB',
              label: 'Job Applied For - B (Optional)',
              required: false,
              'input-type': 'text',
            },
            {
              type: 'TextInput',
              name: 'locationPreferenceA',
              label: 'Location Preference - A *',
              required: true,
              'input-type': 'text',
            },
            {
              type: 'TextInput',
              name: 'locationPreferenceB',
              label: 'Location Preference - B (Optional)',
              required: false,
              'input-type': 'text',
            },
            {
              type: 'Footer',
              label: 'Next: Employment & Family →',
              'on-click-action': {
                name: 'navigate',
                next: {
                  type: 'screen',
                  name: 'SCREEN_EMPLOYMENT',
                },
                payload: {
                  qualification: '${form.qualification}',
                  specialization: '${form.specialization}',
                  jobAppliedForA: '${form.jobAppliedForA}',
                  jobAppliedForB: '${form.jobAppliedForB}',
                  locationPreferenceA: '${form.locationPreferenceA}',
                  locationPreferenceB: '${form.locationPreferenceB}',
                },
              },
            },
          ],
        },
      },
      {
        id: 'SCREEN_EMPLOYMENT',
        title: 'Employment & Family',
        terminal: false,
        data: {},
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'TextHeading',
              text: 'Experience & Background (3/4)',
            },
            {
              type: 'TextInput',
              name: 'currentCompany',
              label: 'Current Company / Employer',
              required: false,
              'input-type': 'text',
            },
            {
              type: 'TextInput',
              name: 'currentBankOrNbfc',
              label: 'Current Bank / NBFC (if applicable)',
              required: false,
              'input-type': 'text',
            },
            {
              type: 'TextInput',
              name: 'currentCtc',
              label: 'Current CTC (e.g. 5.5 LPA)',
              required: false,
              'input-type': 'text',
            },
            {
              type: 'TextInput',
              name: 'expectedSalary',
              label: 'Expected Salary (e.g. 7.0 LPA)',
              required: false,
              'input-type': 'text',
            },
            {
              type: 'TextInput',
              name: 'noticePeriod',
              label: 'Notice Period (e.g. Immediate / 30 Days)',
              required: false,
              'input-type': 'text',
            },
            {
              type: 'TextInput',
              name: 'fatherOrHusbandOccupation',
              label: "Father's / Husband's Occupation",
              required: false,
              'input-type': 'text',
            },
            {
              type: 'TextInput',
              name: 'motherOccupation',
              label: "Mother's Occupation",
              required: false,
              'input-type': 'text',
            },
            {
              type: 'TextInput',
              name: 'siblings',
              label: 'Siblings (e.g. 1 Brother, 1 Sister)',
              required: false,
              'input-type': 'text',
            },
            {
              type: 'TextInput',
              name: 'siblingsOccupation',
              label: 'Siblings Occupation',
              required: false,
              'input-type': 'text',
            },
            {
              type: 'TextInput',
              name: 'referenceNameAndNo',
              label: 'Reference Name and Contact No.',
              required: false,
              'input-type': 'text',
            },
            {
              type: 'Footer',
              label: 'Next: Signature & Submit →',
              'on-click-action': {
                name: 'navigate',
                next: {
                  type: 'screen',
                  name: 'SCREEN_TERMS_SIGNATURE',
                },
                payload: {
                  currentCompany: '${form.currentCompany}',
                  currentBankOrNbfc: '${form.currentBankOrNbfc}',
                  currentCtc: '${form.currentCtc}',
                  expectedSalary: '${form.expectedSalary}',
                  noticePeriod: '${form.noticePeriod}',
                  fatherOrHusbandOccupation: '${form.fatherOrHusbandOccupation}',
                  motherOccupation: '${form.motherOccupation}',
                  siblings: '${form.siblings}',
                  siblingsOccupation: '${form.siblingsOccupation}',
                  referenceNameAndNo: '${form.referenceNameAndNo}',
                },
              },
            },
          ],
        },
      },
      {
        id: 'SCREEN_TERMS_SIGNATURE',
        title: 'Signature & Declaration',
        terminal: true,
        data: {},
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'TextHeading',
              text: 'Terms & Digital Signature (4/4)',
            },
            {
              type: 'TextSubheading',
              text: 'Please review declaration and sign electronically to complete submission.',
            },
            {
              type: 'TextBody',
              text: 'I hereby declare that all information submitted is true, complete and accurate to the best of my knowledge. I understand and agree to all JMS Group Terms & Conditions.',
            },
            {
              type: 'TextInput',
              name: 'signature',
              label: 'Full Legal Name (Digital Signature) *',
              required: true,
              'input-type': 'text',
              helper_text: 'Type your full legal name as your electronic signature.',
            },
            {
              type: 'CheckboxGroup',
              name: 'termsAccepted',
              label: 'Terms & Conditions Consent *',
              required: true,
              'min-selected-items': 1,
              'max-selected-items': 1,
              options: [
                {
                  id: 'accepted',
                  title: 'I have read, understood, and agreed to all Terms & Conditions',
                },
              ],
            },
            {
              type: 'Footer',
              label: 'Submit Application Form',
              'on-click-action': {
                name: 'complete',
                payload: {
                  signature: '${form.signature}',
                  termsAccepted: true,
                },
              },
            },
          ],
        },
      },
    ],
  };
};

/**
 * Formats a clean, readable text message containing all candidate application details
 * for JMS Group WhatsApp notification.
 *
 * @param {Object} app - Candidate application object
 * @returns {string} Formatted WhatsApp message body
 */
export const formatCandidateApplicationWhatsAppMessage = (app) => {
  const formattedDob = app.dob ? new Date(app.dob).toLocaleDateString('en-GB') : 'N/A';
  const submissionTime = app.createdAt
    ? new Date(app.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const resumeLink = app.resumeUrl || (app.resumeId?.resumeUrl ? app.resumeId.resumeUrl : 'N/A');
  const signatureDisplay = app.signature || app.signatureUrl || app.candidateSignatureName || 'Signed digitally';

  const documentsSummary = Array.isArray(app.documents) && app.documents.length > 0
    ? app.documents.map((d, i) => `   • Doc ${i + 1}: ${d.originalFileName} (${d.url})`).join('\n')
    : '   • None submitted';

  return `🏛️ *JMS GROUP — NEW CANDIDATE APPLICATION*
━━━━━━━━━━━━━━━━━━━━
🆔 *Application ID:* ${app.applicationId || app._id}
📅 *Submitted At:* ${submissionTime}
📊 *Status:* ${app.status || 'Pending'}

👤 *1. PERSONAL & CONTACT DETAILS*
• *Full Name:* ${app.fullName}
• *Father's / Husband's Name:* ${app.fatherOrHusbandName || 'N/A'}
• *Date of Birth:* ${formattedDob}
• *Mobile Number:* ${app.mobileNumber}
• *Alternate Number:* ${app.alternateNumber || 'N/A'}
• *Father's Number:* ${app.fatherNumber || 'N/A'}
• *Email ID:* ${app.email}
• *Current Location:* ${app.currentLocation || 'N/A'}
• *Permanent Address:* ${app.permanentAddress || 'N/A'}

🎓 *2. QUALIFICATION & JOB PREFERENCES*
• *Qualification:* ${app.qualification}
• *Specialization:* ${app.specialization || 'N/A'}
• *Job Applied For (A):* ${app.jobAppliedForA}
• *Job Applied For (B):* ${app.jobAppliedForB || 'N/A'}
• *Location Preference (A):* ${app.locationPreferenceA}
• *Location Preference (B):* ${app.locationPreferenceB || 'N/A'}

💼 *3. PROFESSIONAL & SALARY DETAILS*
• *Current Company:* ${app.currentCompany || app.currentBankOrNbfc || 'N/A'}
• *Current Bank/NBFC:* ${app.currentBankOrNbfc || 'N/A'}
• *Current CTC:* ${app.currentCtc || 'N/A'}
• *Expected Salary:* ${app.expectedSalary || 'N/A'}
• *Notice Period:* ${app.noticePeriod || 'N/A'}

👨‍👩‍👧‍👦 *4. FAMILY & REFERENCES*
• *Father's Occupation:* ${app.fatherOrHusbandOccupation || 'N/A'}
• *Mother's Occupation:* ${app.motherOccupation || 'N/A'}
• *Siblings:* ${app.siblings || 'N/A'}
• *Siblings Occupation:* ${app.siblingsOccupation || 'N/A'}
• *Reference Name & No.:* ${app.referenceNameAndNo || 'N/A'}

📎 *5. RESUME & VERIFICATION*
• *Resume Link:* ${resumeLink}
• *Signature:* ${signatureDisplay}
• *Terms & Conditions:* ${app.termsAccepted ? '✅ Accepted' : '❌ Not Accepted'}
• *Supporting Documents:*\n${documentsSummary}
━━━━━━━━━━━━━━━━━━━━
*JMS Group Automated Career Portal*`;
};

/**
 * Dispatches candidate application summary to JMS WhatsApp Business number.
 * Uses WhatsApp Cloud API if configured in environment, otherwise logs notification.
 *
 * Designed to be resilient: will never throw errors or interrupt main flow if WhatsApp API fails.
 *
 * @param {Object} applicationData - Saved candidate application document
 * @returns {Promise<Object|null>}
 */
export const sendApplicationWhatsAppNotification = async (applicationData) => {
  try {
    const accessToken = process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const recipientRaw =
      process.env.WHATSAPP_RECIPIENT_NUMBER ||
      process.env.JMS_WHATSAPP_NUMBER ||
      process.env.WHATSAPP_PHONE_NUMBER;

    const messageText = formatCandidateApplicationWhatsAppMessage(applicationData);

    if (!accessToken || !phoneNumberId || !recipientRaw) {
      logger.info(
        `[WhatsApp Service] WhatsApp Business credentials not fully configured in .env (WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_RECIPIENT_NUMBER).`
      );
      logger.info(`[WhatsApp Notification Preview for Application ${applicationData.applicationId || applicationData._id}]:\n${messageText}`);
      return { status: 'logged_preview', message: 'Credentials pending in .env' };
    }

    const recipientNumber = normalizePhoneNumber(recipientRaw);

    const endpoint = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientNumber,
      type: 'text',
      text: {
        preview_url: true,
        body: messageText,
      },
    };

    logger.info(`[WhatsApp Service] Sending application notification for ${applicationData.fullName} to WhatsApp (${recipientNumber})...`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.warn(
        `[WhatsApp Service Warning] WhatsApp API returned error (${response.status}): ${JSON.stringify(data)}`
      );
      return { status: 'api_error', error: data };
    }

    logger.success(
      `[WhatsApp Service] Candidate application WhatsApp notification delivered successfully! Message ID: ${data.messages?.[0]?.id || 'N/A'}`
    );
    return { status: 'sent', data };
  } catch (error) {
    logger.error(`[WhatsApp Service Error] Failed to send WhatsApp notification: ${error.message}`);
    return { status: 'failed', error: error.message };
  }
};

/**
 * Generates an interactive WhatsApp Flow payload or direct WhatsApp chat deep link
 * for the candidate to fill/complete application on WhatsApp.
 *
 * @param {string} candidatePhone - Candidate mobile number
 * @param {Object} initialData - Prefilled candidate resume information
 * @returns {string} WhatsApp direct link
 */
export const generateCandidateWhatsAppFlowUrl = (candidatePhone, initialData = {}) => {
  const jmsNumber = normalizePhoneNumber(
    process.env.WHATSAPP_RECIPIENT_NUMBER || process.env.JMS_WHATSAPP_NUMBER || '919876543210'
  );

  const resumeId = initialData._id || initialData.resumeId || '';
  const fullName = initialData.fullName || 'Candidate';
  const jobRole = initialData.preferredJobRole || 'Career Application';

  const defaultText = encodeURIComponent(
    `Hello JMS Group, I have uploaded my resume (${fullName} - ${jobRole}). Resume ID: ${resumeId}. Please proceed with my detailed application form.`
  );

  return `https://wa.me/${jmsNumber}?text=${defaultText}`;
};

/**
 * Sends an interactive WhatsApp Flow message directly to candidate's mobile number.
 * Requires WHATSAPP_FLOW_ID configured in Meta Business Manager.
 *
 * @param {string} candidatePhone - Candidate WhatsApp phone number
 * @param {Object} resumeData - Candidate resume submission details
 * @returns {Promise<Object>}
 */
export const sendCandidateWhatsAppFlowInvitation = async (candidatePhone, resumeData = {}) => {
  try {
    const accessToken = process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const flowId = process.env.WHATSAPP_FLOW_ID;

    const recipientNumber = normalizePhoneNumber(candidatePhone);

    if (!accessToken || !phoneNumberId || !flowId) {
      logger.info(
        `[WhatsApp Flow Service] Meta WhatsApp Flow ID or Credentials pending in .env (WHATSAPP_FLOW_ID, WHATSAPP_API_TOKEN). Providing direct link fallback.`
      );
      return {
        status: 'pending_flow_config',
        flowUrl: generateCandidateWhatsAppFlowUrl(candidatePhone, resumeData),
      };
    }

    const endpoint = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

    // Interactive WhatsApp Flow Message (Meta Cloud API Format)
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientNumber,
      type: 'interactive',
      interactive: {
        type: 'flow',
        header: {
          type: 'text',
          text: 'JMS Group Careers',
        },
        body: {
          text: `Dear ${resumeData.fullName || 'Candidate'},\nThank you for submitting your resume. Please click below to complete your detailed candidate application and terms acceptance.`,
        },
        footer: {
          text: 'JMS Group Official Application',
        },
        action: {
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_token: `resume_${resumeData._id || Date.now()}`,
            flow_id: flowId,
            flow_cta: 'Complete Application Form',
            flow_action: 'navigate',
            flow_action_payload: {
              screen: 'SCREEN_PERSONAL',
              data: {
                fullName: resumeData.fullName || '',
                email: resumeData.email || '',
                mobileNumber: resumeData.phone || '',
                qualification: resumeData.highestQualification || '',
                jobAppliedForA: resumeData.preferredJobRole || '',
              },
            },
          },
        },
      },
    };

    logger.info(`[WhatsApp Flow Service] Sending interactive flow to ${recipientNumber}...`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.warn(`[WhatsApp Flow Warning] ${JSON.stringify(data)}`);
      return { status: 'api_error', error: data, flowUrl: generateCandidateWhatsAppFlowUrl(candidatePhone, resumeData) };
    }

    logger.success(`[WhatsApp Flow Success] Interactive Flow sent: ${data.messages?.[0]?.id || 'OK'}`);
    return { status: 'sent', data };
  } catch (error) {
    logger.error(`[WhatsApp Flow Error] ${error.message}`);
    return { status: 'failed', error: error.message, flowUrl: generateCandidateWhatsAppFlowUrl(candidatePhone, resumeData) };
  }
};

export default {
  getJmsApplicationFlowSchema,
  formatCandidateApplicationWhatsAppMessage,
  sendApplicationWhatsAppNotification,
  sendCandidateWhatsAppFlowInvitation,
  generateCandidateWhatsAppFlowUrl,
};
