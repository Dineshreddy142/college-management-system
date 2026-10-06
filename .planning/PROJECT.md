# College Management System (ERP) - Project Overview

## Objective & Vision
The **College Management System** is a comprehensive, enterprise-grade Higher Education ERP platform. It unifies academic governance, student administration, faculty management, biometric face authentication, WebAuthn passkey security, financial processing, hostel/block infrastructure, library operations, and Google Gemini AI assistance into a single unified web system.

## Key Stakeholders & Role Matrix
- **Governance**: Chancellor, Vice Chancellor, Registrar, Dean, Principal, Controller of Examinations (COE).
- **Academic Operational**: HOD, Faculty, Students, Parents.
- **Administrative & Campus Ops**: Admin, Office / Staff, Librarian, Accountant, Security Officers.

## Architecture Highlights
- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS + Lucide Icons + Motion + Radix UI + Recharts.
- **Backend**: Node.js + Express REST API (ES Modules) running on Port 5000.
- **Database**: MySQL 8.0 / TiDB Cloud Serverless database initialized via `schema.sql` and `backend/init_db.js`.
- **AI & Security**: Google Gemini AI (`@google/genai`), ONNX Face Recognition, WebAuthn Passkeys.

## Workspace Integrity Rules (`AGENTS.md`)
1. **Mandatory 4-Layer Inspection**: DB Schema ↔ Backend API ↔ Frontend UI State ↔ Runtime Build Verification.
2. **Multi-Role Relational Integrity**: Full support across 10+ user roles with safe auxiliary table fallbacks.
3. **Zero Guesswork Policy**: Explicit verification of all column names, API endpoints, and payload structures before code changes.
