// src/api/routes/gmailAccount.routes.ts
import express, { Router } from "express";
import * as gmailAccountController from "../controllers/gmailAccount.controller";
import { isAuthenticated } from "../../middleware/isAuthenticated";

const router: Router = express.Router();

// All gmailAccount routes are protected
router.use(isAuthenticated);

// GET /api/v1/gmail-accounts (List all Gmail accounts linked by the current user)
router.get("/", gmailAccountController.listLinkedAccounts);

// DELETE /api/v1/gmail-accounts/:accountId (Unlink a specific Gmail account)
router.delete("/:accountId", gmailAccountController.unlinkGmailAccount);

// GET /api/v1/gmail-accounts/:accountId/profile
router.get(
  "/:accountId/profile",
  gmailAccountController.getUserProfileForAccount
);

// POST /api/v1/gmail-accounts/:accountId/sync/start (Manually trigger a sync for a specific account)
router.post(
  "/:accountId/sync/start",
  gmailAccountController.triggerAccountSync
);

// GET /api/v1/gmail-accounts/:accountId/sync/status (Get sync status for a specific account)
router.get(
  "/:accountId/sync/status",
  gmailAccountController.getAccountSyncStatus
);

// Note: Linking a new Gmail account is handled via /auth/google/link in auth.routes.ts
// which then calls a service that uses gmailAccount.service.ts

export default router;
