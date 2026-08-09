import express from 'express';
import pool from './db.js';

const router = express.Router();

// Middleware to ensure only parents can access
const ensureParent = (req, res, next) => {
  // Allow lowercase or capitalized depending on how auth populates it
  const role = req.user.role ? req.user.role.toLowerCase() : '';
  if (role !== 'parent') {
    return res.status(403).json({ error: 'Access denied. Parent role required.' });
  }
  next();
};

router.use(ensureParent);

// Get children linked to this parent (mocked for now, as parents table might not exist yet)
router.get('/children', async (req, res) => {
  try {
    // In a real DB, we'd query: SELECT s.* FROM students s JOIN parent_child pc ON s.id = pc.student_id WHERE pc.parent_id = req.user.id
    res.json([
      { id: 1, name: 'Arjun Sharma', roll: 'CS2021001', department: 'Computer Science', semester: 6, cgpa: 9.2, attendance: 88.4 },
      { id: 2, name: 'Riya Sharma', roll: 'ME2022045', department: 'Mechanical Engineering', semester: 4, cgpa: 8.7, attendance: 92.1 }
    ]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- READ-ONLY DATA ENDPOINTS ---
// Any attempt to POST/PUT/DELETE attendance or marks here should be blocked by design (we just won't define them).

router.get('/child/:id/attendance', async (req, res) => {
  res.json({ message: "Mocked attendance data for child " + req.params.id });
});

router.get('/child/:id/fees', async (req, res) => {
  res.json({ message: "Mocked fee data for child " + req.params.id });
});

export default router;
