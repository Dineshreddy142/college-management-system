import pool from '../db.js';

// GET /api/grievances - List grievances
export const getGrievances = async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    const isStaff = ['admin', 'chancellor', 'vicechancellor', 'principal', 'dean', 'hod', 'officestaff', 'office'].some(r => userRole.includes(r));

    let query = `
      SELECT g.*, 
             u.full_name as submitter_name, u.email as submitter_email,
             r.full_name as resolver_name
      FROM grievances g
      LEFT JOIN users u ON g.user_id = u.id
      LEFT JOIN users r ON g.resolved_by = r.id
    `;
    const params = [];

    if (!isStaff) {
      query += ` WHERE g.user_id = ? ORDER BY g.created_at DESC`;
      params.push(req.user.id);
    } else {
      query += ` ORDER BY g.created_at DESC LIMIT 200`;
    }

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[GRIEVANCE CONTROLLER ERROR - getGrievances]:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving grievances' });
  }
};

// POST /api/grievances - Raise a new grievance ticket
export const createGrievance = async (req, res) => {
  try {
    const { category, title, description, priority } = req.body;

    if (!category || !title || !description) {
      return res.status(400).json({ success: false, message: 'Category, title, and description are required' });
    }

    const ticketCode = 'TKT-' + Math.floor(100000 + Math.random() * 900000);

    const [stuRows] = await pool.query('SELECT id FROM students WHERE user_id = ? LIMIT 1', [req.user.id]);
    const studentId = stuRows[0]?.id || null;

    const [result] = await pool.query(`
      INSERT INTO grievances (ticket_code, user_id, student_id, category, title, description, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Open')
    `, [ticketCode, req.user.id, studentId, category, title, description, priority || 'Medium']);

    const [created] = await pool.query('SELECT * FROM grievances WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Grievance ticket raised successfully', data: created[0] });
  } catch (error) {
    console.error('[GRIEVANCE CONTROLLER ERROR - createGrievance]:', error);
    res.status(500).json({ success: false, message: 'Server error submitting grievance' });
  }
};

// PATCH /api/grievances/:id/status - Update grievance ticket status (Staff/Admin)
export const updateGrievanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;

    if (!['Open', 'In Progress', 'Resolved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid ticket status' });
    }

    const [result] = await pool.query(`
      UPDATE grievances
      SET status = ?, resolution_notes = ?, resolved_by = ?, resolved_at = ${status === 'Resolved' ? 'CURRENT_TIMESTAMP' : 'NULL'}
      WHERE id = ?
    `, [status, resolution_notes || null, req.user.id, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Grievance ticket not found' });
    }

    res.json({ success: true, message: `Grievance status updated to ${status}` });
  } catch (error) {
    console.error('[GRIEVANCE CONTROLLER ERROR - updateGrievanceStatus]:', error);
    res.status(500).json({ success: false, message: 'Server error updating ticket' });
  }
};
