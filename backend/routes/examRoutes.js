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
  reviewRevaluation
} from '../controllers/examController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// Admin / HOD Exam Setup & Schedule Routes
router.get('/exams/types', authenticateToken, getExamTypes);
router.get('/exams', authenticateToken, getExams);
router.post('/exams', authenticateToken, authorizeRole(['Admin', 'HOD']), createExam);
router.get('/exams/:id/schedule', authenticateToken, getExamSchedule);
router.post('/exams/:id/schedule', authenticateToken, authorizeRole(['Admin', 'HOD']), saveExamSchedule);

// Exam Eligibility & Overrides
router.get('/exams/:id/eligibility', authenticateToken, authorizeRole(['Admin', 'HOD']), calculateExamEligibility);
router.post('/exams/:id/eligibility/override', authenticateToken, authorizeRole(['Admin', 'HOD']), overrideEligibility);

// Faculty Marks Entry Routes
router.get('/faculty/marks-entry', authenticateToken, authorizeRole(['Faculty', 'Admin']), getFacultyMarksEntry);
router.post('/faculty/marks/submit', authenticateToken, authorizeRole(['Faculty', 'Admin']), submitFacultyMarks);

// Results Calculation & Publishing
router.post('/exams/:id/calculate-results', authenticateToken, authorizeRole(['Admin', 'HOD']), calculateExamResults);
router.post('/exams/:id/publish', authenticateToken, authorizeRole(['Admin', 'HOD']), publishExamResults);

// Student Results & Marksheet Routes
router.get('/student/my-results', authenticateToken, getStudentResults);
router.get('/student/official-marksheet', authenticateToken, getOfficialMarksheet);

// Revaluation Requests Routes
router.post('/revaluation', authenticateToken, submitRevaluationRequest);
router.post('/admin/revaluations/review', authenticateToken, authorizeRole(['Admin', 'HOD']), reviewRevaluation);

export default router;
