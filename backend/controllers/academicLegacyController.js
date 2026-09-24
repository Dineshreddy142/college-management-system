import pool from '../db.js';

export const getSubjectsLegacy = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT s.*, d.name as department_name, c.name as course_name, ay.name as academic_year_name, sem.name as semester_name
      FROM subjects s
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
      LEFT JOIN semesters sem ON s.semester_id = sem.id
      ORDER BY s.id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createSubjectLegacy = async (req, res) => {
  try {
    const { code, name, department_id, course_id, academic_year_id, semester_id, credits, theory_hours, lab_hours, tutorial_hours, subject_type } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO subjects (code, name, department_id, course_id, academic_year_id, semester_id, credits, theory_hours, lab_hours, tutorial_hours, subject_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, name, department_id || null, course_id || null, academic_year_id || null, semester_id, credits || 0, theory_hours || 0, lab_hours || 0, tutorial_hours || 0, subject_type || 'Core']
    );
    res.status(201).json({ id: result.insertId, message: 'Subject created successfully' });
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateSubjectLegacy = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, credits, theory_hours, lab_hours, tutorial_hours, subject_type, status } = req.body;
    await pool.execute(
      `UPDATE subjects SET name = ?, credits = ?, theory_hours = ?, lab_hours = ?, tutorial_hours = ?, subject_type = ?, status = ? WHERE id = ?`,
      [name, credits, theory_hours, lab_hours, tutorial_hours, subject_type, status, id]
    );
    res.json({ message: 'Subject updated successfully' });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getAllocationsLegacy = async (req, res) => {
  try {
    let query = `
      SELECT sa.*, 
             s.name as subject_name, s.code as subject_code, s.subject_type,
             sec.name as section_name,
             f.first_name, f.last_name, f.department_id as faculty_dept_id,
             d.name as department_name, sem.name as semester_name, ay.year as academic_year
      FROM subject_allocations sa
      JOIN subjects s ON sa.subject_id = s.id
      JOIN sections sec ON sa.section_id = sec.id
      JOIN faculties f ON sa.faculty_id = f.id
      LEFT JOIN departments d ON sa.department_id = d.id
      LEFT JOIN semesters sem ON sa.semester_id = sem.id
      LEFT JOIN academic_years ay ON sa.academic_year_id = ay.id
      WHERE 1=1
    `;
    const params = [];
    
    if (req.user && req.user.role === 'HOD' && req.user.department_id) {
        query += ` AND sa.department_id = ?`;
        params.push(req.user.department_id);
    }
    
    query += ` ORDER BY sa.id DESC`;

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createAllocationLegacy = async (req, res) => {
  try {
    const { department_id, course_id, academic_year_id, semester_id, section_id, subject_id, faculty_id, weekly_hours, academic_session, start_date, end_date } = req.body;
    
    const [existing] = await pool.execute(
        `SELECT id FROM subject_allocations WHERE subject_id = ? AND section_id = ? AND faculty_id = ?`,
        [subject_id, section_id, faculty_id]
    );
    if (existing.length > 0) {
        return res.status(400).json({ error: 'This faculty is already assigned to this subject and section.' });
    }

    const created_by = req.user ? req.user.id : null;

    const [result] = await pool.execute(
      `INSERT INTO subject_allocations 
      (department_id, course_id, academic_year_id, semester_id, section_id, subject_id, faculty_id, weekly_hours, academic_session, start_date, end_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [department_id || null, course_id || null, academic_year_id || null, semester_id || null, section_id, subject_id, faculty_id, weekly_hours || 0, academic_session || null, start_date || null, end_date || null, created_by]
    );
    res.status(201).json({ id: result.insertId, message: 'Subject allocated successfully' });
  } catch (error) {
    console.error('Error creating allocation:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteAllocationLegacy = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM subject_allocations WHERE id = ?', [id]);
    res.json({ message: 'Allocation deleted successfully' });
  } catch (error) {
    console.error('Error deleting allocation:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getAcademicMetadata = async (req, res) => {
    try {
        const [departments] = await pool.execute('SELECT id, name, code FROM departments');
        const [courses] = await pool.execute('SELECT id, name, code FROM courses');
        const [academic_years] = await pool.execute('SELECT id, year FROM academic_years');
        const [semesters] = await pool.execute('SELECT id, name FROM semesters');
        const [sections] = await pool.execute('SELECT id, name FROM sections');
        const [faculties] = await pool.execute('SELECT id, first_name, last_name, department_id FROM faculties');
        
        res.json({
            departments,
            courses,
            academic_years,
            semesters,
            sections,
            faculties
        });
    } catch (error) {
        console.error('Error fetching metadata:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getAcademicSessions = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM academic_sessions ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createAcademicSession = async (req, res) => {
    try {
        const { name, start_date, end_date, status } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO academic_sessions (name, start_date, end_date, status) VALUES (?, ?, ?, ?)',
            [name, start_date, end_date, status || 'Upcoming']
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getAcademicRegulations = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM regulations ORDER BY effective_year DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getCurriculumOverview = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT c.*, d.name as department_name, crs.name as course_name, r.name as regulation_name, ay.name as year_name, s.name as sem_name
            FROM curriculums c
            JOIN departments d ON c.department_id = d.id
            JOIN courses crs ON c.course_id = crs.id
            JOIN regulations r ON c.regulation_id = r.id
            LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
            LEFT JOIN semesters s ON c.semester_id = s.id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const promoteStudent = async (req, res) => {
    try {
        const { student_id, from_year, to_year, from_sem, to_sem } = req.body;
        const promoted_by = req.user ? req.user.id : null;
        const [result] = await pool.execute(
            'INSERT INTO promotions (student_id, from_academic_year_id, to_academic_year_id, from_semester_id, to_semester_id, promoted_by) VALUES (?, ?, ?, ?, ?, ?)',
            [student_id, from_year, to_year, from_sem, to_sem, promoted_by]
        );
        res.status(201).json({ message: 'Student promoted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
