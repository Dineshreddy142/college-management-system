import express from 'express';
import {
  getBlocksAndFloors,
  addBuilding,
  editBuilding,
  deleteBuilding,
  addBlock,
  editBlock,
  deleteBlock,
  addFloor,
  editFloor,
  duplicateFloor,
  deleteFloor,
  reorderFloors,
  togglePublishFloor,
  toggleArchiveFloor,
  uploadFloorPlan,
  getFloorVersions,
  restoreFloorVersion,
  getFloorData,
  saveFloorData,
  calculateAStarRoute,
  getFloorOccupancy,
  validateFloorMap,
  searchCampusIndoorMap,
  getRolesAndPermissions,
  updateRolePermissions,
  getAdminUsers,
  assignAdminRole,
  revokeAdminUser
} from '../controllers/indoorMapController.js';

const router = express.Router();

// 0. Universal Campus Search (Rooms, Buildings, Floors, Facilities, Staff)
router.get('/search', searchCampusIndoorMap);

// 1. Hierarchy (Buildings, Blocks & Floors)
router.get('/blocks', getBlocksAndFloors);
router.get('/hierarchy', getBlocksAndFloors);

// 2. Building Tools
router.post('/buildings', addBuilding);
router.put('/buildings/:buildingId', editBuilding);
router.delete('/buildings/:buildingId', deleteBuilding);

// 3. Block Tools
router.post('/blocks', addBlock);
router.put('/blocks/:blockId', editBlock);
router.delete('/blocks/:blockId', deleteBlock);

// 4. Floor Management & Tools
router.post('/floors', addFloor);
router.put('/floors/:floorId', editFloor);
router.post('/floors/:floorId/duplicate', duplicateFloor);
router.delete('/floors/:floorId', deleteFloor);
router.post('/floors/reorder', reorderFloors);

// 5. Floor Settings, Publishing & Versioning
router.post('/floors/:floorId/publish', togglePublishFloor);
router.post('/floors/:floorId/archive', toggleArchiveFloor);
router.post('/floors/:floorId/upload-plan', uploadFloorPlan);
router.get('/floors/:floorId/versions', getFloorVersions);
router.post('/floors/:floorId/versions/:versionNumber/restore', restoreFloorVersion);

// 6. Floor Structured CAD Data & Operations
router.get('/floors/:floorId', getFloorData);
router.post('/floors/:floorId/save', saveFloorData);

// 7. Navigation, Occupancy & Validation
router.post('/navigation/route', calculateAStarRoute);
router.get('/floors/:floorId/occupancy', getFloorOccupancy);
router.get('/floors/:floorId/validate', validateFloorMap);

// 8. Admin Roles & Permission Tools (#20)
router.get('/permissions/roles', getRolesAndPermissions);
router.post('/permissions/roles', updateRolePermissions);
router.get('/permissions/users', getAdminUsers);
router.post('/permissions/assign', assignAdminRole);
router.delete('/permissions/users/:id', revokeAdminUser);

export default router;
