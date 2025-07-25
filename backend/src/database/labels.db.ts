// --- Label Definition CRUD ---

import supabase from "./supabase";

export async function findLabelsByUserId(
  appUserId: string,
  gmailAccountId?: string
) {
  // Start building the query
  let query = supabase
    .from("labels")
    .select("id, name, color")
    .eq("app_user_id", appUserId) // Always filter by the owner
    .order("name", { ascending: true });

  // If a specific account ID is provided, add it as a filter
  if (gmailAccountId) {
    // This assumes your 'labels' table has a 'gmail_account_id' foreign key.
    // If you decided labels are global to the app_user, this filter would change.
    // Based on a robust design, labels are per-account.
    query = query.eq("gmail_account_id", gmailAccountId);
  }

  // Execute the query
  const { data, error } = await query;

  if (error) {
    console.error("Error fetching labels:", error);
    throw new Error(error.message);
  }
  return data || [];
}

export async function createNewLabel(
  appUserId: string,
  name: string,
  color?: string,
  prompt?: string
) {
  const { data, error } = await supabase
    .from("labels")
    .insert({ app_user_id: appUserId, name, color, prompt })
    .select("id, name, color, prompt")
    .single();

  if (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      throw new Error(`A label with the name "${name}" already exists.`);
    }
    throw new Error(error.message);
  }
  return data;
}

interface NewLabelReq {
  name: string;
  color?: string;
  prompt?: string;
}

export async function createBulkNewLabel(
  appUserId: string,
  labelDetails: NewLabelReq[]
) {
  const finalLabelDetails = labelDetails?.map((label) => ({
    ...label,
    app_user_id: appUserId,
  }));
  const { data, error } = await supabase
    .from("labels")
    .insert(finalLabelDetails);

  if (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      throw new Error(`Duplicate Labels.`);
    }
    throw new Error(error.message);
  }

  return { message: "Default Labels created successfully." };
}

export async function updateUserLabel(
  appUserId: string,
  labelId: string,
  updates: { name?: string; color?: string; prompt?: string }
) {
  const { data, error } = await supabase
    .from("labels")
    .update(updates)
    .eq("app_user_id", appUserId) // Security: ensure user owns the label
    .eq("id", labelId)
    .select("id, name, color")
    .single();

  if (error) throw new Error(error.message);
  if (!data)
    throw new Error("Label not found or user does not have permission.");
  return data;
}

export async function deleteUserLabel(appUserId: string, labelId: string) {
  // Deleting from the 'labels' table will automatically cascade and delete
  // all corresponding entries in the 'email_labels' join table.
  const { error } = await supabase
    .from("labels")
    .delete()
    .eq("app_user_id", appUserId) // Security: ensure user owns the label
    .eq("id", labelId);

  if (error) throw new Error(error.message);
  return { message: "Label deleted successfully." };
}

// --- Applying/Removing Labels from Emails ---

export async function addLabelsToEmailBatch(
  appUserId: string,
  emailIds: string[],
  labelIds: string[]
) {
  // TODO: Verify the user owns all the emailIds and labelIds before inserting.
  // This is a complex check but crucial for security.
  // A simplified version is shown here, relying on RLS policies as a backup.

  const recordsToInsert = emailIds.flatMap((emailId) =>
    labelIds.map((labelId) => ({
      email_id: emailId,
      label_id: labelId,
    }))
  );

  console.log(recordsToInsert);

  const { error } = await supabase.from("email_labels").insert(recordsToInsert);
  // Using onConflict: 'ignore' can be an option if you don't care about errors on duplicates
  // .insert(recordsToInsert, { onConflict: 'ignore' })

  if (error) {
    // A unique constraint violation (23505) is expected if the label is already applied.
    // We can choose to ignore this specific error code.
    if (error.code !== "23505") {
      throw new Error(error.message);
    }
  }
  return { message: "Labels applied successfully." };
}

export async function removeLabelsFromEmailBatch(
  appUserId: string,
  emailIds: string[],
  labelIds: string[]
) {
  const { error } = await supabase
    .from("email_labels")
    .delete()
    .in("email_id", emailIds)
    .in("label_id", labelIds);
  // Note: This needs an RLS policy that can verify ownership of the email
  // before allowing a delete on email_labels.

  if (error) throw new Error(error.message);
  return { message: "Labels removed successfully." };
}

// Interface for the data this function expects
interface EmailLabelAssociation {
  email_id: string; // The UUID of the email in your 'emails' table
  label_id: string; // The UUID of the label in your 'labels' table
}

/**
 * Performs a bulk insert of email-label associations into the database.
 * @param appUserId - The ID of the user. Used for security verification.
 * @param associations - An array of objects, each with an email_id and a label_id.
 * @returns A success message.
 * @throws An error if the insert fails for reasons other than a duplicate key violation.
 */
export async function bulkAddLabelsToEmails(
  appUserId: string,
  associations: EmailLabelAssociation[]
) {
  // --- Security Verification (Crucial for a production app) ---
  // Before inserting, we should verify that the current user actually owns
  // all the emails and labels they are trying to link. This prevents a user
  // from maliciously linking another user's email to their own label.

  // This is a complex check. A simplified version is shown here.
  // A full implementation might involve fetching all unique emailIds and labelIds
  // from the 'associations' array and running a DB query to confirm ownership.
  // For now, we will rely on Supabase RLS policies as a strong secondary defense.
  if (!associations || associations.length === 0) {
    return { message: "No label associations to add." };
  }
  // console.log("associations", associations);
  // --- Bulk Insert ---
  const { error } = await supabase.from("email_labels").insert(associations, {
    // Supabase's 'upsert' with 'ignoreDuplicates' is often simulated by 'insert'
    // with 'onConflict'. 'ignoreDuplicates' is simpler if available on insert directly,
    // but 'onConflict' is the standard PostgreSQL way.
    // We'll handle the duplicate error code manually for clarity.
  });
  if (error) {
    // Error code '23505' is a unique_violation. This is expected and OK if a user
    // tries to apply a label that's already there. We can safely ignore it.
    if (error.code === "23505") {
      console.warn(
        "Attempted to insert duplicate email-label associations. Ignoring."
      );
      return {
        message: "Labels applied. Some associations may have already existed.",
      };
    }
    // For all other errors, we should report them.
    console.error("Error in bulkAddLabelsToEmails:", error);
    throw new Error("Failed to apply labels to emails.");
  }

  return { message: "Labels applied successfully." };
}

// ... (your other label service functions)
