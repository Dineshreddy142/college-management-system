import pool from '../db.js';

// GET /api/documents/my - Get official documents for logged-in student
export const getMyDocuments = async (req, res) => {
  try {
    const [stuRows] = await pool.query('SELECT id, enrollment_number FROM students WHERE user_id = ? LIMIT 1', [req.user.id]);
    if (stuRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    const studentId = stuRows[0].id;

    const [docs] = await pool.query(`
      SELECT * FROM official_documents
      WHERE student_id = ?
      ORDER BY id ASC
    `, [studentId]);

    res.json({ success: true, data: docs });
  } catch (error) {
    console.error('[DOCUMENT CONTROLLER ERROR - getMyDocuments]:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving official documents' });
  }
};

// POST /api/documents/request - Request generation of official document
export const requestDocument = async (req, res) => {
  try {
    const { document_type, title, description } = req.body;

    const [stuRows] = await pool.query('SELECT id FROM students WHERE user_id = ? LIMIT 1', [req.user.id]);
    if (stuRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    const studentId = stuRows[0].id;

    const [result] = await pool.query(`
      INSERT INTO official_documents (student_id, document_type, title, description, status)
      VALUES (?, ?, ?, ?, 'Pending')
    `, [studentId, document_type || 'CERTIFICATE', title || 'Official Certificate Request', description || null]);

    res.status(201).json({ success: true, message: 'Official document request submitted to registrar office', id: result.insertId });
  } catch (error) {
    console.error('[DOCUMENT CONTROLLER ERROR - requestDocument]:', error);
    res.status(500).json({ success: false, message: 'Server error requesting document' });
  }
};
