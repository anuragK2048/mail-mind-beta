import express, { Router } from "express";
import * as emailController from "../controllers/email.controller";
import * as emailListController from "../controllers/emailList.controller";
import { isAuthenticated } from "../../middleware/isAuthenticated";
import { validateRequest } from "../../middleware/validateRequest";
import { getEmailsQuerySchema } from "../schemas/systemLabelReq.schemas";
import {
  emailIdParamSchema,
  modifyLabelsSchema,
} from "../schemas/email.schemas";
// import { validateRequest } from '../../middleware/validateRequest';
// import { emailFetchSchema, emailActionSchema } from './schemas/email.schemas';

const router: Router = express.Router();

// All email routes are protected
router.use(isAuthenticated);

// --- Email Listing & Viewing ---

// GET email list
router.get("/inbox/all", emailListController.getAllInboxEmails);
router.get("/inbox/other", emailListController.getOthersInboxEmails);
router.get("/inbox/:labelId", emailListController.getInboxEmailsByLabel);
router.get("/system/:systemLabelId", emailListController.getSystemLabelEmails);

// GET /api/v1/emails/:emailId/labels
router.get("/:emailId/labels", emailController.getEmailLabels);

// GET /api/v1/emails/by-label/:labelId
router.get("/by-label/:labelId", emailController.getEmailsByLabel);

// router.post("/by-label/:labelId", emailController.getSelectedEmailsByLabel);

// IMPLEMENTED
// GET /api/v1/emails?category=inbox&limit=20&page=1&accountId=xyz&starred=true&unread=true
// router.get(
//   "/emailList/:accountId",
//   /* validateRequest(emailFetchSchema), */ emailController.getEmails
// );
// GET /api/v1/emails/:emailId (Get a single email by your app's internal ID)
router.get("/:emailId", emailController.getSingleEmailDetails);

// IMPLEMENTED
// POST /api/v1/gmail-accounts/:accountId/sync
// router.post("/:accountId/sync", emailController.startAccountSync); TODO

// GET /api/v1/emails/threads/:threadId (Get all emails in a specific thread)
// router.get('/threads/:threadId', emailController.getThreadDetails);

// --- Email Actions (modifying state in Gmail & your DB) ---
// POST /api/v1/emails/:emailId/read (Mark as read)
router.post("/:emailId/read", emailController.markEmailAsRead);

// POST /api/v1/emails/:emailId/unread (Mark as unread)
router.post("/:emailId/unread", emailController.markEmailAsUnread);

// POST /api/v1/emails/:emailId/star (Star an email)
router.post("/:emailId/star", emailController.starEmail);

// DELETE /api/v1/emails/:emailId/star (Unstar an email)
router.delete("/:emailId/star", emailController.unstarEmail);
// DELETE /api/v1/emails/:emailId/star (Unstar an email)
router.post("/:emailId/editLabels", emailController.editEmailLabels);

router.patch(
  "/:emailId/labels",
  validateRequest({ params: emailIdParamSchema, body: modifyLabelsSchema }),
  emailController.modifyEmailLabelsController
);

// POST /api/v1/emails/:emailId/archive
// router.post('/:emailId/archive', emailController.archiveEmail);

// POST /api/v1/emails/:emailId/trash
// router.post('/:emailId/trash', emailController.trashEmail);

// POST /api/v1/emails/batch-actions (Perform actions on multiple emails)
// router.post('/batch-actions', validateRequest(emailActionSchema), emailController.batchEmailActions);

// --- Email Syncing ---
// GET /api/v1/emails/sync/status (Overall sync status for the user or specific account)
router.get("/sync/status", emailController.getOverallSyncStatus);

// POST /api/v1/emails/sync/start (Start initial/full sync for user or specific account)
// This was also in gmailAccount.routes.ts for per-account sync, decide where it fits best or have both
router.post("/sync/start", emailController.startUserSync);

// POST /api/v1/emails/sync/sse-stream (For Server-Sent Events for sync progress - conceptual)
// This would be a special endpoint if using SSE
// router.get('/sync/sse-stream', emailController.streamSyncProgress);

// --- AI Features ---
// GET /api/v1/emails/:emailId/summary (Get AI summary for an email)
router.get("/:emailId/summary", emailController.getEmailSummary);

// POST /api/v1/emails/:emailId/summary/generate (Force regenerate summary)
// router.post('/:emailId/summary/generate', emailController.generateEmailSummary);

// GET /api/v1/emails/:emailId/classification
// router.get('/:emailId/classification', emailController.getEmailClassification);

export default router;
