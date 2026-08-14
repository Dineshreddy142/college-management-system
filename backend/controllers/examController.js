import pool from '../db.js';

// Helper to resolve Faculty ID from authenticated user
const resolveFacultyId = async (userId) => {
  const [rows] = await pool.query('SELECT id FROM faculties WHERE user_id = ?', [userId]);
  return rows.length > 0 ? rows[0].id : null;
};

// Helper to resolve Student ID from authenticated user
const resolveStudentId = async (userId) => {
  const [rows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [userId]);
  return rows.length > 0 ? rows[0].id : null;
};

// Helper to calculate grade from total marks using grade_rules
const calculateGradeAndPoint = async (totalMarks) => {
  const mark = parseFloat(totalMarks) || 0;
  const [rules] = await pool.query(`
    SELECT grade, grade_point, result_status
    FROM grade_rules
    WHERE ? BETWEEN min_mark AND max_mark
    LIMIT 1
  `, [mark]);

  if (rules.length > 0) {
    return rules[0];
  }
  
  if (mark >= 90) return { grade: 'O', grade_point: 10.0, result_status: 'PASS' };
  if (mark >= 80) return { grade: 'A+', grade_point: 9.0, result_status: 'PASS' };
  if (mark >= 70) return { grade: 'A', grade_point: 8.0, result_status: 'PASS' };
  if (mark >= 60) return { grade: 'B+', grade_point: 7.0, result_status: 'PASS' };
  if (mark >= 50) return { grade: 'B', grade_point: 6.0, result_status: 'PASS' };
  if (mark >= 40) return { grade: 'C', grade_point: 5.0, result_status: 'PASS' };
  return { grade: 'F', grade_point: 0.0, result_status: 'FAIL' };
};

// --- EXAM MANAGEMENT ENDPOINTS ---

// GET /api/exams/types
export const getExamTypes = async (req, res) => {
  try {
    const [types] = await pool.query('SELECT * FROM exam_types ORDER BY name ASC');
    res.json({ success: true, data: types });
  } catch (error) {
    console.error('Error fetching exam types:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exam types', error: error.message });
  }
};

// GET /api/exams
export const getExams = async (req, res) => {
  try {
    const { department_id, semester_id, status } = req.query;

    let query = `
      SELECT e.*, et.name as exam_type_name, et.code as exam_type_code,
             d.name as department_name, sem.name as semester_name, c.name as course_name,
             (SELECT COUNT(*) FROM examination_subjects WHERE examination_id = e.id) as subjects_count,
             (SELECT COUNT(*) FROM student_results WHERE semester_id = e.semester_id AND status = 'PUBLISHED') as published_results_count
      FROM examinations e
      JOIN exam_types et ON e.exam_type_id = et.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN semesters sem ON e.semester_id = sem.id
      LEFT JOIN courses c ON e.course_id = c.id
      WHERE 1=1
    `;

    const params = [];
    if (department_id && department_id !== 'all') {
      query += ` AND e.department_id = ?`;
      params.push(department_id);
    }
    if (semester_id && semester_id !== 'all') {
      query += ` AND e.semester_id = ?`;
      params.push(semester_id);
    }
    if (status && status !== 'all') {
      query += ` AND e.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY e.created_at DESC`;

    const [exams] = await pool.query(query, params);
    res.json({ success: true, data: exams });
  } catch (error) {
    console.error('Error fetching examinations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch examinations', error: error.message });
  }
};

// POST /api/exams
export const createExam = async (req, res) => {
  try {
    const { name, exam_type_id, academic_year_id, department_id, course_id, semester_id, start_date, end_date, subject_ids } = req.body;

    if (!name || !exam_type_id) {
      return res.status(400).json({ success: false, message: 'Exam name and exam type are required.' });
    }

    const [insertRes] = await pool.query(`
      INSERT INTO examinations
      (name, exam_type_id, academic_year_id, department_id, course_id, semester_id, start_date, end_date, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?)
    `, [name, exam_type_id, academic_year_id || null, department_id || null, course_id || null, semester_id || null, start_date || null, end_date || null, req.user.id]);

    const examId = insertRes.insertId;

    // Attach subjects if provided
    if (Array.isArray(subject_ids) && subject_ids.length > 0) {
      for (const subId of subject_ids) {
        await pool.query(`
          INSERT INTO examination_subjects
          (examination_id, subject_id, max_internal_marks, max_external_marks, max_total_marks, passing_marks)
          VALUES (?, ?, 40.00, 60.00, 100.00, 40.00)
          ON DUPLICATE KEY UPDATE subject_id = VALUES(subject_id)
        `, [examId, subId]);
      }
    } else if (semester_id) {
      // Auto attach subjects from Phase 2 curriculum for this semester
      const [currSubs] = await pool.query(`
        SELECT DISTINCT cs.subject_id
        FROM curriculum_subjects cs
        JOIN curriculums c ON cs.curriculum_id = c.id
        WHERE c.semester_id = ?
      `, [semester_id]);

      for (const sub of currSubs) {
        await pool.query(`
          INSERT INTO examination_subjects
          (examination_id, subject_id, max_internal_marks, max_external_marks, max_total_marks, passing_marks)
          VALUES (?, ?, 40.00, 60.00, 100.00, 40.00)
          ON DUPLICATE KEY UPDATE subject_id = VALUES(subject_id)
        `, [examId, sub.subject_id]);
      }
    }

    res.json({ success: true, message: 'Examination created successfully!', data: { exam_id: examId } });
  } catch (error) {
    console.error('Error creating examination:', error);
    res.status(500).json({ success: false, message: 'Failed to create examination', error: error.message });
  }
};

// GET /api/exams/:id/schedule
export const getExamSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const [subs] = await pool.query(`
      SELECT es.*, s.code as subject_code, s.name as subject_name, s.credits,
             c.room_number, c.building_name
      FROM examination_subjects es
      JOIN subjects s ON es.subject_id = s.id
      LEFT JOIN classrooms c ON es.room_id = c.id
      WHERE es.examination_id = ?
      ORDER BY es.exam_date ASC, es.start_time ASC
    `, [id]);

    res.json({ success: true, data: subs });
  } catch (error) {
    console.error('Error fetching exam schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exam schedule', error: error.message });
  }
};

// POST /api/exams/:id/schedule
export const saveExamSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { schedules } = req.body; // array of { subject_id, exam_date, start_time, end_time, room_id, max_internal_marks, max_external_marks }

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ success: false, message: 'Exam schedules array is required.' });
    }

    // Room Conflict Check
    for (const item of schedules) {
      if (item.room_id && item.exam_date && item.start_time && item.end_time) {
        const [conflicts] = await pool.query(`
          SELECT es.id, s.name as subject_name
          FROM examination_subjects es
          JOIN subjects s ON es.subject_id = s.id
          WHERE es.room_id = ? AND es.exam_date = ?
            AND es.examination_id != ?
            AND ((es.start_time <= ? AND es.end_time > ?) OR (es.start_time < ? AND es.end_time >= ?))
        `, [item.room_id, item.exam_date, id, item.start_time, item.start_time, item.end_time, item.end_time]);

        if (conflicts.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Room Conflict Error: Selected room is already assigned to subject '${conflicts[0].subject_name}' on ${item.exam_date} during that time slot.`
          });
        }
      }
    }

    for (const item of schedules) {
      const maxInt = parseFloat(item.max_internal_marks) || 40.0;
      const maxExt = parseFloat(item.max_external_marks) || 60.0;
      const maxTot = maxInt + maxExt;

      await pool.query(`
        INSERT INTO examination_subjects
        (examination_id, subject_id, max_internal_marks, max_external_marks, max_total_marks, passing_marks, exam_date, start_time, end_time, room_id)
        VALUES (?, ?, ?, ?, ?, 40.00, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          max_internal_marks = VALUES(max_internal_marks),
          max_external_marks = VALUES(max_external_marks),
          max_total_marks = VALUES(max_total_marks),
          exam_date = VALUES(exam_date),
          start_time = VALUES(start_time),
          end_time = VALUES(end_time),
          room_id = VALUES(room_id)
      `, [id, item.subject_id, maxInt, maxExt, maxTot, item.exam_date || null, item.start_time || null, item.end_time || null, item.room_id || null]);
    }

    // Update examination status to SCHEDULED
    await pool.query("UPDATE examinations SET status = 'SCHEDULED' WHERE id = ?", [id]);

    res.json({ success: true, message: 'Exam schedule updated successfully with zero room conflicts!' });
  } catch (error) {
    console.error('Error saving exam schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to save exam schedule', error: error.message });
  }
};

// GET /api/exams/:id/eligibility
export const calculateExamEligibility = async (req, res) => {
  try {
    const { id } = req.params;

    const [exams] = await pool.query('SELECT * FROM examinations WHERE id = ?', [id]);
    if (exams.length === 0) {
      return res.status(404).json({ success: false, message: 'Examination record not found' });
    }
    const exam = exams[0];

    // Fetch subjects for this exam
    const [examSubs] = await pool.query('SELECT subject_id FROM examination_subjects WHERE examination_id = ?', [id]);

    // For each registered Phase 4 student in this semester/department, calculate attendance percentage from Phase 6
    const [students] = await pool.query(`
      SELECT DISTINCT st.id as student_id, st.roll_number, st.admission_number, st.first_name, st.last_name,
             sec.name as section_name, d.name as department_name
      FROM students st
      JOIN student_subject_registrations ssr ON st.id = ssr.student_id
      LEFT JOIN sections sec ON st.section_id = sec.id
      LEFT JOIN departments d ON st.department_id = d.id
      WHERE ssr.status = 'REGISTERED'
        ${exam.semester_id ? 'AND st.semester = ' + pool.escape(exam.semester_id) : ''}
        ${exam.department_id ? 'AND st.department_id = ' + pool.escape(exam.department_id) : ''}
    `);

    const eligibilityList = [];
    for (const st of students) {
      for (const es of examSubs) {
        // Compute attendance % for this student & subject from Phase 6 attendance_sessions
        const [attCounts] = await pool.query(`
          SELECT 
            COUNT(DISTINCT ats.id) as total_sessions,
            SUM(CASE WHEN ar.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count
          FROM attendance_sessions ats
          LEFT JOIN attendance_records ar ON (ar.attendance_session_id = ats.id AND ar.student_id = ?)
          WHERE ats.subject_id = ? AND ats.status IN ('SUBMITTED', 'LOCKED')
        `, [st.student_id, es.subject_id]);

        const total = parseInt(attCounts[0]?.total_sessions) || 0;
        const present = parseInt(attCounts[0]?.present_count) || 0;
        const attPct = total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 100.0;
        const isEligible = attPct >= 75.0 ? 1 : 0;

        // Upsert into exam_eligibility table
        await pool.query(`
          INSERT INTO exam_eligibility (examination_id, student_id, subject_id, attendance_percentage, is_eligible)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE attendance_percentage = VALUES(attendance_percentage), is_eligible = IF(override_reason IS NULL, VALUES(is_eligible), is_eligible)
        `, [id, st.student_id, es.subject_id, attPct, isEligible]);

        eligibilityList.push({
          ...st,
          subject_id: es.subject_id,
          attendance_percentage: attPct,
          is_eligible: isEligible
        });
      }
    }

    res.json({
      success: true,
      message: `Calculated exam eligibility for ${students.length} students.`,
      count: eligibilityList.length,
      data: eligibilityList
    });
  } catch (error) {
    console.error('Error calculating exam eligibility:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate eligibility', error: error.message });
  }
};

// POST /api/exams/:id/eligibility/override
export const overrideEligibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id, subject_id, is_eligible, reason } = req.body;

    if (!student_id || !subject_id || !reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Student ID, Subject ID, and Mandatory Audit Reason are required.' });
    }

    await pool.query(`
      INSERT INTO exam_eligibility (examination_id, student_id, subject_id, is_eligible, override_reason, overridden_by)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        is_eligible = VALUES(is_eligible),
        override_reason = VALUES(override_reason),
        overridden_by = VALUES(overridden_by)
    `, [id, student_id, subject_id, is_eligible ? 1 : 0, reason.trim(), req.user.id]);

    res.json({ success: true, message: `Exam eligibility override saved with audit record.` });
  } catch (error) {
    console.error('Error overriding exam eligibility:', error);
    res.status(500).json({ success: false, message: 'Failed to override eligibility', error: error.message });
  }
};

// --- FACULTY MARKS ENTRY ENDPOINTS ---

// GET /api/faculty/marks-entry
export const getFacultyMarksEntry = async (req, res) => {
  try {
    const { examination_id, subject_id } = req.query;
    const facultyId = await resolveFacultyId(req.user.id);

    if (!examination_id || !subject_id) {
      return res.status(400).json({ success: false, message: 'examination_id and subject_id query parameters are required.' });
    }

    // Security Check: Verify that logged-in faculty is assigned to this subject (unless Admin)
    if (req.user.role !== 'Admin' && facultyId) {
      const [allocations] = await pool.query('SELECT id FROM subject_allocations WHERE faculty_id = ? AND subject_id = ? AND status = "Active"', [facultyId, subject_id]);
      if (allocations.length === 0) {
        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to evaluate marks for this subject.' });
      }
    }

    // Fetch max marks configuration
    const [subConfigs] = await pool.query(`
      SELECT es.*, s.code as subject_code, s.name as subject_name
      FROM examination_subjects es
      JOIN subjects s ON es.subject_id = s.id
      WHERE es.examination_id = ? AND es.subject_id = ?
    `, [examination_id, subject_id]);

    if (subConfigs.length === 0) {
      return res.status(404).json({ success: false, message: 'Examination subject configuration not found.' });
    }
    const config = subConfigs[0];

    // Fetch registered students and any draft/submitted marks
    const [students] = await pool.query(`
      SELECT DISTINCT st.id as student_id, st.roll_number, st.admission_number, st.first_name, st.last_name,
             COALESCE(sm.internal_marks, 0.00) as internal_marks,
             COALESCE(sm.external_marks, 0.00) as external_marks,
             COALESCE(sm.total_marks, 0.00) as total_marks,
             sm.grade, sm.status as mark_status, sm.id as mark_id
      FROM student_subject_registrations ssr
      JOIN students st ON ssr.student_id = st.id
      LEFT JOIN student_marks sm ON (sm.examination_id = ? AND sm.subject_id = ? AND sm.student_id = st.id)
      WHERE ssr.subject_id = ? AND ssr.status = 'REGISTERED'
      ORDER BY st.roll_number ASC, st.first_name ASC
    `, [examination_id, subject_id, subject_id]);

    res.json({
      success: true,
      config,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error fetching faculty marks entry:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch marks entry roster', error: error.message });
  }
};

// POST /api/faculty/marks/submit
export const submitFacultyMarks = async (req, res) => {
  try {
    const { examination_id, subject_id, marks } = req.body;
    const facultyId = await resolveFacultyId(req.user.id);

    if (!examination_id || !subject_id || !Array.isArray(marks)) {
      return res.status(400).json({ success: false, message: 'examination_id, subject_id, and marks array are required.' });
    }

    // Fetch max marks configuration
    const [subConfigs] = await pool.query('SELECT * FROM examination_subjects WHERE examination_id = ? AND subject_id = ?', [examination_id, subject_id]);
    if (subConfigs.length === 0) {
      return res.status(404).json({ success: false, message: 'Examination subject parameters not found.' });
    }
    const maxInt = parseFloat(subConfigs[0].max_internal_marks) || 40.0;
    const maxExt = parseFloat(subConfigs[0].max_external_marks) || 60.0;
    const passMarks = parseFloat(subConfigs[0].passing_marks) || 40.0;

    // Validate each student mark entry against max limits
    for (const item of marks) {
      const intVal = parseFloat(item.internal_marks) || 0;
      const extVal = parseFloat(item.external_marks) || 0;

      if (intVal < 0 || intVal > maxInt) {
        return res.status(400).json({ success: false, message: `Validation Error: Internal marks (${intVal}) cannot exceed maximum allowed (${maxInt}).` });
      }
      if (extVal < 0 || extVal > maxExt) {
        return res.status(400).json({ success: false, message: `Validation Error: External marks (${extVal}) cannot exceed maximum allowed (${maxExt}).` });
      }
    }

    // Save marks and calculate Grade / Result Status
    for (const item of marks) {
      const intVal = parseFloat(item.internal_marks) || 0;
      const extVal = parseFloat(item.external_marks) || 0;
      const totVal = intVal + extVal;

      const gradeInfo = await calculateGradeAndPoint(totVal);
      const resStatus = totVal >= passMarks ? 'PASS' : 'FAIL';

      await pool.query(`
        INSERT INTO student_marks
        (examination_id, subject_id, student_id, internal_marks, external_marks, total_marks, grade, grade_point, status, result_status, evaluated_by, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, ?, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
          internal_marks = VALUES(internal_marks),
          external_marks = VALUES(external_marks),
          total_marks = VALUES(total_marks),
          grade = VALUES(grade),
          grade_point = VALUES(grade_point),
          status = 'SUBMITTED',
          result_status = VALUES(result_status),
          evaluated_by = VALUES(evaluated_by),
          submitted_at = CURRENT_TIMESTAMP
      `, [examination_id, subject_id, item.student_id, intVal, extVal, totVal, gradeInfo.grade, gradeInfo.grade_point, resStatus, req.user.id]);
    }

    res.json({ success: true, message: `Marks submitted successfully for ${marks.length} students!` });
  } catch (error) {
    console.error('Error submitting faculty marks:', error);
    res.status(500).json({ success: false, message: 'Failed to submit marks', error: error.message });
  }
};

// --- RESULT CALCULATION & PUBLISHING ENDPOINTS ---

// POST /api/exams/:id/calculate-results
export const calculateExamResults = async (req, res) => {
  try {
    const { id } = req.params;

    const [exams] = await pool.query('SELECT * FROM examinations WHERE id = ?', [id]);
    if (exams.length === 0) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }
    const exam = exams[0];

    // Fetch distinct students with marks submitted for this exam
    const [students] = await pool.query('SELECT DISTINCT student_id FROM student_marks WHERE examination_id = ?', [id]);

    for (const st of students) {
      const studentId = st.student_id;

      // Fetch all marks for this student in this examination joined with subject credits from curriculum
      const [marks] = await pool.query(`
        SELECT sm.*, COALESCE(s.credits, 3) as credits
        FROM student_marks sm
        JOIN subjects s ON sm.subject_id = s.id
        WHERE sm.examination_id = ? AND sm.student_id = ?
      `, [id, studentId]);

      let totalCredits = 0;
      let weightedPointsSum = 0;
      let backlogsCount = 0;
      let hasFailed = false;

      for (const m of marks) {
        const credits = parseInt(m.credits) || 3;
        const gradePoint = parseFloat(m.grade_point) || 0.0;

        totalCredits += credits;
        weightedPointsSum += credits * gradePoint;

        if (m.result_status === 'FAIL' || gradePoint === 0) {
          hasFailed = true;
          backlogsCount++;

          // Upsert active backlog entry
          await pool.query(`
            INSERT INTO backlogs (student_id, subject_id, original_exam_id, status)
            VALUES (?, ?, ?, 'ACTIVE')
            ON DUPLICATE KEY UPDATE status = 'ACTIVE'
          `, [studentId, m.subject_id, id]);
        } else {
          // If student previously had an active backlog for this subject, mark it CLEARED
          await pool.query(`
            UPDATE backlogs
            SET status = 'CLEARED', cleared_exam_id = ?, cleared_at = CURRENT_TIMESTAMP
            WHERE student_id = ? AND subject_id = ? AND status = 'ACTIVE'
          `, [id, studentId, m.subject_id]);
        }
      }

      const sgpa = totalCredits > 0 ? parseFloat((weightedPointsSum / totalCredits).toFixed(2)) : 0.00;

      // Calculate CGPA across all completed semesters for this student
      const [prevSemResults] = await pool.query(`
        SELECT sgpa, total_credits_earned
        FROM student_results
        WHERE student_id = ? AND semester_id != ? AND status = 'PUBLISHED'
      `, [studentId, exam.semester_id || 1]);

      let cgpaSum = weightedPointsSum;
      let totalCgpaCredits = totalCredits;

      for (const prev of prevSemResults) {
        const pCreds = parseInt(prev.total_credits_earned) || 0;
        const pSgpa = parseFloat(prev.sgpa) || 0;
        cgpaSum += pCreds * pSgpa;
        totalCgpaCredits += pCreds;
      }

      const cgpa = totalCgpaCredits > 0 ? parseFloat((cgpaSum / totalCgpaCredits).toFixed(2)) : sgpa;
      const overallStatus = hasFailed ? 'FAIL' : 'PASS';

      // Save into student_results table
      await pool.query(`
        INSERT INTO student_results
        (student_id, semester_id, academic_year_id, sgpa, cgpa, total_credits_earned, backlogs_count, overall_status, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')
        ON DUPLICATE KEY UPDATE
          sgpa = VALUES(sgpa),
          cgpa = VALUES(cgpa),
          total_credits_earned = VALUES(total_credits_earned),
          backlogs_count = VALUES(backlogs_count),
          overall_status = VALUES(overall_status)
      `, [studentId, exam.semester_id || 1, exam.academic_year_id || 1, sgpa, cgpa, totalCredits, backlogsCount, overallStatus]);
    }

    res.json({
      success: true,
      message: `Calculated SGPA, CGPA, and Backlogs for ${students.length} students.`
    });
  } catch (error) {
    console.error('Error calculating exam results:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate exam results', error: error.message });
  }
};

// POST /api/exams/:id/publish
export const publishExamResults = async (req, res) => {
  try {
    const { id } = req.params;

    const [exams] = await pool.query('SELECT semester_id FROM examinations WHERE id = ?', [id]);
    if (exams.length === 0) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }
    const semesterId = exams[0].semester_id;

    // Update examination status to PUBLISHED
    await pool.query("UPDATE examinations SET status = 'PUBLISHED', published_at = CURRENT_TIMESTAMP, published_by = ? WHERE id = ?", [req.user.id, id]);

    // Update marks status to PUBLISHED
    await pool.query("UPDATE student_marks SET status = 'PUBLISHED' WHERE examination_id = ?", [id]);

    // Update student_results status to PUBLISHED
    if (semesterId) {
      await pool.query("UPDATE student_results SET status = 'PUBLISHED', published_at = CURRENT_TIMESTAMP WHERE semester_id = ?", [semesterId]);
    }

    res.json({ success: true, message: 'Examination results published successfully! Students can now view their official marksheets.' });
  } catch (error) {
    console.error('Error publishing exam results:', error);
    res.status(500).json({ success: false, message: 'Failed to publish exam results', error: error.message });
  }
};

// --- STUDENT PORTAL ENDPOINTS ---

// GET /api/student/my-results
export const getStudentResults = async (req, res) => {
  try {
    const studentId = await resolveStudentId(req.user.id);
    if (!studentId) {
      return res.status(404).json({ success: false, message: 'Student profile record not found' });
    }

    // Fetch published student results summary
    const [results] = await pool.query(`
      SELECT sr.*, sem.name as semester_name
      FROM student_results sr
      JOIN semesters sem ON sr.semester_id = sem.id
      WHERE sr.student_id = ? AND sr.status = 'PUBLISHED'
      ORDER BY sem.id DESC
    `, [studentId]);

    // Fetch published marks list
    const [publishedMarks] = await pool.query(`
      SELECT sm.*, s.code as subject_code, s.name as subject_name, s.credits,
             e.name as exam_name
      FROM student_marks sm
      JOIN subjects s ON sm.subject_id = s.id
      JOIN examinations e ON sm.examination_id = e.id
      WHERE sm.student_id = ? AND sm.status = 'PUBLISHED'
      ORDER BY s.code ASC
    `, [studentId]);

    // Fetch active backlogs
    const [activeBacklogs] = await pool.query(`
      SELECT b.*, s.code as subject_code, s.name as subject_name
      FROM backlogs b
      JOIN subjects s ON b.subject_id = s.id
      WHERE b.student_id = ? AND b.status = 'ACTIVE'
    `, [studentId]);

    const latest = results[0] || {};

    res.json({
      success: true,
      cgpa: latest.cgpa || 0.00,
      latest_sgpa: latest.sgpa || 0.00,
      total_credits_earned: latest.total_credits_earned || 0,
      backlogs_count: activeBacklogs.length,
      overall_status: latest.overall_status || 'PASS',
      results_by_semester: results,
      marks: publishedMarks,
      backlogs: activeBacklogs
    });
  } catch (error) {
    console.error('Error fetching student results:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student results', error: error.message });
  }
};

// GET /api/student/official-marksheet
export const getOfficialMarksheet = async (req, res) => {
  try {
    const studentId = await resolveStudentId(req.user.id);
    if (!studentId) {
      return res.status(404).json({ success: false, message: 'Student profile record not found' });
    }

    // Fetch student profile details
    const [students] = await pool.query(`
      SELECT st.*, d.name as department_name, c.name as course_name, sec.name as section_name
      FROM students st
      LEFT JOIN departments d ON st.department_id = d.id
      LEFT JOIN courses c ON d.id = c.department_id
      LEFT JOIN sections sec ON st.section_id = sec.id
      WHERE st.id = ?
    `, [studentId]);

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    const student = students[0];

    // Fetch published marks
    const [marks] = await pool.query(`
      SELECT sm.*, s.code as subject_code, s.name as subject_name, s.credits
      FROM student_marks sm
      JOIN subjects s ON sm.subject_id = s.id
      WHERE sm.student_id = ? AND sm.status = 'PUBLISHED'
      ORDER BY s.code ASC
    `, [studentId]);

    // Fetch results summary
    const [results] = await pool.query('SELECT * FROM student_results WHERE student_id = ? AND status = "PUBLISHED" ORDER BY semester_id DESC LIMIT 1', [studentId]);

    res.json({
      success: true,
      student,
      results_summary: results[0] || {},
      marks
    });
  } catch (error) {
    console.error('Error fetching official marksheet:', error);
    res.status(500).json({ success: false, message: 'Failed to generate official marksheet', error: error.message });
  }
};

// POST /api/revaluation
export const submitRevaluationRequest = async (req, res) => {
  try {
    const { mark_id, reason } = req.body;
    const studentId = await resolveStudentId(req.user.id);

    if (!mark_id || !reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Mark ID and Revaluation Reason are required.' });
    }

    const [marks] = await pool.query('SELECT * FROM student_marks WHERE id = ?', [mark_id]);
    if (marks.length === 0) {
      return res.status(404).json({ success: false, message: 'Mark record not found.' });
    }

    await pool.query(`
      INSERT INTO revaluation_requests (mark_id, student_id, reason, old_marks, status)
      VALUES (?, ?, ?, ?, 'PENDING')
    `, [mark_id, studentId, reason.trim(), marks[0].total_marks]);

    res.json({ success: true, message: 'Revaluation request submitted successfully. Awaiting examination committee review.' });
  } catch (error) {
    console.error('Error submitting revaluation request:', error);
    res.status(500).json({ success: false, message: 'Failed to submit revaluation request', error: error.message });
  }
};

// POST /api/admin/revaluations/review
export const reviewRevaluation = async (req, res) => {
  try {
    const { revaluation_id, decision, new_marks, decision_notes } = req.body;

    if (!revaluation_id || !decision) {
      return res.status(400).json({ success: false, message: 'Revaluation ID and Decision are required.' });
    }

    const [reqs] = await pool.query('SELECT * FROM revaluation_requests WHERE id = ?', [revaluation_id]);
    if (reqs.length === 0) {
      return res.status(404).json({ success: false, message: 'Revaluation request not found' });
    }

    const revReq = reqs[0];

    if (decision === 'APPROVED' && new_marks !== undefined) {
      const totVal = parseFloat(new_marks);
      const gradeInfo = await calculateGradeAndPoint(totVal);

      // Update student_marks
      await pool.query(`
        UPDATE student_marks
        SET total_marks = ?, grade = ?, grade_point = ?
        WHERE id = ?
      `, [totVal, gradeInfo.grade, gradeInfo.grade_point, revReq.mark_id]);

      await pool.query(`
        UPDATE revaluation_requests
        SET status = 'APPROVED', new_marks = ?, reviewed_by = ?, decision_notes = ?
        WHERE id = ?
      `, [totVal, req.user.id, decision_notes || null, revaluation_id]);
    } else {
      await pool.query(`
        UPDATE revaluation_requests
        SET status = 'REJECTED', reviewed_by = ?, decision_notes = ?
        WHERE id = ?
      `, [req.user.id, decision_notes || null, revaluation_id]);
    }

    res.json({ success: true, message: `Revaluation request reviewed and decision recorded.` });
  } catch (error) {
    console.error('Error reviewing revaluation:', error);
    res.status(500).json({ success: false, message: 'Failed to review revaluation', error: error.message });
  }
};
