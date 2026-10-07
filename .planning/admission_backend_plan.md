# PHASE 3 — ADMISSION BACKEND API IMPLEMENTATION PLAN (FINAL CONVERGED VERSION)

## 1. Executive Summary & Objective

This final implementation plan establishes the architecture for the Admission Management Backend API, addressing all concurrency, security, payment validation, and transactional integrity criteria.

### Core Architecture Principles:
1. **Concurrency-Safe Atomic Sequences**: Roll numbers and application numbers use atomic database sequences (`admission_sequences`), completely eliminating race conditions and `COUNT()+1` collisions during simultaneous requests.
2. **Cryptographically Secure Credentials**: Student password creation utilizes `crypto.randomBytes(16).toString('hex')` hashed with `bcrypt.hash()`, forcing initial password change (`must_change_password = 1`). Temporary passwords are never logged or exposed in API responses.
3. **Strict Payment Method Validation**: Pre-admission payment methods are strictly validated against existing ERP `payments.payment_method` ENUM values (`'ONLINE'`, `'BANK_TRANSFER'`, `'CARD'`, `'UPI'`, `'CASH'`, `'CHEQUE'`). Unsupported payment methods immediately trigger a transaction ROLLBACK and 400 Bad Request error rather than falling back to default values.
4. **Idempotent Student Conversion**: Runs within an isolated MySQL transaction (`START TRANSACTION ... COMMIT`) with `SELECT ... FOR UPDATE` row locks. Only posts unposted counter receipts (`posted_to_erp_payment_id IS NULL`), ensuring retries never produce duplicate ERP payment records.
5. **Zero-Record Resilience**: All analytics and metrics queries wrap aggregations in `COALESCE(...)`, returning clean `0` counts and `[]` empty arrays when database tables contain 0 records.

---

## 2. API Endpoint Map & Specifications

All endpoints are mounted under `/api/admission` in `backend/server.js`.

### 2.1 Dashboard Stats (`GET /api/admission/dashboard-stats`)
Returns aggregated metrics with zero-record safety (`0` counts and `[]` arrays when empty).

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

### 2.2 Admission Cycles API (`/api/admission/cycles`)
- `GET /api/admission/cycles`: Lists active/upcoming cycles with linked `academic_years`.
- `GET /api/admission/cycles/:id`: Retrieves cycle details & offered programs.
- `POST /api/admission/cycles`: Creates cycle (`cycle_code`, `cycle_name`, `academic_year_id`, `start_date`, `end_date`).
- `PUT /api/admission/cycles/:id`: Updates cycle parameters.
- `PATCH /api/admission/cycles/:id/status`: Toggles cycle status (`UPCOMING`, `ACTIVE`, `CLOSED`).

---

### 2.3 Admission Programs API (`/api/admission/programs`)
- `GET /api/admission/programs`: Lists offered programs JOINED with master `courses` & `departments`. Calculates `available_seats = (total_seats - allocated_seats)` dynamically.
- `GET /api/admission/programs/:id`: Retrieves program details & cutoff rules.
- `POST /api/admission/programs`: Configures course intake (`cycle_id`, `course_id`, `program_code`, `total_seats`, `min_12th_percentage`, `application_fee`, `annual_tuition_fee`).
- `PUT /api/admission/programs/:id`: Updates intake seats or cutoff criteria.
- `PATCH /api/admission/programs/:id/status`: Closes or opens program intake.

---

### 2.4 Applicants API (`/api/admission/applicants`)
- `GET /api/admission/applicants`: Candidate master profile search & list.
- `GET /api/admission/applicants/:id`: Candidate profile details with application history.
- `POST /api/admission/applicants`: Registers candidate master profile (`email`, `mobile`, `first_name`, `last_name`, `dob`, `gender`, `address`).
- `PUT /api/admission/applicants/:id`: Updates candidate contact/personal details.

---

### 2.5 Applications API (`/api/admission/applications`)
- `GET /api/admission/applications`: Filterable application registry (by status, program, cycle, date, search query).
- `GET /api/admission/applications/:id`: Application telemetry (applicant, academic marks, preferences, documents, interviews, decisions, payments, status history).
- `POST /api/admission/applications`: Creates new application using concurrency-safe `admission_sequences`.
- `PUT /api/admission/applications/:id`: Updates academic marks or personal edits.
- `PATCH /api/admission/applications/:id/status`: Executes validated status transition.

---

### 2.6 Application Preferences API (`/api/admission/applications/:id/preferences`)
- `GET /api/admission/applications/:id/preferences`: Retrieves program choices in preference order (1, 2, 3).
- `PUT /api/admission/applications/:id/preferences`: Updates program choices. Validates that all selected `program_id` items belong to the application's `cycle_id`.

---

### 2.7 Documents API (`/api/admission/documents`)
- `GET /api/admission/applications/:id/documents`: Lists uploaded documents.
- `POST /api/admission/applications/:id/documents`: Registers document file metadata (`original_filename`, `storage_path`, `mime_type`, `file_size_bytes`, `checksum_sha256`).
- `PATCH /api/admission/documents/:docId/verify`: Approves (`VERIFIED`) or rejects (`REJECTED`) document and sets `verified_by_user_id = req.user.id`.

---

### 2.8 Eligibility Verification API (`POST /api/admission/applications/:id/verify-eligibility`)
Evaluates 12th percentage against `min_12th_percentage` in `admission_programs`. Updates `eligibility_status` to `ELIGIBLE` or `NOT_ELIGIBLE`.

---

### 2.9 Interviews API (`/api/admission/interviews`)
- `GET /api/admission/interviews`: Retrieves scheduled interviews.
- `POST /api/admission/interviews`: Schedules interview (`application_id`, `interviewer_user_id`, `scheduled_date`, `mode`, `location_or_link`). Sets `created_by_user_id = req.user.id`.
- `PUT /api/admission/interviews/:id`: Updates score & panel feedback.
- `PATCH /api/admission/interviews/:id/status`: Updates status (`SCHEDULED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`).

---

### 2.10 Decisions API (`/api/admission/decisions`)
- `POST /api/admission/applications/:id/decision`: Submits board selection (`SELECTED`, `WAITLISTED`, `REJECTED`). Logs `decided_by_user_id = req.user.id` and updates application status.
- `GET /api/admission/applications/:id/decisions`: Retrieves decision history.

---

### 2.11 Counter Fee Payments API (`/api/admission/payments`)
- `GET /api/admission/applications/:id/payments`: Lists pre-admission receipts in `admission_fee_payments`.
- `POST /api/admission/applications/:id/payments`: Validates `payment_method` against valid ERP ENUM values (`'ONLINE'`, `'BANK_TRANSFER'`, `'CARD'`, `'UPI'`, `'CASH'`, `'CHEQUE'`). Logs pre-admission receipt in `admission_fee_payments` and updates `paid_amount` aggregate on `admission_applications`.

---

### 2.12 Student Conversion API (`POST /api/admission/applications/:id/convert-to-student`)

```js
// Transactional Enrolment Implementation
await pool.query('START TRANSACTION');

try {
  // 1. Lock Application Row & Verify Confirmation Status
  const [apps] = await pool.query(
    'SELECT * FROM admission_applications WHERE id = ? FOR UPDATE',
    [appId]
  );
  const app = apps[0];
  if (!app || app.application_status !== 'ADMISSION_CONFIRMED' || app.enrolled_student_id) {
    throw new Error('Application is not eligible for conversion or already enrolled.');
  }

  // 2. Lock Allocated Program & Verify Seat Capacity
  if (app.allocated_program_id) {
    const [progs] = await pool.query(
      'SELECT total_seats, allocated_seats FROM admission_programs WHERE id = ? FOR UPDATE',
      [app.allocated_program_id]
    );
    const prog = progs[0];
    if (prog && prog.allocated_seats >= prog.total_seats) {
      throw new Error('Seat capacity full for the selected program.');
    }
  }

  // 3. Fetch & Lock Applicant Profile
  const [applicants] = await pool.query(
    'SELECT * FROM admission_applicants WHERE id = ? FOR UPDATE',
    [app.applicant_id]
  );
  const applicant = applicants[0];

  // 4. Duplicate Check in Users & Students
  const [existingUser] = await pool.query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?) FOR UPDATE',
    [applicant.email, applicant.email]
  );
  if (existingUser.length > 0) {
    throw new Error(`User account already exists with email ${applicant.email}`);
  }

  // 5. Dynamic Student Role Resolution
  const [studentRole] = await pool.query("SELECT id FROM roles WHERE LOWER(name) = 'student' LIMIT 1");
  const roleId = studentRole[0]?.id;
  if (!roleId) throw new Error('Student role definition missing in system.');

  // 6. Cryptographically Secure Random Password Generation
  const rawPass = crypto.randomBytes(16).toString('hex');
  const hashedPassword = await bcrypt.hash(rawPass, 10);

  // 7. Insert into Users Table
  const [userResult] = await pool.query(
    `INSERT INTO users (username, email, password, role_id, full_name, first_name, last_name, phone, must_change_password)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [applicant.email, applicant.email, hashedPassword, roleId, `${applicant.first_name} ${applicant.last_name}`, applicant.first_name, applicant.last_name, applicant.mobile]
  );
  const newUserId = userResult.insertId;

  // 8. Atomic Concurrency-Safe Roll Number Sequence Generation
  const [deptCodeRow] = await pool.query('SELECT code FROM departments WHERE id = ?', [app.department_id]);
  const deptCode = deptCodeRow[0]?.code || 'GEN';
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  const seqName = `ROLL_${yearSuffix}_${deptCode}`;

  await pool.query(
    `INSERT INTO admission_sequences (sequence_name, current_value) 
     VALUES (?, 1) 
     ON DUPLICATE KEY UPDATE current_value = LAST_INSERT_ID(current_value + 1)`,
    [seqName]
  );
  const [seqResult] = await pool.query('SELECT LAST_INSERT_ID() AS seq_num');
  const seqNum = seqResult[0].seq_num;
  const rollNumber = `${yearSuffix}${deptCode}${String(seqNum).padStart(3, '0')}`;

  // 9. Insert into Students Table
  const [studentResult] = await pool.query(
    `INSERT INTO students (user_id, admission_number, roll_number, first_name, last_name, name, email, phone, department_id, batch_year, academic_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, YEAR(CURRENT_DATE), 'ACTIVE')`,
    [newUserId, app.application_number, rollNumber, applicant.first_name, applicant.last_name, `${applicant.first_name} ${applicant.last_name}`, applicant.email, applicant.mobile, app.department_id]
  );
  const newStudentId = studentResult.insertId;

  // 10. Insert into Student Fee Accounts Table
  const [feeAccResult] = await pool.query(
    `INSERT INTO student_fee_accounts (student_id, total_charges, total_paid, outstanding_balance, status)
     VALUES (?, ?, ?, ?, ?)`,
    [newStudentId, app.agreed_tuition_fee, app.paid_amount, (app.agreed_tuition_fee - app.paid_amount), (app.paid_amount >= app.agreed_tuition_fee ? 'PAID' : 'PARTIALLY_PAID')]
  );
  const newFeeAccountId = feeAccResult.insertId;

  // 11. Validate & Post Unposted Counter Payments to ERP Payments Table
  const [unpostedPayments] = await pool.query(
    'SELECT * FROM admission_fee_payments WHERE application_id = ? AND posted_to_erp_payment_id IS NULL',
    [appId]
  );

  const validMethods = ['ONLINE','BANK_TRANSFER','CARD','UPI','CASH','CHEQUE'];

  for (const pay of unpostedPayments) {
    const pMethod = pay.payment_method?.toUpperCase();
    if (!validMethods.includes(pMethod)) {
      throw new Error(`Invalid payment method '${pay.payment_method}' recorded in receipt ${pay.receipt_number}. Must be one of: ${validMethods.join(', ')}`);
    }

    const [erpPayResult] = await pool.query(
      `INSERT INTO payments (receipt_number, student_id, student_fee_account_id, amount, payment_method, transaction_reference, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS', ?)`,
      [pay.receipt_number, newStudentId, newFeeAccountId, pay.amount, pMethod, pay.transaction_id, req.user.id]
    );
    await pool.query(
      'UPDATE admission_fee_payments SET posted_to_erp_payment_id = ? WHERE id = ?',
      [erpPayResult.insertId, pay.id]
    );
  }

  // 12. Update Application & Incremental Seats
  await pool.query(
    `UPDATE admission_applications 
     SET enrolled_student_id = ?, application_status = 'CONVERTED_TO_STUDENT', updated_by_user_id = ? 
     WHERE id = ?`,
    [newStudentId, req.user.id, appId]
  );

  if (app.allocated_program_id) {
    await pool.query(
      'UPDATE admission_programs SET allocated_seats = allocated_seats + 1 WHERE id = ?',
      [app.allocated_program_id]
    );
  }

  // 13. Commit Transaction
  await pool.query('COMMIT');
  res.json({ success: true, message: 'Student converted successfully', studentId: newStudentId, rollNumber });

} catch (err) {
  await pool.query('ROLLBACK');
  res.status(400).json({ success: false, error: err.message });
}
```

---

## 3. Server-Side State Machine & Fee Rules

```
[DRAFT] ➔ [SUBMITTED]
[SUBMITTED] ➔ [UNDER_REVIEW], [REJECTED]
[UNDER_REVIEW] ➔ [SELECTED], [WAITLISTED], [REJECTED]
[SELECTED] / [WAITLISTED] ➔ [OFFER_SENT], [REJECTED]
[OFFER_SENT] ➔ [ADMISSION_CONFIRMED] (Requires paid_amount >= agreed_tuition_fee OR explicit officer approval)
[ADMISSION_CONFIRMED] ➔ [CONVERTED_TO_STUDENT]
```

---

## 4. Atomic Concurrency-Safe Sequence Engine

Application numbers and roll numbers utilize atomic database sequences:

```sql
INSERT INTO admission_sequences (sequence_name, current_value) 
VALUES ('ADM_2026', 1) 
ON DUPLICATE KEY UPDATE current_value = LAST_INSERT_ID(current_value + 1);

SELECT CONCAT('ADM-2026-', LPAD(LAST_INSERT_ID(), 6, '0')) AS application_number;
```

---

## 5. Expanded Verification Matrix (25 Test Cases)

| # | Test Scenario | Target Verification Criteria |
| :--- | :--- | :--- |
| 1 | Dashboard on 0 records | Returns 200 with 0 numeric counts & `[]` empty arrays |
| 2 | Status attribute separation | `FEE_PENDING` treated exclusively as `fee_status`, NOT `application_status` |
| 3 | Cycle CRUD API | Operates correctly with `academic_years` foreign keys |
| 4 | Program CRUD API | Calculates `available_seats = (total_seats - allocated_seats)` dynamically |
| 5 | Applicant Master Creation | Prevents duplicate email and mobile entries |
| 6 | Application Sequence | Generates concurrency-safe, non-colliding `ADM-2026-XXXXXX` |
| 7 | Preference Validation | Rejects preferences referencing programs from other admission cycles |
| 8 | Document Storage | Saves binary metadata (`storage_path`, `mime_type`, `file_size_bytes`) without Base64 |
| 9 | Document Verification | Logs `verified_by_user_id = req.user.id` |
| 10 | Cutoff Eligibility | Compares 12th percentage against `min_12th_percentage` |
| 11 | Interview Scheduling | Assigns `interviewer_user_id` FK to `users.id` |
| 12 | Decision Submission | Logs `decided_by_user_id` FK and advances status |
| 13 | Pre-Admission Payments | Logs receipts in `admission_fee_payments` and updates `paid_amount` aggregate |
| 14 | Dynamic Role Resolution | Queries `roles` table dynamically for `Student` role ID |
| 15 | Password Security | Generates random `crypto.randomBytes(16)` hashed via `bcrypt.hash()` |
| 16 | Password Secrecy | Ensures temporary password is never returned or logged in API responses |
| 17 | Roll Number Concurrency | Generates concurrency-safe department sequence (e.g. `26CSE001`) via `admission_sequences` |
| 18 | Concurrent Seat Allocation | Locks `admission_programs` row & enforces `allocated_seats < total_seats` |
| 19 | Invalid Payment Method Rejection | Rejects invalid payment method with 400 Bad Request & ROLLBACK |
| 20 | Conversion Idempotency | Posts unposted receipts once (`posted_to_erp_payment_id IS NULL`) without duplicate ERP payments |
| 21 | User Creation Rollback | Rollbacks transaction if `users` insert fails |
| 22 | Student Creation Rollback | Rollbacks transaction if `students` insert fails |
| 23 | Fee Account Creation Rollback | Rollbacks transaction if `student_fee_accounts` insert fails |
| 24 | ERP Payment Posting Rollback | Rollbacks transaction if ERP payment insert fails |
| 25 | Bundle Build Verification | `npm run build` succeeds with zero errors |

---

> [!NOTE]
> **Final Converged Implementation Plan Complete**. All 7 final review requirements have been fully integrated. No source code or database records were modified during this planning turn.
