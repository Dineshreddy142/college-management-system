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

---

## Rule 4: Fullstack Synchronicity (Zero Half-Baked Features)

When creating, modifying, or deleting any feature, module, or entity:
- **NEVER** perform changes in only one layer (e.g. deleting in UI while leaving backend routes and database tables dangling).
- Every operation must be executed across **all 3 layers simultaneously**:
  1. **Database Layer:** Tables, columns, foreign keys, views, and `backend/init_db.js`.
  2. **Backend API Layer:** Express routes, controllers, services, middlewares, and error handlers.
  3. **Frontend UI Layer:** Navigation links, sidebar items, React components, state bindings, API calls, and modals.
- If a feature is deleted, its UI components, backend routes/controllers, and database tables must be removed together.
- If a feature is implemented, its database schema, backend API, and interactive UI must be wired together end-to-end.

---

## Rule 5: Mandatory Pre-Action User Report & Explicit Approval

Before implementing, altering, or deleting ANY feature, table, or component:
1. Provide a comprehensive **3-Layer Impact Report** to the user:
   - **Database:** What tables/columns exist, will be modified, or will be deleted.
   - **Backend API:** What endpoints exist, will be created, or will be removed.
   - **Frontend UI:** What components, buttons, or routes already exist or will be changed.
2. State whether components/tables already exist, are needed, or are redundant.
3. Explicitly ask for user approval before modifying code or dropping tables.

---

## Rule 6: Automated Fullstack Integrity Guardrail

- Always run `npm run verify:all` on every change.
- The verification pipeline must audit:
  - Database foreign keys and zero orphan records.
  - Zero dead or un-wired buttons in frontend.
  - Zero compile errors across TypeScript and Vite production bundles.

---

## Rule 7: Mandatory Error Diagnosis & Cause Report Protocol (Never Implement Directly)

Whenever the user reports ANY error (runtime exception, build failure, IDE diagnostic, or broken interaction):

1. **NEVER Directly Modify Code:**
   - Antigravity MUST NEVER immediately edit, patch, or rewrite code upon receiving an error report.

2. **Diagnose First & Identify Root Cause:**
   - Trace the exact line, stack frame, minified bundle symbol, SQL query, or API contract that triggered the failure.
   - Determine the fundamental reason why it failed (type mismatch, missing endpoint, schema divergence, null pointer, etc.).

3. **Deliver the Cause & Impact Report to User:**
   - Antigravity MUST present a structured **Cause & Impact Report** to the user first:
     * **Error Telemetry:** Exact file, line, and runtime context.
     * **Root Cause & Reason:** Why the failure occurred.
     * **3-Layer Impact Analysis:**
       - Database: Affected tables/columns (or confirm 0 impact).
       - Backend API: Affected endpoints/controllers (or confirm 0 impact).
       - Frontend UI: Affected components, state, or hooks.
     * **Proposed Fullstack Fix:** Step-by-step resolution plan.

4. **Explicit User Confirmation Required:**
   - Explicitly request the user's approval before modifying any files or databases.
   - Only execute the fix after receiving explicit user consent.

