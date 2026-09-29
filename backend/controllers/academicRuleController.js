import pool from '../db.js';
import {
  validateSubjectEligibility,
  calculateGradeForMark,
  checkPromotionEligibility
} from '../services/academicRuleService.js';
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
 * Student verifies if they are eligible to register for a list of subjects
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
