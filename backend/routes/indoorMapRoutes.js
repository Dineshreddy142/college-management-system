import express from 'express';
import {
    getBlocks, createBlock, updateBlock, deleteBlock,
    getFloors, createFloor, updateFloor, deleteFloor,
    getRooms, createRoom, updateRoom, deleteRoom,
    getFurniture, getFloorObjects, saveFloorState
} from '../controllers/indoorMapController.js';

const router = express.Router();

// Blocks
router.get('/blocks', getBlocks);
router.post('/blocks', createBlock);
router.put('/blocks/:id', updateBlock);
router.delete('/blocks/:id', deleteBlock);

// Floors
router.get('/blocks/:blockId/floors', getFloors);
router.post('/floors', createFloor);
router.put('/floors/:id', updateFloor);
router.delete('/floors/:id', deleteFloor);

// Rooms
router.get('/floors/:floorId/rooms', getRooms);
router.post('/rooms', createRoom);
router.put('/rooms/:id', updateRoom);
router.delete('/rooms/:id', deleteRoom);

// Objects & Canvas State
router.get('/furniture', getFurniture);
router.get('/floors/:floorId/state', getFloorObjects);
router.post('/floors/:floorId/state', saveFloorState);

export default router;
