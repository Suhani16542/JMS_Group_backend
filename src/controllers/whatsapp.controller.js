import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import {
  getJmsApplicationFlowSchema,
  sendCandidateWhatsAppFlowInvitation,
  generateCandidateWhatsAppFlowUrl,
} from '../services/whatsapp.service.js';
import { submitCandidateApplicationService } from '../services/candidateApplication.service.js';

/**
 * @desc    Meta Webhook Verification Endpoint
 * @route   GET /api/whatsapp/webhook
 * @access  Public (Meta Webhook verification handshake)
 */
export const verifyWebhook = asyncHandler(async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'jms_group_whatsapp_verify_token_2026';

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      logger.success('[Meta Webhook Verified] Verification challenge handshake succeeded.');
      return res.status(200).send(challenge);
    } else {
      logger.warn('[Meta Webhook Verification Failed] Verify token mismatch.');
      return res.sendStatus(403);
    }
  }

  return res.sendStatus(400);
});

/**
 * @desc    Meta WhatsApp Webhook & Flow Submission Receiver
 * @route   POST /api/whatsapp/webhook
 * @access  Public
 */
export const handleWebhook = asyncHandler(async (req, res) => {
  const body = req.body;

  // Acknowledge receipt to Meta immediately with HTTP 200
  res.status(200).json({ status: 'EVENT_RECEIVED' });

  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) return;

    const fromPhone = message.from; // Candidate WhatsApp number

    // 1. Check for Native Flow Message Reply (nfm_reply)
    if (message.type === 'interactive' && message.interactive?.type === 'nfm_reply') {
      const nfmReply = message.interactive.nfm_reply;
      const flowToken = nfmReply.flow_token || ''; // e.g. "resume_6a8ecbd5c31fe2e26c25272d"

      let responseJson = {};
      try {
        responseJson = typeof nfmReply.response_json === 'string'
          ? JSON.parse(nfmReply.response_json)
          : (nfmReply.response_json || {});
      } catch (err) {
        logger.error(`[WhatsApp Webhook] Failed to parse Flow response JSON: ${err.message}`);
        responseJson = {};
      }

      logger.info(`[WhatsApp Webhook] Received Flow Submission from ${fromPhone}`);

      // Extract resumeId from flow_token
      let resumeId = null;
      if (flowToken.startsWith('resume_')) {
        resumeId = flowToken.replace('resume_', '').trim();
      }

      // Map Flow fields to Candidate Application payload
      const applicationPayload = {
        fullName: responseJson.fullName || 'Candidate',
        fatherOrHusbandName: responseJson.fatherOrHusbandName || 'N/A',
        dob: responseJson.dob || '2000-01-01',
        qualification: responseJson.qualification || 'N/A',
        specialization: responseJson.specialization || '',
        permanentAddress: responseJson.permanentAddress || 'N/A',
        email: responseJson.email || '',
        mobileNumber: responseJson.mobileNumber || fromPhone,
        alternateNumber: responseJson.alternateNumber || '',
        fatherNumber: responseJson.fatherNumber || '',
        jobAppliedForA: responseJson.jobAppliedForA || 'Applicant',
        jobAppliedForB: responseJson.jobAppliedForB || '',
        currentLocation: responseJson.currentLocation || 'N/A',
        locationPreferenceA: responseJson.locationPreferenceA || 'N/A',
        locationPreferenceB: responseJson.locationPreferenceB || '',
        currentCompany: responseJson.currentCompany || responseJson.currentBankOrNbfc || '',
        currentBankOrNbfc: responseJson.currentBankOrNbfc || '',
        currentCtc: responseJson.currentCtc || '',
        expectedSalary: responseJson.expectedSalary || '',
        noticePeriod: responseJson.noticePeriod || '',
        fatherOrHusbandOccupation: responseJson.fatherOrHusbandOccupation || '',
        motherOccupation: responseJson.motherOccupation || '',
        siblings: responseJson.siblings || '',
        siblingsOccupation: responseJson.siblingsOccupation || '',
        referenceNameAndNo: responseJson.referenceNameAndNo || '',
        resumeId: resumeId || responseJson.resumeId || null,
        signature: responseJson.signature || responseJson.candidateSignatureName || 'Signed electronically via WhatsApp',
        candidateSignatureName: responseJson.signature || responseJson.fullName,
        termsAccepted: true, // Candidate must check Terms to submit flow
      };

      // Save application into MongoDB & dispatch HR email via existing service
      const savedApplication = await submitCandidateApplicationService(applicationPayload, {});
      logger.success(
        `[WhatsApp Webhook] Saved application ID ${savedApplication.applicationId || savedApplication._id} from WhatsApp Flow. Dispatched HR Email.`
      );
    }
  } catch (webhookError) {
    logger.error(`[WhatsApp Webhook Error] Processing failed: ${webhookError.message}`);
  }
});

/**
 * @desc    Send interactive WhatsApp Flow invitation directly to candidate
 * @route   POST /api/whatsapp/send-flow
 * @access  Public
 */
export const sendFlowMessage = asyncHandler(async (req, res) => {
  const { phone, resumeId, fullName, preferredJobRole, email, highestQualification } = req.body;

  if (!phone) {
    return ApiResponse.error(res, 400, 'Candidate phone number is required.');
  }

  const result = await sendCandidateWhatsAppFlowInvitation(phone, {
    _id: resumeId,
    fullName,
    preferredJobRole,
    email,
    highestQualification,
  });

  const flowUrl = generateCandidateWhatsAppFlowUrl(phone, {
    resumeId,
    fullName,
    preferredJobRole,
  });

  return ApiResponse.success(res, 200, 'WhatsApp Flow invitation dispatched', {
    ...result,
    flowUrl,
  });
});

/**
 * @desc    Returns complete WhatsApp Flow JSON Schema definition for Meta Flow Builder
 * @route   GET /api/whatsapp/flow-schema
 * @access  Public
 */
export const getFlowSchema = asyncHandler(async (req, res) => {
  const schema = getJmsApplicationFlowSchema();
  return res.status(200).json(schema);
});

export default {
  verifyWebhook,
  handleWebhook,
  sendFlowMessage,
  getFlowSchema,
};
