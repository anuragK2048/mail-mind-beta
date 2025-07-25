// import type { Auth, gmail_v1 } from "googleapis";

// 2. Use require() to get the actual runtime code, and type it as 'any' to avoid the initial load error
// We can't apply a strong type here directly, as that would cause the same problem.
const google: any = require("googleapis").google;
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "../config";
import { getDecryptedUserRefreshToken } from "./token.service"; // Your service to get/decrypt refresh token from DB

export interface AuthenticatedGmailClients {
  oauth2Client: any;
  gmail: any;
}

/**
 * Creates an authenticated Google API client for a specific user's linked Gmail account.
 * This is the central point for all backend-to-Google API interactions.
 *
 * @param appUserId - Your app's internal user ID.
 * @param gmailAccountId - The ID of the specific gmail_accounts record.
 * @returns A promise resolving to an object with the configured oauth2Client and gmail service.
 * @throws Error if the refresh token cannot be found, indicating re-authentication is needed.
 */
export async function getAuthenticatedGmailClients(
  appUserId: string,
  gmailAccountId: string
): Promise<AuthenticatedGmailClients> {
  // 1. Get the user's securely stored refresh token for the specific Gmail account
  const refreshToken = await getDecryptedUserRefreshToken(
    appUserId,
    gmailAccountId
  );

  if (!refreshToken) {
    throw new Error(
      `Authentication token not found for account ${gmailAccountId}. Re-authentication required.`
    );
  }

  // 2. Create a new OAuth2Client instance for this request
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );

  // 3. Set the refresh token. The library will handle access token refreshing automatically.
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  // 4. Create the Gmail service object
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  return { oauth2Client, gmail };
}
