import express from 'express';
import {
  getSubjectCategories,
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  updateSubjectStatus,
  bulkImportSubjects
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
import {
  getSubjectOfferings,
  createSubjectOffering,
  assignFacultyToOffering,
  getRegistrationEligibility,
  submitSemesterRegistration,
  approveOrRejectRegistrationController,
  reopenRegistrationController,
  getFacultyAssignedOfferings,
  getOfferingEnrolledStudents
} from '../controllers/offeringRegistrationController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// Subject Categories Route
router.get('/subject-categories', getSubjectCategories);

// Subject Management Routes
router.get('/subjects', getSubjects);
router.get('/subjects/:id', getSubjectById);
router.post('/subjects', authenticateToken, authorizeRole(['Admin', 'HOD']), createSubject);
router.post('/subjects/bulk-import', authenticateToken, authorizeRole(['Admin', 'HOD']), bulkImportSubjects);
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

// Subject Offering & Multi-Faculty Semester Registration Routes
router.get('/academic/subject-offerings', authenticateToken, getSubjectOfferings);
router.post('/academic/subject-offerings', authenticateToken, authorizeRole(['Admin', 'HOD']), createSubjectOffering);
router.post('/academic/subject-offerings/:id/faculty', authenticateToken, authorizeRole(['Admin', 'HOD']), assignFacultyToOffering);

router.get('/academic/registration/eligibility', authenticateToken, getRegistrationEligibility);
router.post('/academic/semester-registrations', authenticateToken, submitSemesterRegistration);
router.post('/academic/semester-registrations/:id/approve', authenticateToken, authorizeRole(['Admin', 'HOD']), approveOrRejectRegistrationController);
router.post('/academic/semester-registrations/:id/reopen', authenticateToken, authorizeRole(['Admin', 'HOD']), reopenRegistrationController);

router.get('/faculty/my-offered-subjects', authenticateToken, authorizeRole(['Admin', 'Faculty', 'HOD']), getFacultyAssignedOfferings);
router.get('/faculty/subjects/:offeringId/students', authenticateToken, authorizeRole(['Admin', 'Faculty', 'HOD']), getOfferingEnrolledStudents);

export default router;
