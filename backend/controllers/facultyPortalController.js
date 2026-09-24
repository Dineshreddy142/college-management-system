import pool from '../db.js';

export const getAssignedClasses = async (req, res) => {
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
    `, [req.faculty_id || 1]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSectionStudents = async (req, res) => {
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
};

export const getFacultyAssignments = async (req, res) => {
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
};

export const getFacultyAttendanceSummary = (req, res) => {
  res.json({ avg: 89, pending: 3 });
};

export const getFacultyDashboard = async (req, res) => {
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
};
