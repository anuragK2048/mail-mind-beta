import supabase from "./supabase";

/**
 * Fetches all user-defined labels associated with a specific email.
 * @param appUserId - The ID of the user who owns the email.
 * @param emailId - The internal UUID of the email.
 * @returns A promise that resolves to an array of label objects.
 */
export async function getLabelsForEmail(appUserId: string, emailId: string) {
  // First, verify the user owns the email to prevent data leakage.
  const { count, error: ownerError } = await supabase
    .from("emails")
    .select("*", { count: "exact", head: true }) // head:true doesn't return data, just count
    .eq("app_user_id", appUserId)
    .eq("id", emailId);

  if (ownerError) throw new Error(ownerError.message);
  if (count === 0) throw new Error("Email not found or permission denied.");

  // Now, fetch the labels for that email.
  const { data, error } = await supabase
    .from("email_labels")
    .select(
      `
      labels (
        id,
        name,
        color
      )
    `
    )
    .eq("email_id", emailId);

  if (error) throw new Error(error.message);

  // The result is an array of { labels: { ... } }, so we map it.
  return data?.map((item: any) => item.labels) || [];
}

/**
 * Fetches a paginated list of emails that have a specific user-defined label.
 * @param appUserId - The ID of the user who owns the label.
 * @param labelId - The internal UUID of the label.
 * @param limit - Number of emails to return per page.
 * @param page - The page number to fetch.
 * @returns A promise that resolves to an array of email overview objects.
 */
export async function getEmailsForLabel(
  appUserId: string,
  labelId: string,
  limit: number = 20,
  page: number = 1
) {
  // First, verify the user owns the label.
  const { count, error: ownerError } = await supabase
    .from("labels")
    .select("*", { count: "exact", head: true })
    .eq("app_user_id", appUserId)
    .eq("id", labelId);

  if (ownerError) throw new Error(ownerError.message);
  if (count === 0) throw new Error("Label not found or permission denied.");

  // Calculate pagination
  const offset = (page - 1) * limit;

  // Fetch the emails associated with the label
  const { data, error } = await supabase
    .from("email_labels")
    .select(
      `
        emails (
          id,
          subject,
          from_name,
          snippet,
          received_date,
          is_unread,
          is_starred
        )
      `
    )
    .eq("label_id", labelId)
    // We don't need to filter by user here again because we already verified
    // the user owns the label, and a label can't be applied to another user's email.
    .order("received_date", { foreignTable: "emails", ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  console.log(data);
  return data?.map((item: any) => item.emails) || [];
}

export const getSelectedEmailsForLabel = async (
  labelId: string,
  emailAccountIds: string[],
  page: number,
  limit: number
) => {
  // const temp = "39f46846-1997-4f49-bc29-30acdd77063c";
  const offset = limit * (page - 1);
  const {
    data: emails,
    error,
    count,
  } = await supabase
    .from("email_labels")
    .select(
      `
    emails!inner(
      *,
      gmail_account:gmail_account_id(
        gmail_address
      )
    )
  `,
      {
        count: "exact",
        head: false,
      }
    )
    .eq("label_id", labelId)
    .in("emails.gmail_account_id", emailAccountIds)
    .order("received_date", { foreignTable: "emails", ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error("Unable to fetch selective emails by label from DB");
  }

  console.log(emails.length);

  const hasNextPage = page * limit < count;
  return {
    emails: emails?.map((val: any) => val.emails),
    hasNextPage,
    currentPage: page,
    nextPage: hasNextPage ? page + 1 : null,
  };
};

export const getBulkEmailsFromDB = async (appUserId: string, limit: number) => {
  const { data, error } = await supabase
    .from("emails")
    .select(`*`)
    .eq("app_user_id", appUserId)
    .not("label_ids", "cs", "{SENT}")
    .not("label_ids", "cs", "{DRAFT}")
    .order("received_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error);
  return data;
};

// Helper to get Gmail-specific IDs from our internal email ID
export async function getEmailGmailIds(
  appUserId: string,
  internalEmailId: string
) {
  const { data, error } = await supabase
    .from("emails")
    .select("gmail_message_id, gmail_account_id")
    .eq("app_user_id", appUserId)
    .eq("id", internalEmailId)
    .single();

  if (error) throw new Error("Email not found or permission denied.");
  return data;
}
