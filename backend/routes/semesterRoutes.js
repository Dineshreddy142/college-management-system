import express from 'express';
import { createSemester, getSemesters, updateSemester, deleteSemester } from '../controllers/semesterController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRole(['Admin', 'HOD', 'Faculty', 'Student']), getSemesters);
router.post('/', authorizeRole(['Admin']), createSemester);
router.put('/:id', authorizeRole(['Admin']), updateSemester);
router.delete('/:id', authorizeRole(['Admin']), deleteSemester);

export default router;
