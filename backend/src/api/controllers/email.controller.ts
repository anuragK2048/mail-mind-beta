import { NextFunction, Request, Response } from "express";
import { asyncWrapper } from "../../middleware/asyncWrapper";
import { z } from "zod";
import {
  fetchSingleEmailFromDb,
  modifyEmailLabels,
  syncEmailsForAccount,
} from "../../services/email.service";
import {
  getEmailsForLabel,
  getLabelsForEmail,
  getSelectedEmailsForLabel,
} from "../../database/emails.db";

const getEmailsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
  category: z.string().optional(),
  isStarred: z.preprocess((val) => val === "true", z.boolean()).optional(),
  isUnread: z.preprocess((val) => val === "true", z.boolean()).optional(),
});

export const getSingleEmailDetails = asyncWrapper(
  async (req: Request, res: Response) => {
    const appUserId = req.session.userId!;
    const { emailId } = req.params; // Get emailId from route parameter

    if (!emailId) {
      return res.status(400).json({ message: "Email ID is required" });
    }

    const email = await fetchSingleEmailFromDb(appUserId, emailId);

    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }

    res.status(200).json(email);
  }
);

// --- Mark as Read ---
export const markEmailAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const appUserId = req.session.userId!;
    const { emailId } = req.params;
    const updatedEmail = await modifyEmailLabels(
      appUserId,
      emailId,
      [],
      ["UNREAD"]
    );
    res.status(200).json(updatedEmail);
  } catch (error) {
    next(error);
  }
};

// --- Mark as Unread ---
export const markEmailAsUnread = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const appUserId = req.session.userId!;
    const { emailId } = req.params;
    const updatedEmail = await modifyEmailLabels(
      appUserId,
      emailId,
      ["UNREAD"],
      []
    );
    res.status(200).json(updatedEmail);
  } catch (error) {
    next(error);
  }
};

// --- Star Email ---
export const starEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const appUserId = req.session.userId!;
    const { emailId } = req.params;
    const updatedEmail = await modifyEmailLabels(
      appUserId,
      emailId,
      ["STARRED"],
      []
    );
    res.status(200).json(updatedEmail);
  } catch (error) {
    next(error);
  }
};

// --- Unstar Email ---
export const unstarEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const appUserId = req.session.userId!;
    const { emailId } = req.params;
    const updatedEmail = await modifyEmailLabels(
      appUserId,
      emailId,
      [],
      ["STARRED"]
    );
    res.status(200).json(updatedEmail);
  } catch (error) {
    next(error);
  }
};

export const getOverallSyncStatus = async (req: Request, res: Response) => {
  res.json({});
};

export const startUserSync = async (req: Request, res: Response) => {
  res.json({});
};

export const getEmailSummary = async (req: Request, res: Response) => {
  res.json({});
};

export const startAccountSync = asyncWrapper(
  async (req: Request, res: Response) => {
    const appUserId = req.session.userId!;
    // Get account ID from route parameter, e.g., /api/v1/gmail-accounts/:accountId/sync
    const { accountId } = req.params;
    const maxEmailsToSync = parseInt(req.query.limit as string, 10) || 50;

    if (!accountId) {
      return res.status(400).json({ message: "Account ID is required" });
    }

    // Don't await this if it's a long process.
    // Kick it off and return an immediate response.
    syncEmailsForAccount(appUserId, accountId, maxEmailsToSync)
      .then(() => {
        console.log(`Background sync completed for account ${accountId}.`);
        // Here you could use a WebSocket or SSE to notify the client of completion.
      })
      .catch((error) => {
        console.error(
          `Background sync failed for account ${accountId}:`,
          error
        );
      });

    // Respond immediately to the client
    res.status(202).json({
      message: "Email synchronization process started in the background.",
    });
  }
);

export const getEmailLabels = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const appUserId = req.session.userId!;
    const { emailId } = req.params;
    const labels = await getLabelsForEmail(appUserId, emailId);
    res.status(200).json(labels);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles fetching all emails that have a specific user-defined label.
 */
export const getEmailsByLabel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const appUserId = req.session.userId!;
    const { labelId } = req.params;
    // You could get pagination from query params, e.g., req.query.page
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const emails = await getEmailsForLabel(appUserId, labelId, limit, page);
    res.status(200).json(emails);
  } catch (error) {
    next(error);
  }
};

// export const getSelectedEmailsByLabel = asyncWrapper(
//   async (req: Request, res: Response) => {
//     const { labelId } = req.params;
//     const { emailAccountIds, page, limit } = req.body;
//     const appUserId = req.session.userId!;
//     const { emails, hasNextPage, currentPage, nextPage } = await fetchEmails({
//       userLabelId: labelId,
//       emailAccountIds,
//       page,
//       limit,
//       appUserId,
//     });
//     res.status(200).json({
//       emails,
//       hasNextPage,
//       currentPage,
//       nextPage,
//     });
//   }
// );

export const editEmailLabels = asyncWrapper(
  async (req: Request, res: Response) => {
    const appUserId = req.session.userId!;
    const { emailId } = req.params;
    const { addLabels, removeLabels } = req.body;
    console.log(
      "emailId:",
      emailId,
      " addLabels:",
      addLabels,
      " emoveLabels:",
      removeLabels
    );
    const updatedEmail = await modifyEmailLabels(
      appUserId,
      emailId,
      addLabels,
      removeLabels
    );
    res.status(200).json(updatedEmail);
  }
);

export const modifyEmailLabelsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const appUserId = req.session.userId!;
    const { emailId } = req.params;
    const { addLabelIds, removeLabelIds } = req.body;

    const updatedEmail = await modifyEmailLabels(
      appUserId,
      emailId,
      addLabelIds,
      removeLabelIds
    );

    res.status(200).json(updatedEmail);
  } catch (error) {
    next(error);
  }
};
