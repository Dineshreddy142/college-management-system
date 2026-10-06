# Testing & Verification Strategy Map

## Verification Commands

### 1. Frontend Build Verification
To ensure TypeScript types, imports, and Vite bundles compile cleanly without errors:
```bash
npm run build
```

### 2. Service Launch & Health Checks
- **Combined Frontend Portals**: `npm run dev` or `npm run dev:portals`
- **Backend Server**: `npm run dev:backend` or `node backend/server.js`
- **Database Initialization / Verification**: `npm run db:init` or `node backend/run_init_db.js`

## Runtime Verification Checklist
When testing endpoints or UI forms:
1. **Database Schema Verification**: Run `db:init` to ensure all columns exist.
2. **API Response Audit**: Verify API endpoints return status code `200` with expected payload object.
3. **UI Binding Audit**: Form inputs update state, submit button sends API call, UI updates reactively upon response.
4. **Build Check**: `npm run build` succeeds without TS compilation errors.
