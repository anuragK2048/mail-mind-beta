// src/api/schemas/email.schemas.ts
import { z } from "zod";

// ...
export const emailIdParamSchema = z.object({
  emailId: z.string().uuid(),
});

export const modifyLabelsSchema = z.object({
  addLabelIds: z.array(z.string()).optional(),
  removeLabelIds: z.array(z.string()).optional(),
});
