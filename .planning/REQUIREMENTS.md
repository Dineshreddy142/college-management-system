# Functional & System Requirements

## 1. Governance & Administrative Requirements
- **REQ-ADM-01**: System must support super-admin controls for user management, role assignments, audit logging, and global configuration.
- **REQ-ADM-02**: Comprehensive audit trail module (`AuditLogsModule.tsx`) recording system events, security logins, and data modifications.
- **REQ-ADM-03**: Institutional block and dynamic infrastructure asset tracking (`blockRoutes.js`).

## 2. Academic & Departmental Requirements
- **REQ-ACA-01**: Department, course, curriculum, and subject management with credit allocation and prerequisite mapping.
- **REQ-ACA-02**: HOD and Faculty workload allocation, subject mapping, and timetable scheduling.
- **REQ-ACA-03**: CBCS (Choice Based Credit System) elective subject enrollment and credit tracking.

## 3. Student & Parent Requirements
- **REQ-STU-01**: Student portal displaying academic history, attendance percentages, class schedules, and fee ledgers.
- **REQ-STU-02**: AI Tutor integration powered by Google Gemini for interactive query resolution and study assistance.
- **REQ-PAR-01**: Parent portal for monitoring child academic progress, attendance records, and online fee payments.

## 4. Security & Biometrics Requirements
- **REQ-SEC-01**: Multi-factor authentication including WebAuthn hardware passkeys (`@simplewebauthn`).
- **REQ-SEC-02**: ONNX MobileFaceNet facial recognition for biometric attendance registration and secure authentication.
- **REQ-SEC-03**: Secure file uploads and document management with input validation (`zod`).

## 5. Operations & Campus Management
- **REQ-OPS-01**: Fee management, online payments, receipt generation, and ledger tracking.
- **REQ-OPS-02**: Library management including book cataloging, issuing, returning, and fine tracking.
- **REQ-OPS-03**: Hostel block administration and vehicle pass management.
