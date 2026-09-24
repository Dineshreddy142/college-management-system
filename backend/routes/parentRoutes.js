import express from 'express';
import {
  getParentChildren,
  getChildAttendance,
  getChildFees
} from '../controllers/parentController.js';

const router = express.Router();

const ensureParent = (req, res, next) => {
  const role = req.user.role ? req.user.role.toLowerCase() : '';
  if (role !== 'parent') {
    return res.status(403).json({ error: 'Access denied. Parent role required.' });
  }
  next();
};

router.use(ensureParent);

router.get('/children', getParentChildren);
router.get('/child/:id/attendance', getChildAttendance);
router.get('/child/:id/fees', getChildFees);

export default router;
