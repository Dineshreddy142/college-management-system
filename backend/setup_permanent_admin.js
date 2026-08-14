import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function setupPermanentAdmin() {
  console.log('Connecting to TiDB Cloud database...');
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '2ZhWtaNceZkmRfJ.root',
    password: 'Jlriyn1naUq72MxB',
    database: 'test',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });

  const adminEmail = 'nuthanakalvadineshreddy@gmail.com';
  const adminRawPassword = 'Dinesh@123';
  const adminUsername = 'dineshreddy';
  const adminFullName = 'Dinesh Reddy';

  console.log('1. Ensuring Admin role exists in roles table...');
  await conn.query('INSERT IGNORE INTO roles (name) VALUES (?)', ['Admin']);
  const [roleRows] = await conn.query('SELECT id, name FROM roles WHERE name = ?', ['Admin']);
  const adminRoleId = roleRows[0].id;
  console.log(`✔ Admin Role ID: ${adminRoleId} (${roleRows[0].name})`);

  console.log('2. Hashing password with bcrypt (10 rounds)...');
  const hashedPassword = await bcrypt.hash(adminRawPassword, 10);
  console.log('✔ Password hashed successfully (Bcrypt starting with $2)');

  console.log(`3. Checking if ${adminEmail} already exists...`);
  const [existing] = await conn.query('SELECT id, username, email, role_id, status FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?', [adminEmail.toLowerCase(), adminUsername.toLowerCase()]);

  let adminUserId;
  if (existing.length > 0) {
    adminUserId = existing[0].id;
    console.log(`User exists with ID: ${adminUserId}. Updating to permanent Admin status...`);
    await conn.query(
      `UPDATE users 
       SET password = ?, role_id = ?, status = 'active', must_change_password = 0, full_name = COALESCE(full_name, ?), email = ?, username = ?
       WHERE id = ?`,
      [hashedPassword, adminRoleId, adminFullName, adminEmail, adminUsername, adminUserId]
    );
    console.log(`✔ Updated existing user ID ${adminUserId} to permanent Admin.`);
  } else {
    console.log('User does not exist. Creating new permanent Admin account...');
    const [result] = await conn.query(
      `INSERT INTO users (username, full_name, email, password, role_id, status, must_change_password)
       VALUES (?, ?, ?, ?, ?, 'active', 0)`,
      [adminUsername, adminFullName, adminEmail, hashedPassword, adminRoleId]
    );
    adminUserId = result.insertId;
    console.log(`✔ Created new permanent Admin user with ID: ${adminUserId}`);
  }

  console.log('\n4. Verifying user record in database:');
  const [userRecord] = await conn.query(
    `SELECT u.id, u.username, u.full_name, u.email, u.status, u.created_at, r.name as role_name 
     FROM users u 
     JOIN roles r ON u.role_id = r.id 
     WHERE u.id = ?`,
    [adminUserId]
  );
  console.table(userRecord);

  await conn.end();
  console.log('✨ SUCCESS: Permanent Admin account is fully configured and ready!');
}

setupPermanentAdmin().catch(console.error);
