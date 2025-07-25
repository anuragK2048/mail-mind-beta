// In a new service, e.g., src/services/sync.service.ts
import { GOOGLE_PUB_SUB_TOPIC_NAME } from "../config"; // e.g., 'projects/your-gcp-project/topics/gmail-updates'
import supabase from "../database/supabase";
import { getAuthenticatedGmailClients } from "./gmailApiService.provider";

export async function startWatchForAccount(
  appUserId: string,
  gmailAccountId: string
) {
  // Check if a valid watch is already active to avoid unnecessary calls
  const { data: account } = await supabase
    .from("gmail_accounts")
    .select("watch_expiry")
    .eq("id", gmailAccountId)
    .single();
  if (
    account &&
    account.watch_expiry &&
    new Date(account.watch_expiry) > new Date()
  ) {
    console.log(`Watch is already active for account ${gmailAccountId}.`);
    return;
  }

  const { gmail } = await getAuthenticatedGmailClients(
    appUserId,
    gmailAccountId
  );

  try {
    const response = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName: GOOGLE_PUB_SUB_TOPIC_NAME,
        // labelIds: ['INBOX'], // Be specific to reduce noise
      },
    });

    const historyId = response.data.historyId;
    const expiration = response.data.expiration; // This is a string timestamp in milliseconds

    if (historyId && expiration) {
      // Store the new historyId and the expiration date in your DB
      await supabase
        .from("gmail_accounts")
        .update({
          last_sync_history_id: historyId,
          watch_expiry: new Date(parseInt(expiration, 10)).toISOString(),
        })
        .eq("id", gmailAccountId);

      console.log(
        `Successfully started watch for account ${gmailAccountId} History Id: ${historyId}. Expiry: ${new Date(
          parseInt(expiration, 10)
        )}`
      );
    }
  } catch (error) {
    console.error(
      `Failed to start watch for account ${gmailAccountId}:`,
      error
    );
    // Handle error, e.g., if user has revoked permissions
  }
}

export async function stopWatchForAccount(
  appUserId: string,
  gmailAccountId: string
) {
  // You don't need the refresh token for `stop`, just an authenticated client.
  // A service account can be used here, or a short-lived user token.
  // For simplicity, we'll use the user's client.
  const { gmail } = await getAuthenticatedGmailClients(
    appUserId,
    gmailAccountId
  );

  try {
    await gmail.users.stop({ userId: "me" });

    // Clear the watch expiry from your database
    await supabase
      .from("gmail_accounts")
      .update({ watch_expiry: null })
      .eq("id", gmailAccountId);

    console.log(`Successfully stopped watch for account ${gmailAccountId}.`);
  } catch (error: any) {
    // It's common for this to fail if the watch already expired.
    // We can often safely ignore '404 Not Found' errors here.
    if (error.code !== 404) {
      console.error(
        `Failed to stop watch for account ${gmailAccountId}:`,
        error.message
      );
    } else {
      console.log(
        `Watch for account ${gmailAccountId} likely already expired. Clearing from DB.`
      );
      // Still clear the expiry in the DB
      await supabase
        .from("gmail_accounts")
        .update({ watch_expiry: null })
        .eq("id", gmailAccountId);
    }
  }
}
