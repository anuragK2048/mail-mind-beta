import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URI,
} from "./environment";
// import { google } from "googleapis"; #TODO always gives error
const google = require("googleapis").google; // Use require and type as any

export const baseOauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URI
);

export const GMAIL_SCOPES = [
  "openid", // <--- ESSENTIAL for ID Token
  "https://www.googleapis.com/auth/userinfo.email", // <--- For email in ID Token
  "https://www.googleapis.com/auth/userinfo.profile", // <--- For profile info in ID Token
  "https://www.googleapis.com/auth/gmail.modify",
];
