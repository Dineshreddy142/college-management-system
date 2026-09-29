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
  getGradeScales
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

export default router;
