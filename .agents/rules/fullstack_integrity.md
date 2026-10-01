# Fullstack Chain Verification Rule

Whenever building or modifying any feature:

1. **DB Schema:** Verify MySQL table structure in `backend/init_db.js` & add auto-migration checks (`ALTER TABLE ADD COLUMN`).
2. **API Endpoint:** Verify `SELECT` retrieves all columns and `PUT/POST` updates all payload fields across `users` and role tables.
3. **UI & Event Handlers:** Ensure all buttons have real `onClick` network handlers sending 100% of input data.
4. **Build Verification:** Run `npm run build` to confirm 0 compilation errors.
