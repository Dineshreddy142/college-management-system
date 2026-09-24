import express from 'express';
import { getUserNotifications, markNotificationAsRead } from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getUserNotifications);
router.put('/:id/read', markNotificationAsRead);

export default router;
