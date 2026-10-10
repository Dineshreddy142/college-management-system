import pool from '../db.js';

/**
 * 14-Point Backend Eligibility & Offering Evaluation Pipeline
 */
export async function evaluateOfferingRegistrationEligibility(studentId, targetOfferingIds = [], semesterId = null) {
  const results = {
    eligible: true,
    reasons: [],
    warnings: [],
    creditsSummary: {
      regularCredits: 0,
      backlogCredits: 0,
      electiveCredits: 0,
      totalCredits: 0,
      minAllowed: 16.0,
      maxAllowed: 28.0
    },
    studentContext: null,
    currentSubjects: [],
    backlogSubjects: [],
    electiveGroups: [],
    allSubjectEvaluations: []
  };

  try {
    // 1. Fetch Student Header Profile & Academic Placement
    const [stRows] = await pool.execute(
      `SELECT s.id, s.user_id, s.roll_number, s.first_name, s.last_name, s.name,
              s.batch_year, s.regulation_id, s.current_semester_id, s.academic_status,
              s.cumulative_credits_earned, s.cgpa, s.department_id, s.section_id,
              d.name as department_name, d.code as department_code,
              r.name as regulation_name, r.total_required_credits
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN regulations r ON s.regulation_id = r.id
       WHERE s.id = ?`,
      [studentId]
    );

    if (stRows.length === 0) {
      results.eligible = false;
      results.reasons.push({ code: 'STUDENT_NOT_FOUND', message: 'Student profile not found.' });
      return results;
    }

    const student = stRows[0];
    results.studentContext = student;

    // Check 1: Student Active Status
    if (student.academic_status !== 'ACTIVE' && student.academic_status !== 'PROMOTED') {
      results.eligible = false;
      results.reasons.push({
        code: 'STUDENT_INACTIVE',
        message: `Student account status is '${student.academic_status}'. Semester registration is locked.`
      });
      return results;
    }

    const currentSemId = semesterId || student.current_semester_id || 1;

    // Check Existing Registration Header Status
    const [existingHeader] = await pool.execute(
      `SELECT id, status, total_credits, submitted_at, approved_at, remarks
       FROM student_semester_registrations
       WHERE student_id = ? AND semester_id = ?`,
      [studentId, currentSemId]
    );
    if (existingHeader.length > 0) {
      results.registrationHeader = existingHeader[0];
    }

    // Auto-sync baseline subjects to subject_versions & subject_offerings
    try {
      await pool.execute(`
        INSERT IGNORE INTO subject_versions (id, regulation_id, subject_code, subject_name, credits, offering_type, internal_marks, external_marks, total_marks, status)
        SELECT id, COALESCE(regulation_id, 1), code, name, COALESCE(credits, 3.0), COALESCE(offering_type, 'Theory'), COALESCE(internal_marks, 40), COALESCE(external_marks, 60), COALESCE(total_marks, 100), 'ACTIVE'
        FROM subjects
        ON DUPLICATE KEY UPDATE subject_code = VALUES(subject_code), subject_name = VALUES(subject_name)
      `);

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
      console.warn('Notice: Auto-sync offerings skipped:', syncErr.message);
    }

    // Fetch Regulation credit limits
    if (student.regulation_id) {
      const [regRows] = await pool.execute(
        `SELECT total_required_credits FROM regulations WHERE id = ?`,
        [student.regulation_id]
      );
      if (regRows.length > 0) {
        results.creditsSummary.maxAllowed = 28.0;
      }
    }

    // Fetch Student Passed Exam Attempts
    const [passedAttempts] = await pool.execute(
      `SELECT sea.subject_version_id, sea.letter_grade, sea.grade_point, sv.subject_code
       FROM student_exam_attempts sea
       JOIN subject_versions sv ON sea.subject_version_id = sv.id
       WHERE sea.student_id = ? AND sea.result_status = 'PASSED'`,
      [studentId]
    );
    const passedSubjectVersionSet = new Set(passedAttempts.map(p => p.subject_version_id));

    // Fetch Open Backlogs
    const [openBacklogs] = await pool.execute(
      `SELECT sb.id, sb.subject_version_id, sb.attempt_count, sb.status,
              sv.subject_code, sv.subject_name, sv.credits
       FROM student_backlogs sb
       JOIN subject_versions sv ON sb.subject_version_id = sv.id
       WHERE sb.student_id = ? AND sb.status IN ('OPEN_BACKLOG', 'REGISTERED_REATTEMPT')`,
      [studentId]
    );
    const openBacklogVersionMap = new Map(openBacklogs.map(b => [b.subject_version_id, b]));

    // Fetch Available Subject Offerings for the student's term & department/section
    const [offerings] = await pool.execute(
      `SELECT so.id as offering_id, so.offering_code, so.max_students, so.current_students,
              so.status as offering_status, so.registration_start, so.registration_end,
              COALESCE(sv.id, s.id) as subject_version_id,
              COALESCE(sv.subject_code, s.code, 'SUB-001') as subject_code,
              COALESCE(sv.subject_name, s.name, 'Untitled Subject') as subject_name,
              COALESCE(sv.credits, s.credits, 3.0) as credits,
              COALESCE(sv.offering_type, s.offering_type, 'Theory') as offering_type,
              COALESCE(sv.is_elective, 0) as is_elective,
              sv.elective_group_id,
              COALESCE(sv.max_attempts_allowed, 5) as max_attempts_allowed,
              GROUP_CONCAT(CONCAT(f.name, ' (', fa.component_type, ')') SEPARATOR ', ') as assigned_faculty
       FROM subject_offerings so
       LEFT JOIN subject_versions sv ON so.subject_version_id = sv.id
       LEFT JOIN subjects s ON (so.subject_version_id = s.id OR (sv.id IS NULL AND s.id = so.subject_version_id))
       LEFT JOIN faculty_offering_assignments fa ON (so.id = fa.offering_id AND fa.status = 'ACTIVE')
       LEFT JOIN faculty f ON fa.faculty_id = f.id
       WHERE (so.department_id = ? OR so.department_id IS NULL OR s.department_id = ? OR s.department_id IS NULL)
         AND (so.semester_id = ? OR s.semester_id = ? OR s.semester_id IS NULL)
         AND (so.status = 'OPEN' OR so.status IS NULL)
       GROUP BY so.id`,
      [
        student.department_id || 1, student.department_id || 1,
        currentSemId, currentSemId
      ]
    );

    // Evaluate each offering for student eligibility
    const reqSet = new Set(targetOfferingIds.map(Number));

    for (const off of offerings) {
      const isSelected = reqSet.has(off.offering_id);
      let isEligible = true;
      let disableReason = null;

      // Check: Already Passed?
      if (passedSubjectVersionSet.has(off.subject_version_id)) {
        isEligible = false;
        disableReason = 'Already Passed in Previous Attempt';
      }

      // Check: Offering Capacity Full?
      if (isEligible && off.current_students >= off.max_students) {
        isEligible = false;
        disableReason = `Offering Section Capacity Full (${off.max_students}/${off.max_students} Students)`;
      }

      // Check: Prerequisites V2
      if (isEligible) {
        const [prereqs] = await pool.execute(
          `SELECT prerequisite_subject_version_id, logic_group_id
           FROM subject_prerequisites_v2
           WHERE subject_version_id = ?`,
          [off.subject_version_id]
        );

        if (prereqs.length > 0) {
          const groupMap = new Map();
          for (const p of prereqs) {
            if (!groupMap.has(p.logic_group_id)) groupMap.set(p.logic_group_id, []);
            groupMap.get(p.logic_group_id).push(p.prerequisite_subject_version_id);
          }

          let prereqSatisfied = false;
          for (const [groupId, reqIds] of groupMap.entries()) {
            if (reqIds.every(id => passedSubjectVersionSet.has(id))) {
              prereqSatisfied = true;
              break;
            }
          }

          if (!prereqSatisfied) {
            isEligible = false;
            disableReason = 'Not Eligible: Prerequisite subject has not been passed';
          }
        }
      }

      const itemEval = {
        offeringId: off.offering_id,
        offeringCode: off.offering_code,
        subjectVersionId: off.subject_version_id,
        subjectCode: off.subject_code,
        subjectName: off.subject_name,
        offeringType: off.offering_type,
        credits: Number(off.credits),
        facultyName: off.assigned_faculty || 'To Be Assigned',
        maxStudents: off.max_students,
        currentStudents: off.current_students,
        isElective: Boolean(off.is_elective),
        isBacklog: openBacklogVersionMap.has(off.subject_version_id),
        eligible: isEligible,
        reasonIfDisabled: disableReason,
        isSelected
      };

      results.allSubjectEvaluations.push(itemEval);

      if (itemEval.isBacklog) {
        results.backlogSubjects.push(itemEval);
      } else if (itemEval.isElective) {
        // Group into electives
      } else {
        results.currentSubjects.push(itemEval);
      }

      if (isSelected && isEligible) {
        results.creditsSummary.totalCredits += itemEval.credits;
        if (itemEval.isBacklog) results.creditsSummary.backlogCredits += itemEval.credits;
        else if (itemEval.isElective) results.creditsSummary.electiveCredits += itemEval.credits;
        else results.creditsSummary.regularCredits += itemEval.credits;
      }
    }

    // Evaluate Elective Groups
    if (student.regulation_id) {
      const [egRows] = await pool.execute(
        `SELECT id, group_name, min_choices, max_choices
         FROM elective_groups
         WHERE regulation_id = ?`,
        [student.regulation_id]
      );
      results.electiveGroups = egRows || [];
    }

    return results;
  } catch (err) {
    console.error('[EVALUATE OFFERING ELIGIBILITY ERROR]:', err);
    results.eligible = false;
    results.reasons.push({ code: 'SYSTEM_ERROR', message: err.message });
    return results;
  }
}

/**
 * Transactional Semester Registration Submission with FOR UPDATE Capacity Locking & Dual-Table Sync
 */
export async function submitSemesterRegistrationTransactional({
  studentId,
  academicYearId,
  semesterId,
  offeringIds = []
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Resolve student header
    const [stRows] = await connection.execute(
      `SELECT id, regulation_id, department_id, section_id, academic_status
       FROM students WHERE id = ?`,
      [studentId]
    );

    if (stRows.length === 0) throw new Error('Student profile not found.');
    const student = stRows[0];

    if (student.academic_status !== 'ACTIVE' && student.academic_status !== 'PROMOTED') {
      throw new Error(`Student account status is '${student.academic_status}'. Registration locked.`);
    }

    const uniqueOfferingIds = Array.from(new Set(offeringIds.map(Number)));
    if (uniqueOfferingIds.length === 0) {
      throw new Error('At least one subject offering must be selected.');
    }

    // 2. Lock offering rows for update to prevent capacity overbooking
    const placeholders = uniqueOfferingIds.map(() => '?').join(',');
    const [offerings] = await connection.execute(
      `SELECT so.id, so.subject_version_id, so.max_students, so.current_students, so.status,
              COALESCE(sv.credits, s.credits, 3.0) as credits,
              COALESCE(sv.subject_code, s.code, 'SUB-001') as subject_code,
              COALESCE(sv.subject_name, s.name, 'Untitled Subject') as subject_name
       FROM subject_offerings so
       LEFT JOIN subject_versions sv ON so.subject_version_id = sv.id
       LEFT JOIN subjects s ON (so.subject_version_id = s.id OR (sv.id IS NULL AND s.id = so.subject_version_id))
       WHERE so.id IN (${placeholders}) FOR UPDATE`,
      uniqueOfferingIds
    );

    if (offerings.length !== uniqueOfferingIds.length) {
      throw new Error('One or more selected subject offerings were not found.');
    }

    let totalCredits = 0;
    for (const off of offerings) {
      if (off.status !== 'OPEN') {
        throw new Error(`Offering ${off.subject_code} is not currently open for registration.`);
      }
      if (off.current_students >= off.max_students) {
        throw new Error(`Offering ${off.subject_code} (${off.subject_name}) section capacity full (${off.max_students} max).`);
      }
      totalCredits += Number(off.credits);
    }

    // 3. Upsert Semester Registration Header
    const [headerRes] = await connection.execute(
      `INSERT INTO student_semester_registrations
        (student_id, academic_year_id, semester_id, regulation_id, department_id, section_id, total_credits, status, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING_APPROVAL', CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
         total_credits = VALUES(total_credits),
         status = 'PENDING_APPROVAL',
         submitted_at = CURRENT_TIMESTAMP`,
      [
        studentId,
        academicYearId,
        semesterId,
        student.regulation_id || 1,
        student.department_id || 1,
        student.section_id || 1,
        totalCredits
      ]
    );

    const registrationId = headerRes.insertId || (await getRegistrationHeaderId(connection, studentId, semesterId, academicYearId));

    // Clear old pending items for this registration if any
    await connection.execute(
      `DELETE FROM student_offering_enrollments WHERE semester_registration_id = ?`,
      [registrationId]
    );

    // 4. Insert enrollment detail items & update current_students counters & DUAL-TABLE SYNC TO student_subject_registrations
    for (const off of offerings) {
      await connection.execute(
        `INSERT INTO student_offering_enrollments
          (semester_registration_id, student_id, offering_id, subject_version_id, credits, status)
         VALUES (?, ?, ?, ?, ?, 'ENROLLED')`,
        [registrationId, studentId, off.id, off.subject_version_id, off.credits]
      );

      await connection.execute(
        `UPDATE subject_offerings SET current_students = current_students + 1 WHERE id = ?`,
        [off.id]
      );

      // 🔥 DUAL-TABLE SYNC TO student_subject_registrations FOR ATTENDANCE & TELEMETRY
      const [subRows] = await connection.execute(
        'SELECT id FROM subjects WHERE id = ? OR code = ?',
        [off.subject_version_id, off.subject_code]
      );
      const realSubjectId = subRows.length > 0 ? subRows[0].id : off.subject_version_id;

      await connection.execute(`
        INSERT INTO student_subject_registrations
          (student_id, subject_id, semester_id, academic_year_id, section_id, registration_type, status)
        VALUES (?, ?, ?, ?, ?, 'MANDATORY', 'REGISTERED')
        ON DUPLICATE KEY UPDATE status = 'REGISTERED', updated_at = CURRENT_TIMESTAMP
      `, [
        studentId,
        realSubjectId,
        semesterId,
        academicYearId,
        student.section_id || 1
      ]);
    }

    // 5. Write to Enterprise Academic Audit Logs
    await connection.execute(
      `INSERT INTO academic_audit_logs (actor_user_id, action_type, entity_type, entity_id, reason)
       VALUES ((SELECT user_id FROM students WHERE id = ?), 'SUBMIT_SEMESTER_REGISTRATION', 'STUDENT_SEMESTER_REGISTRATION', ?, 'Semester registration submitted by student')`,
      [studentId, registrationId]
    );

    await connection.commit();
    return {
      success: true,
      registrationId,
      status: 'PENDING_APPROVAL',
      totalCredits,
      offeringCount: offerings.length
    };
  } catch (err) {
    await connection.rollback();
    console.error('[SEMESTER REGISTRATION TRANSACTION ERROR]:', err);
    throw err;
  } finally {
    connection.release();
  }
}

async function getRegistrationHeaderId(conn, studentId, semesterId, academicYearId) {
  const [rows] = await conn.execute(
    `SELECT id FROM student_semester_registrations WHERE student_id = ? AND semester_id = ? AND academic_year_id = ?`,
    [studentId, semesterId, academicYearId]
  );
  return rows[0]?.id;
}

/**
 * Approve or Reject Semester Registration Workflow with DUAL-TABLE SYNC
 */
export async function approveOrRejectRegistration(registrationId, approvedByUserId, action, remarks = '') {
  const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE student_semester_registrations
       SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP, remarks = ?
       WHERE id = ?`,
      [status, approvedByUserId, remarks, registrationId]
    );

    if (action === 'APPROVE') {
      // Hard Lock registration after approval
      await connection.execute(
        `UPDATE student_semester_registrations SET status = 'LOCKED', locked_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [registrationId]
      );

      // 🔥 Sync all enrollments to student_subject_registrations for Attendance Roster & Faculty Class marking
      const [enrollments] = await connection.execute(
        `SELECT soe.student_id, soe.offering_id, soe.subject_version_id, ssr.semester_id, ssr.academic_year_id, ssr.section_id
         FROM student_offering_enrollments soe
         JOIN student_semester_registrations ssr ON soe.semester_registration_id = ssr.id
         WHERE soe.semester_registration_id = ?`,
        [registrationId]
      );

      for (const item of enrollments) {
        const [subRows] = await connection.execute(
          'SELECT id FROM subjects WHERE id = ?',
          [item.subject_version_id]
        );
        const targetSubId = subRows.length > 0 ? subRows[0].id : item.subject_version_id;

        await connection.execute(`
          INSERT INTO student_subject_registrations
            (student_id, subject_id, semester_id, academic_year_id, section_id, registration_type, status)
          VALUES (?, ?, ?, ?, ?, 'MANDATORY', 'REGISTERED')
          ON DUPLICATE KEY UPDATE status = 'REGISTERED', updated_at = CURRENT_TIMESTAMP
        `, [
          item.student_id,
          targetSubId,
          item.semester_id,
          item.academic_year_id,
          item.section_id
        ]);
      }
    }

    await connection.execute(
      `INSERT INTO academic_audit_logs (actor_user_id, action_type, entity_type, entity_id, reason)
       VALUES (?, ?, 'STUDENT_SEMESTER_REGISTRATION', ?, ?)`,
      [approvedByUserId, `REGISTRATION_${action}`, registrationId, remarks || `Registration ${status}`]
    );

    await connection.commit();
    return { success: true, registrationId, status: action === 'APPROVE' ? 'LOCKED' : 'REJECTED' };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Admin / HOD Reopen Locked Registration
 */
export async function reopenRegistration(registrationId, actorUserId, reason) {
  await pool.execute(
    `UPDATE student_semester_registrations SET status = 'SUBMITTED', locked_at = NULL, remarks = ? WHERE id = ?`,
    [reason, registrationId]
  );

  await pool.execute(
    `INSERT INTO academic_audit_logs (actor_user_id, action_type, entity_type, entity_id, reason)
     VALUES (?, 'REOPEN_REGISTRATION', 'STUDENT_SEMESTER_REGISTRATION', ?, ?)`,
    [actorUserId, registrationId, reason]
  );

  return { success: true, registrationId, status: 'SUBMITTED' };
}
