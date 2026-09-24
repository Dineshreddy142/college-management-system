import express from 'express';
import pool from '../db.js';
import {
  getAssignedClasses,
  getSectionStudents,
  getFacultyAssignments,
  getFacultyAttendanceSummary,
  getFacultyDashboard
} from '../controllers/facultyPortalController.js';

const router = express.Router();

const ensureFaculty = async (req, res, next) => {
  if (req.user.role !== 'Faculty' && req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Access denied. Faculty only.' });
  }
  
  try {
    const [rows] = await pool.execute('SELECT id FROM faculties WHERE user_id = ?', [req.user.id]);
    if (rows.length > 0) {
      req.faculty_id = rows[0].id;
    } else if (req.user.role !== 'Admin') {
       return res.status(403).json({ error: 'Faculty profile not found.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.use(ensureFaculty);

router.get('/classes', getAssignedClasses);
router.get('/students/:sectionId', getSectionStudents);
router.get('/assignments', getFacultyAssignments);
router.get('/attendance/summary', getFacultyAttendanceSummary);
router.get('/dashboard', getFacultyDashboard);

export default router;
