import express from 'express';
import {
  getDashboardStats,
  getApplications,
  getApplicationById,
  createApplication,
  updateApplicationStatus,
  verifyDocument,
  uploadDocumentFile,
  verifyEligibility,
  allocateSeat,
  recordPayment,
  confirmAdmission,
  getCoursesAndSeats,
  getAdmissionReports
} from '../controllers/admissionController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// Allow Admin, Registrar, and Admission Officer roles
const allowedRoles = ['Admin', 'Registrar', 'Admission Officer', 'Admission'];

router.get('/dashboard-stats', authenticateToken, authorizeRole(allowedRoles), getDashboardStats);
router.get('/applications', authenticateToken, authorizeRole(allowedRoles), getApplications);
router.post('/applications', authenticateToken, authorizeRole(allowedRoles), createApplication);
router.get('/applications/:id', authenticateToken, authorizeRole(allowedRoles), getApplicationById);
router.put('/applications/:id/status', authenticateToken, authorizeRole(allowedRoles), updateApplicationStatus);

router.post('/documents/:docId/verify', authenticateToken, authorizeRole(allowedRoles), verifyDocument);
router.post('/documents/:docId/upload', authenticateToken, authorizeRole(allowedRoles), uploadDocumentFile);
router.post('/applications/:id/verify-eligibility', authenticateToken, authorizeRole(allowedRoles), verifyEligibility);
router.post('/applications/:id/allocate-seat', authenticateToken, authorizeRole(allowedRoles), allocateSeat);
router.post('/applications/:id/record-payment', authenticateToken, authorizeRole(allowedRoles), recordPayment);
router.post('/applications/:id/confirm-admission', authenticateToken, authorizeRole(allowedRoles), confirmAdmission);

router.get('/courses-seats', authenticateToken, authorizeRole(allowedRoles), getCoursesAndSeats);
router.get('/reports', authenticateToken, authorizeRole(allowedRoles), getAdmissionReports);

export default router;
