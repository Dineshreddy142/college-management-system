import express from 'express';
import {
  getSubjectCategories,
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  updateSubjectStatus
} from '../controllers/subjectController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// Subject Categories Route
router.get('/subject-categories', getSubjectCategories);

// Subject Management Routes
router.get('/subjects', getSubjects);
router.get('/subjects/:id', getSubjectById);
router.post('/subjects', authenticateToken, authorizeRole(['Admin', 'HOD']), createSubject);
router.put('/subjects/:id', authenticateToken, authorizeRole(['Admin', 'HOD']), updateSubject);
router.patch('/subjects/:id/status', authenticateToken, authorizeRole(['Admin', 'HOD']), updateSubjectStatus);

export default router;
