import type { Request, Response, NextFunction } from "express";
import {
  NotImplementedError,
  ValidationError,
  DomainError,
} from "../shared/errors.js";

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Log error
  console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.path}:`, err);

  // Map error types to HTTP status codes
  let statusCode = 500;
  let errorType = "InternalServerError";

  if (err instanceof ValidationError) {
    statusCode = 400;
    errorType = "ValidationError";
  } else if (err instanceof NotImplementedError) {
    statusCode = 501;
    errorType = "NotImplementedError";
  } else if (err instanceof DomainError) {
    statusCode = 400;
    errorType = "DomainError";
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    error: errorType,
    message: err.message || "An error occurred",
    statusCode,
  };

  // In development, include stack trace
  if (process.env.NODE_ENV !== "production") {
    errorResponse.details = {
      stack: err.stack,
    };
  }

  res.status(statusCode).json(errorResponse);
};
