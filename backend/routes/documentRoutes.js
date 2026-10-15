import express from 'express';
import { getMyDocuments, requestDocument } from '../controllers/documentController.js';
import { authenticateToken } from '../middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/my', getMyDocuments);
router.post('/request', requestDocument);

export default router;
