import { Request, Response } from "express";
import { asyncWrapper } from "../../middleware/asyncWrapper";
import { getAllConnectedAccountTokenDetails } from "../../database/gmail_accounts.db";
import { UUID } from "crypto";
import { revokeGoogleToken } from "../../services/token.service";
import {
  deleteAppUser,
  findUserWithLinkedAccounts,
} from "../../database/users.db";
import { NODE_ENV } from "../../config";
import { InternalServerError } from "../../errors/specificErrors";
import { decrypt } from "../../utils/crypto.utils";

// Handles GET /api/v1/users/me
export const getCurrentUserProfile = asyncWrapper(
  async (req: Request, res: Response) => {
    const userId = req.session.userId; // Get user ID from the active session

    // Fetch user details from your database using the ID
    const userData = await findUserWithLinkedAccounts(userId!); // From your userService

    if (!userData) {
      req.session.destroy(() => {});
      return res
        .status(401)
        .json({ message: "User not found, session terminated." });
    }

    res.status(200).json(userData);
  }
);

export const deleteCurrentUserAccount = asyncWrapper(
  async (req: Request, res: Response) => {
    const userAppId: UUID = req.session.userId!;
    const googleAccountsDetails = await getAllConnectedAccountTokenDetails(
      userAppId
    );
    googleAccountsDetails.forEach((accountDetails) => {
      const refresh_token = accountDetails.refresh_token_encrypted;
      const decryptedToken = decrypt(refresh_token);
      const result = revokeGoogleToken(decryptedToken);
      if (result == "error") {
      }
    });
    // Remove appUser from users DB
    await deleteAppUser(userAppId);
    req.session.destroy((err) => {
      if (err) {
        console.error("🔴 Error in destroying session", err);
      }

      // Options must match those used when setting the cookie
      const cookieOptions = {
        path: "/", // Default path if not specified in session config, otherwise match
        httpOnly: true,
        secure: NODE_ENV === "production",
        sameSite: "lax" as const, // Match the type from session config
      };
      const sessionCookieName = "connect.sid";
      res.clearCookie(sessionCookieName, cookieOptions);

      if (err) {
        throw new InternalServerError("Logout partially failed");
      }
      return res.status(200).json({ message: "Account Deletion Successful" });
    });
  }
);
