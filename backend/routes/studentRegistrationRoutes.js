import express from 'express';
import {
  getStudentAcademicContext,
  getStudentCurriculumSubjects,
  getMyRegisteredSubjects,
  validateElectiveSelection,
  confirmRegistration,
  getAdminRegistrationReport,
  toggleRegistrationPeriod,
  adminOverrideRegistration,
  getElectiveAnalytics
} from '../controllers/studentRegistrationController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// Student Endpoints
router.get('/student/academic-context', authenticateToken, getStudentAcademicContext);
router.get('/student/my-curriculum', authenticateToken, getStudentCurriculumSubjects);
router.get('/student/my-subjects', authenticateToken, getMyRegisteredSubjects);
router.post('/student/registration/validate', authenticateToken, validateElectiveSelection);
router.post('/student/registration/confirm', authenticateToken, confirmRegistration);

// Admin / HOD Endpoints
router.get('/admin/registrations', authenticateToken, authorizeRole(['Admin', 'HOD']), getAdminRegistrationReport);
router.post('/admin/registration-periods/toggle', authenticateToken, authorizeRole(['Admin', 'HOD']), toggleRegistrationPeriod);
router.post('/admin/registrations/override', authenticateToken, authorizeRole(['Admin', 'HOD']), adminOverrideRegistration);
router.get('/admin/elective-analytics', authenticateToken, authorizeRole(['Admin', 'HOD']), getElectiveAnalytics);

export default router;
