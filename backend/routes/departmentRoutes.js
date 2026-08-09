import express from 'express';
import { createDepartment, getDepartments, getDepartmentById, updateDepartment, deleteDepartment } from '../controllers/departmentController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRole(['Admin', 'HOD', 'Faculty', 'Student']), getDepartments);
router.get('/:id', authorizeRole(['Admin', 'HOD', 'Faculty']), getDepartmentById);
router.post('/', authorizeRole(['Admin']), createDepartment);
router.put('/:id', authorizeRole(['Admin']), updateDepartment);
router.delete('/:id', authorizeRole(['Admin']), deleteDepartment);

export default router;
