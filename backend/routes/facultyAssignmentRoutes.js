import express from 'express';
import {
  getFacultyAssignments,
  getAvailableFaculty,
  createFacultyAssignment,
  updateFacultyAssignment,
  approveFacultyAssignment,
  deleteFacultyAssignment
} from '../controllers/facultyAssignmentController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// Faculty Assignment Routes
router.get('/faculty-assignments', authenticateToken, getFacultyAssignments);
router.get('/faculty-assignments/available-faculty', authenticateToken, getAvailableFaculty);
router.post('/faculty-assignments', authenticateToken, authorizeRole(['Admin', 'HOD']), createFacultyAssignment);
router.put('/faculty-assignments/:id', authenticateToken, authorizeRole(['Admin', 'HOD']), updateFacultyAssignment);
router.patch('/faculty-assignments/:id/approve', authenticateToken, authorizeRole(['Admin', 'HOD']), approveFacultyAssignment);
router.delete('/faculty-assignments/:id', authenticateToken, authorizeRole(['Admin', 'HOD']), deleteFacultyAssignment);

export default router;
