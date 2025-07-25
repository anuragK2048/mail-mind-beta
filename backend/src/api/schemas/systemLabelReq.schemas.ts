import { z } from "zod";

const validCategories = [
  "INBOX",
  "SPAM",
  "TRASH",
  "ARCHIVED",
  "ALL_MAIL",
  "SENT",
  "DRAFT",
  "STARRED",
  "IMPORTANT",
  "UNREAD",
] as const;

// export const systemLabelReqSchema = z.enum(validCategories);
export const getSystemEmailsQuerySchema = z.object({
  systemLabelId: z.enum(validCategories),

  limit: z.coerce.number().int().min(1).max(100),
  page: z.coerce.number().int().min(1),
  emailAccountIds: z
    .union([z.string().uuid(), z.array(z.string().uuid())])
    .transform((val) => (Array.isArray(val) ? val : [val])),
});

export const getEmailsQuerySchema = z.object({
  systemView: z.enum(["INBOX"]),

  // This is the important part for your error:
  limit: z.coerce.number().int().min(1).max(100).optional(), // z.coerce converts string to number
  page: z.coerce.number().int().min(1).optional(), // z.coerce converts string to number

  // This handles the array of strings for accountIds
  emailAccountIds: z
    .union([z.string().uuid(), z.array(z.string().uuid())])
    .transform((val) => (Array.isArray(val) ? val : [val])), // Ensure it's always an array if it exists

  inboxCategory: z.enum(["all", "other", "label"]),
});
