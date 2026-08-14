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

    // 15. Exams table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        academic_year_id INT NULL,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
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

    // 17. Grades table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        min_mark DECIMAL(5,2) NOT NULL,
        max_mark DECIMAL(5,2) NOT NULL,
        grade VARCHAR(5) NOT NULL
      )
    `);

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
