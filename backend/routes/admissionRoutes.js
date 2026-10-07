import express from 'express';
import {
  getDashboardStats,
  getCycles,
  getCycleById,
  createCycle,
  updateCycle,
  updateCycleStatus,
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  updateProgramStatus,
  getApplicants,
  getApplicantById,
  createApplicant,
  updateApplicant,
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  getApplicationPreferences,
  updateApplicationPreferences,
  getApplicationDocuments,
  uploadApplicationDocument,
  verifyDocument,
  verifyEligibility,
  getInterviews,
  scheduleInterview,
  updateInterview,
  updateInterviewStatus,
  submitDecision,
  getApplicationDecisions,
  getApplicationPayments,
  recordPayment,
  convertToStudent
} from '../controllers/admissionController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();
const allowedRoles = ['Admin', 'Registrar', 'Admission Officer', 'Admission'];

// All routes protected by JWT and RBAC
router.use(authenticateToken);
router.use(authorizeRole(allowedRoles));

// Dashboard Stats
router.get('/dashboard-stats', getDashboardStats);

// Admission Cycles
router.get('/cycles', getCycles);
router.get('/cycles/:id', getCycleById);
router.post('/cycles', createCycle);
router.put('/cycles/:id', updateCycle);
router.patch('/cycles/:id/status', updateCycleStatus);

// Admission Programs
router.get('/programs', getPrograms);
router.get('/programs/:id', getProgramById);
router.post('/programs', createProgram);
router.put('/programs/:id', updateProgram);
router.patch('/programs/:id/status', updateProgramStatus);

// Applicants Master
router.get('/applicants', getApplicants);
router.get('/applicants/:id', getApplicantById);
router.post('/applicants', createApplicant);
router.put('/applicants/:id', updateApplicant);

// Applications
router.get('/applications', getApplications);
router.get('/applications/:id', getApplicationById);
router.post('/applications', createApplication);
router.put('/applications/:id', updateApplication);
router.patch('/applications/:id/status', updateApplicationStatus);

// Preferences
router.get('/applications/:id/preferences', getApplicationPreferences);
router.put('/applications/:id/preferences', updateApplicationPreferences);

// Documents
router.get('/applications/:id/documents', getApplicationDocuments);
router.post('/applications/:id/documents', uploadApplicationDocument);
router.patch('/documents/:docId/verify', verifyDocument);

// Eligibility Verification
router.post('/applications/:id/verify-eligibility', verifyEligibility);

// Interviews
router.get('/interviews', getInterviews);
router.post('/interviews', scheduleInterview);
router.put('/interviews/:id', updateInterview);
router.patch('/interviews/:id/status', updateInterviewStatus);

// Decisions
router.post('/applications/:id/decision', submitDecision);
router.get('/applications/:id/decisions', getApplicationDecisions);

// Payments & Receipts
router.get('/applications/:id/payments', getApplicationPayments);
router.post('/applications/:id/payments', recordPayment);

// Student Enrolment Conversion
router.post('/applications/:id/convert-to-student', convertToStudent);

export default router;
