import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware.js';
import {
  getPendingDailyMcqs,
  getStudentMcqHistory,
  getMcqAssignmentDetails,
  submitDailyMcqAssignment,
  getFacultyTopicAnalytics
} from '../controllers/mcqController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Student routes
router.get('/daily/pending', authorizeRole(['Student', 'Admin']), getPendingDailyMcqs);
router.get('/daily/history', authorizeRole(['Student', 'Admin']), getStudentMcqHistory);
router.get('/daily/assignment/:id', authorizeRole(['Student', 'Faculty', 'Admin']), getMcqAssignmentDetails);
router.post('/daily/submit', authorizeRole(['Student', 'Admin']), submitDailyMcqAssignment);

// Faculty analytics route
router.get('/faculty/topic-analytics/:sessionId', authorizeRole(['Faculty', 'Admin', 'Dean', 'Principal', 'Chancellor']), getFacultyTopicAnalytics);

export default router;
