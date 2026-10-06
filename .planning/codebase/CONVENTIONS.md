# Coding Conventions & Engineering Guidelines

## Mandatory Antigravity Fullstack Integrity Rules (from `AGENTS.md`)

### Rule 1: 4-Layer Inspection Workflow
Every feature modification must explicitly cover all 4 layers:
1. **Database Layer**: Validate schema in `backend/init_db.js`, `schema.sql`, or `backend/db.js`. Always add safe column guardrails (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) to prevent runtime schema errors.
2. **Backend API Layer**: Ensure `SELECT` queries fetch complete records (`u.*` or explicit column lists). Ensure `POST`/`PUT` endpoints parse all fields from `req.body` and update core (`users`) and auxiliary tables (`students`, `faculty`, `parents`).
3. **Frontend UI & Event Handler Layer**: Bind every input field to React component state. Every button **MUST** have an active, working `onClick` network request handler. **NEVER** use dummy toast messages in place of real API network requests.
4. **Runtime Verification**: Always execute build and syntax checks (`npm run build` or node syntax checks) before finishing work.

### Rule 2: Multi-Role Relational Integrity
- Support all active institutional user roles: Chancellor, Vice Chancellor, Admin, Registrar, Dean, Principal, COE, HOD, Faculty, Student, Parent, Staff, Librarian, Accountant.
- Gracefully handle cases where a user role does not have an auxiliary table record by falling back to the primary `users` record.

### Rule 3: Zero Guesswork Policy
- Never guess column names, API endpoints, or payload schemas. Inspect target source files before writing code.

## Code Structure & Conventions

### Frontend Conventions
- **Language**: TypeScript (`.tsx`, `.ts`)
- **Styling**: Tailwind CSS classes combined with `clsx` / `tailwind-merge`.
- **UI Components**: Built using Radix UI primitives with smooth Motion animations and Sonner toast notifications.
- **State Management**: React hooks (`useState`, `useEffect`, `useContext`) paired with `localStorage` persistence for session data.

### Backend Conventions
- **Module System**: ES Modules (`import`/`export`) in Node.js.
- **API Responses**: Standardized JSON payload structure: `{ success: boolean, data: any, message?: string, error?: string }`.
- **Error Handling**: Express async middleware wrappers with centralized error handling in `backend/middlewares/errorHandler.js`.
