import express from 'express';
import { getLeaves, applyLeave, reviewLeave } from '../controllers/leaveController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getLeaves);
router.post('/', applyLeave);
router.patch('/:id/review', authorizeRole(['Admin', 'Chancellor', 'Vice Chancellor', 'Dean', 'Principal', 'HOD', 'Office Staff']), reviewLeave);

export default router;
