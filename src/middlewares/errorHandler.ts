import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, createErrorResponse, ErrorCodes } from '../utils/types';

// Global error handling middleware
// This catches all errors from routes and formats them consistently
export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    res.status(400).json(
      createErrorResponse(ErrorCodes.VALIDATION_ERROR, messages)
    );
    return;
  }
  
  // Handle our custom application errors
  if (error instanceof AppError) {
    res.status(error.statusCode).json(
      createErrorResponse(error.code, error.message)
    );
    return;
  }
  
  // Log unexpected errors for debugging
  console.error('Unexpected error:', error);
  
  // Handle all other unexpected errors
  res.status(500).json(
    createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'An unexpected error occurred'
    )
  );
}
