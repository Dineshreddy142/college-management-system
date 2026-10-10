import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware.js';
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
router.get('/daily/pending', authorizeRoles('Student', 'Admin'), getPendingDailyMcqs);
router.get('/daily/history', authorizeRoles('Student', 'Admin'), getStudentMcqHistory);
router.get('/daily/assignment/:id', authorizeRoles('Student', 'Faculty', 'Admin'), getMcqAssignmentDetails);
router.post('/daily/submit', authorizeRoles('Student', 'Admin'), submitDailyMcqAssignment);

// Faculty analytics route
router.get('/faculty/topic-analytics/:sessionId', authorizeRoles('Faculty', 'Admin', 'Dean', 'Principal', 'Chancellor'), getFacultyTopicAnalytics);

export default router;
