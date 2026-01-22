import Redis from 'ioredis';
import { config } from './index';

// Track if Redis is available
let isRedisAvailable = false;

// Create Redis client for caching
// This is used to store frequently accessed data to reduce database load
export const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  retryStrategy: (times: number) => {
    // Stop retrying after 3 attempts to avoid spam
    if (times > 3) {
      console.log('Redis unavailable - continuing without caching');
      return null;
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Handle connection events
redisClient.on('connect', () => {
  isRedisAvailable = true;
  console.log('Redis client connected successfully');
});

redisClient.on('error', (error: Error) => {
  isRedisAvailable = false;
  // Only log once to avoid spam
  if ((error as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
    console.log('Redis not available - running without cache');
  }
});

// Helper to check if Redis is available
export function isRedisConnected(): boolean {
  return isRedisAvailable && redisClient.status === 'ready';
}

// Cache key patterns used throughout the application
export const cacheKeys = {
  // Pattern: projects:user:{userId}
  userProjects: (userId: string) => `projects:user:${userId}`,
  
  // Pattern: project:{projectId}
  projectDetail: (projectId: string) => `project:${projectId}`,
};

// Cache TTL values in seconds
export const cacheTTL = {
  userProjects: 300,  // 5 minutes
  projectDetail: 120,  // 2 minutes
};

// Helper function to invalidate cache
export async function invalidateCache(pattern: string): Promise<void> {
  // Skip if Redis is not available
  if (!isRedisConnected()) {
    return;
  }
  
  try {
    // If it's a specific key, delete it directly
    if (!pattern.includes('*')) {
      await redisClient.del(pattern);
      return;
    }
    
    // If it's a pattern with wildcards, find and delete all matching keys
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    // Silently fail if Redis is down
    console.log('Cache invalidation skipped - Redis unavailable');
  }
}
