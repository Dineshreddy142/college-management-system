import express from 'express';
import {
  getFacultyTodaysClasses,
  getAttendanceSessionRoster,
  submitAttendanceSession,
  getStudentAttendanceSummary,
  getHODAttendanceOverview,
  getAdminAttendanceOverview,
  correctAttendanceRecord,
  cancelClassSession
} from '../controllers/attendanceController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// Faculty Routes
router.get('/attendance/faculty/todays-classes', authenticateToken, authorizeRole(['Faculty', 'Admin']), getFacultyTodaysClasses);
router.get('/attendance/session/:id/roster', authenticateToken, authorizeRole(['Faculty', 'Admin']), getAttendanceSessionRoster);
router.post('/attendance/session/:id/submit', authenticateToken, authorizeRole(['Faculty', 'Admin']), submitAttendanceSession);

// Student Routes
router.get('/attendance/student/summary', authenticateToken, getStudentAttendanceSummary);

// HOD & Admin Routes
router.get('/attendance/hod/overview', authenticateToken, authorizeRole(['HOD', 'Admin']), getHODAttendanceOverview);
router.get('/attendance/admin/overview', authenticateToken, authorizeRole(['Admin']), getAdminAttendanceOverview);
router.post('/attendance/admin/correct', authenticateToken, authorizeRole(['Admin', 'HOD']), correctAttendanceRecord);
router.post('/attendance/admin/cancel-session', authenticateToken, authorizeRole(['Admin', 'HOD']), cancelClassSession);

export default router;
