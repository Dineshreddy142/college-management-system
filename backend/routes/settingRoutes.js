import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

router.get('/', getSettings);
router.put('/', authenticateToken, authorizeRole(['Admin']), updateSettings);

export default router;
