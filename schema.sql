CREATE DATABASE IF NOT EXISTS college_management_system;
USE college_management_system;

-- 1. Authentication
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role_id INT,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    must_change_password TINYINT(1) DEFAULT 1,
    face_registered TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    ip_address VARCHAR(45),
    reason VARCHAR(255),
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_failed_user (user_id),
    INDEX idx_failed_ip (ip_address),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Academic Base
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    duration_years INT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

CREATE TABLE academic_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('Current', 'Upcoming', 'Completed') DEFAULT 'Upcoming'
);

CREATE TABLE academic_years (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    year_level INT NOT NULL
);

CREATE TABLE regulations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    effective_year INT NOT NULL,
    description TEXT,
    status ENUM('Active', 'Inactive') DEFAULT 'Active'
);

CREATE TABLE semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    semester_number INT NOT NULL,
    academic_year_id INT,
    academic_session_id INT,
    start_date DATE,
    end_date DATE,
    status ENUM('Active', 'Completed', 'Upcoming') DEFAULT 'Upcoming',
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
    FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id) ON DELETE SET NULL
);

CREATE TABLE curriculums (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    course_id INT NOT NULL,
    regulation_id INT NOT NULL,
    academic_year_id INT,
    semester_id INT,
    total_credits INT DEFAULT 0,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE CASCADE,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL
);

CREATE TABLE sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    department_id INT NOT NULL,
    course_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    semester_id INT NOT NULL,
    capacity INT DEFAULT 60,
    classroom_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE
);

CREATE TABLE subject_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(50) NULL,
    category_id INT NULL,
    department_id INT,
    course_id INT,
    academic_year_id INT,
    semester_id INT,
    regulation_id INT NULL,
    regulation VARCHAR(50),
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
    description TEXT,
    course_outcomes TEXT,
    program_outcomes TEXT,
    status ENUM('Active', 'Inactive', 'Archived') DEFAULT 'Active',
    subject_type ENUM('Core', 'Elective', 'Lab', 'Mini Project', 'Project', 'Internship', 'Open Elective', 'Skill Development', 'Language') DEFAULT 'Core',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES subject_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
    INDEX idx_subjects_code (code),
    INDEX idx_subjects_department (department_id),
    INDEX idx_subjects_course (course_id),
    INDEX idx_subjects_semester (semester_id),
    INDEX idx_subjects_category (category_id),
    INDEX idx_subjects_academic_year (academic_year_id)
);

CREATE TABLE program_subjects (
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
);

-- 3. Faculty & Classrooms
CREATE TABLE faculties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    hire_date DATE,
    department_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

CREATE TABLE faculty_departments (
    faculty_id INT NOT NULL,
    department_id INT NOT NULL,
    PRIMARY KEY (faculty_id, department_id),
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- Classrooms table defined in Timetable Management System section

CREATE TABLE regulations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    effective_year INT NOT NULL,
    description TEXT,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE curriculums (
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
);

CREATE TABLE curriculum_subjects (
    curriculum_id INT NOT NULL,
    subject_id INT NOT NULL,
    type ENUM('Core', 'Elective', 'Lab', 'Project') DEFAULT 'Core',
    is_compulsory TINYINT(1) DEFAULT 1,
    is_elective TINYINT(1) DEFAULT 0,
    is_lab TINYINT(1) DEFAULT 0,
    elective_group VARCHAR(100) NULL,
    credits DECIMAL(3,1) DEFAULT 3.0,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    PRIMARY KEY (curriculum_id, subject_id),
    FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE academic_calendar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    academic_session_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    event_type ENUM('Exam', 'Event', 'Workshop', 'Parent Meeting', 'Holiday') DEFAULT 'Event',
    visibility ENUM('All', 'Students', 'Faculty', 'Parents') DEFAULT 'All',
    FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id) ON DELETE CASCADE
);

CREATE TABLE holidays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    academic_session_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id) ON DELETE CASCADE
);

CREATE TABLE promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    from_academic_year_id INT NOT NULL,
    to_academic_year_id INT NOT NULL,
    from_semester_id INT NOT NULL,
    to_semester_id INT NOT NULL,
    promoted_by INT,
    promotion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (from_academic_year_id) REFERENCES academic_years(id),
    FOREIGN KEY (to_academic_year_id) REFERENCES academic_years(id),
    FOREIGN KEY (from_semester_id) REFERENCES semesters(id),
    FOREIGN KEY (to_semester_id) REFERENCES semesters(id),
    FOREIGN KEY (promoted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Allocate Subjects
CREATE TABLE subject_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT,
    course_id INT,
    regulation_id INT NULL,
    curriculum_id INT NULL,
    academic_year_id INT,
    semester_id INT,
    section_id INT NOT NULL,
    subject_id INT NOT NULL,
    faculty_id INT NOT NULL,
    weekly_hours INT DEFAULT 0,
    academic_session VARCHAR(50),
    start_date DATE,
    end_date DATE,
    status ENUM('Active', 'Archived', 'Pending Approval') DEFAULT 'Active',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Students
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    admission_number VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    section_id INT,
    academic_year_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL
);

CREATE TABLE student_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE student_guardians (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE student_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL UNIQUE,
    dob DATE,
    address TEXT,
    blood_group VARCHAR(5),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 5. Parents
CREATE TABLE parents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE parent_student (
    parent_id INT NOT NULL,
    student_id INT NOT NULL,
    PRIMARY KEY (parent_id, student_id),
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 6. Attendance
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    section_id INT NOT NULL,
    subject_id INT,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE attendance_details (
    attendance_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
    PRIMARY KEY (attendance_id, student_id),
    FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 7. Examinations
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    academic_year_id INT NOT NULL,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
);

CREATE TABLE exam_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    subject_id INT NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    classroom_id INT,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL
);

CREATE TABLE marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    marks_obtained DECIMAL(5, 2) NOT NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    min_mark DECIMAL(5, 2) NOT NULL,
    max_mark DECIMAL(5, 2) NOT NULL,
    grade VARCHAR(5) NOT NULL
);

CREATE TABLE results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    exam_id INT NOT NULL,
    total_marks DECIMAL(7, 2) NOT NULL,
    grade VARCHAR(5),
    status ENUM('pass', 'fail') NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 8. Assignments
CREATE TABLE assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    faculty_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE
);

CREATE TABLE assignment_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    submission_date DATE NOT NULL,
    marks DECIMAL(5, 2),
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 9. Timetable
CREATE TABLE timetable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_id INT NOT NULL,
    subject_id INT NOT NULL,
    faculty_id INT NOT NULL,
    classroom_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
);

-- 10. Fees
CREATE TABLE fee_structures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
);

CREATE TABLE student_fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    fee_structure_id INT NOT NULL,
    total_paid DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id) ON DELETE CASCADE
);

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_fee_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    transaction_id VARCHAR(100) UNIQUE,
    FOREIGN KEY (student_fee_id) REFERENCES student_fees(id) ON DELETE CASCADE
);

-- 11. Library
CREATE TABLE book_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(50) UNIQUE,
    category_id INT,
    total_copies INT NOT NULL DEFAULT 0,
    available_copies INT NOT NULL DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES book_categories(id) ON DELETE SET NULL
);

CREATE TABLE issued_books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    user_id INT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    fine DECIMAL(5, 2) DEFAULT 0.00,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 12. Placement
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    industry VARCHAR(100),
    contact_person VARCHAR(100)
);

CREATE TABLE placement_drives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    drive_date DATE NOT NULL,
    criteria TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    placement_drive_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('applied', 'shortlisted', 'rejected', 'selected') DEFAULT 'applied',
    FOREIGN KEY (placement_drive_id) REFERENCES placement_drives(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 13. Events
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    event_date DATETIME NOT NULL,
    location VARCHAR(255),
    description TEXT
);

CREATE TABLE event_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 14. Communication
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 15. Complaints
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 16. AI
CREATE TABLE ai_chat_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE ai_call_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    call_duration INT NOT NULL,
    transcript TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 17. Logs
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 18. Mentor Management
CREATE TABLE mentor_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    student_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
    UNIQUE(student_id, academic_year_id)
);

CREATE TABLE mentor_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    student_id INT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE counseling_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    student_id INT NOT NULL,
    session_date DATETIME NOT NULL,
    discussion TEXT,
    student_problems TEXT,
    action_plan TEXT,
    followup_date DATE,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE parent_meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    parent_id INT NOT NULL,
    student_id INT NOT NULL,
    meeting_date DATETIME NOT NULL,
    notes TEXT,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE mentor_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    student_id INT NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    description TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE mentor_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE
);

CREATE TABLE mentor_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE
);

-- =========================================================
-- TIMETABLE MANAGEMENT SYSTEM
-- =========================================================

CREATE TABLE classrooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(50) NOT NULL UNIQUE,
    building VARCHAR(100),
    floor VARCHAR(50),
    capacity INT DEFAULT 60,
    room_type ENUM('Lecture Hall', 'Laboratory', 'Computer Lab', 'Seminar Hall', 'Auditorium', 'Smart Classroom') DEFAULT 'Lecture Hall',
    status ENUM('Active', 'Inactive', 'Maintenance') DEFAULT 'Active'
);

CREATE TABLE working_days (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_name ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL UNIQUE,
    is_working_day BOOLEAN DEFAULT TRUE
);

CREATE TABLE time_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    period_number INT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_break BOOLEAN DEFAULT FALSE,
    title VARCHAR(100) -- e.g., "Period 1", "Lunch Break"
);

CREATE TABLE timetable_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    course_id INT NOT NULL,
    semester_id INT NOT NULL,
    academic_session_id INT NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    status ENUM('Draft', 'Under Review', 'Approved', 'Published', 'Archived') DEFAULT 'Draft',
    published_by INT,
    published_at DATETIME,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (semester_id) REFERENCES semesters(id),
    FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id),
    FOREIGN KEY (published_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE timetable_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timetable_master_id INT NOT NULL,
    section_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    time_slot_id INT NOT NULL,
    subject_id INT NOT NULL,
    faculty_id INT NOT NULL,
    room_id INT NOT NULL,
    FOREIGN KEY (timetable_master_id) REFERENCES timetable_master(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id),
    FOREIGN KEY (time_slot_id) REFERENCES time_slots(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (faculty_id) REFERENCES faculties(id),
    FOREIGN KEY (room_id) REFERENCES classrooms(id)
);

CREATE TABLE timetable_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);


-- Student Subject Registrations Table
CREATE TABLE student_subject_registrations (
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
);

-- Registration Periods Control Table
CREATE TABLE registration_periods (
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
);

-- Attendance Sessions Table
CREATE TABLE attendance_sessions (
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
);

-- Attendance Records Table
CREATE TABLE attendance_records (
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
);

-- Attendance Corrections Table
CREATE TABLE attendance_corrections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_record_id INT NOT NULL,
    old_status ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED'),
    new_status ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED'),
    reason TEXT NOT NULL,
    changed_by INT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attendance_record_id) REFERENCES attendance_records(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Attendance Settings Table
CREATE TABLE attendance_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    minimum_percentage DECIMAL(5,2) DEFAULT 75.00,
    warning_threshold DECIMAL(5,2) DEFAULT 80.00,
    faculty_edit_window_hours INT DEFAULT 48,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exam Types Table
CREATE TABLE exam_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL
);

-- Examinations Table
CREATE TABLE examinations (
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
);

-- Examination Subjects Table
CREATE TABLE examination_subjects (
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
);

-- Exam Eligibility Table
CREATE TABLE exam_eligibility (
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
);

-- Student Marks Table
CREATE TABLE student_marks (
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
);

-- Grade Rules Table
CREATE TABLE grade_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    min_mark DECIMAL(5,2) NOT NULL,
    max_mark DECIMAL(5,2) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    grade_point DECIMAL(3,1) NOT NULL,
    result_status ENUM('PASS', 'FAIL') DEFAULT 'PASS'
);

-- Student Results Table
CREATE TABLE student_results (
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
);

-- Backlogs Table
CREATE TABLE backlogs (
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
);

-- Revaluation Requests Table
CREATE TABLE revaluation_requests (
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
);

-- Fee Categories Table
CREATE TABLE fee_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    is_active TINYINT(1) DEFAULT 1
);

-- Fee Structures Table
CREATE TABLE fee_structures (
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
);

-- Student Fee Accounts Table
CREATE TABLE student_fee_accounts (
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
);

-- Student Fee Items Table
CREATE TABLE student_fee_items (
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
);

-- Scholarships Table
CREATE TABLE scholarships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('FIXED_AMOUNT', 'PERCENTAGE') DEFAULT 'PERCENTAGE',
    amount_or_percentage DECIMAL(10,2) NOT NULL,
    description TEXT NULL,
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE'
);

-- Student Scholarships Table
CREATE TABLE student_scholarships (
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
);

-- Concessions Table
CREATE TABLE concessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    fee_category_id INT NULL,
    amount DECIMAL(12,2) NOT NULL,
    reason TEXT NOT NULL,
    approved_by INT NOT NULL,
    academic_year_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Payments Table
CREATE TABLE payments (
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
);

-- Refunds Table
CREATE TABLE refunds (
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
);

-- Fines Table
CREATE TABLE fines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    student_fee_item_id INT NULL,
    amount DECIMAL(12,2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);




