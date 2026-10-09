import pool from '../db.js';
import {
  evaluateOfferingRegistrationEligibility,
  submitSemesterRegistrationTransactional,
  approveOrRejectRegistration,
  reopenRegistration
} from '../services/offeringRegistrationService.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * GET /api/academic/subject-offerings
 * Fetch subject offerings with filters
 */
export const getSubjectOfferings = async (req, res) => {
  try {
    const { departmentId, semesterId, academicYearId, sectionId } = req.query;

    // Auto-sync offerings from central subjects table if any active subjects do not have an offering record yet
    try {
      await pool.execute(`
        INSERT IGNORE INTO subject_offerings (
          offering_code, academic_year_id, semester_id, regulation_id, department_id, course_id, section_id, subject_version_id, max_students, status
        )
        SELECT
          CONCAT('OFF-', s.code, '-SEC1'),
          COALESCE(s.academic_year_id, 1),
          COALESCE(s.semester_id, 1),
          COALESCE(s.regulation_id, 1),
          COALESCE(s.department_id, 1),
          COALESCE(s.course_id, 1),
          1,
          s.id,
          60,
          'OPEN'
        FROM subjects s
        LEFT JOIN subject_offerings so ON so.subject_version_id = s.id
        WHERE so.id IS NULL AND (s.status = 'Active' OR s.status IS NULL)
      `);
    } catch (syncErr) {
      console.warn('Notice: Auto-sync subject offerings skipped:', syncErr.message);
    }

    let query = `
      SELECT so.id, so.offering_code, so.max_students, so.current_students, so.status,
             so.academic_year_id, so.semester_id, so.regulation_id, so.department_id, so.course_id, so.section_id,
             COALESCE(sv.subject_code, s.code, 'SUB-001') as subject_code,
             COALESCE(sv.subject_name, s.name, 'Untitled Subject') as subject_name,
             COALESCE(sv.credits, s.credits, 3.0) as credits,
             COALESCE(sv.offering_type, s.offering_type, 'Theory') as offering_type,
             COALESCE(sv.is_elective, 0) as is_elective,
             COALESCE(d.name, 'General Department') as department_name,
             COALESCE(sec.name, 'Section A') as section_name,
             COALESCE(r.name, 'Standard Regulation') as regulation_name,
             GROUP_CONCAT(DISTINCT CONCAT(f.name, ' (', fa.component_type, ')') SEPARATOR ', ') as assigned_faculty
      FROM subject_offerings so
      LEFT JOIN subject_versions sv ON so.subject_version_id = sv.id
      LEFT JOIN subjects s ON (so.subject_version_id = s.id OR (sv.id IS NULL AND s.id = so.subject_version_id))
      LEFT JOIN departments d ON so.department_id = d.id
      LEFT JOIN sections sec ON so.section_id = sec.id
      LEFT JOIN regulations r ON so.regulation_id = r.id
      LEFT JOIN faculty_offering_assignments fa ON (so.id = fa.offering_id AND fa.status = 'ACTIVE')
      LEFT JOIN faculty f ON fa.faculty_id = f.id
      WHERE 1=1
    `;
    const params = [];

    if (departmentId) {
      query += ' AND (so.department_id = ? OR s.department_id = ?)';
      params.push(departmentId, departmentId);
    }
    if (semesterId) {
      query += ' AND (so.semester_id = ? OR s.semester_id = ?)';
      params.push(semesterId, semesterId);
    }
    if (sectionId) {
      query += ' AND so.section_id = ?';
      params.push(sectionId);
    }

    query += ' GROUP BY so.id ORDER BY subject_code ASC';

    const [rows] = await pool.execute(query, params);
    return successResponse(res, 'Subject offerings retrieved successfully', { offerings: rows });
  } catch (err) {
    console.error('[GET SUBJECT OFFERINGS ERROR]:', err);
    return errorResponse(res, 'Failed to fetch subject offerings', [], 500);
  }
};

/**
 * POST /api/academic/subject-offerings
 * Create new subject offering for section/term
 */
export const createSubjectOffering = async (req, res) => {
  try {
    const { academicYearId, semesterId, regulationId, departmentId, courseId, sectionId, subjectVersionId, maxStudents } = req.body;

    if (!subjectVersionId || !sectionId || !semesterId) {
      return errorResponse(res, 'subjectVersionId, sectionId, and semesterId are required', [], 400);
    }

    const offeringCode = `OFF-${subjectVersionId}-SEC${sectionId}-SEM${semesterId}`;

    const [resDb] = await pool.execute(
      `INSERT INTO subject_offerings
        (offering_code, academic_year_id, semester_id, regulation_id, department_id, course_id, section_id, subject_version_id, max_students, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
       ON DUPLICATE KEY UPDATE max_students = VALUES(max_students), status = 'OPEN'`,
      [
        offeringCode,
        academicYearId || 1,
        semesterId,
        regulationId || 1,
        departmentId || 1,
        courseId || 1,
        sectionId,
        subjectVersionId,
        maxStudents || 60
      ]
    );

    return successResponse(res, 'Subject offering created successfully', { offeringId: resDb.insertId });
  } catch (err) {
    console.error('[CREATE OFFERING ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to create subject offering', [], 500);
  }
};

/**
 * POST /api/academic/subject-offerings/:id/faculty
 * Assign faculty to subject offering with component support
 */
export const assignFacultyToOffering = async (req, res) => {
  try {
    const { id: offeringId } = req.params;
    const { facultyId, componentType } = req.body;
    const actorUserId = req.user.id;

    if (!facultyId) {
      return errorResponse(res, 'facultyId is required', [], 400);
    }

    await pool.execute(
      `INSERT INTO faculty_offering_assignments (offering_id, faculty_id, component_type, assigned_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = 'ACTIVE', assigned_by = VALUES(assigned_by)`,
      [offeringId, facultyId, componentType || 'MAIN', actorUserId]
    );

    return successResponse(res, 'Faculty assigned to subject offering successfully');
  } catch (err) {
    console.error('[ASSIGN FACULTY OFFERING ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to assign faculty to offering', [], 500);
  }
};

/**
 * GET /api/academic/registration/eligibility
 * Student evaluates registration eligibility for offerings
 */
export const getRegistrationEligibility = async (req, res) => {
  try {
    let studentId = req.query.studentId;
    if (!studentId && req.user) {
      const [stRows] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (stRows.length > 0) studentId = stRows[0].id;
    }

    if (!studentId) {
      return errorResponse(res, 'Student profile not resolved.', [], 404);
    }

    const targetOfferingIds = req.query.offeringIds ? String(req.query.offeringIds).split(',').map(Number) : [];
    const evaluation = await evaluateOfferingRegistrationEligibility(studentId, targetOfferingIds, req.query.semesterId);

    return successResponse(res, 'Offering registration eligibility evaluated', evaluation);
  } catch (err) {
    console.error('[REGISTRATION ELIGIBILITY API ERROR]:', err);
    return errorResponse(res, 'Failed to evaluate registration eligibility', [], 500);
  }
};

/**
 * POST /api/academic/semester-registrations
 * Transactional semester registration submit
 */
export const submitSemesterRegistration = async (req, res) => {
  try {
    let studentId = req.body.studentId;
    if (!studentId && req.user) {
      const [stRows] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (stRows.length > 0) studentId = stRows[0].id;
    }

    if (!studentId) {
      return errorResponse(res, 'Student profile not resolved.', [], 404);
    }

    const { academicYearId, semesterId, offeringIds } = req.body;
    const result = await submitSemesterRegistrationTransactional({
      studentId,
      academicYearId: academicYearId || 1,
      semesterId: semesterId || 1,
      offeringIds: offeringIds || []
    });

    return successResponse(res, 'Semester registration submitted for approval', result);
  } catch (err) {
    console.error('[SUBMIT SEMESTER REGISTRATION API ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to submit semester registration', [], 500);
  }
};

/**
 * POST /api/academic/semester-registrations/:id/approve
 * HOD/Admin Approve or Reject Registration
 */
export const approveOrRejectRegistrationController = async (req, res) => {
  try {
    const { id: registrationId } = req.params;
    const { action, remarks } = req.body; // action: 'APPROVE' | 'REJECT'
    const actorUserId = req.user.id;

    const result = await approveOrRejectRegistration(registrationId, actorUserId, action, remarks || '');
    return successResponse(res, `Semester registration ${action.toLowerCase()}d successfully`, result);
  } catch (err) {
    console.error('[APPROVE/REJECT REGISTRATION ERROR]:', err);
    return errorResponse(res, err.message || 'Action failed', [], 500);
  }
};

/**
 * POST /api/academic/semester-registrations/:id/reopen
 * Admin/HOD Reopen Locked Registration
 */
export const reopenRegistrationController = async (req, res) => {
  try {
    const { id: registrationId } = req.params;
    const { reason } = req.body;
    const actorUserId = req.user.id;

    const result = await reopenRegistration(registrationId, actorUserId, reason || 'Registration reopened by administrator');
    return successResponse(res, 'Semester registration reopened successfully', result);
  } catch (err) {
    console.error('[REOPEN REGISTRATION ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to reopen registration', [], 500);
  }
};

/**
 * GET /api/faculty/my-offered-subjects
 * Faculty views assigned subject offerings & student count
 */
export const getFacultyAssignedOfferings = async (req, res) => {
  try {
    const [facRows] = await pool.execute('SELECT id FROM faculty WHERE user_id = ?', [req.user.id]);
    const facultyId = facRows[0]?.id || 1;

    const [rows] = await pool.execute(
      `SELECT so.id as offering_id, so.offering_code, so.current_students, so.max_students,
              sv.subject_code, sv.subject_name, sv.credits, sv.offering_type,
              sec.name as section_name, d.name as department_name, fa.component_type
       FROM faculty_offering_assignments fa
       JOIN subject_offerings so ON fa.offering_id = so.id
       JOIN subject_versions sv ON so.subject_version_id = sv.id
       JOIN sections sec ON so.section_id = sec.id
       JOIN departments d ON so.department_id = d.id
       WHERE fa.faculty_id = ? AND fa.status = 'ACTIVE'`,
      [facultyId]
    );

    return successResponse(res, 'Faculty assigned offerings retrieved', { offerings: rows });
  } catch (err) {
    console.error('[FACULTY OFFERINGS ERROR]:', err);
    return errorResponse(res, 'Failed to fetch faculty offerings', [], 500);
  }
};

/**
 * GET /api/faculty/subjects/:offeringId/students
 * Faculty views enrolled student roster for an offering
 */
export const getOfferingEnrolledStudents = async (req, res) => {
  try {
    const { offeringId } = req.params;

    const [rows] = await pool.execute(
      `SELECT s.id as student_id, s.roll_number, s.first_name, s.last_name, s.name, u.email,
              soe.registration_category, soe.status as enrollment_status, soe.created_at as enrolled_at
       FROM student_offering_enrollments soe
       JOIN students s ON soe.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE soe.offering_id = ? AND soe.status = 'ENROLLED'
       ORDER BY s.roll_number ASC`,
      [offeringId]
    );

    return successResponse(res, 'Enrolled students retrieved', { students: rows });
  } catch (err) {
    console.error('[OFFERING ENROLLED STUDENTS ERROR]:', err);
    return errorResponse(res, 'Failed to fetch enrolled students', [], 500);
  }
};
