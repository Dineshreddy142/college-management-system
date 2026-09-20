import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function cleanAndSetAdmin() {
  console.log('Connecting to TiDB Cloud database...');
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '2ZhWtaNceZkmRfJ.root',
    password: 'Jlriyn1naUq72MxB',
    database: 'test',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });

  console.log('1. Cleaning up all existing users, logs, and attempts...');
  await conn.query('DELETE FROM failed_login_attempts;');
  await conn.query('DELETE FROM activity_logs;');
  await conn.query('DELETE FROM students;');
  await conn.query('DELETE FROM faculty;');
  await conn.query('DELETE FROM users;');

  console.log('2. Ensuring Admin role exists...');
  await conn.query('INSERT IGNORE INTO roles (id, name) VALUES (1, "Admin");');
  const [roles] = await conn.query('SELECT id, name FROM roles WHERE name = "Admin";');
  const adminRoleId = roles[0].id;

  console.log('3. Hashing password Dinesh@123 with bcrypt...');
  const hashedPassword = await bcrypt.hash('Dinesh@123', 10);

  console.log('4. Inserting single permanent Admin account...');
  const [insertRes] = await conn.query(
    `INSERT INTO users (username, full_name, email, password, role_id, status)
     VALUES (?, ?, ?, ?, ?, 'active');`,
    ['dineshreddy', 'Dinesh Reddy', 'nuthanakalvadineshreddy@gmail.com', hashedPassword, adminRoleId]
  );
  console.log(`✔ Admin user inserted with ID: ${insertRes.insertId}`);

  console.log('\n5. Current Users in Database:');
  const [users] = await conn.query(`
    SELECT u.id, u.username, u.full_name, u.email, u.status, r.name as role_name 
    FROM users u 
    JOIN roles r ON u.role_id = r.id;
  `);
  console.table(users);

  await conn.end();
  console.log('✨ All old accounts deleted. Single Admin account is active!');
}

cleanAndSetAdmin().catch(console.error);
