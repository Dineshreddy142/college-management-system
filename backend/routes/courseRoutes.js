import express from 'express';
import { createCourse, getCourses, updateCourse, deleteCourse } from '../controllers/courseController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRole(['Admin', 'HOD', 'Faculty', 'Student']), getCourses);
router.post('/', authorizeRole(['Admin', 'HOD']), createCourse);
router.put('/:id', authorizeRole(['Admin', 'HOD']), updateCourse);
router.delete('/:id', authorizeRole(['Admin']), deleteCourse);

export default router;
