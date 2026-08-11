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
        full_name VARCHAR(150) NULL,
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

    // Ensure full_name column exists for pre-existing tables
    try {
      const [uCols] = await pool.query('DESCRIBE users');
      const uColNames = uCols.map(c => c.Field);
      if (!uColNames.includes('full_name')) {
        await pool.query('ALTER TABLE users ADD COLUMN full_name VARCHAR(150) NULL AFTER username');
      }
    } catch (colErr) {
      console.warn('[DATABASE INIT] Note on users columns:', colErr.message);
    }

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

    // 8. Face Embeddings table (AES-256-GCM Secure Storage)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS face_embeddings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        encrypted_embedding MEDIUMBLOB NOT NULL,
        encryption_iv VARBINARY(16) NOT NULL,
        auth_tag VARBINARY(16) NULL,
        key_version VARCHAR(32) DEFAULT 'v1',
        model_version VARCHAR(64) DEFAULT 'sface_yunet_v1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      )
    `);

    // Ensure existing pre-migration tables are automatically upgraded
    try {
      const [faceCols] = await pool.query('DESCRIBE face_embeddings');
      const colNames = faceCols.map(c => c.Field);
      if (!colNames.includes('auth_tag')) {
        await pool.query('ALTER TABLE face_embeddings ADD COLUMN auth_tag VARBINARY(16) NULL AFTER encryption_iv');
      }
      if (!colNames.includes('key_version')) {
        await pool.query("ALTER TABLE face_embeddings ADD COLUMN key_version VARCHAR(32) DEFAULT 'v1' AFTER auth_tag");
      }
      if (!colNames.includes('model_version')) {
        await pool.query("ALTER TABLE face_embeddings ADD COLUMN model_version VARCHAR(64) DEFAULT 'sface_yunet_v1' AFTER key_version");
      }
    } catch (colErr) {
      console.warn('[DATABASE INIT] Note on face_embeddings columns:', colErr.message);
    }

    // 9. Face Auth Audit Log table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS face_auth_audit_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        matched TINYINT(1) NOT NULL,
        confidence DECIMAL(5,4) NULL,
        ip_address VARCHAR(45),
        liveness_passed TINYINT(1) NOT NULL,
        INDEX idx_face_audit_user (user_id)
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

    // --- PERMANENT ADMIN ACCOUNT CHECK ---
    const adminEmail = 'nuthanakalvadineshreddy@gmail.com';
    const [adminRoleRows] = await pool.query('SELECT id FROM roles WHERE name = ?', ['Admin']);
    const adminRoleId = adminRoleRows[0]?.id;

    if (adminRoleId) {
      const [existingAdmin] = await pool.query(
        'SELECT id FROM users WHERE LOWER(email) = ?',
        [adminEmail.toLowerCase()]
      );

      if (existingAdmin.length === 0) {
        const hashedPassword = await bcrypt.hash('Dinesh@123', 10);
        await pool.query(
          `INSERT INTO users (username, full_name, email, password, role_id, status)
           VALUES (?, ?, ?, ?, ?, 'active')`,
          ['dineshreddy', 'Dinesh Reddy', adminEmail, hashedPassword, adminRoleId]
        );
        console.log(`[DATABASE INIT] Permanent Admin account initialized: ${adminEmail}`);
      } else {
        await pool.query(
          `UPDATE users SET role_id = ?, full_name = COALESCE(NULLIF(full_name, ''), 'Dinesh Reddy'), status = 'active' WHERE id = ?`,
          [adminRoleId, existingAdmin[0].id]
        );
      }
    }

    console.log('[DATABASE INIT] Schema, roles, and permanent Admin verified successfully.');
    return { success: true, message: 'Database schema and permanent admin ready' };
  } catch (err) {
    console.error('[DATABASE INIT ERROR]:', err);
    return { success: false, error: err.message };
  }
}
