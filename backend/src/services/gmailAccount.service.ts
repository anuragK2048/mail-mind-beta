// src/services/userService.ts
import { getAuthenticatedGmailClients } from "./gmailApiService.provider";
// Import your database interaction functions if needed (e.g., to update your DB)
// import { updateUserProfileInDb } from '../database/userRepository';

export interface UserProfile {
  emailAddress: string | null | undefined;
  // Add other profile fields you want to expose
}

/**
 * Fetches the user's profile from the Gmail API for a specific linked account.
 * @param appUserId - The user's ID in your application.
 * @param gmailAccountId - The specific linked Gmail account to query.
 * @returns The user's profile information.
 */
export async function fetchGoogleProfile(
  appUserId: string,
  gmailAccountId: string
): Promise<UserProfile> {
  try {
    // 1. Get the authenticated client for this specific user and account
    const { gmail } = await getAuthenticatedGmailClients(
      appUserId,
      gmailAccountId
    );

    // 2. Make the specific API call
    const profileResponse = await gmail.users.getProfile({ userId: "me" });

    // 3. Map the response to a clean data transfer object (DTO)
    const profileData = {
      emailAddress: profileResponse.data.emailAddress,
      otherDetails: profileResponse.data,
    };

    // Optional: Update your own database with this fresh profile info
    // await updateUserProfileInDb(appUserId, { email: profileData.emailAddress });

    return profileData;
  } catch (error: any) {
    console.error(
      `Error fetching profile for user ${appUserId}, account ${gmailAccountId}:`,
      error.message
    );
    // Re-throw the error or throw a custom error to be handled by the controller
    // This allows the controller to check for 'invalid_grant' or other specific errors.
    throw error;
  }
}
