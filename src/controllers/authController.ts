import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { registerSchema, loginSchema, createSuccessResponse } from '../utils/types';

const authService = new AuthService();

// Controller for user registration
// Handles POST /api/auth/register
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validate request body against schema
    const { name, email, password } = registerSchema.parse(req.body);
    
    // Call service to create user
    const result = await authService.register(name, email, password);
    
    res.status(201).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
}

// Controller for user login
// Handles POST /api/auth/login
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validate request body
    const { email, password } = loginSchema.parse(req.body);
    
    // Authenticate user
    const result = await authService.login(email, password);
    
    res.status(200).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
}
