import { EMAILS_PER_PAGE } from "../constants"; // Default emails per page
import {
  addLabelsToEmailBatch,
  bulkAddLabelsToEmails,
  findLabelsByUserId,
} from "../database/labels.db";
import supabase from "../database/supabase";
import { processAILabelsInBackground } from "../jobs/labelProcessWorker";
import { getAuthenticatedGmailClients } from "./gmailApiService.provider";
import { getEmailGmailIds } from "../database/emails.db";

// USER LABELS

// Minimal interfaces to define the shape of Google's objects for type safety
interface GmailHeader {
  name?: string | null;
  value?: string | null;
}

interface GmailMessagePart {
  mimeType?: string | null;
  filename?: string | null;
  body?: {
    data?: string | null;
  };
}

interface GmailMessagePayload {
  headers?: GmailHeader[] | null;
  parts?: GmailMessagePart[] | null;
  body?: {
    data?: string | null;
  };
  mimeType?: string | null;
}

interface GmailMessage {
  id?: string | null;
  threadId?: string | null;
  labelIds?: (string | null)[] | null;
  snippet?: string | null;
  internalDate?: string | null;
  payload?: GmailMessagePayload | null;
}

// Your ParsedEmailData interface remains the same
interface ParsedEmailData {
  gmail_account_id: string;
  app_user_id: string;
  gmail_message_id: string;
  gmail_thread_id: string;
  subject?: string;
  from_address?: string;
  from_name?: string;
  to_addresses?: string[];
  sent_date?: Date;
  received_date?: Date;
  snippet?: string;
  body_plain_text?: string;
  body_html?: string;
  is_unread?: boolean;
  is_starred?: boolean;
  is_important?: boolean;
  gmail_category_label_id?: string;
  has_attachments?: boolean;
  label_ids?: (string | null)[];
}

// Assuming gmail_v1.Gmail type is not available due to heap issues, we use 'any'
type GmailClient = any; // Replace with gmail_v1.Gmail if you can import the type
type MessageHeader = { id?: string | null; threadId?: string | null };

/**
 * Fetches a list of message IDs from Gmail, automatically handling pagination.
 * @param gmail - The authenticated Gmail API client.
 * @param maxEmails - The total maximum number of message IDs to fetch.
 * @param query - An optional Gmail search query string (e.g., 'in:inbox').
 * @returns A promise that resolves to an array of message header objects.
 */
export async function fetchAllMessageIds(
  gmail: GmailClient,
  maxEmails: number,
  query: string = ""
): Promise<MessageHeader[]> {
  let nextPageToken: string | undefined | null = undefined;
  const allMessageHeaders: MessageHeader[] = [];

  console.log(`Fetching up to ${maxEmails} message IDs...`);

  try {
    do {
      // Determine how many results to fetch in this specific API call
      const remaining = maxEmails - allMessageHeaders.length;
      const limit = Math.min(remaining, 500); // Gmail API maxResults is 500

      const response: any = await gmail.users.messages.list({
        userId: "me",
        maxResults: limit,
        pageToken: nextPageToken,
        q: query,
        // You can also add fields for efficiency if needed, though list is lightweight
        // fields: 'messages(id,threadId),nextPageToken',
      });

      const messages = response.data.messages;
      if (messages && messages.length > 0) {
        allMessageHeaders.push(...messages);
        console.log(
          `Fetched ${allMessageHeaders.length} / ${maxEmails} message IDs so far...`
        );
      }

      nextPageToken = response.data.nextPageToken;

      // Stop if we have enough emails or if there are no more pages
    } while (nextPageToken && allMessageHeaders.length < maxEmails);

    console.log(
      `Finished fetching. Total message IDs found: ${allMessageHeaders.length}`
    );
    return allMessageHeaders;
  } catch (error) {
    console.error("Error fetching message IDs from Gmail:", error);
    // Depending on your error handling strategy, you might want to re-throw
    // or return the headers fetched so far.
    throw new Error("Failed to fetch message ID list from Gmail.");
  }
}

// A generic helper function for running promises with limited concurrency
async function processInLimitedBatches<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing = new Set<Promise<void>>();
  for (const item of items) {
    const promise = fn(item).then((result) => {
      results.push(result);
      executing.delete(promise);
    });
    executing.add(promise);
    if (executing.size >= limit) {
      await Promise.race(executing); // Wait for the fastest promise in the pool to finish
    }
  }
  await Promise.all(executing); // Wait for all remaining promises to finish
  return results;
}

// ... syncEmailsForAccount function ...
export async function syncEmailsForAccount(
  appUserId: string,
  gmailAccountId: string,
  maxEmails: number = 20
) {
  console.log(
    `Starting sync for user ${appUserId}, account ${gmailAccountId}...`
  );
  // ... (get gmail client and messageHeaders as before) ...
  const { gmail } = await getAuthenticatedGmailClients(
    appUserId,
    gmailAccountId
  );

  // 1. Get list of message IDs (e.g., 1000 of them)
  const messageHeaders = await fetchAllMessageIds(gmail, maxEmails); // A helper to get all IDs

  // 2. Process them with a concurrency limit
  const CONCURRENCY_LIMIT = 15; // A safe number, well below Google's limit of ~25-30
  console.log(
    `Fetching details for ${messageHeaders.length} emails with a concurrency of ${CONCURRENCY_LIMIT}...`
  );

  const parsedEmails = await processInLimitedBatches(
    messageHeaders,
    CONCURRENCY_LIMIT,
    async (header) => {
      if (!header.id) return null;
      try {
        const detailResponse = await gmail.users.messages.get({
          userId: "me",
          id: header.id,
          format: "full",
        });
        return parseGmailMessage(
          detailResponse.data as any,
          appUserId,
          gmailAccountId
        );
      } catch (error) {
        console.error(`Failed to fetch message ID ${header.id}:`, error);
        return null;
      }
    }
  );

  const validEmails = parsedEmails.filter((e) => e !== null);
  console.log(`Successfully parsed ${validEmails.length} emails.`);

  // 3. Upsert the results into Supabase in batches
  // Supabase (and most DBs) have a limit on how many rows you can upsert at once.
  // A batch size of 100-500 is usually safe.
  // Inside your main sync function...
  const BATCH_SIZE_DB = 250;
  const successfullyUpsertedEmails = [];

  for (let i = 0; i < validEmails.length; i += BATCH_SIZE_DB) {
    const batch = validEmails.slice(i, i + BATCH_SIZE_DB);

    const { error, data: upsertedData } = await supabase
      .from("emails")
      .upsert(batch, {
        // Assuming 'batch' has the right keys for the DB
        onConflict: "gmail_account_id, gmail_message_id",
      })
      .select("*"); // Select back the data you need for the next step

    if (error) {
      console.error("Supabase batch upsert error:", error);
      // Continue to next batch, or break if it's a critical error
      continue;
    } else {
      // Merge the returned ID with the original batch data if needed,
      // or just use the data returned from the SELECT.
      successfullyUpsertedEmails.push(...upsertedData);
      console.log(`Upserted batch of ${batch.length} emails to DB.`);
    }
  }

  const receivedEmails = successfullyUpsertedEmails.filter((email) => {
    // Exclude emails with SENT/DRAFT labels
    const hasExcludedLabels = email.label_ids?.some(
      (labelId: any) => labelId === "SENT" || labelId === "DRAFT"
    );
    // Only keep emails without excluded labels
    return !hasExcludedLabels;
  });

  // Now, process the successfully saved emails
  if (successfullyUpsertedEmails.length > 0) {
    console.log(
      `Email sync successful. Triggering AI label assignment for ${successfullyUpsertedEmails.length} emails.`
    );

    // This can be a long process. For a production app, you would
    // add this to a background job queue (e.g., BullMQ).
    // For now, we'll call it directly but without blocking the main sync function's "completion".
    processAILabelsInBackground(appUserId, receivedEmails);
  }
}

/**
 * Helper function to parse a raw Gmail API message object into our desired format.
 * @param message - The message object, typed with our minimal interface.
 * @returns A structured ParsedEmailData object or null.
 */
export function parseGmailMessage(
  message: GmailMessage,
  appUserId: string,
  gmailAccountId: string
): ParsedEmailData | null {
  if (!message.id || !message.threadId) return null;

  const getHeader = (name: string): string | undefined =>
    // --- FIX for TS7006 ---
    message.payload?.headers?.find((h: GmailHeader) => h.name === name)
      ?.value || undefined;

  const fromHeader = getHeader("From") || "";
  const fromMatch = fromHeader.match(/(.*)<(.*)>/);
  const from_name = fromMatch
    ? fromMatch[1].trim().replace(/"/g, "")
    : fromHeader;
  const from_address = fromMatch ? fromMatch[2].trim() : fromHeader;

  let body_plain_text = "";
  let body_html = "";
  if (message.payload?.parts) {
    // --- FIX for TS7006 ---
    const plainPart = message.payload.parts.find(
      (p: GmailMessagePart) => p.mimeType === "text/plain"
    );
    const htmlPart = message.payload.parts.find(
      (p: GmailMessagePart) => p.mimeType === "text/html"
    );
    if (plainPart?.body?.data)
      body_plain_text = Buffer.from(plainPart.body.data, "base64url").toString(
        "utf8"
      );
    if (htmlPart?.body?.data)
      body_html = Buffer.from(htmlPart.body.data, "base64url").toString("utf8");
  } else if (message.payload?.body?.data) {
    if (message.payload.mimeType === "text/plain") {
      body_plain_text = Buffer.from(
        message.payload.body.data,
        "base64url"
      ).toString("utf8");
    } else if (message.payload.mimeType === "text/html") {
      body_html = Buffer.from(message.payload.body.data, "base64url").toString(
        "utf8"
      );
    }
  }

  const label_ids = message.labelIds || [];

  return {
    gmail_account_id: gmailAccountId,
    app_user_id: appUserId,
    gmail_message_id: message.id,
    gmail_thread_id: message.threadId,
    subject: getHeader("Subject"),
    from_address,
    from_name,
    // --- FIX for TS7006 ---
    to_addresses: getHeader("To")
      ?.split(",")
      .map((s: string) => s.trim()),
    sent_date: new Date(getHeader("Date") || Date.now()),
    received_date: new Date(parseInt(message.internalDate || "0", 10)),
    snippet: message.snippet || undefined,
    body_plain_text,
    body_html,
    is_unread: label_ids.includes("UNREAD"),
    is_starred: label_ids.includes("STARRED"),
    is_important: label_ids.includes("IMPORTANT"),
    // --- FIX for TS7006 ---
    gmail_category_label_id:
      label_ids.find(
        (l: string | null) => typeof l === "string" && l.startsWith("CATEGORY_")
      ) || undefined,
    // --- FIX for TS7006 ---
    has_attachments: !!message.payload?.parts?.some(
      (p: GmailMessagePart) => p.filename && p.filename.length > 0
    ),
    label_ids,
  };
}

// Define an interface for the query options for better type safety
export interface GetEmailsOptions {
  appUserId: string;
  limit?: number;
  page?: number;
  category?: string; // e.g., 'CATEGORY_SOCIAL', 'CATEGORY_PROMOTIONS'
  isStarred?: boolean;
  isUnread?: boolean;
  accountId?: string; // Filter by a specific linked Gmail account
}

/**
 * Fetches the full details of a single email from the database.
 * @param appUserId - The user's ID in your application.
 * @param emailId - The internal UUID of the email in your database.
 * @returns A promise that resolves to the full email object or null if not found.
 */
export async function fetchSingleEmailFromDb(
  appUserId: string,
  emailId: string
) {
  const { data, error } = await supabase
    .from("emails")
    .select("*") // Select all details for the single view
    .eq("app_user_id", appUserId) // **SECURITY: Ensure this user owns this email!**
    .eq("id", emailId)
    .single(); // Expect only one result

  if (error) {
    // 'PGRST116' is the code for "0 rows found", which is not a server error.
    if (error.code === "PGRST116") {
      return null;
    }
    console.error(`Error fetching single email (id: ${emailId}):`, error);
    throw new Error("Failed to fetch email details.");
  }

  // TODO: You might also want to join and fetch ai_data here
  // e.g., const { data: aiData } = await supabase.from('ai_data').select('*').eq('email_id', emailId).single();
  // and then combine them before returning.

  return data;
}

// export async function assignLabelsToEmails(
//   appUserId: string,
//   labels: any[], // Should have type { id: string; name: string; prompt: string }
//   emails: any[] // Should have type { id: string; subject: string; from_name: string }
// ) {
//   if (!labels || labels.length === 0 || !emails || emails.length === 0) {
//     console.log("No labels or emails to process for AI assignment.");
//     return;
//   }

//   // Preprocess labels once
//   const processedLabels = labels.map((label) => ({
//     name: label.name,
//     criteria: label.prompt,
//   }));

//   // Create a map of all label associations to be inserted into the DB later
//   const emailLabelInserts: { email_id: string; label_id: string }[] = [];

//   // Use a for...of loop to correctly handle await
//   for (const email of emails) {
//     try {
//       const { id: emailId, subject, from_name: from } = email;
//       const importantInfo = { subject, from };

//       // Make the LLM call for the current email
//       const llmResponse: boolean[] = await assignLabels_LLM(
//         importantInfo,
//         processedLabels
//       );

//       // Collect the label IDs that should be applied to this email
//       const selectedLabelIds = labels
//         .filter((label, index) => llmResponse?.[index] === true)
//         .map((label) => label.id);

//       if (selectedLabelIds.length > 0) {
//         // Add the associations to our bulk insert array
//         for (const labelId of selectedLabelIds) {
//           emailLabelInserts.push({ email_id: emailId, label_id: labelId });
//         }
//       }
//     } catch (error) {
//       // Log error for the specific email but continue with the rest
//       console.error(`Failed to assign labels for email ID ${email.id}:`, error);
//     }
//   }

//   // After processing all emails, perform a SINGLE bulk insert
//   if (emailLabelInserts.length > 0) {
//     console.log(
//       `Applying ${emailLabelInserts.length} total label associations to the database...`
//     );
//     try {
//       // This function should be designed to take an array of { email_id, label_id }
//       const response = await bulkAddLabelsToEmails(
//         appUserId,
//         emailLabelInserts
//       );
//       console.log("Bulk label assignment response:", response);
//     } catch (error) {
//       console.error("Failed to bulk insert email-label associations:", error);
//     }
//   }
// }

// SYSTEM LABELS

export interface GetEmailsOptions {
  appUserId: string;
  limit?: number;
  page?: number;
  emailAccountIds: string[];
  systemView:
    | "INBOX"
    | "SPAM"
    | "TRASH"
    | "ARCHIVED"
    | "ALL_MAIL"
    | "SENT"
    | "DRAFT"
    | "STARRED"
    | "IMPORTANT"
    | "UNREAD"; // Define possible system views
  userLabelId?: string; // For user-defined labels
  inboxCategory?: "all" | "other" | "label";
}

export async function fetchEmailList(options: GetEmailsOptions) {
  const {
    appUserId,
    emailAccountIds,
    systemView,
    limit = 20,
    page = 1,
    inboxCategory,
    userLabelId,
  } = options;
  console.log(options);

  const offset = (page - 1) * limit;
  let query;
  if (systemView === "INBOX") {
    if (inboxCategory === "label") {
      // Handle user-defined labels via a JOIN
      query = supabase
        .from("email_labels")
        .select(
          `
    emails!inner(
      *,
      gmail_account:gmail_account_id(
        gmail_address, avatar_url, gmail_name, id
      )
    )
  `,
          {
            count: "exact",
            head: false,
          }
        )
        .eq("label_id", userLabelId)
        .contains("emails.label_ids", ["INBOX"]) // Filter for emails in the Inbox
        .in("emails.gmail_account_id", emailAccountIds)
        .order("received_date", { foreignTable: "emails", ascending: false })
        .range(offset, offset + limit - 1);
    } else if (inboxCategory === "other") {
      // Handle user-defined labels via a LEFT JOIN
      const [dataResponse, countResponse] = await Promise.all([
        supabase.rpc("get_paginated_unlabeled_inbox", {
          p_app_user_id: appUserId,
          p_account_ids: emailAccountIds,
          p_limit: limit,
          p_offset: offset,
        }),
        supabase.rpc("get_unlabeled_inbox_emails_count", {
          p_app_user_id: appUserId,
          p_account_ids: emailAccountIds,
        }),
      ]);
      if (dataResponse.error) throw dataResponse.error;
      if (countResponse.error) throw countResponse.error;

      const emails = dataResponse.data.data || []; // The data is inside the 'data' property of the returned JSON
      const totalCount = countResponse.data || 0;
      const hasNextPage = page * limit < totalCount;
      return {
        emails: emails,
        hasNextPage,
        currentPage: page,
        nextPage: hasNextPage ? page + 1 : null,
      };
    } else {
      // inboxCateg === "all"
      query = supabase
        .from("emails")
        .select(
          `*,gmail_account:gmail_account_id(
        gmail_address, avatar_url, gmail_name, id
      )`,
          {
            count: "exact",
            head: false,
          }
        )
        .eq("app_user_id", appUserId) // Filter by the app user
        .contains("label_ids", ["INBOX"]) // Filter for emails in the Inbox
        .in("gmail_account_id", emailAccountIds)
        .order("received_date", { ascending: false })
        .range(offset, offset + limit - 1);
    }
  } else {
    // Handle system views
    query = supabase
      .from("emails")
      .select(
        `*,gmail_account:gmail_account_id(
        gmail_address, avatar_url, gmail_name, id
      )`,
        { count: "exact" }
      )
      .eq("app_user_id", appUserId)
      .order("received_date", { ascending: false })
      .range(offset, offset + limit - 1)
      .in("gmail_account_id", emailAccountIds);

    // Apply filter based on the systemView parameter
    switch (systemView) {
      case "SPAM":
        query = query.contains("label_ids", ["SPAM"]);
        break;
      case "TRASH":
        query = query.contains("label_ids", ["TRASH"]);
        break;
      case "SENT":
        query = query.contains("label_ids", ["SENT"]);
        break;
      case "DRAFT":
        query = query.contains("label_ids", ["DRAFT"]);
        break;
      case "STARRED":
        query = query.eq("is_starred", true);
        break;
      case "IMPORTANT":
        query = query.eq("is_important", true);
        break;
      case "UNREAD":
        query = query.eq("is_unread", true);
        break;
      case "ARCHIVED":
        query = query
          .not("label_ids", "cs", "{INBOX}")
          .not("label_ids", "cs", "{TRASH}")
          .not("label_ids", "cs", "{SPAM}")
          .not("label_ids", "cs", "{SENT}")
          .not("label_ids", "cs", "{DRAFT}");
        break;
      case "ALL_MAIL":
        // Everything except SPAM and TRASH
        query = query
          .not("label_ids", "cs", "{TRASH}")
          .not("label_ids", "cs", "{SPAM}");
        break;
      default:
        // Default to INBOX if no view is specified
        query = query.contains("label_ids", ["INBOX"]);
    }
  }

  const { data: emails, error, count } = await query;
  if (error) {
    console.log(JSON.stringify(error));
    console.log("Error occured in fetchEmailList");
    throw new Error(error);
  }

  // Shape the query result
  let emailList;
  if (emails[0]?.emails) {
    emailList = emails?.map((val: any) => val.emails);
  } else if (inboxCategory === "other") {
    emailList = emails.data;
  } else {
    emailList = emails;
  }

  const hasNextPage = page * limit < count;
  return {
    emails: emailList,
    hasNextPage,
    currentPage: page,
    nextPage: hasNextPage ? page + 1 : null,
  };
}

export async function upsertEmailsToDb(
  emails: ParsedEmailData[],
  batchSize: number = 25
) {
  if (!emails || emails.length === 0) {
    return [];
  }

  const allUpsertedData = [];

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    console.log(`Upserting batch of ${batch.length} emails to DB...`);

    const { data: upsertedData, error } = await supabase
      .from("emails")
      .upsert(batch, {
        onConflict: "gmail_account_id, gmail_message_id", // Your unique constraint
        ignoreDuplicates: false, // Ensure updates happen on conflict
      })
      .select("id, subject, from_name"); // Select back fields needed for subsequent steps (like AI labeling)

    if (error) {
      console.error("Supabase batch upsert error:", error);
      // For production, you might want more granular error handling,
      // like logging which specific batch failed. For now, we'll throw.
      throw new Error(`Failed to upsert email batch: ${error.message}`);
    }

    if (upsertedData) {
      allUpsertedData.push(...upsertedData);
    }
  }

  console.log(`Finished upserting ${allUpsertedData.length} total emails.`);
  return allUpsertedData;
}

/**
 * A generic function to modify an email's labels in Gmail and update the local DB.
 * @param appUserId - The app's user ID.
 * @param internalEmailId - The email's UUID in your DB.
 * @param addLabelIds - Array of Gmail label IDs to add (e.g., ['STARRED']).
 * @param removeLabelIds - Array of Gmail label IDs to remove (e.g., ['UNREAD']).
 */
export async function modifyEmailLabels(
  appUserId: string,
  internalEmailId: string,
  addLabelIds: string[] = [],
  removeLabelIds: string[] = []
) {
  // 1. Get the necessary IDs from our DB
  const { gmail_message_id, gmail_account_id } = await getEmailGmailIds(
    appUserId,
    internalEmailId
  );

  // 2. Get an authenticated Gmail client for the correct account
  const { gmail } = await getAuthenticatedGmailClients(
    appUserId,
    gmail_account_id
  );

  // 3. Perform the action on the Gmail API
  await gmail.users.messages.modify({
    userId: "me",
    id: gmail_message_id,
    requestBody: {
      addLabelIds,
      removeLabelIds,
    },
  });

  // 4. Update YOUR local database immediately
  // This part is a bit tricky, but we can do it with a DB function or by fetching/updating.
  // Let's do a fetch then update for clarity.
  const { data: currentEmail, error: fetchError } = await supabase
    .from("emails")
    .select("label_ids")
    .eq("id", internalEmailId)
    .single();

  if (fetchError) throw fetchError;

  // Calculate the new set of labels
  const currentLabels = new Set(currentEmail.label_ids || []);
  addLabelIds.forEach((label) => currentLabels.add(label));
  removeLabelIds.forEach((label) => currentLabels.delete(label));
  const newLabelIds = Array.from(currentLabels);

  // Update the DB record with the new state
  const { data: updatedEmail, error: updateError } = await supabase
    .from("emails")
    .update({
      label_ids: newLabelIds,
      is_starred: newLabelIds.includes("STARRED"),
      is_unread: newLabelIds.includes("UNREAD"),
    })
    .eq("id", internalEmailId)
    .select("*") // Select the full updated record to return to the frontend
    .single();

  if (updateError) throw updateError;

  return updatedEmail;
}
