import express, { Application } from 'express';
import cors from 'cors';
import compression from 'compression';
import { config, validateConfig } from './config';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';
import exportRoutes from './routes/exportRoutes';

// Import the export worker to start processing jobs
import './jobs/exportWorker';

// Validate environment variables before starting the server
validateConfig();

const app: Application = express();

// Middleware setup
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(compression()); // Enable gzip compression for all responses
app.use(express.json({ limit: '10mb' })); // Add request size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api', exportRoutes);

// Error handling middleware should be last
app.use(errorHandler);

// Start the server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
});

export default app;
