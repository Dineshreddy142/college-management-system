import pool from '../db.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * GET /api/academic/cbcs/windows
 * Fetch all CBCS registration windows with enrollment statistics
 */
export const getAdminCBCSWindows = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT w.*,
             sem.name as semester_name, sem.semester_number,
             d.name as department_name,
             (SELECT COUNT(DISTINCT student_id) FROM student_cbcs_preferences WHERE window_id = w.id) as students_applied,
             (SELECT COUNT(*) FROM student_cbcs_preferences WHERE window_id = w.id AND status = 'ALLOCATED') as total_allocated_preferences
      FROM cbcs_registration_windows w
      LEFT JOIN semesters sem ON w.semester_id = sem.id
      LEFT JOIN departments d ON w.department_id = d.id
      ORDER BY w.created_at DESC
    `);

    return successResponse(res, 'CBCS registration windows retrieved successfully', { windows: rows });
  } catch (err) {
    console.error('[GET CBCS WINDOWS ERROR]:', err);
    return errorResponse(res, 'Failed to fetch CBCS registration windows', [], 500);
  }
};

/**
 * POST /api/academic/cbcs/windows
 * Create a new CBCS Choice Window
 */
export const createCBCSWindow = async (req, res) => {
  try {
    const { title, semesterId, departmentId, regulationId, startDatetime, endDatetime, minCredits, maxCredits } = req.body;
    const actorUserId = req.user?.id || 1;

    if (!title || !semesterId || !startDatetime || !endDatetime) {
      return errorResponse(res, 'Title, target semester, start date, and end date are required', [], 400);
    }

    const [resDb] = await pool.execute(
      `INSERT INTO cbcs_registration_windows
        (title, academic_year_id, semester_id, regulation_id, department_id, start_datetime, end_datetime, min_credits, max_credits, status, created_by)
       VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)`,
      [
        title,
        semesterId,
        regulationId || 1,
        departmentId || null,
        startDatetime,
        endDatetime,
        minCredits || 16.0,
        maxCredits || 26.0,
        actorUserId
      ]
    );

    return successResponse(res, 'CBCS Choice Registration Window created successfully', { windowId: resDb.insertId });
  } catch (err) {
    console.error('[CREATE CBCS WINDOW ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to create CBCS registration window', [], 500);
  }
};

/**
 * PATCH /api/academic/cbcs/windows/:id/status
 * Update CBCS Window Status (OPEN, CLOSED, ALLOCATION_PROCESSED)
 */
export const updateCBCSWindowStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['DRAFT', 'OPEN', 'CLOSED', 'ALLOCATION_PROCESSED'].includes(status)) {
      return errorResponse(res, 'Invalid status parameter', [], 400);
    }

    await pool.execute('UPDATE cbcs_registration_windows SET status = ? WHERE id = ?', [status, id]);
    return successResponse(res, `CBCS window status updated to ${status}`);
  } catch (err) {
    console.error('[UPDATE CBCS WINDOW STATUS ERROR]:', err);
    return errorResponse(res, 'Failed to update CBCS window status', [], 500);
  }
};

/**
 * POST /api/academic/cbcs/windows/:id/process-allocation
 * AUTOMATED CGPA MERIT-CUM-CHOICE ALLOCATION ENGINE
 */
export const processAutomatedAllocation = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id: windowId } = req.params;
    const actorUserId = req.user?.id || 1;

    await connection.beginTransaction();

    // 1. Fetch Window details
    const [winRows] = await connection.execute('SELECT * FROM cbcs_registration_windows WHERE id = ?', [windowId]);
    if (winRows.length === 0) {
      await connection.rollback();
      return errorResponse(res, 'CBCS Registration Window not found', [], 404);
    }
    const window = winRows[0];

    // 2. Fetch all students who submitted preferences for this window, joined with CGPA / Academic Performance
    const [studentRows] = await connection.execute(
      `SELECT DISTINCT s.id as student_id, s.user_id, s.roll_number, s.first_name, s.last_name,
              COALESCE(
                (SELECT cgpa FROM student_sem_transcripts WHERE student_id = s.id ORDER BY semester_id DESC LIMIT 1),
                s.cgpa,
                8.0
              ) as cgpa
       FROM student_cbcs_preferences p
       JOIN students s ON p.student_id = s.id
       WHERE p.window_id = ?
       ORDER BY cgpa DESC, s.id ASC`,
      [windowId]
    );

    let processedCount = 0;
    let allocatedCount = 0;
    let unallocatedCount = 0;
    let pref1Count = 0;
    let pref2Count = 0;
    let pref3PlusCount = 0;

    // 3. Process each student in Merit Order (Highest CGPA first)
    for (const st of studentRows) {
      processedCount++;
      const studentId = st.student_id;

      // Get student's submitted preferences grouped by elective_group, sorted by preference_rank ASC
      const [prefs] = await connection.execute(
        `SELECT p.*, so.max_students, so.current_students, so.subject_version_id,
                sv.credits, sv.subject_code, sv.subject_name
         FROM student_cbcs_preferences p
         JOIN subject_offerings so ON p.offering_id = so.id
         JOIN subject_versions sv ON so.subject_version_id = sv.id
         WHERE p.window_id = ? AND p.student_id = ?
         ORDER BY p.elective_group ASC, p.preference_rank ASC`,
        [windowId, studentId]
      );

      // Group preferences by elective pool (e.g. PE-1, OE-1)
      const groupMap = {};
      for (const pr of prefs) {
        if (!groupMap[pr.elective_group]) groupMap[pr.elective_group] = [];
        groupMap[pr.elective_group].push(pr);
      }

      for (const grpName of Object.keys(groupMap)) {
        const groupPrefs = groupMap[grpName];
        let allocatedForGroup = false;

        for (const pr of groupPrefs) {
          if (allocatedForGroup) {
            // Already allocated a higher preference in this group
            await connection.execute(
              `UPDATE student_cbcs_preferences SET status = 'REJECTED_FULL' WHERE id = ?`,
              [pr.id]
            );
            continue;
          }

          // Check if seat capacity is available
          const [capacityCheck] = await connection.execute(
            `SELECT current_students, max_students FROM subject_offerings WHERE id = ? FOR UPDATE`,
            [pr.offering_id]
          );

          if (capacityCheck.length > 0 && capacityCheck[0].current_students < capacityCheck[0].max_students) {
            // ALLOCATE SEAT!
            await connection.execute(
              `UPDATE subject_offerings SET current_students = current_students + 1 WHERE id = ?`,
              [pr.offering_id]
            );

            await connection.execute(
              `UPDATE student_cbcs_preferences SET status = 'ALLOCATED', allocated_at = NOW() WHERE id = ?`,
              [pr.id]
            );

            // Create or update semester registration record
            const [semReg] = await connection.execute(
              `INSERT INTO student_semester_registrations
                (student_id, academic_year_id, semester_id, status, submitted_at)
               VALUES (?, 1, ?, 'APPROVED', NOW())
               ON DUPLICATE KEY UPDATE status = 'APPROVED'`,
              [studentId, window.semester_id]
            );
            const semRegId = semReg.insertId || (await connection.execute(
              `SELECT id FROM student_semester_registrations WHERE student_id = ? AND semester_id = ?`,
              [studentId, window.semester_id]
            ))[0][0].id;

            // Enroll in student_offering_enrollments
            await connection.execute(
              `INSERT INTO student_offering_enrollments
                (semester_registration_id, student_id, offering_id, subject_version_id, registration_category, credits, status)
               VALUES (?, ?, ?, ?, 'ELECTIVE', ?, 'ENROLLED')
               ON DUPLICATE KEY UPDATE status = 'ENROLLED'`,
              [semRegId, studentId, pr.offering_id, pr.subject_version_id, pr.credits || 3.0]
            );

            // Enroll in student_subject_registrations
            await connection.execute(
              `INSERT INTO student_subject_registrations
                (student_id, subject_id, semester_id, academic_year_id, status, registration_type)
               VALUES (?, ?, ?, 1, 'APPROVED', 'ELECTIVE')
               ON DUPLICATE KEY UPDATE status = 'APPROVED'`,
              [studentId, pr.subject_version_id, window.semester_id]
            );

            allocatedForGroup = true;
            allocatedCount++;

            if (pr.preference_rank === 1) pref1Count++;
            else if (pr.preference_rank === 2) pref2Count++;
            else pref3PlusCount++;
          } else {
            // Seat full
            await connection.execute(
              `UPDATE student_cbcs_preferences SET status = 'REJECTED_FULL' WHERE id = ?`,
              [pr.id]
            );
          }
        }

        if (!allocatedForGroup) {
          unallocatedCount++;
        }
      }
    }

    // 4. Update Window status to ALLOCATION_PROCESSED
    await connection.execute(
      `UPDATE cbcs_registration_windows SET status = 'ALLOCATION_PROCESSED' WHERE id = ?`,
      [windowId]
    );

    // 5. Log Execution
    const logDetails = JSON.stringify({
      windowTitle: window.title,
      semesterId: window.semester_id,
      timestamp: new Date().toISOString()
    });

    await connection.execute(
      `INSERT INTO cbcs_allocation_logs
        (window_id, total_students_processed, total_allocated, total_unallocated, preference_1_count, preference_2_count, preference_3_plus_count, executed_by, execution_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [windowId, processedCount, allocatedCount, unallocatedCount, pref1Count, pref2Count, pref3PlusCount, actorUserId, logDetails]
    );

    await connection.commit();

    return successResponse(res, 'Automated CGPA Merit Allocation processed successfully!', {
      studentsProcessed: processedCount,
      totalAllocated: allocatedCount,
      unallocatedCount,
      preference1Success: pref1Count,
      preference2Success: pref2Count,
      preference3PlusSuccess: pref3PlusCount
    });
  } catch (err) {
    await connection.rollback();
    console.error('[PROCESS AUTOMATED ALLOCATION ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to process automated CBCS allocation', [], 500);
  } finally {
    connection.release();
  }
};

/**
 * GET /api/academic/cbcs/allocation-results/:windowId
 * Fetch allocation breakdown and student rosters for a window
 */
export const getCBCSAllocationResults = async (req, res) => {
  try {
    const { windowId } = req.params;

    const [logs] = await pool.execute(
      `SELECT * FROM cbcs_allocation_logs WHERE window_id = ? ORDER BY created_at DESC LIMIT 1`,
      [windowId]
    );

    const [allocations] = await pool.execute(
      `SELECT p.id as pref_id, p.preference_rank, p.status, p.elective_group, p.allocated_at,
              s.id as student_id, s.roll_number, s.first_name, s.last_name, s.name,
              so.offering_code, sv.subject_code, sv.subject_name, sv.credits
       FROM student_cbcs_preferences p
       JOIN students s ON p.student_id = s.id
       JOIN subject_offerings so ON p.offering_id = so.id
       JOIN subject_versions sv ON so.subject_version_id = sv.id
       WHERE p.window_id = ?
       ORDER BY p.status ASC, s.roll_number ASC, p.preference_rank ASC`,
      [windowId]
    );

    return successResponse(res, 'CBCS allocation results retrieved', {
      summary: logs[0] || null,
      allocations
    });
  } catch (err) {
    console.error('[GET ALLOCATION RESULTS ERROR]:', err);
    return errorResponse(res, 'Failed to fetch allocation results', [], 500);
  }
};

/**
 * GET /api/student/cbcs/active-window
 * Student views active window & offered elective options for choice submission
 */
export const getStudentActiveCBCSWindow = async (req, res) => {
  try {
    let studentId = req.query.studentId;
    if (!studentId && req.user) {
      const [stRows] = await pool.execute('SELECT id, semester_id, department_id FROM students WHERE user_id = ?', [req.user.id]);
      if (stRows.length > 0) studentId = stRows[0].id;
    }

    if (!studentId) {
      return errorResponse(res, 'Student profile not resolved', [], 404);
    }

    const [stData] = await pool.execute('SELECT id, semester_id, department_id, cgpa FROM students WHERE id = ?', [studentId]);
    const student = stData[0] || { semester_id: 1, department_id: 1, cgpa: 8.0 };

    // Fetch active window for student's semester
    const [winRows] = await pool.execute(
      `SELECT * FROM cbcs_registration_windows
       WHERE status IN ('OPEN', 'ALLOCATION_PROCESSED')
         AND (semester_id = ? OR semester_id IS NULL)
       ORDER BY id DESC LIMIT 1`,
      [student.semester_id]
    );

    if (winRows.length === 0) {
      return successResponse(res, 'No active CBCS window found', { activeWindow: null, offerings: [] });
    }

    const window = winRows[0];

    // Fetch offered electives for this window's semester
    const [offerings] = await pool.execute(
      `SELECT so.id as offering_id, so.offering_code, so.max_students, so.current_students,
              sv.id as subject_version_id, sv.subject_code, sv.subject_name, sv.credits, sv.offering_type,
              sv.lecture_hours, sv.tutorial_hours, sv.practical_hours,
              d.name as department_name, sec.name as section_name,
              COALESCE(sv.elective_group, 'PROFESSIONAL_ELECTIVE') as elective_group
       FROM subject_offerings so
       JOIN subject_versions sv ON so.subject_version_id = sv.id
       JOIN departments d ON so.department_id = d.id
       JOIN sections sec ON so.section_id = sec.id
       WHERE so.semester_id = ? AND so.status = 'OPEN'`,
      [window.semester_id]
    );

    // Fetch student's existing submitted preferences for this window
    const [existingPrefs] = await pool.execute(
      `SELECT p.*, so.offering_code, sv.subject_code, sv.subject_name
       FROM student_cbcs_preferences p
       JOIN subject_offerings so ON p.offering_id = so.id
       JOIN subject_versions sv ON so.subject_version_id = sv.id
       WHERE p.window_id = ? AND p.student_id = ?
       ORDER BY p.elective_group ASC, p.preference_rank ASC`,
      [window.id, studentId]
    );

    return successResponse(res, 'Active CBCS window retrieved', {
      activeWindow: window,
      offerings,
      existingPreferences: existingPrefs,
      studentDetails: { id: student.id, sem: student.semester_id, cgpa: student.cgpa }
    });
  } catch (err) {
    console.error('[GET STUDENT CBCS WINDOW ERROR]:', err);
    return errorResponse(res, 'Failed to fetch student CBCS window', [], 500);
  }
};

/**
 * POST /api/student/cbcs/submit-preferences
 * Student submits/updates ranked elective choices
 */
export const submitStudentCBCSPreferences = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    let studentId = req.body.studentId;
    if (!studentId && req.user) {
      const [stRows] = await connection.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (stRows.length > 0) studentId = stRows[0].id;
    }

    if (!studentId) {
      return errorResponse(res, 'Student profile not resolved', [], 404);
    }

    const { windowId, preferences } = req.body; // preferences: [{ offeringId, electiveGroup, preferenceRank }]

    if (!windowId || !Array.isArray(preferences) || preferences.length === 0) {
      return errorResponse(res, 'windowId and non-empty preferences array are required', [], 400);
    }

    await connection.beginTransaction();

    // Remove existing pending preferences for this student & window
    await connection.execute(
      `DELETE FROM student_cbcs_preferences WHERE window_id = ? AND student_id = ? AND status = 'PENDING'`,
      [windowId, studentId]
    );

    for (const pref of preferences) {
      await connection.execute(
        `INSERT INTO student_cbcs_preferences
          (window_id, student_id, elective_group, offering_id, preference_rank, status)
         VALUES (?, ?, ?, ?, ?, 'PENDING')
         ON DUPLICATE KEY UPDATE offering_id = VALUES(offering_id), preference_rank = VALUES(preference_rank), status = 'PENDING'`,
        [
          windowId,
          studentId,
          pref.electiveGroup || 'PE-1',
          pref.offeringId,
          pref.preferenceRank || 1
        ]
      );
    }

    await connection.commit();
    return successResponse(res, 'CBCS elective preferences submitted successfully!');
  } catch (err) {
    await connection.rollback();
    console.error('[SUBMIT CBCS PREFERENCES ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to submit CBCS preferences', [], 500);
  } finally {
    connection.release();
  }
};
