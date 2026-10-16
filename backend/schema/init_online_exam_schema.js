import bcrypt from 'bcryptjs';

export async function initOnlineExamSchema(pool) {
  console.log('[ONLINE EXAM SCHEMA] Initializing Secure Exam Portal schema & sample assessments...');

  try {
    // 1. Online Question Banks
    await pool.query(`
      CREATE TABLE IF NOT EXISTS online_question_banks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        subject_id INT NULL,
        department_id INT NULL,
        description TEXT NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
      )
    `);

    // 2. Online Questions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS online_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bank_id INT NOT NULL,
        question_text LONGTEXT NOT NULL,
        question_type ENUM('MCQ_SINGLE', 'MCQ_MULTIPLE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'CODE') NOT NULL DEFAULT 'MCQ_SINGLE',
        difficulty_level ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM',
        marks DECIMAL(5,2) DEFAULT 1.00,
        negative_marks DECIMAL(5,2) DEFAULT 0.00,
        explanation TEXT NULL,
        code_language VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (bank_id) REFERENCES online_question_banks(id) ON DELETE CASCADE
      )
    `);

    // 3. Online Question Options
    await pool.query(`
      CREATE TABLE IF NOT EXISTS online_question_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        option_text TEXT NOT NULL,
        is_correct TINYINT(1) DEFAULT 0,
        option_order INT DEFAULT 0,
        FOREIGN KEY (question_id) REFERENCES online_questions(id) ON DELETE CASCADE
      )
    `);

    // 4. Online Exams Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS online_exams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        examination_id INT NULL,
        subject_id INT NULL,
        department_id INT NULL,
        semester_id INT NULL,
        title VARCHAR(255) NOT NULL,
        exam_code VARCHAR(64) NOT NULL UNIQUE,
        instructions LONGTEXT NULL,
        passkey_plain VARCHAR(64) NOT NULL DEFAULT 'EXAM2026',
        passkey_hash VARCHAR(255) NULL,
        require_face_verification TINYINT(1) DEFAULT 1,
        duration_minutes INT NOT NULL DEFAULT 60,
        start_window DATETIME NOT NULL,
        end_window DATETIME NOT NULL,
        total_marks DECIMAL(6,2) DEFAULT 50.00,
        pass_marks DECIMAL(6,2) DEFAULT 20.00,
        max_violations_allowed INT DEFAULT 3,
        auto_submit_on_violation TINYINT(1) DEFAULT 1,
        enable_webcam_proctoring TINYINT(1) DEFAULT 1,
        shuffle_questions TINYINT(1) DEFAULT 1,
        shuffle_options TINYINT(1) DEFAULT 1,
        allow_backtracking TINYINT(1) DEFAULT 1,
        allow_calculator TINYINT(1) DEFAULT 0,
        status ENUM('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED') DEFAULT 'PUBLISHED',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (examination_id) REFERENCES examinations(id) ON DELETE SET NULL,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
      )
    `);

    // Guardrail: Ensure passkey and face verification columns exist if pre-existing
    try {
      const [cols] = await pool.query('DESCRIBE online_exams');
      const colNames = cols.map(c => c.Field);
      if (!colNames.includes('passkey_plain')) {
        await pool.query("ALTER TABLE online_exams ADD COLUMN passkey_plain VARCHAR(64) NOT NULL DEFAULT 'EXAM2026' AFTER instructions");
      }
      if (!colNames.includes('passkey_hash')) {
        await pool.query('ALTER TABLE online_exams ADD COLUMN passkey_hash VARCHAR(255) NULL AFTER passkey_plain');
      }
      if (!colNames.includes('require_face_verification')) {
        await pool.query('ALTER TABLE online_exams ADD COLUMN require_face_verification TINYINT(1) DEFAULT 1 AFTER passkey_hash');
      }
    } catch (e) {
      console.warn('[ONLINE EXAM SCHEMA] Note on online_exams columns:', e.message);
    }

    // 5. Online Exam Questions Junction
    await pool.query(`
      CREATE TABLE IF NOT EXISTS online_exam_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        exam_id INT NOT NULL,
        question_id INT NOT NULL,
        display_order INT DEFAULT 0,
        section_name VARCHAR(100) DEFAULT 'Section A',
        UNIQUE KEY uq_exam_q (exam_id, question_id),
        FOREIGN KEY (exam_id) REFERENCES online_exams(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES online_questions(id) ON DELETE CASCADE
      )
    `);

    // 6. Online Exam Sessions (Candidate Exam Runs)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS online_exam_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        exam_id INT NOT NULL,
        student_id INT NULL,
        user_id INT NOT NULL,
        session_token VARCHAR(128) NOT NULL UNIQUE,
        passkey_verified_at DATETIME NULL,
        face_verified_at DATETIME NULL,
        face_match_confidence DECIMAL(5,4) NULL,
        entry_snapshot_url LONGTEXT NULL,
        start_time DATETIME NULL,
        end_time DATETIME NULL,
        submitted_at DATETIME NULL,
        status ENUM('VERIFYING', 'IN_PROGRESS', 'SUBMITTED', 'TERMINATED', 'DISQUALIFIED') DEFAULT 'IN_PROGRESS',
        violation_count INT DEFAULT 0,
        total_score DECIMAL(6,2) NULL,
        result_status ENUM('PENDING', 'PASS', 'FAIL') DEFAULT 'PENDING',
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (exam_id) REFERENCES online_exams(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 7. Online Exam Answers
    await pool.query(`
      CREATE TABLE IF NOT EXISTS online_exam_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        question_id INT NOT NULL,
        selected_option_id INT NULL,
        selected_options_json JSON NULL,
        text_answer LONGTEXT NULL,
        is_flagged_for_review TINYINT(1) DEFAULT 0,
        is_auto_graded TINYINT(1) DEFAULT 0,
        marks_awarded DECIMAL(5,2) NULL,
        evaluator_remarks TEXT NULL,
        answered_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_sess_q (session_id, question_id),
        FOREIGN KEY (session_id) REFERENCES online_exam_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES online_questions(id) ON DELETE CASCADE
      )
    `);

    // 8. Online Exam Violations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS online_exam_violations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        violation_type ENUM('FULLSCREEN_EXIT', 'TAB_SWITCH', 'WINDOW_BLUR', 'MULTIPLE_FACES', 'NO_FACE', 'IMPERSONATION_ATTEMPT', 'SUSPICIOUS_AUDIO', 'RESTRICTED_KEY', 'DEVTOOLS_ATTEMPT') NOT NULL,
        severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
        details TEXT NULL,
        snapshot_url LONGTEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES online_exam_sessions(id) ON DELETE CASCADE
      )
    `);

    // Seed default Question Bank & Exam if none exists
    const [existingBanks] = await pool.query('SELECT COUNT(*) as count FROM online_question_banks');
    if (existingBanks[0].count === 0) {
      console.log('[ONLINE EXAM SCHEMA] Seeding default Question Bank and Sample Secure Exam...');
      
      // Get a subject if exists
      const [subjects] = await pool.query('SELECT id, name FROM subjects LIMIT 1');
      const subjectId = subjects.length > 0 ? subjects[0].id : null;

      // Insert Question Bank
      const [bankRes] = await pool.query(`
        INSERT INTO online_question_banks (title, code, subject_id, description)
        VALUES ('Computer Networks & Cybersecurity Question Bank', 'BANK-CS-SEC-01', ?, 'Core question repository covering asymmetric cryptography, network protocols, firewall architecture, and vulnerability assessments.')
      `, [subjectId]);
      const bankId = bankRes.insertId;

      // Seed Questions
      const questionsData = [
        {
          text: 'Which cryptographic algorithm relies on the hardness of factoring large prime numbers for its security?',
          type: 'MCQ_SINGLE',
          difficulty: 'MEDIUM',
          marks: 2.0,
          neg: 0.5,
          explanation: 'RSA relies on the computational difficulty of factoring the product of two large prime numbers.',
          options: [
            { text: 'Diffie-Hellman', correct: 0 },
            { text: 'RSA (Rivest-Shamir-Adleman)', correct: 1 },
            { text: 'AES (Advanced Encryption Standard)', correct: 0 },
            { text: 'SHA-256', correct: 0 }
          ]
        },
        {
          text: 'Which of the following headers or mechanisms are used to mitigate Cross-Site Scripting (XSS) in modern web applications? (Select all that apply)',
          type: 'MCQ_MULTIPLE',
          difficulty: 'HARD',
          marks: 3.0,
          neg: 0.0,
          explanation: 'Content Security Policy (CSP) and HttpOnly session cookies are primary defenses against client-side script injection and token theft.',
          options: [
            { text: 'Content-Security-Policy (CSP)', correct: 1 },
            { text: 'HttpOnly cookie flag', correct: 1 },
            { text: 'Access-Control-Allow-Origin: *', correct: 0 },
            { text: 'Context-aware input sanitization / HTML encoding', correct: 1 }
          ]
        },
        {
          text: 'True or False: Symmetric encryption algorithms utilize different public and private keys for encryption and decryption.',
          type: 'TRUE_FALSE',
          difficulty: 'EASY',
          marks: 1.0,
          neg: 0.25,
          explanation: 'False. Symmetric encryption uses the EXACT same secret key for both encryption and decryption. Asymmetric encryption uses public/private pairs.',
          options: [
            { text: 'True', correct: 0 },
            { text: 'False', correct: 1 }
          ]
        },
        {
          text: 'In the TLS 1.3 handshake protocol, what is the minimum round-trip time (RTT) required for a full initial handshake?',
          type: 'MCQ_SINGLE',
          difficulty: 'MEDIUM',
          marks: 2.0,
          neg: 0.5,
          explanation: 'TLS 1.3 optimizes the handshake to 1-RTT for initial connections and 0-RTT for resumed sessions.',
          options: [
            { text: '0-RTT', correct: 0 },
            { text: '1-RTT', correct: 1 },
            { text: '2-RTT', correct: 0 },
            { text: '3-RTT', correct: 0 }
          ]
        },
        {
          text: 'What protocol does traceroute/ping primarily utilize for sending echo requests and receiving error telemetry across an IP network?',
          type: 'MCQ_SINGLE',
          difficulty: 'EASY',
          marks: 1.0,
          neg: 0.25,
          explanation: 'Internet Control Message Protocol (ICMP) is used for network diagnostics including echo requests/replies.',
          options: [
            { text: 'ICMP', correct: 1 },
            { text: 'SNMP', correct: 0 },
            { text: 'IGMP', correct: 0 },
            { text: 'BGP', correct: 0 }
          ]
        },
        {
          text: 'Explain the fundamental difference between a Stateful Inspection Firewall and a Stateless Packet Filter. (Short Answer)',
          type: 'SHORT_ANSWER',
          difficulty: 'MEDIUM',
          marks: 5.0,
          neg: 0.0,
          explanation: 'A stateless filter inspects individual packets in isolation based on static rules (IP, port, protocol). A stateful inspection firewall monitors active TCP/UDP connections in a state table, verifying whether returning packets belong to an existing legitimate session.',
          options: []
        }
      ];

      const insertedQIds = [];
      for (const q of questionsData) {
        const [qRes] = await pool.query(`
          INSERT INTO online_questions (bank_id, question_text, question_type, difficulty_level, marks, negative_marks, explanation)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [bankId, q.text, q.type, q.difficulty, q.marks, q.neg, q.explanation]);
        
        const qId = qRes.insertId;
        insertedQIds.push(qId);

        let order = 1;
        for (const opt of q.options) {
          await pool.query(`
            INSERT INTO online_question_options (question_id, option_text, is_correct, option_order)
            VALUES (?, ?, ?, ?)
          `, [qId, opt.text, opt.correct, order++]);
        }
      }

      // Create Sample Online Exam
      const hashedPasskey = await bcrypt.hash('EXAM2026', 10);
      const startWindow = new Date();
      startWindow.setHours(startWindow.getHours() - 2); // started 2 hours ago
      const endWindow = new Date();
      endWindow.setDate(endWindow.getDate() + 30); // valid for next 30 days

      const [examRes] = await pool.query(`
        INSERT INTO online_exams (
          subject_id, title, exam_code, instructions, passkey_plain, passkey_hash,
          require_face_verification, duration_minutes, start_window, end_window,
          total_marks, pass_marks, max_violations_allowed, auto_submit_on_violation,
          enable_webcam_proctoring, shuffle_questions, shuffle_options, allow_backtracking,
          allow_calculator, status
        ) VALUES (
          ?, 'Mid-Semester Cryptography & Secure Networks CBT', 'CBT-CS-2026-01',
          'Strict Exam Guidelines: 1. You must remain in full-screen mode at all times. 2. Switching tabs, opening developer tools, or minimizing the window counts as a security violation. 3. Three violations will immediately auto-submit your exam. 4. Your face must remain visible to the proctoring camera throughout the examination.',
          'EXAM2026', ?, 1, 60, ?, ?, 14.00, 7.00, 3, 1, 1, 1, 1, 1, 1, 'PUBLISHED'
        )
      `, [subjectId, hashedPasskey, startWindow, endWindow]);

      const examId = examRes.insertId;

      // Link questions to the exam
      let displayOrder = 1;
      for (const qId of insertedQIds) {
        await pool.query(`
          INSERT INTO online_exam_questions (exam_id, question_id, display_order, section_name)
          VALUES (?, ?, ?, 'Core Assessment')
        `, [examId, qId, displayOrder++]);
      }

      console.log(`[ONLINE EXAM SCHEMA] Successfully seeded exam "CBT-CS-2026-01" with Passkey "EXAM2026" and ${insertedQIds.length} questions.`);
    }

    console.log('[ONLINE EXAM SCHEMA] Online Exam Portal database schema ready.');
  } catch (error) {
    console.error('[ONLINE EXAM SCHEMA ERROR]:', error);
    throw error;
  }
}
