import express from 'express';
import { getGrievances, createGrievance, updateGrievanceStatus } from '../controllers/grievanceController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getGrievances);
router.post('/', createGrievance);
router.patch('/:id/status', authorizeRole(['Admin', 'Chancellor', 'Vice Chancellor', 'Dean', 'Principal', 'HOD', 'Office Staff']), updateGrievanceStatus);

export default router;
