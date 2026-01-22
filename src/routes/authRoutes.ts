import { Router } from 'express';
import { register, login } from '../controllers/authController';

const router = Router();

// Auth routes - no authentication required for these endpoints
router.post('/register', register);
router.post('/login', login);

export default router;
