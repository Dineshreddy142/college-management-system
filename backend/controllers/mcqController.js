import pool from '../db.js';

// Helper to resolve Student ID from authenticated user
const resolveStudentId = async (userId) => {
  const [rows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [userId]);
  return rows.length > 0 ? rows[0].id : null;
};

// Helper to resolve Faculty ID from authenticated user
const resolveFacultyId = async (userId) => {
  const [rows] = await pool.query('SELECT id FROM faculties WHERE user_id = ?', [userId]);
  return rows.length > 0 ? rows[0].id : null;
};

// Helper to update expired assignments (runs dynamically on fetch)
const processExpiredMcqAssignments = async (studentId = null) => {
  try {
    let query = `
      SELECT id, attendance_session_id, student_id
      FROM daily_mcq_assignments
      WHERE status = 'PENDING' AND NOW() > expires_at
    `;
    const params = [];
    if (studentId) {
      query += ` AND student_id = ?`;
      params.push(studentId);
    }

    const [expiredAssignments] = await pool.query(query, params);

    for (const item of expiredAssignments) {
      // Mark assignment EXPIRED
      await pool.query('UPDATE daily_mcq_assignments SET status = "EXPIRED" WHERE id = ?', [item.id]);

      // Mark attendance record MCQ_EXPIRED
      await pool.query(`
        UPDATE attendance_records
        SET status = 'MCQ_EXPIRED'
        WHERE attendance_session_id = ? AND student_id = ? AND status = 'PENDING_MCQ'
      `, [item.attendance_session_id, item.student_id]);
    }
  } catch (err) {
    console.error('[MCQ EXPIRED CHECK ERROR]:', err.message);
  }
};

// GET /api/mcq/daily/pending - Get pending 10-MCQ quizzes for student
export const getPendingDailyMcqs = async (req, res) => {
  try {
    const studentId = await resolveStudentId(req.user.id);
    if (!studentId) {
      return res.status(404).json({ success: false, message: 'Student profile record not found' });
    }

    // Process any expired assignments first
    await processExpiredMcqAssignments(studentId);

    // Fetch active pending assignments
    const [assignments] = await pool.query(`
      SELECT dma.*,
             s.code as subject_code, s.name as subject_name,
             ats.date as class_date, ats.time_slot_id,
             f.first_name as faculty_first_name, f.last_name as faculty_last_name
      FROM daily_mcq_assignments dma
      JOIN subjects s ON dma.subject_id = s.id
      JOIN attendance_sessions ats ON dma.attendance_session_id = ats.id
      JOIN faculties f ON ats.faculty_id = f.id
      WHERE dma.student_id = ? AND dma.status = 'PENDING' AND NOW() <= dma.expires_at
      ORDER BY dma.expires_at ASC
    `, [studentId]);

    res.json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching pending MCQs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending MCQs', error: error.message });
  }
};

// GET /api/mcq/daily/history - Get past completed/expired MCQ history for student
export const getStudentMcqHistory = async (req, res) => {
  try {
    const studentId = await resolveStudentId(req.user.id);
    if (!studentId) {
      return res.status(404).json({ success: false, message: 'Student profile record not found' });
    }

    await processExpiredMcqAssignments(studentId);

    const [assignments] = await pool.query(`
      SELECT dma.*,
             s.code as subject_code, s.name as subject_name,
             f.first_name as faculty_first_name, f.last_name as faculty_last_name
      FROM daily_mcq_assignments dma
      JOIN subjects s ON dma.subject_id = s.id
      JOIN attendance_sessions ats ON dma.attendance_session_id = ats.id
      JOIN faculties f ON ats.faculty_id = f.id
      WHERE dma.student_id = ?
      ORDER BY dma.created_at DESC
      LIMIT 50
    `, [studentId]);

    res.json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching student MCQ history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch MCQ history', error: error.message });
  }
};

// GET /api/mcq/daily/assignment/:id - Fetch questions for an assignment
export const getMcqAssignmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = await resolveStudentId(req.user.id);

    const [assignments] = await pool.query(`
      SELECT dma.*,
             s.code as subject_code, s.name as subject_name,
             f.first_name as faculty_first_name, f.last_name as faculty_last_name
      FROM daily_mcq_assignments dma
      JOIN subjects s ON dma.subject_id = s.id
      JOIN attendance_sessions ats ON dma.attendance_session_id = ats.id
      JOIN faculties f ON ats.faculty_id = f.id
      WHERE dma.id = ?
    `, [id]);

    if (assignments.length === 0) {
      return res.status(404).json({ success: false, message: 'MCQ assignment record not found' });
    }

    const assignment = assignments[0];

    // Security Check: student owns this or Admin/Faculty
    if (req.user.role === 'Student' && studentId && assignment.student_id !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not assigned this quiz.' });
    }

    // Fetch the 10 questions for this session
    const [questions] = await pool.query(`
      SELECT id, attendance_session_id, question_number, question_text,
             option_a, option_b, option_c, option_d,
             correct_option, explanation
      FROM daily_mcq_questions
      WHERE attendance_session_id = ?
      ORDER BY question_number ASC
    `, [assignment.attendance_session_id]);

    // If quiz is still PENDING, strip correct_option & explanation to prevent inspection cheating
    const sanitizedQuestions = questions.map(q => {
      if (assignment.status === 'PENDING') {
        const { correct_option, explanation, ...safeQ } = q;
        return safeQ;
      }
      return q;
    });

    // If quiz is already COMPLETED, fetch student's submitted responses
    let userResponses = [];
    if (assignment.status === 'COMPLETED') {
      const [resp] = await pool.query(`
        SELECT question_id, selected_option, is_correct
        FROM daily_mcq_responses
        WHERE assignment_id = ?
      `, [id]);
      userResponses = resp;
    }

    res.json({
      success: true,
      assignment,
      questions: sanitizedQuestions,
      responses: userResponses
    });
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch MCQ questions', error: error.message });
  }
};

// POST /api/mcq/daily/submit - Grade student's 10 MCQ responses & upgrade attendance to PRESENT
export const submitDailyMcqAssignment = async (req, res) => {
  try {
    const { assignment_id, answers } = req.body;
    const studentId = await resolveStudentId(req.user.id);

    if (!studentId) {
      return res.status(404).json({ success: false, message: 'Student profile record not found' });
    }

    const [assignments] = await pool.query(`
      SELECT * FROM daily_mcq_assignments WHERE id = ? AND student_id = ?
    `, [assignment_id, studentId]);

    if (assignments.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found or unauthorized' });
    }

    const assignment = assignments[0];

    if (assignment.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'You have already submitted this daily quiz.' });
    }

    if (new Date() > new Date(assignment.expires_at)) {
      await pool.query('UPDATE daily_mcq_assignments SET status = "EXPIRED" WHERE id = ?', [assignment_id]);
      await pool.query(`
        UPDATE attendance_records
        SET status = 'MCQ_EXPIRED'
        WHERE attendance_session_id = ? AND student_id = ? AND status = 'PENDING_MCQ'
      `, [assignment.attendance_session_id, studentId]);
      return res.status(400).json({ success: false, message: 'This quiz has expired (deadline 11:59 PM passed).' });
    }

    const answerList = Array.isArray(answers) ? answers : [];
    if (answerList.length === 0) {
      return res.status(400).json({ success: false, message: 'Quiz answers payload is required' });
    }

    // Fetch official answer keys from daily_mcq_questions
    const [officialQuestions] = await pool.query(`
      SELECT id, question_number, correct_option, explanation, question_text
      FROM daily_mcq_questions
      WHERE attendance_session_id = ?
    `, [assignment.attendance_session_id]);

    const qMap = new Map();
    officialQuestions.forEach(q => qMap.set(q.id, q));

    let correctCount = 0;
    const responseResults = [];

    // Evaluate answers
    for (const ans of answerList) {
      const qObj = qMap.get(ans.question_id);
      if (!qObj) continue;

      const selected = (ans.selected_option || '').toUpperCase();
      const isCorrect = selected === qObj.correct_option ? 1 : 0;
      if (isCorrect) correctCount++;

      await pool.query(`
        INSERT INTO daily_mcq_responses (assignment_id, question_id, selected_option, is_correct)
        VALUES (?, ?, ?, ?)
      `, [assignment_id, ans.question_id, selected, isCorrect]);

      responseResults.push({
        question_id: ans.question_id,
        question_text: qObj.question_text,
        selected_option: selected,
        correct_option: qObj.correct_option,
        is_correct: !!isCorrect,
        explanation: qObj.explanation
      });
    }

    const totalQuestions = officialQuestions.length || 10;
    const percentage = ((correctCount / totalQuestions) * 100).toFixed(2);

    // Update assignment status to COMPLETED
    await pool.query(`
      UPDATE daily_mcq_assignments
      SET status = 'COMPLETED', score = ?, percentage = ?, submitted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [correctCount, percentage, assignment_id]);

    // 🔥 UPGRADE STUDENT ATTENDANCE FROM PENDING_MCQ TO PRESENT!
    await pool.query(`
      UPDATE attendance_records
      SET status = 'PRESENT', marked_at = CURRENT_TIMESTAMP
      WHERE attendance_session_id = ? AND student_id = ?
    `, [assignment.attendance_session_id, studentId]);

    res.json({
      success: true,
      message: `Quiz completed successfully! Score: ${correctCount}/${totalQuestions} (${percentage}%). Attendance marked PRESENT ✅`,
      data: {
        assignment_id,
        score: correctCount,
        total_questions: totalQuestions,
        percentage,
        attendance_status: 'PRESENT',
        results: responseResults
      }
    });
  } catch (error) {
    console.error('Error submitting daily MCQ quiz:', error);
    res.status(500).json({ success: false, message: 'Failed to submit quiz', error: error.message });
  }
};

// GET /api/mcq/faculty/topic-analytics/:sessionId - Faculty Topic Analytics
export const getFacultyTopicAnalytics = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const facultyId = await resolveFacultyId(req.user.id);

    const [sessions] = await pool.query(`
      SELECT ats.*, s.name as subject_name, s.code as subject_code, sec.name as section_name
      FROM attendance_sessions ats
      JOIN subjects s ON ats.subject_id = s.id
      JOIN sections sec ON ats.section_id = sec.id
      WHERE ats.id = ?
    `, [sessionId]);

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendance session not found' });
    }

    const session = sessions[0];

    if (req.user.role !== 'Admin' && facultyId && session.faculty_id !== facultyId) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not authorized for this session.' });
    }

    // Run expired assignment check first
    await processExpiredMcqAssignments();

    // Fetch assignment stats
    const [assignments] = await pool.query(`
      SELECT dma.*, st.first_name, st.last_name, st.roll_number
      FROM daily_mcq_assignments dma
      JOIN students st ON dma.student_id = st.id
      WHERE dma.attendance_session_id = ?
      ORDER BY st.roll_number ASC
    `, [sessionId]);

    const totalAssigned = assignments.length;
    const completedCount = assignments.filter(a => a.status === 'COMPLETED').length;
    const pendingCount = assignments.filter(a => a.status === 'PENDING').length;
    const expiredCount = assignments.filter(a => a.status === 'EXPIRED').length;

    const completedPercentages = assignments.filter(a => a.status === 'COMPLETED').map(a => parseFloat(a.percentage));
    const avgScore = completedPercentages.length > 0
      ? (completedPercentages.reduce((acc, curr) => acc + curr, 0) / completedPercentages.length).toFixed(1)
      : '0.0';

    // Per-question accuracy metrics
    const [questions] = await pool.query(`
      SELECT q.id, q.question_number, q.question_text, q.correct_option,
             (SELECT COUNT(*) FROM daily_mcq_responses r WHERE r.question_id = q.id AND r.is_correct = 1) as correct_responses_count,
             (SELECT COUNT(*) FROM daily_mcq_responses r WHERE r.question_id = q.id) as total_responses_count
      FROM daily_mcq_questions q
      WHERE q.attendance_session_id = ?
      ORDER BY q.question_number ASC
    `, [sessionId]);

    const questionAnalytics = questions.map(q => {
      const correct = parseInt(q.correct_responses_count) || 0;
      const total = parseInt(q.total_responses_count) || 0;
      const accuracyPct = total > 0 ? ((correct / total) * 100).toFixed(1) : '0.0';
      return {
        question_number: q.question_number,
        question_text: q.question_text,
        correct_option: q.correct_option,
        correct_responses: correct,
        total_responses: total,
        accuracy_percentage: accuracyPct
      };
    });

    res.json({
      success: true,
      session_summary: {
        session_id: sessionId,
        topic_covered: session.topic_covered || 'General Subject Overview',
        subject_code: session.subject_code,
        subject_name: session.subject_name,
        section_name: session.section_name,
        date: session.date,
        total_assigned: totalAssigned,
        completed_count: completedCount,
        pending_count: pendingCount,
        expired_count: expiredCount,
        class_comprehension_avg_score: avgScore
      },
      students: assignments,
      question_breakdown: questionAnalytics
    });
  } catch (error) {
    console.error('Error fetching topic analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch topic analytics', error: error.message });
  }
};
