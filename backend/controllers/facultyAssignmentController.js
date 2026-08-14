import pool from '../db.js';

// GET /api/faculty-assignments
export const getFacultyAssignments = async (req, res) => {
  try {
    const {
      department_id,
      course_id,
      program_id,
      regulation_id,
      semester_id,
      section_id,
      faculty_id,
      subject_id,
      status,
      search
    } = req.query;

    let query = `
      SELECT sa.*,
             s.code as subject_code, s.name as subject_name, s.short_name, s.credits as subject_credits, s.offering_type,
             sc.name as category_name, sc.code as category_code,
             f.first_name, f.last_name, f.email as faculty_email, f.employee_id as faculty_emp_id, f.designation as faculty_designation,
             sec.name as section_name,
             d.name as department_name, d.code as department_code,
             crs.name as program_name, crs.name as course_name,
             r.name as regulation_name,
             sem.name as semester_name, sem.semester_number,
             ay.name as academic_year_name
      FROM subject_allocations sa
      JOIN subjects s ON sa.subject_id = s.id
      LEFT JOIN subject_categories sc ON s.category_id = sc.id
      JOIN faculties f ON sa.faculty_id = f.id
      JOIN sections sec ON sa.section_id = sec.id
      LEFT JOIN departments d ON sa.department_id = d.id
      LEFT JOIN courses crs ON sa.course_id = crs.id
      LEFT JOIN regulations r ON sa.regulation_id = r.id
      LEFT JOIN semesters sem ON sa.semester_id = sem.id
      LEFT JOIN academic_years ay ON sa.academic_year_id = ay.id
      WHERE 1=1
    `;

    const params = [];

    // RBAC check for HOD
    if (req.user && req.user.role === 'HOD' && req.user.department_id) {
      query += ` AND (sa.department_id = ? OR f.department_id = ?)`;
      params.push(req.user.department_id, req.user.department_id);
    } else if (department_id && department_id !== 'all') {
      query += ` AND sa.department_id = ?`;
      params.push(department_id);
    }

    const effProgramId = course_id || program_id;
    if (effProgramId && effProgramId !== 'all') {
      query += ` AND sa.course_id = ?`;
      params.push(effProgramId);
    }

    if (regulation_id && regulation_id !== 'all') {
      query += ` AND sa.regulation_id = ?`;
      params.push(regulation_id);
    }

    if (semester_id && semester_id !== 'all') {
      query += ` AND sa.semester_id = ?`;
      params.push(semester_id);
    }

    if (section_id && section_id !== 'all') {
      query += ` AND sa.section_id = ?`;
      params.push(section_id);
    }

    if (faculty_id && faculty_id !== 'all') {
      query += ` AND sa.faculty_id = ?`;
      params.push(faculty_id);
    }

    if (subject_id && subject_id !== 'all') {
      query += ` AND sa.subject_id = ?`;
      params.push(subject_id);
    }

    if (status && status !== 'all') {
      query += ` AND LOWER(sa.status) = LOWER(?)`;
      params.push(status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      query += ` AND (LOWER(s.code) LIKE ? OR LOWER(s.name) LIKE ? OR LOWER(f.first_name) LIKE ? OR LOWER(f.last_name) LIKE ? OR LOWER(sec.name) LIKE ?)`;
      params.push(term, term, term, term, term);
    }

    query += ` ORDER BY sa.id DESC`;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching faculty assignments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch faculty assignments', error: error.message });
  }
};

// GET /api/faculty-assignments/available-faculty
export const getAvailableFaculty = async (req, res) => {
  try {
    const { department_id } = req.query;

    let query = `
      SELECT f.id, f.first_name, f.last_name, f.email, f.employee_id, f.designation, f.department_id,
             d.name as department_name,
             COUNT(sa.id) as assigned_subjects_count,
             COALESCE(SUM(sa.weekly_hours), 0) as total_weekly_workload
      FROM faculties f
      LEFT JOIN departments d ON f.department_id = d.id
      LEFT JOIN subject_allocations sa ON f.id = sa.faculty_id AND sa.status = 'Active'
      WHERE 1=1
    `;

    const params = [];

    if (req.user && req.user.role === 'HOD' && req.user.department_id) {
      query += ` AND f.department_id = ?`;
      params.push(req.user.department_id);
    } else if (department_id && department_id !== 'all') {
      query += ` AND f.department_id = ?`;
      params.push(department_id);
    }

    query += ` GROUP BY f.id ORDER BY f.first_name ASC`;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching available faculty:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch teaching faculty list', error: error.message });
  }
};

// POST /api/faculty-assignments
export const createFacultyAssignment = async (req, res) => {
  try {
    const {
      department_id,
      course_id,
      program_id,
      regulation_id,
      curriculum_id,
      academic_year_id,
      semester_id,
      section_id,
      subject_id,
      faculty_id,
      weekly_hours,
      academic_session,
      start_date,
      end_date,
      status
    } = req.body;

    const effProgramId = course_id || program_id;

    if (!section_id || !subject_id || !faculty_id) {
      return res.status(400).json({ success: false, message: 'Section, Subject, and Faculty are required.' });
    }

    // Check duplicate assignment
    const [existing] = await pool.query(
      'SELECT id FROM subject_allocations WHERE subject_id = ? AND section_id = ? AND faculty_id = ?',
      [subject_id, section_id, faculty_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'This faculty member is already assigned to this subject and section.' });
    }

    const created_by = req.user ? req.user.id : null;
    const initialStatus = status || (req.user && req.user.role === 'HOD' ? 'Active' : 'Active');

    const [result] = await pool.query(`
      INSERT INTO subject_allocations 
      (department_id, course_id, regulation_id, curriculum_id, academic_year_id, semester_id, section_id, subject_id, faculty_id, weekly_hours, academic_session, start_date, end_date, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      department_id || null,
      effProgramId || null,
      regulation_id || null,
      curriculum_id || null,
      academic_year_id || null,
      semester_id || null,
      section_id,
      subject_id,
      faculty_id,
      weekly_hours || 3,
      academic_session || null,
      start_date || null,
      end_date || null,
      initialStatus,
      created_by
    ]);

    res.status(201).json({
      success: true,
      message: 'Faculty assigned to subject successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating faculty assignment:', error);
    res.status(500).json({ success: false, message: 'Failed to assign faculty to subject', error: error.message });
  }
};

// PUT /api/faculty-assignments/:id
export const updateFacultyAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { faculty_id, section_id, weekly_hours, status } = req.body;

    await pool.query(`
      UPDATE subject_allocations
      SET faculty_id = COALESCE(?, faculty_id),
          section_id = COALESCE(?, section_id),
          weekly_hours = COALESCE(?, weekly_hours),
          status = COALESCE(?, status)
      WHERE id = ?
    `, [faculty_id || null, section_id || null, weekly_hours || null, status || null, id]);

    res.json({ success: true, message: 'Faculty assignment updated successfully' });
  } catch (error) {
    console.error('Error updating faculty assignment:', error);
    res.status(500).json({ success: false, message: 'Failed to update faculty assignment', error: error.message });
  }
};

// PATCH /api/faculty-assignments/:id/approve
export const approveFacultyAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('UPDATE subject_allocations SET status = "Active" WHERE id = ?', [id]);

    res.json({ success: true, message: 'Faculty assignment approved successfully' });
  } catch (error) {
    console.error('Error approving faculty assignment:', error);
    res.status(500).json({ success: false, message: 'Failed to approve assignment', error: error.message });
  }
};

// DELETE /api/faculty-assignments/:id
export const deleteFacultyAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM subject_allocations WHERE id = ?', [id]);

    res.json({ success: true, message: 'Faculty assignment removed successfully' });
  } catch (error) {
    console.error('Error deleting faculty assignment:', error);
    res.status(500).json({ success: false, message: 'Failed to remove faculty assignment', error: error.message });
  }
};
