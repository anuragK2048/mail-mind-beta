const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getEmailsByLabel = async (labelId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/emails/by-label/${labelId}`,
      {
        credentials: "include",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch emails");
    }
    const emails = await response.json();
    return emails;
  } catch (err) {
    console.error(err);
  }
};
//hi
export const getEmailByEmailId = async (emailId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/emails/${emailId}`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch email");
    }
    const email = await response.json();
    return email;
  } catch (err) {
    console.error(err);
    throw new Error(err);
  }
};

export const getSelectedEmailsByLabel = async (
  labelId,
  emailAccountIds,
  page,
  limit
) => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  params.append("systemView", "INBOX");
  if (labelId == "all" || labelId == "other") {
    params.append("inboxCategory", labelId);
  } else {
    params.append("inboxCategory", "label");
  }
  emailAccountIds?.forEach((element) => {
    params.append("emailAccountIds", element);
  });
  const queryString = params.toString();
  const inboxCateg = labelId;
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/emails/inbox/${inboxCateg}?${queryString}`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch email");
    }
    const email = await response.json();
    return email;
  } catch (err) {
    console.error(err);
    throw new Error(err);
  }
};

export const getEmailsBySystemLabel = async (
  systemLabel,
  emailAccountIds,
  page,
  limit
) => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  emailAccountIds?.forEach((element) => {
    params.append("emailAccountIds", element);
  });
  const queryString = params.toString();
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/emails/system/${systemLabel}?${queryString}`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch email");
    }
    const email = await response.json();
    return email;
  } catch (err) {
    console.error(err);
    throw new Error(err);
  }
};

interface ModifyLabelsPayload {
  emailId: string;
  addLabelIds?: string[];
  removeLabelIds?: string[];
}

export const updateEmailLabels = async ({
  emailId,
  addLabelIds,
  removeLabelIds,
}: ModifyLabelsPayload) => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/emails/${emailId}/labels`,
    {
      method: "PATCH", // Using PATCH for partial updates
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addLabelIds, removeLabelIds }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update email labels");
  }

  return response.json();
};
