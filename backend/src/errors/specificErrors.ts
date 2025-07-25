import { ApiError } from "./apiError";

export class BadRequestError extends ApiError {
  constructor(message: string = "Bad Request", errorCode?: string) {
    super(message, 400, true, errorCode);
  }
}

export class NotFoundError extends ApiError {
  constructor(displayMessage: string, errorCode?: string) {
    super(displayMessage, 404, true, errorCode);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnauthorizedError extends ApiError {
  // For CSRF failure
  constructor(message: string = "Unauthorized", errorCode?: string) {
    super(message, 401, true, errorCode);
  }
}

export class ValidationError extends ApiError {
  public readonly details?: Record<string, any>; // For field-specific errors

  constructor(
    message: string = "Validation failed",
    details?: Record<string, any>,
    errorCode?: string
  ) {
    super(message, 400, true, errorCode); // 400 for Bad Request due to validation
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class ForbiddenError extends ApiError {
  // For duplicate account linking attempt
  constructor(message: string = "Forbidden", errorCode?: string) {
    super(message, 403, true, errorCode);
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = "Internal Server Error") {
    // For unexpected errors, isOperational might be false if you want to treat them differently
    super(message, 500, true); // Keeping true for consistent client response structure
  }
}
