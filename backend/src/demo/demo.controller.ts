import { asyncWrapper } from "../middleware/asyncWrapper";
import { Request, Response, NextFunction } from "express";
import { FRONTEND_URL } from "../config";

export const demoLogin = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const DEMO_USER_ID: any = process.env.DEMO_USER_ID;

    if (!DEMO_USER_ID) {
      console.error("DEMO_USER_ID is not configured on the server.");
      throw new Error("Demo login is not configured.");
    }

    // Regenerate the session to prevent session fixation.
    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }

      req.session.userId = DEMO_USER_ID;
      req.session.isLoggedIn = true;

      req.session.save((err) => {
        if (err) {
          return next(err);
        }

        console.log("Demo session saved successfully for user:", DEMO_USER_ID);
        res.status(200).json({ message: "Demo login successful." });
      });
    });
  }
);
