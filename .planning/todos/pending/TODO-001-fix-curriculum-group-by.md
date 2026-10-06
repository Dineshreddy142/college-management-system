# TODO-001: Fix GROUP BY SQL clause in curriculumController.js

- **Category**: Bug Fix / Database Query
- **Severity**: Critical
- **Target File**: `backend/controllers/curriculumController.js`
- **Created**: 2026-10-06

## Problem Description
`GET /api/curriculums` returns HTTP 500 in strict `only_full_group_by` SQL mode because the query selects joined columns (`d.name`, `d.code`, `crs.name`, `r.name`, `sem.name`, `ay.name`) while only grouping by `c.id`.

## Recommended Fix
Update line 125 of `backend/controllers/curriculumController.js` to explicitly group by all selected non-aggregated columns:
```sql
GROUP BY c.id, d.name, d.code, crs.name, r.name, sem.name, ay.name ORDER BY c.id DESC
```
