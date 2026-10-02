import bcrypt from 'bcryptjs';
import pool, { ensureBiometricTables } from './db.js';

export async function initializeDatabase() {
  console.log('[DATABASE INIT] Checking and initializing database schema & default seed users...');
  
  try {
    await ensureBiometricTables();

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
        department VARCHAR(150) NULL,
        phone VARCHAR(25) NULL,
        designation VARCHAR(100) NULL,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        must_change_password TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
      )
    `);

    // Ensure full_name, department, phone, designation, and must_change_password columns exist for pre-existing tables
    try {
      const [uCols] = await pool.query('DESCRIBE users');
      const uColNames = uCols.map(c => c.Field);
      if (!uColNames.includes('full_name')) {
        await pool.query('ALTER TABLE users ADD COLUMN full_name VARCHAR(150) NULL AFTER username');
      }
      if (!uColNames.includes('department')) {
        await pool.query('ALTER TABLE users ADD COLUMN department VARCHAR(150) NULL AFTER role_id');
      }
      if (!uColNames.includes('phone')) {
        await pool.query('ALTER TABLE users ADD COLUMN phone VARCHAR(25) NULL AFTER department');
      }
      if (!uColNames.includes('designation')) {
        await pool.query('ALTER TABLE users ADD COLUMN designation VARCHAR(100) NULL AFTER phone');
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

    // 3b. Vehicles table (Car Name, License Plate, Vehicle Type)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        car_name VARCHAR(100) NOT NULL,
        license_plate VARCHAR(50) NULL,
        vehicle_type VARCHAR(50) DEFAULT 'Car',
        color VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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

    // Seed semesters 1 to 8 if not already present
    const [existingSemCount] = await pool.query('SELECT COUNT(*) as cnt FROM semesters');
    if (existingSemCount[0]?.cnt < 8) {
      for (let sNum = 1; sNum <= 8; sNum++) {
        await pool.query(
          'INSERT INTO semesters (name, semester_number) SELECT ?, ? WHERE NOT EXISTS (SELECT id FROM semesters WHERE semester_number = ?)',
          [`Semester ${sNum}`, sNum, sNum]
        );
      }
    }

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
        await pool.query('ALTER TABLE subjects ADD COLUMN lecture_hours INT DEFAULT 3');
      }
      if (!sColNames.includes('tutorial_hours')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN tutorial_hours INT DEFAULT 0');
      }
      if (!sColNames.includes('practical_hours')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN practical_hours INT DEFAULT 0');
      }
      if (!sColNames.includes('total_hours')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN total_hours INT DEFAULT 3');
      }
      if (!sColNames.includes('internal_marks')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN internal_marks INT DEFAULT 40');
      }
      if (!sColNames.includes('external_marks')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN external_marks INT DEFAULT 60');
      }
      if (!sColNames.includes('total_marks')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN total_marks INT DEFAULT 100');
      }
      if (!sColNames.includes('passing_marks')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN passing_marks INT DEFAULT 40');
      }
      if (!sColNames.includes('offering_type')) {
        await pool.query("ALTER TABLE subjects ADD COLUMN offering_type ENUM('Theory', 'Practical', 'Theory + Practical') DEFAULT 'Theory'");
      }
      if (!sColNames.includes('elective_group')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN elective_group VARCHAR(100) NULL');
      }
      if (!sColNames.includes('prerequisite')) {
        await pool.query('ALTER TABLE subjects ADD COLUMN prerequisite TEXT NULL');
      }
      if (!sColNames.includes('status')) {
        await pool.query("ALTER TABLE subjects ADD COLUMN status ENUM('Active', 'Inactive', 'Archived') DEFAULT 'Active'");
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
        FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
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

    // --- PHASE 2: ADVANCED ACADEMIC REGULATION & CURRICULUM SCHEMA EXPANSION ---

    // 12.g Batches Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS batches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_name VARCHAR(100) NOT NULL,
        start_year INT NOT NULL,
        end_year INT NOT NULL,
        department_id INT NOT NULL,
        regulation_id INT NOT NULL,
        status ENUM('ACTIVE', 'COMPLETED', 'ARCHIVED') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
        FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE CASCADE
      )
    `);

    // 12.h Versioned Subject Master Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subject_versions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        regulation_id INT NOT NULL,
        subject_code VARCHAR(50) NOT NULL,
        subject_name VARCHAR(150) NOT NULL,
        short_name VARCHAR(50),
        lecture_hours INT DEFAULT 3,
        tutorial_hours INT DEFAULT 0,
        practical_hours INT DEFAULT 0,
        credits DECIMAL(3,1) NOT NULL DEFAULT 3.0,
        offering_type ENUM('Theory', 'Practical', 'Theory + Practical', 'Project', 'Internship') DEFAULT 'Theory',
        category_id INT NULL,
        internal_marks INT DEFAULT 40,
        external_marks INT DEFAULT 60,
        total_marks INT DEFAULT 100,
        min_internal_pct DECIMAL(5,2) DEFAULT 40.00,
        min_external_pct DECIMAL(5,2) DEFAULT 40.00,
        min_total_pct DECIMAL(5,2) DEFAULT 40.00,
        min_attendance_pct DECIMAL(5,2) DEFAULT 75.00,
        max_attempts_allowed INT DEFAULT 5,
        is_elective TINYINT(1) DEFAULT 0,
        elective_group_id INT NULL,
        status ENUM('ACTIVE', 'INACTIVE', 'DEPRECATED') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_reg_sub_code (regulation_id, subject_code),
        FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES subject_categories(id) ON DELETE SET NULL
      )
    `);

    // 12.i Advanced Prerequisites V2 Table (Supports AND/OR logic)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subject_prerequisites_v2 (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_version_id INT NOT NULL,
        prerequisite_subject_version_id INT NOT NULL,
        logic_group_id INT DEFAULT 1,
        min_grade_required VARCHAR(10) DEFAULT 'PASS',
        min_grade_point INT DEFAULT 5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subject_version_id) REFERENCES subject_versions(id) ON DELETE CASCADE,
        FOREIGN KEY (prerequisite_subject_version_id) REFERENCES subject_versions(id) ON DELETE CASCADE
      )
    `);

    // 12.j Subject Corequisites Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subject_corequisites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_version_id INT NOT NULL,
        corequisite_subject_version_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subject_version_id) REFERENCES subject_versions(id) ON DELETE CASCADE,
        FOREIGN KEY (corequisite_subject_version_id) REFERENCES subject_versions(id) ON DELETE CASCADE
      )
    `);

    // 12.k Elective Groups Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS elective_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        regulation_id INT NOT NULL,
        group_name VARCHAR(100) NOT NULL,
        min_choices INT DEFAULT 1,
        max_choices INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE CASCADE
      )
    `);

    // 12.l Student Backlogs Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_backlogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        subject_version_id INT NOT NULL,
        original_semester_id INT NOT NULL,
        original_academic_year_id INT NOT NULL,
        attempt_count INT DEFAULT 1,
        status ENUM('OPEN_BACKLOG', 'REGISTERED_REATTEMPT', 'CLEARED', 'EXEMPTED') DEFAULT 'OPEN_BACKLOG',
        cleared_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_version_id) REFERENCES subject_versions(id) ON DELETE CASCADE,
        FOREIGN KEY (original_semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
        FOREIGN KEY (original_academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
      )
    `);

    // 12.m Immutable Exam Attempts Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_exam_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        subject_version_id INT NOT NULL,
        examination_id INT NULL,
        attempt_number INT NOT NULL DEFAULT 1,
        internal_marks_obtained DECIMAL(5,2) DEFAULT 0.00,
        external_marks_obtained DECIMAL(5,2) DEFAULT 0.00,
        total_marks_obtained DECIMAL(5,2) DEFAULT 0.00,
        letter_grade VARCHAR(10) NOT NULL,
        grade_point INT NOT NULL DEFAULT 0,
        credits_earned DECIMAL(3,1) DEFAULT 0.0,
        result_status ENUM('PASSED', 'FAILED', 'ABSENT', 'WITHHELD', 'EXEMPTED') DEFAULT 'FAILED',
        is_improvement TINYINT(1) DEFAULT 0,
        attempt_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_version_id) REFERENCES subject_versions(id) ON DELETE CASCADE
      )
    `);

    // 12.n Immutable Semester Transcripts Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_sem_transcripts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        semester_id INT NOT NULL,
        academic_year_id INT NOT NULL,
        sgpa DECIMAL(4,2) NOT NULL,
        cgpa DECIMAL(4,2) NOT NULL,
        total_registered_credits DECIMAL(5,1) NOT NULL,
        total_earned_credits DECIMAL(5,1) NOT NULL,
        backlog_count INT DEFAULT 0,
        transcript_status ENUM('DRAFT', 'OFFICIAL_PUBLISHED', 'LOCKED') DEFAULT 'OFFICIAL_PUBLISHED',
        transcript_hash VARCHAR(64) NULL,
        frozen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
      )
    `);

    // 12.o Comprehensive Academic Audit Logs Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS academic_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        actor_user_id INT NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id INT NOT NULL,
        old_value JSON NULL,
        new_value JSON NULL,
        reason TEXT NULL,
        ip_address VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Ensure columns on existing regulations table
    try {
      const [regCols] = await pool.query('DESCRIBE regulations');
      const regColNames = regCols.map(c => c.Field);
      if (!regColNames.includes('code')) {
        await pool.query("ALTER TABLE regulations ADD COLUMN code VARCHAR(50) NULL");
      }
      if (!regColNames.includes('degree_name')) {
        await pool.query("ALTER TABLE regulations ADD COLUMN degree_name VARCHAR(50) DEFAULT 'B.Tech'");
      }
      if (!regColNames.includes('version')) {
        await pool.query("ALTER TABLE regulations ADD COLUMN version VARCHAR(20) DEFAULT 'v1.0'");
      }
      if (!regColNames.includes('total_required_credits')) {
        await pool.query("ALTER TABLE regulations ADD COLUMN total_required_credits DECIMAL(5,1) DEFAULT 160.0");
      }
      if (!regColNames.includes('min_promotion_credit_pct')) {
        await pool.query("ALTER TABLE regulations ADD COLUMN min_promotion_credit_pct DECIMAL(5,2) DEFAULT 50.00");
      }
      if (!regColNames.includes('max_backlogs_allowed')) {
        await pool.query("ALTER TABLE regulations ADD COLUMN max_backlogs_allowed INT DEFAULT 10");
      }
      if (!regColNames.includes('improvement_policy')) {
        await pool.query("ALTER TABLE regulations ADD COLUMN improvement_policy ENUM('BEST_GRADE', 'LATEST_GRADE') DEFAULT 'BEST_GRADE'");
      }
      if (!regColNames.includes('cgpa_calculation_rule')) {
        await pool.query("ALTER TABLE regulations ADD COLUMN cgpa_calculation_rule ENUM('ALL_ATTEMPTS', 'BEST_ATTEMPT_ONLY') DEFAULT 'BEST_ATTEMPT_ONLY'");
      }
    } catch (colErr) {
      console.warn('[DATABASE INIT] Note on regulations columns:', colErr.message);
    }

    // Ensure columns on existing students table
    try {
      const [stCols] = await pool.query('DESCRIBE students');
      const stColNames = stCols.map(c => c.Field);
      if (!stColNames.includes('batch_year')) {
        await pool.query("ALTER TABLE students ADD COLUMN batch_year INT NOT NULL DEFAULT 2024");
      }
      if (!stColNames.includes('regulation_id')) {
        await pool.query("ALTER TABLE students ADD COLUMN regulation_id INT NULL");
      }
      if (!stColNames.includes('current_semester_id')) {
        await pool.query("ALTER TABLE students ADD COLUMN current_semester_id INT NULL");
      }
      if (!stColNames.includes('academic_status')) {
        await pool.query("ALTER TABLE students ADD COLUMN academic_status ENUM('ACTIVE', 'PROMOTED', 'DETAINED_CREDITS', 'DETAINED_ATTENDANCE', 'SUSPENDED', 'GRADUATED') DEFAULT 'ACTIVE'");
      }
      if (!stColNames.includes('cumulative_credits_earned')) {
        await pool.query("ALTER TABLE students ADD COLUMN cumulative_credits_earned DECIMAL(5,1) DEFAULT 0.0");
      }
      if (!stColNames.includes('cgpa')) {
        await pool.query("ALTER TABLE students ADD COLUMN cgpa DECIMAL(4,2) DEFAULT 0.00");
      }
    } catch (colErr) {
      console.warn('[DATABASE INIT] Note on students columns:', colErr.message);
    }

    // Ensure columns on existing marks table
    try {
      const [mCols] = await pool.query('DESCRIBE marks');
      const mColNames = mCols.map(c => c.Field);
      if (!mColNames.includes('attempt_number')) {
        await pool.query("ALTER TABLE marks ADD COLUMN attempt_number INT DEFAULT 1");
      }
      if (!mColNames.includes('is_improvement')) {
        await pool.query("ALTER TABLE marks ADD COLUMN is_improvement TINYINT(1) DEFAULT 0");
      }
      if (!mColNames.includes('regulation_id')) {
        await pool.query("ALTER TABLE marks ADD COLUMN regulation_id INT NULL");
      }
      if (!mColNames.includes('letter_grade')) {
        await pool.query("ALTER TABLE marks ADD COLUMN letter_grade VARCHAR(10) NULL");
      }
      if (!mColNames.includes('grade_point')) {
        await pool.query("ALTER TABLE marks ADD COLUMN grade_point INT DEFAULT 0");
      }
      if (!mColNames.includes('credits_earned')) {
        await pool.query("ALTER TABLE marks ADD COLUMN credits_earned DECIMAL(3,1) DEFAULT 0.0");
      }
    } catch (colErr) {
      console.warn('[DATABASE INIT] Note on marks columns:', colErr.message);
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

    // --- PHASE 2 EXTENSION: SUBJECT OFFERING & MULTI-FACULTY REGISTRATION TABLES ---

    // 12.i Subject Offerings Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subject_offerings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        offering_code VARCHAR(100) NOT NULL UNIQUE,
        academic_year_id INT NOT NULL,
        semester_id INT NOT NULL,
        regulation_id INT NOT NULL,
        department_id INT NOT NULL,
        course_id INT NOT NULL,
        section_id INT NOT NULL,
        subject_version_id INT NOT NULL,
        max_students INT NOT NULL DEFAULT 60,
        current_students INT NOT NULL DEFAULT 0,
        registration_start DATETIME NULL,
        registration_end DATETIME NULL,
        status ENUM('DRAFT', 'OPEN', 'CLOSED', 'CANCELLED', 'COMPLETED') DEFAULT 'OPEN',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_offering_sec_sub (subject_version_id, section_id, semester_id, academic_year_id),
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
        FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_version_id) REFERENCES subject_versions(id) ON DELETE CASCADE
      )
    `);

    // 12.j Multi-Faculty Offering Assignments Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS faculty_offering_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        offering_id INT NOT NULL,
        faculty_id INT NOT NULL,
        component_type ENUM('THEORY', 'LABORATORY', 'TUTORIAL', 'MAIN') DEFAULT 'MAIN',
        assigned_by INT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
        UNIQUE KEY uq_offering_faculty_comp (offering_id, faculty_id, component_type),
        FOREIGN KEY (offering_id) REFERENCES subject_offerings(id) ON DELETE CASCADE,
        FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 12.k Student Semester Registrations Header Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_semester_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        academic_year_id INT NOT NULL,
        semester_id INT NOT NULL,
        regulation_id INT NOT NULL,
        department_id INT NOT NULL,
        section_id INT NOT NULL,
        total_credits DECIMAL(5,1) DEFAULT 0.0,
        status ENUM('DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'LOCKED', 'CANCELLED') DEFAULT 'DRAFT',
        submitted_at DATETIME NULL,
        approved_by INT NULL,
        approved_at DATETIME NULL,
        locked_at DATETIME NULL,
        remarks TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_student_sem_reg (student_id, semester_id, academic_year_id),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
        FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
        FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 12.l Student Offering Enrollments Item Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_offering_enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        semester_registration_id INT NOT NULL,
        student_id INT NOT NULL,
        offering_id INT NOT NULL,
        subject_version_id INT NOT NULL,
        registration_category ENUM('REGULAR_CURRENT', 'BACKLOG', 'REPEAT', 'IMPROVEMENT', 'ELECTIVE') DEFAULT 'REGULAR_CURRENT',
        credits DECIMAL(3,1) DEFAULT 3.0,
        status ENUM('ENROLLED', 'DROPPED', 'CANCELLED') DEFAULT 'ENROLLED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_student_offering (student_id, offering_id),
        FOREIGN KEY (semester_registration_id) REFERENCES student_semester_registrations(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (offering_id) REFERENCES subject_offerings(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_version_id) REFERENCES subject_versions(id) ON DELETE CASCADE
      )
    `);

    // 12.m CBCS Choice Registration Windows Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cbcs_registration_windows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        academic_year_id INT NOT NULL DEFAULT 1,
        semester_id INT NOT NULL,
        regulation_id INT NOT NULL DEFAULT 1,
        department_id INT NULL,
        start_datetime DATETIME NOT NULL,
        end_datetime DATETIME NOT NULL,
        min_credits DECIMAL(4,1) DEFAULT 16.0,
        max_credits DECIMAL(4,1) DEFAULT 26.0,
        status ENUM('DRAFT', 'OPEN', 'ALLOCATION_PROCESSED', 'CLOSED') DEFAULT 'OPEN',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 12.n Student CBCS Elective Ranked Preferences Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_cbcs_preferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        window_id INT NOT NULL,
        student_id INT NOT NULL,
        elective_group VARCHAR(50) NOT NULL DEFAULT 'PE-1',
        offering_id INT NOT NULL,
        preference_rank INT NOT NULL,
        status ENUM('PENDING', 'ALLOCATED', 'REJECTED_FULL', 'REJECTED_PREREQ') DEFAULT 'PENDING',
        allocated_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_st_win_grp_rank (window_id, student_id, elective_group, preference_rank),
        UNIQUE KEY uq_st_win_offering (window_id, student_id, offering_id)
      )
    `);

    // 12.o CBCS Automated Allocation Execution Logs Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cbcs_allocation_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        window_id INT NOT NULL,
        total_students_processed INT DEFAULT 0,
        total_allocated INT DEFAULT 0,
        total_unallocated INT DEFAULT 0,
        preference_1_count INT DEFAULT 0,
        preference_2_count INT DEFAULT 0,
        preference_3_plus_count INT DEFAULT 0,
        executed_by INT NULL,
        execution_details JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
        FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
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
      if (pNames.includes('student_fee_id')) {
        await pool.query('ALTER TABLE payments MODIFY COLUMN student_fee_id INT NULL');
      }
      if (pNames.includes('payment_date')) {
        await pool.query('ALTER TABLE payments MODIFY COLUMN payment_date DATETIME DEFAULT CURRENT_TIMESTAMP');
      }
    } catch (pErr) {
      console.error('Migration error for payments:', pErr.message);
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

    // 20.a Library Branches Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS library_branches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL UNIQUE,
        location VARCHAR(200) NULL,
        building VARCHAR(100) NULL,
        floor VARCHAR(50) NULL,
        contact VARCHAR(50) NULL,
        opening_time TIME DEFAULT '08:00:00',
        closing_time TIME DEFAULT '20:00:00',
        status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE'
      )
    `);

    const [lBranches] = await pool.query('SELECT id FROM library_branches LIMIT 1');
    if (lBranches.length === 0) {
      await pool.query(`
        INSERT INTO library_branches (name, location, building, floor, contact) VALUES
        ('Central Library', 'Main Campus Ground Floor', 'Main Academic Building', 'Ground Floor', '+91-9876543210'),
        ('Central Digital Library', 'Tech Block 2nd Floor', 'Science & Tech Block', '2nd Floor', '+91-9876543211'),
        ('CSE Department Library', 'CSE Wing 3rd Floor', 'Engineering Block A', '3rd Floor', '+91-9876543212')
      `);
    }

    // 20.b Library Sections Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS library_sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL,
        FOREIGN KEY (branch_id) REFERENCES library_branches(id) ON DELETE CASCADE
      )
    `);

    const [lSecs] = await pool.query('SELECT id FROM library_sections LIMIT 1');
    if (lSecs.length === 0) {
      const [b1] = await pool.query('SELECT id FROM library_branches ORDER BY id ASC LIMIT 1');
      const branchId = b1[0]?.id || 1;
      await pool.query('INSERT IGNORE INTO library_sections (id, branch_id, name, code) VALUES (1, ?, "Computer Science", "SEC-CSE")', [branchId]);
      await pool.query('INSERT IGNORE INTO library_sections (id, branch_id, name, code) VALUES (2, ?, "Electronics & Tech", "SEC-ECE")', [branchId]);
      await pool.query('INSERT IGNORE INTO library_sections (id, branch_id, name, code) VALUES (3, ?, "General Reference", "SEC-REF")', [branchId]);
    }

    // 20.c Library Shelves Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS library_shelves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        section_id INT NOT NULL,
        shelf_code VARCHAR(50) NOT NULL UNIQUE,
        shelf_name VARCHAR(100) NOT NULL,
        capacity INT DEFAULT 150,
        FOREIGN KEY (section_id) REFERENCES library_sections(id) ON DELETE CASCADE
      )
    `);

    const [lShelves] = await pool.query('SELECT id FROM library_shelves LIMIT 1');
    if (lShelves.length === 0) {
      const [s1] = await pool.query('SELECT id FROM library_sections ORDER BY id ASC LIMIT 1');
      const secId = s1[0]?.id || 1;
      await pool.query('INSERT IGNORE INTO library_shelves (id, section_id, shelf_code, shelf_name, capacity) VALUES (1, ?, "CSE-A-12", "Database & OS Shelf", 150)', [secId]);
      await pool.query('INSERT IGNORE INTO library_shelves (id, section_id, shelf_code, shelf_name, capacity) VALUES (2, ?, "CSE-B-04", "Programming & Algorithms Shelf", 150)', [secId]);
      await pool.query('INSERT IGNORE INTO library_shelves (id, section_id, shelf_code, shelf_name, capacity) VALUES (3, ?, "ECE-A-01", "Digital Electronics Shelf", 150)', [secId]);
    }

    // 20.d Book Categories Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS book_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        code VARCHAR(50) NULL,
        description TEXT NULL
      )
    `);

    try {
      const [catCols] = await pool.query('DESCRIBE book_categories');
      const catNames = catCols.map(c => c.Field);
      if (!catNames.includes('code')) {
        await pool.query('ALTER TABLE book_categories ADD COLUMN code VARCHAR(50) NULL AFTER name');
      }
      if (!catNames.includes('description')) {
        await pool.query('ALTER TABLE book_categories ADD COLUMN description TEXT NULL AFTER code');
      }
    } catch (cErr) {}

    const [bCats] = await pool.query('SELECT id FROM book_categories LIMIT 1');
    if (bCats.length === 0) {
      await pool.query(`
        INSERT INTO book_categories (name, code, description) VALUES
        ('Computer Science', 'CS', 'Computer Science & Software Engineering'),
        ('Database Management', 'DBMS', 'Database Systems & Data Modeling'),
        ('Operating Systems', 'OS', 'OS Design & Kernel Systems'),
        ('Artificial Intelligence', 'AI', 'Machine Learning & Neural Networks'),
        ('Electronics & Hardware', 'ECE', 'Digital Circuits & Microprocessors')
      `);
    }

    // 20.e Authors Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS authors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        biography TEXT NULL,
        country VARCHAR(100) NULL
      )
    `);

    const [bAuths] = await pool.query('SELECT id FROM authors LIMIT 1');
    if (bAuths.length === 0) {
      await pool.query(`
        INSERT INTO authors (name, biography, country) VALUES
        ('Abraham Silberschatz', 'Co-author of Database System Concepts & OS Concepts', 'USA'),
        ('Henry F. Korth', 'Professor of CS at Lehigh University', 'USA'),
        ('S. Sudarshan', 'Professor of CS at IIT Bombay', 'India'),
        ('Robert C. Martin', 'Author of Clean Code and Agile Principles', 'USA')
      `);
    }

    // 20.f Publishers Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS publishers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL UNIQUE,
        contact VARCHAR(100) NULL,
        website VARCHAR(200) NULL
      )
    `);

    const [bPubs] = await pool.query('SELECT id FROM publishers LIMIT 1');
    if (bPubs.length === 0) {
      await pool.query(`
        INSERT INTO publishers (name, contact, website) VALUES
        ('McGraw-Hill Education', 'contact@mcgraw-hill.com', 'https://www.mheducation.com'),
        ('Prentice Hall / Pearson', 'info@pearson.com', 'https://www.pearson.com'),
        ('O Reilly Media', 'support@oreilly.com', 'https://www.oreilly.com')
      `);
    }

    // 20.g Books Table (Bibliographic Entry)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        isbn VARCHAR(50) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255) NULL,
        edition VARCHAR(50) NULL,
        language VARCHAR(50) DEFAULT 'English',
        category_id INT NOT NULL,
        publisher_id INT NULL,
        publication_year INT NULL,
        pages INT NULL,
        description TEXT NULL,
        shelf_id INT NULL,
        branch_id INT NULL,
        status ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES book_categories(id),
        FOREIGN KEY (publisher_id) REFERENCES publishers(id),
        FOREIGN KEY (shelf_id) REFERENCES library_shelves(id),
        FOREIGN KEY (branch_id) REFERENCES library_branches(id)
      )
    `);

    try {
      const [bkCols] = await pool.query('DESCRIBE books');
      const bkNames = bkCols.map(c => c.Field);
      if (!bkNames.includes('subtitle')) {
        await pool.query('ALTER TABLE books ADD COLUMN subtitle VARCHAR(255) NULL AFTER title');
      }
      if (!bkNames.includes('edition')) {
        await pool.query('ALTER TABLE books ADD COLUMN edition VARCHAR(50) NULL AFTER subtitle');
      }
      if (!bkNames.includes('language')) {
        await pool.query("ALTER TABLE books ADD COLUMN language VARCHAR(50) DEFAULT 'English' AFTER edition");
      }
      if (!bkNames.includes('publisher_id')) {
        await pool.query('ALTER TABLE books ADD COLUMN publisher_id INT NULL AFTER category_id');
      }
      if (!bkNames.includes('publication_year')) {
        await pool.query('ALTER TABLE books ADD COLUMN publication_year INT NULL AFTER publisher_id');
      }
      if (!bkNames.includes('pages')) {
        await pool.query('ALTER TABLE books ADD COLUMN pages INT NULL AFTER publication_year');
      }
      if (!bkNames.includes('description')) {
        await pool.query('ALTER TABLE books ADD COLUMN description TEXT NULL AFTER pages');
      }
      if (!bkNames.includes('shelf_id')) {
        await pool.query('ALTER TABLE books ADD COLUMN shelf_id INT NULL AFTER description');
      }
      if (!bkNames.includes('branch_id')) {
        await pool.query('ALTER TABLE books ADD COLUMN branch_id INT NULL AFTER shelf_id');
      }
      if (!bkNames.includes('status')) {
        await pool.query("ALTER TABLE books ADD COLUMN status ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE' AFTER branch_id");
      }
      if (bkNames.includes('author')) {
        await pool.query('ALTER TABLE books MODIFY COLUMN author VARCHAR(100) NULL');
      }
    } catch (bkErr) {
      console.error('Migration error for books:', bkErr.message);
    }

    // 20.h Book Authors Table (Many-to-Many)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS book_authors (
        book_id INT NOT NULL,
        author_id INT NOT NULL,
        PRIMARY KEY (book_id, author_id),
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
      )
    `);

    // 20.i Book Copies Table (Physical Copies)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS book_copies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        book_id INT NOT NULL,
        accession_number VARCHAR(100) NOT NULL UNIQUE,
        barcode VARCHAR(100) NOT NULL UNIQUE,
        branch_id INT NOT NULL,
        shelf_id INT NULL,
        purchase_date DATE NULL,
        purchase_price DECIMAL(10,2) NULL,
        item_condition ENUM('NEW', 'GOOD', 'FAIR', 'DAMAGED', 'LOST') DEFAULT 'GOOD',
        status ENUM('AVAILABLE', 'ISSUED', 'RESERVED', 'LOST', 'DAMAGED', 'MAINTENANCE', 'WITHDRAWN') DEFAULT 'AVAILABLE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        FOREIGN KEY (branch_id) REFERENCES library_branches(id),
        FOREIGN KEY (shelf_id) REFERENCES library_shelves(id)
      )
    `);

    const [bBooks] = await pool.query('SELECT id FROM books LIMIT 1');
    if (bBooks.length === 0) {
      const [insB1] = await pool.query(`
        INSERT INTO books (isbn, title, subtitle, edition, category_id, publisher_id, publication_year, shelf_id, branch_id, description)
        VALUES ('978-0078022159', 'Database System Concepts', '7th Edition', '7th', 2, 1, 2019, 1, 1, 'Comprehensive reference for relational databases, SQL, and indexing.')
      `);
      const book1Id = insB1.insertId;
      await pool.query('INSERT IGNORE INTO book_authors (book_id, author_id) VALUES (?, 1), (?, 2), (?, 3)', [book1Id, book1Id, book1Id]);

      await pool.query(`
        INSERT INTO book_copies (book_id, accession_number, barcode, branch_id, shelf_id, status) VALUES
        (?, 'DBMS-001', 'BC-DBMS-001', 1, 1, 'AVAILABLE'),
        (?, 'DBMS-002', 'BC-DBMS-002', 1, 1, 'AVAILABLE'),
        (?, 'DBMS-003', 'BC-DBMS-003', 1, 1, 'AVAILABLE')
      `, [book1Id, book1Id, book1Id]);

      const [insB2] = await pool.query(`
        INSERT INTO books (isbn, title, subtitle, edition, category_id, publisher_id, publication_year, shelf_id, branch_id, description)
        VALUES ('978-0132350884', 'Clean Code: A Handbook of Agile Software Craftsmanship', '1st Edition', '1st', 1, 2, 2008, 2, 1, 'Agile software development principles and clean code practices.')
      `);
      const book2Id = insB2.insertId;
      await pool.query('INSERT IGNORE INTO book_authors (book_id, author_id) VALUES (?, 4)', [book2Id]);

      await pool.query(`
        INSERT INTO book_copies (book_id, accession_number, barcode, branch_id, shelf_id, status) VALUES
        (?, 'CC-001', 'BC-CC-001', 1, 2, 'AVAILABLE'),
        (?, 'CC-002', 'BC-CC-002', 1, 2, 'AVAILABLE')
      `, [book2Id, book2Id]);
    }

    // 20.j Library Members Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS library_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        member_type ENUM('STUDENT', 'FACULTY', 'STAFF') DEFAULT 'STUDENT',
        issue_limit INT DEFAULT 5,
        loan_period_days INT DEFAULT 14,
        status ENUM('ACTIVE', 'SUSPENDED', 'EXPIRED') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 20.k Library Issues Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS library_issues (
        id INT AUTO_INCREMENT PRIMARY KEY,
        copy_id INT NOT NULL,
        book_id INT NOT NULL,
        member_id INT NOT NULL,
        user_id INT NOT NULL,
        issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        due_date DATETIME NOT NULL,
        return_date DATETIME NULL,
        issued_by INT NULL,
        returned_by INT NULL,
        renew_count INT DEFAULT 0,
        fine_amount DECIMAL(10,2) DEFAULT 0.00,
        status ENUM('ISSUED', 'RETURNED', 'OVERDUE', 'LOST') DEFAULT 'ISSUED',
        FOREIGN KEY (copy_id) REFERENCES book_copies(id),
        FOREIGN KEY (book_id) REFERENCES books(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // 20.l Library Reservations Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS library_reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        book_id INT NOT NULL,
        user_id INT NOT NULL,
        request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiry_date DATETIME NULL,
        queue_position INT DEFAULT 1,
        status ENUM('WAITING', 'READY', 'FULFILLED', 'CANCELLED', 'EXPIRED') DEFAULT 'WAITING',
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 20.m Digital Resources Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS digital_resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        resource_type ENUM('EBOOK', 'RESEARCH_PAPER', 'JOURNAL', 'PDF', 'VIDEO', 'ONLINE') DEFAULT 'EBOOK',
        author VARCHAR(150) NULL,
        publisher VARCHAR(150) NULL,
        url_or_file VARCHAR(500) NOT NULL,
        category_id INT NULL,
        description TEXT NULL,
        access_level ENUM('PUBLIC', 'STUDENT', 'FACULTY', 'STAFF', 'ADMIN') DEFAULT 'STUDENT',
        status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [dRes] = await pool.query('SELECT id FROM digital_resources LIMIT 1');
    if (dRes.length === 0) {
      await pool.query(`
        INSERT INTO digital_resources (title, resource_type, author, url_or_file, description, access_level) VALUES
        ('Introduction to Algorithms & Data Structures E-Book', 'EBOOK', 'Thomas H. Cormen', 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/', 'Complete open courseware & textbook reference for algorithms.', 'STUDENT'),
        ('Distributed Systems Architecture Research Paper', 'RESEARCH_PAPER', 'Leslie Lamport', 'https://lamport.azurewebsites.net/pubs/time-clocks.pdf', 'Foundational paper on logical clocks and process ordering.', 'FACULTY')
      `);
    }

    // Ensure face authentication and webauthn biometric tables exist
    try {
      await pool.query('DROP TABLE IF EXISTS face_embeddings');
      await pool.query('DROP TABLE IF EXISTS face_auth_audit_log');

      await pool.query(`
        CREATE TABLE IF NOT EXISTS webauthn_credentials (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          credential_id VARCHAR(512) NOT NULL UNIQUE,
          public_key TEXT NOT NULL,
          counter INT DEFAULT 0,
          device_label VARCHAR(100) DEFAULT 'Mobile Passkey',
          transports VARCHAR(255) DEFAULT '["internal"]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS face_biometrics (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL UNIQUE,
          encrypted_template TEXT NOT NULL,
          iv VARCHAR(64) NOT NULL,
          auth_tag VARCHAR(64) NOT NULL,
          algorithm VARCHAR(32) DEFAULT 'aes-256-gcm',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS face_auth_nonces (
          nonce VARCHAR(64) PRIMARY KEY,
          user_id INT NULL,
          expires_at DATETIME NOT NULL,
          used TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      try {
        await pool.query(`ALTER TABLE face_auth_nonces MODIFY COLUMN user_id INT NULL`);
      } catch (colErr) {}

      await pool.query(`
        CREATE TABLE IF NOT EXISTS face_failed_attempts (
          user_id INT PRIMARY KEY,
          failed_count INT DEFAULT 0,
          cooldown_until DATETIME NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
    } catch (faceDbErr) {
      console.warn('[DATABASE INIT] Face biometrics tables setup warning:', faceDbErr.message);
    }

    // --- MENTORS & FACULTY ADVISORY TABLES ---
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS student_mentor_assignments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          faculty_id INT NOT NULL,
          student_id INT NOT NULL,
          academic_year VARCHAR(20) DEFAULT '2025-2026',
          status ENUM('active', 'inactive') DEFAULT 'active',
          assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS counseling_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          faculty_id INT NOT NULL,
          student_id INT NOT NULL,
          session_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          discussion TEXT NOT NULL,
          action_plan TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // --- CHANCELLOR GOVERNANCE TABLES ---
      await pool.query(`
        CREATE TABLE IF NOT EXISTS chancellor_approvals (
          id INT AUTO_INCREMENT PRIMARY KEY,
          requester_name VARCHAR(150) NOT NULL,
          requester_role VARCHAR(100) NOT NULL,
          department_name VARCHAR(150) NULL,
          request_type ENUM('Academic Policy', 'Curriculum Reform', 'Budget Proposal', 'Convocation Clearance', 'Major Event') NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          priority ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') DEFAULT 'NORMAL',
          status ENUM('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected') DEFAULT 'Submitted',
          chancellor_comments TEXT NULL,
          decided_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS chancellor_communications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sender_name VARCHAR(150) NOT NULL,
          sender_role VARCHAR(100) NOT NULL,
          department_name VARCHAR(150) NULL,
          subject VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          priority ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') DEFAULT 'NORMAL',
          status ENUM('Open', 'Acknowledged', 'Resolved') DEFAULT 'Open',
          response_history JSON NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Seed Initial Approvals if empty
      const [apprCount] = await pool.query('SELECT COUNT(*) as cnt FROM chancellor_approvals');
      if (apprCount[0]?.cnt === 0) {
        await pool.query(`
          INSERT INTO chancellor_approvals (requester_name, requester_role, department_name, request_type, title, description, priority, status) VALUES
          ('Dr. A. K. Sharma', 'Dean', 'School of Engineering', 'Academic Policy', 'Approval for AI & Data Science Curriculum Expansion 2026-27', 'Proposal to introduce 4 specialized electives in Generative AI and Quantum Computing for 3rd year B.Tech students.', 'HIGH', 'Submitted'),
          ('Prof. M. Venkatesh', 'Controller of Examinations', 'Central Examination Cell', 'Convocation Clearance', 'Final Graduation Cohort Clearance for 2026 Convocation', 'Verified 1,240 candidate degree transcripts for digital Chancellor seal and convocation diploma distribution.', 'URGENT', 'Submitted'),
          ('Dr. S. Ramesh', 'HOD', 'Department of Computer Science', 'Budget Proposal', 'Smart Robotics & IoT Research Lab Infrastructure Upgrade', 'Requisition for ₹45 Lakhs hardware budget for setting up advanced GPU workstation clusters.', 'NORMAL', 'Under Review')
        `);
      }

      // Seed Initial Communications if empty
      const [commCount] = await pool.query('SELECT COUNT(*) as cnt FROM chancellor_communications');
      if (commCount[0]?.cnt === 0) {
        await pool.query(`
          INSERT INTO chancellor_communications (sender_name, sender_role, department_name, subject, message, priority, status) VALUES
          ('Dr. P. Nair', 'Dean', 'School of Medicine', 'Interdisciplinary Bio-Tech Research Grant Proposal', 'Respectfully escalating the National Research Council Grant application for Chancellor endorsement.', 'HIGH', 'Open'),
          ('Prof. R. Menon', 'HOD', 'Electrical Engineering', 'Annual NAAC Accreditation Self-Study Report Readiness', 'The departmental self-audit for NAAC Cycle 4 is complete and ready for executive Chancellor review.', 'NORMAL', 'Acknowledged')
        `);
      }
    } catch (mentorDbErr) {
      console.warn('[DATABASE INIT] Chancellor & Mentor tables setup warning:', mentorDbErr.message);
    }

    // --- ADMISSION OFFICE MODULE TABLES ---
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admission_courses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          course_code VARCHAR(20) NOT NULL UNIQUE,
          course_name VARCHAR(150) NOT NULL,
          degree_type VARCHAR(50) DEFAULT 'B.Tech',
          department_name VARCHAR(150) NOT NULL,
          duration_years INT DEFAULT 4,
          total_seats INT DEFAULT 120,
          allocated_seats INT DEFAULT 0,
          available_seats INT DEFAULT 120,
          min_12th_percentage DECIMAL(5,2) DEFAULT 60.00,
          annual_fee DECIMAL(10,2) DEFAULT 125000.00,
          status ENUM('Active', 'Closed', 'Upcoming') DEFAULT 'Active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS applications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          application_number VARCHAR(50) NOT NULL UNIQUE,
          applicant_name VARCHAR(150) NOT NULL,
          first_name VARCHAR(75) NULL,
          last_name VARCHAR(75) NULL,
          dob DATE NULL,
          gender VARCHAR(20) NULL,
          mobile VARCHAR(25) NOT NULL,
          email VARCHAR(100) NOT NULL,
          address TEXT NULL,
          city VARCHAR(100) NULL,
          state VARCHAR(100) NULL,
          country VARCHAR(100) DEFAULT 'India',
          postal_code VARCHAR(20) NULL,
          parent_name VARCHAR(150) NULL,
          parent_relation VARCHAR(50) DEFAULT 'Parent',
          parent_mobile VARCHAR(25) NULL,
          parent_email VARCHAR(100) NULL,
          parent_occupation VARCHAR(100) NULL,
          parent_address TEXT NULL,
          school_10th VARCHAR(150) NULL,
          board_10th VARCHAR(100) NULL,
          year_10th INT NULL,
          percentage_10th DECIMAL(5,2) NULL,
          school_12th VARCHAR(150) NULL,
          board_12th VARCHAR(100) NULL,
          year_12th INT NULL,
          percentage_12th DECIMAL(5,2) NULL,
          diploma_details TEXT NULL,
          entrance_exam VARCHAR(100) NULL,
          entrance_rank VARCHAR(50) NULL,
          entrance_score DECIMAL(6,2) NULL,
          course_id INT NULL,
          course_name VARCHAR(150) NULL,
          department_name VARCHAR(150) NULL,
          admission_category VARCHAR(50) DEFAULT 'General',
          admission_type VARCHAR(50) DEFAULT 'Regular',
          application_status VARCHAR(50) DEFAULT 'Draft',
          document_status VARCHAR(50) DEFAULT 'Pending',
          eligibility_status VARCHAR(50) DEFAULT 'Pending',
          fee_status VARCHAR(50) DEFAULT 'Pending',
          fee_amount DECIMAL(10,2) DEFAULT 125000.00,
          paid_amount DECIMAL(10,2) DEFAULT 0.00,
          remarks TEXT NULL,
          allocated_seat_number VARCHAR(50) NULL,
          enrolled_student_id VARCHAR(50) NULL,
          enrollment_date DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_app_email (email),
          INDEX idx_app_mobile (mobile),
          INDEX idx_app_status (application_status)
        )
      `);

      // Safe Auto-Column Guardrails for applications table
      try {
        await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS percentage_10th DECIMAL(5,2) NULL`);
        await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS school_10th VARCHAR(150) NULL`);
        await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS board_10th VARCHAR(100) NULL`);
        await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS year_10th INT NULL`);
        await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS photo_name VARCHAR(255) NULL`);
        await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS photo_data LONGTEXT NULL`);
        await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS proof_10th_name VARCHAR(255) NULL`);
        await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS proof_10th_data LONGTEXT NULL`);
        await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS proof_12th_name VARCHAR(255) NULL`);
        await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS proof_12th_data LONGTEXT NULL`);
        await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS proof_entrance_name VARCHAR(255) NULL`);
        await pool.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS proof_entrance_data LONGTEXT NULL`);
      } catch (alterErr) {
        // Ignored if MySQL version handles IF NOT EXISTS or column already present
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS applicant_documents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          application_id INT NOT NULL,
          document_name VARCHAR(150) NOT NULL,
          file_path LONGTEXT NULL,
          verification_status VARCHAR(50) DEFAULT 'Uploaded',
          verified_by VARCHAR(100) NULL,
          verification_date DATETIME NULL,
          remarks TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
        )
      `);

      try {
        await pool.query(`ALTER TABLE applicant_documents MODIFY COLUMN file_path LONGTEXT NULL`);
      } catch (mErr) {
        // Ignored if column already LONGTEXT
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS seat_allocations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          application_id INT NOT NULL,
          course_id INT NULL,
          course_name VARCHAR(150) NOT NULL,
          department_name VARCHAR(150) NOT NULL,
          seat_number VARCHAR(50) NOT NULL,
          category VARCHAR(50) DEFAULT 'General',
          allocated_by VARCHAR(100) NOT NULL,
          allocation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS admission_fee_payments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          application_id INT NOT NULL,
          applicant_name VARCHAR(150) NOT NULL,
          course_name VARCHAR(150) NOT NULL,
          receipt_number VARCHAR(50) NOT NULL UNIQUE,
          transaction_id VARCHAR(100) NOT NULL UNIQUE,
          amount DECIMAL(10,2) NOT NULL,
          payment_method VARCHAR(50) DEFAULT 'Cash Counter',
          payment_status VARCHAR(50) DEFAULT 'Paid',
          payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(100) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
        )
      `);

      try {
        await pool.query(`ALTER TABLE admission_fee_payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      } catch (altPayErr) {
        // Ignored
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS admission_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          application_id INT NOT NULL,
          action VARCHAR(150) NOT NULL,
          previous_status VARCHAR(50) NULL,
          new_status VARCHAR(50) NULL,
          performed_by VARCHAR(100) NOT NULL,
          remarks TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
        )
      `);

      // Seed default courses if empty
      const [existingCourses] = await pool.query('SELECT COUNT(*) as count FROM admission_courses');
      if (existingCourses[0].count === 0) {
        await pool.query(`
          INSERT INTO admission_courses (course_code, course_name, degree_type, department_name, duration_years, total_seats, available_seats, min_12th_percentage, annual_fee) VALUES
          ('BTECH-CSE', 'B.Tech Computer Science & Engineering', 'B.Tech', 'Computer Science & Engineering', 4, 120, 115, 60.00, 125000.00),
          ('BTECH-ECE', 'B.Tech Electronics & Communication', 'B.Tech', 'Electronics & Communication', 4, 90, 88, 55.00, 115000.00),
          ('BTECH-ME', 'B.Tech Mechanical Engineering', 'B.Tech', 'Mechanical Engineering', 4, 60, 58, 50.00, 105000.00),
          ('BTECH-CE', 'B.Tech Civil Engineering', 'B.Tech', 'Civil Engineering', 4, 60, 60, 50.00, 100000.00),
          ('MTECH-CS', 'M.Tech Software Engineering', 'M.Tech', 'Computer Science & Engineering', 2, 30, 28, 65.00, 150000.00),
          ('MBA-FIN', 'Master of Business Administration (Finance)', 'MBA', 'Management Studies', 2, 60, 55, 55.00, 180000.00)
        `);
      }
    } catch (admTablesErr) {
      console.warn('[DATABASE INIT] Admission tables setup notice:', admTablesErr.message);
    }

    // --- SEED ESSENTIAL ROLES & PERMANENT ADMIN ---
    const roles = [
      'Admin',
      'Chancellor',
      'Vice Chancellor',
      'Registrar',
      'Controller of Examinations',
      'Dean',
      'HOD',
      'Faculty',
      'Student',
      'Parent',
      'Principal',
      'Accountant',
      'Librarian',
      'Placement Officer',
      'Office Staff',
      'Admission Officer'
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
        console.log(`[DATABASE INIT] Permanent Admin account verified: ${adminEmail}`);
      } else {
        await pool.query(
          `UPDATE users SET role_id = ?, full_name = COALESCE(NULLIF(full_name, ''), 'Dinesh Reddy'), status = 'active' WHERE id = ?`,
          [adminRoleId, existingAdmin[0].id]
        );
      }
    }



    // --- SEED B.TECH MASTER CURRICULUM (SEM 1 TO SEM 8) ---
    try {
      const [existingSubjects] = await pool.query("SELECT COUNT(*) AS cnt FROM subjects WHERE regulation = 'R25'");
      if (existingSubjects[0]?.cnt < 10) {
        console.log('[DATABASE INIT] Seeding standard B.Tech R25 Semesters 1 to 8 Master Curriculum...');
        
        // Find default CSE department & semester IDs if present
        const [cseDept] = await pool.query("SELECT id FROM departments WHERE code = 'CSE' OR name LIKE '%Computer%' LIMIT 1");
        const deptId = cseDept[0]?.id || 1;

        const btechSyllabus = [
          // SEMESTER 1
          { code: '25BS101', name: 'Mathematics - I (Linear Algebra & Calculus)', sem: 1, credits: 3, type: 'Theory', cat: 'BS' },
          { code: '25BS102', name: 'Engineering Physics', sem: 1, credits: 3, type: 'Theory', cat: 'BS' },
          { code: '25CS101', name: 'Programming for Problem Solving (C)', sem: 1, credits: 3, type: 'Theory', cat: 'PC' },
          { code: '25ME101', name: 'Engineering Graphics & Design', sem: 1, credits: 3, type: 'Theory', cat: 'ES' },
          { code: '25BS1L01', name: 'Engineering Physics Lab', sem: 1, credits: 1.5, type: 'Practical', cat: 'BS' },
          { code: '25CS1L01', name: 'Programming Lab', sem: 1, credits: 1.5, type: 'Practical', cat: 'PC' },

          // SEMESTER 2
          { code: '25BS201', name: 'Mathematics - II (Differential Equations)', sem: 2, credits: 3, type: 'Theory', cat: 'BS' },
          { code: '25BS202', name: 'Engineering Chemistry', sem: 2, credits: 3, type: 'Theory', cat: 'BS' },
          { code: '25EE201', name: 'Basic Electrical & Electronics Engineering', sem: 2, credits: 3, type: 'Theory', cat: 'ES' },
          { code: '25HS201', name: 'Technical English & Communication', sem: 2, credits: 2, type: 'Theory', cat: 'HS' },
          { code: '25BS2L01', name: 'Engineering Chemistry Lab', sem: 2, credits: 1.5, type: 'Practical', cat: 'BS' },
          { code: '25EE2L01', name: 'Basic Electrical Lab', sem: 2, credits: 1.5, type: 'Practical', cat: 'ES' },

          // SEMESTER 3
          { code: '25CS301', name: 'Data Structures & Algorithms', sem: 3, credits: 4, type: 'Theory', cat: 'PC' },
          { code: '25CS302', name: 'Discrete Mathematics', sem: 3, credits: 3, type: 'Theory', cat: 'PC' },
          { code: '25CS303', name: 'Computer Organization & Architecture', sem: 3, credits: 3, type: 'Theory', cat: 'PC' },
          { code: '25CS304', name: 'Object Oriented Programming in Java', sem: 3, credits: 3, type: 'Theory', cat: 'PC' },
          { code: '25CS3L01', name: 'Data Structures Lab', sem: 3, credits: 1.5, type: 'Practical', cat: 'PC' },
          { code: '25CS3L02', name: 'Java Programming Lab', sem: 3, credits: 1.5, type: 'Practical', cat: 'PC' },

          // SEMESTER 4
          { code: '25CS401', name: 'Operating Systems', sem: 4, credits: 3, type: 'Theory', cat: 'PC' },
          { code: '25CS402', name: 'Database Management Systems', sem: 4, credits: 3, type: 'Theory', cat: 'PC' },
          { code: '25CS403', name: 'Design and Analysis of Algorithms', sem: 4, credits: 3, type: 'Theory', cat: 'PC' },
          { code: '25CS404', name: 'Formal Languages and Automata Theory', sem: 4, credits: 3, type: 'Theory', cat: 'PC' },
          { code: '25CS4L01', name: 'Operating Systems Lab', sem: 4, credits: 1.5, type: 'Practical', cat: 'PC' },
          { code: '25CS4L02', name: 'DBMS Lab', sem: 4, credits: 1.5, type: 'Practical', cat: 'PC' },

          // SEMESTER 5
          { code: '25CS501', name: 'Computer Networks', sem: 5, credits: 3, type: 'Theory', cat: 'PC' },
          { code: '25CS502', name: 'Software Engineering', sem: 5, credits: 3, type: 'Theory', cat: 'PC' },
          { code: '25CS5E01', name: 'Cloud Computing (Professional Elective - I)', sem: 5, credits: 3, type: 'Theory', cat: 'PE', group: 'PE-1' },
          { code: '25CS5O01', name: 'Artificial Intelligence Fundamentals (Open Elective - I)', sem: 5, credits: 3, type: 'Theory', cat: 'OE', group: 'OE-1' },
          { code: '25CS5L01', name: 'Computer Networks Lab', sem: 5, credits: 1.5, type: 'Practical', cat: 'PC' },

          // SEMESTER 6
          { code: '25CS601', name: 'Compiler Design', sem: 6, credits: 3, type: 'Theory', cat: 'PC' },
          { code: '25CS602', name: 'Information Security', sem: 6, credits: 3, type: 'Theory', cat: 'PC' },
          { code: '25CS6E01', name: 'Machine Learning (Professional Elective - II)', sem: 6, credits: 3, type: 'Theory', cat: 'PE', group: 'PE-2' },
          { code: '25CS6O01', name: 'Data Analytics (Open Elective - II)', sem: 6, credits: 3, type: 'Theory', cat: 'OE', group: 'OE-2' },
          { code: '25CS6L01', name: 'Machine Learning & Security Lab', sem: 6, credits: 1.5, type: 'Practical', cat: 'PC' },

          // SEMESTER 7
          { code: '25CS7E01', name: 'Deep Learning (Professional Elective - III)', sem: 7, credits: 3, type: 'Theory', cat: 'PE', group: 'PE-3' },
          { code: '25CS7E02', name: 'Blockchain Technologies (Professional Elective - IV)', sem: 7, credits: 3, type: 'Theory', cat: 'PE', group: 'PE-4' },
          { code: '25CS7O01', name: 'Management Information Systems (Open Elective - III)', sem: 7, credits: 3, type: 'Theory', cat: 'OE', group: 'OE-3' },
          { code: '25CS7P01', name: 'Industry Internship / Mini Project', sem: 7, credits: 3, type: 'Practical', cat: 'PROJ' },
          { code: '25CS7P02', name: 'Major Project Work Phase - I', sem: 7, credits: 4, type: 'Practical', cat: 'PROJ' },

          // SEMESTER 8
          { code: '25CS8E01', name: 'DevOps & Cloud Operations (Professional Elective - V)', sem: 8, credits: 3, type: 'Theory', cat: 'PE', group: 'PE-5' },
          { code: '25CS8P01', name: 'Major Project Work Phase - II & Viva-Voce', sem: 8, credits: 10, type: 'Practical', cat: 'PROJ' }
        ];

        for (const s of btechSyllabus) {
          // Find or fallback semester_id
          const [semRows] = await pool.query('SELECT id FROM semesters WHERE semester_number = ? LIMIT 1', [s.sem]);
          const semesterId = semRows[0]?.id || null;

          await pool.query(
            `INSERT INTO subjects (
              code, name, short_name, department_id, semester_id, regulation,
              credits, lecture_hours, tutorial_hours, practical_hours, total_hours,
              internal_marks, external_marks, total_marks, passing_marks,
              offering_type, elective_group, status
            ) VALUES (?, ?, ?, ?, ?, 'R25', ?, ?, 0, ?, ?, 40, 60, 100, 40, ?, ?, 'Active')
            ON DUPLICATE KEY UPDATE name = VALUES(name), credits = VALUES(credits)`,
            [
              s.code,
              s.name,
              s.code,
              deptId,
              semesterId,
              s.credits,
              s.type === 'Theory' ? 3 : 0,
              s.type === 'Practical' ? 3 : 0,
              3,
              s.type,
              s.group || ''
            ]
          );
        }
        console.log('[DATABASE INIT] Standard B.Tech Semesters 1 to 8 Master Curriculum seeded successfully.');
      }
    } catch (seedErr) {
      console.warn('[DATABASE INIT] Note on B.Tech curriculum seeding:', seedErr.message);
    }

    try {
      await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
      await pool.execute('DROP TABLE IF EXISTS floor_connections, floor_versions, floor_objects, floor_layers, floors, buildings, block_audit_logs');
      await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
      console.log('[DATABASE INIT] Removed Campus Block Twin database tables.');
    } catch (dropErr) {
      console.warn('[DATABASE INIT] Note on dropping block tables:', dropErr.message);
    }

    console.log('[DATABASE INIT] Schema, roles, and permanent Admin verified successfully.');
    return { success: true, message: 'Database schema and permanent admin ready' };
  } catch (err) {
    console.error('[DATABASE INIT ERROR]:', err);
    return { success: false, error: err.message };
  }
}
