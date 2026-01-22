import prisma from '../config/database';
import { redisClient, cacheKeys, cacheTTL, invalidateCache } from '../config/redis';
import { AppError, ErrorCodes } from '../utils/types';

// Service layer for project operations
// Handles business logic for creating, reading, updating projects

export class ProjectService {
  // Get all projects for a specific user
  // This method implements caching to improve performance
  async getUserProjects(userId: string) {
    const cacheKey = cacheKeys.userProjects(userId);
    
    // Try to get data from cache first if Redis is available
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log('Cache hit for user projects:', userId);
        return JSON.parse(cached);
      }
    } catch (error) {
      // Continue without cache if Redis is down
    }
    
    // If not in cache, fetch from database
    console.log('Fetching user projects from database');
    const projects = await prisma.project.findMany({
      where: { ownerId: userId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Format the response to include task count
    const formatted = projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      ownerId: p.ownerId,
      createdAt: p.createdAt,
      taskCount: p._count.tasks,
    }));
    
    // Store in cache for future requests if Redis is available
    try {
      await redisClient.setex(cacheKey, cacheTTL.userProjects, JSON.stringify(formatted));
    } catch (error) {
      // Continue without caching if Redis is down
    }
    
    return formatted;
  }
  
  // Get a single project with all its tasks
  // Also uses caching for better performance
  async getProjectById(projectId: string, userId: string) {
    const cacheKey = cacheKeys.projectDetail(projectId);
    
    // Check cache first if Redis is available
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log('Cache hit for project detail:', projectId);
        const project = JSON.parse(cached);
        
        // Verify user has access to this project
        if (project.ownerId !== userId) {
          throw new AppError(
            ErrorCodes.AUTHORIZATION_ERROR,
            'You do not have access to this project',
            403
          );
        }
        
        return project;
      }
    } catch (error) {
      // Continue without cache if Redis is down
    }
    
    // Fetch from database if not cached with optimized field selection
    console.log('Fetching project detail from database');
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        createdAt: true,
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            assignedTo: true,
            dueDate: true,
            createdAt: true,
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    if (!project) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        'Project not found',
        404
      );
    }
    
    // Check if user owns this project
    if (project.ownerId !== userId) {
      throw new AppError(
        ErrorCodes.AUTHORIZATION_ERROR,
        'You do not have access to this project',
        403
      );
    }
    
    // Cache the result if Redis is available
    try {
      await redisClient.setex(cacheKey, cacheTTL.projectDetail, JSON.stringify(project));
    } catch (error) {
      // Continue without caching if Redis is down
    }
    
    return project;
  }
  
  // Create a new project
  async createProject(userId: string, name: string, description?: string) {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: userId,
      },
    });
    
    // Invalidate the user's project list cache since we added a new project
    await invalidateCache(cacheKeys.userProjects(userId));
    
    return project;
  }

  // Update an existing project
  async updateProject(projectId: string, userId: string, updates: { name?: string; description?: string }) {
    // First verify project exists and user has access
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

    // Update the project
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: updates,
    });

    // Invalidate caches
    await invalidateCache(cacheKeys.userProjects(userId));
    await invalidateCache(cacheKeys.projectDetail(projectId));

    return updated;
  }

  // Delete a project
  async deleteProject(projectId: string, userId: string) {
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

    // Delete the project (cascades to tasks and exports)
    await prisma.project.delete({
      where: { id: projectId },
    });

    // Invalidate caches
    await invalidateCache(cacheKeys.userProjects(userId));
    await invalidateCache(cacheKeys.projectDetail(projectId));

    return { message: 'Project deleted successfully' };
  }
}
