# Technical Concerns & Risk Register Map

## Active Technical Risks & Governance Items

### 1. Database Column Synchronization Guardrails
- **Risk**: Adding new form fields or API parameters without updating `backend/init_db.js` or `schema.sql` can trigger MySQL `Unknown column` SQL runtime exceptions.
- **Mitigation**: Strictly follow Rule 1 from `AGENTS.md` and include `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in `backend/init_db.js`.

### 2. Multi-Role Auxiliary Table Fallbacks
- **Risk**: Users with non-standard administrative roles (e.g. Chancellor, Vice Chancellor, Registrar, Dean, COE) may lack records in auxiliary `students` or `faculty` tables.
- **Mitigation**: Controllers must fallback gracefully to the `users` base table to avoid null dereference exceptions or empty UI profiles.

### 3. Real API Network Binding vs Mock Toasts
- **Risk**: New UI components might be added with dummy `sonner` toast alerts instead of executing real HTTP requests to backend endpoints.
- **Mitigation**: Enforce mandatory 4-layer inspection for every button and form component.

### 4. Large Controller & Route Files
- **Risk**: Modules like `backend/routes/authRoutes.js` (36KB) and `backend/routes/blockRoutes.js` (37KB) contain substantial inline logic.
- **Mitigation**: Refactor high-density route handlers into modular controllers and services under `backend/controllers/` and `backend/services/`.
