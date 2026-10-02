# Enterprise College Management System (CMS): Complete Technical Project Report

---

## 1. Executive Summary & System Identity

The **Enterprise College Management System (CMS)** is a full-stack, multi-tenant academic governance platform engineered for higher education institutions (Universities, Autonomous Colleges, and Technical Institutes). The platform strictly complies with regulatory standards set by the **UGC** (University Grants Commission) and **AICTE** (All India Council for Technical Education), incorporating a fully automated **Choice-Based Credit System (CBCS)**.

```
                                    ┌──────────────────────────────────────────┐
                                    │    Enterprise College Management System   │
                                    └────────────────────┬─────────────────────┘
                                                         │
         ┌───────────────────────┬───────────────────────┼───────────────────────┬───────────────────────┐
         │                       │                       │                       │                       │
┌────────▼────────┐     ┌────────▼────────┐     ┌────────▼────────┐     ┌────────▼────────┐     ┌────────▼────────┐
│ Academic & CBCS │     │ Admissions Desk │     │ Security & Roles│     │ Examinations &  │     │ Student/Faculty │
│ Choice Engine   │     │ & PDF Gateway   │     │ (WebAuthn/RBAC) │     │ SGPA Transcripts│     │ Portals         │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Core Technology Stack
- **Frontend Layer:** React 18, TypeScript, Vite 6, Vanilla TailwindCSS, Lucide Icons, Canvas/PDF Rendering Engines.
- **Backend API Layer:** Node.js (ES Modules), Express.js framework, JWT Authentication, Custom Security Middleware.
- **Database Engine:** MySQL 8.0, Transactional Connection Pool (`mysql2/promise`), Auto-Column Migration Guardrails.
- **Biometric & Security:** WebAuthn (FIDO2) Hardware Key Support, Face Authentication Pipeline.
- **Deployment Telemetry:** Git `main` branch connected to Render Cloud Server deployment.

---

## 2. Multi-Role Governance Architecture

The system enforces strict **Role-Based Access Control (RBAC)** across 10 distinct user roles:

| User Role | Core Access Capabilities |
| :--- | :--- |
| **Chancellor & Vice Chancellor** | High-level institutional analytics, financial summaries, governance audit logs, policy settings. |
| **System Administrator (Admin)** | User control, role assignment, registration windows, system settings, global overrides. |
| **Registrar** | Admission approvals, CBCS choice windows, academic regulations (R25/R23), master course catalogs. |
| **Dean & HOD** | Faculty subject assignments, section capacity caps, semester registration approvals, curriculum updates. |
| **Controller of Exams (COE)** | Exam scheduling, mark entry validation, SGPA/CGPA evaluation engine, transcript generation. |
| **Faculty Member** | Class roster view, attendance marking, internal assessment input, mentor advisory desk. |
| **Student** | CBCS elective choice-filling, semester registration, timetable, grade cards, document uploads. |
| **Parent** | Student academic performance tracking, fee breakdown, attendance oversight. |
| **Admission Office Staff** | Applicant document verification, native PDF proof viewing, candidate deletion with confirm dialogs. |
| **Librarian & Accountant** | Library book issuing, fine collection, fee governance, receipt generation. |

---

## 3. Core Functional Modules

### 3.1 Choice-Based Credit System (CBCS) & Automated CGPA Merit Engine
- **Master Course L-T-P Matrix:** Every course standardizes Lecture (L), Tutorial (T), and Practical (P) contact hours to compute credits:
  $$\text{Credits} = L + T + (0.5 \times P)$$
- **Registration Windows:** Admins create CBCS choice windows with defined timelines and semester credit caps (e.g., Min 16.0, Max 26.0 Credits).
- **Student Choice-Filling:** Students submit ranked choices (Preference #1, #2, #3) for Professional Electives (DSE) and Open Electives (GE).
- **Automated Merit Allocation Engine:** Evaluates applicants in **CGPA descending order**, checks section seat capacity caps (`current_students < max_students`), enrolls allocated students, and generates execution telemetry logs (`cbcs_allocation_logs`).

### 3.2 Admission Office Portal & Native PDF Document Verification Engine
- **Applicant Document Attachment Desk:** Supports uploading candidate photos and official proof documents stored as Base64/LONGTEXT data URIs in `applicant_documents`.
- **Native PDF Viewer:** Built-in PDF rendering desk allows verification officers to inspect uploaded PDF proofs inline without external downloads.
- **Application Management & Deletion:** Real-time application tracking with confirmation dialogs and transactional deletion (`DELETE /api/admission/applications/:id`).

### 3.3 Security, Biometrics & User Control Module
- **WebAuthn & Biometric Authentication:** Supports FIDO2 hardware passkeys and Face Auth verification for high-security admin actions.
- **Force Password Change:** Enforces password reset workflow upon first login for newly created user accounts.
- **Activity & Security Audit Logs:** Real-time logging of user logins, role modifications, and admin overrides in `activity_logs`.

---

## 4. Production Database Schema (Key Relational Tables)

```sql
-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'Student',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. MASTER SUBJECT CATALOG
CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  department_id INT NULL,
  credits DECIMAL(3,1) DEFAULT 3.0,
  lecture_hours INT DEFAULT 3,
  tutorial_hours INT DEFAULT 0,
  practical_hours INT DEFAULT 0,
  offering_type ENUM('Theory', 'Practical', 'Theory + Practical') DEFAULT 'Theory',
  status ENUM('Active', 'Inactive') DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. CBCS CHOICE REGISTRATION WINDOWS
CREATE TABLE IF NOT EXISTS cbcs_registration_windows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  semester_id INT NOT NULL,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  min_credits DECIMAL(4,1) DEFAULT 16.0,
  max_credits DECIMAL(4,1) DEFAULT 26.0,
  status ENUM('DRAFT', 'OPEN', 'ALLOCATION_PROCESSED', 'CLOSED') DEFAULT 'OPEN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. STUDENT RANKED ELECTIVE PREFERENCES
CREATE TABLE IF NOT EXISTS student_cbcs_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  window_id INT NOT NULL,
  student_id INT NOT NULL,
  elective_group VARCHAR(50) NOT NULL DEFAULT 'PE-1',
  offering_id INT NOT NULL,
  preference_rank INT NOT NULL,
  status ENUM('PENDING', 'ALLOCATED', 'REJECTED_FULL') DEFAULT 'PENDING',
  allocated_at DATETIME NULL,
  UNIQUE KEY uq_st_win_grp_rank (window_id, student_id, elective_group, preference_rank),
  FOREIGN KEY (window_id) REFERENCES cbcs_registration_windows(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. CBCS AUTOMATED ALLOCATION LOGS
CREATE TABLE IF NOT EXISTS cbcs_allocation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  window_id INT NOT NULL,
  total_students_processed INT DEFAULT 0,
  total_allocated INT DEFAULT 0,
  total_unallocated INT DEFAULT 0,
  preference_1_count INT DEFAULT 0,
  preference_2_count INT DEFAULT 0,
  executed_by INT NULL,
  execution_details JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 5. Recent System Refactorings & Optimizations

1. **Campus Block Twin Removal:** Cleanly removed legacy block management menu (`block-management`) and dropped obsolete database tables (`buildings`, `floors`, `rooms`, `floor_versions`) to streamline navigation.
2. **Render Deployment Fix:** Updated middleware import paths in [`cbcsRoutes.js`](file:///c:/college-management-system/backend/routes/cbcsRoutes.js) to reference `../middleware.js`, resolving Render module resolution errors (`a8df118`).
3. **Type Safety & Build Integrity:** Added explicit `SidebarItem` interface in [`App.tsx`](file:///c:/college-management-system/src/app/App.tsx) and resolved all TypeScript compiler warnings.

---

## 6. QA, Verification & Telemetry Summary

- **Frontend Compilation:** `npm run build` completed in **9.40s with 0 errors**.
- **Database Initialization:** `initializeDatabase()` verified with `{ success: true, message: 'Database schema and permanent admin ready' }`.
- **Source Control Status:** All recent features and hotfixes committed and pushed to `main` branch.
