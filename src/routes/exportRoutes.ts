import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { 
  createExport, 
  getExportStatus, 
  getUserExports, 
  downloadExport 
} from '../controllers/exportController';

const router = Router();

// All export routes require authentication
router.use(authenticate);

// Export endpoints
router.post('/projects/:id/export', createExport);
router.get('/exports', getUserExports);
router.get('/exports/:id', getExportStatus);
router.get('/exports/:id/download', downloadExport);

export default router;
