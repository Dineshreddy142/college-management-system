import express from 'express';
import { getHostelBlocks, createHostelBlock, allocateStudent } from '../controllers/hostelController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/blocks', getHostelBlocks);
router.post('/blocks', authorizeRole(['Admin', 'Chancellor', 'Vice Chancellor', 'Principal', 'Dean', 'Office Staff']), createHostelBlock);
router.post('/allocate', authorizeRole(['Admin', 'Principal', 'Dean', 'Office Staff']), allocateStudent);

export default router;
