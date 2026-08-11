import express from 'express';
import multer from 'multer';
import {
  importStudents,
  importAttendance,
  importMarks,
  importFaculty,
  downloadTemplate,
  getAcademicStats
} from '../controllers/bulkUploadController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB limit for large sheets
});

const router = express.Router();

// Bulk Import Endpoints (Admin, Faculty, HOD)
router.post('/students', authenticateToken, authorizeRole(['Admin', 'HOD']), upload.single('file'), importStudents);
router.post('/attendance', authenticateToken, authorizeRole(['Admin', 'Faculty', 'HOD']), upload.single('file'), importAttendance);
router.post('/marks', authenticateToken, authorizeRole(['Admin', 'Faculty', 'HOD']), upload.single('file'), importMarks);
router.post('/faculty', authenticateToken, authorizeRole(['Admin']), upload.single('file'), importFaculty);

// Template Download (Public / Authenticated)
router.get('/template/:type', downloadTemplate);

// Academic Summary Stats
router.get('/stats', authenticateToken, getAcademicStats);

export default router;
