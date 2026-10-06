# Phase 8 Plan: Comprehensive UAT & Endpoint Verification

## Phase Objective
Systematically verify and validate the entire **College Management System** across all 4 layers (Database ↔ Backend API ↔ Frontend UI ↔ Build System) for all user roles, ensuring zero broken buttons, zero missing database columns, and 100% active API network bindings.

---

## User Story / Tracer Focus
- **Tracer Goal**: Verify end-to-end user flows for Admin, Student, Faculty, HOD, Parent, Principal, and Office Staff portals against live API routes and database schemas.

---

## Tasks & Wave Execution

### Wave 1: Backend API & Database Relational Verification

#### Task 1: Express Server & API Route Telemetry Audit
- **Objective**: Ensure all 32 backend route modules start cleanly, execute queries without missing column SQL exceptions, and return complete record objects (`success: true`, `data: ...`).
- **Files to Inspect/Verify**:
  - `backend/server.js`
  - `backend/db.js`
  - `backend/init_db.js`
  - `backend/routes/*.js` (32 route files)
- **Verification**: Run `node backend/run_init_db.js` and start server to verify database initialization and column migration guardrails (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).

#### Task 2: Multi-Role Relational Fallback Verification
- **Objective**: Test relational integrity across all 10+ user roles (Chancellor, Vice Chancellor, Admin, Registrar, Dean, Principal, COE, HOD, Faculty, Student, Parent, Staff).
- **Files to Inspect/Verify**:
  - `backend/controllers/authController.js`
  - `backend/controllers/studentPortalController.js`
  - `backend/controllers/facultyController.js`
  - `backend/controllers/dashboardController.js`
- **Verification**: Verify controllers gracefully fall back to base `users` table when auxiliary records (`students`, `faculty`, `parents`) are absent.

---

### Wave 2: Frontend UI & Event Handler Audit

#### Task 3: Portal Button & Network Binding Audit
- **Objective**: Audit input forms and button handlers across all 7 frontend portal suites to guarantee 100% active network requests (`axios`/`apiClient`) instead of static mock toasts.
- **Files to Inspect/Verify**:
  - `src/portals/admin/*`
  - `src/portals/student/*`
  - `src/portals/faculty/*`
  - `src/portals/hod/*`
  - `src/portals/parent/*`
  - `src/portals/principal/*`
  - `src/portals/office/*`
- **Verification**: Ensure component state binds to input elements and API responses update local state & `localStorage`.

---

### Wave 3: Final Build & Production Verification

#### Task 4: Compilation & Build Verification
- **Objective**: Compile production bundle and ensure zero TypeScript errors or missing module resolution issues.
- **Verification Command**:
  ```bash
  npm run build
  ```
- **Success Criteria**: Exit code 0 with 2,600+ Vite modules transformed cleanly.

---

## Verification Criteria
- [ ] `node backend/run_init_db.js` completes with 0 errors.
- [ ] Backend API server starts on port 5000 without missing route dependencies.
- [ ] All 7 portal routes load with working API handlers.
- [ ] `npm run build` completes with exit code 0.
