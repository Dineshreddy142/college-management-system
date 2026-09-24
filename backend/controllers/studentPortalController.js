import pool from '../db.js';
import bcrypt from 'bcryptjs';

// --- STUDENT SECURE CONTEXT RESOLVER HELPER ---
const resolveStudentContext = async (userId) => {
  const [students] = await pool.query(`
    SELECT s.*,
           d.name as department_name, d.code as department_code,
           crs.name as program_name, crs.id as course_id,
           r.name as regulation_name, r.id as regulation_id,
           sem.name as semester_name, sem.id as semester_id_resolved, sem.semester_number,
           sec.name as section_name,
           ay.name as academic_year_name
    FROM students s
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN courses crs ON d.id = crs.department_id OR crs.id = 1
    LEFT JOIN regulations r ON r.status = 'Active'
    LEFT JOIN semesters sem ON (s.semester = sem.semester_number OR s.semester_id = sem.id)
    LEFT JOIN sections sec ON s.section_id = sec.id
    LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
    WHERE s.user_id = ?
    ORDER BY r.effective_year DESC, sem.id DESC
    LIMIT 1
  `, [userId]);

  if (students.length === 0) return null;
  return students[0];
};

// --- CORE STUDENT PORTAL ENDPOINTS ---
export const getStudentProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, u.email, u.phone, u.name 
       FROM Students s 
       JOIN Users u ON s.user_id = u.id 
       WHERE s.user_id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Student profile not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

export const getStudentAttendance = async (req, res) => {
  try {
    const [studentRows] = await pool.query(`SELECT id FROM Students WHERE user_id = ?`, [req.user.id]);
    if (studentRows.length === 0) return res.status(404).json({ message: 'Student not found' });
    
    const [rows] = await pool.query(
      `SELECT a.*, sa.subject_name 
       FROM Attendance a
       JOIN SubjectAllocations sa ON a.allocation_id = sa.id
       WHERE a.student_id = ?
       ORDER BY a.date DESC LIMIT 30`,
      [studentRows[0].id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
};

export const getStudentAssignments = async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getStudentTimetable = async (req, res) => {
  try {
    const timetable = {
      department: "Computer Science",
      semester: "6",
      section: "A",
      batch: "2021-2025",
      schedule: []
    };
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT s.*, u.email, u.status FROM students s JOIN users u ON s.user_id = u.id');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createStudent = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { first_name, last_name, email, admission_number, password } = req.body;

    if (!email || !admission_number || !first_name) {
      return res.status(400).json({ error: 'First name, email, and admission number are required' });
    }
    
    const [roleRows] = await conn.execute('SELECT id FROM roles WHERE LOWER(name) = "student"');
    if (roleRows.length === 0) {
      throw new Error('Student role not found');
    }
    const roleId = roleRows[0].id;
    const bcryptPassword = await bcrypt.hash(password || 'Student@123', 10);
    const fullName = `${first_name} ${last_name || ''}`.trim();
    
    const [userRes] = await conn.execute(
      'INSERT INTO users (username, full_name, password, email, role_id, status, must_change_password) VALUES (?, ?, ?, ?, ?, "active", 1)',
      [admission_number, fullName, bcryptPassword, email, roleId]
    );
    
    const userId = userRes.insertId;
    
    const [studentRes] = await conn.execute(
      'INSERT INTO students (user_id, admission_number, first_name, last_name) VALUES (?, ?, ?, ?)',
      [userId, admission_number, first_name, last_name || '']
    );
    
    await conn.commit();
    res.status(201).json({ success: true, id: studentRes.insertId, userId, message: 'Student created successfully' });
  } catch (error) {
    await conn.rollback();
    console.error('Create student error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const [students] = await pool.execute('SELECT user_id FROM students WHERE id = ?', [studentId]);
    if (students.length > 0) {
      await pool.execute('DELETE FROM users WHERE id = ?', [students[0].user_id]);
    }
    res.json({ message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- STUDENT COURSE & ELECTIVE REGISTRATION ENDPOINTS ---
export const getStudentAcademicContext = async (req, res) => {
  try {
    const studentCtx = await resolveStudentContext(req.user.id);
    if (!studentCtx) {
      return res.status(404).json({ success: false, message: 'Student academic record not found' });
    }

    const [regWindows] = await pool.query(`
      SELECT status, start_date, end_date
      FROM registration_periods
      WHERE (department_id IS NULL OR department_id = ?)
        AND (course_id IS NULL OR course_id = ?)
      ORDER BY id DESC LIMIT 1
    `, [studentCtx.department_id, studentCtx.course_id]);

    const registrationWindow = regWindows[0] || { status: 'OPEN', start_date: null, end_date: null };

    res.json({
      success: true,
      data: {
        student_id: studentCtx.id,
        roll_number: studentCtx.roll_number || studentCtx.admission_number || 'N/A',
        name: `${studentCtx.first_name || ''} ${studentCtx.last_name || ''}`.trim() || studentCtx.name || 'Student',
        email: studentCtx.email,
        department_id: studentCtx.department_id,
        department_name: studentCtx.department_name || 'General',
        program_id: studentCtx.course_id,
        program_name: studentCtx.program_name || 'B.Tech',
        regulation_id: studentCtx.regulation_id,
        regulation_name: studentCtx.regulation_name || 'R23',
        academic_year_id: studentCtx.academic_year_id,
        academic_year_name: studentCtx.academic_year_name || 'Academic Year Level',
        semester_id: studentCtx.semester_id_resolved,
        semester_number: studentCtx.semester || studentCtx.semester_number || 1,
        semester_name: studentCtx.semester_name || `Semester ${studentCtx.semester || 1}`,
        section_id: studentCtx.section_id,
        section_name: studentCtx.section_name || studentCtx.section || 'A',
        registration_window: registrationWindow
      }
    });
  } catch (error) {
    console.error('Error fetching student academic context:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve student context', error: error.message });
  }
};

export const getStudentCurriculumSubjects = async (req, res) => {
  try {
    const studentCtx = await resolveStudentContext(req.user.id);
    if (!studentCtx) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const [currRows] = await pool.query(`
      SELECT c.id as curriculum_id, c.total_credits, c.regulation_id, r.name as regulation_name
      FROM curriculums c
      JOIN regulations r ON c.regulation_id = r.id
      WHERE (c.course_id = ? OR c.department_id = ?)
        AND (c.semester_id = ? OR c.semester_id IS NULL)
      ORDER BY c.id DESC LIMIT 1
    `, [studentCtx.course_id, studentCtx.department_id, studentCtx.semester_id_resolved]);

    let curriculumId = currRows[0]?.curriculum_id;

    let mappedSubjects = [];
    if (curriculumId) {
      const [rows] = await pool.query(`
        SELECT cs.subject_id, cs.is_compulsory, cs.is_elective, cs.is_lab, cs.elective_group, cs.credits as mapped_credits,
               s.code as subject_code, s.name as subject_name, s.short_name, s.offering_type, s.prerequisite, s.description,
               sc.name as category_name, sc.code as category_code
        FROM curriculum_subjects cs
        JOIN subjects s ON cs.subject_id = s.id
        LEFT JOIN subject_categories sc ON s.category_id = sc.id
        WHERE cs.curriculum_id = ? AND cs.status = 'Active'
      `, [curriculumId]);
      mappedSubjects = rows;
    } else {
      const [rows] = await pool.query(`
        SELECT s.id as subject_id, 
               (CASE WHEN s.offering_type = 'Practical' THEN 0 ELSE 1 END) as is_compulsory,
               (CASE WHEN s.elective_group IS NOT NULL THEN 1 ELSE 0 END) as is_elective,
               (CASE WHEN s.offering_type = 'Practical' THEN 1 ELSE 0 END) as is_lab,
               s.elective_group, s.credits as mapped_credits,
               s.code as subject_code, s.name as subject_name, s.short_name, s.offering_type, s.prerequisite, s.description,
               sc.name as category_name, sc.code as category_code
        FROM subjects s
        LEFT JOIN subject_categories sc ON s.category_id = sc.id
        WHERE (s.department_id = ? OR s.course_id = ?)
          AND (s.semester_id = ? OR s.semester_id IS NULL)
          AND s.status = 'Active'
      `, [studentCtx.department_id, studentCtx.course_id, studentCtx.semester_id_resolved]);
      mappedSubjects = rows;
    }

    const mandatorySubjects = mappedSubjects.filter(s => s.is_compulsory && !s.is_elective && !s.is_lab);
    const laboratorySubjects = mappedSubjects.filter(s => s.is_lab);
    const electiveSubjects = mappedSubjects.filter(s => s.is_elective);

    const electiveGroupsMap = {};
    electiveSubjects.forEach(sub => {
      const groupName = sub.elective_group || 'Professional Elective I';
      if (!electiveGroupsMap[groupName]) {
        electiveGroupsMap[groupName] = {
          group_name: groupName,
          min_selection: 1,
          max_selection: 1,
          subjects: []
        };
      }
      electiveGroupsMap[groupName].subjects.push(sub);
    });

    const electiveGroups = Object.values(electiveGroupsMap);

    const [existingRegs] = await pool.query(`
      SELECT subject_id, registration_type, elective_group, status
      FROM student_subject_registrations
      WHERE student_id = ? AND status = 'REGISTERED'
    `, [studentCtx.id]);

    res.json({
      success: true,
      data: {
        student_id: studentCtx.id,
        curriculum_id: curriculumId || null,
        mandatory_subjects: mandatorySubjects,
        laboratory_subjects: laboratorySubjects,
        elective_groups: electiveGroups,
        existing_registrations: existingRegs
      }
    });
  } catch (error) {
    console.error('Error fetching curriculum subjects:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch curriculum subjects', error: error.message });
  }
};

export const getMyRegisteredSubjects = async (req, res) => {
  try {
    const studentCtx = await resolveStudentContext(req.user.id);
    if (!studentCtx) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const [rows] = await pool.query(`
      SELECT ssr.id as registration_id, ssr.registration_type, ssr.elective_group, ssr.status as registration_status, ssr.registered_at,
             s.id as subject_id, s.code as subject_code, s.name as subject_name, s.short_name, s.credits, s.offering_type, s.description,
             sc.name as category_name, sc.code as category_code,
             f.id as faculty_id, f.first_name as faculty_first_name, f.last_name as faculty_last_name, f.email as faculty_email, f.designation as faculty_designation,
             sec.name as section_name
      FROM student_subject_registrations ssr
      JOIN subjects s ON ssr.subject_id = s.id
      LEFT JOIN subject_categories sc ON s.category_id = sc.id
      LEFT JOIN subject_allocations sa ON (sa.subject_id = s.id AND (sa.section_id = ? OR sa.section_id IS NULL) AND sa.status = 'Active')
      LEFT JOIN faculties f ON sa.faculty_id = f.id
      LEFT JOIN sections sec ON ssr.section_id = sec.id
      WHERE ssr.student_id = ? AND ssr.status = 'REGISTERED'
      ORDER BY ssr.registration_type ASC, s.code ASC
    `, [studentCtx.section_id, studentCtx.id]);

    const totalCredits = rows.reduce((acc, sub) => acc + (parseFloat(sub.credits) || 0), 0);

    res.json({
      success: true,
      count: rows.length,
      total_credits: totalCredits,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching my registered subjects:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch registered subjects', error: error.message });
  }
};

export const validateElectiveSelection = async (req, res) => {
  try {
    const { selected_elective_subject_ids } = req.body;
    const studentCtx = await resolveStudentContext(req.user.id);
    if (!studentCtx) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const selectedIds = Array.isArray(selected_elective_subject_ids) ? selected_elective_subject_ids : [];

    const [electives] = await pool.query(`
      SELECT cs.subject_id, cs.elective_group, s.code, s.name, s.prerequisite
      FROM curriculum_subjects cs
      JOIN subjects s ON cs.subject_id = s.id
      WHERE cs.is_elective = 1 AND cs.status = 'Active'
    `);

    const groups = {};
    selectedIds.forEach(id => {
      const el = electives.find(e => e.subject_id === Number(id));
      const groupName = el?.elective_group || 'Default Elective Group';
      groups[groupName] = (groups[groupName] || 0) + 1;
    });

    for (const [groupName, count] of Object.entries(groups)) {
      if (count > 1) {
        return res.status(400).json({
          success: false,
          message: `Group '${groupName}' allows a maximum of 1 selection. You selected ${count}.`
        });
      }
    }

    res.json({ success: true, message: 'Elective selections are valid' });
  } catch (error) {
    console.error('Error validating electives:', error);
    res.status(500).json({ success: false, message: 'Validation error', error: error.message });
  }
};

export const confirmRegistration = async (req, res) => {
  try {
    const { selected_elective_subject_ids } = req.body;
    const studentCtx = await resolveStudentContext(req.user.id);
    if (!studentCtx) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const [regWindows] = await pool.query(`
      SELECT status FROM registration_periods
      WHERE (department_id IS NULL OR department_id = ?)
      ORDER BY id DESC LIMIT 1
    `, [studentCtx.department_id]);

    if (regWindows.length > 0 && regWindows[0].status === 'CLOSED') {
      return res.status(403).json({ success: false, message: 'Subject registration period is currently CLOSED.' });
    }

    const selectedElectiveIds = (Array.isArray(selected_elective_subject_ids) ? selected_elective_subject_ids : []).map(Number);

    const [currRows] = await pool.query(`
      SELECT c.id as curriculum_id FROM curriculums c
      WHERE (c.course_id = ? OR c.department_id = ?) AND (c.semester_id = ? OR c.semester_id IS NULL)
      ORDER BY c.id DESC LIMIT 1
    `, [studentCtx.course_id, studentCtx.department_id, studentCtx.semester_id_resolved]);

    const curriculumId = currRows[0]?.curriculum_id || null;

    let mappedSubjects = [];
    if (curriculumId) {
      const [rows] = await pool.query(`
        SELECT cs.subject_id, cs.is_compulsory, cs.is_elective, cs.is_lab, cs.elective_group, s.offering_type
        FROM curriculum_subjects cs
        JOIN subjects s ON cs.subject_id = s.id
        WHERE cs.curriculum_id = ? AND cs.status = 'Active'
      `, [curriculumId]);
      mappedSubjects = rows;
    } else {
      const [rows] = await pool.query(`
        SELECT id as subject_id, 
               (CASE WHEN offering_type = 'Practical' THEN 0 ELSE 1 END) as is_compulsory,
               (CASE WHEN elective_group IS NOT NULL THEN 1 ELSE 0 END) as is_elective,
               (CASE WHEN offering_type = 'Practical' THEN 1 ELSE 0 END) as is_lab,
               elective_group, offering_type
        FROM subjects
        WHERE (department_id = ? OR course_id = ?) AND status = 'Active'
      `, [studentCtx.department_id, studentCtx.course_id]);
      mappedSubjects = rows;
    }

    const subjectsToRegister = [];

    mappedSubjects.forEach(s => {
      if (s.is_compulsory && !s.is_elective && !s.is_lab) {
        subjectsToRegister.push({ subject_id: s.subject_id, type: 'MANDATORY', group: null });
      } else if (s.is_lab) {
        subjectsToRegister.push({ subject_id: s.subject_id, type: 'LABORATORY', group: null });
      } else if (s.is_elective && selectedElectiveIds.includes(s.subject_id)) {
        subjectsToRegister.push({ subject_id: s.subject_id, type: 'ELECTIVE', group: s.elective_group });
      }
    });

    if (subjectsToRegister.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid subjects found to register.' });
    }

    for (const item of subjectsToRegister) {
      await pool.query(`
        INSERT INTO student_subject_registrations
        (student_id, subject_id, curriculum_id, semester_id, academic_year_id, section_id, registration_type, elective_group, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'REGISTERED')
        ON DUPLICATE KEY UPDATE status = 'REGISTERED', updated_at = CURRENT_TIMESTAMP
      `, [
        studentCtx.id,
        item.subject_id,
        curriculumId,
        studentCtx.semester_id_resolved,
        studentCtx.academic_year_id,
        studentCtx.section_id,
        item.type,
        item.group
      ]);
    }

    res.json({
      success: true,
      message: `Registration confirmed for ${subjectsToRegister.length} subjects!`,
      data: { registered_count: subjectsToRegister.length }
    });
  } catch (error) {
    console.error('Error confirming registration:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm registration', error: error.message });
  }
};

export const getAdminRegistrationReport = async (req, res) => {
  try {
    const { department_id, course_id, semester_id, section_id, status } = req.query;

    let query = `
      SELECT ssr.id as registration_id, ssr.registration_type, ssr.elective_group, ssr.status as registration_status, ssr.registered_at,
             s.id as student_id, s.roll_number, s.admission_number, s.first_name as student_first_name, s.last_name as student_last_name,
             subj.code as subject_code, subj.name as subject_name, subj.credits,
             sc.name as category_name,
             d.name as department_name, crs.name as program_name, sem.name as semester_name, sec.name as section_name,
             f.first_name as faculty_first_name, f.last_name as faculty_last_name
      FROM student_subject_registrations ssr
      JOIN students s ON ssr.student_id = s.id
      JOIN subjects subj ON ssr.subject_id = subj.id
      LEFT JOIN subject_categories sc ON subj.category_id = sc.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN courses crs ON d.id = crs.department_id OR crs.id = 1
      LEFT JOIN semesters sem ON ssr.semester_id = sem.id
      LEFT JOIN sections sec ON ssr.section_id = sec.id
      LEFT JOIN subject_allocations sa ON (sa.subject_id = subj.id AND sa.section_id = ssr.section_id AND sa.status = 'Active')
      LEFT JOIN faculties f ON sa.faculty_id = f.id
      WHERE 1=1
    `;

    const params = [];

    if (req.user && req.user.role === 'HOD' && req.user.department_id) {
      query += ` AND s.department_id = ?`;
      params.push(req.user.department_id);
    } else if (department_id && department_id !== 'all') {
      query += ` AND s.department_id = ?`;
      params.push(department_id);
    }

    if (course_id && course_id !== 'all') {
      query += ` AND crs.id = ?`;
      params.push(course_id);
    }

    if (semester_id && semester_id !== 'all') {
      query += ` AND ssr.semester_id = ?`;
      params.push(semester_id);
    }

    if (section_id && section_id !== 'all') {
      query += ` AND ssr.section_id = ?`;
      params.push(section_id);
    }

    if (status && status !== 'all') {
      query += ` AND LOWER(ssr.status) = LOWER(?)`;
      params.push(status);
    }

    query += ` ORDER BY s.roll_number ASC, subj.code ASC`;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching admin registration report:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch registration report', error: error.message });
  }
};

export const toggleRegistrationPeriod = async (req, res) => {
  try {
    const { status, department_id, course_id } = req.body;

    if (!['OPEN', 'CLOSED', 'NOT_OPEN'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid registration window status' });
    }

    await pool.query(`
      INSERT INTO registration_periods (department_id, course_id, status, start_date, end_date)
      VALUES (?, ?, ?, CURRENT_DATE(), DATE_ADD(CURRENT_DATE(), INTERVAL 14 DAY))
    `, [department_id || null, course_id || null, status]);

    res.json({ success: true, message: `Registration period window set to '${status}'.` });
  } catch (error) {
    console.error('Error toggling registration period:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle registration period', error: error.message });
  }
};

export const adminOverrideRegistration = async (req, res) => {
  try {
    const { student_id, subject_id, action, reason } = req.body;

    if (!student_id || !subject_id || !action || !reason) {
      return res.status(400).json({ success: false, message: 'Student, Subject, Action (ADD/DROP), and Reason are required.' });
    }

    if (action === 'ADD') {
      await pool.query(`
        INSERT INTO student_subject_registrations (student_id, subject_id, registration_type, status)
        VALUES (?, ?, 'ELECTIVE', 'REGISTERED')
        ON DUPLICATE KEY UPDATE status = 'REGISTERED', updated_at = CURRENT_TIMESTAMP
      `, [student_id, subject_id]);
    } else if (action === 'DROP') {
      await pool.query(`
        UPDATE student_subject_registrations SET status = 'DROPPED', updated_at = CURRENT_TIMESTAMP
        WHERE student_id = ? AND subject_id = ?
      `, [student_id, subject_id]);
    }

    res.json({ success: true, message: `Manual override '${action}' processed successfully for reason: ${reason}` });
  } catch (error) {
    console.error('Error overriding registration:', error);
    res.status(500).json({ success: false, message: 'Failed to override registration', error: error.message });
  }
};

export const getElectiveAnalytics = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.code as subject_code, s.name as subject_name, ssr.elective_group,
             COUNT(ssr.id) as student_count
      FROM student_subject_registrations ssr
      JOIN subjects s ON ssr.subject_id = s.id
      WHERE ssr.registration_type = 'ELECTIVE' AND ssr.status = 'REGISTERED'
      GROUP BY ssr.subject_id, ssr.elective_group
      ORDER BY ssr.elective_group ASC, student_count DESC
    `);

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Error fetching elective analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch elective analytics', error: error.message });
  }
};
