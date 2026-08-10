import mysql from 'mysql2/promise';

async function testTiDB() {
  console.log('Connecting with new TiDB password gaWJ6glCNKr7D9oW ...');
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '2ZhWtaNceZkmRfJ.root',
    password: 'gaWJ6glCNKr7D9oW',
    database: 'test',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });

  console.log('CONNECTED TO TIDB CLOUD SUCCESSFULLY!');

  // 1. Roles
  await conn.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE
    );
  `);

  // 2. Users
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

  // 3. Failed login attempts
  await conn.query(`
    CREATE TABLE IF NOT EXISTS failed_login_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      ip_address VARCHAR(45),
      reason VARCHAR(255),
      attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Activity logs
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

  // 5. Students
  await conn.query(`
    CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      roll_number VARCHAR(50) UNIQUE,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE,
      phone VARCHAR(20),
      department_id INT,
      semester INT DEFAULT 1,
      section VARCHAR(10) DEFAULT 'A',
      cgpa DECIMAL(3,2) DEFAULT 0.00,
      status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Faculty
  await conn.query(`
    CREATE TABLE IF NOT EXISTS faculty (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      employee_id VARCHAR(50) UNIQUE,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE,
      phone VARCHAR(20),
      department_id INT,
      designation VARCHAR(100) DEFAULT 'Assistant Professor',
      status ENUM('Active', 'On Leave', 'Inactive') DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. Departments
  await conn.query(`
    CREATE TABLE IF NOT EXISTS departments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(20) NOT NULL UNIQUE
    );
  `);

  console.log('Seeding default roles...');
  const roles = ['Admin', 'Student', 'Faculty', 'Parent', 'Principal', 'HOD', 'Accountant', 'Librarian', 'Placement Officer', 'Office Staff'];
  for (const r of roles) {
    await conn.query('INSERT IGNORE INTO roles (name) VALUES (?)', [r]);
  }

  console.log('Seeding default users...');
  const defaultUsers = [
    { username: 'admin', password: 'Admin@123', email: 'admin@collegeerp.com', role: 'Admin' },
    { username: 'student', password: 'Student@123', email: 'student@collegeerp.com', role: 'Student' },
    { username: 'faculty', password: 'Faculty@123', email: 'faculty@collegeerp.com', role: 'Faculty' },
    { username: 'parent', password: 'Parent@123', email: 'parent@collegeerp.com', role: 'Parent' },
    { username: 'principal', password: 'Principal@123', email: 'principal@collegeerp.com', role: 'Principal' },
    { username: 'hod', password: 'Hod@123', email: 'hod@collegeerp.com', role: 'HOD' },
    { username: 'accounts', password: 'Accounts@123', email: 'accounts@collegeerp.com', role: 'Accountant' },
    { username: 'librarian', password: 'Library@123', email: 'librarian@collegeerp.com', role: 'Librarian' },
    { username: 'placement', password: 'Placement@123', email: 'placement@collegeerp.com', role: 'Placement Officer' }
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

  console.log('Current users in TiDB:');
  const [users] = await conn.query('SELECT u.id, u.username, u.email, u.password, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id;');
  console.table(users);

  await conn.end();
  console.log('SUCCESS: All tables & users successfully initialized in TiDB Cloud!');
}

testTiDB().catch(console.error);
