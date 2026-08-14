import pool from '../db.js';

// GET /api/subject-categories
export const getSubjectCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT sc.*, COUNT(s.id) as subject_count
      FROM subject_categories sc
      LEFT JOIN subjects s ON sc.id = s.category_id
      GROUP BY sc.id
      ORDER BY sc.id ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching subject categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subject categories', error: error.message });
  }
};

// GET /api/subjects
export const getSubjects = async (req, res) => {
  try {
    const { category, category_id, department, department_id, program, program_id, course_id, semester, semester_id, academicYear, academic_year_id, regulation, status, search } = req.query;

    let query = `
      SELECT s.*,
             sc.name as category_name, sc.code as category_code,
             d.name as department_name, d.code as department_code,
             c.name as program_name, c.name as course_name,
             sem.name as semester_name, sem.semester_number,
             ay.name as academic_year_name, ay.year_level,
             r.name as regulation_name
      FROM subjects s
      LEFT JOIN subject_categories sc ON s.category_id = sc.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN semesters sem ON s.semester_id = sem.id
      LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
      LEFT JOIN regulations r ON s.regulation_id = r.id
      WHERE 1=1
    `;

    const params = [];

    if (category_id) {
      query += ` AND s.category_id = ?`;
      params.push(category_id);
    } else if (category && category !== 'all') {
      query += ` AND (LOWER(sc.code) = LOWER(?) OR LOWER(sc.name) = LOWER(?))`;
      params.push(category, category);
    }

    if (department_id) {
      query += ` AND s.department_id = ?`;
      params.push(department_id);
    } else if (department && department !== 'all') {
      query += ` AND (LOWER(d.code) = LOWER(?) OR LOWER(d.name) LIKE LOWER(?))`;
      params.push(department, `%${department}%`);
    }

    const effectiveProgramId = program_id || course_id;
    if (effectiveProgramId) {
      query += ` AND s.course_id = ?`;
      params.push(effectiveProgramId);
    } else if (program && program !== 'all') {
      query += ` AND LOWER(c.name) LIKE LOWER(?)`;
      params.push(`%${program}%`);
    }

    if (semester_id) {
      query += ` AND s.semester_id = ?`;
      params.push(semester_id);
    } else if (semester && semester !== 'all') {
      query += ` AND (LOWER(sem.name) LIKE LOWER(?) OR sem.semester_number = ?)`;
      params.push(`%${semester}%`, parseInt(semester) || 0);
    }

    if (academic_year_id) {
      query += ` AND s.academic_year_id = ?`;
      params.push(academic_year_id);
    } else if (academicYear && academicYear !== 'all') {
      query += ` AND (LOWER(ay.name) LIKE LOWER(?) OR ay.year_level = ?)`;
      params.push(`%${academicYear}%`, parseInt(academicYear) || 0);
    }

    if (regulation && regulation !== 'all') {
      query += ` AND (s.regulation_id = ? OR LOWER(s.regulation) = LOWER(?))`;
      params.push(parseInt(regulation) || 0, regulation);
    }

    if (status && status !== 'all') {
      query += ` AND LOWER(s.status) = LOWER(?)`;
      params.push(status);
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query += ` AND (s.code LIKE ? OR s.name LIKE ? OR s.short_name LIKE ? OR s.description LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY s.id DESC`;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subjects', error: error.message });
  }
};

// GET /api/subjects/:id
export const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT s.*,
             sc.name as category_name, sc.code as category_code,
             d.name as department_name, d.code as department_code,
             c.name as program_name, c.name as course_name,
             sem.name as semester_name, sem.semester_number,
             ay.name as academic_year_name, ay.year_level,
             r.name as regulation_name
      FROM subjects s
      LEFT JOIN subject_categories sc ON s.category_id = sc.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN semesters sem ON s.semester_id = sem.id
      LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
      LEFT JOIN regulations r ON s.regulation_id = r.id
      WHERE s.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const subject = rows[0];

    // Fetch allocated faculty members
    const [faculties] = await pool.query(`
      SELECT sa.id as allocation_id, sa.section_id, sa.weekly_hours,
             f.id as faculty_id, f.first_name, f.last_name, u.email as faculty_email,
             sec.name as section_name
      FROM subject_allocations sa
      JOIN faculties f ON sa.faculty_id = f.id
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN sections sec ON sa.section_id = sec.id
      WHERE sa.subject_id = ?
    `, [id]);

    subject.allocated_faculty = faculties;

    res.json({ success: true, data: subject });
  } catch (error) {
    console.error('Error fetching subject by ID:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subject details', error: error.message });
  }
};

// POST /api/subjects
export const createSubject = async (req, res) => {
  try {
    const {
      code,
      name,
      short_name,
      category_id,
      department_id,
      course_id,
      program_id,
      semester_id,
      academic_year_id,
      regulation_id,
      regulation,
      credits,
      lecture_hours,
      tutorial_hours,
      practical_hours,
      theory_hours,
      lab_hours,
      internal_marks,
      external_marks,
      passing_marks,
      offering_type,
      elective_group,
      prerequisite,
      description,
      status
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Subject Code and Subject Name are required.' });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check duplicate code
    const [existing] = await pool.query('SELECT id FROM subjects WHERE UPPER(code) = ?', [cleanCode]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: `Subject Code '${cleanCode}' already exists.` });
    }

    const effLecHours = parseInt(lecture_hours ?? theory_hours ?? 3);
    const effTutHours = parseInt(tutorial_hours ?? 0);
    const effPracHours = parseInt(practical_hours ?? lab_hours ?? 0);
    const calculatedTotalHours = effLecHours + effTutHours + effPracHours;

    const effInternal = parseInt(internal_marks ?? 40);
    const effExternal = parseInt(external_marks ?? 60);
    const calculatedTotalMarks = effInternal + effExternal;

    const effProgramId = course_id || program_id || null;

    const [result] = await pool.query(`
      INSERT INTO subjects (
        code, name, short_name, category_id, department_id, course_id,
        academic_year_id, semester_id, regulation_id, regulation,
        credits, lecture_hours, tutorial_hours, practical_hours, theory_hours, lab_hours, total_hours,
        internal_marks, external_marks, total_marks, passing_marks,
        offering_type, elective_group, prerequisite, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cleanCode,
      name.trim(),
      short_name ? short_name.trim() : null,
      category_id || null,
      department_id || null,
      effProgramId,
      academic_year_id || null,
      semester_id || null,
      regulation_id || null,
      regulation || null,
      parseFloat(credits ?? 3.0),
      effLecHours,
      effTutHours,
      effPracHours,
      effLecHours,
      effPracHours,
      calculatedTotalHours,
      effInternal,
      effExternal,
      calculatedTotalMarks,
      parseInt(passing_marks ?? 40),
      offering_type || 'Theory',
      elective_group ? elective_group.trim() : null,
      prerequisite ? prerequisite.trim() : null,
      description ? description.trim() : null,
      status || 'Active'
    ]);

    const subjectId = result.insertId;

    // Link to program_subjects if program_id provided
    if (effProgramId) {
      await pool.query(`
        INSERT INTO program_subjects (program_id, subject_id, semester_id, academic_year_id, category_id, is_elective, elective_group)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        effProgramId,
        subjectId,
        semester_id || null,
        academic_year_id || null,
        category_id || null,
        elective_group ? 1 : 0,
        elective_group || null
      ]);
    }

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: { id: subjectId, code: cleanCode, name }
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ success: false, message: 'Failed to create subject', error: error.message });
  }
};

// PUT /api/subjects/:id
export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      name,
      short_name,
      category_id,
      department_id,
      course_id,
      program_id,
      semester_id,
      academic_year_id,
      regulation_id,
      regulation,
      credits,
      lecture_hours,
      tutorial_hours,
      practical_hours,
      theory_hours,
      lab_hours,
      internal_marks,
      external_marks,
      passing_marks,
      offering_type,
      elective_group,
      prerequisite,
      description,
      status
    } = req.body;

    const [existing] = await pool.query('SELECT id, code FROM subjects WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (code) {
      const cleanCode = code.trim().toUpperCase();
      const [duplicate] = await pool.query('SELECT id FROM subjects WHERE UPPER(code) = ? AND id != ?', [cleanCode, id]);
      if (duplicate.length > 0) {
        return res.status(409).json({ success: false, message: `Subject Code '${cleanCode}' is already in use by another subject.` });
      }
    }

    const effLecHours = parseInt(lecture_hours ?? theory_hours ?? 3);
    const effTutHours = parseInt(tutorial_hours ?? 0);
    const effPracHours = parseInt(practical_hours ?? lab_hours ?? 0);
    const calculatedTotalHours = effLecHours + effTutHours + effPracHours;

    const effInternal = parseInt(internal_marks ?? 40);
    const effExternal = parseInt(external_marks ?? 60);
    const calculatedTotalMarks = effInternal + effExternal;

    const effProgramId = course_id || program_id || null;

    await pool.query(`
      UPDATE subjects SET
        code = COALESCE(?, code),
        name = COALESCE(?, name),
        short_name = ?,
        category_id = ?,
        department_id = ?,
        course_id = ?,
        academic_year_id = ?,
        semester_id = ?,
        regulation_id = ?,
        regulation = ?,
        credits = ?,
        lecture_hours = ?,
        tutorial_hours = ?,
        practical_hours = ?,
        theory_hours = ?,
        lab_hours = ?,
        total_hours = ?,
        internal_marks = ?,
        external_marks = ?,
        total_marks = ?,
        passing_marks = ?,
        offering_type = ?,
        elective_group = ?,
        prerequisite = ?,
        description = ?,
        status = COALESCE(?, status)
      WHERE id = ?
    `, [
      code ? code.trim().toUpperCase() : null,
      name ? name.trim() : null,
      short_name ? short_name.trim() : null,
      category_id || null,
      department_id || null,
      effProgramId,
      academic_year_id || null,
      semester_id || null,
      regulation_id || null,
      regulation || null,
      parseFloat(credits ?? 3.0),
      effLecHours,
      effTutHours,
      effPracHours,
      effLecHours,
      effPracHours,
      calculatedTotalHours,
      effInternal,
      effExternal,
      calculatedTotalMarks,
      parseInt(passing_marks ?? 40),
      offering_type || 'Theory',
      elective_group ? elective_group.trim() : null,
      prerequisite ? prerequisite.trim() : null,
      description ? description.trim() : null,
      status || 'Active',
      id
    ]);

    res.json({ success: true, message: 'Subject updated successfully' });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ success: false, message: 'Failed to update subject', error: error.message });
  }
};

// PATCH /api/subjects/:id/status (Soft Deactivation / Activation)
export const updateSubjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const newStatus = status === 'Active' ? 'Active' : 'Inactive';

    const [existing] = await pool.query('SELECT id, name, code FROM subjects WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Check if referenced in attendance, timetable, marks, or faculty allocations
    const [allocCount] = await pool.query('SELECT COUNT(*) as cnt FROM subject_allocations WHERE subject_id = ?', [id]);
    const [attCount] = await pool.query('SELECT COUNT(*) as cnt FROM attendance WHERE subject_id = ?', [id]);
    const [marksCount] = await pool.query('SELECT COUNT(*) as cnt FROM marks WHERE subject_id = ?', [id]);

    const isReferenced = (allocCount[0]?.cnt > 0) || (attCount[0]?.cnt > 0) || (marksCount[0]?.cnt > 0);

    // Soft deactivation
    await pool.query('UPDATE subjects SET status = ? WHERE id = ?', [newStatus, id]);

    res.json({
      success: true,
      message: `Subject '${existing[0].code}' status changed to ${newStatus}.`,
      is_referenced: isReferenced,
      soft_deactivated: true
    });
  } catch (error) {
    console.error('Error updating subject status:', error);
    res.status(500).json({ success: false, message: 'Failed to update subject status', error: error.message });
  }
};
