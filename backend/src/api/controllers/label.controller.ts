// src/api/controllers/label.controller.ts
import { Request, Response, NextFunction } from "express";
import * as labelDbOperations from "../../database/labels.db";
import { assignEmailsForNewLabel } from "../../jobs/labelProcessWorker";

// --- Label Definition CRUD ---

export const listUserLabels = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const appUserId = req.session.userId!;

    // Read the optional accountId from the query string
    // e.g., /api/v1/labels?accountId=some-uuid-123
    const { accountId } = req.query;
    console.log(accountId);

    const labels = await labelDbOperations.findLabelsByUserId(
      appUserId,
      accountId as string | undefined
    );

    res.status(200).json(labels);
  } catch (error) {
    next(error);
  }
};

export const createLabel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const appUserId = req.session.userId!;
    const { name, color, prompt } = req.body;
    const newLabel = await labelDbOperations.createNewLabel(
      appUserId,
      name,
      color,
      prompt
    );

    assignEmailsForNewLabel(appUserId, newLabel, 50);

    res.status(201).json(newLabel);
  } catch (error) {
    next(error);
  }
};

export const updateLabel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const appUserId = req.session.userId!;
    const { labelId } = req.params;
    const updates = req.body;
    const updatedLabel = await labelDbOperations.updateUserLabel(
      appUserId,
      labelId,
      updates
    );
    res.status(200).json(updatedLabel);
  } catch (error) {
    next(error);
  }
};

export const deleteLabel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const appUserId = req.session.userId!;
    const { labelId } = req.params;
    const result = await labelDbOperations.deleteUserLabel(appUserId, labelId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// --- Applying/Removing Labels from Emails ---

export const addLabelsToEmails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const appUserId = req.session.userId!;
    const { emailIds, labelIds } = req.body;
    const result = await labelDbOperations.addLabelsToEmailBatch(
      appUserId,
      emailIds,
      labelIds
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const removeLabelsFromEmails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const appUserId = req.session.userId!;
    const { emailIds, labelIds } = req.body;
    const result = await labelDbOperations.removeLabelsFromEmailBatch(
      appUserId,
      emailIds,
      labelIds
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
