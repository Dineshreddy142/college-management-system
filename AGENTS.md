# Antigravity Workspace Fullstack Integrity Rules

To eliminate missing relations, broken buttons, missing database columns, and un-wired API calls, Antigravity MUST follow this strict 4-step verification workflow on **EVERY prompt and task**:

---

## Rule 1: Mandatory 4-Layer Inspection (DB ↔ API ↔ UI ↔ Verification)

Before modifying or completing any feature, form, button, or dashboard:

1. **Database Layer Check:**
   - Inspect existing database schemas in `backend/init_db.js`, `schema.sql`, or `backend/db.js`.
   - Ensure all requested fields exist in MySQL tables.
   - Include safe auto-column guardrails (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) so live database instances never fail with `Unknown column 'field' in field list`.

2. **Backend API Layer Check:**
   - Verify `SELECT` queries return complete record telemetry (use `u.*` or list all fields explicitly). Never truncate columns.
   - Verify `PUT`/`POST` handlers extract every field from `req.body` and update both central (`users`) and auxiliary (`students`, `faculty`, `parents`) tables.
   - Return fresh updated objects in API responses (`data: updatedRecord`).

3. **Frontend UI & Event Handler Check:**
   - Verify all input fields (text, select, date, textarea) bind to component state.
   - Verify every button has an active, working `onClick` handler. **NEVER** use dummy toast messages in place of real API network requests.
   - Package 100% of editable fields into the API payload.
   - Update local component state and `localStorage` upon success so UI headers, navigation, and badges reflect updates immediately.

4. **Runtime Verification:**
   - Always run `npm run build` or test commands to verify zero TypeScript compile errors before completing the turn.

---

## Rule 2: Multi-Role Relational Integrity

- Always test and verify code behavior across **all user roles**:
  - Executive / Governance: Chancellor, Vice Chancellor, Admin, Registrar, Dean, Principal, COE.
  - Operational: Faculty, Students, Parents, Staff, Librarian, Accountant.
- If a user role does not exist in an auxiliary table (`students` / `faculty`), fallback gracefully to the `users` table without leaving fields blank or causing crashes.

---

## Rule 3: Zero Guesswork Policy

- **NEVER** guess column names, endpoint URLs, or payload keys. Always view the source files first.
- If an error occurs, inspect the log output immediately before attempting fixes.
