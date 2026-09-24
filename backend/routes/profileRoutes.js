import express from 'express';
import { getProfile, updateProfile, updateProfileEmail } from '../controllers/profileController.js';
import { authenticateToken } from '../middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/email', updateProfileEmail);

export default router;
