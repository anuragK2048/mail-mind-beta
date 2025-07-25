import { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/apiError";
import { FRONTEND_URL } from "../config";

const OAUTH_CALLBACK_PATHS = ["/api/v1/auth/google/callback"];

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (OAUTH_CALLBACK_PATHS.includes(req.path)) {
    // For OAuth callbacks that typically redirect:
    let clientErrorMessage =
      "An unexpected error occurred during authentication.";
    if (err instanceof ApiError) {
      // You can map specific error codes or types to more user-friendly messages if desired
      if (err.errorCode === "CSRF_INVALID")
        clientErrorMessage = "Invalid session. Please try logging in again.";
      else if (err.errorCode === "GOOGLE_VALIDATION_FAILED")
        clientErrorMessage =
          "Could not verify your Google account. Please try again.";
      else if (err.errorCode === "ACCOUNT_ALREADY_LINKED")
        clientErrorMessage = err.message; // This message is usually safe
      else
        clientErrorMessage = "Authentication process failed. Please try again.";
    }

    const errorKey =
      err instanceof ApiError && err.errorCode
        ? err.errorCode
        : "AUTH_GENERAL_ERROR";
    res.redirect(
      `${FRONTEND_URL}/auth-error?errorKey=${encodeURIComponent(
        errorKey
      )}&message=${encodeURIComponent(clientErrorMessage)}`
    );
    return;
  }

  if (req.path.startsWith("/api/")) {
    if (err instanceof ApiError) {
      console.log("------------HI");
      res.status(err.statusCode).json({
        status: "error",
        message: err.message,
        ...(err.errorCode && { code: err.errorCode }),
        ...(err.constructor.name === "ValidationError" &&
          (err as any).details && { details: (err as any).details }),
      });
      return;
    }
    const isProduction = process.env.NODE_ENV === "production";
    res.status(500).json({
      status: "error",
      message: isProduction
        ? "An internal server error occurred."
        : err.message,
    });
    return;
  }
};

export default errorHandler;
