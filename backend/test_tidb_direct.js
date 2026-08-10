import mysql from 'mysql2/promise';

async function testTiDB() {
  console.log('Connecting with correct username 2ZhWtaNceZkmRfJ.root ...');
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '2ZhWtaNceZkmRfJ.root',
    password: 'YhzZ1AEefV0ql8kK',
    database: 'test',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });

  console.log('Connected successfully!');
  const [tables] = await conn.query('SHOW TABLES;');
  console.log('Tables in "test":', tables);

  console.log('Creating roles table...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE
    );
  `);

  console.log('Creating users table...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      role_id INT,
      status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
      face_registered TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
    );
  `);

  console.log('Creating failed_login_attempts table...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS failed_login_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      ip_address VARCHAR(45),
      reason VARCHAR(255),
      attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Creating activity_logs table...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      action VARCHAR(100) NOT NULL,
      description TEXT,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Inserting default roles...');
  const roles = ['Admin', 'Student', 'Faculty', 'Parent', 'Principal', 'HOD', 'Accountant', 'Librarian', 'Placement Officer', 'Office Staff'];
  for (const r of roles) {
    await conn.query('INSERT IGNORE INTO roles (name) VALUES (?)', [r]);
  }

  console.log('Inserting default demo accounts...');
  const defaultUsers = [
    { username: 'admin', password: 'Admin@123', email: 'admin@collegeerp.com', role: 'Admin' },
    { username: 'student', password: 'Student@123', email: 'student@collegeerp.com', role: 'Student' },
    { username: 'faculty', password: 'Faculty@123', email: 'faculty@collegeerp.com', role: 'Faculty' },
    { username: 'parent', password: 'Parent@123', email: 'parent@collegeerp.com', role: 'Parent' },
    { username: 'principal', password: 'Principal@123', email: 'principal@collegeerp.com', role: 'Principal' },
    { username: 'hod', password: 'Hod@123', email: 'hod@collegeerp.com', role: 'HOD' }
  ];

  for (const u of defaultUsers) {
    const [roleRows] = await conn.query('SELECT id FROM roles WHERE name = ?', [u.role]);
    const roleId = roleRows[0]?.id;
    await conn.query(
      `INSERT INTO users (username, password, email, role_id, status) VALUES (?, ?, ?, ?, 'active')
       ON DUPLICATE KEY UPDATE password=VALUES(password), role_id=VALUES(role_id), status='active'`,
      [u.username, u.password, u.email, roleId]
    );
  }

  console.log('Verifying users:');
  const [users] = await conn.query('SELECT u.id, u.username, u.email, u.password, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id;');
  console.table(users);

  await conn.end();
  console.log('ALL TABLES AND USERS SEEDED IN TIDB CLOUD SUCCESSFULLY!');
}

testTiDB().catch(console.error);
