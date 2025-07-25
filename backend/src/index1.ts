import { google } from "googleapis";

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import "dotenv/config";

const DATA_PATH = path.join(process.cwd(), "./data/sampleData.json");
const FRONTEND_URL = "http://localhost:5173";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const GMAIL_SCOPES = [
  "openid", // <--- ESSENTIAL for ID Token
  "https://www.googleapis.com/auth/userinfo.email", // <--- For email in ID Token
  "https://www.googleapis.com/auth/userinfo.profile", // <--- For profile info in ID Token
  "https://www.googleapis.com/auth/gmail.readonly", // Your existing Gmail scope
];

app.get("/auth/google", async (req, res) => {
  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GMAIL_SCOPES, // Make sure this array includes the OIDC scopes
    prompt: "consent",
    // state: state,
  });
  res.redirect(authorizationUrl);
});

app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code as string;
  //check state
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log(tokens);
    oauth2Client.setCredentials(tokens);
    // --- IMPORTANT: Validate ID Token ---
    if (tokens.id_token) {
      const loginTicket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: CLIENT_ID,
      });
      const payload = loginTicket.getPayload();

      if (!payload) {
        throw new Error("Invalid ID token payload");
      }

      const googleUserId = payload.sub;
      const email = payload.email;
      const name = payload.name;
      // const picture = payload.picture;
      console.log(
        `User authenticated: ${email} (Google ID: ${googleUserId}) name: ${name}`
      ); //Entry in DB

      res.redirect(`${FRONTEND_URL}/dashboard`);
      // const gmail = google.gmail({version:"v1",auth: oauth2Client});
    } else {
      throw new Error("ID token missing from Google response.");
    }
  } catch (error) {
    console.error("Error during Google OAuth callback:", error);
    // Redirect to an error page on the frontend
    res.redirect(`${FRONTEND_URL}/login-failed?error=oauth_error`);
  }
});

app.post("/api/oauth2callback", async (req, res) => {
  // const { code } = req.body;

  try {
    // const { tokens } = await oauth2Client.getToken("");
    // oauth2Client.setCredentials(tokens);
    oauth2Client.setCredentials({
      refresh_token: "",
    });

    // You can now access Gmail API on behalf of the user
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Example: get user's Gmail profile
    // const profile = await gmail.users.getProfile({ userId: "me" });

    // if (gmail) {
    //   try {
    //     const messages = await getEmailList(gmail, 20);
    //     const messagesContent = messages.map(async (message) => {
    //       const details = await getEmailDetails(gmail, message.id);
    //       return details;
    //     });
    //     const results = await Promise.all(messagesContent);
    //     writeDataToJSONFile(results);
    //     res.json({ message: results });
    //   } catch (error) {
    //     console.error("Error fetching email list:", error);
    //   }
    // }

    // res.json({
    //   email: profile.data.emailAddress,
    //   messageIds: messages,
    //   tokens,
    // });
  } catch (error) {
    console.error("Error exchanging code:", error);
    res.status(500).json({ error: "Failed to authenticate with Google" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function writeDataToJSONFile(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}
