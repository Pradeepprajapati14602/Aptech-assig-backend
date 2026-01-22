import prisma from '../config/database';
import { exportQueue } from '../jobs/exportQueue';
import { isRedisConnected } from '../config/redis';
import { processExportJob } from '../jobs/exportWorker';
import { AppError, ErrorCodes } from '../utils/types';

// Service for handling export operations
// Creates export jobs and tracks their status

export class ExportService {
  // Trigger a new export job for a project
  async createExport(projectId: string, userId: string) {
    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        'Project not found',
        404
      );
    }
    
    if (project.ownerId !== userId) {
      throw new AppError(
        ErrorCodes.AUTHORIZATION_ERROR,
        'You do not have access to this project',
        403
      );
    }
    
    // Create export record in database with pending status
    const exportRecord = await prisma.export.create({
      data: {
        projectId,
        userId,
        status: 'PENDING',
      },
    });
    
    // Check if Redis is available for queue processing
    if (isRedisConnected()) {
      // Add job to queue for background processing
      await exportQueue.add({
        exportId: exportRecord.id,
        projectId,
        userId,
      });
    } else {
      // Process export synchronously if Redis is not available
      console.log('Redis unavailable - processing export synchronously');
      try {
        await processExportJob({
          exportId: exportRecord.id,
          projectId,
          userId,
        });
      } catch (error) {
        console.error('Export processing failed:', error);
        // Update export status to failed
        await prisma.export.update({
          where: { id: exportRecord.id },
          data: { status: 'FAILED' },
        });
        throw error;
      }
    }
    
    return exportRecord;
  }
  
  // Get status of a specific export
  async getExportStatus(exportId: string, userId: string) {
    const exportRecord = await prisma.export.findUnique({
      where: { id: exportId },
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
    });
    
    if (!exportRecord) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        'Export not found',
        404
      );
    }
    
    // Verify user owns this export
    if (exportRecord.userId !== userId) {
      throw new AppError(
        ErrorCodes.AUTHORIZATION_ERROR,
        'You do not have access to this export',
        403
      );
    }
    
    return exportRecord;
  }
  
  // Get all exports for a user
  async getUserExports(userId: string) {
    const exports = await prisma.export.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return exports;
  }
}
