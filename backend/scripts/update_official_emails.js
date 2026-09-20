import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER || 'root';
const dbPass = process.env.DB_PASS || 'WJ28@krhps';
const dbName = process.env.DB_NAME || 'college_management_system';

const targetAccounts = [
  {
    role: 'Admin',
    officialEmail: 'nuthanakalvadineshreddy@gmail.com',
    preferredId: 1,
    username: 'admin',
    defaultPassword: 'Admin@123'
  },
  {
    role: 'Faculty',
    officialEmail: 'nreddydinesh1428@gmail.com',
    preferredId: 3,
    username: 'faculty',
    defaultPassword: 'Faculty@123'
  },
  {
    role: 'HOD',
    officialEmail: 'nreddydinesh@gmail.com',
    preferredId: 6,
    username: 'hod',
    defaultPassword: 'Hod@123'
  },
  {
    role: 'Student',
    officialEmail: 'as1428dinesh@gmail.com',
    preferredId: 2,
    username: 'student',
    defaultPassword: 'Student@123'
  }
];

async function updateOfficialEmails() {
  console.log('====================================================');
  console.log(' Updating Official College Management ERP Accounts');
  console.log('====================================================');

  const pool = mysql.createPool({
    host: dbHost,
    user: dbUser,
    password: dbPass,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 5
  });

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Fetch available roles
    const [roles] = await conn.execute('SELECT id, name FROM roles');
    const roleMap = {};
    roles.forEach(r => roleMap[r.name.toLowerCase()] = r.id);

    console.log('Roles found:', roleMap);

    const results = [];

    for (const acc of targetAccounts) {
      const normalizedEmail = acc.officialEmail.trim().toLowerCase();
      const roleId = roleMap[acc.role.toLowerCase()];

      if (!roleId) {
        throw new Error(`Role '${acc.role}' not found in roles table.`);
      }

      // Check if official email already exists
      const [existingEmail] = await conn.execute(
        'SELECT id, username, email, role_id, status, password FROM users WHERE LOWER(email) = ?',
        [normalizedEmail]
      );

      if (existingEmail.length > 0) {
        const user = existingEmail[0];
        console.log(`[EXISTS] Account with email '${normalizedEmail}' already exists (ID: ${user.id}, Role ID: ${user.role_id}).`);

        // Ensure role_id and status are active
        await conn.execute(
          'UPDATE users SET role_id = ?, status = "active", updated_at = NOW() WHERE id = ?',
          [roleId, user.id]
        );

        results.push({
          action: 'VERIFIED/UPDATED',
          id: user.id,
          username: user.username,
          email: normalizedEmail,
          role: acc.role,
          role_id: roleId,
          status: 'active'
        });
        continue;
      }

      // Find the account by preferred ID, username, or role
      const [existingUser] = await conn.execute(
        'SELECT id, username, email, role_id, status, password FROM users WHERE id = ? OR username = ? OR role_id = ? LIMIT 1',
        [acc.preferredId, acc.username, roleId]
      );

      if (existingUser.length > 0) {
        const user = existingUser[0];
        const oldEmail = user.email;

        // Ensure password is a valid bcrypt hash
        let passwordHash = user.password;
        if (!passwordHash || !passwordHash.startsWith('$2')) {
          passwordHash = await bcrypt.hash(acc.defaultPassword, 10);
        }

        await conn.execute(
          'UPDATE users SET email = ?, role_id = ?, password = ?, status = "active", updated_at = NOW() WHERE id = ?',
          [normalizedEmail, roleId, passwordHash, user.id]
        );

        console.log(`[UPDATED] User ID ${user.id} (${user.username}): '${oldEmail}' -> '${normalizedEmail}'`);

        results.push({
          action: 'UPDATED',
          id: user.id,
          username: user.username,
          old_email: oldEmail,
          new_email: normalizedEmail,
          role: acc.role,
          role_id: roleId,
          status: 'active'
        });
      } else {
        // Create new account if not present
        const passwordHash = await bcrypt.hash(acc.defaultPassword, 10);
        const [insertRes] = await conn.execute(
          'INSERT INTO users (id, username, email, password, role_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, "active", NOW(), NOW())',
          [acc.preferredId, acc.username, normalizedEmail, passwordHash, roleId]
        );

        console.log(`[CREATED] User ID ${acc.preferredId} (${acc.username}) with email '${normalizedEmail}'`);

        results.push({
          action: 'CREATED',
          id: acc.preferredId,
          username: acc.username,
          email: normalizedEmail,
          role: acc.role,
          role_id: roleId,
          status: 'active'
        });
      }
    }

    await conn.commit();
    console.log('\n====================================================');
    console.log(' Migration Summary Table:');
    console.log('====================================================');
    console.table(results);

    // Final database verification
    const [finalUsers] = await conn.execute(
      'SELECT u.id, u.username, u.email, r.name as role_name, u.status FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.id'
    );
    console.log('\nAll Users in Database:');
    console.table(finalUsers);

  } catch (err) {
    await conn.rollback();
    console.error('Migration failed and was safely rolled back:', err);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

updateOfficialEmails();
