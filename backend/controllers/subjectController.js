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
    await ensureSubjectColumns();
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

let subjectColsChecked = false;
async function ensureSubjectColumns() {
  if (subjectColsChecked) return;
  try {
    const [cols] = await pool.query('DESCRIBE subjects');
    const colNames = cols.map(c => c.Field);
    const requiredCols = [
      { name: 'short_name', sql: 'ALTER TABLE subjects ADD COLUMN short_name VARCHAR(50) NULL' },
      { name: 'category_id', sql: 'ALTER TABLE subjects ADD COLUMN category_id INT NULL' },
      { name: 'course_id', sql: 'ALTER TABLE subjects ADD COLUMN course_id INT NULL' },
      { name: 'academic_year_id', sql: 'ALTER TABLE subjects ADD COLUMN academic_year_id INT NULL' },
      { name: 'regulation_id', sql: 'ALTER TABLE subjects ADD COLUMN regulation_id INT NULL' },
      { name: 'regulation', sql: 'ALTER TABLE subjects ADD COLUMN regulation VARCHAR(50) NULL' },
      { name: 'credits', sql: 'ALTER TABLE subjects ADD COLUMN credits DECIMAL(3,1) DEFAULT 3.0' },
      { name: 'lecture_hours', sql: 'ALTER TABLE subjects ADD COLUMN lecture_hours INT DEFAULT 3' },
      { name: 'tutorial_hours', sql: 'ALTER TABLE subjects ADD COLUMN tutorial_hours INT DEFAULT 0' },
      { name: 'practical_hours', sql: 'ALTER TABLE subjects ADD COLUMN practical_hours INT DEFAULT 0' },
      { name: 'theory_hours', sql: 'ALTER TABLE subjects ADD COLUMN theory_hours INT DEFAULT 3' },
      { name: 'lab_hours', sql: 'ALTER TABLE subjects ADD COLUMN lab_hours INT DEFAULT 0' },
      { name: 'total_hours', sql: 'ALTER TABLE subjects ADD COLUMN total_hours INT DEFAULT 3' },
      { name: 'internal_marks', sql: 'ALTER TABLE subjects ADD COLUMN internal_marks INT DEFAULT 40' },
      { name: 'external_marks', sql: 'ALTER TABLE subjects ADD COLUMN external_marks INT DEFAULT 60' },
      { name: 'total_marks', sql: 'ALTER TABLE subjects ADD COLUMN total_marks INT DEFAULT 100' },
      { name: 'passing_marks', sql: 'ALTER TABLE subjects ADD COLUMN passing_marks INT DEFAULT 40' },
      { name: 'offering_type', sql: "ALTER TABLE subjects ADD COLUMN offering_type VARCHAR(50) DEFAULT 'Theory'" },
      { name: 'elective_group', sql: 'ALTER TABLE subjects ADD COLUMN elective_group VARCHAR(100) NULL' },
      { name: 'prerequisite', sql: 'ALTER TABLE subjects ADD COLUMN prerequisite TEXT NULL' },
      { name: 'description', sql: 'ALTER TABLE subjects ADD COLUMN description TEXT NULL' },
      { name: 'status', sql: "ALTER TABLE subjects ADD COLUMN status VARCHAR(20) DEFAULT 'Active'" }
    ];
    for (const col of requiredCols) {
      if (!colNames.includes(col.name)) {
        await pool.query(col.sql).catch(() => {});
      }
    }
    subjectColsChecked = true;
  } catch (e) {
    console.error('Error in ensureSubjectColumns:', e);
  }
}

// POST /api/subjects
export const createSubject = async (req, res) => {
  try {
    await ensureSubjectColumns();
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

    const effProgramId = (course_id && course_id !== '') ? course_id : ((program_id && program_id !== '') ? program_id : null);
    const effDeptId = (department_id && department_id !== '') ? department_id : null;
    const effCategoryId = (category_id && category_id !== '') ? category_id : null;
    const effSemId = (semester_id && semester_id !== '') ? semester_id : null;
    const effAyId = (academic_year_id && academic_year_id !== '') ? academic_year_id : null;

    let effRegulationId = (regulation_id && regulation_id !== '') ? regulation_id : null;
    if (!effRegulationId && regulation) {
      try {
        const [regRows] = await pool.query('SELECT id FROM regulations WHERE LOWER(name) = LOWER(?) LIMIT 1', [regulation.trim()]);
        if (regRows.length > 0) effRegulationId = regRows[0].id;
      } catch (e) {}
    }

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
      effCategoryId,
      effDeptId,
      effProgramId,
      effAyId,
      effSemId,
      effRegulationId,
      regulation ? regulation.trim() : null,
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
        effSemId,
        effAyId,
        effCategoryId,
        elective_group ? 1 : 0,
        elective_group || null
      ]).catch(err => console.warn('Notice: program_subjects link skipped:', err.message));
    }

    // Auto-create default subject offering entry for Registration Control
    try {
      const offeringCode = `OFF-${cleanCode}-SEC1`;
      await pool.query(`
        INSERT INTO subject_offerings (
          offering_code, academic_year_id, semester_id, regulation_id, department_id, course_id, section_id, subject_version_id, max_students, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
        ON DUPLICATE KEY UPDATE status = 'OPEN'
      `, [
        offeringCode,
        effAyId || 1,
        effSemId || 1,
        effRegulationId || 1,
        effDeptId || 1,
        effProgramId || 1,
        1,
        subjectId,
        60
      ]);
    } catch (offErr) {
      console.warn('Notice: Auto subject offering creation skipped:', offErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: { id: subjectId, code: cleanCode, name }
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create subject', error: error.message });
  }
};

// PUT /api/subjects/:id
export const updateSubject = async (req, res) => {
  try {
    await ensureSubjectColumns();
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

// POST /api/subjects/bulk-import
export const bulkImportSubjects = async (req, res) => {
  try {
    await ensureSubjectColumns();
    const { subjects: items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'An array of subjects is required.' });
    }

    let insertedCount = 0;
    const insertedRecords = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let {
        code,
        name,
        short_name,
        category_id,
        department_id,
        course_id,
        semester_id,
        regulation,
        credits = 3,
        lecture_hours = 3,
        tutorial_hours = 0,
        practical_hours = 0,
        offering_type = 'Theory',
        elective_group = '',
        prerequisite = '',
        description = ''
      } = item;

      if (!name) continue;

      const regStr = regulation ? String(regulation).trim() : 'R25';
      const regYear = regStr.replace(/[^0-9]/g, '') || '25';
      
      // Generate code if AUTO or empty
      if (!code || code.trim().toUpperCase() === 'AUTO') {
        let deptCode = 'CS';
        if (department_id) {
          const [dRows] = await pool.query('SELECT code, name FROM departments WHERE id = ?', [department_id]);
          if (dRows.length > 0) {
            const dName = (dRows[0].code || dRows[0].name || '').toUpperCase();
            if (dName.includes('COMPUTER') || dName.includes('CSE') || dName === 'CS') deptCode = 'CS';
            else if (dName.includes('ELECTRONICS') || dName.includes('ECE') || dName === 'EC') deptCode = 'EC';
            else if (dName.includes('ELECTRICAL') || dName.includes('EEE') || dName === 'EE') deptCode = 'EE';
            else if (dName.includes('MECHANICAL') || dName.includes('MECH') || dName === 'ME') deptCode = 'ME';
            else if (dName.includes('CIVIL') || dName === 'CE') deptCode = 'CE';
            else if (dName.includes('INFORMATION') || dName.includes('IT')) deptCode = 'IT';
            else if (dName.includes('ARTIFICIAL') || dName.includes('AI')) deptCode = 'AI';
            else deptCode = dName.substring(0, 2);
          }
        }

        let semNum = '1';
        if (semester_id) {
          const [sRows] = await pool.query('SELECT semester_number, name FROM semesters WHERE id = ?', [semester_id]);
          if (sRows.length > 0) {
            if (sRows[0].semester_number) semNum = String(sRows[0].semester_number);
            else {
              const m = sRows[0].name.match(/\d+/);
              if (m) semNum = m[0];
            }
          }
        }

        let typePrefix = '0';
        if (offering_type && (offering_type.toLowerCase().includes('lab') || offering_type.toLowerCase().includes('practical'))) {
          typePrefix = 'L0';
        } else if (elective_group && elective_group.trim() !== '') {
          typePrefix = 'E0';
        }

        const seq = (i + 1).toString().padStart(2, '0');
        code = `${regYear}${deptCode}${semNum}${typePrefix}${seq}`;
      }

      let cleanCode = code.trim().toUpperCase();
      
      // Check existing duplicate
      const [existing] = await pool.query('SELECT id FROM subjects WHERE UPPER(code) = ?', [cleanCode]);
      if (existing.length > 0) {
        cleanCode = `${cleanCode}_${Date.now().toString().slice(-4)}`;
      }

      const totalH = (Number(lecture_hours) || 0) + (Number(tutorial_hours) || 0) + (Number(practical_hours) || 0);

      const [result] = await pool.query(
        `INSERT INTO subjects (
          code, name, short_name, category_id, department_id, course_id, semester_id,
          regulation, credits, lecture_hours, tutorial_hours, practical_hours,
          total_hours, internal_marks, external_marks, total_marks, passing_marks,
          offering_type, elective_group, prerequisite, description, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 40, 60, 100, 40, ?, ?, ?, ?, 'Active')`,
        [
          cleanCode,
          name,
          short_name || name.substring(0, 10),
          category_id || null,
          department_id || null,
          course_id || null,
          semester_id || null,
          regStr,
          credits || 3,
          lecture_hours || 3,
          tutorial_hours || 0,
          practical_hours || 0,
          totalH || 3,
          offering_type || 'Theory',
          elective_group || '',
          prerequisite || '',
          description || ''
        ]
      );

      const newSubjectId = result.insertId;

      // Auto-create default subject offering entry for Registration Control
      try {
        const offeringCode = `OFF-${cleanCode}-SEC1`;
        await pool.query(`
          INSERT INTO subject_offerings (
            offering_code, academic_year_id, semester_id, regulation_id, department_id, course_id, section_id, subject_version_id, max_students, status
          ) VALUES (?, 1, ?, 1, ?, ?, 1, ?, 60, 'OPEN')
          ON DUPLICATE KEY UPDATE status = 'OPEN'
        `, [
          offeringCode,
          semester_id || 1,
          department_id || 1,
          course_id || 1,
          newSubjectId
        ]);
      } catch (offErr) {}

      insertedCount++;
      insertedRecords.push({ id: newSubjectId, code: cleanCode, name });
    }

    res.json({
      success: true,
      message: `Successfully imported ${insertedCount} master subjects into curriculum database.`,
      count: insertedCount,
      inserted: insertedRecords
    });
  } catch (error) {
    console.error('Error bulk importing subjects:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk import subjects', error: error.message });
  }
};

// DELETE /api/subjects (Clear all subject catalog and offering records)
export const clearAllSubjects = async (req, res) => {
  try {
    await pool.query('DELETE FROM subject_offerings').catch(() => {});
    await pool.query('DELETE FROM curriculum_subjects').catch(() => {});
    await pool.query('DELETE FROM program_subjects').catch(() => {});
    await pool.query('DELETE FROM subject_allocations').catch(() => {});
    const [result] = await pool.query('DELETE FROM subjects');

    res.json({
      success: true,
      message: 'Successfully purged all subject catalog data.',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error clearing subjects:', error);
    res.status(500).json({ success: false, message: 'Failed to clear subjects', error: error.message });
  }
};
