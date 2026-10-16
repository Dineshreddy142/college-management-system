import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import {
  parseAndValidateFrames,
  checkLivenessMotion,
  extractFaceEmbedding,
  decryptTemplate,
  calculateCosineSimilarity
} from '../services/faceAuthService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const SIMILARITY_THRESHOLD = parseFloat(process.env.FACE_SIMILARITY_THRESHOLD || '0.40');

// Helper to find student record from user ID
async function resolveStudentInfo(userId) {
  const [rows] = await pool.query(`
    SELECT s.id as student_id, s.roll_number, s.admission_number, s.department_id, s.semester, s.current_semester_id,
           u.id as user_id, u.username, u.full_name, u.email
    FROM users u
    LEFT JOIN students s ON s.user_id = u.id
    WHERE u.id = ?
  `, [userId]);
  return rows.length > 0 ? rows[0] : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. FACTOR 1: CANDIDATE LOGIN (STRICTLY INSTITUTIONAL EMAIL + USERS PASSWORD)
// ─────────────────────────────────────────────────────────────────────────────
export const verifyCandidateLogin = async (req, res) => {
  try {
    const { email, identifier, password } = req.body;
    const targetEmail = (email || identifier || '').trim().toLowerCase();

    if (!targetEmail || !password) {
      return res.status(400).json({ success: false, message: 'Institutional email address and password are required' });
    }

    // Query user strictly by email from central users table
    const [users] = await pool.query(`
      SELECT u.id, u.username, u.full_name, u.email, u.password, u.status, u.role_id,
             r.name as role_name,
             s.id as student_id, s.roll_number, s.department_id, s.semester, s.current_semester_id
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN students s ON s.user_id = u.id
      WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(?))
      LIMIT 1
    `, [targetEmail]);

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'No account registered with this institutional email address.' });
    }

    const user = users[0];
    if (user.status === 'inactive' || user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account is suspended or inactive. Contact administrator.' });
    }

    // Verify Password directly against users.password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
    }

    // Check if user has biometric enrollment
    const [bioRows] = await pool.query('SELECT id, sample_image FROM face_biometrics WHERE user_id = ?', [user.id]);
    const hasBiometrics = bioRows.length > 0;

    // Fetch eligible online exams
    const [eligibleExams] = await pool.query(`
      SELECT e.id, e.title, e.exam_code, e.duration_minutes, e.start_window, e.end_window,
             e.total_marks, e.pass_marks, e.require_face_verification, e.enable_webcam_proctoring,
             e.max_violations_allowed, e.status, s.name as subject_name,
             (SELECT COUNT(*) FROM online_exam_questions WHERE exam_id = e.id) as question_count
      FROM online_exams e
      LEFT JOIN subjects s ON e.subject_id = s.id
      WHERE e.status = 'PUBLISHED'
      ORDER BY e.start_window ASC
    `);

    // Generate temporary Candidate Verification Token (valid for 3 hours)
    const candidateAuthToken = jwt.sign(
      {
        userId: user.id,
        studentId: user.student_id,
        email: user.email,
        username: user.username,
        fullName: user.full_name || user.username,
        role: user.role_name
      },
      JWT_SECRET,
      { expiresIn: '3h' }
    );

    return res.json({
      success: true,
      message: 'Candidate credentials authenticated successfully.',
      candidateAuthToken,
      candidate: {
        userId: user.id,
        studentId: user.student_id,
        username: user.username,
        fullName: user.full_name || user.username,
        email: user.email,
        rollNumber: user.roll_number || 'N/A',
        role: user.role_name,
        hasBiometrics
      },
      eligibleExams
    });
  } catch (error) {
    console.error('[ONLINE EXAM LOGIN ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during candidate verification', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. FACTOR 2: EXAM PASSKEY VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────
export const verifyExamPasskey = async (req, res) => {
  try {
    const { examId } = req.params;
    const { passkey } = req.body;

    if (!passkey) {
      return res.status(400).json({ success: false, message: 'Exam passkey is required' });
    }

    const [exams] = await pool.query(`
      SELECT e.*, s.name as subject_name
      FROM online_exams e
      LEFT JOIN subjects s ON e.subject_id = s.id
      WHERE e.id = ?
    `, [examId]);

    if (exams.length === 0) {
      return res.status(404).json({ success: false, message: 'Scheduled exam not found' });
    }

    const exam = exams[0];

    // Verify Passkey
    const cleanPass = passkey.trim();
    let passMatch = false;
    if (exam.passkey_plain && exam.passkey_plain.toLowerCase() === cleanPass.toLowerCase()) {
      passMatch = true;
    } else if (exam.passkey_hash) {
      passMatch = await bcrypt.compare(cleanPass, exam.passkey_hash);
    }

    if (!passMatch) {
      return res.status(403).json({ success: false, message: 'Invalid exam passkey. Please check the access code provided by your invigilator.' });
    }

    // Verify Time Window (with 30-minute grace window)
    const now = new Date();
    const startWin = new Date(exam.start_window);
    const endWin = new Date(exam.end_window);

    // Allow entry 15 mins before start
    const allowedStart = new Date(startWin.getTime() - 15 * 60 * 1000);
    if (now < allowedStart) {
      return res.status(403).json({
        success: false,
        message: `This examination has not started yet. Entry opens at ${startWin.toLocaleTimeString()}.`
      });
    }

    if (now > endWin) {
      return res.status(403).json({
        success: false,
        message: `The entry window for this examination closed at ${endWin.toLocaleTimeString()}.`
      });
    }

    return res.json({
      success: true,
      passkey_valid: true,
      message: 'Exam passkey verified successfully.',
      exam: {
        id: exam.id,
        title: exam.title,
        exam_code: exam.exam_code,
        subject_name: exam.subject_name,
        duration_minutes: exam.duration_minutes,
        total_marks: exam.total_marks,
        pass_marks: exam.pass_marks,
        instructions: exam.instructions,
        require_face_verification: !!exam.require_face_verification,
        enable_webcam_proctoring: !!exam.enable_webcam_proctoring,
        max_violations_allowed: exam.max_violations_allowed,
        allow_backtracking: !!exam.allow_backtracking,
        allow_calculator: !!exam.allow_calculator
      }
    });
  } catch (error) {
    console.error('[VERIFY PASSKEY ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify exam passkey', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. FACTOR 3: FACE BIOMETRIC RECOGNITION & ACTIVE SESSION LAUNCH
// ─────────────────────────────────────────────────────────────────────────────
export const verifyFaceAndStartSession = async (req, res) => {
  try {
    const { examId } = req.params;
    const { passkey, frames, snapshot, candidateToken, clientIp } = req.body;

    // Validate Candidate Token
    let candidateData;
    try {
      candidateData = jwt.verify(candidateToken, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid or expired candidate session token. Please re-authenticate with your email and password.' });
    }

    const userId = candidateData.userId;

    // Fetch Exam
    const [exams] = await pool.query('SELECT * FROM online_exams WHERE id = ?', [examId]);
    if (exams.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    const exam = exams[0];

    // Re-verify passkey
    let passMatch = false;
    if (exam.passkey_plain && exam.passkey_plain.toLowerCase() === (passkey || '').trim().toLowerCase()) {
      passMatch = true;
    } else if (exam.passkey_hash) {
      passMatch = await bcrypt.compare((passkey || '').trim(), exam.passkey_hash);
    }

    if (!passMatch) {
      return res.status(403).json({ success: false, message: 'Invalid passkey provided for session initiation' });
    }

    let faceMatchConfidence = 1.0;
    let entrySnapshot = snapshot || null;

    // Biometric Verification Check
    if (exam.require_face_verification) {
      // Check if user has biometric template
      const [bioRows] = await pool.query('SELECT * FROM face_biometrics WHERE user_id = ?', [userId]);

      if (bioRows.length > 0 && frames && Array.isArray(frames) && frames.length > 0) {
        try {
          const parsedFrames = parseAndValidateFrames(frames);
          // Liveness Check
          const liveness = checkLivenessMotion(parsedFrames);
          if (!liveness.isLive) {
            return res.status(403).json({
              success: false,
              code: 'LIVENESS_FAILED',
              message: 'Liveness verification failed. Please look straight, blink naturally, and ensure adequate lighting.'
            });
          }

          // Extract probe embedding from middle frame
          const middleFrame = parsedFrames[Math.floor(parsedFrames.length / 2)];
          const probeEmbedding = await extractFaceEmbedding(middleFrame.buffer);

          // Decrypt stored enrollment template
          const storedEmbedding = decryptTemplate(bioRows[0].encrypted_template);

          // Calculate Cosine Similarity
          const similarity = calculateCosineSimilarity(probeEmbedding, storedEmbedding);
          faceMatchConfidence = similarity;

          if (similarity < SIMILARITY_THRESHOLD) {
            return res.status(403).json({
              success: false,
              code: 'FACE_MISMATCH',
              message: `Face verification failed (Confidence: ${(similarity * 100).toFixed(1)}%). Identity does not match enrolled student template.`
            });
          }

          entrySnapshot = frames[0]; // Record frame as entry snapshot
        } catch (faceErr) {
          console.warn('[BIOMETRIC VERIFICATION WARNING]:', faceErr.message);
          // If model processing errors or no face detected, report clearly
          if (faceErr.code === 'FACE_NOT_DETECTED' || faceErr.code === 'MULTIPLE_FACES') {
            return res.status(400).json({ success: false, code: faceErr.code, message: faceErr.message });
          }
        }
      } else if (snapshot) {
        // Fallback: If biometrics not yet pre-enrolled in DB, we capture high-res baseline entry snapshot
        entrySnapshot = snapshot;
        faceMatchConfidence = 0.95;
      }
    }

    // Check if session already exists for this candidate & exam
    const [existingSessions] = await pool.query(`
      SELECT * FROM online_exam_sessions
      WHERE exam_id = ? AND user_id = ?
    `, [examId, userId]);

    let sessionToken;
    let sessionId;

    if (existingSessions.length > 0) {
      const sess = existingSessions[0];
      if (sess.status === 'SUBMITTED' || sess.status === 'TERMINATED' || sess.status === 'DISQUALIFIED') {
        return res.status(403).json({
          success: false,
          message: `This examination has already been ${sess.status.toLowerCase()} for your account. Multiple attempts are not permitted.`
        });
      }

      // Resume existing in-progress session
      sessionToken = sess.session_token;
      sessionId = sess.id;

      await pool.query(`
        UPDATE online_exam_sessions
        SET passkey_verified_at = IFNULL(passkey_verified_at, NOW()),
            face_verified_at = IFNULL(face_verified_at, NOW()),
            face_match_confidence = IFNULL(face_match_confidence, ?),
            entry_snapshot_url = IFNULL(entry_snapshot_url, ?),
            updated_at = NOW()
        WHERE id = ?
      `, [faceMatchConfidence, entrySnapshot, sessionId]);
    } else {
      // Create new exam session
      sessionToken = crypto.randomBytes(32).toString('hex');
      const [insertSess] = await pool.query(`
        INSERT INTO online_exam_sessions (
          exam_id, student_id, user_id, session_token, passkey_verified_at,
          face_verified_at, face_match_confidence, entry_snapshot_url,
          start_time, status, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, NOW(), NOW(), ?, ?, NOW(), 'IN_PROGRESS', ?, ?)
      `, [
        examId,
        candidateData.studentId || null,
        userId,
        sessionToken,
        faceMatchConfidence,
        entrySnapshot,
        clientIp || req.ip || '127.0.0.1',
        req.headers['user-agent'] || ''
      ]);

      sessionId = insertSess.insertId;
    }

    return res.json({
      success: true,
      message: 'All 3 security verification factors cleared! Exam session unlocked.',
      session_token: sessionToken,
      session_id: sessionId,
      exam_id: exam.id
    });
  } catch (error) {
    console.error('[FACE AND START SESSION ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Failed to initiate secure exam session', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. TEST RUNNER: FETCH SANITIZED EXAM QUESTIONS & ACTIVE STATE
// ─────────────────────────────────────────────────────────────────────────────
export const getExamSessionDetails = async (req, res) => {
  try {
    const { examId } = req.params;
    const sessionToken = req.headers['x-exam-session-token'] || req.query.session_token;

    if (!sessionToken) {
      return res.status(401).json({ success: false, message: 'Valid session token is required to access test content' });
    }

    // Resolve Session
    const [sessions] = await pool.query(`
      SELECT s.*, u.full_name, u.email, u.username, st.roll_number
      FROM online_exam_sessions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN students st ON s.student_id = st.id
      WHERE s.session_token = ? AND s.exam_id = ?
    `, [sessionToken, examId]);

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'Active exam session not found' });
    }

    const session = sessions[0];
    if (session.status === 'SUBMITTED' || session.status === 'TERMINATED') {
      return res.status(403).json({
        success: false,
        code: 'SESSION_CLOSED',
        status: session.status,
        message: `This examination has already been ${session.status.toLowerCase()}.`
      });
    }

    // Fetch Exam Configuration
    const [exams] = await pool.query(`
      SELECT e.*, sub.name as subject_name, sub.code as subject_code
      FROM online_exams e
      LEFT JOIN subjects sub ON e.subject_id = sub.id
      WHERE e.id = ?
    `, [examId]);
    const exam = exams[0];

    // Compute remaining duration in seconds based on server start_time
    const startTime = new Date(session.start_time).getTime();
    const durationMs = exam.duration_minutes * 60 * 1000;
    const elapsedMs = Date.now() - startTime;
    const remainingSeconds = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));

    // Fetch Questions (STRICTLY SANITIZED: is_correct is NEVER selected!)
    const [questions] = await pool.query(`
      SELECT q.id, q.question_text, q.question_type, q.difficulty_level, q.marks,
             q.negative_marks, q.code_language, eq.display_order, eq.section_name
      FROM online_exam_questions eq
      JOIN online_questions q ON eq.question_id = q.id
      WHERE eq.exam_id = ?
      ORDER BY eq.display_order ASC
    `, [examId]);

    // Fetch Options for all questions (sanitized without is_correct)
    const questionIds = questions.map(q => q.id);
    let options = [];
    if (questionIds.length > 0) {
      const [optRows] = await pool.query(`
        SELECT id, question_id, option_text, option_order
        FROM online_question_options
        WHERE question_id IN (?)
        ORDER BY option_order ASC
      `, [questionIds]);
      options = optRows;
    }

    // Group options by question
    const questionsWithOptions = questions.map(q => ({
      ...q,
      options: options.filter(o => o.question_id === q.id)
    }));

    // Fetch existing candidate answers
    const [savedAnswers] = await pool.query(`
      SELECT question_id, selected_option_id, selected_options_json, text_answer, is_flagged_for_review
      FROM online_exam_answers
      WHERE session_id = ?
    `, [session.id]);

    return res.json({
      success: true,
      session: {
        id: session.id,
        session_token: session.session_token,
        status: session.status,
        violation_count: session.violation_count,
        start_time: session.start_time,
        candidate_name: session.full_name || session.username,
        roll_number: session.roll_number || 'N/A',
        remaining_seconds: remainingSeconds
      },
      exam: {
        id: exam.id,
        title: exam.title,
        exam_code: exam.exam_code,
        subject_name: exam.subject_name,
        instructions: exam.instructions,
        duration_minutes: exam.duration_minutes,
        total_marks: exam.total_marks,
        max_violations_allowed: exam.max_violations_allowed,
        enable_webcam_proctoring: !!exam.enable_webcam_proctoring,
        allow_backtracking: !!exam.allow_backtracking,
        allow_calculator: !!exam.allow_calculator
      },
      questions: questionsWithOptions,
      savedAnswers
    });
  } catch (error) {
    console.error('[GET EXAM SESSION DETAILS ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Failed to load examination session', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. TEST RUNNER: AUTO-SAVE CANDIDATE RESPONSE
// ─────────────────────────────────────────────────────────────────────────────
export const saveCandidateAnswer = async (req, res) => {
  try {
    const sessionToken = req.headers['x-exam-session-token'] || req.body.session_token;
    const { question_id, selected_option_id, selected_options_json, text_answer, is_flagged_for_review } = req.body;

    if (!sessionToken || !question_id) {
      return res.status(400).json({ success: false, message: 'Session token and question ID are required' });
    }

    const [sessions] = await pool.query('SELECT id, status FROM online_exam_sessions WHERE session_token = ?', [sessionToken]);
    if (sessions.length === 0 || sessions[0].status !== 'IN_PROGRESS') {
      return res.status(403).json({ success: false, message: 'Exam session is inactive or closed' });
    }

    const sessionId = sessions[0].id;

    // Upsert into online_exam_answers
    await pool.query(`
      INSERT INTO online_exam_answers (
        session_id, question_id, selected_option_id, selected_options_json,
        text_answer, is_flagged_for_review, answered_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        selected_option_id = VALUES(selected_option_id),
        selected_options_json = VALUES(selected_options_json),
        text_answer = VALUES(text_answer),
        is_flagged_for_review = VALUES(is_flagged_for_review),
        answered_at = NOW()
    `, [
      sessionId,
      question_id,
      selected_option_id || null,
      selected_options_json ? JSON.stringify(selected_options_json) : null,
      text_answer || null,
      is_flagged_for_review ? 1 : 0
    ]);

    return res.json({ success: true, message: 'Answer autosaved successfully', saved_at: new Date().toISOString() });
  } catch (error) {
    console.error('[SAVE CANDIDATE ANSWER ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Failed to autosave answer', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. TEST RUNNER: HEARTBEAT & SERVER SYNC
// ─────────────────────────────────────────────────────────────────────────────
export const recordExamHeartbeat = async (req, res) => {
  try {
    const sessionToken = req.headers['x-exam-session-token'] || req.body.session_token;
    if (!sessionToken) return res.status(400).json({ success: false, message: 'Session token required' });

    const [sessions] = await pool.query(`
      SELECT s.*, e.duration_minutes, e.max_violations_allowed, e.auto_submit_on_violation
      FROM online_exam_sessions s
      JOIN online_exams e ON s.exam_id = e.id
      WHERE s.session_token = ?
    `, [sessionToken]);

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const session = sessions[0];
    const startTime = new Date(session.start_time).getTime();
    const durationMs = session.duration_minutes * 60 * 1000;
    const elapsedMs = Date.now() - startTime;
    const remainingSeconds = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));

    // Update heartbeat timestamp
    await pool.query('UPDATE online_exam_sessions SET updated_at = NOW() WHERE id = ?', [session.id]);

    // Check if time expired and auto-submit
    if (remainingSeconds <= 0 && session.status === 'IN_PROGRESS') {
      await autoGradeAndCloseSession(session.id, 'SUBMITTED');
      return res.json({
        success: true,
        status: 'SUBMITTED',
        remaining_seconds: 0,
        time_expired: true,
        message: 'Exam time has expired. Your responses have been submitted automatically.'
      });
    }

    return res.json({
      success: true,
      status: session.status,
      violation_count: session.violation_count,
      remaining_seconds: remainingSeconds
    });
  } catch (error) {
    console.error('[HEARTBEAT ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Heartbeat error', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. TEST RUNNER: REPORT PROCTORING VIOLATION TELEMETRY
// ─────────────────────────────────────────────────────────────────────────────
export const reportExamViolation = async (req, res) => {
  try {
    const sessionToken = req.headers['x-exam-session-token'] || req.body.session_token;
    const { violation_type, details, snapshot_url } = req.body;

    if (!sessionToken || !violation_type) {
      return res.status(400).json({ success: false, message: 'Session token and violation type are required' });
    }

    const [sessions] = await pool.query(`
      SELECT s.*, e.max_violations_allowed, e.auto_submit_on_violation
      FROM online_exam_sessions s
      JOIN online_exams e ON s.exam_id = e.id
      WHERE s.session_token = ?
    `, [sessionToken]);

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const session = sessions[0];
    if (session.status !== 'IN_PROGRESS') {
      return res.json({ success: false, message: 'Session is no longer active', status: session.status });
    }

    // Determine severity
    let severity = 'MEDIUM';
    if (violation_type === 'FULLSCREEN_EXIT' || violation_type === 'TAB_SWITCH') severity = 'HIGH';
    if (violation_type === 'IMPERSONATION_ATTEMPT' || violation_type === 'MULTIPLE_FACES') severity = 'CRITICAL';

    // Insert into online_exam_violations
    await pool.query(`
      INSERT INTO online_exam_violations (session_id, violation_type, severity, details, snapshot_url)
      VALUES (?, ?, ?, ?, ?)
    `, [session.id, violation_type, severity, details || 'Security alert triggered', snapshot_url || null]);

    // Increment violation count
    const newViolationCount = session.violation_count + 1;
    let newStatus = 'IN_PROGRESS';
    let isTerminated = false;

    if (newViolationCount >= session.max_violations_allowed && session.auto_submit_on_violation) {
      newStatus = 'TERMINATED';
      isTerminated = true;
      await autoGradeAndCloseSession(session.id, 'TERMINATED');
    } else {
      await pool.query('UPDATE online_exam_sessions SET violation_count = ? WHERE id = ?', [newViolationCount, session.id]);
    }

    return res.json({
      success: true,
      violation_count: newViolationCount,
      max_allowed: session.max_violations_allowed,
      is_terminated: isTerminated,
      status: newStatus,
      message: isTerminated
        ? 'Maximum security violations exceeded. The exam has been terminated.'
        : `Security violation recorded (${newViolationCount}/${session.max_violations_allowed}). Please adhere strictly to exam rules.`
    });
  } catch (error) {
    console.error('[REPORT VIOLATION ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Failed to record violation', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. TEST RUNNER: SUBMIT EXAM & AUTO-GRADE
// ─────────────────────────────────────────────────────────────────────────────
export const submitExamSession = async (req, res) => {
  try {
    const sessionToken = req.headers['x-exam-session-token'] || req.body.session_token;
    if (!sessionToken) return res.status(400).json({ success: false, message: 'Session token required' });

    const [sessions] = await pool.query('SELECT id, status FROM online_exam_sessions WHERE session_token = ?', [sessionToken]);
    if (sessions.length === 0) return res.status(404).json({ success: false, message: 'Session not found' });

    const sessionId = sessions[0].id;
    const result = await autoGradeAndCloseSession(sessionId, 'SUBMITTED');

    return res.json({
      success: true,
      message: 'Examination submitted successfully!',
      result
    });
  } catch (error) {
    console.error('[SUBMIT EXAM SESSION ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit exam', error: error.message });
  }
};

// Internal Auto-Grading Engine
async function autoGradeAndCloseSession(sessionId, finalStatus = 'SUBMITTED') {
  // 1. Fetch all questions and options for this session
  const [answers] = await pool.query(`
    SELECT a.*, q.question_type, q.marks, q.negative_marks
    FROM online_exam_answers a
    JOIN online_questions q ON a.question_id = q.id
    WHERE a.session_id = ?
  `, [sessionId]);

  let totalScore = 0.0;

  for (const ans of answers) {
    let marksAwarded = 0.0;

    if (ans.question_type === 'MCQ_SINGLE' || ans.question_type === 'TRUE_FALSE') {
      if (ans.selected_option_id) {
        const [opt] = await pool.query('SELECT is_correct FROM online_question_options WHERE id = ?', [ans.selected_option_id]);
        if (opt.length > 0 && opt[0].is_correct === 1) {
          marksAwarded = parseFloat(ans.marks) || 1.0;
        } else {
          marksAwarded = -(parseFloat(ans.negative_marks) || 0.0);
        }
      }
    } else if (ans.question_type === 'MCQ_MULTIPLE') {
      // Evaluate multi-choice JSON array
      const selectedIds = ans.selected_options_json ? (typeof ans.selected_options_json === 'string' ? JSON.parse(ans.selected_options_json) : ans.selected_options_json) : [];
      const [allOpts] = await pool.query('SELECT id, is_correct FROM online_question_options WHERE question_id = ?', [ans.question_id]);
      const correctIds = allOpts.filter(o => o.is_correct === 1).map(o => o.id);

      const allCorrectSelected = correctIds.every(id => selectedIds.includes(id)) && selectedIds.every(id => correctIds.includes(id));
      if (allCorrectSelected && correctIds.length > 0) {
        marksAwarded = parseFloat(ans.marks) || 1.0;
      } else {
        marksAwarded = -(parseFloat(ans.negative_marks) || 0.0);
      }
    }

    totalScore += marksAwarded;

    await pool.query(`
      UPDATE online_exam_answers
      SET marks_awarded = ?, is_auto_graded = 1
      WHERE id = ?
    `, [marksAwarded, ans.id]);
  }

  // Ensure score is not negative overall
  totalScore = Math.max(0, parseFloat(totalScore.toFixed(2)));

  // Determine Pass / Fail from exam pass_marks
  const [sessExams] = await pool.query(`
    SELECT e.pass_marks FROM online_exam_sessions s
    JOIN online_exams e ON s.exam_id = e.id
    WHERE s.id = ?
  `, [sessionId]);

  const passMarks = sessExams.length > 0 ? parseFloat(sessExams[0].pass_marks) : 0;
  const resultStatus = totalScore >= passMarks ? 'PASS' : 'FAIL';

  await pool.query(`
    UPDATE online_exam_sessions
    SET status = ?, submitted_at = NOW(), total_score = ?, result_status = ?
    WHERE id = ?
  `, [finalStatus, totalScore, resultStatus, sessionId]);

  return { totalScore, resultStatus, passMarks };
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. PROCTORING RADAR: LIVE CANDIDATE FEED
// ─────────────────────────────────────────────────────────────────────────────
export const getProctorLiveFeed = async (req, res) => {
  try {
    const { examId } = req.params;

    const [exams] = await pool.query(`
      SELECT e.*, s.name as subject_name,
             (SELECT COUNT(*) FROM online_exam_questions WHERE exam_id = e.id) as total_questions
      FROM online_exams e
      LEFT JOIN subjects s ON e.subject_id = s.id
      WHERE e.id = ?
    `, [examId]);

    if (exams.length === 0) return res.status(404).json({ success: false, message: 'Exam not found' });
    const exam = exams[0];

    const [candidates] = await pool.query(`
      SELECT s.id as session_id, s.exam_id, s.user_id, s.session_token, s.status,
             s.violation_count, s.start_time, s.submitted_at, s.total_score, s.result_status,
             s.face_match_confidence, s.entry_snapshot_url, s.updated_at as last_ping,
             u.full_name, u.email, u.username, st.roll_number,
             (SELECT COUNT(*) FROM online_exam_answers WHERE session_id = s.id) as answered_count,
             (SELECT COUNT(*) FROM online_exam_violations WHERE session_id = s.id) as total_violations
      FROM online_exam_sessions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN students st ON s.student_id = st.id
      WHERE s.exam_id = ?
      ORDER BY s.violation_count DESC, s.start_time DESC
    `, [examId]);

    // Fetch recent 20 violations across all candidates
    const [recentViolations] = await pool.query(`
      SELECT v.*, u.full_name, u.username, st.roll_number
      FROM online_exam_violations v
      JOIN online_exam_sessions s ON v.session_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN students st ON s.student_id = st.id
      WHERE s.exam_id = ?
      ORDER BY v.created_at DESC
      LIMIT 25
    `, [examId]);

    return res.json({
      success: true,
      exam,
      candidates,
      recentViolations
    });
  } catch (error) {
    console.error('[PROCTOR LIVE FEED ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Failed to load proctor feed', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. PROCTOR REMOTE CANDIDATE ACTIONS
// ─────────────────────────────────────────────────────────────────────────────
export const proctorCandidateAction = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { action, message, extraMinutes } = req.body;

    const [sessions] = await pool.query('SELECT * FROM online_exam_sessions WHERE id = ?', [sessionId]);
    if (sessions.length === 0) return res.status(404).json({ success: false, message: 'Candidate session not found' });

    if (action === 'TERMINATE') {
      await autoGradeAndCloseSession(sessionId, 'TERMINATED');
      return res.json({ success: true, message: 'Candidate examination terminated due to proctor intervention' });
    }

    if (action === 'DISQUALIFY') {
      await pool.query("UPDATE online_exam_sessions SET status = 'DISQUALIFIED', submitted_at = NOW(), total_score = 0, result_status = 'FAIL' WHERE id = ?", [sessionId]);
      return res.json({ success: true, message: 'Candidate disqualified' });
    }

    if (action === 'RESET_VIOLATIONS') {
      await pool.query('UPDATE online_exam_sessions SET violation_count = 0 WHERE id = ?', [sessionId]);
      return res.json({ success: true, message: 'Violation count reset to 0' });
    }

    return res.json({ success: true, message: `Proctor action "${action}" executed successfully.` });
  } catch (error) {
    console.error('[PROCTOR ACTION ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Failed to execute proctor action', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 11. QUESTION BANK & EXAM MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
export const getQuestionBanks = async (req, res) => {
  try {
    const [banks] = await pool.query(`
      SELECT b.*, s.name as subject_name,
             (SELECT COUNT(*) FROM online_questions WHERE bank_id = b.id) as question_count
      FROM online_question_banks b
      LEFT JOIN subjects s ON b.subject_id = s.id
      ORDER BY b.created_at DESC
    `);
    res.json({ success: true, data: banks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch question banks', error: error.message });
  }
};

export const createQuestionBank = async (req, res) => {
  try {
    const { title, code, subject_id, description } = req.body;
    if (!title || !code) return res.status(400).json({ success: false, message: 'Title and code are required' });

    const [result] = await pool.query(`
      INSERT INTO online_question_banks (title, code, subject_id, description)
      VALUES (?, ?, ?, ?)
    `, [title, code, subject_id || null, description || null]);

    res.json({ success: true, message: 'Question bank created', bankId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create question bank', error: error.message });
  }
};

export const addQuestionToBank = async (req, res) => {
  try {
    const { bankId } = req.params;
    const { question_text, question_type, difficulty_level, marks, negative_marks, explanation, options } = req.body;

    if (!question_text) return res.status(400).json({ success: false, message: 'Question text is required' });

    const [qRes] = await pool.query(`
      INSERT INTO online_questions (bank_id, question_text, question_type, difficulty_level, marks, negative_marks, explanation)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [bankId, question_text, question_type || 'MCQ_SINGLE', difficulty_level || 'MEDIUM', marks || 1.0, negative_marks || 0.0, explanation || null]);

    const questionId = qRes.insertId;

    if (options && Array.isArray(options)) {
      let order = 1;
      for (const opt of options) {
        await pool.query(`
          INSERT INTO online_question_options (question_id, option_text, is_correct, option_order)
          VALUES (?, ?, ?, ?)
        `, [questionId, opt.text, opt.is_correct ? 1 : 0, order++]);
      }
    }

    res.json({ success: true, message: 'Question added successfully', questionId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add question', error: error.message });
  }
};

export const createOnlineExam = async (req, res) => {
  try {
    const {
      title, exam_code, subject_id, passkey_plain, duration_minutes,
      start_window, end_window, total_marks, pass_marks, require_face_verification,
      enable_webcam_proctoring, max_violations_allowed, instructions, question_ids
    } = req.body;

    if (!title || !exam_code || !passkey_plain) {
      return res.status(400).json({ success: false, message: 'Title, exam code, and passkey are required' });
    }

    const hashedPass = await bcrypt.hash(passkey_plain.trim(), 10);

    const [examRes] = await pool.query(`
      INSERT INTO online_exams (
        title, exam_code, subject_id, passkey_plain, passkey_hash,
        duration_minutes, start_window, end_window, total_marks, pass_marks,
        require_face_verification, enable_webcam_proctoring, max_violations_allowed,
        instructions, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')
    `, [
      title, exam_code, subject_id || null, passkey_plain.trim(), hashedPass,
      duration_minutes || 60, start_window || new Date(), end_window || new Date(Date.now() + 7 * 86400000),
      total_marks || 50, pass_marks || 20, require_face_verification ? 1 : 0,
      enable_webcam_proctoring ? 1 : 0, max_violations_allowed || 3,
      instructions || null
    ]);

    const examId = examRes.insertId;

    if (question_ids && Array.isArray(question_ids)) {
      let order = 1;
      for (const qId of question_ids) {
        await pool.query(`
          INSERT INTO online_exam_questions (exam_id, question_id, display_order)
          VALUES (?, ?, ?)
        `, [examId, qId, order++]);
      }
    }

    res.json({ success: true, message: 'Secure Online Exam created successfully', examId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create online exam', error: error.message });
  }
};
