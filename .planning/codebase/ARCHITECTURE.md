# Architecture Overview Map

## System Topology & Architecture Pattern
The **College Management System** follows a decoupled **Client-Server Architecture** with a multi-portal frontend SPA (Single Page Application) and a centralized Node.js/Express REST API backed by MySQL / TiDB Cloud database.

```
+-----------------------------------------------------------------------------------+
|                                 FRONTEND PORTALS                                  |
| (Vite + React 18 + Tailwind CSS + Lucide Icons + Radix UI + Motion)              |
| Ports: 5171 (Admin) | 5172 (Student) | 5173 (Faculty) | 5174 (HOD)               |
|        5175 (Parent) | 5176 (Principal) | 5177 (Office)                         |
+-----------------------------------------------------------------------------------+
                                         │
                                   HTTP / REST API
                                         │
+-----------------------------------------------------------------------------------+
|                                 BACKEND API SERVER                                |
| (Node.js + Express v4 + ES Modules)                                              |
| Port: 5000 (Central API Server `backend/server.js`)                              |
|                                                                                   |
|  ├─ Routes (32 modules: authRoutes, studentRoutes, faceAuthRoutes, aiRoutes...)    |
|  ├─ Controllers (Business logic layer)                                           |
|  ├─ Middlewares (Authentication, RBAC, Error Handling, Multer Uploads)            |
|  └─ Services (AI Service, Email Service, Face Auth Service, DB Helper)            |
+-----------------------------------------------------------------------------------+
                                         │
                                   MySQL Pool
                                         │
+-----------------------------------------------------------------------------------+
|                                 DATABASE LAYER                                    |
| MySQL 8.0 / TiDB Serverless Cloud Database                                        |
| Core Tables: users, roles, departments, subjects, courses, students, faculty,     |
|             parents, attendance, fees, blocks, library, exams, audits...        |
+-----------------------------------------------------------------------------------+
```

## Frontend Portal Architecture
The frontend is split into distinct role-oriented dashboards under `src/portals/` and modular administrative suites under `src/app/`:
1. **Admin Portal** (`src/portals/admin/` & `src/app/admin/`): Central governance, role assignment, audit logs, block management, system config.
2. **Student Portal** (`src/portals/student/`): Academic dashboard, attendance tracking, fee payment, course registration, AI tutor.
3. **Faculty Portal** (`src/portals/faculty/`): Attendance entry, grade entry, assignment submission review, timetable.
4. **HOD Portal** (`src/portals/hod/`): Departmental analytics, faculty workload management, subject allocation.
5. **Parent Portal** (`src/portals/parent/`): Student performance tracking, attendance alerts, fee receipts.
6. **Principal Portal** (`src/portals/principal/`): Executive dashboards, institutional reports, governance controls.
7. **Office / Staff Portal** (`src/portals/office/`): Admissions processing, fee collection, certificate issuance.

## Relational Data Model & Integrity Rules
- Central identity resides in the `users` table (`id`, `name`, `email`, `role`, `status`, `department_id`, etc.).
- Role-specific extensions are maintained in auxiliary tables: `students` (`user_id`, `usn`, `semester`, `section`, `cgpa`), `faculty` (`user_id`, `employee_id`, `designation`), `parents` (`user_id`, `student_id`).
- Mandatory rule enforcement per workspace `AGENTS.md`:
  - **4-Layer Integrity**: Database schemas ↔ API handlers ↔ UI state ↔ Runtime build verification.
  - **Column Guardrails**: Auto-migration column guards (`ADD COLUMN IF NOT EXISTS`) in `backend/init_db.js`.
