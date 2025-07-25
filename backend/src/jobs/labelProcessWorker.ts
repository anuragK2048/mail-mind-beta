import { getBulkEmailsFromDB } from "../database/emails.db";
import {
  bulkAddLabelsToEmails,
  findLabelsByUserId,
} from "../database/labels.db";
import {
  assignLabelsInBatch_LLM,
  assignNewLabelInBatch_LLM,
} from "../services/ai.service";

/**
 * A wrapper function to handle the AI labeling process in the background.
 * In a real app, this would enqueue a job. Here, it just calls the function
 * without being awaited by the main sync flow.
 * @param appUserId
 * @param emails
 */
export async function processAILabelsInBackground(
  appUserId: string,
  emails: any[]
) {
  const receivedEmails = emails.filter((email) => {
    // Exclude emails with SENT/DRAFT labels
    const hasExcludedLabels = email.label_ids?.some(
      (labelId: any) => labelId === "SENT" || labelId === "DRAFT"
    );
    // Only keep emails without excluded labels
    return !hasExcludedLabels;
  });
  try {
    // 1. Fetch the user's defined labels
    const userLabels = await findLabelsByUserId(appUserId);
    if (!userLabels || userLabels.length === 0) {
      console.log("User has no custom labels to assign.");
      return;
    }

    // 2. Call the LLM to get the assignments Map
    // You might want to batch the 'emails' array here too if it's very large (e.g., > 100)
    // For simplicity, we'll process them all in one go if it fits the LLM batch size.
    const assignmentsMap: Map<string, boolean[]> =
      await assignLabelsInBatch_LLM(receivedEmails, userLabels);

    // 3. Process the Map and prepare for DB insert
    const emailLabelAssociations: { email_id: string; label_id: string }[] = [];
    assignmentsMap.forEach((assignments, emailId) => {
      assignments.forEach((shouldApply, index) => {
        if (shouldApply) {
          const labelId = userLabels[index].id;
          emailLabelAssociations.push({
            email_id: emailId,
            label_id: labelId,
          });
        }
      });
    });

    // 4. If any associations were found, save them to the database
    if (emailLabelAssociations.length > 0) {
      console.log(`AI found ${emailLabelAssociations.length} labels to apply.`);
      await bulkAddLabelsToEmails(appUserId, emailLabelAssociations);
      console.log("Successfully applied AI-generated labels.");
    } else {
      console.log("AI processing complete. No new labels were applicable.");
    }
  } catch (error) {
    console.error("Error during background AI label processing:", error);
  }
}

export const assignEmailsForNewLabel = async (
  appUserId: string,
  labelDetails: any,
  limit: number
) => {
  try {
    // 1. Get the emails (TODO batching)
    const emails = await getBulkEmailsFromDB(appUserId, limit);

    // 2. Call the LLM to get the assignments Map
    const assignmentsMap: Map<string, boolean> =
      await assignNewLabelInBatch_LLM(emails, labelDetails);

    // 3. Process the Map and prepare for DB insert
    const emailLabelAssociations: { email_id: string; label_id: string }[] = [];
    assignmentsMap.forEach((applicable, emailId) => {
      if (applicable) {
        emailLabelAssociations.push({
          email_id: emailId,
          label_id: labelDetails.id,
        });
      }
    });

    if (emailLabelAssociations.length > 0) {
      console.log(`AI found ${emailLabelAssociations.length} labels to apply.`);
      await bulkAddLabelsToEmails(appUserId, emailLabelAssociations);
      console.log("Successfully applied AI-generated labels.");
    } else {
      console.log("AI processing complete. No new labels were applicable.");
    }
  } catch (error) {
    console.error("Error during background AI label processing:", error);
  }
};
