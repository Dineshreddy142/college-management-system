import pool from '../db.js';

// GET /api/leaves - Fetch leaves for current user (or all if Admin/Dean/HOD)
export const getLeaves = async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    const isApprover = ['admin', 'chancellor', 'vicechancellor', 'principal', 'dean', 'hod', 'officestaff', 'office'].some(r => userRole.includes(r));

    let query = `
      SELECT sl.*, 
             u.full_name as applicant_name, u.email as applicant_email,
             r.full_name as reviewer_name
      FROM student_leaves sl
      LEFT JOIN users u ON sl.user_id = u.id
      LEFT JOIN users r ON sl.reviewer_id = r.id
    `;
    const params = [];

    if (!isApprover) {
      query += ` WHERE sl.user_id = ? ORDER BY sl.applied_at DESC`;
      params.push(req.user.id);
    } else {
      query += ` ORDER BY sl.applied_at DESC LIMIT 200`;
    }

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[LEAVE CONTROLLER ERROR - getLeaves]:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving leaves' });
  }
};

// POST /api/leaves - Submit a new leave application
export const applyLeave = async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;

    if (!leave_type || !start_date || !end_date || !reason) {
      return res.status(400).json({ success: false, message: 'All leave fields are required' });
    }

    // Resolve student_id or faculty_id if applicable
    const [stuRows] = await pool.query('SELECT id FROM students WHERE user_id = ? LIMIT 1', [req.user.id]);
    const studentId = stuRows[0]?.id || null;

    const [facRows] = await pool.query('SELECT id FROM faculty WHERE user_id = ? LIMIT 1', [req.user.id]);
    const facultyId = facRows[0]?.id || null;

    const [result] = await pool.query(`
      INSERT INTO student_leaves (user_id, student_id, faculty_id, leave_type, start_date, end_date, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
    `, [req.user.id, studentId, facultyId, leave_type, start_date, end_date, reason]);

    const [inserted] = await pool.query(`
      SELECT sl.*, u.full_name as applicant_name 
      FROM student_leaves sl 
      LEFT JOIN users u ON sl.user_id = u.id 
      WHERE sl.id = ?
    `, [result.insertId]);

    res.status(201).json({ success: true, message: 'Leave application submitted successfully', data: inserted[0] });
  } catch (error) {
    console.error('[LEAVE CONTROLLER ERROR - applyLeave]:', error);
    res.status(500).json({ success: false, message: 'Server error submitting leave application' });
  }
};

// PATCH /api/leaves/:id/review - Approve or Reject a leave application (Admin/Dean/HOD)
export const reviewLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'Approved' or 'Rejected'" });
    }

    const [result] = await pool.query(`
      UPDATE student_leaves
      SET status = ?, reviewer_id = ?, reviewer_remarks = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, req.user.id, remarks || null, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Leave application not found' });
    }

    const [updated] = await pool.query(`
      SELECT sl.*, u.full_name as applicant_name, r.full_name as reviewer_name
      FROM student_leaves sl
      LEFT JOIN users u ON sl.user_id = u.id
      LEFT JOIN users r ON sl.reviewer_id = r.id
      WHERE sl.id = ?
    `, [id]);

    res.json({ success: true, message: `Leave application ${status.toLowerCase()} successfully`, data: updated[0] });
  } catch (error) {
    console.error('[LEAVE CONTROLLER ERROR - reviewLeave]:', error);
    res.status(500).json({ success: false, message: 'Server error updating leave review status' });
  }
};
