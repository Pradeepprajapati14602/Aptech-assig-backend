import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config';
import { AppError, ErrorCodes } from '../utils/types';

// Service layer for authentication operations
// This contains the business logic for user registration and login

export class AuthService {
  // Register a new user in the system
  async register(name: string, email: string, password: string) {
    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      throw new AppError(
        ErrorCodes.CONFLICT,
        'User with this email already exists',
        409
      );
    }
    
    // Hash the password before storing it
    // Using bcrypt with 10 rounds of salting for security
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create the user in database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });
    
    // Generate JWT token for the new user
    const token = this.generateToken(user.id, user.email);
    
    return {
      user,
      token,
    };
  }
  
  // Login existing user
  async login(email: string, password: string) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      throw new AppError(
        ErrorCodes.AUTHENTICATION_ERROR,
        'Invalid email or password',
        401
      );
    }
    
    // Verify password matches the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new AppError(
        ErrorCodes.AUTHENTICATION_ERROR,
        'Invalid email or password',
        401
      );
    }
    
    // Generate JWT token for authenticated user
    const token = this.generateToken(user.id, user.email);
    
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  }
  
  // Helper method to generate JWT tokens
  private generateToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      config.jwt.secret as string,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );
  }
}
