import pool from '../db.js';
import bcrypt from 'bcryptjs';

/**
 * Helper to log admission history
 */
async function logAdmissionHistory(applicationId, action, previousStatus, newStatus, performedBy, remarks = '') {
  try {
    await pool.execute(
      `INSERT INTO admission_history (application_id, action, previous_status, new_status, performed_by, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [applicationId, action, previousStatus || null, newStatus || null, performedBy || 'Admission Officer', remarks]
    );
  } catch (err) {
    console.error('[ADMISSION HISTORY LOG ERROR]', err.message);
  }
}

/**
 * GET /api/admission/dashboard-stats
 */
export async function getDashboardStats(req, res) {
  try {
    const [counts] = await pool.execute(`
      SELECT 
        COUNT(*) as totalApplications,
        SUM(CASE WHEN application_status = 'Submitted' OR application_status = 'Draft' THEN 1 ELSE 0 END) as newApplications,
        SUM(CASE WHEN application_status = 'Under Review' THEN 1 ELSE 0 END) as underReview,
        SUM(CASE WHEN document_status = 'Pending' OR document_status = 'Resubmission Required' THEN 1 ELSE 0 END) as documentsPending,
        SUM(CASE WHEN eligibility_status = 'Eligible' THEN 1 ELSE 0 END) as eligibleStudents,
        SUM(CASE WHEN application_status = 'Selected' THEN 1 ELSE 0 END) as selectedStudents,
        SUM(CASE WHEN fee_status = 'Pending' OR fee_status = 'Partially Paid' THEN 1 ELSE 0 END) as feePending,
        SUM(CASE WHEN application_status = 'Admission Confirmed' OR application_status = 'Enrolled' THEN 1 ELSE 0 END) as confirmedAdmissions,
        SUM(CASE WHEN application_status = 'Cancelled' THEN 1 ELSE 0 END) as cancelledAdmissions,
        SUM(CASE WHEN application_status = 'Rejected' THEN 1 ELSE 0 END) as rejectedApplications
      FROM applications
    `);

    const stats = counts[0] || {};

    const [recent] = await pool.execute(`
      SELECT id, application_number, applicant_name, course_name, department_name, 
             application_status, document_status, eligibility_status, fee_status, created_at
      FROM applications
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const [courseStats] = await pool.execute(`
      SELECT course_name, COUNT(*) as count 
      FROM applications 
      GROUP BY course_name 
      LIMIT 6
    `);

    const [statusStats] = await pool.execute(`
      SELECT application_status as status, COUNT(*) as count 
      FROM applications 
      GROUP BY application_status
    `);

    const [deptStats] = await pool.execute(`
      SELECT department_name, COUNT(*) as count 
      FROM applications 
      WHERE application_status IN ('Admission Confirmed', 'Enrolled')
      GROUP BY department_name
    `);

    return res.json({
      success: true,
      data: {
        summary: {
          totalApplications: Number(stats.totalApplications || 0),
          newApplications: Number(stats.newApplications || 0),
          underReview: Number(stats.underReview || 0),
          documentsPending: Number(stats.documentsPending || 0),
          eligibleStudents: Number(stats.eligibleStudents || 0),
          selectedStudents: Number(stats.selectedStudents || 0),
          feePending: Number(stats.feePending || 0),
          confirmedAdmissions: Number(stats.confirmedAdmissions || 0),
          cancelledAdmissions: Number(stats.cancelledAdmissions || 0),
          rejectedApplications: Number(stats.rejectedApplications || 0)
        },
        recentApplications: recent,
        charts: {
          byCourse: courseStats,
          byStatus: statusStats,
          byDepartment: deptStats
        }
      }
    });
  } catch (error) {
    console.error('[ADMISSION DASHBOARD ERROR]', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admission dashboard stats' });
  }
}

/**
 * GET /api/admission/applications
 * Filterable, searchable list of applications
 */
export async function getApplications(req, res) {
  try {
    const {
      search,
      course_name,
      department_name,
      application_status,
      document_status,
      eligibility_status,
      fee_status,
      admission_type,
      from_date,
      to_date
    } = req.query;

    let sql = `SELECT * FROM applications WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (application_number LIKE ? OR applicant_name LIKE ? OR email LIKE ? OR mobile LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (course_name && course_name !== 'All') {
      sql += ` AND course_name = ?`;
      params.push(course_name);
    }

    if (department_name && department_name !== 'All') {
      sql += ` AND department_name = ?`;
      params.push(department_name);
    }

    if (application_status && application_status !== 'All') {
      sql += ` AND application_status = ?`;
      params.push(application_status);
    }

    if (document_status && document_status !== 'All') {
      sql += ` AND document_status = ?`;
      params.push(document_status);
    }

    if (eligibility_status && eligibility_status !== 'All') {
      sql += ` AND eligibility_status = ?`;
      params.push(eligibility_status);
    }

    if (fee_status && fee_status !== 'All') {
      sql += ` AND fee_status = ?`;
      params.push(fee_status);
    }

    if (admission_type && admission_type !== 'All') {
      sql += ` AND admission_type = ?`;
      params.push(admission_type);
    }

    if (from_date) {
      sql += ` AND created_at >= ?`;
      params.push(`${from_date} 00:00:00`);
    }

    if (to_date) {
      sql += ` AND created_at <= ?`;
      params.push(`${to_date} 23:59:59`);
    }

    sql += ` ORDER BY created_at DESC LIMIT 200`;

    const [rows] = await pool.execute(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[GET APPLICATIONS ERROR]', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve applications list' });
  }
}

/**
 * GET /api/admission/applications/:id
 */
export async function getApplicationById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`SELECT * FROM applications WHERE id = ? OR application_number = ?`, [id, id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application record not found' });
    }

    const application = rows[0];

    let docs = [];
    try {
      const [dRows] = await pool.execute(`SELECT * FROM applicant_documents WHERE application_id = ? ORDER BY id ASC`, [application.id]);
      docs = dRows;
    } catch (dErr) {
      console.warn('[DOCS FETCH NOTICE]', dErr.message);
    }

    // Auto-repair / backfill applicant_documents if empty or missing file_path data
    if (!docs || docs.length === 0) {
      const reqDocs = [
        { name: 'Photograph', path: application.photo_data || application.photo_name || null },
        { name: '10th Marksheet Proof', path: application.proof_10th_data || application.proof_10th_name || null },
        { name: '12th Marksheet Proof', path: application.proof_12th_data || application.proof_12th_name || null },
        { name: 'Identity Proof (Aadhaar / Passport)', path: null },
        { name: 'Entrance Scorecard Proof', path: application.proof_entrance_data || (application.entrance_score ? `Score: ${application.entrance_score}` : null) }
      ];

      for (const doc of reqDocs) {
        try {
          const [insRes] = await pool.execute(
            `INSERT INTO applicant_documents (application_id, document_name, file_path, verification_status) VALUES (?, ?, ?, ?)`,
            [application.id, doc.name, doc.path, doc.path ? 'Uploaded' : 'Not Uploaded']
          );
          docs.push({
            id: insRes.insertId,
            application_id: application.id,
            document_name: doc.name,
            file_path: doc.path,
            verification_status: doc.path ? 'Uploaded' : 'Not Uploaded'
          });
        } catch (insErr) {
          console.warn('[DOC BACKFILL NOTICE]', insErr.message);
        }
      }
    } else {
      // Sync file_path from application columns if doc.file_path in applicant_documents is truncated or missing
      for (const doc of docs) {
        const nameLower = (doc.document_name || '').toLowerCase();
        let updatedPath = null;
        if (nameLower.includes('photo') && (!doc.file_path || !doc.file_path.startsWith('data:')) && application.photo_data) {
          updatedPath = application.photo_data;
        } else if (nameLower.includes('10th') && (!doc.file_path || !doc.file_path.startsWith('data:')) && application.proof_10th_data) {
          updatedPath = application.proof_10th_data;
        } else if (nameLower.includes('12th') && (!doc.file_path || !doc.file_path.startsWith('data:')) && application.proof_12th_data) {
          updatedPath = application.proof_12th_data;
        } else if (nameLower.includes('entrance') && (!doc.file_path || !doc.file_path.startsWith('data:')) && application.proof_entrance_data) {
          updatedPath = application.proof_entrance_data;
        }

        if (updatedPath) {
          doc.file_path = updatedPath;
          try {
            await pool.execute(`UPDATE applicant_documents SET file_path = ? WHERE id = ?`, [updatedPath, doc.id]);
          } catch (uErr) {
            // Ignored
          }
        }
      }
    }

    let seatAllocation = null;
    try {
      const [sRows] = await pool.execute(`SELECT * FROM seat_allocations WHERE application_id = ? ORDER BY id DESC LIMIT 1`, [application.id]);
      seatAllocation = sRows[0] || null;
    } catch (sErr) {
      console.warn('[SEAT ALLOC FETCH NOTICE]', sErr.message);
    }

    let payments = [];
    try {
      const [pRows] = await pool.execute(`SELECT * FROM admission_fee_payments WHERE application_id = ? ORDER BY id DESC`, [application.id]);
      payments = pRows;
    } catch (pErr) {
      console.warn('[PAYMENTS FETCH NOTICE]', pErr.message);
    }

    let history = [];
    try {
      const [hRows] = await pool.execute(`SELECT * FROM admission_history WHERE application_id = ? ORDER BY id DESC`, [application.id]);
      history = hRows;
    } catch (hErr) {
      console.warn('[HISTORY FETCH NOTICE]', hErr.message);
    }

    return res.json({
      success: true,
      data: {
        ...application,
        documents: docs,
        seatAllocation,
        payments,
        history
      }
    });
  } catch (error) {
    console.error('[GET APPLICATION BY ID ERROR]', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to retrieve application details' });
  }
}

/**
 * POST /api/admission/applications
 * Create Application with Duplicate Check
 */
export async function createApplication(req, res) {
  try {
    const {
      first_name,
      last_name,
      dob,
      gender,
      mobile,
      email,
      address,
      city,
      state,
      country,
      postal_code,
      parent_name,
      parent_relation,
      parent_mobile,
      parent_email,
      parent_occupation,
      parent_address,
      school_10th,
      board_10th,
      year_10th,
      percentage_10th,
      school_12th,
      board_12th,
      year_12th,
      percentage_12th,
      diploma_details,
      entrance_exam,
      entrance_rank,
      entrance_score,
      course_id,
      course_name,
      department_name,
      admission_category,
      admission_type,
      remarks
    } = req.body;

    if (!first_name || !last_name || !email || !mobile || !course_name || percentage_10th == null || percentage_12th == null) {
      return res.status(400).json({
        success: false,
        message: 'First Name, Last Name, Email, Mobile, Course Name, 10th Percentage, and 12th Percentage are all required.'
      });
    }

    // 1. DUPLICATE APPLICATION CHECK
    const [existing] = await pool.execute(
      `SELECT id, application_number, applicant_name, course_name, application_status 
       FROM applications 
       WHERE LOWER(email) = ? OR mobile = ?`,
      [email.trim().toLowerCase(), mobile.trim()]
    );

    if (existing.length > 0) {
      const match = existing[0];
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: `Possible existing application detected: ${match.application_number} for ${match.applicant_name} (${match.course_name} - ${match.application_status}).`,
        existingApplication: match
      });
    }

    // Generate Application Number e.g. ADM-2026-00125
    const [countRow] = await pool.execute(`SELECT COUNT(*) as total FROM applications`);
    const nextNum = (countRow[0]?.total || 0) + 101;
    const applicationNumber = `ADM-2026-${String(nextNum).padStart(5, '0')}`;
    const fullName = `${first_name.trim()} ${last_name ? last_name.trim() : ''}`.trim();

    const [result] = await pool.execute(
      `INSERT INTO applications (
        application_number, applicant_name, first_name, last_name, dob, gender, mobile, email,
        address, city, state, country, postal_code,
        parent_name, parent_relation, parent_mobile, parent_email, parent_occupation, parent_address,
        school_10th, board_10th, year_10th, percentage_10th,
        school_12th, board_12th, year_12th, percentage_12th, diploma_details,
        entrance_exam, entrance_rank, entrance_score,
        course_id, course_name, department_name, admission_category, admission_type,
        application_status, document_status, eligibility_status, fee_status, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', 'Pending', 'Pending', 'Pending', ?)`,
      [
        applicationNumber, fullName, first_name.trim(), last_name ? last_name.trim() : null, dob || null, gender || 'Male', mobile.trim(), email.trim().toLowerCase(),
        address || null, city || null, state || null, country || 'India', postal_code || null,
        parent_name || null, parent_relation || 'Parent', parent_mobile || null, parent_email || null, parent_occupation || null, parent_address || null,
        school_10th || null, board_10th || null, year_10th || null, percentage_10th || null,
        school_12th || null, board_12th || null, year_12th || null, percentage_12th || null, diploma_details || null,
        entrance_exam || null, entrance_rank || null, entrance_score || null,
        course_id || null, course_name, department_name || 'Engineering', admission_category || 'General', admission_type || 'Regular',
        remarks || 'Application submitted via Admission Office portal'
      ]
    );

    const appId = result.insertId;

    // Seed required default documents for verification with proof file paths if uploaded
    const {
      photo_name,
      photo_data,
      proof_10th_name,
      proof_10th_data,
      proof_12th_name,
      proof_12th_data,
      proof_entrance_name,
      proof_entrance_data
    } = req.body;

    // Update proof & photo columns in applications table if provided
    try {
      await pool.execute(
        `UPDATE applications SET 
          photo_name = COALESCE(?, photo_name),
          photo_data = COALESCE(?, photo_data),
          proof_10th_name = COALESCE(?, proof_10th_name),
          proof_10th_data = COALESCE(?, proof_10th_data),
          proof_12th_name = COALESCE(?, proof_12th_name),
          proof_12th_data = COALESCE(?, proof_12th_data),
          proof_entrance_name = COALESCE(?, proof_entrance_name),
          proof_entrance_data = COALESCE(?, proof_entrance_data)
        WHERE id = ?`,
        [
          photo_name || null, photo_data || null,
          proof_10th_name || null, proof_10th_data || null,
          proof_12th_name || null, proof_12th_data || null,
          proof_entrance_name || null, proof_entrance_data || null,
          appId
        ]
      );
    } catch (pErr) {
      console.warn('[PROOF DATA UPDATE NOTICE]', pErr.message);
    }

    const reqDocs = [
      { name: 'Photograph', path: photo_data || photo_name || null },
      { name: 'Identity Proof (Aadhaar / Passport)', path: null },
      { name: '10th Marksheet Proof', path: proof_10th_data || proof_10th_name || null },
      { name: '12th Marksheet Proof', path: proof_12th_data || proof_12th_name || null },
      { name: 'Entrance Scorecard Proof', path: proof_entrance_data || proof_entrance_name || null },
      { name: 'Transfer Certificate (TC)', path: null },
      { name: 'Conduct Certificate', path: null }
    ];

    for (const doc of reqDocs) {
      await pool.execute(
        `INSERT INTO applicant_documents (application_id, document_name, file_path, verification_status) VALUES (?, ?, ?, ?)`,
        [appId, doc.name, doc.path, doc.path ? 'Uploaded' : 'Not Uploaded']
      );
    }

    // Audit History Log
    const officerName = req.user?.full_name || req.user?.username || 'Admission Officer';
    await logAdmissionHistory(appId, 'Application Submitted', null, 'Submitted', officerName, 'Initial application submitted & recorded.');

    return res.status(201).json({
      success: true,
      message: `Application ${applicationNumber} created successfully!`,
      data: {
        id: appId,
        application_number: applicationNumber,
        applicant_name: fullName,
        status: 'Submitted'
      }
    });
  } catch (error) {
    console.error('[CREATE APPLICATION ERROR]', error);
    return res.status(500).json({ success: false, message: 'Failed to create application record' });
  }
}

/**
 * PUT /api/admission/applications/:id/status
 * Update application workflow status
 */
export async function updateApplicationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const [appRows] = await pool.execute(`SELECT * FROM applications WHERE id = ?`, [id]);
    if (appRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const app = appRows[0];
    const prevStatus = app.application_status;

    // Validation Guard: Cannot confirm admission if fee pending or docs unverified
    if (status === 'Admission Confirmed' || status === 'Enrolled') {
      if (app.fee_status !== 'Paid') {
        return res.status(400).json({
          success: false,
          message: 'Admission cannot be confirmed because required fee payment is still pending.'
        });
      }
      if (app.document_status !== 'Verified') {
        return res.status(400).json({
          success: false,
          message: 'Admission cannot be confirmed because mandatory documents are still pending verification.'
        });
      }
    }

    await pool.execute(
      `UPDATE applications SET application_status = ?, remarks = COALESCE(?, remarks) WHERE id = ?`,
      [status, remarks || null, id]
    );

    const officerName = req.user?.full_name || req.user?.username || 'Admission Officer';
    await logAdmissionHistory(id, `Status updated to ${status}`, prevStatus, status, officerName, remarks || '');

    return res.json({
      success: true,
      message: `Application status updated from ${prevStatus} to ${status}.`
    });
  } catch (error) {
    console.error('[UPDATE APPLICATION STATUS ERROR]', error);
    return res.status(500).json({ success: false, message: 'Failed to update application status' });
  }
}

/**
 * DELETE /api/admission/applications/:id
 * Permanently delete application record and associated data
 */
export async function deleteApplication(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT id, application_number, applicant_name FROM applications WHERE id = ? OR application_number = ?`,
      [id, id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application record not found' });
    }

    const app = rows[0];

    try {
      await pool.execute(`DELETE FROM applicant_documents WHERE application_id = ?`, [app.id]);
      await pool.execute(`DELETE FROM seat_allocations WHERE application_id = ?`, [app.id]);
      await pool.execute(`DELETE FROM admission_fee_payments WHERE application_id = ?`, [app.id]);
      await pool.execute(`DELETE FROM admission_history WHERE application_id = ?`, [app.id]);
    } catch (subErr) {
      console.warn('[CASCADE DELETE SUB-RECORDS NOTICE]', subErr.message);
    }

    await pool.execute(`DELETE FROM applications WHERE id = ?`, [app.id]);

    return res.json({
      success: true,
      message: `Application ${app.application_number} for "${app.applicant_name}" permanently deleted.`
    });
  } catch (error) {
    console.error('[DELETE APPLICATION ERROR]', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete application' });
  }
}

/**
 * POST /api/admission/documents/:docId/verify
 */
export async function verifyDocument(req, res) {
  try {
    const { docId } = req.params;
    const { verification_status, remarks } = req.body;

    if (!verification_status) {
      return res.status(400).json({ success: false, message: 'Verification status is required' });
    }

    const officerName = req.user?.full_name || req.user?.username || 'Admission Officer';

    const [docRows] = await pool.execute(`SELECT * FROM applicant_documents WHERE id = ?`, [docId]);
    if (docRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document record not found' });
    }

    const doc = docRows[0];

    await pool.execute(
      `UPDATE applicant_documents 
       SET verification_status = ?, verified_by = ?, verification_date = NOW(), remarks = COALESCE(?, remarks)
       WHERE id = ?`,
      [verification_status, officerName, remarks || null, docId]
    );

    // Update parent application's overall document_status
    const [allDocs] = await pool.execute(`SELECT verification_status FROM applicant_documents WHERE application_id = ?`, [doc.application_id]);
    const statuses = allDocs.map(d => d.verification_status);
    
    let overallDocStatus = 'Under Review';
    if (statuses.every(s => s === 'Verified')) {
      overallDocStatus = 'Verified';
    } else if (statuses.some(s => s === 'Rejected' || s === 'Resubmission Required')) {
      overallDocStatus = 'Rejected';
    }

    await pool.execute(
      `UPDATE applications SET document_status = ? WHERE id = ?`,
      [overallDocStatus, doc.application_id]
    );

    await logAdmissionHistory(
      doc.application_id,
      `Document "${doc.document_name}" ${verification_status}`,
      doc.verification_status,
      verification_status,
      officerName,
      remarks || ''
    );

    return res.json({
      success: true,
      message: `Document "${doc.document_name}" marked as ${verification_status}. Overall document status: ${overallDocStatus}.`
    });
  } catch (error) {
    console.error('[VERIFY DOCUMENT ERROR]', error);
    return res.status(500).json({ success: false, message: 'Failed to verify document' });
  }
}

/**
 * POST /api/admission/documents/:docId/upload
 * Allows officer to upload/replace real PDF file for an applicant document
 */
export async function uploadDocumentFile(req, res) {
  try {
    const { docId } = req.params;
    const { file_path } = req.body;

    if (!file_path) {
      return res.status(400).json({ success: false, message: 'File data is required' });
    }

    const officerName = req.user?.full_name || req.user?.username || 'Admission Officer';

    const [docRows] = await pool.execute(`SELECT * FROM applicant_documents WHERE id = ?`, [docId]);
    if (docRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document record not found' });
    }

    const doc = docRows[0];

    await pool.execute(
      `UPDATE applicant_documents 
       SET file_path = ?, verification_status = 'Uploaded', verified_by = ?, verification_date = NOW(), remarks = 'Real PDF Document file attached'
       WHERE id = ?`,
      [file_path, officerName, docId]
    );

    // Sync corresponding column in applications table
    const docNameLower = (doc.document_name || '').toLowerCase();
    if (docNameLower.includes('photo')) {
      await pool.execute(`UPDATE applications SET photo_data = ? WHERE id = ?`, [file_path, doc.application_id]);
    } else if (docNameLower.includes('10th')) {
      await pool.execute(`UPDATE applications SET proof_10th_data = ? WHERE id = ?`, [file_path, doc.application_id]);
    } else if (docNameLower.includes('12th')) {
      await pool.execute(`UPDATE applications SET proof_12th_data = ? WHERE id = ?`, [file_path, doc.application_id]);
    } else if (docNameLower.includes('entrance')) {
      await pool.execute(`UPDATE applications SET proof_entrance_data = ? WHERE id = ?`, [file_path, doc.application_id]);
    }

    await logAdmissionHistory(
      doc.application_id,
      `Document "${doc.document_name}" File Uploaded`,
      doc.verification_status,
      'Uploaded',
      officerName,
      'Real PDF Document uploaded & saved to record'
    );

    return res.json({
      success: true,
      message: `PDF document file for "${doc.document_name}" uploaded & saved successfully!`
    });
  } catch (error) {
    console.error('[UPLOAD DOC FILE ERROR]', error);
    return res.status(500).json({ success: false, message: 'Failed to upload document file' });
  }
}

/**
 * POST /api/admission/applications/:id/verify-eligibility
 */
export async function verifyEligibility(req, res) {
  try {
    const { id } = req.params;
    const { eligibility_status, remarks } = req.body;

    const [appRows] = await pool.execute(`SELECT * FROM applications WHERE id = ?`, [id]);
    if (appRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const app = appRows[0];
    const officerName = req.user?.full_name || req.user?.username || 'Admission Officer';

    // Automatic check suggestion vs manual override
    let finalEligibility = eligibility_status;
    if (!finalEligibility) {
      const percentage = parseFloat(app.percentage_12th || 0);
      finalEligibility = percentage >= 50.0 ? 'Eligible' : 'Not Eligible';
    }

    const newAppStatus = finalEligibility === 'Eligible' ? 'Eligible' : (finalEligibility === 'Not Eligible' ? 'Rejected' : 'Eligibility Verification');

    await pool.execute(
      `UPDATE applications SET eligibility_status = ?, application_status = ?, remarks = COALESCE(?, remarks) WHERE id = ?`,
      [finalEligibility, newAppStatus, remarks || null, id]
    );

    await logAdmissionHistory(
      id,
      `Eligibility Verified: ${finalEligibility}`,
      app.eligibility_status,
      finalEligibility,
      officerName,
      remarks || ''
    );

    return res.json({
      success: true,
      message: `Eligibility verification completed: ${finalEligibility}.`,
      data: { eligibility_status: finalEligibility, application_status: newAppStatus }
    });
  } catch (error) {
    console.error('[VERIFY ELIGIBILITY ERROR]', error);
    return res.status(500).json({ success: false, message: 'Failed to verify eligibility' });
  }
}

/**
 * POST /api/admission/applications/:id/allocate-seat
 * Prevents over-allocation of seats!
 */
export async function allocateSeat(req, res) {
  try {
    const { id } = req.params;
    const { seat_number, category } = req.body;

    const [appRows] = await pool.execute(`SELECT * FROM applications WHERE id = ?`, [id]);
    if (appRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const app = appRows[0];
    const officerName = req.user?.full_name || req.user?.username || 'Admission Officer';

    // Find course seat capacity
    const [courseRows] = await pool.execute(
      `SELECT * FROM admission_courses WHERE course_name = ? OR id = ? LIMIT 1`,
      [app.course_name, app.course_id]
    );

    if (courseRows.length > 0) {
      const course = courseRows[0];
      if (course.available_seats <= 0) {
        return res.status(400).json({
          success: false,
          message: `Unable to allocate seat. The course "${course.course_name}" currently has 0 available seats (Full).`
        });
      }
    }

    const assignedSeat = seat_number || `${app.department_name ? app.department_name.substring(0,3).toUpperCase() : 'CSE'}-2026-S${String(app.id).padStart(3, '0')}`;

    // Insert seat allocation record
    await pool.execute(
      `INSERT INTO seat_allocations (application_id, course_id, course_name, department_name, seat_number, category, allocated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, app.course_id || null, app.course_name, app.department_name || 'Engineering', assignedSeat, category || app.admission_category || 'General', officerName]
    );

    // Update course seats count
    if (courseRows.length > 0) {
      await pool.execute(
        `UPDATE admission_courses 
         SET allocated_seats = allocated_seats + 1, available_seats = GREATEST(0, available_seats - 1) 
         WHERE id = ?`,
        [courseRows[0].id]
      );
    }

    // Update application
    await pool.execute(
      `UPDATE applications SET allocated_seat_number = ?, application_status = 'Selected' WHERE id = ?`,
      [assignedSeat, id]
    );

    await logAdmissionHistory(
      id,
      `Seat Allocated: ${assignedSeat}`,
      app.application_status,
      'Selected',
      officerName,
      `Seat ${assignedSeat} allocated under ${category || 'General'} category.`
    );

    return res.json({
      success: true,
      message: `Seat ${assignedSeat} successfully allocated for ${app.applicant_name}!`,
      data: { seat_number: assignedSeat, application_status: 'Selected' }
    });
  } catch (error) {
    console.error('[ALLOCATE SEAT ERROR]', error);
    return res.status(500).json({ success: false, message: 'Failed to allocate seat' });
  }
}

/**
 * POST /api/admission/applications/:id/record-payment
 */
export async function recordPayment(req, res) {
  try {
    const { id } = req.params;
    const { amount, payment_method } = req.body;

    const [appRows] = await pool.execute(`SELECT * FROM applications WHERE id = ?`, [id]);
    if (appRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const app = appRows[0];
    const paymentAmount = Number(amount) || Number(app.fee_amount) || 125000;
    const officerName = req.user?.full_name || req.user?.username || 'Admission Officer';

    const receiptNum = `REC-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const txnId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

    await pool.execute(
      `INSERT INTO admission_fee_payments (application_id, applicant_name, course_name, receipt_number, transaction_id, amount, payment_method, payment_status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Paid', ?)`,
      [id, app.applicant_name, app.course_name, receiptNum, txnId, paymentAmount, payment_method || 'Cash Counter', officerName]
    );

    const newPaidAmount = Number(app.paid_amount || 0) + paymentAmount;
    const isFull = newPaidAmount >= Number(app.fee_amount);
    const newFeeStatus = isFull ? 'Paid' : 'Partially Paid';
    const newAppStatus = isFull ? 'Fee Paid' : 'Fee Pending';

    await pool.execute(
      `UPDATE applications SET paid_amount = ?, fee_status = ?, application_status = ? WHERE id = ?`,
      [newPaidAmount, newFeeStatus, newAppStatus, id]
    );

    await logAdmissionHistory(
      id,
      `Payment Received: ₹${paymentAmount.toLocaleString()} (${receiptNum})`,
      app.fee_status,
      newFeeStatus,
      officerName,
      `Transaction ID: ${txnId}, Payment Method: ${payment_method || 'Cash Counter'}`
    );

    return res.json({
      success: true,
      message: `Payment of ₹${paymentAmount.toLocaleString()} recorded! Receipt: ${receiptNum}.`,
      data: {
        receipt_number: receiptNum,
        transaction_id: txnId,
        amount: paymentAmount,
        fee_status: newFeeStatus,
        application_status: newAppStatus
      }
    });
  } catch (error) {
    console.error('[RECORD ADMISSION PAYMENT ERROR]', error);
    return res.status(500).json({ success: false, message: 'Failed to record admission fee payment' });
  }
}

/**
 * POST /api/admission/applications/:id/confirm-admission
 * Creates official Student Master Record in users & students tables!
 */
export async function confirmAdmission(req, res) {
  try {
    const { id } = req.params;

    const [appRows] = await pool.execute(`SELECT * FROM applications WHERE id = ?`, [id]);
    if (appRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const app = appRows[0];

    // Checklist Enforcement (Section 14 & Section 30)
    if (app.document_status !== 'Verified') {
      return res.status(400).json({
        success: false,
        message: 'Admission cannot be confirmed because mandatory documents are still pending verification.'
      });
    }

    if (app.eligibility_status !== 'Eligible') {
      return res.status(400).json({
        success: false,
        message: 'Admission cannot be confirmed because student eligibility has not been verified.'
      });
    }

    if (!app.allocated_seat_number) {
      return res.status(400).json({
        success: false,
        message: 'Admission cannot be confirmed because a seat has not been allocated.'
      });
    }

    if (app.fee_status !== 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Admission cannot be confirmed because the required fee payment is incomplete.'
      });
    }

    const officerName = req.user?.full_name || req.user?.username || 'Admission Officer';

    // Generate Official Student Credentials
    const studentId = `STU-2026-${String(app.id).padStart(4, '0')}`;
    const username = app.email.split('@')[0] || `stu${app.id}`;
    const defaultPassword = await bcrypt.hash('Student@123', 10);

    // Get Student Role ID
    const [roleRows] = await pool.execute(`SELECT id FROM roles WHERE name = 'Student' LIMIT 1`);
    const studentRoleId = roleRows[0]?.id || 9;

    // 1. Create User Master Record
    let userId;
    const [userCheck] = await pool.execute(`SELECT id FROM users WHERE email = ?`, [app.email]);
    if (userCheck.length > 0) {
      userId = userCheck[0].id;
    } else {
      const [usrRes] = await pool.execute(
        `INSERT INTO users (username, full_name, email, password, role_id, department, phone, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
        [username, app.applicant_name, app.email, defaultPassword, studentRoleId, app.department_name || 'Engineering', app.mobile]
      );
      userId = usrRes.insertId;
    }

    // 2. Create / Update Student Master Profile
    try {
      await pool.execute(
        `INSERT INTO students (user_id, student_id, first_name, last_name, roll_number, department, email, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE student_id = VALUES(student_id), roll_number = VALUES(roll_number)`,
        [userId, studentId, app.first_name || app.applicant_name, app.last_name || '', app.allocated_seat_number, app.department_name || 'CSE', app.email, app.mobile]
      );
    } catch (stdErr) {
      console.warn('[STUDENT MASTER INSERT NOTE]', stdErr.message);
    }

    // 3. Mark Application as Confirmed & Enrolled
    await pool.execute(
      `UPDATE applications 
       SET application_status = 'Enrolled', enrolled_student_id = ?, enrollment_date = NOW() 
       WHERE id = ?`,
      [studentId, id]
    );

    await logAdmissionHistory(
      id,
      `Admission Confirmed & Enrolled (${studentId})`,
      app.application_status,
      'Enrolled',
      officerName,
      `Official Student Record Created. Assigned Student ID: ${studentId}.`
    );

    return res.json({
      success: true,
      message: `🎉 Admission confirmed! Student ID ${studentId} generated and enrolled into Master Student Registry.`,
      data: {
        student_id: studentId,
        application_status: 'Enrolled',
        enrollment_date: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[CONFIRM ADMISSION ERROR]', error);
    return res.status(500).json({ success: false, message: 'Failed to confirm admission and enroll student' });
  }
}

/**
 * GET /api/admission/courses-seats
 */
export async function getCoursesAndSeats(req, res) {
  try {
    const [rows] = await pool.execute(`SELECT * FROM admission_courses ORDER BY course_code ASC`);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[GET COURSES AND SEATS ERROR]', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch courses and seats' });
  }
}

/**
 * GET /api/admission/reports
 */
export async function getAdmissionReports(req, res) {
  try {
    const [courseWise] = await pool.execute(`
      SELECT course_name, COUNT(*) as total_applications,
             SUM(CASE WHEN application_status = 'Enrolled' THEN 1 ELSE 0 END) as enrolled,
             SUM(CASE WHEN fee_status = 'Paid' THEN 1 ELSE 0 END) as paid
      FROM applications GROUP BY course_name
    `);

    const [deptWise] = await pool.execute(`
      SELECT department_name, COUNT(*) as total_applications,
             SUM(CASE WHEN application_status = 'Enrolled' THEN 1 ELSE 0 END) as enrolled
      FROM applications GROUP BY department_name
    `);

    const [feeReport] = await pool.execute(`
      SELECT 
        SUM(fee_amount) as totalExpected,
        SUM(paid_amount) as totalCollected,
        SUM(GREATEST(0, fee_amount - paid_amount)) as totalPending
      FROM applications
    `);

    return res.json({
      success: true,
      data: {
        byCourse: courseWise,
        byDepartment: deptWise,
        financials: feeReport[0] || {}
      }
    });
  } catch (error) {
    console.error('[GET ADMISSION REPORTS ERROR]', error);
    return res.status(500).json({ success: false, message: 'Failed to generate admission reports' });
  }
}
