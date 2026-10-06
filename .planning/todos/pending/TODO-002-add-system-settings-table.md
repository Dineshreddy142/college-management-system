# TODO-002: Add missing system_settings table to init_db.js

- **Category**: Database Schema Guardrail
- **Severity**: High
- **Target File**: `backend/init_db.js` & `backend/controllers/settingController.js`
- **Created**: 2026-10-06

## Problem Description
`GET /api/settings` fails with HTTP 500 (`ER_NO_SUCH_TABLE: Table 'test.system_settings' doesn't exist`) because `system_settings` is not initialized during database setup.

## Recommended Fix
Add table creation statement in `backend/init_db.js`:
```sql
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```
