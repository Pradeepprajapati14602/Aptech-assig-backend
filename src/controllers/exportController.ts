import { Response, NextFunction } from 'express';
import path from 'path';
import { AuthRequest } from '../middlewares/auth';
import { ExportService } from '../services/exportService';
import { createSuccessResponse } from '../utils/types';

const exportService = new ExportService();

// Trigger a new export for a project
// Handles POST /api/projects/:id/export
export async function createExport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: projectId } = req.params;
    const userId = req.user!.userId;
    
    const exportRecord = await exportService.createExport(projectId, userId);
    
    res.status(202).json(createSuccessResponse({
      exportId: exportRecord.id,
      status: exportRecord.status,
      message: 'Export job started',
    }));
  } catch (error) {
    next(error);
  }
}

// Get status and details of an export
// Handles GET /api/exports/:id
export async function getExportStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    const exportRecord = await exportService.getExportStatus(id, userId);
    
    // Add download URL if export is completed
    let downloadUrl = null;
    if (exportRecord.status === 'COMPLETED' && exportRecord.filePath) {
      downloadUrl = `/api/exports/${id}/download`;
    }
    
    res.status(200).json(createSuccessResponse({
      ...exportRecord,
      downloadUrl,
    }));
  } catch (error) {
    next(error);
  }
}

// Get all exports for the authenticated user
// Handles GET /api/exports
export async function getUserExports(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    
    const exports = await exportService.getUserExports(userId);
    
    res.status(200).json(createSuccessResponse(exports));
  } catch (error) {
    next(error);
  }
}

// Download a completed export file
// Handles GET /api/exports/:id/download
export async function downloadExport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    const exportRecord = await exportService.getExportStatus(id, userId);
    
    if (exportRecord.status !== 'COMPLETED' || !exportRecord.filePath) {
      res.status(400).json({
        success: false,
        error: {
          code: 'EXPORT_NOT_READY',
          message: 'Export is not ready for download yet',
        },
      });
      return;
    }
    
    // Send the file for download
    const filePath = path.join(process.cwd(), 'exports', exportRecord.filePath);
    res.download(filePath, exportRecord.filePath);
  } catch (error) {
    next(error);
  }
}
