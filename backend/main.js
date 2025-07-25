const getGmailApi = require("./services/googleApiAuthService");
const {
  getListOfLabels,
  sendEmail,
  getEmailList,
  getEmailDetails,
} = require("./services/gmailApiServices");

async function main() {
  const gmail = await getGmailApi();
  //   if (gmail) {
  //     const labels = await getListOfLabels(gmail);
  //     console.log(labels);
  //   } else {
  //     console.error("Failed to get Gmail API");
  //   }

  //   if (gmail) {
  //     let message =
  //       `To: southindiatrip09@gmail.com\n` +
  //       `Subject: Test Email\n` +
  //       `Content-Type: text/html; charset="UTF-8"\n` +
  //       `\n` +
  //       `<h1>Hello from Gmail API</h1>\n` +
  //       `<p>This is a test email sent using the Gmail API.</p>`;

  //     try {
  //       const response = await sendEmail(gmail, message);
  //       console.log(response);
  //     } catch (error) {
  //       console.error("Error sending email:", error);
  //     }
  //   }

  //   if (gmail) {
  //     try {
  //       const messages = await getEmailList(gmail);
  //       const messagesContent = messages.map(async (message) => {
  //         const details = await getEmailDetails(gmail, message.id);
  //         return { id: message.id, snippet: details.snippet };
  //       });
  //       const results = await Promise.all(messagesContent);
  //       console.log(results);
  //     } catch (error) {
  //       console.error("Error fetching email list:", error);
  //     }
  //   }

  if (gmail) {
    try {
      const messageId = "196631cf9ec1dde1";
      const messageDetails = await getEmailDetails(gmail, messageId);
      const emailContent = decodeEmailBody(messageDetails);
      console.log(emailContent);
    } catch (error) {
      console.error("Error fetching email details:", error);
    }
  }
}

// Assuming 'message' is your email object from getEmailDetails

function decodeEmailBody(message) {
  let encodedBody = "";

  // If the email has parts (multipart), find the text/html or text/plain part
  if (message.payload.parts) {
    const part = message.payload.parts.find(
      (p) => p.mimeType === "text/html" || p.mimeType === "text/plain"
    );
    if (part && part.body && part.body.data) {
      encodedBody = part.body.data;
    }
  } else if (message.payload.body && message.payload.body.data) {
    // Single part message
    encodedBody = message.payload.body.data;
  }

  // Decode base64url
  const decodedBody = Buffer.from(encodedBody, "base64").toString("utf-8");
  return decodedBody;
}

main().catch(console.error);
