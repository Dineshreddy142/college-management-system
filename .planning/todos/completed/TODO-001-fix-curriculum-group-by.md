# TODO-001: Fix GROUP BY SQL clause in curriculumController.js

- **Category**: Bug Fix / Database Query
- **Severity**: Critical
- **Target File**: `backend/controllers/curriculumController.js`
- **Created**: 2026-10-06
- **Completed**: 2026-10-06
- **Status**: RESOLVED & VERIFIED

## Resolution Summary
Updated line 125 of `backend/controllers/curriculumController.js` to explicitly group by all joined non-aggregated columns (`d.name`, `d.code`, `crs.name`, `r.name`, `r.effective_year`, `sem.name`, `sem.semester_number`, `ay.name`, `ay.year_level`). Verified with `GET /api/curriculums` returning HTTP 200 `{ success: true, count: 0, data: [] }`.
