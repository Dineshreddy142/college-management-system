import express from 'express';
import { getVehicles, addVehicle, deleteVehicle } from '../controllers/vehicleController.js';
import { authenticateToken } from '../middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getVehicles);
router.post('/', addVehicle);
router.delete('/:id', deleteVehicle);

export default router;
