import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { calculateGrade, calculateSGPA, calculateCGPA } from '../utils/gradeCalculator.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Normalizes header keys (e.g., "Roll Number", "roll_number", "RollNo" -> "roll_number")
 */
function normalizeRow(row) {
  const normalized = {};
  for (const [key, val] of Object.entries(row)) {
    if (!key) continue;
    const cleanKey = key.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    normalized[cleanKey] = val !== undefined && val !== null ? val.toString().trim() : '';
  }
  return normalized;
}

/**
 * Helper to ensure department, academic_year, course, semester and section records exist
 */
async function ensureAcademicHierarchy(conn, deptName = 'Computer Science', semNumber = 1) {
  // 1. Ensure Department
  let [deptRows] = await conn.query('SELECT id FROM departments WHERE LOWER(name) = ? OR LOWER(code) = ?', [deptName.toLowerCase(), deptName.toLowerCase()]);
  let deptId;
  if (deptRows.length > 0) {
    deptId = deptRows[0].id;
  } else {
    const code = deptName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 5) || 'CSE';
    const [newDept] = await conn.query('INSERT INTO departments (name, code) VALUES (?, ?)', [deptName, code]);
    deptId = newDept.insertId;
  }

  // 2. Ensure Academic Year
  let [ayRows] = await conn.query('SELECT id FROM academic_years LIMIT 1');
  let ayId;
  if (ayRows.length > 0) {
    ayId = ayRows[0].id;
  } else {
    const [newAy] = await conn.query('INSERT INTO academic_years (name, year_level) VALUES ("2023-2024", 1)');
    ayId = newAy.insertId;
  }

  // 3. Ensure Course
  let [courseRows] = await conn.query('SELECT id FROM courses WHERE department_id = ? LIMIT 1', [deptId]);
  let courseId;
  if (courseRows.length > 0) {
    courseId = courseRows[0].id;
  } else {
    const [newCourse] = await conn.query('INSERT INTO courses (name, department_id, duration_years) VALUES (?, ?, 4)', ['Bachelor of Technology', deptId]);
    courseId = newCourse.insertId;
  }

  // 4. Ensure Semester
  let [semRows] = await conn.query('SELECT id FROM semesters WHERE semester_number = ? LIMIT 1', [semNumber]);
  let semId;
  if (semRows.length > 0) {
    semId = semRows[0].id;
  } else {
    const [newSem] = await conn.query('INSERT INTO semesters (name, semester_number, academic_year_id) VALUES (?, ?, ?)', [`Semester ${semNumber}`, semNumber, ayId]);
    semId = newSem.insertId;
  }

  return { deptId, ayId, courseId, semId };
}

async function ensureSection(conn, sectionName, deptId, courseId, ayId, semId) {
  let [secRows] = await conn.query('SELECT id FROM sections WHERE LOWER(name) = ? AND department_id = ? AND semester_id = ?', [sectionName.toLowerCase(), deptId, semId]);
  if (secRows.length > 0) return secRows[0].id;

  let [secRows2] = await conn.query('SELECT id FROM sections WHERE LOWER(name) = ? AND department_id = ?', [sectionName.toLowerCase(), deptId]);
  if (secRows2.length > 0) return secRows2[0].id;

  let [secRows3] = await conn.query('SELECT id FROM sections WHERE LOWER(name) = ?', [sectionName.toLowerCase()]);
  if (secRows3.length > 0) return secRows3[0].id;

  const [newSec] = await conn.query(
    'INSERT INTO sections (name, department_id, course_id, academic_year_id, semester_id, capacity) VALUES (?, ?, ?, ?, ?, 60)',
    [sectionName.toUpperCase(), deptId, courseId, ayId, semId]
  );
  return newSec.insertId;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. BULK IMPORT STUDENTS & USER LOGINS
// ─────────────────────────────────────────────────────────────────────────────
export async function importStudents(req, res) {
  if (!req.file || !req.file.buffer) {
    return errorResponse(res, 'No Excel file uploaded. Please upload a .xlsx or .csv file.', [], 400);
  }

  const conn = await pool.getConnection();
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (rawData.length === 0) {
      return errorResponse(res, 'The uploaded Excel sheet is empty.', [], 400);
    }

    // 1. Resolve Student Role ID
    const [roleRows] = await conn.query('SELECT id FROM roles WHERE LOWER(name) = "student"');
    let studentRoleId = roleRows[0]?.id;
    if (!studentRoleId) {
      const [newRole] = await conn.query('INSERT INTO roles (name) VALUES ("Student")');
      studentRoleId = newRole.insertId;
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors = [];

    await conn.beginTransaction();

    for (let i = 0; i < rawData.length; i++) {
      const row = normalizeRow(rawData[i]);
      const rowNum = i + 2;

      const rollNumber = row.roll_number || row.roll_no || row.rollno || row.admission_number || row.student_id || row.id;
      const fullName = row.full_name || row.name || row.student_name || '';
      const email = (row.email || row.email_address || `${rollNumber?.toLowerCase()}@collegeerp.com`).toLowerCase().trim();
      const rawPassword = row.password || row.default_password || 'Student@123';
      const deptName = row.department || row.dept || row.branch || 'Computer Science';
      const semester = parseInt(row.semester || row.sem || '1', 10) || 1;
      const sectionName = row.section || row.sec || 'A';

      if (!rollNumber) {
        errors.push(`Row ${rowNum}: Missing Roll Number`);
        skippedCount++;
        continue;
      }

      // Ensure full academic chain exists
      const { deptId, ayId, courseId, semId } = await ensureAcademicHierarchy(conn, deptName, semester);
      const sectionId = await ensureSection(conn, sectionName, deptId, courseId, ayId, semId);

      // Check if user already exists
      const [existingUsers] = await conn.query(
        'SELECT id, username, email FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?',
        [email, rollNumber.toLowerCase()]
      );

      let userId = null;
      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
        await conn.query(
          'UPDATE users SET full_name = COALESCE(NULLIF(?, ""), full_name), status = "active" WHERE id = ?',
          [fullName, userId]
        );
        updatedCount++;
      } else {
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const [newUser] = await conn.query(
          'INSERT INTO users (username, full_name, email, password, role_id, status) VALUES (?, ?, ?, ?, ?, "active")',
          [rollNumber.toLowerCase(), fullName || rollNumber, email, hashedPassword, studentRoleId]
        );
        userId = newUser.insertId;
        insertedCount++;
      }

      // Split name into first and last name
      const nameParts = (fullName || rollNumber).split(' ');
      const firstName = nameParts[0] || rollNumber;
      const lastName = nameParts.slice(1).join(' ') || '';

      // Update / Insert into students table
      const [existingStudent] = await conn.query('SELECT id FROM students WHERE user_id = ? OR admission_number = ?', [userId, rollNumber]);
      if (existingStudent.length > 0) {
        await conn.query(
          `UPDATE students 
           SET first_name = ?, last_name = ?, section_id = ?, academic_year_id = ?
           WHERE id = ?`,
          [firstName, lastName, sectionId, ayId, existingStudent[0].id]
        );
      } else {
        await conn.query(
          `INSERT INTO students (user_id, admission_number, first_name, last_name, section_id, academic_year_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, rollNumber, firstName, lastName, sectionId, ayId]
        );
      }
    }

    await conn.commit();

    return successResponse(res, `Bulk student import complete: ${insertedCount} created, ${updatedCount} updated.`, {
      totalRows: rawData.length,
      insertedCount,
      updatedCount,
      skippedCount,
      errors
    });
  } catch (error) {
    await conn.rollback();
    console.error('[BULK IMPORT STUDENTS ERROR]:', error);
    return errorResponse(res, 'Failed to process Excel file: ' + error.message, [error.message], 500);
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. BULK IMPORT ATTENDANCE MATRIX & REAL-TIME SYNC
// ─────────────────────────────────────────────────────────────────────────────
export async function importAttendance(req, res) {
  if (!req.file || !req.file.buffer) {
    return errorResponse(res, 'No Excel file uploaded for attendance.', [], 400);
  }

  const conn = await pool.getConnection();
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (rawData.length === 0) {
      return errorResponse(res, 'The uploaded attendance sheet is empty.', [], 400);
    }

    await conn.beginTransaction();

    let markedCount = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    const errors = [];

    // Cache students and sections for fast lookups
    const [allStudents] = await conn.query('SELECT id, user_id, admission_number FROM students');
    const studentMap = new Map();
    allStudents.forEach(s => {
      if (s.admission_number) studentMap.set(s.admission_number.toLowerCase().trim(), s.id);
    });

    const [allSections] = await conn.query('SELECT id, name FROM sections');
    const sectionMap = new Map();
    allSections.forEach(sec => {
      sectionMap.set(sec.name.toLowerCase().trim(), sec.id);
    });

    const [allSubjects] = await conn.query('SELECT id, name, code FROM subjects');
    const subjectMap = new Map();
    allSubjects.forEach(sub => {
      if (sub.code) subjectMap.set(sub.code.toLowerCase().trim(), sub.id);
      if (sub.name) subjectMap.set(sub.name.toLowerCase().trim(), sub.id);
    });

    const attendanceHeaderMap = new Map();

    for (let i = 0; i < rawData.length; i++) {
      const row = normalizeRow(rawData[i]);
      const rowNum = i + 2;

      const dateRaw = row.date || row.attendance_date || new Date().toISOString().split('T')[0];
      const rollNumber = row.roll_number || row.roll_no || row.student_id || row.admission_number;
      const sectionName = (row.section || row.sec || 'A').toLowerCase();
      const subjectIdentifier = (row.subject_code || row.subject || row.subject_name || '').toLowerCase();
      const rawStatus = (row.status || row.attendance || 'P').toLowerCase();

      if (!rollNumber) {
        errors.push(`Row ${rowNum}: Missing student roll number`);
        continue;
      }

      const studentId = studentMap.get(rollNumber.toLowerCase());
      if (!studentId) {
        errors.push(`Row ${rowNum}: Student with Roll Number "${rollNumber}" not found in database`);
        continue;
      }

      // Parse Date
      let formattedDate = dateRaw;
      if (!isNaN(dateRaw) && Number(dateRaw) > 30000) {
        const jsDate = new Date((Number(dateRaw) - (25567 + 2)) * 86400 * 1000);
        formattedDate = jsDate.toISOString().split('T')[0];
      } else {
        const parsed = new Date(dateRaw);
        if (!isNaN(parsed.getTime())) {
          formattedDate = parsed.toISOString().split('T')[0];
        }
      }

      // Resolve Section ID
      let sectionId = sectionMap.get(sectionName);
      if (!sectionId) {
        const { deptId, ayId, courseId, semId } = await ensureAcademicHierarchy(conn, 'Computer Science', 1);
        sectionId = await ensureSection(conn, sectionName, deptId, courseId, ayId, semId);
        sectionMap.set(sectionName, sectionId);
      }

      // Resolve Subject ID
      let subjectId = subjectIdentifier ? subjectMap.get(subjectIdentifier) : null;
      if (subjectIdentifier && !subjectId) {
        const { deptId, semId } = await ensureAcademicHierarchy(conn, 'Computer Science', 1);
        const [newSub] = await conn.query(
          'INSERT INTO subjects (name, code, department_id, semester_id, credits) VALUES (?, ?, ?, ?, 3)',
          [subjectIdentifier.toUpperCase(), subjectIdentifier.toUpperCase(), deptId, semId]
        );
        subjectId = newSub.insertId;
        subjectMap.set(subjectIdentifier, subjectId);
      }

      // Header lookup / creation
      const headerKey = `${formattedDate}_${sectionId}_${subjectId || 0}`;
      let attendanceId = attendanceHeaderMap.get(headerKey);

      if (!attendanceId) {
        const [existingHeader] = await conn.query(
          'SELECT id FROM attendance WHERE date = ? AND section_id = ? AND (subject_id = ? OR (subject_id IS NULL AND ? IS NULL))',
          [formattedDate, sectionId, subjectId, subjectId]
        );
        if (existingHeader.length > 0) {
          attendanceId = existingHeader[0].id;
        } else {
          const [newHeader] = await conn.query(
            'INSERT INTO attendance (date, section_id, subject_id) VALUES (?, ?, ?)',
            [formattedDate, sectionId, subjectId]
          );
          attendanceId = newHeader.insertId;
        }
        attendanceHeaderMap.set(headerKey, attendanceId);
      }

      // Map status
      let statusEnum = 'present';
      if (rawStatus.startsWith('a') || rawStatus === 'absent' || rawStatus === '0') {
        statusEnum = 'absent';
        absentCount++;
      } else if (rawStatus.startsWith('l') || rawStatus === 'late') {
        statusEnum = 'late';
        lateCount++;
      } else if (rawStatus.startsWith('e') || rawStatus === 'excused') {
        statusEnum = 'excused';
        presentCount++;
      } else {
        statusEnum = 'present';
        presentCount++;
      }

      // Insert or update attendance details
      await conn.query(
        `INSERT INTO attendance_details (attendance_id, student_id, status)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status)`,
        [attendanceId, studentId, statusEnum]
      );
      markedCount++;
    }

    await conn.commit();

    const totalMarked = presentCount + absentCount + lateCount;
    const overallRate = totalMarked > 0 ? Number(((presentCount / totalMarked) * 100).toFixed(1)) : 0;

    return successResponse(res, `Bulk attendance recorded: ${markedCount} records synchronized!`, {
      markedCount,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate: `${overallRate}%`,
      errors
    });
  } catch (error) {
    await conn.rollback();
    console.error('[BULK ATTENDANCE ERROR]:', error);
    return errorResponse(res, 'Failed to import attendance: ' + error.message, [error.message], 500);
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BULK IMPORT EXAM MARKS & AUTO-GRADE CALCULATION
// ─────────────────────────────────────────────────────────────────────────────
export async function importMarks(req, res) {
  if (!req.file || !req.file.buffer) {
    return errorResponse(res, 'No Excel file uploaded for marks.', [], 400);
  }

  const conn = await pool.getConnection();
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (rawData.length === 0) {
      return errorResponse(res, 'The uploaded marks sheet is empty.', [], 400);
    }

    await conn.beginTransaction();

    let processedCount = 0;
    const gradeDistribution = { O: 0, 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, P: 0, F: 0 };
    const errors = [];

    // Cache students, subjects, exams
    const [allStudents] = await conn.query('SELECT id, admission_number FROM students');
    const studentMap = new Map();
    allStudents.forEach(s => {
      if (s.admission_number) studentMap.set(s.admission_number.toLowerCase().trim(), s.id);
    });

    const [allSubjects] = await conn.query('SELECT id, name, code FROM subjects');
    const subjectMap = new Map();
    allSubjects.forEach(sub => {
      if (sub.code) subjectMap.set(sub.code.toLowerCase().trim(), sub.id);
      if (sub.name) subjectMap.set(sub.name.toLowerCase().trim(), sub.id);
    });

    const examMap = new Map();
    const [allExams] = await conn.query('SELECT id, name FROM exams');
    allExams.forEach(e => examMap.set(e.name.toLowerCase().trim(), e.id));

    for (let i = 0; i < rawData.length; i++) {
      const row = normalizeRow(rawData[i]);
      const rowNum = i + 2;

      const rollNumber = row.roll_number || row.roll_no || row.student_id || row.admission_number;
      const subjectCode = (row.subject_code || row.subject || row.code || 'SUB101').trim();
      const examName = (row.exam_name || row.exam || 'Semester Examination').trim();
      const marksObtained = parseFloat(row.marks_obtained || row.marks || row.score || '0');
      const maxMarks = parseFloat(row.max_marks || row.total_marks || '100');

      if (!rollNumber) {
        errors.push(`Row ${rowNum}: Missing roll number`);
        continue;
      }

      const studentId = studentMap.get(rollNumber.toLowerCase());
      if (!studentId) {
        errors.push(`Row ${rowNum}: Student Roll Number "${rollNumber}" not found`);
        continue;
      }

      // Resolve Subject
      let subjectId = subjectMap.get(subjectCode.toLowerCase());
      if (!subjectId) {
        const { deptId, semId } = await ensureAcademicHierarchy(conn, 'Computer Science', 1);
        const [newSub] = await conn.query(
          'INSERT INTO subjects (name, code, department_id, semester_id, credits) VALUES (?, ?, ?, ?, 3)',
          [subjectCode, subjectCode, deptId, semId]
        );
        subjectId = newSub.insertId;
        subjectMap.set(subjectCode.toLowerCase(), subjectId);
      }

      // Resolve Exam
      let examId = examMap.get(examName.toLowerCase());
      if (!examId) {
        const { ayId } = await ensureAcademicHierarchy(conn, 'Computer Science', 1);
        const [newExam] = await conn.query('INSERT INTO exams (name, academic_year_id) VALUES (?, ?)', [examName, ayId]);
        examId = newExam.insertId;
        examMap.set(examName.toLowerCase(), examId);
      }

      // Calculate UGC/AICTE Grade
      const gradeResult = calculateGrade(marksObtained, maxMarks);
      if (gradeDistribution[gradeResult.grade] !== undefined) {
        gradeDistribution[gradeResult.grade]++;
      }

      // Insert or Update Marks
      const [existingMark] = await conn.query(
        'SELECT id FROM marks WHERE exam_id = ? AND student_id = ? AND subject_id = ?',
        [examId, studentId, subjectId]
      );

      if (existingMark.length > 0) {
        await conn.query('UPDATE marks SET marks_obtained = ? WHERE id = ?', [marksObtained, existingMark[0].id]);
      } else {
        await conn.query(
          'INSERT INTO marks (exam_id, student_id, subject_id, marks_obtained) VALUES (?, ?, ?, ?)',
          [examId, studentId, subjectId, marksObtained]
        );
      }

      // Update / Insert Results summary
      const statusStr = gradeResult.passed ? 'pass' : 'fail';
      const [existingResult] = await conn.query(
        'SELECT id FROM results WHERE student_id = ? AND exam_id = ?',
        [studentId, examId]
      );

      if (existingResult.length > 0) {
        await conn.query(
          'UPDATE results SET total_marks = ?, grade = ?, status = ? WHERE id = ?',
          [marksObtained, gradeResult.grade, statusStr, existingResult[0].id]
        );
      } else {
        await conn.query(
          'INSERT INTO results (student_id, exam_id, total_marks, grade, status) VALUES (?, ?, ?, ?, ?)',
          [studentId, examId, marksObtained, gradeResult.grade, statusStr]
        );
      }

      processedCount++;
    }

    await conn.commit();

    return successResponse(res, `Bulk marks import completed: ${processedCount} records processed and graded.`, {
      processedCount,
      gradeDistribution,
      errors
    });
  } catch (error) {
    await conn.rollback();
    console.error('[BULK MARKS ERROR]:', error);
    return errorResponse(res, 'Failed to import exam marks: ' + error.message, [error.message], 500);
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. BULK IMPORT FACULTY & SUBJECT ALLOCATIONS
// ─────────────────────────────────────────────────────────────────────────────
export async function importFaculty(req, res) {
  if (!req.file || !req.file.buffer) {
    return errorResponse(res, 'No Excel file uploaded for faculty.', [], 400);
  }

  const conn = await pool.getConnection();
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (rawData.length === 0) {
      return errorResponse(res, 'The uploaded faculty sheet is empty.', [], 400);
    }

    const [roleRows] = await conn.query('SELECT id FROM roles WHERE LOWER(name) = "faculty"');
    let facultyRoleId = roleRows[0]?.id;
    if (!facultyRoleId) {
      const [newRole] = await conn.query('INSERT INTO roles (name) VALUES ("Faculty")');
      facultyRoleId = newRole.insertId;
    }

    await conn.beginTransaction();

    let createdCount = 0;
    let updatedCount = 0;
    const errors = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = normalizeRow(rawData[i]);
      const rowNum = i + 2;

      const empId = row.employee_id || row.emp_id || row.faculty_id || row.id;
      const fullName = row.full_name || row.name || row.faculty_name || 'Faculty Member';
      const email = (row.email || `${empId?.toLowerCase()}@collegeerp.com`).toLowerCase().trim();
      const rawPassword = row.password || row.default_password || 'Faculty@123';
      const deptName = row.department || row.dept || 'Computer Science';
      const designation = row.designation || row.title || 'Assistant Professor';
      const phone = row.phone || row.mobile || '';

      if (!empId) {
        errors.push(`Row ${rowNum}: Missing Employee ID`);
        continue;
      }

      // Ensure Department
      const { deptId } = await ensureAcademicHierarchy(conn, deptName, 1);

      // Check / Create User
      const [existingUsers] = await conn.query(
        'SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?',
        [email, empId.toLowerCase()]
      );

      let userId = null;
      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
        await conn.query('UPDATE users SET full_name = ?, status = "active" WHERE id = ?', [fullName, userId]);
        updatedCount++;
      } else {
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const [newUser] = await conn.query(
          'INSERT INTO users (username, full_name, email, password, role_id, status) VALUES (?, ?, ?, ?, ?, "active")',
          [empId.toLowerCase(), fullName, email, hashedPassword, facultyRoleId]
        );
        userId = newUser.insertId;
        createdCount++;
      }

      // Insert into faculty table
      await conn.query(
        `INSERT INTO faculty (user_id, employee_id, name, email, phone, designation, department_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
         ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone), designation = VALUES(designation), department_id = VALUES(department_id)`,
        [userId, empId, fullName, email, phone, designation, deptId]
      );
    }

    await conn.commit();

    return successResponse(res, `Bulk faculty onboarding complete: ${createdCount} created, ${updatedCount} updated.`, {
      createdCount,
      updatedCount,
      errors
    });
  } catch (error) {
    await conn.rollback();
    console.error('[BULK FACULTY ERROR]:', error);
    return errorResponse(res, 'Failed to import faculty: ' + error.message, [error.message], 500);
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. DOWNLOAD SAMPLE EXCEL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────
export async function downloadTemplate(req, res) {
  const type = (req.params.type || 'students').toLowerCase();
  let sampleData = [];
  let fileName = 'Sample_Template.xlsx';

  if (type === 'students') {
    fileName = 'Student_Bulk_Onboarding_Template.xlsx';
    sampleData = [
      {
        'Roll Number': '22CS001',
        'Full Name': 'Aarav Sharma',
        'Email': 'aarav.sharma@collegeerp.com',
        'Default Password': 'Student@123',
        'Department': 'Computer Science',
        'Semester': 4,
        'Section': 'A'
      },
      {
        'Roll Number': '22CS002',
        'Full Name': 'Ananya Patel',
        'Email': 'ananya.patel@collegeerp.com',
        'Default Password': 'Student@123',
        'Department': 'Computer Science',
        'Semester': 4,
        'Section': 'A'
      },
      {
        'Roll Number': '22EC001',
        'Full Name': 'Rohan Verma',
        'Email': 'rohan.verma@collegeerp.com',
        'Default Password': 'Student@123',
        'Department': 'Electronics & Comm',
        'Semester': 4,
        'Section': 'B'
      }
    ];
  } else if (type === 'attendance') {
    fileName = 'Attendance_Matrix_Template.xlsx';
    sampleData = [
      {
        'Date': new Date().toISOString().split('T')[0],
        'Roll Number': '22CS001',
        'Subject Code': 'CS401',
        'Section': 'A',
        'Status': 'Present'
      },
      {
        'Date': new Date().toISOString().split('T')[0],
        'Roll Number': '22CS002',
        'Subject Code': 'CS401',
        'Section': 'A',
        'Status': 'Present'
      },
      {
        'Date': new Date().toISOString().split('T')[0],
        'Roll Number': '22EC001',
        'Subject Code': 'EC401',
        'Section': 'B',
        'Status': 'Absent'
      }
    ];
  } else if (type === 'marks') {
    fileName = 'Exam_Marks_Template.xlsx';
    sampleData = [
      {
        'Roll Number': '22CS001',
        'Subject Code': 'CS401',
        'Exam Name': 'Mid Term 1',
        'Marks Obtained': 92,
        'Max Marks': 100
      },
      {
        'Roll Number': '22CS002',
        'Subject Code': 'CS401',
        'Exam Name': 'Mid Term 1',
        'Marks Obtained': 78,
        'Max Marks': 100
      },
      {
        'Roll Number': '22EC001',
        'Subject Code': 'EC401',
        'Exam Name': 'Mid Term 1',
        'Marks Obtained': 45,
        'Max Marks': 100
      }
    ];
  } else if (type === 'faculty') {
    fileName = 'Faculty_Onboarding_Template.xlsx';
    sampleData = [
      {
        'Employee ID': 'FAC001',
        'Full Name': 'Dr. Ramesh Gupta',
        'Email': 'ramesh.gupta@collegeerp.com',
        'Default Password': 'Faculty@123',
        'Department': 'Computer Science',
        'Designation': 'Professor',
        'Phone': '+91 9123456780'
      },
      {
        'Employee ID': 'FAC002',
        'Full Name': 'Dr. Sunita Sharma',
        'Email': 'sunita.sharma@collegeerp.com',
        'Default Password': 'Faculty@123',
        'Department': 'Mathematics',
        'Designation': 'Associate Professor',
        'Phone': '+91 9123456781'
      }
    ];
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(wb, ws, 'Template');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.send(buf);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. REAL-TIME ACADEMIC STATS OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────
export async function getAcademicStats(req, res) {
  try {
    const [studentCount] = await pool.query('SELECT COUNT(*) as cnt FROM students');
    const [facultyCount] = await pool.query('SELECT COUNT(*) as cnt FROM faculty');
    const [sectionCount] = await pool.query('SELECT COUNT(*) as cnt FROM sections');
    const [marksCount] = await pool.query('SELECT COUNT(*) as cnt FROM marks');
    const [attendanceCount] = await pool.query('SELECT COUNT(*) as cnt FROM attendance_details');
    const [presentAttendance] = await pool.query('SELECT COUNT(*) as cnt FROM attendance_details WHERE status = "present"');

    const totalAtt = attendanceCount[0]?.cnt || 0;
    const presAtt = presentAttendance[0]?.cnt || 0;
    const avgAttendance = totalAtt > 0 ? Number(((presAtt / totalAtt) * 100).toFixed(1)) : 88.5;

    // Grade breakdown from results
    const [gradeRows] = await pool.query(
      'SELECT grade, COUNT(*) as count FROM results WHERE grade IS NOT NULL GROUP BY grade'
    );
    const grades = {};
    gradeRows.forEach(r => { grades[r.grade] = r.count; });

    return successResponse(res, 'Academic summary statistics retrieved', {
      totalStudents: studentCount[0]?.cnt || 0,
      totalFaculty: facultyCount[0]?.cnt || 0,
      totalSections: sectionCount[0]?.cnt || 0,
      totalMarksEntries: marksCount[0]?.cnt || 0,
      totalAttendanceRecords: totalAtt,
      avgAttendanceRate: `${avgAttendance}%`,
      gradeDistribution: grades
    });
  } catch (error) {
    console.error('[ACADEMIC STATS ERROR]:', error);
    return errorResponse(res, 'Failed to fetch academic stats: ' + error.message, [error.message], 500);
  }
}
