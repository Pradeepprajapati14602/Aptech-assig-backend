import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration object that holds all environment variables
// This makes it easy to access config values throughout the app
export const config = {
  // Server settings
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL || '',
  },
  
  // Redis configuration for caching and queue
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  
  // JWT authentication settings
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // Frontend URL for CORS configuration
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

// Validate that required environment variables are present
export function validateConfig(): void {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
