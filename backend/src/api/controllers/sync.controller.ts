// src/api/controllers/sync.controller.ts
import { Request, Response, NextFunction } from "express";
import { asyncWrapper } from "../../middleware/asyncWrapper";
import { getLinkedAccountsForUser } from "../../database/gmail_accounts.db";
import { startWatchForAccount } from "../../services/sync.service";
import { gmailSyncQueue } from "../../jobs/queue.setup";
import supabase from "../../database/supabase";
// In a real app, you would import a function to add a job to your queue (e.g., BullMQ)
// import { addGmailSyncJob } from '../../jobs/emailSync.queue';

export const handleGmailNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Log the raw request for debugging (optional but recommended initially)
    console.log("Received a POST request on /gmail-webhook");
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Body:", JSON.stringify(req.body, null, 2));

    // 2. Acknowledge the message IMMEDIATELY.
    res.status(204).send();

    // 3. Process the payload.
    const pubSubMessage = req.body.message;
    if (!pubSubMessage || !pubSubMessage.data) {
      console.warn("Webhook received but no message data found.");
      return; // Exit gracefully
    }

    // 4. Decode the data from Base64.
    const decodedData = JSON.parse(
      Buffer.from(pubSubMessage.data, "base64").toString("utf8")
    );

    const userEmailAddress: string = decodedData.emailAddress;
    const newHistoryId: string = decodedData.historyId;

    console.log(
      `Notification received for user: ${userEmailAddress}, New History ID: ${newHistoryId}`
    );

    // Find the user and account in our DB to get our internal IDs.
    const { data: account, error } = await supabase
      .from("gmail_accounts")
      .select("id, app_user_id, last_sync_history_id")
      .eq("gmail_address", userEmailAddress)
      .single();

    if (error || !account) {
      console.error(
        `Could not find a linked account for email: ${userEmailAddress}`
      );
      return;
    }

    // Add a job to the queue.
    // 'sync-changes' is the name of this specific job type.
    // The data object contains everything our worker will need.
    await gmailSyncQueue.add("sync-changes", {
      appUserId: account.app_user_id,
      gmailAccountId: account.id,
      startHistoryId: account.last_sync_history_id, // The last point we synced from
      newHistoryId: newHistoryId, // The new point we need to sync to
    });
  } catch (error) {
    console.error("Error in /gmail-webhook:", error);
    // We've already sent a 204 response, so we can only log the error server-side.
  }
};

export const handleWatchStart = asyncWrapper(
  async (req: Request, res: Response) => {
    const appUserId = req.session.userId!;
    const emailAccounts = await getLinkedAccountsForUser(appUserId);

    // const startPromises = emailAccounts.map((account) =>
    //   startWatchForAccount(appUserId, account.id)
    // );
    // await Promise.allSettled(startPromises);

    res
      .status(200)
      .json({ message: "Started watching for emails successfully" });
  }
);
