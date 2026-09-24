import express from 'express';
import {
  getSubjectsLegacy,
  createSubjectLegacy,
  updateSubjectLegacy,
  getAllocationsLegacy,
  createAllocationLegacy,
  deleteAllocationLegacy,
  getAcademicMetadata,
  getAcademicSessions,
  createAcademicSession,
  getAcademicRegulations,
  getCurriculumOverview,
  promoteStudent
} from '../controllers/academicLegacyController.js';

const router = express.Router();

router.get('/subjects', getSubjectsLegacy);
router.post('/subjects', createSubjectLegacy);
router.put('/subjects/:id', updateSubjectLegacy);

router.get('/allocations', getAllocationsLegacy);
router.post('/allocations', createAllocationLegacy);
router.delete('/allocations/:id', deleteAllocationLegacy);

router.get('/metadata', getAcademicMetadata);
router.get('/sessions', getAcademicSessions);
router.post('/sessions', createAcademicSession);
router.get('/regulations', getAcademicRegulations);
router.get('/curriculum', getCurriculumOverview);
router.post('/promote', promoteStudent);

export default router;
