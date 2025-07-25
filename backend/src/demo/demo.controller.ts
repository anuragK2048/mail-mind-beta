import { FRONTEND_URL } from "../config";
import { asyncWrapper } from "../middleware/asyncWrapper";
import { Request, Response } from "express";

export const demoLogin = asyncWrapper(async (req: Request, res: Response) => {
  const DEMO_USER_ID: any = process.env.DEMO_USER_ID; // Store the demo user's UUID in your .env file

  if (!DEMO_USER_ID) {
    console.error("DEMO_USER_ID is not configured on the server.");
    return res.status(500).json({ message: "Demo login is not configured." });
  }
  console.log("demo user id", DEMO_USER_ID);
  req.session.userId = DEMO_USER_ID;
  req.session.isLoggedIn = true;
  req.session.regenerate((err) => {
    // Set the session data for the demo user
    req.session.userId = DEMO_USER_ID;
    req.session.isLoggedIn = true;
    // Save the session before sending the response
    req.session.save((err) => {});
  });
  res.redirect(FRONTEND_URL + `/inbox`);
});
