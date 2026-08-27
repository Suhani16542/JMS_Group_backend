import { Router } from 'express';
import {
  verifyWebhook,
  handleWebhook,
  sendFlowMessage,
  getFlowSchema,
} from '../controllers/whatsapp.controller.js';

const router = Router();

// GET /api/whatsapp/webhook - Meta Webhook Verification Handshake
router.get('/webhook', verifyWebhook);

// POST /api/whatsapp/webhook - Meta Webhook Event & Flow Submission Receiver
router.post('/webhook', handleWebhook);

// POST /api/whatsapp/send-flow - Send Interactive Flow Message to Candidate
router.post('/send-flow', sendFlowMessage);

// GET /api/whatsapp/flow-schema - Official WhatsApp Flow JSON Definition for Meta Flow Builder
router.get('/flow-schema', getFlowSchema);

export default router;
