import bcrypt from 'bcryptjs';
import pool from './db.js';

export async function initializeDatabase() {
  console.log('[DATABASE INIT] Checking and initializing database schema & default seed users...');
  
  try {
    // 1. Roles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 2. Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        role_id INT,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        face_registered TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
      )
    `);

    // 3. Activity logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        action VARCHAR(100) NOT NULL,
        description TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Failed login attempts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS failed_login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        ip_address VARCHAR(45),
        reason VARCHAR(255),
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_failed_user (user_id),
        INDEX idx_failed_ip (ip_address)
      )
    `);

    // 5. Students table
    await pool.query(`
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
      )
    `);

    // 6. Faculty table
    await pool.query(`
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
      )
    `);

    // 7. Departments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) NOT NULL UNIQUE
      )
    `);

    // --- SEED ESSENTIAL ROLES ---
    const roles = [
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

    for (const r of roles) {
      await pool.query('INSERT IGNORE INTO roles (name) VALUES (?)', [r]);
    }

    // --- SEED ESSENTIAL USERS ---
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
      const [roleRows] = await pool.query('SELECT id FROM roles WHERE name = ?', [u.role]);
      const roleId = roleRows.length > 0 ? roleRows[0].id : null;
      const hashedPassword = await bcrypt.hash(u.password, 10);

      const [existingUser] = await pool.query(
        'SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?',
        [u.email.toLowerCase(), u.username.toLowerCase()]
      );

      if (existingUser.length === 0) {
        await pool.query(
          'INSERT INTO users (username, password, email, role_id, status) VALUES (?, ?, ?, ?, ?)',
          [u.username, hashedPassword, u.email, roleId, 'active']
        );
        console.log(`[DATABASE INIT] Created default seed user: ${u.email} (${u.role})`);
      } else {
        // Ensure password matches latest hash format
        await pool.query(
          'UPDATE users SET password = ?, role_id = ?, status = ? WHERE id = ?',
          [hashedPassword, roleId, 'active', existingUser[0].id]
        );
      }
    }

    console.log('[DATABASE INIT] Database initialization and seed completed successfully!');
    return { success: true, message: 'Database initialized successfully' };
  } catch (err) {
    console.error('[DATABASE INIT ERROR]:', err);
    return { success: false, error: err.message };
  }
}
