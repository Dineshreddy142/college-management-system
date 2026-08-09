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

// Get assigned mentees
router.get('/mentees', async (req, res) => {
  try {
    // In a real implementation this would join multiple tables to get attendance/marks
    // We mock the response to match the frontend expectations for this demo, but the real SQL is provided
    /*
    const [rows] = await pool.execute(`
      SELECT s.id, s.first_name, s.last_name, s.admission_number, a.name as academic_year
      FROM mentor_assignments ma
      JOIN students s ON ma.student_id = s.id
      JOIN academic_years a ON s.academic_year_id = a.id
      WHERE ma.faculty_id = ?
    `, [req.faculty_id]);
    res.json(rows);
    */
    
    res.json([
      { id: 1, name: "Arjun Sharma", roll: "CS2021001", year: "3", dept: "Computer Science", cgpa: 9.2, attendance: 88.4, status: "safe" },
      { id: 2, name: "Priya Patel", roll: "CS2021045", year: "3", dept: "Computer Science", cgpa: 5.8, attendance: 68.2, status: "risk" },
      { id: 3, name: "Rahul Verma", roll: "CS2022012", year: "2", dept: "Computer Science", cgpa: 7.5, attendance: 78.0, status: "safe" }
    ]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get mentee details
router.get('/mentees/:id', async (req, res) => {
  try {
    // Add real database query joining marks, fees, attendance, etc.
    res.json({
      id: req.params.id,
      name: "Arjun Sharma",
      roll: "CS2021001",
      cgpa: 9.2,
      attendance: 88.4,
      fees_status: "Paid",
      placement_status: "Eligible for Super Dream",
      recent_marks: [
        { sub: "Data Structures", score: "92/100", grade: "A+" },
        { sub: "Operating Systems", score: "88/100", grade: "A" }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record counseling session
router.post('/counseling', async (req, res) => {
  const { student_id, discussion, action_plan, date } = req.body;
  try {
    await pool.execute(
      'INSERT INTO counseling_sessions (faculty_id, student_id, session_date, discussion, action_plan) VALUES (?, ?, ?, ?, ?)',
      [req.faculty_id, student_id, date || new Date(), discussion, action_plan]
    );
    res.json({ message: "Counseling session recorded successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get alerts
router.get('/alerts', async (req, res) => {
  try {
    // Generate mock alerts based on risk
    res.json([
      { id: 1, type: "Attendance Risk", message: "Priya Patel's attendance is below 75%", date: new Date().toISOString() },
      { id: 2, type: "Fee Pending", message: "Rahul Verma has pending library fees", date: new Date().toISOString() }
    ]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
