import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

// Error codes for client
enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
}

// Custom error class for application errors
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: ErrorCode,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (error: unknown, req: Request, res: Response, _next: NextFunction) => {
  // Log error details server-side (with full stack trace)
  logger.error(
    {
      err: error,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: (
        (req as unknown as Record<string, unknown>).wallet as Record<string, unknown> | undefined
      )?.address,
    },
    'Error occurred'
  );

  // Zod validation errors
  if (error instanceof ZodError) {
    const isDevelopment = env.NODE_ENV === 'development';
    return res.status(400).json({
      error: 'Invalid request data',
      code: ErrorCode.VALIDATION_ERROR,
      // Only expose details in development
      ...(isDevelopment && { details: error.flatten() }),
    });
  }

  // Custom application errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.errorCode,
    });
  }

  // Standard errors - sanitize message
  if (error instanceof Error) {
    const isDevelopment = env.NODE_ENV === 'development';
    const safeMessage = isDevelopment ? error.message : 'An unexpected error occurred';

    return res.status(500).json({
      error: safeMessage,
      code: ErrorCode.INTERNAL_ERROR,
      // NEVER expose stack traces in production
      ...(isDevelopment && { stack: error.stack }),
    });
  }

  // Unknown error type
  return res.status(500).json({
    error: 'An unexpected error occurred',
    code: ErrorCode.INTERNAL_ERROR,
  });
};
