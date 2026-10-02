import express from 'express';
import {
  getAdminCBCSWindows,
  createCBCSWindow,
  updateCBCSWindowStatus,
  processAutomatedAllocation,
  getCBCSAllocationResults,
  getStudentActiveCBCSWindow,
  submitStudentCBCSPreferences
} from '../controllers/cbcsController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// --- ADMIN / REGISTRAR CBCS ROUTES ---
router.get('/windows', authenticateToken, getAdminCBCSWindows);
router.post('/windows', authenticateToken, authorizeRole(['Admin', 'Registrar', 'HOD', 'Dean']), createCBCSWindow);
router.patch('/windows/:id/status', authenticateToken, authorizeRole(['Admin', 'Registrar', 'HOD', 'Dean']), updateCBCSWindowStatus);
router.post('/windows/:id/process-allocation', authenticateToken, authorizeRole(['Admin', 'Registrar', 'HOD', 'Dean']), processAutomatedAllocation);
router.get('/allocation-results/:windowId', authenticateToken, getCBCSAllocationResults);

// --- STUDENT CBCS ROUTES ---
router.get('/student/active-window', authenticateToken, getStudentActiveCBCSWindow);
router.post('/student/submit-preferences', authenticateToken, submitStudentCBCSPreferences);

export default router;
