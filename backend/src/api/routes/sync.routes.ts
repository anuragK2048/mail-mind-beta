// src/api/routes/sync.routes.ts
import express from "express";
import * as syncController from "../controllers/sync.controller";

const router = express.Router();

// This is the endpoint Google Pub/Sub will POST to.
// Make sure it can handle raw JSON bodies.
router.post("/gmail-webhook", syncController.handleGmailNotification);

router.post("/start-watch", syncController.handleWatchStart);

export default router;
