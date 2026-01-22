import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { createTask, updateTask, deleteTask } from '../controllers/taskController';

const router = Router();

// All task routes require authentication
router.use(authenticate);

// Task CRUD endpoints
router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
