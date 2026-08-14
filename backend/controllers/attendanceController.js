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

// --- FACULTY ENDPOINTS ---

// GET /api/attendance/faculty/todays-classes
export const getFacultyTodaysClasses = async (req, res) => {
  try {
    const facultyId = await resolveFacultyId(req.user.id);
    if (!facultyId && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Faculty profile not found' });
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayName = days[new Date().getDay()];
    const todayDateStr = new Date().toISOString().slice(0, 10);

    // Query Phase 5 timetable_entries for this faculty and today's day of week
    let query = `
      SELECT te.id as timetable_entry_id, te.section_id, te.subject_id, te.faculty_id, te.room_id, te.time_slot_id,
             s.code as subject_code, s.name as subject_name,
             sec.name as section_name,
             ts.start_time, ts.end_time, ts.title as slot_title,
             c.room_number, c.building_name
      FROM timetable_entries te
      JOIN timetable_master tm ON te.timetable_master_id = tm.id
      JOIN subjects s ON te.subject_id = s.id
      JOIN sections sec ON te.section_id = sec.id
      LEFT JOIN time_slots ts ON te.time_slot_id = ts.id
      LEFT JOIN classrooms c ON te.room_id = c.id
      WHERE te.day_of_week = ?
    `;

    const params = [todayDayName];

    if (facultyId) {
      query += ` AND te.faculty_id = ?`;
      params.push(facultyId);
    }

    query += ` ORDER BY ts.start_time ASC`;

    const [entries] = await pool.query(query, params);

    // For each entry, find or create attendance_sessions record for today
    const sessionsList = [];
    for (const entry of entries) {
      let [sessions] = await pool.query(`
        SELECT id, status, opened_at, submitted_at, cancellation_reason
        FROM attendance_sessions
        WHERE timetable_entry_id = ? AND date = ?
      `, [entry.timetable_entry_id, todayDateStr]);

      let sessionObj;
      if (sessions.length === 0) {
        const [insertRes] = await pool.query(`
          INSERT INTO attendance_sessions
          (timetable_entry_id, subject_id, faculty_id, section_id, date, time_slot_id, room_id, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN')
        `, [
          entry.timetable_entry_id,
          entry.subject_id,
          entry.faculty_id,
          entry.section_id,
          todayDateStr,
          entry.time_slot_id,
          entry.room_id
        ]);
        sessionObj = { id: insertRes.insertId, status: 'OPEN', opened_at: new Date() };
      } else {
        sessionObj = sessions[0];
      }

      sessionsList.push({
        ...entry,
        session_id: sessionObj.id,
        session_status: sessionObj.status,
        submitted_at: sessionObj.submitted_at
      });
    }

    res.json({
      success: true,
      day: todayDayName,
      date: todayDateStr,
      count: sessionsList.length,
      data: sessionsList
    });
  } catch (error) {
    console.error('Error fetching today\'s classes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch today\'s class schedule', error: error.message });
  }
};

// GET /api/attendance/session/:id/roster
export const getAttendanceSessionRoster = async (req, res) => {
  try {
    const { id } = req.params;
    const facultyId = await resolveFacultyId(req.user.id);

    // Fetch session details
    const [sessions] = await pool.query(`
      SELECT ats.*,
             s.code as subject_code, s.name as subject_name,
             sec.name as section_name,
             f.first_name as faculty_first_name, f.last_name as faculty_last_name
      FROM attendance_sessions ats
      JOIN subjects s ON ats.subject_id = s.id
      JOIN sections sec ON ats.section_id = sec.id
      JOIN faculties f ON ats.faculty_id = f.id
      WHERE ats.id = ?
    `, [id]);

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance session not found' });
    }

    const session = sessions[0];

    // Security Check: Ensure logged-in faculty owns this session (unless Admin)
    if (req.user.role !== 'Admin' && facultyId && session.faculty_id !== facultyId) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to mark attendance for another faculty\'s class.' });
    }

    // Fetch registered Phase 4 students for subject and section
    const [students] = await pool.query(`
      SELECT DISTINCT st.id as student_id, st.roll_number, st.admission_number, st.first_name, st.last_name, u.email,
             COALESCE(ar.status, 'PRESENT') as current_status,
             ar.verification_method, ar.id as record_id
      FROM student_subject_registrations ssr
      JOIN students st ON ssr.student_id = st.id
      LEFT JOIN users u ON st.user_id = u.id
      LEFT JOIN attendance_records ar ON (ar.attendance_session_id = ? AND ar.student_id = st.id)
      WHERE ssr.subject_id = ? AND ssr.status = 'REGISTERED'
        AND (st.section_id = ? OR st.section_id IS NULL)
      ORDER BY st.roll_number ASC, st.first_name ASC
    `, [id, session.subject_id, session.section_id]);

    res.json({
      success: true,
      session,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error fetching session roster:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch class roster', error: error.message });
  }
};

// POST /api/attendance/session/:id/submit
export const submitAttendanceSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { records } = req.body;
    const facultyId = await resolveFacultyId(req.user.id);

    const [sessions] = await pool.query('SELECT * FROM attendance_sessions WHERE id = ?', [id]);
    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance session not found' });
    }

    const session = sessions[0];

    // Security Check
    if (req.user.role !== 'Admin' && facultyId && session.faculty_id !== facultyId) {
      return res.status(403).json({ success: false, message: 'Access denied to submit attendance for this session.' });
    }

    if (session.status === 'LOCKED' || session.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: `Session is ${session.status} and cannot be modified.` });
    }

    const recordItems = Array.isArray(records) ? records : [];
    if (recordItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Attendance roster records are required.' });
    }

    // Save attendance records
    for (const item of recordItems) {
      const statusVal = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(item.status) ? item.status : 'PRESENT';
      await pool.query(`
        INSERT INTO attendance_records (attendance_session_id, student_id, status, verification_method, marked_by)
        VALUES (?, ?, ?, 'MANUAL', ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status), marked_at = CURRENT_TIMESTAMP
      `, [id, item.student_id, statusVal, req.user.id]);
    }

    // Update session status to SUBMITTED
    await pool.query(`
      UPDATE attendance_sessions
      SET status = 'SUBMITTED', submitted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: `Attendance marked successfully for ${recordItems.length} students!`,
      data: { session_id: id, count: recordItems.length }
    });
  } catch (error) {
    console.error('Error submitting attendance session:', error);
    res.status(500).json({ success: false, message: 'Failed to submit attendance', error: error.message });
  }
};

// --- STUDENT ENDPOINTS ---

// GET /api/attendance/student/summary
export const getStudentAttendanceSummary = async (req, res) => {
  try {
    const studentId = await resolveStudentId(req.user.id);
    if (!studentId) {
      return res.status(404).json({ success: false, message: 'Student profile record not found' });
    }

    // Fetch minimum percentage threshold settings
    const [settings] = await pool.query('SELECT minimum_percentage FROM attendance_settings LIMIT 1');
    const minPct = parseFloat(settings[0]?.minimum_percentage) || 75.0;

    // Fetch student's registered subjects
    const [subjects] = await pool.query(`
      SELECT DISTINCT s.id as subject_id, s.code as subject_code, s.name as subject_name, s.credits,
             f.first_name as faculty_first_name, f.last_name as faculty_last_name
      FROM student_subject_registrations ssr
      JOIN subjects s ON ssr.subject_id = s.id
      LEFT JOIN subject_allocations sa ON (sa.subject_id = s.id AND sa.status = 'Active')
      LEFT JOIN faculties f ON sa.faculty_id = f.id
      WHERE ssr.student_id = ? AND ssr.status = 'REGISTERED'
    `, [studentId]);

    const subjectBreakdown = [];
    let totalPresentSum = 0;
    let totalEligibleSum = 0;

    for (const sub of subjects) {
      // Calculate eligible submitted sessions for this subject & student's section
      const [counts] = await pool.query(`
        SELECT 
          COUNT(DISTINCT ats.id) as total_eligible,
          SUM(CASE WHEN ar.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN ar.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
          SUM(CASE WHEN ar.status = 'LATE' THEN 1 ELSE 0 END) as late_count,
          SUM(CASE WHEN ar.status = 'EXCUSED' THEN 1 ELSE 0 END) as excused_count
        FROM attendance_sessions ats
        LEFT JOIN attendance_records ar ON (ar.attendance_session_id = ats.id AND ar.student_id = ?)
        WHERE ats.subject_id = ?
          AND ats.status IN ('SUBMITTED', 'LOCKED')
      `, [studentId, sub.subject_id]);

      const c = counts[0] || {};
      const totalEligible = parseInt(c.total_eligible) || 0;
      const present = parseInt(c.present_count) || 0;
      const absent = parseInt(c.absent_count) || 0;
      const late = parseInt(c.late_count) || 0;
      const excused = parseInt(c.excused_count) || 0;

      const pct = totalEligible > 0 ? parseFloat(((present / totalEligible) * 100).toFixed(2)) : 100.0;

      totalPresentSum += present;
      totalEligibleSum += totalEligible;

      // Mathematical future class recovery calculation:
      // We want (P + X) / (T + X) >= 0.75  => X >= (0.75 * T - P) / 0.25 => X >= 3T - 4P
      let classesRequiredToReachMin = 0;
      if (pct < minPct && totalEligible > 0) {
        const reqClasses = (3 * totalEligible) - (4 * present);
        classesRequiredToReachMin = reqClasses > 0 ? reqClasses : 0;
      }

      subjectBreakdown.push({
        ...sub,
        total_eligible_sessions: totalEligible,
        present_count: present,
        absent_count: absent,
        late_count: late,
        excused_count: excused,
        percentage: pct,
        is_shortage: pct < minPct,
        classes_required_for_threshold: classesRequiredToReachMin
      });
    }

    const overallPercentage = totalEligibleSum > 0 ? parseFloat(((totalPresentSum / totalEligibleSum) * 100).toFixed(2)) : 100.0;
    const isOverallShortage = overallPercentage < minPct;

    res.json({
      success: true,
      student_id: studentId,
      overall_percentage: overallPercentage,
      minimum_threshold: minPct,
      is_shortage: isOverallShortage,
      subject_breakdown: subjectBreakdown
    });
  } catch (error) {
    console.error('Error fetching student attendance summary:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate attendance summary', error: error.message });
  }
};

// --- HOD & ADMIN ENDPOINTS ---

// GET /api/attendance/hod/overview
export const getHODAttendanceOverview = async (req, res) => {
  try {
    const { department_id, semester_id, section_id } = req.query;

    const effDeptId = (req.user.role === 'HOD' && req.user.department_id) ? req.user.department_id : department_id;

    // Shortage students list (< 75%)
    let query = `
      SELECT st.id as student_id, st.roll_number, st.admission_number, st.first_name, st.last_name,
             d.name as department_name, sec.name as section_name,
             COUNT(DISTINCT ats.id) as total_sessions,
             SUM(CASE WHEN ar.status = 'PRESENT' THEN 1 ELSE 0 END) as present_sessions
      FROM students st
      JOIN departments d ON st.department_id = d.id
      LEFT JOIN sections sec ON st.section_id = sec.id
      JOIN student_subject_registrations ssr ON st.id = ssr.student_id
      JOIN attendance_sessions ats ON ssr.subject_id = ats.subject_id AND ats.status IN ('SUBMITTED', 'LOCKED')
      LEFT JOIN attendance_records ar ON (ar.attendance_session_id = ats.id AND ar.student_id = st.id)
      WHERE 1=1
    `;

    const params = [];

    if (effDeptId && effDeptId !== 'all') {
      query += ` AND st.department_id = ?`;
      params.push(effDeptId);
    }
    if (semester_id && semester_id !== 'all') {
      query += ` AND st.semester = ?`;
      params.push(semester_id);
    }
    if (section_id && section_id !== 'all') {
      query += ` AND st.section_id = ?`;
      params.push(section_id);
    }

    query += ` GROUP BY st.id HAVING total_sessions > 0 AND (present_sessions / total_sessions) < 0.75`;

    const [shortageRows] = await pool.query(query, params);

    res.json({
      success: true,
      shortage_count: shortageRows.length,
      shortage_students: shortageRows.map(r => ({
        ...r,
        percentage: parseFloat(((r.present_sessions / r.total_sessions) * 100).toFixed(2))
      }))
    });
  } catch (error) {
    console.error('Error fetching HOD attendance overview:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch HOD attendance overview', error: error.message });
  }
};

// GET /api/attendance/admin/overview
export const getAdminAttendanceOverview = async (req, res) => {
  try {
    const [sessionsCount] = await pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN status = "SUBMITTED" THEN 1 ELSE 0 END) as submitted FROM attendance_sessions');
    const [recordsCount] = await pool.query('SELECT COUNT(*) as total_records, SUM(CASE WHEN status = "PRESENT" THEN 1 ELSE 0 END) as present_records FROM attendance_records');

    const total = parseInt(recordsCount[0]?.total_records) || 0;
    const present = parseInt(recordsCount[0]?.present_records) || 0;
    const overallPct = total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 100.0;

    res.json({
      success: true,
      data: {
        total_sessions: sessionsCount[0]?.total || 0,
        submitted_sessions: sessionsCount[0]?.submitted || 0,
        overall_attendance_percentage: overallPct
      }
    });
  } catch (error) {
    console.error('Error fetching admin attendance overview:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin overview', error: error.message });
  }
};

// POST /api/attendance/admin/correct
export const correctAttendanceRecord = async (req, res) => {
  try {
    const { record_id, new_status, reason } = req.body;

    if (!record_id || !new_status || !reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Record ID, New Status, and Audit Reason are required.' });
    }

    const [records] = await pool.query('SELECT * FROM attendance_records WHERE id = ?', [record_id]);
    if (records.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    const oldRecord = records[0];

    // Audit log correction into attendance_corrections
    await pool.query(`
      INSERT INTO attendance_corrections (attendance_record_id, old_status, new_status, reason, changed_by)
      VALUES (?, ?, ?, ?, ?)
    `, [record_id, oldRecord.status, new_status, reason.trim(), req.user.id]);

    // Update attendance record status
    await pool.query('UPDATE attendance_records SET status = ?, marked_at = CURRENT_TIMESTAMP WHERE id = ?', [new_status, record_id]);

    res.json({
      success: true,
      message: `Attendance status updated from '${oldRecord.status}' to '${new_status}' with audit trail recorded.`
    });
  } catch (error) {
    console.error('Error executing attendance correction:', error);
    res.status(500).json({ success: false, message: 'Failed to execute attendance correction', error: error.message });
  }
};

// POST /api/attendance/admin/cancel-session
export const cancelClassSession = async (req, res) => {
  try {
    const { session_id, reason } = req.body;

    if (!session_id || !reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Session ID and Cancellation Reason are required.' });
    }

    await pool.query(`
      UPDATE attendance_sessions
      SET status = 'CANCELLED', cancellation_reason = ?
      WHERE id = ?
    `, [reason.trim(), session_id]);

    res.json({
      success: true,
      message: 'Class session cancelled successfully. Cancelled classes are excluded from attendance percentage calculations.'
    });
  } catch (error) {
    console.error('Error cancelling class session:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel class session', error: error.message });
  }
};
