import express from 'express';
import {
  getAllCampusBlocks,
  createCampusBlock,
  getBlockFloors,
  createBlockFloor,
  getLiveFloorOccupancy,
  addOrUpdateFloorRoom,
  addOrUpdateFloorCorridor,
  updateFloorDimensions
} from '../controllers/campusController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// --- CAMPUS BLOCKS & FLOORS ROUTES ---
router.get('/blocks', authenticateToken, getAllCampusBlocks);
router.post('/blocks', authenticateToken, authorizeRole(['Admin', 'Registrar', 'HOD']), createCampusBlock);
router.get('/blocks/:blockId/floors', authenticateToken, getBlockFloors);
router.post('/blocks/:blockId/floors', authenticateToken, authorizeRole(['Admin', 'Registrar', 'HOD']), createBlockFloor);

// --- 2D LIVE OCCUPANCY & BUILDER ROUTES ---
router.get('/floors/:floorId/live-occupancy', authenticateToken, getLiveFloorOccupancy);
router.put('/floors/:floorId/dimensions', authenticateToken, authorizeRole(['Admin', 'Registrar', 'HOD']), updateFloorDimensions);
router.post('/floors/:floorId/rooms', authenticateToken, authorizeRole(['Admin', 'Registrar', 'HOD']), addOrUpdateFloorRoom);
router.post('/floors/:floorId/corridors', authenticateToken, authorizeRole(['Admin', 'Registrar', 'HOD']), addOrUpdateFloorCorridor);

export default router;
