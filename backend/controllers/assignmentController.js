import pool from '../db.js';

// GET /api/assignments - List coursework assignments
export const getAssignments = async (req, res) => {
  try {
    const [stuRows] = await pool.query('SELECT id FROM students WHERE user_id = ? LIMIT 1', [req.user.id]);
    const studentId = stuRows[0]?.id || null;

    let query = `
      SELECT ca.*, 
             s.name as subject_name, s.code as subject_code,
             f.first_name as faculty_first_name, f.last_name as faculty_last_name,
             cs.id as submission_id, cs.status as submission_status, 
             cs.score as student_score, cs.feedback as faculty_feedback,
             cs.submission_notes, cs.submitted_at
      FROM coursework_assignments ca
      LEFT JOIN subjects s ON ca.subject_id = s.id
      LEFT JOIN faculty f ON ca.faculty_id = f.id
      LEFT JOIN coursework_submissions cs ON ca.id = cs.assignment_id AND cs.student_id = ?
      ORDER BY ca.due_date ASC
    `;

    const [rows] = await pool.query(query, [studentId || 0]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[ASSIGNMENT CONTROLLER ERROR - getAssignments]:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving coursework assignments' });
  }
};

// POST /api/assignments/:id/submit - Submit coursework (Student)
export const submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { submission_notes, file_url } = req.body;

    const [stuRows] = await pool.query('SELECT id FROM students WHERE user_id = ? LIMIT 1', [req.user.id]);
    if (stuRows.length === 0) {
      return res.status(403).json({ success: false, message: 'Only registered students can submit coursework' });
    }
    const studentId = stuRows[0].id;

    // Check if assignment exists
    const [assignRows] = await pool.query('SELECT id, due_date FROM coursework_assignments WHERE id = ?', [id]);
    if (assignRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const isLate = new Date() > new Date(assignRows[0].due_date);
    const submissionStatus = isLate ? 'Late' : 'Submitted';

    // Insert or update submission
    await pool.query(`
      INSERT INTO coursework_submissions (assignment_id, student_id, submission_notes, file_url, status)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        submission_notes = VALUES(submission_notes),
        file_url = COALESCE(VALUES(file_url), file_url),
        status = VALUES(status),
        submitted_at = CURRENT_TIMESTAMP
    `, [id, studentId, submission_notes || 'Submitted coursework via portal', file_url || null, submissionStatus]);

    res.json({ success: true, message: 'Coursework submitted successfully', status: submissionStatus });
  } catch (error) {
    console.error('[ASSIGNMENT CONTROLLER ERROR - submitAssignment]:', error);
    res.status(500).json({ success: false, message: 'Server error submitting coursework' });
  }
};

// POST /api/assignments - Create a coursework assignment (Faculty/Admin)
export const createAssignment = async (req, res) => {
  try {
    const { subject_id, title, description, due_date, max_score } = req.body;

    if (!title || !due_date) {
      return res.status(400).json({ success: false, message: 'Title and due date are required' });
    }

    const [facRows] = await pool.query('SELECT id FROM faculty WHERE user_id = ? LIMIT 1', [req.user.id]);
    const facultyId = facRows[0]?.id || null;

    const [result] = await pool.query(`
      INSERT INTO coursework_assignments (subject_id, faculty_id, title, description, due_date, max_score, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Active')
    `, [subject_id || null, facultyId, title, description || null, due_date, max_score || 100]);

    res.status(201).json({ success: true, message: 'Assignment created successfully', id: result.insertId });
  } catch (error) {
    console.error('[ASSIGNMENT CONTROLLER ERROR - createAssignment]:', error);
    res.status(500).json({ success: false, message: 'Server error creating assignment' });
  }
};

// PATCH /api/assignments/submissions/:id/grade - Grade coursework submission (Faculty/Admin)
export const gradeSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, feedback } = req.body;

    const [result] = await pool.query(`
      UPDATE coursework_submissions
      SET score = ?, feedback = ?, status = 'Graded'
      WHERE id = ?
    `, [score, feedback || null, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    res.json({ success: true, message: 'Submission graded successfully' });
  } catch (error) {
    console.error('[ASSIGNMENT CONTROLLER ERROR - gradeSubmission]:', error);
    res.status(500).json({ success: false, message: 'Server error grading submission' });
  }
};
