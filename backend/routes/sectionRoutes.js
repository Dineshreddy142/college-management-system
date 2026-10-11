import express from 'express';
import { getSections, getSectionById, createSection, updateSection, deleteSection } from '../controllers/sectionController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRole(['Admin', 'HOD', 'Faculty', 'Student']), getSections);
router.get('/:id', authorizeRole(['Admin', 'HOD', 'Faculty']), getSectionById);
router.post('/', authorizeRole(['Admin']), createSection);
router.put('/:id', authorizeRole(['Admin']), updateSection);
router.delete('/:id', authorizeRole(['Admin']), deleteSection);

export default router;
