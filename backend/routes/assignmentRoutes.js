import express from 'express';
import { getAssignments, submitAssignment, createAssignment, gradeSubmission } from '../controllers/assignmentController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getAssignments);
router.post('/', authorizeRole(['Faculty', 'Admin', 'HOD', 'Dean']), createAssignment);
router.post('/:id/submit', submitAssignment);
router.patch('/submissions/:id/grade', authorizeRole(['Faculty', 'Admin', 'HOD', 'Dean']), gradeSubmission);

export default router;
