import { Request, Response, NextFunction } from "express";
import { asyncWrapper } from "./asyncWrapper";
import { UnauthorizedError } from "../errors/specificErrors";

export const isAuthenticated = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("session.userId", req.session.userId);
    if (req.session && req.session.userId && req.session.isLoggedIn) {
      return next();
    } else throw new UnauthorizedError("User not authorized", "AUTH_ERROR");
  }
);
