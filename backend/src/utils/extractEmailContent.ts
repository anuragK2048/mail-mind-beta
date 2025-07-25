// This function would live in your ai.service.ts or a utility file

// Import a library to convert HTML to clean text
// npm install html-to-text
import { htmlToText } from "html-to-text";

// A more robust preprocessing function
export function preprocessEmailForLLM(email: any): {
  id: string;
  content: string;
} {
  // 1. Prioritize and clean the email body
  let bodyText = "";
  if (email.body_plain_text && email.body_plain_text.trim().length > 20) {
    // Use plain text if it's substantial
    bodyText = email.body_plain_text;
  } else if (email.body_html) {
    // Convert HTML to clean, readable text as a fallback
    bodyText = htmlToText(email.body_html, {
      wordwrap: 120, // Helps with readability of the raw text
      selectors: [
        { selector: "a", options: { ignoreHref: true } }, // Removes URLs
        { selector: "img", format: "skip" }, // Completely remove images
      ],
    });
  }

  // 2. Truncate the body to a reasonable but generous length.
  // ~3000 chars is around 750 tokens, which is a good balance for classification.
  const MAX_BODY_LENGTH = 3000;
  if (bodyText.length > MAX_BODY_LENGTH) {
    bodyText = bodyText.substring(0, MAX_BODY_LENGTH) + "...";
  }

  // 3. Combine the most important metadata with the cleaned body
  const combinedContent = [
    `Subject: ${email.subject || "(no subject)"}`,
    `From: ${email.from_name || ""} <${email.from_address || ""}>`,
    `Snippet: ${email.snippet || ""}`,
    `Body: ${bodyText.replace(/\s+/g, " ").trim()}`,
    `reference_labels: ${JSON.stringify(email.label_ids)}`,
  ].join("\n---\n"); // Use a clear separator

  // console.log("Email content passed to llm:", combinedContent);

  return {
    id: email.id,
    content: combinedContent,
  };
}
