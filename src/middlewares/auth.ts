import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ErrorCodes, createErrorResponse } from '../utils/types';

// Extend Express Request interface to include user info
// This allows us to access user data in protected routes
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

// Middleware to verify JWT tokens and protect routes
// This runs on every protected endpoint to ensure user is authenticated
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get token from Authorization header
    // Expected format: "Bearer <token>"
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(
        createErrorResponse(
          ErrorCodes.AUTHENTICATION_ERROR,
          'No token provided or invalid format'
        )
      );
      return;
    }
    
    // Extract the token part after "Bearer "
    const token = authHeader.substring(7);
    
    // Verify the token using our secret key
    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      email: string;
    };
    
    // Attach user info to request object so controllers can access it
    (req as AuthRequest).user = decoded;
    
    next();
  } catch (error) {
    // Token is invalid or expired
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json(
        createErrorResponse(
          ErrorCodes.AUTHENTICATION_ERROR,
          'Invalid or expired token'
        )
      );
      return;
    }
    
    // Other unexpected errors
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Authentication failed'
      )
    );
  }
}
