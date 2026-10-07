# ADMISSION MANAGEMENT MODULE — REVISED DATABASE ARCHITECTURE PLAN

## 1. Executive Summary & Architecture Philosophy

This revised database architecture establishes a **production-grade, normalized, concurrency-safe, state-machine-driven relational schema** for the Admission Management Module of the College Management System.

### Key Enhancements & Design Choices:
1. **Applicant vs. Application Decoupling**: Introduces `admission_applicants` to allow a single applicant profile to submit multiple applications across cycles or academic programs.
2. **Program Preference Order**: Introduces `admission_application_preferences` enabling applicants to apply for multiple program choices in prioritized preference order (1st preference, 2nd preference, etc.).
3. **Master Data Reuse**: Zero duplication of core ERP entities (`departments`, `courses`, `academic_years`, `users`, `students`, `payments`, `student_fee_accounts`).
4. **Calculated Seats & Transactional Allocation**: `available_seats` is computed dynamically as `(total_seats - allocated_seats)` with transactional row-locking (`SELECT ... FOR UPDATE`) during seat reservation.
5. **Strict User Attribution Auditability**: String name signatures replaced with foreign keys `created_by_user_id`, `updated_by_user_id`, `interviewer_user_id`, and `decided_by_user_id` referencing `users.id`.
6. **File Metadata Storage**: Eliminates Base64 database blobs in favor of binary file metadata (`storage_path`, `mime_type`, `file_size`, `checksum_sha256`).
7. **Concurrency-Safe Application Number Generator**: Uses atomic database sequences (`admission_sequences`) instead of unsafe `MAX()+1` calculations.
8. **Idempotent Student Conversion**: Utilizes `SELECT ... FOR UPDATE` transactions, strict email/phone duplicate checks, and a `UNIQUE` constraint on `enrolled_student_id`.

---

## 2. Entity Relationship Diagram (ERD)

```
                              +--------------------+
                              |   academic_years   | (Existing ERP Master)
                              +--------------------+
                                        | 1:N
                                        v
+--------------------+ 1:N    +--------------------+
|      courses       | <----- |  admission_cycles  |
+--------------------+        +--------------------+
          | 1:N                         | 1:N
          v                             v
+--------------------+        +--------------------+
|    departments     | <----- | admission_programs | (Composite Unique: cycle_id + course_id)
+--------------------+ 1:N    +--------------------+
          |                             | 1:N
          v                             v
+--------------------+ 1:N    +---------------------+ 1:N   +----------------------------------+
|admission_applicants| <----- |admission_application| <---- |admission_application_preferences |
+--------------------+        +---------------------+       +----------------------------------+
          | 1:1 (Conversion)            | 1:N   | 1:N   | 1:1           | 1:N
          v                             v       v       v               v
+--------------------+        +----------+ +-----+ +----+      +------------------+
|      users         | <-----+|documents | |inter| |decs|      |status_history    |
+--------------------+        +----------+ +-----+ +----+      +------------------+
          | 1:1                             | (FK users)
          v                                 v
+--------------------+        +--------------------+
|      students      | <===== |      payments      | (Existing ERP Finance System Integration)
+--------------------+        +--------------------+
```

---

## 3. Revised Table-by-Table Schema Specification

### 3.1 `admission_cycles`
Defines active admission windows (e.g., "Fall 2026 Regular Admissions").

| Column | Data Type | Nullable | Default | Constraints / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Increment | Primary Key |
| `cycle_code` | `VARCHAR(30)` | NO | — | UNIQUE (e.g. `CYCLE-2026-REG`) |
| `cycle_name` | `VARCHAR(150)` | NO | — | Human readable name |
| `academic_year_id` | `INT` | NO | — | FK → `academic_years.id` ON DELETE RESTRICT |
| `start_date` | `DATE` | NO | — | Application window start |
| `end_date` | `DATE` | NO | — | Application window close |
| `status` | `ENUM('UPCOMING','ACTIVE','CLOSED')` | NO | `'UPCOMING'` | Active cycle filter |
| `created_by_user_id` | `INT` | YES | NULL | FK → `users.id` |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Audit |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Auto update |

- **Indexes**: `idx_cycle_status` (`status`, `start_date`, `end_date`), `idx_cycle_ay` (`academic_year_id`)

---

### 3.2 `admission_programs`
Configures seat capacity and fee requirements for courses offered in an admission cycle.

| Column | Data Type | Nullable | Default | Constraints / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Increment | Primary Key |
| `cycle_id` | `INT` | NO | — | FK → `admission_cycles.id` ON DELETE CASCADE |
| `course_id` | `INT` | NO | — | FK → `courses.id` ON DELETE RESTRICT |
| `program_code` | `VARCHAR(30)` | NO | — | Scoped program code |
| `total_seats` | `INT` | NO | `120` | Total seat capacity |
| `allocated_seats` | `INT` | NO | `0` | Assigned seat count |
| `min_12th_percentage` | `DECIMAL(5,2)` | NO | `60.00` | Minimum eligibility cutoff |
| `application_fee` | `DECIMAL(10,2)` | NO | `1000.00` | Registration fee |
| `annual_tuition_fee` | `DECIMAL(10,2)` | NO | `125000.00` | Base course tuition fee |
| `status` | `ENUM('ACTIVE','CLOSED')` | NO | `'ACTIVE'` | Intake status |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Audit |

- **Constraints**: `UNIQUE KEY uq_cycle_course (cycle_id, course_id)`, `UNIQUE KEY uq_cycle_progcode (cycle_id, program_code)`
- **Calculated Property**: `available_seats` is computed dynamically as `(total_seats - allocated_seats)` in queries to avoid state divergence.

---

### 3.3 `admission_applicants`
Central master profile for candidates. A candidate registers once and can submit multiple applications across cycles.

| Column | Data Type | Nullable | Default | Constraints / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Increment | Primary Key |
| `applicant_code` | `VARCHAR(50)` | NO | — | UNIQUE (e.g. `APP-2026-000101`) |
| `email` | `VARCHAR(100)` | NO | — | UNIQUE Candidate contact email |
| `mobile` | `VARCHAR(25)` | NO | — | UNIQUE Candidate mobile number |
| `first_name` | `VARCHAR(75)` | NO | — | First name |
| `middle_name` | `VARCHAR(75)` | YES | NULL | Middle name |
| `last_name` | `VARCHAR(75)` | NO | — | Last name |
| `dob` | `DATE` | YES | NULL | Date of birth |
| `gender` | `VARCHAR(20)` | YES | NULL | Gender (No default assumption) |
| `address` | `TEXT` | YES | NULL | Address line |
| `city` | `VARCHAR(100)` | YES | NULL | City |
| `state` | `VARCHAR(100)` | YES | NULL | State |
| `postal_code` | `VARCHAR(20)` | YES | NULL | PIN / Postal code |
| `parent_name` | `VARCHAR(150)` | YES | NULL | Parent/Guardian name |
| `parent_relation` | `VARCHAR(50)` | YES | NULL | Relationship |
| `parent_mobile` | `VARCHAR(25)` | YES | NULL | Parent mobile contact |
| `user_id` | `INT` | YES | NULL | FK → `users.id` (If candidate has login) |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Profile creation time |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Auto update |

- **Indexes**: `idx_applicant_email` (`email`), `idx_applicant_mobile` (`mobile`), `idx_applicant_user` (`user_id`)

---

### 3.4 `admission_applications`
Individual admission application instance filed by an applicant for a specific cycle and primary department.

| Column | Data Type | Nullable | Default | Constraints / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Increment | Primary Key |
| `application_number` | `VARCHAR(50)` | NO | — | UNIQUE (Format: `ADM-YYYY-XXXXXX`) |
| `applicant_id` | `INT` | NO | — | FK → `admission_applicants.id` ON DELETE CASCADE |
| `cycle_id` | `INT` | NO | — | FK → `admission_cycles.id` ON DELETE RESTRICT |
| `department_id` | `INT` | YES | NULL | FK → `departments.id` ON DELETE RESTRICT |
| `school_10th` | `VARCHAR(150)` | YES | NULL | 10th School Name |
| `board_10th` | `VARCHAR(100)` | YES | NULL | Board (CBSE/ICSE/State) |
| `year_10th` | `INT` | YES | NULL | Passing year |
| `percentage_10th` | `DECIMAL(5,2)` | YES | NULL | 10th Score % |
| `school_12th` | `VARCHAR(150)` | YES | NULL | 12th School/College Name |
| `board_12th` | `VARCHAR(100)` | YES | NULL | Board |
| `year_12th` | `INT` | YES | NULL | Passing year |
| `percentage_12th` | `DECIMAL(5,2)` | YES | NULL | 12th Score % |
| `entrance_exam` | `VARCHAR(100)` | YES | NULL | JEE / State CET / EAMCET |
| `entrance_score` | `DECIMAL(6,2)` | YES | NULL | Rank or Score |
| `admission_category` | `VARCHAR(50)` | YES | `'General'` | Quota (General/OBC/SC/ST/Management) |
| `admission_type` | `VARCHAR(50)` | YES | `'Regular'` | Regular / Lateral Entry |
| `application_status` | `VARCHAR(50)` | NO | `'DRAFT'` | Main State Machine Status |
| `document_status` | `VARCHAR(50)` | NO | `'NOT_SUBMITTED'` | Document verification state |
| `eligibility_status` | `VARCHAR(50)` | NO | `'ELIGIBILITY_PENDING'` | Cutoff verification state |
| `fee_status` | `VARCHAR(50)` | NO | `'FEE_PENDING'` | Payment state |
| `agreed_tuition_fee` | `DECIMAL(10,2)` | NO | `0.00` | Quota fee rate |
| `paid_amount` | `DECIMAL(10,2)` | NO | `0.00` | Counter payments collected |
| `allocated_program_id` | `INT` | YES | NULL | FK → `admission_programs.id` (Final seat) |
| `allocated_seat_number`| `VARCHAR(50)` | YES | NULL | Assigned Roll/Seat |
| `enrolled_student_id` | `INT` | YES | NULL | UNIQUE FK → `students.id` (Post-conversion) |
| `created_by_user_id` | `INT` | YES | NULL | FK → `users.id` |
| `updated_by_user_id` | `INT` | YES | NULL | FK → `users.id` |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Submission time |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Auto update |

- **Indexes**:
  - `idx_app_number` (`application_number`)
  - `idx_app_applicant` (`applicant_id`)
  - `idx_app_cycle` (`cycle_id`)
  - `idx_app_status` (`application_status`)
  - `idx_app_enrolled` (`enrolled_student_id`)
- **Constraints**: `UNIQUE KEY uq_app_enrolled (enrolled_student_id)`

---

### 3.5 `admission_application_preferences`
Supports multiple program/course choices per application in prioritized preference order.

| Column | Data Type | Nullable | Default | Constraints / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Increment | Primary Key |
| `application_id` | `INT` | NO | — | FK → `admission_applications.id` ON DELETE CASCADE |
| `program_id` | `INT` | NO | — | FK → `admission_programs.id` ON DELETE RESTRICT |
| `preference_order` | `INT` | NO | `1` | Order (1 = 1st Preference, 2 = 2nd Choice) |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Audit |

- **Constraints**: `UNIQUE KEY uq_app_pref (application_id, preference_order)`, `UNIQUE KEY uq_app_prog (application_id, program_id)`
- **Indexes**: `idx_pref_app` (`application_id`), `idx_pref_prog` (`program_id`)

---

### 3.6 `admission_documents`
Binary file attachment metadata (No Base64 blobs stored in database).

| Column | Data Type | Nullable | Default | Constraints / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Increment | Primary Key |
| `application_id` | `INT` | NO | — | FK → `admission_applications.id` ON DELETE CASCADE |
| `document_type` | `VARCHAR(100)` | NO | — | `10th_marksheet`, `12th_marksheet`, `id_proof`, `photo`, `tc` |
| `original_filename` | `VARCHAR(255)` | NO | — | Original file name |
| `storage_path` | `VARCHAR(512)` | NO | — | Relative disk storage path |
| `mime_type` | `VARCHAR(100)` | NO | `'application/pdf'` | File MIME type |
| `file_size_bytes` | `BIGINT` | NO | `0` | Size in bytes |
| `checksum_sha256` | `VARCHAR(64)` | YES | NULL | Security checksum |
| `verification_status` | `ENUM('NOT_SUBMITTED','SUBMITTED','UNDER_VERIFICATION','VERIFIED','REJECTED')` | NO | `'SUBMITTED'` | Status |
| `verified_by_user_id` | `INT` | YES | NULL | FK → `users.id` |
| `verification_date` | `DATETIME` | YES | NULL | Approval timestamp |
| `remarks` | `TEXT` | YES | NULL | Rejection reason / notes |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Upload time |

- **Indexes**: `idx_doc_app` (`application_id`), `idx_doc_status` (`verification_status`), `idx_doc_user` (`verified_by_user_id`)

---

### 3.7 `admission_interviews`
Schedules candidate evaluation sessions with faculty/officer user foreign key attributions.

| Column | Data Type | Nullable | Default | Constraints / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Increment | Primary Key |
| `application_id` | `INT` | NO | — | FK → `admission_applications.id` ON DELETE CASCADE |
| `interviewer_user_id` | `INT` | NO | — | FK → `users.id` ON DELETE RESTRICT |
| `scheduled_date` | `DATETIME` | NO | — | Interview schedule |
| `mode` | `ENUM('OFFLINE','ONLINE')` | NO | `'OFFLINE'` | Conduct mode |
| `location_or_link` | `VARCHAR(255)` | YES | NULL | Room No or Video link |
| `status` | `ENUM('SCHEDULED','COMPLETED','CANCELLED','NO_SHOW')` | NO | `'SCHEDULED'` | Status |
| `score` | `DECIMAL(5,2)` | YES | NULL | Rating score out of 100 |
| `feedback` | `TEXT` | YES | NULL | Panel evaluation notes |
| `created_by_user_id` | `INT` | YES | NULL | FK → `users.id` |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Timestamp |

- **Indexes**: `idx_int_app` (`application_id`), `idx_int_user` (`interviewer_user_id`), `idx_int_date` (`scheduled_date`)

---

### 3.8 `admission_decisions`
Records board committee evaluation outcomes.

| Column | Data Type | Nullable | Default | Constraints / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Increment | Primary Key |
| `application_id` | `INT` | NO | — | FK → `admission_applications.id` ON DELETE CASCADE |
| `decision` | `ENUM('SELECTED','WAITLISTED','REJECTED')` | NO | — | Board outcome |
| `decided_by_user_id` | `INT` | NO | — | FK → `users.id` ON DELETE RESTRICT |
| `allocated_program_id`| `INT` | YES | NULL | FK → `admission_programs.id` |
| `quota_category` | `VARCHAR(50)` | YES | `'General'` | Quota category |
| `remarks` | `TEXT` | YES | NULL | Committee notes |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Timestamp |

- **Indexes**: `idx_dec_app` (`application_id`), `idx_dec_user` (`decided_by_user_id`), `idx_dec_outcome` (`decision`)

---

### 3.9 `admission_sequences` (Concurrency-Safe Number Generator)
Atomic sequence counter preventing race conditions during application number generation.

| Column | Data Type | Nullable | Default | Constraints / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `sequence_name` | `VARCHAR(50)` | NO | — | Primary Key (e.g. `ADM_2026`) |
| `current_value` | `BIGINT` | NO | `0` | Current sequence counter |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Auto update |

---

### 3.10 `admission_status_history`
Audit log recording every state transition in the admission lifecycle.

| Column | Data Type | Nullable | Default | Constraints / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Increment | Primary Key |
| `application_id` | `INT` | NO | — | FK → `admission_applications.id` ON DELETE CASCADE |
| `action` | `VARCHAR(150)` | NO | — | Transition description |
| `previous_status` | `VARCHAR(50)` | YES | NULL | State prior to update |
| `new_status` | `VARCHAR(50)` | NO | — | Updated state |
| `performed_by_user_id` | `INT` | YES | NULL | FK → `users.id` |
| `remarks` | `TEXT` | YES | NULL | Change rationale |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Timestamp |

- **Indexes**: `idx_hist_app` (`application_id`), `idx_hist_user` (`performed_by_user_id`), `idx_hist_created` (`created_at`)

---

## 4. Integration with Existing ERP Finance (`payments` Table)

Instead of maintaining a duplicate payment system, counter admission fees write directly to the existing ERP `payments` table while linking back to `admission_applications`:

### Existing ERP `payments` Table Integration:
- `payments.student_id`: Linked once converted to student.
- `payments.amount`: Payment value.
- `payments.payment_type`: Set to `'ADMISSION_FEE'`.
- `payments.reference_id`: Stores `application_number`.
- `payments.payment_status`: Set to `'COMPLETED'`.
- `admission_applications.paid_amount`: Incremented dynamically upon receipt generation.

---

## 5. State Machine & Status Separation

### Distinct State Attributes:
1. **`application_status`**: `DRAFT` ➔ `SUBMITTED` ➔ `UNDER_REVIEW` ➔ `SELECTED` / `WAITLISTED` / `REJECTED` ➔ `OFFER_SENT` ➔ `ADMISSION_CONFIRMED` ➔ `CONVERTED_TO_STUDENT`
2. **`document_status`**: `NOT_SUBMITTED` ➔ `SUBMITTED` ➔ `UNDER_VERIFICATION` ➔ `VERIFIED` ➔ `REJECTED`
3. **`eligibility_status`**: `ELIGIBILITY_PENDING` ➔ `ELIGIBLE` ➔ `NOT_ELIGIBLE`
4. **`fee_status`**: `FEE_PENDING` ➔ `PARTIALLY_PAID` ➔ `PAID`

### Logical Transition Flow:
```
[OFFER_SENT] ──► (Candidate accepts offer) ──► [FEE_PENDING]
                                                     │
                                                     ▼ (Counter fee payment logged in payments table)
                                             [ADMISSION_CONFIRMED]
                                                     │
                                                     ▼ (Click "Convert to Student" transaction)
                                             [CONVERTED_TO_STUDENT]
```

---

## 6. Concurrency-Safe Application Number Generator

Application numbers are generated via an **atomic database sequence query**:

```sql
INSERT INTO admission_sequences (sequence_name, current_value) 
VALUES ('ADM_2026', 1) 
ON DUPLICATE KEY UPDATE current_value = LAST_INSERT_ID(current_value + 1);

SELECT CONCAT('ADM-2026-', LPAD(LAST_INSERT_ID(), 6, '0')) AS application_number;
```

This ensures thread-safe, gapless, conflict-free application numbers even during simultaneous high-volume submissions.

---

## 7. Transactional Student Conversion (`SELECT ... FOR UPDATE`)

```sql
START TRANSACTION;

-- 1. Lock application row and check status
SELECT id, applicant_id, application_status, enrolled_student_id, department_id, allocated_program_id 
FROM admission_applications 
WHERE id = ? FOR UPDATE;

-- Verify application_status == 'ADMISSION_CONFIRMED' AND enrolled_student_id IS NULL

-- 2. Fetch applicant profile
SELECT email, mobile, first_name, last_name, gender, dob, address 
FROM admission_applicants 
WHERE id = applicant_id FOR UPDATE;

-- 3. Duplicate check in existing users & students
SELECT id FROM users WHERE LOWER(email) = LOWER(applicant_email) FOR UPDATE;
SELECT id FROM students WHERE LOWER(phone) = LOWER(applicant_mobile) FOR UPDATE;

-- 4. Insert into users
INSERT INTO users (username, email, password_hash, role_id, full_name) 
VALUES (?, ?, ?, (SELECT id FROM roles WHERE name = 'Student' LIMIT 1), ?);

SET @new_user_id = LAST_INSERT_ID();

-- 5. Insert into students
INSERT INTO students (user_id, admission_number, roll_number, first_name, last_name, gender, dob, phone, email, department_id)
VALUES (@new_user_id, app_number, app_number, first_name, last_name, gender, dob, mobile, email, department_id);

SET @new_student_id = LAST_INSERT_ID();

-- 6. Link application to student
UPDATE admission_applications 
SET enrolled_student_id = @new_student_id, application_status = 'CONVERTED_TO_STUDENT' 
WHERE id = app_id;

-- 7. Update seat capacity
UPDATE admission_programs 
SET allocated_seats = allocated_seats + 1 
WHERE id = allocated_program_id;

COMMIT;
```

---

## 8. Dashboard Data Aggregation & Zero-Record Safety

```sql
SELECT 
  COALESCE(COUNT(*), 0) AS totalApplications,
  COALESCE(SUM(CASE WHEN application_status = 'SUBMITTED' THEN 1 ELSE 0 END), 0) AS newApplications,
  COALESCE(SUM(CASE WHEN application_status = 'UNDER_REVIEW' THEN 1 ELSE 0 END), 0) AS underReview,
  COALESCE(SUM(CASE WHEN document_status = 'NOT_SUBMITTED' THEN 1 ELSE 0 END), 0) AS documentsPending,
  COALESCE(SUM(CASE WHEN eligibility_status = 'ELIGIBLE' THEN 1 ELSE 0 END), 0) AS eligibleCandidates,
  COALESCE(SUM(CASE WHEN application_status = 'SELECTED' THEN 1 ELSE 0 END), 0) AS selectedCandidates,
  COALESCE(SUM(CASE WHEN application_status = 'REJECTED' THEN 1 ELSE 0 END), 0) AS rejectedApplications,
  COALESCE(SUM(CASE WHEN application_status = 'ADMISSION_CONFIRMED' THEN 1 ELSE 0 END), 0) AS confirmedAdmissions,
  COALESCE(SUM(paid_amount), 0.00) AS totalFeesCollected
FROM admission_applications;
```

---

## 9. Table Creation Order

1. `admission_cycles`
2. `admission_programs`
3. `admission_applicants`
4. `admission_applications`
5. `admission_application_preferences`
6. `admission_documents`
7. `admission_interviews`
8. `admission_decisions`
9. `admission_sequences`
10. `admission_status_history`

---

## 10. Risk Assessment & Verification Strategy

| Potential Risk | Architecture Solution |
| :--- | :--- |
| Duplicate Student Conversion | Transactional `SELECT ... FOR UPDATE` + `UNIQUE KEY (enrolled_student_id)` |
| Concurrent Application Number Race Condition | Atomic `admission_sequences` counter using `LAST_INSERT_ID()` |
| Duplicate Course Code per Cycle | Composite `UNIQUE KEY uq_cycle_course (cycle_id, course_id)` |
| Dashboard White Page Crash on Empty DB | `COALESCE(...)` aggregations returning 0 and `[]` defaults |
| Large File Blobs Slowing Database | Disallow Base64 storage; store structured disk paths & binary metadata |

---

> [!NOTE]
> **Revised Architecture Plan Complete**. All 20 feedback items have been thoroughly integrated. No database tables were created or altered during this planning turn.
