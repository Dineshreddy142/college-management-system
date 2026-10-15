import express from 'express';
import {
  getStudentProfile,
  getStudentAttendance,
  getStudentAssignments,
  getStudentTimetable,
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentAcademicContext,
  getStudentCurriculumSubjects,
  getMyRegisteredSubjects,
  validateElectiveSelection,
  confirmRegistration,
  bookStudentSlot,
  getAdminRegistrationReport,
  toggleRegistrationPeriod,
  adminOverrideRegistration,
  getElectiveAnalytics
} from '../controllers/studentPortalController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// --- STUDENT PORTAL ENDPOINTS ---
router.get('/profile', authenticateToken, getStudentProfile);
router.get('/attendance', authenticateToken, getStudentAttendance);
router.get('/assignments', authenticateToken, getStudentAssignments);
router.get('/timetable', authenticateToken, getStudentTimetable);

// --- STUDENT ELECTIVE & COURSE REGISTRATION ENDPOINTS ---
router.get('/academic-context', authenticateToken, getStudentAcademicContext);
router.get('/my-curriculum', authenticateToken, getStudentCurriculumSubjects);
router.get('/my-subjects', authenticateToken, getMyRegisteredSubjects);
router.post('/registration/validate', authenticateToken, validateElectiveSelection);
router.post('/registration/confirm', authenticateToken, confirmRegistration);
router.post('/registration/book-slot', authenticateToken, bookStudentSlot);

// --- ADMIN / MANAGEMENT ENDPOINTS FOR STUDENTS ---
router.get('/', authenticateToken, authorizeRole(['Admin', 'HOD', 'Faculty']), getAllStudents);
router.post('/', authenticateToken, authorizeRole(['Admin', 'HOD']), createStudent);
router.put('/:id', authenticateToken, authorizeRole(['Admin', 'HOD']), updateStudent);
router.delete('/:id', authenticateToken, authorizeRole(['Admin']), deleteStudent);
router.get('/admin/registrations', authenticateToken, authorizeRole(['Admin', 'HOD']), getAdminRegistrationReport);
router.post('/admin/registration-periods/toggle', authenticateToken, authorizeRole(['Admin', 'HOD']), toggleRegistrationPeriod);
router.post('/admin/registrations/override', authenticateToken, authorizeRole(['Admin', 'HOD']), adminOverrideRegistration);
router.get('/admin/elective-analytics', authenticateToken, authorizeRole(['Admin', 'HOD']), getElectiveAnalytics);

export default router;
