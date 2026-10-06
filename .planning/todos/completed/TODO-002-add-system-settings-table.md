# TODO-002: Add missing system_settings table to init_db.js

- **Category**: Database Schema Guardrail
- **Severity**: High
- **Target File**: `backend/init_db.js` & `backend/controllers/settingController.js`
- **Created**: 2026-10-06
- **Completed**: 2026-10-06
- **Status**: RESOLVED & VERIFIED

## Resolution Summary
Added `system_settings` table initialization and default key-value seeds to `backend/init_db.js`. Ran database migration successfully and verified `GET /api/settings` returning HTTP 200 `{ "system_name": "College Management System", ... }`.
