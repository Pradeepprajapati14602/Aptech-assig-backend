import { Job } from 'bull';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../config/database';
import { exportQueue, ExportJobData } from './exportQueue';

// Function to process export job data
// Extracted so it can be called directly or from queue
export async function processExportJob(data: ExportJobData) {
  const { exportId, projectId } = data;
  
  console.log(`Starting export job for project ${projectId}`);
  
  try {
    // Update export status to processing
    await prisma.export.update({
      where: { id: exportId },
      data: { status: 'PROCESSING' },
    });
    
    // Fetch project data with all tasks
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Calculate statistics for the summary
    const totalTasks = project.tasks.length;
    const tasksByStatus = {
      todo: project.tasks.filter(t => t.status === 'TODO').length,
      inProgress: project.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      done: project.tasks.filter(t => t.status === 'DONE').length,
    };
    const tasksByPriority = {
      low: project.tasks.filter(t => t.priority === 'LOW').length,
      medium: project.tasks.filter(t => t.priority === 'MEDIUM').length,
      high: project.tasks.filter(t => t.priority === 'HIGH').length,
    };
    
    // Generate JSON export with all data
    const exportData = {
      project: {
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
      },
      summary: {
        totalTasks,
        byStatus: tasksByStatus,
        byPriority: tasksByPriority,
      },
      tasks: project.tasks.map(task => ({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee ? task.assignee.name : 'Unassigned',
        assigneeEmail: task.assignee ? task.assignee.email : null,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
      })),
    };
    
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(process.cwd(), 'exports');
    await fs.mkdir(exportsDir, { recursive: true });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `project-${projectId}-${timestamp}.json`;
    const filePath = path.join(exportsDir, filename);
    
    // Write the export file
    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    
    // Update export record with completion details
    await prisma.export.update({
      where: { id: exportId },
      data: {
        status: 'COMPLETED',
        filePath: filename,  // Store just filename, not full path
        completedAt: new Date(),
      },
    });
    
    console.log(`Export job completed successfully: ${filename}`);
  } catch (error) {
    console.error(`Export job failed for project ${projectId}:`, error);
    
    // Update export status to failed
    await prisma.export.update({
      where: { id: exportId },
      data: { status: 'FAILED' },
    });
    
    throw error;
  }
}

// Worker that processes export jobs from the queue
// This runs in the background and generates export files
exportQueue.process(async (job: Job<ExportJobData>) => {
  await processExportJob(job.data);
});

console.log('Export worker started and listening for jobs');
