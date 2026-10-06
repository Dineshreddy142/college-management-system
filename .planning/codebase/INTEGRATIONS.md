# External Integrations & Service Services Map

## Database Layer
- **Engine**: MySQL 8.0 / TiDB Cloud Serverless (`mysql2/promise` pool)
- **Connection Configuration**: Managed via environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `DB_SSL`).
- **Schema & Initialization**:
  - `schema.sql`: Authoritative baseline database schema containing 35+ tables (users, roles, departments, subjects, students, faculty, attendance, fees, blocks, hostel, library, etc.).
  - `backend/init_db.js`: Programmatic table creator and schema validator with auto-column migration guardrails (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).

## Artificial Intelligence & ML Integrations
1. **Google Gemini AI Integration (`@google/genai`)**:
   - **File**: `backend/routes/aiRoutes.js` & `backend/services/aiService.js`
   - **Features**: AI Tutor / Assistant, intelligent course recommendations, auto-generation of quiz questions, student analytics, automated email drafting, and curriculum analysis.
2. **Face Recognition & Biometric Authentication**:
   - **Files**: `backend/routes/faceAuthRoutes.js` & `backend/services/faceAuthService.js`
   - **Models**: ONNX MobileFaceNet / FaceNet embeddings runtime (`onnxruntime-node`).
   - **Use Cases**: Face login, campus security kiosk verification, attendance registration via facial recognition.

## Security & Hardware Biometrics
- **WebAuthn Passkeys**:
  - **Files**: `backend/routes/webauthnRoutes.js` & `@simplewebauthn/server`
  - **Features**: Passwordless authentication using Windows Hello, TouchID, YubiKeys, and hardware security tokens.

## File Storage & Document Generation
- **Multer Storage Engine**: `backend/routes/...` (Uploads folder `backend/uploads/` for student photos, document verification, homework submissions).
- **Excel Ingestion / Export**: `xlsx` library for bulk student/faculty imports and grade register export.
- **PDF Generation**: `jspdf` & `html2canvas` for fee receipts, marksheets, hall tickets, and official certificates.

## Email & Notifications
- **SMTP Gateway**: `nodemailer` configured via `backend/routes/emailRoutes.js` for password resets, fee alerts, attendance warnings, and admissions approvals.
