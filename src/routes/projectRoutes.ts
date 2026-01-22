import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { getProjects, getProjectById, createProject, updateProject, deleteProject } from '../controllers/projectController';

const router = Router();

// All project routes require authentication
router.use(authenticate);

// Project CRUD endpoints
router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;
