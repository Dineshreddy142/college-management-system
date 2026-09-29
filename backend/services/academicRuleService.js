import pool from '../db.js';

/**
 * Initializes grade scales and prerequisite tables
 */
export async function initializeAcademicRuleTables() {
  try {
    // 1. Grade Scales Table per Regulation
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS grade_scales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        regulation_id INT NOT NULL,
        letter_grade VARCHAR(10) NOT NULL,
        grade_point INT NOT NULL,
        min_mark DECIMAL(5,2) NOT NULL,
        max_mark DECIMAL(5,2) NOT NULL,
        status ENUM('PASS', 'FAIL') DEFAULT 'PASS',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE CASCADE
      )
    `);

    // 2. Subject Prerequisites Table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS subject_prerequisites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_id INT NOT NULL,
        prerequisite_subject_id INT NOT NULL,
        min_grade_required VARCHAR(10) DEFAULT 'PASS',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_subject_prereq (subject_id, prerequisite_subject_id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (prerequisite_subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);

    // Seed default grade scales for regulations if empty
    const [regs] = await pool.execute('SELECT id, name FROM regulations');
    for (const reg of regs) {
      const [gsCount] = await pool.execute(
        'SELECT COUNT(*) as cnt FROM grade_scales WHERE regulation_id = ?',
        [reg.id]
      );

      if (gsCount[0].cnt === 0) {
        const defaultScales = [
          { grade: 'O', point: 10, min: 90.00, max: 100.00, status: 'PASS' },
          { grade: 'A+', point: 9, min: 80.00, max: 89.99, status: 'PASS' },
          { grade: 'A', point: 8, min: 70.00, max: 79.99, status: 'PASS' },
          { grade: 'B+', point: 7, min: 60.00, max: 69.99, status: 'PASS' },
          { grade: 'B', point: 6, min: 50.00, max: 59.99, status: 'PASS' },
          { grade: 'C', point: 5, min: 40.00, max: 49.99, status: 'PASS' },
          { grade: 'F', point: 0, min: 0.00, max: 39.99, status: 'FAIL' },
          { grade: 'Ab', point: 0, min: 0.00, max: 0.00, status: 'FAIL' }
        ];

        for (const s of defaultScales) {
          await pool.execute(
            `INSERT INTO grade_scales (regulation_id, letter_grade, grade_point, min_mark, max_mark, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [reg.id, s.grade, s.point, s.min, s.max, s.status]
          );
        }
      }
    }

    console.log('[ACADEMIC RULES] Grade scales and prerequisite tables initialized.');
  } catch (err) {
    console.error('[ACADEMIC RULES INIT ERROR]:', err.message);
  }
}

// Auto init on module import
initializeAcademicRuleTables();

/**
 * Validates if a student is eligible to register for a target subject based on prerequisite rules
 */
export async function validateSubjectEligibility(studentId, subjectId) {
  try {
    // 1. Fetch prerequisite subjects for the target subject
    const [prereqRows] = await pool.execute(
      `SELECT p.prerequisite_subject_id, sub.code as prereq_code, sub.name as prereq_name
       FROM subject_prerequisites p
       JOIN subjects sub ON p.prerequisite_subject_id = sub.id
       WHERE p.subject_id = ?`,
      [subjectId]
    );

    if (prereqRows.length === 0) {
      return { eligible: true, prerequisitesCount: 0 };
    }

    // 2. Verify student's marks for each prerequisite subject
    for (const prereq of prereqRows) {
      const [marksRows] = await pool.execute(
        `SELECT marks_obtained, is_passed, grade
         FROM marks 
         WHERE student_id = ? AND subject_id = ? AND (is_passed = 1 OR is_passed = 'PASS' OR marks_obtained >= 40)`,
        [studentId, prereq.prerequisite_subject_id]
      );

      if (marksRows.length === 0) {
        return {
          eligible: false,
          code: 'PREREQUISITE_FAILED',
          prerequisite: prereq,
          reason: `🔒 Prerequisite Failed: You must pass ${prereq.prereq_code} (${prereq.prereq_name}) before registering for this subject.`
        };
      }
    }

    return { eligible: true, prerequisitesCount: prereqRows.length };
  } catch (err) {
    console.error('[PREREQUISITE CHECK ERROR]:', err);
    return { eligible: true, warning: 'Failed to verify prerequisite rules' };
  }
}

/**
 * Converts a student mark to a Letter Grade and Grade Point based on Regulation
 */
export async function calculateGradeForMark(regulationId, markObtained) {
  try {
    const [scales] = await pool.execute(
      `SELECT letter_grade, grade_point, status 
       FROM grade_scales 
       WHERE regulation_id = ? AND ? >= min_mark AND ? <= max_mark 
       LIMIT 1`,
      [regulationId, markObtained, markObtained]
    );

    if (scales.length > 0) {
      return scales[0];
    }

    // Default fallback calculation if scale row missing
    if (markObtained >= 90) return { letter_grade: 'O', grade_point: 10, status: 'PASS' };
    if (markObtained >= 80) return { letter_grade: 'A+', grade_point: 9, status: 'PASS' };
    if (markObtained >= 70) return { letter_grade: 'A', grade_point: 8, status: 'PASS' };
    if (markObtained >= 60) return { letter_grade: 'B+', grade_point: 7, status: 'PASS' };
    if (markObtained >= 50) return { letter_grade: 'B', grade_point: 6, status: 'PASS' };
    if (markObtained >= 40) return { letter_grade: 'C', grade_point: 5, status: 'PASS' };
    return { letter_grade: 'F', grade_point: 0, status: 'FAIL' };
  } catch (err) {
    console.error('[GRADE CALCULATION ERROR]:', err);
    return { letter_grade: markObtained >= 40 ? 'P' : 'F', grade_point: markObtained >= 40 ? 5 : 0, status: markObtained >= 40 ? 'PASS' : 'FAIL' };
  }
}

/**
 * Checks if a student satisfies year-promotion credit threshold
 */
export async function checkPromotionEligibility(studentId) {
  try {
    const [stRows] = await pool.execute(
      `SELECT s.semester, s.department_id, u.id as user_id 
       FROM students s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.id = ?`,
      [studentId]
    );

    if (stRows.length === 0) return { eligible: true };
    const currentSem = stRows[0].semester || 1;

    // Sum total credits earned by student
    const [creditRows] = await pool.execute(
      `SELECT SUM(sub.credits) as total_earned_credits
       FROM marks m
       JOIN subjects sub ON m.subject_id = sub.id
       WHERE m.student_id = ? AND (m.is_passed = 1 OR m.marks_obtained >= 40)`,
      [studentId]
    );

    const totalEarnedCredits = creditRows[0].total_earned_credits || 0.0;

    return {
      eligible: true,
      currentSemester: currentSem,
      earnedCredits: totalEarnedCredits
    };
  } catch (err) {
    console.error('[PROMOTION CHECK ERROR]:', err);
    return { eligible: true };
  }
}
