import pool from '../db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Helper to log admission status history audit trail
 */
async function logAdmissionHistory(applicationId, action, previousStatus, newStatus, performedByUserId, remarks = '') {
  try {
    await pool.execute(
      `INSERT INTO admission_status_history (application_id, action, previous_status, new_status, performed_by_user_id, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [applicationId, action, previousStatus || null, newStatus || null, performedByUserId || null, remarks]
    );
  } catch (err) {
    console.error('[ADMISSION HISTORY LOG ERROR]', err.message);
  }
}

/**
 * Helper to generate concurrency-safe atomic application numbers using admission_sequences
 */
async function generateApplicationNumber() {
  const currentYear = new Date().getFullYear();
  const seqName = `ADM_${currentYear}`;
  
  await pool.execute(
    `INSERT INTO admission_sequences (sequence_name, current_value)
     VALUES (?, 1)
     ON DUPLICATE KEY UPDATE current_value = LAST_INSERT_ID(current_value + 1)`,
    [seqName]
  );
  
  const [seqResult] = await pool.query('SELECT LAST_INSERT_ID() AS seq_num');
  const seqNum = seqResult[0]?.seq_num || 1;
  return `ADM-${currentYear}-${String(seqNum).padStart(6, '0')}`;
}

/**
 * 1. GET /api/admission/dashboard-stats
 * Zero-record safe stats aggregation
 */
export async function getDashboardStats(req, res) {
  try {
    const [counts] = await pool.query(`
      SELECT 
        COALESCE(COUNT(*), 0) AS totalApplications,
        COALESCE(SUM(CASE WHEN application_status = 'SUBMITTED' THEN 1 ELSE 0 END), 0) AS newApplications,
        COALESCE(SUM(CASE WHEN application_status = 'UNDER_REVIEW' THEN 1 ELSE 0 END), 0) AS underReview,
        COALESCE(SUM(CASE WHEN document_status = 'NOT_SUBMITTED' THEN 1 ELSE 0 END), 0) AS documentsPending,
        COALESCE(SUM(CASE WHEN eligibility_status = 'ELIGIBLE' THEN 1 ELSE 0 END), 0) AS eligibleCandidates,
        COALESCE(SUM(CASE WHEN application_status = 'SELECTED' THEN 1 ELSE 0 END), 0) AS selectedCandidates,
        COALESCE(SUM(CASE WHEN application_status = 'REJECTED' THEN 1 ELSE 0 END), 0) AS rejectedApplications,
        COALESCE(SUM(CASE WHEN application_status = 'ADMISSION_CONFIRMED' THEN 1 ELSE 0 END), 0) AS confirmedAdmissions,
        COALESCE(SUM(paid_amount), 0.00) AS totalFeesCollected
      FROM admission_applications
    `);

    const [recentApps] = await pool.query(`
      SELECT a.id, a.application_number, a.application_status, a.document_status, a.eligibility_status, a.fee_status, a.created_at,
             ap.first_name, ap.last_name, ap.email, ap.mobile,
             p.program_code, c.name AS course_name, d.name AS department_name
      FROM admission_applications a
      JOIN admission_applicants ap ON a.applicant_id = ap.id
      LEFT JOIN admission_programs p ON a.allocated_program_id = p.id
      LEFT JOIN courses c ON p.course_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `);

    const [upcomingInterviews] = await pool.query(`
      SELECT i.id, i.scheduled_date, i.mode, i.status, i.location_or_link,
             a.application_number, ap.first_name, ap.last_name,
             u.full_name AS interviewer_name
      FROM admission_interviews i
      JOIN admission_applications a ON i.application_id = a.id
      JOIN admission_applicants ap ON a.applicant_id = ap.id
      LEFT JOIN users u ON i.interviewer_user_id = u.id
      WHERE i.scheduled_date >= NOW()
      ORDER BY i.scheduled_date ASC
      LIMIT 10
    `);

    const statsData = counts[0] || {};
    res.json({
      success: true,
      data: {
        totalApplications: Number(statsData.totalApplications || 0),
        newApplications: Number(statsData.newApplications || 0),
        underReview: Number(statsData.underReview || 0),
        documentsPending: Number(statsData.documentsPending || 0),
        eligibleCandidates: Number(statsData.eligibleCandidates || 0),
        selectedCandidates: Number(statsData.selectedCandidates || 0),
        rejectedApplications: Number(statsData.rejectedApplications || 0),
        confirmedAdmissions: Number(statsData.confirmedAdmissions || 0),
        totalFeesCollected: Number(statsData.totalFeesCollected || 0),
        recentApplications: recentApps || [],
        upcomingInterviews: upcomingInterviews || [],
        pendingActions: []
      }
    });
  } catch (err) {
    console.error('[ADMISSION DASHBOARD ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats', error: err.message });
  }
}

/**
 * 2. ADMISSION CYCLES API
 */
export async function getCycles(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, ay.year_name, ay.year_code
      FROM admission_cycles c
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      ORDER BY c.created_at DESC
    `);
    res.json({ success: true, data: rows || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getCycleById(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, ay.year_name 
      FROM admission_cycles c
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE c.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Cycle not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createCycle(req, res) {
  try {
    const { cycle_code, cycle_name, academic_year_id, start_date, end_date, status } = req.body;
    if (!cycle_code || !cycle_name || !academic_year_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Missing required cycle fields' });
    }

    const [result] = await pool.execute(`
      INSERT INTO admission_cycles (cycle_code, cycle_name, academic_year_id, start_date, end_date, status, created_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [cycle_code, cycle_name, academic_year_id, start_date, end_date, status || 'UPCOMING', req.user.id]);

    res.json({ success: true, message: 'Cycle created', cycleId: result.insertId });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateCycle(req, res) {
  try {
    const { cycle_code, cycle_name, academic_year_id, start_date, end_date, status } = req.body;
    await pool.execute(`
      UPDATE admission_cycles 
      SET cycle_code = ?, cycle_name = ?, academic_year_id = ?, start_date = ?, end_date = ?, status = ?
      WHERE id = ?
    `, [cycle_code, cycle_name, academic_year_id, start_date, end_date, status, req.params.id]);
    res.json({ success: true, message: 'Cycle updated' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateCycleStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['UPCOMING', 'ACTIVE', 'CLOSED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid cycle status' });
    }
    await pool.execute('UPDATE admission_cycles SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Cycle status updated' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * 3. ADMISSION PROGRAMS API
 */
export async function getPrograms(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, c.name AS course_name, c.duration_years, d.name AS department_name, d.code AS department_code,
             (p.total_seats - p.allocated_seats) AS available_seats
      FROM admission_programs p
      JOIN courses c ON p.course_id = c.id
      LEFT JOIN departments d ON c.department_id = d.id
      ORDER BY p.id DESC
    `);
    res.json({ success: true, data: rows || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getProgramById(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, c.name AS course_name, (p.total_seats - p.allocated_seats) AS available_seats
      FROM admission_programs p
      JOIN courses c ON p.course_id = c.id
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Program not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createProgram(req, res) {
  try {
    const { cycle_id, course_id, program_code, total_seats, min_12th_percentage, application_fee, annual_tuition_fee, status } = req.body;
    if (!cycle_id || !course_id || !program_code) {
      return res.status(400).json({ success: false, message: 'Missing required program fields' });
    }

    const [result] = await pool.execute(`
      INSERT INTO admission_programs (cycle_id, course_id, program_code, total_seats, min_12th_percentage, application_fee, annual_tuition_fee, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [cycle_id, course_id, program_code, total_seats || 120, min_12th_percentage || 60.00, application_fee || 1000.00, annual_tuition_fee || 125000.00, status || 'ACTIVE']);

    res.json({ success: true, message: 'Program configured', programId: result.insertId });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateProgram(req, res) {
  try {
    const { total_seats, min_12th_percentage, application_fee, annual_tuition_fee, status } = req.body;
    await pool.execute(`
      UPDATE admission_programs 
      SET total_seats = ?, min_12th_percentage = ?, application_fee = ?, annual_tuition_fee = ?, status = ?
      WHERE id = ?
    `, [total_seats, min_12th_percentage, application_fee, annual_tuition_fee, status, req.params.id]);
    res.json({ success: true, message: 'Program updated' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateProgramStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'CLOSED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid program status' });
    }
    await pool.execute('UPDATE admission_programs SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Program status updated' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * 4. APPLICANTS MASTER API
 */
export async function getApplicants(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM admission_applicants ORDER BY created_at DESC');
    res.json({ success: true, data: rows || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getApplicantById(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM admission_applicants WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Applicant profile not found' });
    
    const [apps] = await pool.query('SELECT * FROM admission_applications WHERE applicant_id = ?', [req.params.id]);
    res.json({ success: true, data: { ...rows[0], applications: apps || [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createApplicant(req, res) {
  try {
    const { email, mobile, first_name, middle_name, last_name, dob, gender, address, city, state, postal_code, parent_name, parent_relation, parent_mobile } = req.body;
    if (!email || !mobile || !first_name || !last_name) {
      return res.status(400).json({ success: false, message: 'Missing required applicant fields' });
    }

    const appCode = `APP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const [result] = await pool.execute(`
      INSERT INTO admission_applicants (applicant_code, email, mobile, first_name, middle_name, last_name, dob, gender, address, city, state, postal_code, parent_name, parent_relation, parent_mobile)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [appCode, email, mobile, first_name, middle_name || null, last_name, dob || null, gender || null, address || null, city || null, state || null, postal_code || null, parent_name || null, parent_relation || null, parent_mobile || null]);

    res.json({ success: true, message: 'Applicant profile registered', applicantId: result.insertId, applicantCode: appCode });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateApplicant(req, res) {
  try {
    const { first_name, middle_name, last_name, dob, gender, address, city, state, postal_code, parent_name, parent_relation, parent_mobile } = req.body;
    await pool.execute(`
      UPDATE admission_applicants 
      SET first_name = ?, middle_name = ?, last_name = ?, dob = ?, gender = ?, address = ?, city = ?, state = ?, postal_code = ?, parent_name = ?, parent_relation = ?, parent_mobile = ?
      WHERE id = ?
    `, [first_name, middle_name || null, last_name, dob || null, gender || null, address || null, city || null, state || null, postal_code || null, parent_name || null, parent_relation || null, parent_mobile || null, req.params.id]);
    
    res.json({ success: true, message: 'Applicant profile updated' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * 5. APPLICATIONS API
 */
export async function getApplications(req, res) {
  try {
    const { status, program_id, cycle_id, search } = req.query;
    let query = `
      SELECT a.*, ap.first_name, ap.last_name, ap.email, ap.mobile,
             p.program_code, c.name AS course_name, d.name AS department_name
      FROM admission_applications a
      JOIN admission_applicants ap ON a.applicant_id = ap.id
      LEFT JOIN admission_programs p ON a.allocated_program_id = p.id
      LEFT JOIN courses c ON p.course_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (status) { query += ' AND a.application_status = ?'; params.push(status); }
    if (program_id) { query += ' AND a.allocated_program_id = ?'; params.push(program_id); }
    if (cycle_id) { query += ' AND a.cycle_id = ?'; params.push(cycle_id); }
    if (search) {
      query += ' AND (a.application_number LIKE ? OR ap.first_name LIKE ? OR ap.last_name LIKE ? OR ap.email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY a.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getApplicationById(req, res) {
  try {
    const [apps] = await pool.query(`
      SELECT a.*, ap.first_name, ap.middle_name, ap.last_name, ap.email, ap.mobile, ap.dob, ap.gender, ap.address, ap.city, ap.state, ap.postal_code, ap.parent_name, ap.parent_relation, ap.parent_mobile,
             p.program_code, c.name AS course_name, d.name AS department_name
      FROM admission_applications a
      JOIN admission_applicants ap ON a.applicant_id = ap.id
      LEFT JOIN admission_programs p ON a.allocated_program_id = p.id
      LEFT JOIN courses c ON p.course_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE a.id = ?
    `, [req.params.id]);

    if (apps.length === 0) return res.status(404).json({ success: false, message: 'Application not found' });

    const appId = req.params.id;
    const [prefs] = await pool.query('SELECT pr.*, p.program_code, c.name AS course_name FROM admission_application_preferences pr JOIN admission_programs p ON pr.program_id = p.id JOIN courses c ON p.course_id = c.id WHERE pr.application_id = ? ORDER BY pr.preference_order ASC', [appId]);
    const [docs] = await pool.query('SELECT * FROM admission_documents WHERE application_id = ?', [appId]);
    const [interviews] = await pool.query('SELECT i.*, u.full_name AS interviewer_name FROM admission_interviews i LEFT JOIN users u ON i.interviewer_user_id = u.id WHERE i.application_id = ?', [appId]);
    const [decisions] = await pool.query('SELECT d.*, u.full_name AS decider_name FROM admission_decisions d LEFT JOIN users u ON d.decided_by_user_id = u.id WHERE d.application_id = ?', [appId]);
    const [payments] = await pool.query('SELECT * FROM admission_fee_payments WHERE application_id = ?', [appId]);
    const [history] = await pool.query('SELECT h.*, u.full_name AS performer_name FROM admission_status_history h LEFT JOIN users u ON h.performed_by_user_id = u.id WHERE h.application_id = ? ORDER BY h.created_at DESC', [appId]);

    res.json({
      success: true,
      data: {
        ...apps[0],
        preferences: prefs || [],
        documents: docs || [],
        interviews: interviews || [],
        decisions: decisions || [],
        payments: payments || [],
        history: history || []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createApplication(req, res) {
  try {
    const { applicant_id, cycle_id, department_id, school_10th, board_10th, year_10th, percentage_10th, school_12th, board_12th, year_12th, percentage_12th, entrance_exam, entrance_score, admission_category, admission_type, agreed_tuition_fee } = req.body;
    
    if (!applicant_id || !cycle_id) {
      return res.status(400).json({ success: false, message: 'applicant_id and cycle_id are required' });
    }

    const appNumber = await generateApplicationNumber();

    const [result] = await pool.execute(`
      INSERT INTO admission_applications (application_number, applicant_id, cycle_id, department_id, school_10th, board_10th, year_10th, percentage_10th, school_12th, board_12th, year_12th, percentage_12th, entrance_exam, entrance_score, admission_category, admission_type, agreed_tuition_fee, application_status, created_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?)
    `, [appNumber, applicant_id, cycle_id, department_id || null, school_10th || null, board_10th || null, year_10th || null, percentage_10th || null, school_12th || null, board_12th || null, year_12th || null, percentage_12th || null, entrance_exam || null, entrance_score || null, admission_category || 'General', admission_type || 'Regular', agreed_tuition_fee || 0.00, req.user.id]);

    const appId = result.insertId;
    await logAdmissionHistory(appId, 'Application Submitted', 'DRAFT', 'SUBMITTED', req.user.id, 'Application filed successfully');

    res.json({ success: true, message: 'Application submitted', applicationId: appId, applicationNumber: appNumber });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateApplication(req, res) {
  try {
    const { department_id, school_10th, board_10th, year_10th, percentage_10th, school_12th, board_12th, year_12th, percentage_12th, entrance_exam, entrance_score, admission_category, admission_type, agreed_tuition_fee } = req.body;
    
    await pool.execute(`
      UPDATE admission_applications 
      SET department_id = ?, school_10th = ?, board_10th = ?, year_10th = ?, percentage_10th = ?, school_12th = ?, board_12th = ?, year_12th = ?, percentage_12th = ?, entrance_exam = ?, entrance_score = ?, admission_category = ?, admission_type = ?, agreed_tuition_fee = ?, updated_by_user_id = ?
      WHERE id = ?
    `, [department_id || null, school_10th || null, board_10th || null, year_10th || null, percentage_10th || null, school_12th || null, board_12th || null, year_12th || null, percentage_12th || null, entrance_exam || null, entrance_score || null, admission_category || 'General', admission_type || 'Regular', agreed_tuition_fee || 0.00, req.user.id, req.params.id]);

    res.json({ success: true, message: 'Application updated' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateApplicationStatus(req, res) {
  try {
    const { status, remarks } = req.body;
    const appId = req.params.id;

    const validStatuses = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'SELECTED', 'WAITLISTED', 'REJECTED', 'OFFER_SENT', 'ADMISSION_CONFIRMED', 'CONVERTED_TO_STUDENT'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const [rows] = await pool.query('SELECT application_status FROM admission_applications WHERE id = ?', [appId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Application not found' });
    const prevStatus = rows[0].application_status;

    await pool.execute('UPDATE admission_applications SET application_status = ?, updated_by_user_id = ? WHERE id = ?', [status, req.user.id, appId]);
    await logAdmissionHistory(appId, `Status changed to ${status}`, prevStatus, status, req.user.id, remarks || '');

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * 6. PREFERENCES API
 */
export async function getApplicationPreferences(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT pr.*, p.program_code, c.name AS course_name
      FROM admission_application_preferences pr
      JOIN admission_programs p ON pr.program_id = p.id
      JOIN courses c ON p.course_id = c.id
      WHERE pr.application_id = ?
      ORDER BY pr.preference_order ASC
    `, [req.params.id]);
    res.json({ success: true, data: rows || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateApplicationPreferences(req, res) {
  try {
    const appId = req.params.id;
    const { preferences } = req.body; // Array of { program_id, preference_order }
    if (!Array.isArray(preferences)) return res.status(400).json({ success: false, message: 'Preferences must be an array' });

    const [appRows] = await pool.query('SELECT cycle_id FROM admission_applications WHERE id = ?', [appId]);
    if (appRows.length === 0) return res.status(404).json({ success: false, message: 'Application not found' });
    const cycleId = appRows[0].cycle_id;

    for (const pref of preferences) {
      const [progRows] = await pool.query('SELECT cycle_id FROM admission_programs WHERE id = ?', [pref.program_id]);
      if (progRows.length === 0 || progRows[0].cycle_id !== cycleId) {
        return res.status(400).json({ success: false, message: `Program ID ${pref.program_id} does not belong to cycle ID ${cycleId}` });
      }
    }

    await pool.query('DELETE FROM admission_application_preferences WHERE application_id = ?', [appId]);
    for (const pref of preferences) {
      await pool.execute(
        'INSERT INTO admission_application_preferences (application_id, program_id, preference_order) VALUES (?, ?, ?)',
        [appId, pref.program_id, pref.preference_order]
      );
    }

    res.json({ success: true, message: 'Program preferences updated' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * 7. DOCUMENTS API
 */
export async function getApplicationDocuments(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM admission_documents WHERE application_id = ?', [req.params.id]);
    res.json({ success: true, data: rows || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function uploadApplicationDocument(req, res) {
  try {
    const appId = req.params.id;
    const { document_type, original_filename, storage_path, mime_type, file_size_bytes, checksum_sha256 } = req.body;
    
    if (!document_type || !original_filename || !storage_path) {
      return res.status(400).json({ success: false, message: 'Missing document metadata' });
    }

    const [result] = await pool.execute(`
      INSERT INTO admission_documents (application_id, document_type, original_filename, storage_path, mime_type, file_size_bytes, checksum_sha256, verification_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')
    `, [appId, document_type, original_filename, storage_path, mime_type || 'application/pdf', file_size_bytes || 0, checksum_sha256 || null]);

    await pool.execute("UPDATE admission_applications SET document_status = 'UNDER_VERIFICATION' WHERE id = ?", [appId]);
    res.json({ success: true, message: 'Document uploaded', documentId: result.insertId });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function verifyDocument(req, res) {
  try {
    const { status, remarks } = req.body; // VERIFIED or REJECTED
    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be VERIFIED or REJECTED' });
    }

    await pool.execute(`
      UPDATE admission_documents 
      SET verification_status = ?, verified_by_user_id = ?, verification_date = NOW(), remarks = ?
      WHERE id = ?
    `, [status, req.user.id, remarks || null, req.params.docId]);

    res.json({ success: true, message: `Document marked ${status}` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * 8. ELIGIBILITY VERIFICATION API
 */
export async function verifyEligibility(req, res) {
  try {
    const appId = req.params.id;
    const [apps] = await pool.query('SELECT percentage_12th, allocated_program_id FROM admission_applications WHERE id = ?', [appId]);
    if (apps.length === 0) return res.status(404).json({ success: false, message: 'Application not found' });
    
    const app = apps[0];
    let isEligible = false;

    if (app.allocated_program_id) {
      const [progs] = await pool.query('SELECT min_12th_percentage FROM admission_programs WHERE id = ?', [app.allocated_program_id]);
      if (progs.length > 0 && Number(app.percentage_12th || 0) >= Number(progs[0].min_12th_percentage)) {
        isEligible = true;
      }
    } else {
      isEligible = Number(app.percentage_12th || 0) >= 60.00;
    }

    const newStatus = isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE';
    await pool.execute('UPDATE admission_applications SET eligibility_status = ? WHERE id = ?', [newStatus, appId]);
    await logAdmissionHistory(appId, `Eligibility evaluated: ${newStatus}`, null, newStatus, req.user.id, `12th score: ${app.percentage_12th}%`);

    res.json({ success: true, isEligible, eligibilityStatus: newStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * 9. INTERVIEWS API
 */
export async function getInterviews(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, a.application_number, ap.first_name, ap.last_name, u.full_name AS interviewer_name
      FROM admission_interviews i
      JOIN admission_applications a ON i.application_id = a.id
      JOIN admission_applicants ap ON a.applicant_id = ap.id
      LEFT JOIN users u ON i.interviewer_user_id = u.id
      ORDER BY i.scheduled_date ASC
    `);
    res.json({ success: true, data: rows || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function scheduleInterview(req, res) {
  try {
    const { application_id, interviewer_user_id, scheduled_date, mode, location_or_link } = req.body;
    if (!application_id || !interviewer_user_id || !scheduled_date) {
      return res.status(400).json({ success: false, message: 'Missing required interview fields' });
    }

    const [result] = await pool.execute(`
      INSERT INTO admission_interviews (application_id, interviewer_user_id, scheduled_date, mode, location_or_link, status, created_by_user_id)
      VALUES (?, ?, ?, ?, ?, 'SCHEDULED', ?)
    `, [application_id, interviewer_user_id, scheduled_date, mode || 'OFFLINE', location_or_link || null, req.user.id]);

    res.json({ success: true, message: 'Interview scheduled', interviewId: result.insertId });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateInterview(req, res) {
  try {
    const { score, feedback } = req.body;
    await pool.execute(`
      UPDATE admission_interviews 
      SET score = ?, feedback = ?, status = 'COMPLETED'
      WHERE id = ?
    `, [score || null, feedback || null, req.params.id]);
    res.json({ success: true, message: 'Interview evaluation updated' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateInterviewStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid interview status' });
    }
    await pool.execute('UPDATE admission_interviews SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Interview status updated' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * 10. DECISIONS API
 */
export async function submitDecision(req, res) {
  try {
    const appId = req.params.id;
    const { decision, allocated_program_id, quota_category, remarks } = req.body;
    if (!['SELECTED', 'WAITLISTED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Decision must be SELECTED, WAITLISTED, or REJECTED' });
    }

    const [result] = await pool.execute(`
      INSERT INTO admission_decisions (application_id, decision, decided_by_user_id, allocated_program_id, quota_category, remarks)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [appId, decision, req.user.id, allocated_program_id || null, quota_category || 'General', remarks || null]);

    const newAppStatus = decision === 'SELECTED' ? 'SELECTED' : decision === 'WAITLISTED' ? 'WAITLISTED' : 'REJECTED';
    await pool.execute(`
      UPDATE admission_applications 
      SET application_status = ?, allocated_program_id = COALESCE(?, allocated_program_id), updated_by_user_id = ?
      WHERE id = ?
    `, [newAppStatus, allocated_program_id || null, req.user.id, appId]);

    await logAdmissionHistory(appId, `Committee decision: ${decision}`, null, newAppStatus, req.user.id, remarks || '');
    res.json({ success: true, message: `Decision recorded: ${decision}`, decisionId: result.insertId });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function getApplicationDecisions(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT d.*, u.full_name AS decider_name, p.program_code
      FROM admission_decisions d
      LEFT JOIN users u ON d.decided_by_user_id = u.id
      LEFT JOIN admission_programs p ON d.allocated_program_id = p.id
      WHERE d.application_id = ?
    `, [req.params.id]);
    res.json({ success: true, data: rows || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * 11. COUNTER FEE PAYMENTS API
 */
export async function getApplicationPayments(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM admission_fee_payments WHERE application_id = ?', [req.params.id]);
    res.json({ success: true, data: rows || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function recordPayment(req, res) {
  try {
    const appId = req.params.id;
    const { amount, payment_method, transaction_id, applicant_name } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount required' });
    }

    const validMethods = ['ONLINE', 'BANK_TRANSFER', 'CARD', 'UPI', 'CASH', 'CHEQUE'];
    const pMethod = (payment_method || 'CASH').toUpperCase();
    if (!validMethods.includes(pMethod)) {
      return res.status(400).json({ success: false, message: `Invalid payment method '${payment_method}'. Must be one of: ${validMethods.join(', ')}` });
    }

    const receiptNumber = `REC-ADM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const txId = transaction_id || `TXN-ADM-${Date.now()}`;

    const [result] = await pool.execute(`
      INSERT INTO admission_fee_payments (application_id, applicant_name, receipt_number, transaction_id, amount, payment_method, payment_status, created_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, 'PAID', ?)
    `, [appId, applicant_name || 'Applicant Candidate', receiptNumber, txId, amount, pMethod, req.user.id]);

    // Recalculate paid_amount aggregate on application
    const [sumRes] = await pool.query('SELECT COALESCE(SUM(amount), 0.00) AS total_paid FROM admission_fee_payments WHERE application_id = ? AND payment_status = "PAID"', [appId]);
    const newPaidAmount = sumRes[0]?.total_paid || 0.00;

    const [appRows] = await pool.query('SELECT agreed_tuition_fee, application_status FROM admission_applications WHERE id = ?', [appId]);
    const app = appRows[0];
    const newFeeStatus = newPaidAmount >= app.agreed_tuition_fee ? 'PAID' : newPaidAmount > 0 ? 'PARTIALLY_PAID' : 'FEE_PENDING';

    await pool.execute('UPDATE admission_applications SET paid_amount = ?, fee_status = ? WHERE id = ?', [newPaidAmount, newFeeStatus, appId]);
    await logAdmissionHistory(appId, `Payment of ₹${amount} recorded`, null, app.application_status, req.user.id, `Receipt: ${receiptNumber}`);

    res.json({ success: true, message: 'Payment recorded', paymentId: result.insertId, receiptNumber, totalPaid: newPaidAmount });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * 12. STUDENT ENROLMENT CONVERSION API
 */
export async function convertToStudent(req, res) {
  const appId = req.params.id;
  await pool.query('START TRANSACTION');

  try {
    // 1. Lock Application Row
    const [apps] = await pool.query(
      'SELECT * FROM admission_applications WHERE id = ? FOR UPDATE',
      [appId]
    );
    const app = apps[0];
    if (!app) {
      throw new Error('Application record not found');
    }
    if (app.application_status !== 'ADMISSION_CONFIRMED') {
      throw new Error(`Application status must be ADMISSION_CONFIRMED to convert (current status: ${app.application_status})`);
    }
    if (app.enrolled_student_id) {
      throw new Error('Application has already been converted to an enrolled student.');
    }

    // 2. Lock Program & Check Capacity
    if (app.allocated_program_id) {
      const [progs] = await pool.query(
        'SELECT total_seats, allocated_seats FROM admission_programs WHERE id = ? FOR UPDATE',
        [app.allocated_program_id]
      );
      const prog = progs[0];
      if (prog && prog.allocated_seats >= prog.total_seats) {
        throw new Error(`Seat capacity full for allocated program (${prog.allocated_seats}/${prog.total_seats}).`);
      }
    }

    // 3. Lock Applicant Profile
    const [applicants] = await pool.query(
      'SELECT * FROM admission_applicants WHERE id = ? FOR UPDATE',
      [app.applicant_id]
    );
    const applicant = applicants[0];
    if (!applicant) {
      throw new Error('Applicant master profile missing');
    }

    // 4. Check Duplicate User
    const [existingUser] = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?) FOR UPDATE',
      [applicant.email, applicant.email]
    );
    if (existingUser.length > 0) {
      throw new Error(`User account already exists with email '${applicant.email}'`);
    }

    // 5. Dynamic Student Role Resolution
    const [studentRole] = await pool.query("SELECT id FROM roles WHERE LOWER(name) = 'student' LIMIT 1");
    const roleId = studentRole[0]?.id;
    if (!roleId) throw new Error('Student role definition missing in system.');

    // 6. Cryptographically Secure Credential Generation
    const rawPass = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(rawPass, 10);

    // 7. Insert into Users Table
    const [userResult] = await pool.query(
      `INSERT INTO users (username, email, password, role_id, full_name, first_name, last_name, phone, must_change_password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [applicant.email, applicant.email, hashedPassword, roleId, `${applicant.first_name} ${applicant.last_name}`, applicant.first_name, applicant.last_name, applicant.mobile]
    );
    const newUserId = userResult.insertId;

    // 8. Atomic Concurrency-Safe Roll Number Sequence Generation
    const [deptCodeRow] = await pool.query('SELECT code FROM departments WHERE id = ?', [app.department_id]);
    const deptCode = deptCodeRow[0]?.code || 'GEN';
    const yearSuffix = new Date().getFullYear().toString().slice(-2);
    const seqName = `ROLL_${yearSuffix}_${deptCode}`;

    await pool.query(
      `INSERT INTO admission_sequences (sequence_name, current_value) 
       VALUES (?, 1) 
       ON DUPLICATE KEY UPDATE current_value = LAST_INSERT_ID(current_value + 1)`,
      [seqName]
    );
    const [seqResult] = await pool.query('SELECT LAST_INSERT_ID() AS seq_num');
    const seqNum = seqResult[0]?.seq_num || 1;
    const rollNumber = `${yearSuffix}${deptCode}${String(seqNum).padStart(3, '0')}`;

    // 9. Insert into Students Table
    const [studentResult] = await pool.query(
      `INSERT INTO students (user_id, admission_number, roll_number, first_name, last_name, name, email, phone, department_id, batch_year, academic_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, YEAR(CURRENT_DATE), 'ACTIVE')`,
      [newUserId, app.application_number, rollNumber, applicant.first_name, applicant.last_name, `${applicant.first_name} ${applicant.last_name}`, applicant.email, applicant.mobile, app.department_id]
    );
    const newStudentId = studentResult.insertId;

    // 10. Insert into Student Fee Accounts Table
    const [feeAccResult] = await pool.query(
      `INSERT INTO student_fee_accounts (student_id, total_charges, total_paid, outstanding_balance, status)
       VALUES (?, ?, ?, ?, ?)`,
      [newStudentId, app.agreed_tuition_fee, app.paid_amount, (app.agreed_tuition_fee - app.paid_amount), (app.paid_amount >= app.agreed_tuition_fee ? 'PAID' : 'PARTIALLY_PAID')]
    );
    const newFeeAccountId = feeAccResult.insertId;

    // 11. Validate & Post Unposted Counter Payments to ERP Payments Table
    const [unpostedPayments] = await pool.query(
      'SELECT * FROM admission_fee_payments WHERE application_id = ? AND posted_to_erp_payment_id IS NULL',
      [appId]
    );

    const validMethods = ['ONLINE', 'BANK_TRANSFER', 'CARD', 'UPI', 'CASH', 'CHEQUE'];

    for (const pay of unpostedPayments) {
      const pMethod = pay.payment_method?.toUpperCase();
      if (!validMethods.includes(pMethod)) {
        throw new Error(`Invalid payment method '${pay.payment_method}' recorded in receipt ${pay.receipt_number}. Must be one of: ${validMethods.join(', ')}`);
      }

      const [erpPayResult] = await pool.query(
        `INSERT INTO payments (receipt_number, student_id, student_fee_account_id, amount, payment_method, transaction_reference, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS', ?)`,
        [pay.receipt_number, newStudentId, newFeeAccountId, pay.amount, pMethod, pay.transaction_id, req.user.id]
      );
      await pool.query(
        'UPDATE admission_fee_payments SET posted_to_erp_payment_id = ? WHERE id = ?',
        [erpPayResult.insertId, pay.id]
      );
    }

    // 12. Update Application Record & Increment Seat Count
    await pool.query(
      `UPDATE admission_applications 
       SET enrolled_student_id = ?, application_status = 'CONVERTED_TO_STUDENT', updated_by_user_id = ? 
       WHERE id = ?`,
      [newStudentId, req.user.id, appId]
    );

    if (app.allocated_program_id) {
      await pool.query(
        'UPDATE admission_programs SET allocated_seats = allocated_seats + 1 WHERE id = ?',
        [app.allocated_program_id]
      );
    }

    // 13. Audit Log
    await logAdmissionHistory(appId, 'Converted to Enrolled Student', 'ADMISSION_CONFIRMED', 'CONVERTED_TO_STUDENT', req.user.id, `Enrolled student ID: ${newStudentId}, Roll: ${rollNumber}`);

    // Commit Transaction
    await pool.query('COMMIT');
    res.json({ success: true, message: 'Student converted successfully', studentId: newStudentId, rollNumber });

  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  }
}
