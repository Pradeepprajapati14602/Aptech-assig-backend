import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { TaskService } from '../services/taskService';
import { createTaskSchema, updateTaskSchema, createSuccessResponse } from '../utils/types';

const taskService = new TaskService();

// Create a new task
// Handles POST /api/tasks
export async function createTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const data = createTaskSchema.parse(req.body);
    
    const task = await taskService.createTask({
      ...data,
      userId,
    });
    
    res.status(201).json(createSuccessResponse(task));
  } catch (error) {
    next(error);
  }
}

// Update an existing task
// Handles PATCH /api/tasks/:id
export async function updateTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const updates = updateTaskSchema.parse(req.body);
    
    const task = await taskService.updateTask(id, userId, updates);
    
    res.status(200).json(createSuccessResponse(task));
  } catch (error) {
    next(error);
  }
}

// Delete a task
// Handles DELETE /api/tasks/:id
export async function deleteTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    const result = await taskService.deleteTask(id, userId);
    
    res.status(200).json(createSuccessResponse(result));
  } catch (error) {
    next(error);
  }
}
