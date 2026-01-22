import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { ProjectService } from '../services/projectService';
import { createProjectSchema, createSuccessResponse } from '../utils/types';

const projectService = new ProjectService();

// Get all projects for the authenticated user
// Handles GET /api/projects
export async function getProjects(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    
    const projects = await projectService.getUserProjects(userId);
    
    res.status(200).json(createSuccessResponse(projects));
  } catch (error) {
    next(error);
  }
}

// Get a single project with all its tasks
// Handles GET /api/projects/:id
export async function getProjectById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    const project = await projectService.getProjectById(id, userId);
    
    res.status(200).json(createSuccessResponse(project));
  } catch (error) {
    next(error);
  }
}

// Create a new project
// Handles POST /api/projects
export async function createProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { name, description } = createProjectSchema.parse(req.body);
    
    const project = await projectService.createProject(userId, name, description);
    
    res.status(201).json(createSuccessResponse(project));
  } catch (error) {
    next(error);
  }
}

// Update an existing project
// Handles PATCH /api/projects/:id
export async function updateProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { name, description } = req.body;
    
    const project = await projectService.updateProject(id, userId, { name, description });
    
    res.status(200).json(createSuccessResponse(project));
  } catch (error) {
    next(error);
  }
}

// Delete a project
// Handles DELETE /api/projects/:id
export async function deleteProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    const result = await projectService.deleteProject(id, userId);
    
    res.status(200).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
}
