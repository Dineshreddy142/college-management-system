import express from 'express';
import {
  getSubjectCategories,
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  updateSubjectStatus
} from '../controllers/subjectController.js';
import {
  getSubjectPrerequisites,
  addSubjectPrerequisite,
  deleteSubjectPrerequisite,
  verifyRegistrationEligibility,
  getGradeScales,
  evaluateCentralEligibility,
  recordExamAttemptController,
  generateTranscriptController,
  getRegulations,
  createRegulation,
  getBatches,
  createBatch,
  getSubjectVersions,
  getStudentBacklogs
} from '../controllers/academicRuleController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// Subject Categories Route
router.get('/subject-categories', getSubjectCategories);

// Subject Management Routes
router.get('/subjects', getSubjects);
router.get('/subjects/:id', getSubjectById);
router.post('/subjects', authenticateToken, authorizeRole(['Admin', 'HOD']), createSubject);
router.put('/subjects/:id', authenticateToken, authorizeRole(['Admin', 'HOD']), updateSubject);
router.patch('/subjects/:id/status', authenticateToken, authorizeRole(['Admin', 'HOD']), updateSubjectStatus);

// Academic Rule & Prerequisite Routes
router.get('/academic/subject-prerequisites/:subjectId', getSubjectPrerequisites);
router.post('/academic/subject-prerequisites', authenticateToken, authorizeRole(['Admin', 'HOD']), addSubjectPrerequisite);
router.delete('/academic/subject-prerequisites/:id', authenticateToken, authorizeRole(['Admin', 'HOD']), deleteSubjectPrerequisite);
router.post('/academic/verify-registration-eligibility', authenticateToken, verifyRegistrationEligibility);
router.get('/academic/grade-scales/:regulationId', getGradeScales);

// Enterprise Academic Engine & Versioning Routes
router.post('/academic/engine/check-eligibility', authenticateToken, evaluateCentralEligibility);
router.post('/academic/engine/record-attempt', authenticateToken, authorizeRole(['Admin', 'Faculty', 'HOD']), recordExamAttemptController);
router.post('/academic/engine/generate-transcript', authenticateToken, authorizeRole(['Admin', 'HOD']), generateTranscriptController);

router.get('/academic/regulations', authenticateToken, getRegulations);
router.post('/academic/regulations', authenticateToken, authorizeRole(['Admin']), createRegulation);

router.get('/academic/batches', authenticateToken, getBatches);
router.post('/academic/batches', authenticateToken, authorizeRole(['Admin']), createBatch);

router.get('/academic/subject-versions/:regulationId', authenticateToken, getSubjectVersions);
router.get('/academic/student-backlogs/:studentId', authenticateToken, getStudentBacklogs);

export default router;
