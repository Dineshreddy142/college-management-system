import pool from './db.js';

async function cleanupNonAdminUsers() {
  console.log('====================================================');
  console.log(' Starting Non-Admin Account Cleanup & Verification');
  console.log('====================================================');

  const conn = await pool.getConnection();

  try {
    // 1. Get Admin role ID
    const [adminRoles] = await conn.query('SELECT id, name FROM roles WHERE LOWER(name) = "admin"');
    if (adminRoles.length === 0) {
      throw new Error('Admin role not found in roles table!');
    }
    const adminRoleId = adminRoles[0].id;
    console.log(`[DB] Preserving Admin Role ID: ${adminRoleId} (${adminRoles[0].name})`);

    // 2. Find Admin users and Non-Admin users
    const [adminUsers] = await conn.query('SELECT id, username, email FROM users WHERE role_id = ?', [adminRoleId]);
    console.log(`[DB] Preserved Admin Accounts (${adminUsers.length}):`);
    console.table(adminUsers);

    const [nonAdminUsers] = await conn.query('SELECT id, username, email, role_id FROM users WHERE role_id != ? OR role_id IS NULL', [adminRoleId]);
    console.log(`[DB] Non-Admin Accounts Identified for Purging (${nonAdminUsers.length})`);

    if (nonAdminUsers.length === 0) {
      console.log('✨ No non-admin users found in database. Database is already clean!');
    } else {
      const nonAdminIds = nonAdminUsers.map(u => u.id);
      console.log(`[DB] Deleting dependent records for ${nonAdminIds.length} non-admin user IDs...`);

      await conn.query('SET FOREIGN_KEY_CHECKS = 0;');

      // Delete dependent records in child tables
      const deleteTables = [
        { table: 'student_documents', col: 'student_id', subQuery: 'SELECT id FROM students WHERE user_id IN (?)' },
        { table: 'student_guardians', col: 'student_id', subQuery: 'SELECT id FROM students WHERE user_id IN (?)' },
        { table: 'student_profiles', col: 'student_id', subQuery: 'SELECT id FROM students WHERE user_id IN (?)' },
        { table: 'parent_student', col: 'student_id', subQuery: 'SELECT id FROM students WHERE user_id IN (?)' },
        { table: 'attendance_details', col: 'student_id', subQuery: 'SELECT id FROM students WHERE user_id IN (?)' },
        { table: 'marks', col: 'student_id', subQuery: 'SELECT id FROM students WHERE user_id IN (?)' },
        { table: 'students', col: 'user_id', direct: true },
        { table: 'faculty_departments', col: 'faculty_id', subQuery: 'SELECT id FROM faculties WHERE user_id IN (?)' },
        { table: 'faculties', col: 'user_id', direct: true },
        { table: 'parents', col: 'user_id', direct: true },
        { table: 'user_sessions', col: 'user_id', direct: true },
        { table: 'failed_login_attempts', col: 'user_id', direct: true },
        { table: 'webauthn_credentials', col: 'user_id', direct: true },
        { table: 'notifications', col: 'user_id', direct: true },
        { table: 'ai_conversations', col: 'user_id', direct: true },
        { table: 'campus_room_bookings', col: 'user_id', direct: true }
      ];

      for (const t of deleteTables) {
        try {
          if (t.direct) {
            await conn.query(`DELETE FROM ${t.table} WHERE ${t.col} IN (?)`, [nonAdminIds]);
          } else {
            await conn.query(`DELETE FROM ${t.table} WHERE ${t.col} IN (${t.subQuery})`, [nonAdminIds]);
          }
        } catch (tErr) {
          // Table or column might not exist in all schemas, log and continue
          console.log(`   - Note on table ${t.table}: ${tErr.message}`);
        }
      }

      // Delete non-admin records from users table
      const [delResult] = await conn.query('DELETE FROM users WHERE role_id != ? OR role_id IS NULL', [adminRoleId]);
      console.log(`✔ Deleted ${delResult.affectedRows} non-admin user records from 'users' table.`);

      await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
    }

    // 3. Final Verification
    console.log('\n====================================================');
    console.log(' Final User Accounts Verification');
    console.log('====================================================');
    const [finalUsers] = await conn.query(`
      SELECT u.id, u.username, u.full_name, u.email, u.status, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id
    `);
    console.table(finalUsers);
    console.log(`Total remaining users: ${finalUsers.length}`);

  } catch (err) {
    console.error('ERROR during cleanup:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

cleanupNonAdminUsers();
