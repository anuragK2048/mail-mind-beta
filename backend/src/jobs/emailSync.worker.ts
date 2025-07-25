// src/jobs/emailSync.worker.ts
import { Worker, Job, WorkerOptions } from "bullmq";
import { REDIS_URL } from "../config"; // Your Redis connection URL
// Import your email parsing and saving logic from email.service.ts
import { parseGmailMessage, upsertEmailsToDb } from "../services/email.service";
import { getAuthenticatedGmailClients } from "../services/gmailApiService.provider";
import supabase from "../database/supabase";
import { processAILabelsInBackground } from "./labelProcessWorker";

const workerOptions: WorkerOptions = {
  connection: REDIS_URL
    ? {
        host: new URL(REDIS_URL).hostname,
        port: Number(new URL(REDIS_URL).port),
        password: new URL(REDIS_URL).password,
      }
    : {
        host: "localhost",
        port: 6379,
      },
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000,
  },
};

const processSyncJob = async (job: Job) => {
  const { appUserId, gmailAccountId, startHistoryId, newHistoryId } = job.data;
  console.log(
    `Worker processing job ${job.id}: Syncing account ${gmailAccountId} from historyId ${startHistoryId}`
  );

  try {
    const { gmail } = await getAuthenticatedGmailClients(
      appUserId,
      gmailAccountId
    );

    const historyResponse = await gmail.users.history.list({
      userId: "me",
      startHistoryId: startHistoryId,
      // You can specify historyTypes to be more efficient, e.g., 'messageAdded', 'labelAdded'
    });

    const historyRecords = historyResponse.data.history;
    console.log(historyResponse.data.history);
    if (!historyRecords || historyRecords.length === 0) {
      console.log(`No new history for job ${job.id}. Updating historyId.`);
      await supabase
        .from("gmail_accounts")
        .update({ last_sync_history_id: newHistoryId })
        .eq("id", gmailAccountId);
      return;
    }

    // --- Process Different History Types ---
    const addedMessageIds = new Set<string>();
    const deletedMessageIds = new Set<string>();
    const messagesWithLabelChanges = new Map<
      string,
      { added: string[]; removed: string[] }
    >();

    console.log(JSON.stringify(historyRecords));
    console.log(historyRecords);
    historyRecords.forEach((record: any) => {
      // 1. Messages Added
      record.messagesAdded?.forEach((msg: any) => {
        if (msg.message?.id) addedMessageIds.add(msg.message.id);
      });

      // 2. Messages Deleted
      record.messagesDeleted?.forEach((msg: any) => {
        if (msg.message?.id) deletedMessageIds.add(msg.message.id);
      });

      // 3. Labels Added to a message
      record.labelsAdded?.forEach((labelUpdate: any) => {
        if (labelUpdate.message?.id) {
          const changes = messagesWithLabelChanges.get(
            labelUpdate.message.id
          ) || { added: [], removed: [] };
          changes.added.push(...(labelUpdate.labelIds || []));
          messagesWithLabelChanges.set(labelUpdate.message.id, changes);
        }
      });

      // 4. Labels Removed from a message
      record.labelsRemoved?.forEach((labelUpdate: any) => {
        if (labelUpdate.message?.id) {
          const changes = messagesWithLabelChanges.get(
            labelUpdate.message.id
          ) || { added: [], removed: [] };
          changes.removed.push(...(labelUpdate.labelIds || []));
          messagesWithLabelChanges.set(labelUpdate.message.id, changes);
        }
      });
    });

    // --- Execute Actions Based on a_i_labelsProcessed Changes ---

    // A. Handle DELETED messages
    if (deletedMessageIds.size > 0) {
      console.log(
        `Job ${job.id}: Deleting ${deletedMessageIds.size} message(s) from local DB.`
      );
      const idsToDelete = Array.from(deletedMessageIds);
      // Delete from your DB where gmail_message_id is in the list
      await supabase
        .from("emails")
        .delete()
        .in("gmail_message_id", idsToDelete)
        .eq("gmail_account_id", gmailAccountId);
    }

    // B. Handle ADDED messages (fetch, parse, save)
    if (addedMessageIds.size > 0) {
      console.log(
        `Job ${job.id}: Fetching ${addedMessageIds.size} new message(s).`
      );
      const newEmails = [];
      for (const messageId of addedMessageIds) {
        const detailResponse = await gmail.users.messages.get({
          userId: "me",
          id: messageId,
          format: "full",
        });
        const parsed = parseGmailMessage(
          detailResponse.data as any,
          appUserId,
          gmailAccountId
        );
        if (parsed) newEmails.push(parsed);
      }
      if (newEmails.length > 0) {
        const upsertedEmails = await upsertEmailsToDb(newEmails);
        await processAILabelsInBackground(appUserId, upsertedEmails); // Trigger AI for new emails
      }
    }

    // C. Handle LABEL CHANGES on existing messages
    if (messagesWithLabelChanges.size > 0) {
      console.log(
        `Job ${job.id}: Processing label changes for ${messagesWithLabelChanges.size} message(s).`
      );

      for (const [messageId, changes] of messagesWithLabelChanges.entries()) {
        const { data: currentEmail, error } = await supabase
          .from("emails")
          .select("id, label_ids, is_starred, is_unread")
          .eq("gmail_message_id", messageId)
          .eq("gmail_account_id", gmailAccountId)
          .single();

        if (error || !currentEmail) {
          console.warn(
            `Label change for message ${messageId} received, but not in local DB. Skipping.`
          );
          continue;
        }

        // --- THE COMPARISON LOGIC ---

        // 1. Calculate the new proposed state
        const currentLabels = new Set(currentEmail.label_ids || []);
        changes.added.forEach((label) => currentLabels.add(label));
        changes.removed.forEach((label) => currentLabels.delete(label));
        const newLabelIds = Array.from(currentLabels);
        const newIsStarred = newLabelIds.includes("STARRED");
        const newIsUnread = newLabelIds.includes("UNREAD");

        // 2. Compare with the current state in the DB
        // We check if the boolean flags are already what they should be.
        // You could also do a more complex array comparison if needed, but flags are efficient.
        const isStarredSame = currentEmail.is_starred === newIsStarred;
        const isUnreadSame = currentEmail.is_unread === newIsUnread;
        // You can add more checks here (e.g., for custom labels if you track them)

        if (isStarredSame && isUnreadSame) {
          // If the important states already match, we can ignore this update.
          console.log(
            `Job ${job.id}: Ignoring redundant label update for message ${messageId}. State already in sync.`
          );
          continue; // Move to the next message
        }

        // 3. If states are different, proceed with the update
        console.log(
          `Job ${job.id}: Applying label update for message ${messageId}.`
        );
        await supabase
          .from("emails")
          .update({
            label_ids: newLabelIds,
            is_starred: newIsStarred,
            is_unread: newIsUnread,
          })
          .eq("id", currentEmail.id);
      }
    }

    // --- Final Step ---
    // CRITICAL: Update the last_sync_history_id to the new ID for the next sync
    await supabase
      .from("gmail_accounts")
      .update({ last_sync_history_id: newHistoryId })
      .eq("id", gmailAccountId);

    console.log(`Worker for job ${job.id} finished successfully.`);
  } catch (error) {
    console.error(`Worker for job ${job.id} failed:`, error);
    throw error;
  }
};

// Create and start the worker
console.log("Starting Gmail Sync Worker...");
new Worker("gmail-sync", processSyncJob, workerOptions);
