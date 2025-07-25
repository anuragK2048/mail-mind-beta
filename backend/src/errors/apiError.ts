export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;

  constructor(
    displayMessage: string,
    statusCode: number,
    isOperational: boolean = true,
    errorCode?: string
  ) {
    super(displayMessage);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, ApiError.prototype); //for ES5
  }
}
