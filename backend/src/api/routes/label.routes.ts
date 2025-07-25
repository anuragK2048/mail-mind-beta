// src/api/routes/label.routes.ts
import express, { Router } from "express";
import * as labelController from "../controllers/label.controller";
import { isAuthenticated } from "../../middleware/isAuthenticated";
import {
  createLabelSchema,
  manageEmailLabelsSchema,
  updateLabelSchema,
} from "../schemas/label.schemas";
import { validateRequest } from "../../middleware/validateRequest";

const router: Router = express.Router();

// All label routes are protected
router.use(isAuthenticated);

// --- Label Definition CRUD ---

// GET /api/v1/labels (List all labels for the current user)
router.get("/", labelController.listUserLabels);

// POST /api/v1/labels (Create a new label)
router.post(
  "/",
  validateRequest({ body: createLabelSchema }),
  labelController.createLabel
);

// PUT /api/v1/labels/:labelId (Update a label's name or color)
router.put(
  "/:labelId",
  validateRequest({ body: updateLabelSchema }),
  labelController.updateLabel
);

// DELETE /api/v1/labels/:labelId (Delete a label)
router.delete("/:labelId", labelController.deleteLabel);

// --- Applying/Removing Labels from Emails ---

// POST /api/v1/emails/labels (Apply one or more labels to one or more emails)
router.post(
  "/emails/labels",
  validateRequest({ body: manageEmailLabelsSchema }),
  labelController.addLabelsToEmails
);

// DELETE /api/v1/emails/labels (Remove a label from one or more emails)
router.delete(
  "/emails/labels",
  validateRequest({ body: manageEmailLabelsSchema }),
  labelController.removeLabelsFromEmails
);

export default router;
