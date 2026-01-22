import Queue from 'bull';
import { config } from '../config';

// Create a Bull queue for handling export jobs
// This queue processes export requests in the background
export const exportQueue = new Queue('project-exports', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
  },
  defaultJobOptions: {
    attempts: 3,  // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,  // Start with 2 second delay, doubles each retry
    },
    removeOnComplete: false,  // Keep completed jobs for history
    removeOnFail: false,  // Keep failed jobs for debugging
  },
});

// Log queue events for monitoring
exportQueue.on('completed', (job) => {
  console.log(`Export job ${job.id} completed successfully`);
});

exportQueue.on('failed', (job, err) => {
  console.error(`Export job ${job.id} failed:`, err.message);
});

exportQueue.on('stalled', (job) => {
  console.warn(`Export job ${job.id} stalled and will be retried`);
});

// Interface for export job data
export interface ExportJobData {
  exportId: string;
  projectId: string;
  userId: string;
}
