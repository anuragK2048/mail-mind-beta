import express, { Router } from "express";
import authRouter from "./auth.routes";
import userRouter from "./user.routes";
import gmailAccountRouter from "./gmailAccount.routes";
import emailRouter from "./email.routes";
import labelRouter from "./label.routes";
import syncRouter from "./sync.routes";

const router: Router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({ result: "API is ready" });
});
router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/gmail-accounts", gmailAccountRouter);
router.use("/emails", emailRouter);
router.use("/labels", labelRouter);
router.use("/sync", syncRouter);

export default router;
