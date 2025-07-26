import https from "https";
import querystring from "querystring";
import { getEncryptedRefreshToken } from "../database/gmail_accounts.db";
import { string } from "zod/v4";
import { decrypt } from "../utils/crypto.utils";

export const revokeGoogleToken = (tokenToRevoke: string): string | void => {
  const postData = querystring.stringify({ token: tokenToRevoke });

  const postOptions: https.RequestOptions = {
    hostname: "oauth2.googleapis.com", // 'host' is deprecated in favor of 'hostname'
    port: 443, // Default HTTPS port, often not needed if using https.request
    path: "/revoke",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const postReq = https.request(postOptions, (res) => {
    let responseBody = "";
    res.setEncoding("utf8");
    res.on("data", (chunk) => {
      responseBody += chunk;
    });

    res.on("end", () => {
      if (res.statusCode === 200) {
        console.log(
          `Successfully revoked Google token (ending with ...${tokenToRevoke?.slice(
            -6
          )}). Response: ${responseBody}`
        );
        return "success";
      } else {
        console.error(
          `Failed to revoke Google token (ending with ...${tokenToRevoke?.slice(
            -6
          )}). Status: ${res.statusCode}`,
          {
            responseBody,
          }
        );
        // Check for specific Google error "invalid_token" which means it's already invalid
        if (res.statusCode === 400) {
          try {
            const errorJson = JSON.parse(responseBody);
            if (errorJson.error === "invalid_token") {
              console.error(
                `Token (ending with ...${tokenToRevoke?.slice(
                  -6
                )}) was already invalid or malformed.`
              );
              return "success";
            }
          } catch (parseError) {
            // Ignore if response body is not JSON
          }
        }
        // For other errors, reject
        return "error";
      }
    });
  });

  postReq.on("error", (error) => {
    console.error(
      `Error during https.request for Google token revocation (ending with ...${tokenToRevoke.slice(
        -6
      )}):`,
      {
        errorMessage: error.message,
      }
    );
    return "error";
  });

  // Post the request with data
  postReq.write(postData);
  postReq.end();
};

export const getDecryptedUserRefreshToken = async (
  appUserId: string,
  gmailAccountId: string
) => {
  const { refresh_token_encrypted } = await getEncryptedRefreshToken(
    appUserId,
    gmailAccountId
  );

  try {
    const decryptedToken = decrypt(refresh_token_encrypted);
    return decryptedToken;
  } catch (decryptionError) {
    console.error(
      `Failed to decrypt token for user ${appUserId}, account ${gmailAccountId}`
    );
    return null;
  }
};
