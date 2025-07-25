const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- Interfaces for Payloads ---

interface NewLabelPayload {
  name: string;
  color?: string;
}

interface UpdateLabelPayload {
  labelId: string;
  updates: {
    name?: string;
    color?: string;
  };
}

// --- API Functions ---

/**
 * Fetches all labels for the current user.
 */
export const getLabelOptions = async () => {
  const response = await fetch(
    // `${API_BASE_URL}/api/v1/labels${emailAccountId ? `?accountId=${emailAccountId}` : ""}`, TODO future scope
    `${API_BASE_URL}/api/v1/labels`,
    {
      credentials: "include",
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch labels");
  }
  return response.json();
};

/**
 * Creates a new label on the server.
 * @param newLabel - The label data to create.
 */
export const createLabel = async (newLabel: NewLabelPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/labels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(newLabel),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create label");
  }
  return response.json();
};

/**
 * Updates an existing label on the server.
 * @param payload - An object containing the labelId and the updates.
 */
export const updateLabel = async (payload: UpdateLabelPayload) => {
  const { labelId, updates } = payload;

  const response = await fetch(`${API_BASE_URL}/api/v1/labels/${labelId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update label");
  }
  return response.json();
};

/**
 * Deletes a label from the server.
 * @param labelId - The ID of the label to delete.
 */
export const deleteLabel = async (labelId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/labels/${labelId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete label");
  }
  return response.json(); // The backend sends a success message object
};
