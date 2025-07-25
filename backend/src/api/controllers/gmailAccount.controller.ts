import { Request, Response } from "express";
import { asyncWrapper } from "../../middleware/asyncWrapper";
import { BadRequestError } from "../../errors/specificErrors";
import { UUID } from "crypto";
import {
  deleteGmailAccount,
  getUserIdByGmailAccountId,
} from "../../database/gmail_accounts.db";
import { revokeGoogleToken } from "../../services/token.service";
import { fetchGoogleProfile } from "../../services/gmailAccount.service";

export const listLinkedAccounts = async (req: Request, res: Response) => {
  res.json({});
};

export const unlinkGmailAccount = asyncWrapper(
  async (req: Request, res: Response) => {
    if (!req.params.accountId) {
      throw new BadRequestError(
        "Account Id for account removal not provided in parameters",
        "ACCOUNT_ID_UNAVAILABLE"
      );
    }
    const { accountId } = req.params as { accountId: UUID };
    const appUserId: UUID = req.session.userId!;
    console.log(accountId);
    const {
      app_user_id: gmailOwnerId,
      refresh_token_encrypted,
      type,
    } = await getUserIdByGmailAccountId(accountId);
    // verify account owner
    if (appUserId !== gmailOwnerId) {
      throw new BadRequestError(
        "Owner of this email account is different",
        "BAD_REQUEST"
      );
    }
    // check if it is primary google account
    if (type === "primary")
      throw new BadRequestError("Cant disconnect primary account");
    // decrypt refresh token
    const result = revokeGoogleToken(refresh_token_encrypted);
    if (result == "error") {
    } // error in revoking refresh token
    // delete gmail account from DB
    await deleteGmailAccount(accountId);
    res
      .status(200)
      .json({ message: "Gmail Account Disconnected Successfully" });
  }
);

export const getUserProfileForAccount = asyncWrapper(
  async (req: Request, res: Response) => {
    try {
      const appUserId = req.session.userId;
      // Get account ID from route parameter, e.g., /api/v1/gmail-accounts/:accountId/profile
      const { accountId } = req.params;

      if (!appUserId) {
        // This should ideally be caught by an isAuthenticated middleware first
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (!accountId) {
        return res.status(400).json({ message: "Account ID is required" });
      }

      // Call the service to perform the business logic
      const userProfile = await fetchGoogleProfile(appUserId, accountId);

      // Send the successful response
      res.status(200).json(userProfile);
    } catch (error: any) {
      // Check for specific errors returned from the service layer
      if (
        error.message.includes("Re-authentication required") ||
        error.response?.data?.error === "invalid_grant"
      ) {
        // If the refresh token was invalid, tell the frontend it needs to re-auth
        return res.status(401).json({
          message:
            "Google authentication has expired or been revoked. Please re-link the account.",
          reauthRequired: true,
        });
      }
    }
  }
);

export const triggerAccountSync = async (req: Request, res: Response) => {
  res.json({});
};

export const getAccountSyncStatus = async (req: Request, res: Response) => {
  res.json({});
};
