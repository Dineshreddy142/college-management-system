import express from 'express';
import {
  getExamTypes,
  getExams,
  createExam,
  getExamSchedule,
  saveExamSchedule,
  calculateExamEligibility,
  overrideEligibility,
  getFacultyMarksEntry,
  submitFacultyMarks,
  calculateExamResults,
  publishExamResults,
  getStudentResults,
  getOfficialMarksheet,
  submitRevaluationRequest,
  reviewRevaluation,
  generateHallTickets,
  getHallTickets,
  getStudentHallTicket,
  generateAnonymizedTokens,
  getAnonymizedEvaluations,
  submitAnonymizedMarks,
  decodeAnonymizedTokens
} from '../controllers/examController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

const coeRoles = ['Admin', 'HOD', 'COE', 'Controller of Examinations'];

// Admin / COE Exam Setup & Schedule Routes
router.get('/exams/types', authenticateToken, getExamTypes);
router.get('/exams', authenticateToken, getExams);
router.post('/exams', authenticateToken, authorizeRole(coeRoles), createExam);
router.get('/exams/:id/schedule', authenticateToken, getExamSchedule);
router.post('/exams/:id/schedule', authenticateToken, authorizeRole(coeRoles), saveExamSchedule);

// Exam Eligibility & Overrides
router.get('/exams/:id/eligibility', authenticateToken, authorizeRole(coeRoles), calculateExamEligibility);
router.post('/exams/:id/eligibility/override', authenticateToken, authorizeRole(coeRoles), overrideEligibility);

// Faculty Marks Entry Routes
router.get('/faculty/marks-entry', authenticateToken, authorizeRole(['Faculty', 'Admin', 'COE', 'Controller of Examinations']), getFacultyMarksEntry);
router.post('/faculty/marks/submit', authenticateToken, authorizeRole(['Faculty', 'Admin', 'COE', 'Controller of Examinations']), submitFacultyMarks);

// Results Calculation & Publishing
router.post('/exams/:id/calculate-results', authenticateToken, authorizeRole(coeRoles), calculateExamResults);
router.post('/exams/:id/publish', authenticateToken, authorizeRole(coeRoles), publishExamResults);

// Student Results & Marksheet Routes
router.get('/student/my-results', authenticateToken, getStudentResults);
router.get('/student/official-marksheet', authenticateToken, getOfficialMarksheet);

// Student Hall Ticket Route
router.get('/student/my-hall-ticket', authenticateToken, getStudentHallTicket);

// COE Extension 1: Hall Ticket Auto-Generator Routes
router.post('/exams/:id/hall-tickets/generate', authenticateToken, authorizeRole(coeRoles), generateHallTickets);
router.get('/exams/:id/hall-tickets', authenticateToken, authorizeRole(coeRoles), getHallTickets);

// COE Extension 2: Barcoded / Anonymized Answer Sheet Evaluator Hub Routes
router.post('/exams/:id/anonymized-evaluations/generate', authenticateToken, authorizeRole(coeRoles), generateAnonymizedTokens);
router.get('/exams/:id/anonymized-evaluations', authenticateToken, authorizeRole(coeRoles), getAnonymizedEvaluations);
router.post('/exams/anonymized-evaluations/submit', authenticateToken, authorizeRole(['Faculty', 'Admin', 'COE', 'Controller of Examinations']), submitAnonymizedMarks);
router.post('/exams/:id/anonymized-evaluations/decode', authenticateToken, authorizeRole(coeRoles), decodeAnonymizedTokens);

// Revaluation Requests Routes
router.post('/revaluation', authenticateToken, submitRevaluationRequest);
router.post('/admin/revaluations/review', authenticateToken, authorizeRole(coeRoles), reviewRevaluation);

export default router;

