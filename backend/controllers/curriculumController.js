import pool from '../db.js';

// --- REGULATIONS CONTROLLER ---

// GET /api/regulations
export const getRegulations = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM regulations ORDER BY effective_year DESC, name ASC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching regulations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch regulations', error: error.message });
  }
};

// POST /api/regulations
export const createRegulation = async (req, res) => {
  try {
    const { name, effective_year, description, status } = req.body;

    if (!name || !effective_year) {
      return res.status(400).json({ success: false, message: 'Regulation Name and Effective Year are required.' });
    }

    const cleanName = name.trim().toUpperCase();

    const [existing] = await pool.query('SELECT id FROM regulations WHERE UPPER(name) = ?', [cleanName]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: `Regulation '${cleanName}' already exists.` });
    }

    const [result] = await pool.query(
      'INSERT INTO regulations (name, effective_year, description, status) VALUES (?, ?, ?, ?)',
      [cleanName, parseInt(effective_year), description ? description.trim() : null, status || 'Active']
    );

    res.status(201).json({
      success: true,
      message: 'Regulation created successfully',
      data: { id: result.insertId, name: cleanName, effective_year }
    });
  } catch (error) {
    console.error('Error creating regulation:', error);
    res.status(500).json({ success: false, message: 'Failed to create regulation', error: error.message });
  }
};

// PUT /api/regulations/:id
export const updateRegulation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, effective_year, description, status } = req.body;

    await pool.query(
      'UPDATE regulations SET name = COALESCE(?, name), effective_year = COALESCE(?, effective_year), description = ?, status = COALESCE(?, status) WHERE id = ?',
      [name ? name.trim().toUpperCase() : null, effective_year ? parseInt(effective_year) : null, description ? description.trim() : null, status, id]
    );

    res.json({ success: true, message: 'Regulation updated successfully' });
  } catch (error) {
    console.error('Error updating regulation:', error);
    res.status(500).json({ success: false, message: 'Failed to update regulation', error: error.message });
  }
};

// --- CURRICULUMS CONTROLLER ---

// GET /api/curriculums
export const getCurriculums = async (req, res) => {
  try {
    const { department_id, course_id, program_id, regulation_id, semester_id, academic_year_id, status } = req.query;

    let query = `
      SELECT c.*,
             d.name as department_name, d.code as department_code,
             crs.name as program_name, crs.name as course_name,
             r.name as regulation_name, r.effective_year,
             sem.name as semester_name, sem.semester_number,
             ay.name as academic_year_name, ay.year_level,
             COUNT(cs.id) as mapped_subjects_count,
             COALESCE(SUM(cs.credits), 0) as calculated_total_credits
      FROM curriculums c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN courses crs ON c.course_id = crs.id
      LEFT JOIN regulations r ON c.regulation_id = r.id
      LEFT JOIN semesters sem ON c.semester_id = sem.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      LEFT JOIN curriculum_subjects cs ON c.id = cs.curriculum_id AND cs.status = 'Active'
      WHERE 1=1
    `;

    const params = [];

    if (department_id && department_id !== 'all') {
      query += ` AND c.department_id = ?`;
      params.push(department_id);
    }

    const effProgramId = course_id || program_id;
    if (effProgramId && effProgramId !== 'all') {
      query += ` AND c.course_id = ?`;
      params.push(effProgramId);
    }

    if (regulation_id && regulation_id !== 'all') {
      query += ` AND c.regulation_id = ?`;
      params.push(regulation_id);
    }

    if (semester_id && semester_id !== 'all') {
      query += ` AND c.semester_id = ?`;
      params.push(semester_id);
    }

    if (academic_year_id && academic_year_id !== 'all') {
      query += ` AND c.academic_year_id = ?`;
      params.push(academic_year_id);
    }

    if (status && status !== 'all') {
      query += ` AND LOWER(c.status) = LOWER(?)`;
      params.push(status);
    }

    query += ` GROUP BY c.id ORDER BY c.id DESC`;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching curriculums:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch curriculums', error: error.message });
  }
};

// GET /api/curriculums/:id
export const getCurriculumById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT c.*,
             d.name as department_name, d.code as department_code,
             crs.name as program_name, crs.name as course_name,
             r.name as regulation_name, r.effective_year,
             sem.name as semester_name, sem.semester_number,
             ay.name as academic_year_name, ay.year_level
      FROM curriculums c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN courses crs ON c.course_id = crs.id
      LEFT JOIN regulations r ON c.regulation_id = r.id
      LEFT JOIN semesters sem ON c.semester_id = sem.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE c.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Curriculum not found' });
    }

    const curriculum = rows[0];

    // Fetch mapped subjects
    const [mappedSubjects] = await pool.query(`
      SELECT CONCAT(cs.curriculum_id, '_', cs.subject_id) as mapping_id, cs.curriculum_id, cs.subject_id, cs.is_compulsory, cs.is_elective, cs.is_lab, cs.elective_group, cs.credits as mapped_credits, cs.status as mapping_status,
             s.code as subject_code, s.name as subject_name, s.short_name, s.offering_type, s.lecture_hours, s.tutorial_hours, s.practical_hours, s.total_hours, s.internal_marks, s.external_marks, s.total_marks, s.passing_marks,
             sc.name as category_name, sc.code as category_code
      FROM curriculum_subjects cs
      JOIN subjects s ON cs.subject_id = s.id
      LEFT JOIN subject_categories sc ON s.category_id = sc.id
      WHERE cs.curriculum_id = ?
      ORDER BY cs.is_compulsory DESC, s.code ASC
    `, [id]);

    curriculum.subjects = mappedSubjects;
    curriculum.total_mapped_credits = mappedSubjects.reduce((acc, sub) => acc + (parseFloat(sub.mapped_credits) || 0), 0);
    curriculum.total_mapped_subjects = mappedSubjects.length;

    res.json({ success: true, data: curriculum });
  } catch (error) {
    console.error('Error fetching curriculum by ID:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch curriculum details', error: error.message });
  }
};

// POST /api/curriculums
export const createCurriculum = async (req, res) => {
  try {
    const { department_id, course_id, program_id, regulation_id, academic_year_id, semester_id, status } = req.body;

    const effProgramId = course_id || program_id;

    if (!effProgramId || !regulation_id || !semester_id) {
      return res.status(400).json({ success: false, message: 'Program/Course, Regulation, and Semester are required.' });
    }

    // Check duplicate curriculum combination
    const [existing] = await pool.query(
      'SELECT id FROM curriculums WHERE course_id = ? AND regulation_id = ? AND semester_id = ?',
      [effProgramId, regulation_id, semester_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'A curriculum mapping already exists for this Program, Regulation, and Semester combination.' });
    }

    const [result] = await pool.query(`
      INSERT INTO curriculums (department_id, course_id, regulation_id, academic_year_id, semester_id, total_credits, total_subjects, status)
      VALUES (?, ?, ?, ?, ?, 0, 0, ?)
    `, [
      department_id || null,
      effProgramId,
      regulation_id,
      academic_year_id || null,
      semester_id,
      status || 'Active'
    ]);

    res.status(201).json({
      success: true,
      message: 'Curriculum matrix created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating curriculum:', error);
    res.status(500).json({ success: false, message: 'Failed to create curriculum', error: error.message });
  }
};

// POST /api/curriculums/:id/subjects (Map Subject to Curriculum)
export const addSubjectToCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_id, is_compulsory, is_elective, is_lab, elective_group, credits } = req.body;

    if (!subject_id) {
      return res.status(400).json({ success: false, message: 'Subject ID is required.' });
    }

    // Verify curriculum exists
    const [currRows] = await pool.query('SELECT id FROM curriculums WHERE id = ?', [id]);
    if (currRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Curriculum record not found' });
    }

    // Verify subject exists
    const [subjRows] = await pool.query('SELECT id, credits, offering_type, category_id FROM subjects WHERE id = ?', [subject_id]);
    if (subjRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subject record not found' });
    }

    const targetSubj = subjRows[0];
    const effectiveCredits = parseFloat(credits ?? targetSubj.credits ?? 3.0);
    const autoIsLab = is_lab !== undefined ? (is_lab ? 1 : 0) : (targetSubj.offering_type === 'Practical' ? 1 : 0);
    const autoIsElective = is_elective !== undefined ? (is_elective ? 1 : 0) : 0;
    const autoIsCompulsory = is_compulsory !== undefined ? (is_compulsory ? 1 : 0) : (autoIsElective ? 0 : 1);

    // Insert or update mapping
    await pool.query(`
      INSERT INTO curriculum_subjects (curriculum_id, subject_id, is_compulsory, is_elective, is_lab, elective_group, credits, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
      ON DUPLICATE KEY UPDATE
        is_compulsory = VALUES(is_compulsory),
        is_elective = VALUES(is_elective),
        is_lab = VALUES(is_lab),
        elective_group = VALUES(elective_group),
        credits = VALUES(credits),
        status = 'Active'
    `, [id, subject_id, autoIsCompulsory, autoIsElective, autoIsLab, elective_group || null, effectiveCredits]);

    // Recalculate totals on curriculums table
    const [totals] = await pool.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(credits), 0) as sum FROM curriculum_subjects WHERE curriculum_id = ? AND status = "Active"',
      [id]
    );

    await pool.query(
      'UPDATE curriculums SET total_subjects = ?, total_credits = ? WHERE id = ?',
      [totals[0].count, totals[0].sum, id]
    );

    res.json({
      success: true,
      message: 'Subject mapped to curriculum successfully',
      data: { curriculum_id: id, subject_id, total_subjects: totals[0].count, total_credits: totals[0].sum }
    });
  } catch (error) {
    console.error('Error adding subject to curriculum:', error);
    res.status(500).json({ success: false, message: 'Failed to map subject to curriculum', error: error.message });
  }
};

// DELETE /api/curriculums/:id/subjects/:subjectId (Unmap Subject)
export const removeSubjectFromCurriculum = async (req, res) => {
  try {
    const { id, subjectId } = req.params;

    await pool.query('DELETE FROM curriculum_subjects WHERE curriculum_id = ? AND subject_id = ?', [id, subjectId]);

    // Recalculate totals
    const [totals] = await pool.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(credits), 0) as sum FROM curriculum_subjects WHERE curriculum_id = ? AND status = "Active"',
      [id]
    );

    await pool.query(
      'UPDATE curriculums SET total_subjects = ?, total_credits = ? WHERE id = ?',
      [totals[0].count, totals[0].sum, id]
    );

    res.json({ success: true, message: 'Subject unmapped from curriculum successfully' });
  } catch (error) {
    console.error('Error removing subject from curriculum:', error);
    res.status(500).json({ success: false, message: 'Failed to unmap subject from curriculum', error: error.message });
  }
};

// PUT /api/curriculums/:id
export const updateCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query('UPDATE curriculums SET status = ? WHERE id = ?', [status || 'Active', id]);

    res.json({ success: true, message: 'Curriculum updated successfully' });
  } catch (error) {
    console.error('Error updating curriculum:', error);
    res.status(500).json({ success: false, message: 'Failed to update curriculum', error: error.message });
  }
};
