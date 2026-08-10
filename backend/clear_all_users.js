import mysql from 'mysql2/promise';

async function resetAndClean() {
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '2ZhWtaNceZkmRfJ.root',
    password: 'Jlriyn1naUq72MxB',
    database: 'test',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });

  await conn.query('SET FOREIGN_KEY_CHECKS = 0;');

  // Truncate users, students, faculty, logs
  await conn.query('TRUNCATE TABLE activity_logs;');
  await conn.query('TRUNCATE TABLE failed_login_attempts;');
  await conn.query('TRUNCATE TABLE students;');
  await conn.query('TRUNCATE TABLE faculty;');
  await conn.query('TRUNCATE TABLE users;');

  // Clean roles
  await conn.query('TRUNCATE TABLE roles;');
  const uniqueRoles = [
    'Admin',
    'Student',
    'Faculty',
    'Parent',
    'Principal',
    'HOD',
    'Accountant',
    'Librarian',
    'Placement Officer',
    'Office Staff'
  ];

  for (const r of uniqueRoles) {
    await conn.query('INSERT INTO roles (name) VALUES (?)', [r]);
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 1;');

  const [users] = await conn.query('SELECT * FROM users;');
  console.log('Total Users in Database:', users.length);

  const [roles] = await conn.query('SELECT * FROM roles;');
  console.table(roles);

  await conn.end();
  console.log('✨ DATABASE CLEAN: 0 users, 10 active roles ready for real registrations!');
}

resetAndClean().catch(console.error);
