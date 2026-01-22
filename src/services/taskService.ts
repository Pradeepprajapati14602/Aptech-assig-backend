import prisma from '../config/database';
import { invalidateCache, cacheKeys } from '../config/redis';
import { AppError, ErrorCodes } from '../utils/types';

// Service for task-related operations
// Contains business logic for creating, updating, and deleting tasks

export class TaskService {
  // Create a new task in a project
  async createTask(data: {
    projectId: string;
    title: string;
    description?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    assignedTo?: string;
    dueDate?: string;
    userId: string;
  }) {
    // First verify that the project exists and user has access to it
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });
    
    if (!project) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        'Project not found',
        404
      );
    }
    
    if (project.ownerId !== data.userId) {
      throw new AppError(
        ErrorCodes.AUTHORIZATION_ERROR,
        'You do not have access to this project',
        403
      );
    }
    
    // If assignedTo is provided, verify that user exists
    if (data.assignedTo) {
      const assignee = await prisma.user.findUnique({
        where: { id: data.assignedTo },
      });
      
      if (!assignee) {
        throw new AppError(
          ErrorCodes.NOT_FOUND,
          'Assigned user not found',
          404
        );
      }
    }
    
    // Create the task
    const task = await prisma.task.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        assignedTo: data.assignedTo,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    // Invalidate cache for this project since we added a new task
    await invalidateCache(cacheKeys.projectDetail(data.projectId));
    await invalidateCache(cacheKeys.userProjects(data.userId));
    
    return task;
  }
  
  // Update an existing task
  async updateTask(
    taskId: string,
    userId: string,
    updates: {
      title?: string;
      description?: string;
      status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
      priority?: 'LOW' | 'MEDIUM' | 'HIGH';
      assignedTo?: string;
      dueDate?: string;
    }
  ) {
    // Find the task and verify access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });
    
    if (!task) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        'Task not found',
        404
      );
    }
    
    // Check if user owns the project
    if (task.project.ownerId !== userId) {
      throw new AppError(
        ErrorCodes.AUTHORIZATION_ERROR,
        'You do not have access to this task',
        403
      );
    }
    
    // If updating assignedTo, verify the user exists
    if (updates.assignedTo) {
      const assignee = await prisma.user.findUnique({
        where: { id: updates.assignedTo },
      });
      
      if (!assignee) {
        throw new AppError(
          ErrorCodes.NOT_FOUND,
          'Assigned user not found',
          404
        );
      }
    }
    
    // Update the task
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...updates,
        dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    // Invalidate relevant caches
    await invalidateCache(cacheKeys.projectDetail(task.projectId));
    await invalidateCache(cacheKeys.userProjects(userId));
    
    return updated;
  }
  
  // Delete a task
  async deleteTask(taskId: string, userId: string) {
    // Find task and verify access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });
    
    if (!task) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        'Task not found',
        404
      );
    }
    
    if (task.project.ownerId !== userId) {
      throw new AppError(
        ErrorCodes.AUTHORIZATION_ERROR,
        'You do not have access to this task',
        403
      );
    }
    
    // Delete the task
    await prisma.task.delete({
      where: { id: taskId },
    });
    
    // Invalidate caches
    await invalidateCache(cacheKeys.projectDetail(task.projectId));
    await invalidateCache(cacheKeys.userProjects(userId));
    
    return { message: 'Task deleted successfully' };
  }
}
