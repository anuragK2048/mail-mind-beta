import fs from "fs/promises";
import path from "path";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import { get } from "http";

//Define scopes
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];

//Fetch and store token from files
const TOKEN_PATH = path.join(process.cwd(), "./credentials/token.json");
const CREDENTIALS_PATH = path.join(
  process.cwd(),
  "./credentials/credentials.json"
);

//Read previously authorized credentials from saved file
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

//Save credentials to token file
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.web || keys.installed;
  //   const token = await client.getAccessToken();
  const payload = {
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  };
  //   await fs.writeFile(TOKEN_PATH, payload);
  await fs.writeFile(TOKEN_PATH, JSON.stringify(payload));
}

//Authorize a client with credentials, then call the Gmail API
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  console.log("hi");
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

//Get the Gmail API
async function getGmailApi() {
  const auth = await authorize();
  // console.log(auth.credentials.refresh_token);
  const gmail = google.gmail({ version: "v1", auth });
  return gmail;
}

// module.exports = getGmailApi;
export default getGmailApi;
