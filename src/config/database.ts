import { PrismaClient } from '@prisma/client';

// Create a single instance of Prisma Client
// This will be used throughout the application for database operations
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle graceful shutdown when the app closes
// This ensures database connections are properly closed
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
