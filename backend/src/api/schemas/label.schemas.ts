import { z } from "zod";

export const createLabelSchema = z.object({
  name: z.string().min(1, "Label name cannot be empty").max(100),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional(),
  prompt: z.string().optional(),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  prompt: z.string().optional(),
});

export const manageEmailLabelsSchema = z.object({
  labelIds: z
    .array(z.string().uuid())
    .min(1, "At least one labelId is required"),
  emailIds: z
    .array(z.string().uuid())
    .min(1, "At least one emailId is required"),
});
