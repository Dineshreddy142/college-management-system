import express from 'express';
import { globalSearch } from '../controllers/searchController.js';
import { authenticateToken } from '../middleware.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', globalSearch);

export default router;
