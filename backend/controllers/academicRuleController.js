import pool from '../db.js';
import {
  validateSubjectEligibility,
  calculateGradeForMark,
  checkPromotionEligibility
} from '../services/academicRuleService.js';
import {
  evaluateRegistrationEligibility,
  recordExamAttempt,
  generateOfficialTranscript,
  invalidateAcademicEngineCache
} from '../services/academicEngineService.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * GET /api/academic/subject-prerequisites/:subjectId
 * Fetch prerequisites for a given subject
 */
export const getSubjectPrerequisites = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const [rows] = await pool.execute(
      `SELECT p.id, p.subject_id, p.prerequisite_subject_id, p.min_grade_required,
              sub.code as prereq_code, sub.name as prereq_name, sub.credits
       FROM subject_prerequisites p
       JOIN subjects sub ON p.prerequisite_subject_id = sub.id
       WHERE p.subject_id = ?`,
      [subjectId]
    );

    return successResponse(res, 'Subject prerequisites retrieved', { prerequisites: rows });
  } catch (err) {
    console.error('[GET PREREQUISITES ERROR]:', err);
    return errorResponse(res, 'Failed to fetch prerequisites', [], 500);
  }
};

/**
 * POST /api/academic/subject-prerequisites
 * Admin / HOD adds a prerequisite relationship between two subjects
 */
export const addSubjectPrerequisite = async (req, res) => {
  try {
    const { subjectId, prerequisiteSubjectId, minGrade } = req.body;

    if (!subjectId || !prerequisiteSubjectId) {
      return errorResponse(res, 'subjectId and prerequisiteSubjectId are required', [], 400);
    }

    if (Number(subjectId) === Number(prerequisiteSubjectId)) {
      return errorResponse(res, 'A subject cannot be a prerequisite of itself', [], 400);
    }

    await pool.execute(
      `INSERT INTO subject_prerequisites (subject_id, prerequisite_subject_id, min_grade_required)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE min_grade_required = VALUES(min_grade_required)`,
      [subjectId, prerequisiteSubjectId, minGrade || 'PASS']
    );

    return successResponse(res, 'Prerequisite subject rule added successfully');
  } catch (err) {
    console.error('[ADD PREREQUISITE ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to add prerequisite', [], 500);
  }
};

/**
 * DELETE /api/academic/subject-prerequisites/:id
 * Remove a prerequisite relationship
 */
export const deleteSubjectPrerequisite = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM subject_prerequisites WHERE id = ?', [id]);
    return successResponse(res, 'Prerequisite subject rule deleted');
  } catch (err) {
    console.error('[DELETE PREREQUISITE ERROR]:', err);
    return errorResponse(res, 'Failed to delete prerequisite rule', [], 500);
  }
};

/**
 * POST /api/academic/verify-registration-eligibility
 * Legacy simple registration check
 */
export const verifyRegistrationEligibility = async (req, res) => {
  try {
    const { subjectIds, studentId: requestedStudentId } = req.body;
    let studentId = requestedStudentId;

    if (!studentId && req.user) {
      const [stRows] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (stRows.length > 0) studentId = stRows[0].id;
    }

    if (!studentId) {
      return errorResponse(res, 'Student record not found', [], 404);
    }

    const ids = Array.isArray(subjectIds) ? subjectIds : [subjectIds];
    const validationResults = [];

    for (const subId of ids) {
      const check = await validateSubjectEligibility(studentId, subId);
      validationResults.push({
        subject_id: subId,
        eligible: check.eligible,
        reason: check.reason || null,
        prerequisite: check.prerequisite || null
      });
    }

    const promotionCheck = await checkPromotionEligibility(studentId);

    return successResponse(res, 'Registration eligibility evaluated', {
      student_id: studentId,
      promotion: promotionCheck,
      evaluations: validationResults
    });
  } catch (err) {
    console.error('[VERIFY ELIGIBILITY ERROR]:', err);
    return errorResponse(res, 'Failed to evaluate registration eligibility', [], 500);
  }
};

/**
 * GET /api/academic/grade-scales/:regulationId
 * Get grade scale for regulation
 */
export const getGradeScales = async (req, res) => {
  try {
    const { regulationId } = req.params;
    const [rows] = await pool.execute(
      `SELECT id, regulation_id, letter_grade, grade_point, min_mark, max_mark, status
       FROM grade_scales 
       WHERE regulation_id = ?
       ORDER BY min_mark DESC`,
      [regulationId]
    );

    return successResponse(res, 'Grade scales retrieved', { gradeScales: rows });
  } catch (err) {
    console.error('[GET GRADE SCALES ERROR]:', err);
    return errorResponse(res, 'Failed to fetch grade scales', [], 500);
  }
};

// --- ENTERPRISE ACADEMIC ENGINE CONTROLLERS ---

/**
 * POST /api/academic/engine/check-eligibility
 * Production 15-Point Central Rule Engine Evaluation
 */
export const evaluateCentralEligibility = async (req, res) => {
  try {
    const { studentId: reqStudentId, subjectVersionIds, semesterId } = req.body;
    let studentId = reqStudentId;

    if (!studentId && req.user) {
      const [stRows] = await pool.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (stRows.length > 0) studentId = stRows[0].id;
    }

    if (!studentId) {
      return errorResponse(res, 'Student profile not resolved.', [], 404);
    }

    const evaluation = await evaluateRegistrationEligibility(studentId, subjectVersionIds || [], semesterId);
    return successResponse(res, 'Central Academic Engine evaluation completed', evaluation);
  } catch (err) {
    console.error('[CENTRAL ELIGIBILITY ERROR]:', err);
    return errorResponse(res, 'Central Academic Engine evaluation failed', [], 500);
  }
};

/**
 * POST /api/academic/engine/record-attempt
 * Immutable exam attempt recording & automatic backlog management
 */
export const recordExamAttemptController = async (req, res) => {
  try {
    const { studentId, subjectVersionId, examinationId, attemptNumber, internalMarks, externalMarks, isImprovement, attemptDate } = req.body;

    if (!studentId || !subjectVersionId) {
      return errorResponse(res, 'studentId and subjectVersionId are required', [], 400);
    }

    const result = await recordExamAttempt({
      studentId,
      subjectVersionId,
      examinationId,
      attemptNumber: attemptNumber || 1,
      internalMarks: internalMarks || 0,
      externalMarks: externalMarks || 0,
      isImprovement: isImprovement || 0,
      attemptDate: attemptDate ? new Date(attemptDate) : new Date()
    });

    return successResponse(res, 'Exam attempt recorded successfully in immutable history', result);
  } catch (err) {
    console.error('[RECORD ATTEMPT ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to record exam attempt', [], 500);
  }
};

/**
 * POST /api/academic/engine/generate-transcript
 * Generate official frozen transcript with SHA-256 integrity hash
 */
export const generateTranscriptController = async (req, res) => {
  try {
    const { studentId, semesterId, academicYearId } = req.body;

    if (!studentId || !semesterId) {
      return errorResponse(res, 'studentId and semesterId are required', [], 400);
    }

    const transcript = await generateOfficialTranscript(studentId, semesterId, academicYearId || 1);
    return successResponse(res, 'Official transcript published and locked', transcript);
  } catch (err) {
    console.error('[GENERATE TRANSCRIPT ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to generate transcript', [], 500);
  }
};

/**
 * GET /api/academic/regulations
 * List all regulations with batch count
 */
export const getRegulations = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.id, r.name, r.effective_year, r.description, r.status, r.degree_name,
              r.version, r.total_required_credits, r.min_promotion_credit_pct, r.max_backlogs_allowed,
              r.improvement_policy, r.cgpa_calculation_rule,
              (SELECT COUNT(*) FROM batches b WHERE b.regulation_id = r.id) as batch_count
       FROM regulations r
       ORDER BY r.effective_year DESC`
    );

    return successResponse(res, 'Regulations list retrieved', { regulations: rows });
  } catch (err) {
    console.error('[GET REGULATIONS ERROR]:', err);
    return errorResponse(res, 'Failed to fetch regulations', [], 500);
  }
};

/**
 * POST /api/academic/regulations
 * Create or update a regulation configuration
 */
export const createRegulation = async (req, res) => {
  try {
    const { name, effectiveYear, description, degreeName, totalRequiredCredits, minPromotionCreditPct, maxBacklogsAllowed, improvementPolicy, cgpaCalculationRule } = req.body;

    if (!name || !effectiveYear) {
      return errorResponse(res, 'Regulation name and effectiveYear are required', [], 400);
    }

    const [resDb] = await pool.execute(
      `INSERT INTO regulations (name, effective_year, description, degree_name, total_required_credits, min_promotion_credit_pct, max_backlogs_allowed, improvement_policy, cgpa_calculation_rule)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         effective_year = VALUES(effective_year),
         description = VALUES(description),
         degree_name = VALUES(degree_name),
         total_required_credits = VALUES(total_required_credits),
         min_promotion_credit_pct = VALUES(min_promotion_credit_pct),
         max_backlogs_allowed = VALUES(max_backlogs_allowed),
         improvement_policy = VALUES(improvement_policy),
         cgpa_calculation_rule = VALUES(cgpa_calculation_rule)`,
      [
        name,
        effectiveYear,
        description || '',
        degreeName || 'B.Tech',
        totalRequiredCredits || 160.0,
        minPromotionCreditPct || 50.00,
        maxBacklogsAllowed || 10,
        improvementPolicy || 'BEST_GRADE',
        cgpaCalculationRule || 'BEST_ATTEMPT_ONLY'
      ]
    );

    invalidateAcademicEngineCache();
    return successResponse(res, 'Regulation configured successfully', { id: resDb.insertId });
  } catch (err) {
    console.error('[CREATE REGULATION ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to create regulation', [], 500);
  }
};

/**
 * GET /api/academic/academic-years
 * List academic year definitions directly from academic_years table
 */
export const getAcademicYears = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, year_level, created_at
       FROM academic_years
       ORDER BY year_level ASC, id ASC`
    );

    return successResponse(res, 'Academic years retrieved successfully', { academic_years: rows });
  } catch (err) {
    console.error('[GET ACADEMIC YEARS ERROR]:', err);
    return errorResponse(res, 'Failed to fetch academic years', [], 500);
  }
};

/**
 * GET /api/academic/batches
 * List batch mapping definitions
 */
export const getBatches = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT b.id, b.batch_name, b.start_year, b.end_year, b.status,
              d.name as department_name, d.code as department_code,
              r.name as regulation_name
       FROM batches b
       JOIN departments d ON b.department_id = d.id
       JOIN regulations r ON b.regulation_id = r.id
       ORDER BY b.start_year DESC`
    );

    return successResponse(res, 'Batches retrieved successfully', { batches: rows });
  } catch (err) {
    console.error('[GET BATCHES ERROR]:', err);
    return errorResponse(res, 'Failed to fetch batches', [], 500);
  }
};

/**
 * POST /api/academic/batches
 * Create new batch definition
 */
export const createBatch = async (req, res) => {
  try {
    const { batchName, startYear, endYear, departmentId, regulationId } = req.body;

    if (!batchName || !startYear || !endYear || !departmentId || !regulationId) {
      return errorResponse(res, 'batchName, startYear, endYear, departmentId, and regulationId are required', [], 400);
    }

    const [resDb] = await pool.execute(
      `INSERT INTO batches (batch_name, start_year, end_year, department_id, regulation_id)
       VALUES (?, ?, ?, ?, ?)`,
      [batchName, startYear, endYear, departmentId, regulationId]
    );

    return successResponse(res, 'Batch created successfully', { id: resDb.insertId });
  } catch (err) {
    console.error('[CREATE BATCH ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to create batch', [], 500);
  }
};

/**
 * GET /api/academic/subject-versions/:regulationId
 * Get versioned subjects for a regulation
 */
export const getSubjectVersions = async (req, res) => {
  try {
    const regulationId = req.params.regulationId || req.query.regulationId;
    let rows = [];

    if (regulationId) {
      const [vRows] = await pool.execute(
        `SELECT sv.id, sv.regulation_id, sv.subject_code, sv.subject_name, sv.short_name,
                sv.credits, sv.offering_type, sv.total_marks, sv.max_attempts_allowed, sv.is_elective,
                c.name as category_name
         FROM subject_versions sv
         LEFT JOIN subject_categories c ON sv.category_id = c.id
         WHERE sv.regulation_id = ?
         ORDER BY sv.subject_code ASC`,
        [regulationId]
      );
      rows = vRows;
    }

    // Fallback: If no subject_versions found, fetch from central subjects catalog table
    if (rows.length === 0) {
      const query = (regulationId && regulationId !== '')
        ? `SELECT s.id, s.code as subject_code, s.name as subject_name, s.short_name,
                  s.credits, s.offering_type, s.total_marks, sc.name as category_name
           FROM subjects s
           LEFT JOIN subject_categories sc ON s.category_id = sc.id
           WHERE s.regulation_id = ? OR s.regulation_id IS NULL
           ORDER BY s.code ASC`
        : `SELECT s.id, s.code as subject_code, s.name as subject_name, s.short_name,
                  s.credits, s.offering_type, s.total_marks, sc.name as category_name
           FROM subjects s
           LEFT JOIN subject_categories sc ON s.category_id = sc.id
           ORDER BY s.code ASC`;
      const params = (regulationId && regulationId !== '') ? [regulationId] : [];
      const [sRows] = await pool.execute(query, params);
      rows = sRows;
    }

    return successResponse(res, 'Subject versions retrieved', { subjectVersions: rows });
  } catch (err) {
    console.error('[GET SUBJECT VERSIONS ERROR]:', err);
    return errorResponse(res, 'Failed to fetch subject versions', [], 500);
  }
};

/**
 * GET /api/academic/student-backlogs/:studentId
 * Fetch student open and cleared backlogs
 */
export const getStudentBacklogs = async (req, res) => {
  try {
    const { studentId } = req.params;
    const [rows] = await pool.execute(
      `SELECT sb.id, sb.student_id, sb.subject_version_id, sb.attempt_count, sb.status, sb.cleared_at,
              sv.subject_code, sv.subject_name, sv.credits
       FROM student_backlogs sb
       JOIN subject_versions sv ON sb.subject_version_id = sv.id
       WHERE sb.student_id = ?
       ORDER BY sb.status ASC, sb.id DESC`,
      [studentId]
    );

    return successResponse(res, 'Student backlogs retrieved', { backlogs: rows });
  } catch (err) {
    console.error('[GET STUDENT BACKLOGS ERROR]:', err);
    return errorResponse(res, 'Failed to fetch student backlogs', [], 500);
  }
};
