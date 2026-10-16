import express from 'express';
import {
  verifyCandidateLogin,
  verifyExamPasskey,
  verifyFaceAndStartSession,
  getExamSessionDetails,
  saveCandidateAnswer,
  recordExamHeartbeat,
  reportExamViolation,
  submitExamSession,
  getProctorLiveFeed,
  proctorCandidateAction,
  getQuestionBanks,
  createQuestionBank,
  addQuestionToBank,
  createOnlineExam
} from '../controllers/onlineExamController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();
const facultyAndAdmin = ['Admin', 'Faculty', 'HOD', 'Controller of Examinations', 'COE', 'Dean', 'Principal'];

// --- 3-FACTOR CANDIDATE AUTHENTICATION & GATEKEEPER ---
// Factor 1: Email + Password Candidate Verification
router.post('/verify-login', verifyCandidateLogin);

// Factor 2: Exam Passkey Verification
router.post('/:examId/verify-passkey', verifyExamPasskey);

// Factor 3: Face Biometric & Liveness Verification -> Session Launch
router.post('/:examId/verify-face', verifyFaceAndStartSession);

// --- CANDIDATE SECURE TEST RUNNER ---
router.get('/:examId/session', getExamSessionDetails);
router.post('/session/save-answer', saveCandidateAnswer);
router.post('/session/heartbeat', recordExamHeartbeat);
router.post('/session/report-violation', reportExamViolation);
router.post('/session/submit', submitExamSession);

// --- PROCTORING & INVIGILATION RADAR ---
router.get('/:examId/proctor/live-feed', authenticateToken, authorizeRole(facultyAndAdmin), getProctorLiveFeed);
router.post('/proctor/sessions/:sessionId/action', authenticateToken, authorizeRole(facultyAndAdmin), proctorCandidateAction);

// --- QUESTION BANK & EXAM SCHEDULER STUDIO ---
router.get('/banks', authenticateToken, authorizeRole(facultyAndAdmin), getQuestionBanks);
router.post('/banks', authenticateToken, authorizeRole(facultyAndAdmin), createQuestionBank);
router.post('/banks/:bankId/questions', authenticateToken, authorizeRole(facultyAndAdmin), addQuestionToBank);
router.post('/create', authenticateToken, authorizeRole(facultyAndAdmin), createOnlineExam);

export default router;
