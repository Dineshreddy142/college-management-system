import pool from '../db.js';

export async function migrateUsersFullName() {
  console.log('[MIGRATION] Checking full_name column on users table...');
  try {
    const [cols] = await pool.query('DESCRIBE users');
    const hasFullName = cols.some(c => c.Field === 'full_name');
    if (!hasFullName) {
      await pool.query('ALTER TABLE users ADD COLUMN full_name VARCHAR(150) NULL AFTER username');
      console.log('✔ Added full_name column to users table');
    } else {
      console.log('✔ full_name column already exists in users table');
    }

    // Populate full_name for existing users if NULL or blank
    const updates = [
      { email: 'nuthanakalvadineshreddy@gmail.com', name: 'Dinesh Reddy' },
      { username: 'dineshreddy', name: 'Dinesh Reddy' },
      { username: 'admin', name: 'System Administrator' },
      { username: 'student', name: 'Student User' },
      { username: 'faculty', name: 'Faculty Member' },
      { username: 'parent', name: 'Parent User' },
      { username: 'principal', name: 'Dr. Principal' },
      { username: 'hod', name: 'Dr. HOD Computer Science' },
      { username: 'accounts', name: 'Chief Accountant' },
      { username: 'librarian', name: 'Head Librarian' },
      { username: 'placement', name: 'Placement Officer' }
    ];

    for (const u of updates) {
      if (u.email) {
        await pool.query(
          'UPDATE users SET full_name = ? WHERE LOWER(email) = ? AND (full_name IS NULL OR full_name = "")',
          [u.name, u.email.toLowerCase()]
        );
      }
      if (u.username) {
        await pool.query(
          'UPDATE users SET full_name = ? WHERE LOWER(username) = ? AND (full_name IS NULL OR full_name = "")',
          [u.name, u.username.toLowerCase()]
        );
      }
    }

    // Also update any remaining users without full_name to capitalize their username
    await pool.query(
      'UPDATE users SET full_name = CONCAT(UPPER(SUBSTRING(username, 1, 1)), SUBSTRING(username, 2)) WHERE full_name IS NULL OR full_name = ""'
    );

    const [users] = await pool.query('SELECT id, username, full_name, email FROM users');
    console.log('Current users with full_name:', users);
    return { success: true };
  } catch (err) {
    console.error('[MIGRATION ERROR]:', err.message);
    return { success: false, error: err.message };
  }
}

// Run directly if invoked as script
if (process.argv[1]?.endsWith('migrate_users_fullname.js')) {
  migrateUsersFullName().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
