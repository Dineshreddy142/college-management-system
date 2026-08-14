import express from 'express';
import {
  getRegulations,
  createRegulation,
  updateRegulation,
  getCurriculums,
  getCurriculumById,
  createCurriculum,
  addSubjectToCurriculum,
  removeSubjectFromCurriculum,
  updateCurriculum
} from '../controllers/curriculumController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// Regulations Routes
router.get('/regulations', getRegulations);
router.post('/regulations', authenticateToken, authorizeRole(['Admin', 'HOD']), createRegulation);
router.put('/regulations/:id', authenticateToken, authorizeRole(['Admin', 'HOD']), updateRegulation);

// Curriculum Matrix & Subject Mapping Routes
router.get('/curriculums', getCurriculums);
router.get('/curriculums/:id', getCurriculumById);
router.post('/curriculums', authenticateToken, authorizeRole(['Admin', 'HOD']), createCurriculum);
router.put('/curriculums/:id', authenticateToken, authorizeRole(['Admin', 'HOD']), updateCurriculum);
router.post('/curriculums/:id/subjects', authenticateToken, authorizeRole(['Admin', 'HOD']), addSubjectToCurriculum);
router.delete('/curriculums/:id/subjects/:subjectId', authenticateToken, authorizeRole(['Admin', 'HOD']), removeSubjectFromCurriculum);

export default router;
