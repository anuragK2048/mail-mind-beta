// generate oauthflowcontent
import { GOOGLE_CLIENT_ID, baseOauth2Client, GMAIL_SCOPES } from "../config";
const google: any = require("googleapis").google;

export const generateGoogleOAuthURL = (csrfToken: string) => {
  const authorizationUrl = baseOauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GMAIL_SCOPES,
    prompt: "consent",
    state: csrfToken,
    // Enable incremental authorization. Recommended as a best practice.
    // include_granted_scopes: true
  });
  return authorizationUrl;
};

// Define the shape of the data this function will return
export interface ValidatedGoogleUser {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  refreshToken: string;
}

export async function validateUser(code: string): Promise<ValidatedGoogleUser> {
  // 1. Exchange authorization code for tokens
  const { tokens } = await baseOauth2Client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error(
      "Refresh token missing from Google's response. Offline access may not have been granted."
    );
  }

  if (!tokens.id_token) {
    throw new Error("ID token missing from Google's response.");
  }

  const userOauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID);
  userOauth2Client.setCredentials(tokens);

  const loginTicket = await userOauth2Client.verifyIdToken({
    idToken: tokens.id_token,
    audience: GOOGLE_CLIENT_ID,
  });
  const idTokenPayload = loginTicket.getPayload();

  if (!idTokenPayload || !idTokenPayload.sub || !idTokenPayload.email) {
    throw new Error("Invalid ID token payload.");
  }

  // Fetch Profile from People API
  let avatarUrl: string | null = null;
  try {
    const people = google.people({ version: "v1", auth: userOauth2Client });
    const profileResponse = await people.people.get({
      resourceName: "people/me",
      personFields: "photos",
    });
    avatarUrl = profileResponse.data.photos?.[0]?.url || null;
  } catch (error) {
    console.warn(
      "Could not fetch user avatar from People API. Proceeding without it.",
      error
    );
    avatarUrl = idTokenPayload.picture || null;
  }

  return {
    googleId: idTokenPayload.sub,
    email: idTokenPayload.email,
    fullName: idTokenPayload.name || null,
    avatarUrl: avatarUrl,
    refreshToken: tokens.refresh_token,
  };
}
