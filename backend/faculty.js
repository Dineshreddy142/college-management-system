import express from 'express';
import pool from './db.js';

const router = express.Router();

// Middleware to ensure user is faculty
const ensureFaculty = async (req, res, next) => {
  if (req.user.role !== 'Faculty' && req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Access denied. Faculty only.' });
  }
  
  // Get faculty ID
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

// 1. Get assigned classes
router.get('/classes', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        sa.id as allocation_id,
        sub.name as subject_name,
        sub.code as subject_code,
        sec.name as section_name,
        sem.name as semester_name,
        c.name as course_name,
        (SELECT COUNT(*) FROM students WHERE section_id = sec.id) as student_count
      FROM subject_allocations sa
      JOIN subjects sub ON sa.subject_id = sub.id
      JOIN sections sec ON sa.section_id = sec.id
      JOIN semesters sem ON sec.semester_id = sem.id
      JOIN courses c ON sem.course_id = c.id
      WHERE sa.faculty_id = ?
    `, [req.faculty_id || 1]); // fallback for admin testing
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get students in a specific section
router.get('/students/:sectionId', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT s.id, s.admission_number, s.first_name, s.last_name, u.email
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.section_id = ?
    `, [req.params.sectionId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Assignments
router.get('/assignments', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT a.*, sub.name as subject_name,
      (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id) as submissions
      FROM assignments a
      JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.faculty_id = ?
    `, [req.faculty_id || 1]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mock implementations for remaining endpoints for MVP UI
router.get('/attendance/summary', (req, res) => {
  res.json({ avg: 89, pending: 3 });
});

router.get('/dashboard', async (req, res) => {
  try {
    const [classRows] = await pool.execute('SELECT COUNT(*) as c FROM subject_allocations WHERE faculty_id = ?', [req.faculty_id || 1]);
    res.json({
      myClasses: classRows[0].c,
      totalStudents: 312,
      classesToday: 3,
      avgAttendance: 89
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
