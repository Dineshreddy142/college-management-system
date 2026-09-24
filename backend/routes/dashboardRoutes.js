import express from 'express';
import {
    getAdminDashboardStats,
    getFacultyDashboardStats,
    getStudentDashboardStats
} from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/admin', getAdminDashboardStats);
router.get('/faculty', getFacultyDashboardStats);
router.get('/student', getStudentDashboardStats);

export default router;
