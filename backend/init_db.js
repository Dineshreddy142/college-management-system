import bcrypt from 'bcryptjs';
import pool from './db.js';

export async function initializeDatabase() {
  console.log('[DATABASE INIT] Checking and initializing database schema & default seed users...');
  
  try {
    // 1. Roles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 2. Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        full_name VARCHAR(150) NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        role_id INT,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        must_change_password TINYINT(1) DEFAULT 1,
        face_registered TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
      )
    `);

    // Ensure full_name and must_change_password columns exist for pre-existing tables
    try {
      const [uCols] = await pool.query('DESCRIBE users');
      const uColNames = uCols.map(c => c.Field);
      if (!uColNames.includes('full_name')) {
        await pool.query('ALTER TABLE users ADD COLUMN full_name VARCHAR(150) NULL AFTER username');
      }
      if (!uColNames.includes('must_change_password')) {
        await pool.query('ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) DEFAULT 1 AFTER status');
      }
    } catch (colErr) {
      console.warn('[DATABASE INIT] Note on users columns:', colErr.message);
    }

    // 3. Activity logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        action VARCHAR(100) NOT NULL,
        description TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Failed login attempts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS failed_login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        ip_address VARCHAR(45),
        reason VARCHAR(255),
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_failed_user (user_id),
        INDEX idx_failed_ip (ip_address)
      )
    `);

    // 5. Students table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        admission_number VARCHAR(50) UNIQUE,
        roll_number VARCHAR(50),
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        name VARCHAR(100) NULL,
        email VARCHAR(100) NULL,
        phone VARCHAR(20),
        department_id INT,
        section_id INT,
        academic_year_id INT,
        semester INT DEFAULT 1,
        section VARCHAR(10) DEFAULT 'A',
        cgpa DECIMAL(3,2) DEFAULT 0.00,
        status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure admission_number and roll_number columns exist for pre-existing tables
    try {
      const [stCols] = await pool.query('DESCRIBE students');
      const stColNames = stCols.map(c => c.Field);
      if (!stColNames.includes('admission_number')) {
        await pool.query('ALTER TABLE students ADD COLUMN admission_number VARCHAR(50) NULL AFTER user_id');
      }
      if (!stColNames.includes('roll_number')) {
        await pool.query('ALTER TABLE students ADD COLUMN roll_number VARCHAR(50) NULL AFTER user_id');
      }
      if (!stColNames.includes('first_name')) {
        await pool.query('ALTER TABLE students ADD COLUMN first_name VARCHAR(50) NULL AFTER roll_number');
      }
      if (!stColNames.includes('last_name')) {
        await pool.query('ALTER TABLE students ADD COLUMN last_name VARCHAR(50) NULL AFTER first_name');
      }
      if (stColNames.includes('name')) {
        await pool.query('ALTER TABLE students MODIFY COLUMN name VARCHAR(100) NULL');
      }
      if (!stColNames.includes('section_id')) {
        await pool.query('ALTER TABLE students ADD COLUMN section_id INT NULL AFTER department_id');
      }
      if (!stColNames.includes('academic_year_id')) {
        await pool.query('ALTER TABLE students ADD COLUMN academic_year_id INT NULL AFTER section_id');
      }
      if (!stColNames.includes('department_id')) {
        await pool.query('ALTER TABLE students ADD COLUMN department_id INT NULL AFTER last_name');
      }
      if (!stColNames.includes('semester')) {
        await pool.query('ALTER TABLE students ADD COLUMN semester INT DEFAULT 1 AFTER department_id');
      }
    } catch (colErr) {
      console.warn('[DATABASE INIT] Note on students columns:', colErr.message);
    }

    // 6. Faculty table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS faculty (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        employee_id VARCHAR(50) UNIQUE,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        department_id INT,
        designation VARCHAR(100) DEFAULT 'Assistant Professor',
        status ENUM('Active', 'On Leave', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Departments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) NOT NULL UNIQUE
      )
    `);

    // 8. Academic Years table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS academic_years (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        year_level INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Courses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        department_id INT NULL,
        duration_years INT DEFAULT 4,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      )
    `);

    // 10. Semesters table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS semesters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        semester_number INT NOT NULL,
        academic_year_id INT NULL,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
      )
    `);

    // 11. Sections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        department_id INT NULL,
        course_id INT NULL,
        academic_year_id INT NULL,
        semester_id INT NULL,
        capacity INT DEFAULT 60,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL
      )
    `);

    // 11.b Subject Categories Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subject_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        code VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed 7 standard subject categories
    const initialCategories = [
      { name: 'FOUNDATION / BASIC', code: 'FOUNDATION', description: 'Basic Sciences, Engineering Mathematics, and Communication Foundation subjects' },
      { name: 'CORE', code: 'CORE', description: 'Essential core discipline subjects required for the program' },
      { name: 'PROFESSIONAL / CORE ELECTIVE', code: 'PROFESSIONAL_ELECTIVE', description: 'Specialized departmental elective choices' },
      { name: 'OPEN ELECTIVE', code: 'OPEN_ELECTIVE', description: 'Interdisciplinary elective subjects offered across departments' },
      { name: 'LABORATORY / PRACTICAL', code: 'LABORATORY', description: 'Practical, hands-on lab sessions and experimental subjects' },
      { name: 'PROJECT / INTERNSHIP', code: 'PROJECT', description: 'Mini projects, major capstone projects, and industry internships' },
      { name: 'VALUE-ADDED / SKILL', code: 'VALUE_ADDED', description: 'Soft skills, aptitude, coding practice, and professional ethics' }
    ];

    for (const cat of initialCategories) {
      await pool.query(
        `INSERT INTO subject_categories (name, code, description)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [cat.name, cat.code, cat.description]
      );
    }

    // 12. Subjects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        short_name VARCHAR(50) NULL,
        category_id INT NULL,
        department_id INT NULL,
        course_id INT NULL,
        academic_year_id INT NULL,
        semester_id INT NULL,
        regulation_id INT NULL,
        regulation VARCHAR(50) NULL,
        credits DECIMAL(3,1) DEFAULT 3.0,
        lecture_hours INT DEFAULT 3,
        tutorial_hours INT DEFAULT 0,
        practical_hours INT DEFAULT 0,
        theory_hours INT DEFAULT 3,
        lab_hours INT DEFAULT 0,
        total_hours INT DEFAULT 3,
        internal_marks INT DEFAULT 40,
        external_marks INT DEFAULT 60,
        total_marks INT DEFAULT 100,
        passing_marks INT DEFAULT 40,
        offering_type ENUM('Theory', 'Practical', 'Theory + Practical') DEFAULT 'Theory',
        elective_group VARCHAR(100) NULL,
        prerequisite TEXT NULL,
        description TEXT NULL,
        status ENUM('Active', 'Inactive', 'Archived') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES subject_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL
      )
    `);

    // Ensure columns exist on pre-existing subjects table
    try {
      const [sCols] = await pool.query('DESCRIBE subjects');
      const sColNames = sCols.map(c => c.Field);
      
      if (!sColNames.includes('short_name')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN short_name VARCHAR(50) NULL AFTER name');
      }
      if (!sColNames.includes('category_id')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN category_id INT NULL AFTER short_name');
        try {
          await pool.query('ALTER TABLE subjects ADD CONSTRAINT fk_subjects_category FOREIGN KEY (category_id) REFERENCES subject_categories(id) ON DELETE SET NULL');
        } catch (e) {}
      }
      if (!sColNames.includes('course_id')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN course_id INT NULL AFTER department_id');
      }
      if (!sColNames.includes('academic_year_id')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN academic_year_id INT NULL AFTER course_id');
      }
      if (!sColNames.includes('regulation_id')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN regulation_id INT NULL AFTER semester_id');
      }
      if (!sColNames.includes('regulation')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN regulation VARCHAR(50) NULL AFTER regulation_id');
      }
      if (!sColNames.includes('lecture_hours')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN lecture_hours INT DEFAULT 3 AFTER credits');
      }
      if (!sColNames.includes('practical_hours')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN practical_hours INT DEFAULT 0 AFTER tutorial_hours');
      }
      if (!sColNames.includes('total_hours')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN total_hours INT DEFAULT 3 AFTER practical_hours');
      }
      if (!sColNames.includes('internal_marks')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN internal_marks INT DEFAULT 40 AFTER total_hours');
      }
      if (!sColNames.includes('external_marks')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN external_marks INT DEFAULT 60 AFTER internal_marks');
      }
      if (!sColNames.includes('total_marks')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN total_marks INT DEFAULT 100 AFTER external_marks');
      }
      if (!sColNames.includes('passing_marks')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN passing_marks INT DEFAULT 40 AFTER total_marks');
      }
      if (!sColNames.includes('offering_type')) {
        await pool.query("ALTER TABLE subjects ADD COLUMN offering_type ENUM('Theory', 'Practical', 'Theory + Practical') DEFAULT 'Theory' AFTER passing_marks");
      }
      if (!sColNames.includes('elective_group')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN elective_group VARCHAR(100) NULL AFTER offering_type');
      }
      if (!sColNames.includes('prerequisite')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN prerequisite TEXT NULL AFTER elective_group');
      }

      // Default category for legacy subjects if missing
      const [coreCategory] = await pool.query('SELECT id FROM subject_categories WHERE code = "CORE" LIMIT 1');
      if (coreCategory.length > 0) {
        await pool.query('UPDATE subjects SET category_id = ? WHERE category_id IS NULL', [coreCategory[0].id]);
      }

      // Add indexes for performance optimization
      const indexesToEnsure = [
        { name: 'idx_subjects_code', col: 'code' },
        { name: 'idx_subjects_department', col: 'department_id' },
        { name: 'idx_subjects_course', col: 'course_id' },
        { name: 'idx_subjects_semester', col: 'semester_id' },
        { name: 'idx_subjects_category', col: 'category_id' },
        { name: 'idx_subjects_academic_year', col: 'academic_year_id' }
      ];

      for (const idx of indexesToEnsure) {
        try {
          await pool.query(`CREATE INDEX ${idx.name} ON subjects (${idx.col})`);
        } catch (e) {}
      }

    } catch (colErr) {
      console.warn('[DATABASE INIT] Note on subjects columns:', colErr.message);
    }

    // 12.b Program Subjects Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS program_subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        program_id INT NOT NULL,
        subject_id INT NOT NULL,
        semester_id INT NULL,
        academic_year_id INT NULL,
        category_id INT NULL,
        is_elective TINYINT(1) DEFAULT 0,
        elective_group VARCHAR(100) NULL,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (program_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
        FOREIGN KEY (category_id) REFERENCES subject_categories(id) ON DELETE SET NULL
      )
    `);

    // 12.c Regulations Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS regulations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        effective_year INT NOT NULL,
        description TEXT,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed standard regulations
    const initialRegulations = [
      { name: 'R24', year: 2024, description: 'New Outcome-Based Education (OBE) Curriculum Model 2024-2028' },
      { name: 'R22', year: 2022, description: 'Choice Based Credit System (CBCS) Standard Curriculum 2022-2026' },
      { name: 'R20', year: 2020, description: 'Autonomous Academic Regulations 2020-2024' }
    ];

    for (const reg of initialRegulations) {
      await pool.query(
        `INSERT INTO regulations (name, effective_year, description, status)
         VALUES (?, ?, ?, 'Active')
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [reg.name, reg.year, reg.description]
      );
    }

    // 12.d Curriculums Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS curriculums (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department_id INT NULL,
        course_id INT NULL,
        regulation_id INT NULL,
        academic_year_id INT NULL,
        semester_id INT NULL,
        total_credits DECIMAL(5,1) DEFAULT 0,
        total_subjects INT DEFAULT 0,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE CASCADE,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL
      )
    `);

    // Ensure columns exist on pre-existing curriculums table
    try {
      const [currCols] = await pool.query('DESCRIBE curriculums');
      const currColNames = currCols.map(c => c.Field);
      if (!currColNames.includes('total_subjects')) {
        await pool.query('ALTER TABLE curriculums ADD COLUMN total_subjects INT DEFAULT 0');
      }
      if (!currColNames.includes('status')) {
        await pool.query("ALTER TABLE curriculums ADD COLUMN status ENUM('Active', 'Inactive') DEFAULT 'Active'");
      }
    } catch (colErr) {
      console.warn('[DATABASE INIT] Note on curriculums columns:', colErr.message);
    }

    // 12.e Curriculum Subjects Mapping Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS curriculum_subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        curriculum_id INT NOT NULL,
        subject_id INT NOT NULL,
        is_compulsory TINYINT(1) DEFAULT 1,
        is_elective TINYINT(1) DEFAULT 0,
        is_lab TINYINT(1) DEFAULT 0,
        elective_group VARCHAR(100) NULL,
        credits DECIMAL(3,1) DEFAULT 3.0,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);

    // Ensure columns exist on pre-existing curriculum_subjects table
    try {
      const [csCols] = await pool.query('DESCRIBE curriculum_subjects');
      const csColNames = csCols.map(c => c.Field);
      if (!csColNames.includes('is_compulsory')) {
        await pool.query('ALTER TABLE curriculum_subjects ADD COLUMN is_compulsory TINYINT(1) DEFAULT 1');
      }
      if (!csColNames.includes('is_elective')) {
        await pool.query('ALTER TABLE curriculum_subjects ADD COLUMN is_elective TINYINT(1) DEFAULT 0');
      }
      if (!csColNames.includes('is_lab')) {
        await pool.query('ALTER TABLE curriculum_subjects ADD COLUMN is_lab TINYINT(1) DEFAULT 0');
      }
      if (!csColNames.includes('elective_group')) {
        await pool.query('ALTER TABLE curriculum_subjects ADD COLUMN elective_group VARCHAR(100) NULL');
      }
      if (!csColNames.includes('credits')) {
        await pool.query('ALTER TABLE curriculum_subjects ADD COLUMN credits DECIMAL(3,1) DEFAULT 3.0');
      }
      if (!csColNames.includes('status')) {
        await pool.query("ALTER TABLE curriculum_subjects ADD COLUMN status ENUM('Active', 'Inactive') DEFAULT 'Active'");
      }
    } catch (colErr) {
      console.warn('[DATABASE INIT] Note on curriculum_subjects columns:', colErr.message);
    }

    // 12.f Subject Allocations Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subject_allocations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department_id INT NULL,
        course_id INT NULL,
        regulation_id INT NULL,
        curriculum_id INT NULL,
        academic_year_id INT NULL,
        semester_id INT NULL,
        section_id INT NOT NULL,
        subject_id INT NOT NULL,
        faculty_id INT NOT NULL,
        weekly_hours INT DEFAULT 3,
        academic_session VARCHAR(50) NULL,
        start_date DATE NULL,
        end_date DATE NULL,
        status ENUM('Active', 'Pending Approval', 'Archived') DEFAULT 'Active',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
        FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE SET NULL,
        FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE SET NULL,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
        FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE
      )
    `);

    // Ensure columns exist on pre-existing subject_allocations table
    try {
      const [saCols] = await pool.query('DESCRIBE subject_allocations');
      const saColNames = saCols.map(c => c.Field);
      if (!saColNames.includes('regulation_id')) {
        await pool.query('ALTER TABLE subject_allocations ADD COLUMN regulation_id INT NULL AFTER course_id');
      }
      if (!saColNames.includes('curriculum_id')) {
        await pool.query('ALTER TABLE subject_allocations ADD COLUMN curriculum_id INT NULL AFTER regulation_id');
      }
    } catch (colErr) {
      console.warn('[DATABASE INIT] Note on subject_allocations columns:', colErr.message);
    }

    // 12.g Student Subject Registrations Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_subject_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        subject_id INT NOT NULL,
        curriculum_id INT NULL,
        semester_id INT NULL,
        academic_year_id INT NULL,
        section_id INT NULL,
        registration_type ENUM('MANDATORY', 'ELECTIVE', 'LABORATORY', 'PROJECT', 'INTERNSHIP', 'SKILL') DEFAULT 'MANDATORY',
        elective_group VARCHAR(100) NULL,
        status ENUM('REGISTERED', 'DROPPED', 'CANCELLED', 'COMPLETED') DEFAULT 'REGISTERED',
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_student_subject_sem (student_id, subject_id, semester_id, academic_year_id),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE SET NULL,
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
        FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL
      )
    `);

    // 12.h Registration Periods Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registration_periods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department_id INT NULL,
        course_id INT NULL,
        regulation_id INT NULL,
        semester_id INT NULL,
        academic_year_id INT NULL,
        status ENUM('NOT_OPEN', 'OPEN', 'CLOSED') DEFAULT 'OPEN',
        start_date DATE NULL,
        end_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default open registration period if table is empty
    const [regPeriods] = await pool.query('SELECT id FROM registration_periods LIMIT 1');
    if (regPeriods.length === 0) {
      await pool.query(
        "INSERT INTO registration_periods (status, start_date, end_date) VALUES ('OPEN', CURRENT_DATE(), DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY))"
      );
    }

    // 13. Attendance header table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        section_id INT NOT NULL,
        subject_id INT NULL,
        FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);

    // 14. Attendance details table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_details (
        attendance_id INT NOT NULL,
        student_id INT NOT NULL,
        status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
        PRIMARY KEY (attendance_id, student_id),
        FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    // 14.a Attendance Sessions Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timetable_entry_id INT NULL,
        subject_id INT NOT NULL,
        faculty_id INT NOT NULL,
        section_id INT NOT NULL,
        academic_year_id INT NULL,
        semester_id INT NULL,
        date DATE NOT NULL,
        time_slot_id INT NULL,
        room_id INT NULL,
        status ENUM('SCHEDULED', 'OPEN', 'SUBMITTED', 'LOCKED', 'CANCELLED') DEFAULT 'SCHEDULED',
        cancellation_reason VARCHAR(255) NULL,
        opened_at DATETIME NULL,
        submitted_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE,
        FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
      )
    `);

    // 14.b Attendance Records Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        attendance_session_id INT NOT NULL,
        student_id INT NOT NULL,
        status ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED') DEFAULT 'PRESENT',
        verification_method ENUM('MANUAL', 'FACE', 'QR', 'OTHER') DEFAULT 'MANUAL',
        marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        marked_by INT NULL,
        UNIQUE KEY uq_session_student (attendance_session_id, student_id),
        FOREIGN KEY (attendance_session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    // 14.c Attendance Corrections Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_corrections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        attendance_record_id INT NOT NULL,
        old_status ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED'),
        new_status ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED'),
        reason TEXT NOT NULL,
        changed_by INT NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (attendance_record_id) REFERENCES attendance_records(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 14.d Attendance Settings Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        minimum_percentage DECIMAL(5,2) DEFAULT 75.00,
        warning_threshold DECIMAL(5,2) DEFAULT 80.00,
        faculty_edit_window_hours INT DEFAULT 48,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [attSettings] = await pool.query('SELECT id FROM attendance_settings LIMIT 1');
    if (attSettings.length === 0) {
      await pool.query('INSERT INTO attendance_settings (minimum_percentage, warning_threshold, faculty_edit_window_hours) VALUES (75.00, 80.00, 48)');
    }

    // 15. Exams table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        academic_year_id INT NULL,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
      )
    `);

    // 15.a Exam Types Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exam_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        code VARCHAR(50) NOT NULL UNIQUE,
        description TEXT NULL
      )
    `);

    const [eTypes] = await pool.query('SELECT id FROM exam_types LIMIT 1');
    if (eTypes.length === 0) {
      await pool.query(`
        INSERT INTO exam_types (name, code, description) VALUES
        ('Internal Assessment 1', 'INTERNAL_1', 'First Internal Mid Examination'),
        ('Internal Assessment 2', 'INTERNAL_2', 'Second Internal Mid Examination'),
        ('Midterm Examination', 'MIDTERM', 'Midterm Examination'),
        ('End Semester Examination', 'END_SEMESTER', 'Final End Semester Theory Exam'),
        ('Practical / Laboratory Exam', 'PRACTICAL', 'Practical Lab Examination'),
        ('Project Viva Voce', 'PROJECT_VIVA', 'Project Evaluation & Viva'),
        ('Supplementary Examination', 'SUPPLEMENTARY', 'Supply Backlog Examination'),
        ('Revaluation', 'REVALUATION', 'Answer Sheet Revaluation')
      `);
    }

    // 15.b Examinations Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS examinations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        exam_type_id INT NOT NULL,
        academic_year_id INT NULL,
        department_id INT NULL,
        course_id INT NULL,
        semester_id INT NULL,
        regulation_id INT NULL,
        start_date DATE NULL,
        end_date DATE NULL,
        status ENUM('DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'PUBLISHED', 'ARCHIVED') DEFAULT 'DRAFT',
        published_at DATETIME NULL,
        published_by INT NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (exam_type_id) REFERENCES exam_types(id) ON DELETE CASCADE
      )
    `);

    // 15.c Examination Subjects Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS examination_subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        examination_id INT NOT NULL,
        subject_id INT NOT NULL,
        max_internal_marks DECIMAL(5,2) DEFAULT 40.00,
        max_external_marks DECIMAL(5,2) DEFAULT 60.00,
        max_total_marks DECIMAL(5,2) DEFAULT 100.00,
        passing_marks DECIMAL(5,2) DEFAULT 40.00,
        exam_date DATE NULL,
        start_time TIME NULL,
        end_time TIME NULL,
        room_id INT NULL,
        UNIQUE KEY uq_exam_subject (examination_id, subject_id),
        FOREIGN KEY (examination_id) REFERENCES examinations(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);

    // 15.d Exam Eligibility Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exam_eligibility (
        id INT AUTO_INCREMENT PRIMARY KEY,
        examination_id INT NOT NULL,
        student_id INT NOT NULL,
        subject_id INT NOT NULL,
        attendance_percentage DECIMAL(5,2) DEFAULT 0.00,
        is_eligible TINYINT(1) DEFAULT 1,
        override_reason TEXT NULL,
        overridden_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_exam_student_subject (examination_id, student_id, subject_id),
        FOREIGN KEY (examination_id) REFERENCES examinations(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);

    // 16. Marks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS marks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        exam_id INT NOT NULL,
        student_id INT NOT NULL,
        subject_id INT NOT NULL,
        marks_obtained DECIMAL(5,2) NOT NULL,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);

    // 16.a Student Marks Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_marks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        examination_id INT NOT NULL,
        subject_id INT NOT NULL,
        student_id INT NOT NULL,
        internal_marks DECIMAL(5,2) DEFAULT 0.00,
        external_marks DECIMAL(5,2) DEFAULT 0.00,
        total_marks DECIMAL(5,2) DEFAULT 0.00,
        grade VARCHAR(10) NULL,
        grade_point DECIMAL(3,1) DEFAULT 0.0,
        status ENUM('DRAFT', 'SUBMITTED', 'VERIFIED', 'PUBLISHED') DEFAULT 'DRAFT',
        result_status ENUM('PASS', 'FAIL') DEFAULT 'PASS',
        evaluated_by INT NULL,
        submitted_at DATETIME NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_exam_student_sub_mark (examination_id, subject_id, student_id),
        FOREIGN KEY (examination_id) REFERENCES examinations(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    // 17. Grades table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        min_mark DECIMAL(5,2) NOT NULL,
        max_mark DECIMAL(5,2) NOT NULL,
        grade VARCHAR(5) NOT NULL
      )
    `);

    // 17.a Grade Rules Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grade_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        min_mark DECIMAL(5,2) NOT NULL,
        max_mark DECIMAL(5,2) NOT NULL,
        grade VARCHAR(10) NOT NULL,
        grade_point DECIMAL(3,1) NOT NULL,
        result_status ENUM('PASS', 'FAIL') DEFAULT 'PASS'
      )
    `);

    const [gRules] = await pool.query('SELECT id FROM grade_rules LIMIT 1');
    if (gRules.length === 0) {
      await pool.query(`
        INSERT INTO grade_rules (min_mark, max_mark, grade, grade_point, result_status) VALUES
        (90.00, 100.00, 'O', 10.0, 'PASS'),
        (80.00, 89.99, 'A+', 9.0, 'PASS'),
        (70.00, 79.99, 'A', 8.0, 'PASS'),
        (60.00, 69.99, 'B+', 7.0, 'PASS'),
        (50.00, 59.99, 'B', 6.0, 'PASS'),
        (40.00, 49.99, 'C', 5.0, 'PASS'),
        (0.00, 39.99, 'F', 0.0, 'FAIL')
      `);
    }

    // 18. Results table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        exam_id INT NOT NULL,
        total_marks DECIMAL(7,2) NOT NULL,
        grade VARCHAR(5),
        status ENUM('pass', 'fail') NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
      )
    `);

    // 18.a Student Results Table (SGPA & CGPA Summary)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        semester_id INT NOT NULL,
        academic_year_id INT NULL,
        sgpa DECIMAL(4,2) DEFAULT 0.00,
        cgpa DECIMAL(4,2) DEFAULT 0.00,
        total_credits_earned INT DEFAULT 0,
        backlogs_count INT DEFAULT 0,
        overall_status ENUM('PASS', 'FAIL', 'WITHHELD') DEFAULT 'PASS',
        status ENUM('DRAFT', 'VERIFIED', 'PUBLISHED') DEFAULT 'DRAFT',
        published_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_student_semester_result (student_id, semester_id),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
      )
    `);

    // 18.b Backlogs Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS backlogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        subject_id INT NOT NULL,
        original_exam_id INT NOT NULL,
        status ENUM('ACTIVE', 'CLEARED') DEFAULT 'ACTIVE',
        cleared_exam_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        cleared_at DATETIME NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (original_exam_id) REFERENCES examinations(id) ON DELETE CASCADE
      )
    `);

    // 18.c Revaluation Requests Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS revaluation_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mark_id INT NOT NULL,
        student_id INT NOT NULL,
        reason TEXT NOT NULL,
        old_marks DECIMAL(5,2) NULL,
        new_marks DECIMAL(5,2) NULL,
        status ENUM('PENDING', 'APPROVED', 'REJECTED', 'UPDATED') DEFAULT 'PENDING',
        reviewed_by INT NULL,
        decision_notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mark_id) REFERENCES student_marks(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    // 19.a Fee Categories Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fee_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        code VARCHAR(50) NOT NULL UNIQUE,
        description TEXT NULL,
        is_active TINYINT(1) DEFAULT 1
      )
    `);

    const [fCats] = await pool.query('SELECT id FROM fee_categories LIMIT 1');
    if (fCats.length === 0) {
      await pool.query(`
        INSERT INTO fee_categories (name, code, description) VALUES
        ('Tuition Fee', 'TUITION_FEE', 'Academic Tuition Fee'),
        ('Admission Fee', 'ADMISSION_FEE', 'One-time Admission Fee'),
        ('Examination Fee', 'EXAMINATION_FEE', 'Semester Examination Fee'),
        ('Laboratory Fee', 'LAB_FEE', 'Laboratory Infrastructure Fee'),
        ('Library Fee', 'LIBRARY_FEE', 'Library Subscription Fee'),
        ('Hostel Fee', 'HOSTEL_FEE', 'Hostel Boarding Fee'),
        ('Transport Fee', 'TRANSPORT_FEE', 'Campus Transport Fee'),
        ('Development Fee', 'DEVELOPMENT_FEE', 'Institutional Development Fee'),
        ('Registration Fee', 'REGISTRATION_FEE', 'Enrollment & Registration Fee')
      `);
    }

    // 19.b Fee Structures Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fee_structures (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department_id INT NULL,
        course_id INT NULL,
        regulation_id INT NULL,
        academic_year_id INT NULL,
        semester_id INT NULL,
        fee_category_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        due_date DATE NULL,
        is_mandatory TINYINT(1) DEFAULT 1,
        installment_allowed TINYINT(1) DEFAULT 1,
        status ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id) ON DELETE CASCADE
      )
    `);

    try {
      const [fsCols] = await pool.query('DESCRIBE fee_structures');
      const fsNames = fsCols.map(c => c.Field);
      if (!fsNames.includes('department_id')) {
        await pool.query('ALTER TABLE fee_structures ADD COLUMN department_id INT NULL AFTER id');
      }
      if (!fsNames.includes('regulation_id')) {
        await pool.query('ALTER TABLE fee_structures ADD COLUMN regulation_id INT NULL AFTER course_id');
      }
      if (!fsNames.includes('semester_id')) {
        await pool.query('ALTER TABLE fee_structures ADD COLUMN semester_id INT NULL AFTER academic_year_id');
      }
      if (!fsNames.includes('fee_category_id')) {
        await pool.query('ALTER TABLE fee_structures ADD COLUMN fee_category_id INT NULL AFTER semester_id');
      }
      if (!fsNames.includes('due_date')) {
        await pool.query('ALTER TABLE fee_structures ADD COLUMN due_date DATE NULL AFTER amount');
      }
      if (!fsNames.includes('is_mandatory')) {
        await pool.query('ALTER TABLE fee_structures ADD COLUMN is_mandatory TINYINT(1) DEFAULT 1 AFTER due_date');
      }
      if (!fsNames.includes('installment_allowed')) {
        await pool.query('ALTER TABLE fee_structures ADD COLUMN installment_allowed TINYINT(1) DEFAULT 1 AFTER is_mandatory');
      }
      if (!fsNames.includes('status')) {
        await pool.query("ALTER TABLE fee_structures ADD COLUMN status ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE' AFTER installment_allowed");
      }
      if (!fsNames.includes('created_by')) {
        await pool.query('ALTER TABLE fee_structures ADD COLUMN created_by INT NULL AFTER status');
      }
      await pool.query('ALTER TABLE fee_structures MODIFY COLUMN course_id INT NULL');
      await pool.query('ALTER TABLE fee_structures MODIFY COLUMN academic_year_id INT NULL');
    } catch (fsErr) {
      console.error('Migration error for fee_structures:', fsErr);
    }

    // 19.c Student Fee Accounts Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_fee_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL UNIQUE,
        total_charges DECIMAL(12,2) DEFAULT 0.00,
        total_scholarships DECIMAL(12,2) DEFAULT 0.00,
        total_concessions DECIMAL(12,2) DEFAULT 0.00,
        total_paid DECIMAL(12,2) DEFAULT 0.00,
        total_refunded DECIMAL(12,2) DEFAULT 0.00,
        total_fines DECIMAL(12,2) DEFAULT 0.00,
        outstanding_balance DECIMAL(12,2) DEFAULT 0.00,
        status ENUM('PAID', 'PARTIALLY_PAID', 'PENDING', 'OVERDUE', 'WAIVED') DEFAULT 'PENDING',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    // 19.d Student Fee Items Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_fee_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_fee_account_id INT NOT NULL,
        student_id INT NOT NULL,
        fee_structure_id INT NULL,
        fee_category_id INT NOT NULL,
        academic_year_id INT NULL,
        semester_id INT NULL,
        amount DECIMAL(12,2) NOT NULL,
        due_date DATE NULL,
        paid_amount DECIMAL(12,2) DEFAULT 0.00,
        status ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'WAIVED') DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_fee_account_id) REFERENCES student_fee_accounts(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id) ON DELETE CASCADE
      )
    `);

    // 19.e Scholarships Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scholarships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        type ENUM('FIXED_AMOUNT', 'PERCENTAGE') DEFAULT 'PERCENTAGE',
        amount_or_percentage DECIMAL(10,2) NOT NULL,
        description TEXT NULL,
        status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE'
      )
    `);

    const [sSchols] = await pool.query('SELECT id FROM scholarships LIMIT 1');
    if (sSchols.length === 0) {
      await pool.query(`
        INSERT INTO scholarships (name, code, type, amount_or_percentage, description) VALUES
        ('Merit Excellence Scholarship', 'MERIT_25', 'PERCENTAGE', 25.00, '25% Tuition Fee Waiver for Top Academic Performers'),
        ('Need-Based Assistance Scholarship', 'NEED_10000', 'FIXED_AMOUNT', 10000.00, 'Flat ₹10,000 Financial Aid Scholarship'),
        ('Sports Achievement Scholarship', 'SPORTS_50', 'PERCENTAGE', 50.00, '50% Fee Concession for National Sports Medalists')
      `);
    }

    // 19.f Student Scholarships Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_scholarships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        scholarship_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        academic_year_id INT NULL,
        semester_id INT NULL,
        reason TEXT NULL,
        approved_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE
      )
    `);

    // 19.g Concessions Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS concessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        fee_category_id INT NULL,
        amount DECIMAL(12,2) NOT NULL,
        reason TEXT NOT NULL,
        approved_by INT NOT NULL,
        academic_year_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    try {
      const [cCols] = await pool.query('DESCRIBE concessions');
      const cNames = cCols.map(c => c.Field);
      if (!cNames.includes('fee_category_id')) {
        await pool.query('ALTER TABLE concessions ADD COLUMN fee_category_id INT NULL AFTER student_id');
      }
    } catch (cErr) {}

    // 19.h Payments Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        receipt_number VARCHAR(100) NOT NULL UNIQUE,
        student_id INT NOT NULL,
        student_fee_account_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        payment_method ENUM('ONLINE', 'BANK_TRANSFER', 'CARD', 'UPI', 'CASH', 'CHEQUE') DEFAULT 'UPI',
        transaction_reference VARCHAR(150) NOT NULL,
        status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') DEFAULT 'SUCCESS',
        payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INT NULL,
        verified_by INT NULL,
        verified_at DATETIME NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    try {
      const [pCols] = await pool.query('DESCRIBE payments');
      const pNames = pCols.map(c => c.Field);
      if (!pNames.includes('receipt_number')) {
        await pool.query('ALTER TABLE payments ADD COLUMN receipt_number VARCHAR(100) NULL AFTER id');
      }
      if (!pNames.includes('student_id')) {
        await pool.query('ALTER TABLE payments ADD COLUMN student_id INT NULL AFTER receipt_number');
      }
      if (!pNames.includes('student_fee_account_id')) {
        await pool.query('ALTER TABLE payments ADD COLUMN student_fee_account_id INT NULL AFTER student_id');
      }
      if (!pNames.includes('payment_method')) {
        await pool.query("ALTER TABLE payments ADD COLUMN payment_method ENUM('ONLINE', 'BANK_TRANSFER', 'CARD', 'UPI', 'CASH', 'CHEQUE') DEFAULT 'UPI' AFTER amount");
      }
      if (!pNames.includes('transaction_reference')) {
        await pool.query('ALTER TABLE payments ADD COLUMN transaction_reference VARCHAR(150) NULL AFTER payment_method');
      }
      if (!pNames.includes('status')) {
        await pool.query("ALTER TABLE payments ADD COLUMN status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') DEFAULT 'SUCCESS' AFTER transaction_reference");
      }
      if (!pNames.includes('created_by')) {
        await pool.query('ALTER TABLE payments ADD COLUMN created_by INT NULL AFTER status');
      }
      if (!pNames.includes('verified_by')) {
        await pool.query('ALTER TABLE payments ADD COLUMN verified_by INT NULL AFTER created_by');
      }
      if (!pNames.includes('verified_at')) {
        await pool.query('ALTER TABLE payments ADD COLUMN verified_at DATETIME NULL AFTER verified_by');
      }
      await pool.query('ALTER TABLE payments MODIFY COLUMN student_fee_id INT NULL');
      await pool.query('ALTER TABLE payments MODIFY COLUMN payment_date DATETIME DEFAULT CURRENT_TIMESTAMP');
    } catch (pErr) {
      console.error('Migration error for payments:', pErr);
    }

    // 19.i Refunds Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refunds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        payment_id INT NOT NULL,
        student_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSED') DEFAULT 'REQUESTED',
        requested_by INT NULL,
        approved_by INT NULL,
        processed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    // 19.j Fines Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        student_fee_item_id INT NULL,
        amount DECIMAL(12,2) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    // 8. Face Embeddings table (AES-256-GCM Secure Storage)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS face_embeddings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        encrypted_embedding MEDIUMBLOB NOT NULL,
        encryption_iv VARBINARY(16) NOT NULL,
        auth_tag VARBINARY(16) NULL,
        key_version VARCHAR(32) DEFAULT 'v1',
        model_version VARCHAR(64) DEFAULT 'sface_yunet_v1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      )
    `);

    // Ensure existing pre-migration tables are automatically upgraded
    try {
      const [faceCols] = await pool.query('DESCRIBE face_embeddings');
      const colNames = faceCols.map(c => c.Field);
      if (!colNames.includes('auth_tag')) {
        await pool.query('ALTER TABLE face_embeddings ADD COLUMN auth_tag VARBINARY(16) NULL AFTER encryption_iv');
      }
      if (!colNames.includes('key_version')) {
        await pool.query("ALTER TABLE face_embeddings ADD COLUMN key_version VARCHAR(32) DEFAULT 'v1' AFTER auth_tag");
      }
      if (!colNames.includes('model_version')) {
        await pool.query("ALTER TABLE face_embeddings ADD COLUMN model_version VARCHAR(64) DEFAULT 'sface_yunet_v1' AFTER key_version");
      }
    } catch (colErr) {
      console.warn('[DATABASE INIT] Note on face_embeddings columns:', colErr.message);
    }

    // 9. Face Auth Audit Log table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS face_auth_audit_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        matched TINYINT(1) NOT NULL,
        confidence DECIMAL(5,4) NULL,
        ip_address VARCHAR(45),
        liveness_passed TINYINT(1) NOT NULL,
        INDEX idx_face_audit_user (user_id)
      )
    `);

    // --- SEED ESSENTIAL ROLES ---
    const roles = [
      'Admin',
      'Student',
      'Faculty',
      'Parent',
      'Principal',
      'HOD',
      'Accountant',
      'Librarian',
      'Placement Officer',
      'Office Staff'
    ];

    for (const r of roles) {
      await pool.query('INSERT IGNORE INTO roles (name) VALUES (?)', [r]);
    }

    // --- PERMANENT ADMIN ACCOUNT CHECK ---
    const adminEmail = 'nuthanakalvadineshreddy@gmail.com';
    const [adminRoleRows] = await pool.query('SELECT id FROM roles WHERE name = ?', ['Admin']);
    const adminRoleId = adminRoleRows[0]?.id;

    if (adminRoleId) {
      const [existingAdmin] = await pool.query(
        'SELECT id FROM users WHERE LOWER(email) = ?',
        [adminEmail.toLowerCase()]
      );

      if (existingAdmin.length === 0) {
        const hashedPassword = await bcrypt.hash('Dinesh@123', 10);
        await pool.query(
          `INSERT INTO users (username, full_name, email, password, role_id, status)
           VALUES (?, ?, ?, ?, ?, 'active')`,
          ['dineshreddy', 'Dinesh Reddy', adminEmail, hashedPassword, adminRoleId]
        );
        console.log(`[DATABASE INIT] Permanent Admin account initialized: ${adminEmail}`);
      } else {
        await pool.query(
          `UPDATE users SET role_id = ?, full_name = COALESCE(NULLIF(full_name, ''), 'Dinesh Reddy'), status = 'active' WHERE id = ?`,
          [adminRoleId, existingAdmin[0].id]
        );
      }
    }

    console.log('[DATABASE INIT] Schema, roles, and permanent Admin verified successfully.');
    return { success: true, message: 'Database schema and permanent admin ready' };
  } catch (err) {
    console.error('[DATABASE INIT ERROR]:', err);
    return { success: false, error: err.message };
  }
}
