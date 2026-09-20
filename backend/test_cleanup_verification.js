import pool from './db.js';
import bcrypt from 'bcryptjs';
import { initializeDatabase } from './init_db.js';

async function testVerification() {
  console.log('====================================================');
  console.log(' RUNNING NON-ADMIN CLEANUP & ADMIN VERIFICATION TEST');
  console.log('====================================================\n');

  // STEP 1: Verify Admin accounts in DB
  const [adminUsers] = await pool.query(`
    SELECT u.id, u.username, u.email, u.password, r.name as role 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE LOWER(r.name) = 'admin'
  `);
  console.log(`1. Admin Users in Database: ${adminUsers.length}`);
  console.table(adminUsers.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role })));

  // STEP 2: Verify zero Non-Admin users in DB
  const [nonAdminUsers] = await pool.query(`
    SELECT u.id, u.username, u.email, r.name as role 
    FROM users u 
    LEFT JOIN roles r ON u.role_id = r.id 
    WHERE LOWER(r.name) != 'admin' OR r.id IS NULL
  `);
  console.log(`\n2. Non-Admin Users in Database: ${nonAdminUsers.length}`);
  if (nonAdminUsers.length === 0) {
    console.log('✔ SUCCESS: 0 Non-Admin accounts exist in database.');
  } else {
    console.error('✖ FAIL: Non-admin accounts still present:', nonAdminUsers);
  }

  // STEP 3: Test Admin Password Hashes
  console.log('\n3. Testing Admin Credentials Authentication:');
  for (const admin of adminUsers) {
    const testPassword = admin.username === 'admin' ? 'Admin@123' : 'Dinesh@123';
    const isValid = await bcrypt.compare(testPassword, admin.password);
    console.log(`   - User '${admin.username}' (${admin.email}): Password match '${testPassword}' => ${isValid ? '✔ VALID' : '✖ INVALID'}`);
  }

  // STEP 4: Test Non-Admin Demo Login Rejection
  console.log('\n4. Testing Old Demo Accounts Authentication (Should All Fail):');
  const demoAccountsToTest = [
    'student@collegeerp.com',
    'faculty@collegeerp.com',
    'parent@collegeerp.com',
    'hod@collegeerp.com',
    'principal@collegeerp.com',
    'accounts@collegeerp.com',
    'librarian@collegeerp.com',
    'placement@collegeerp.com'
  ];

  for (const demoEmail of demoAccountsToTest) {
    const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [demoEmail.toLowerCase()]);
    if (rows.length === 0) {
      console.log(`   - Account '${demoEmail}': ✔ REJECTED (Account deleted from database)`);
    } else {
      console.error(`   - Account '${demoEmail}': ✖ FAIL (Account still exists in database)`);
    }
  }

  // STEP 5: Test Database Initialization Re-Run (Backend Restart Simulation)
  console.log('\n5. Simulating Backend Restart / DB Initialization...');
  const initResult = await initializeDatabase();
  console.log(`   - initializeDatabase result: ${JSON.stringify(initResult)}`);

  const [postInitUsers] = await pool.query(`
    SELECT u.id, u.username, u.email, r.name as role 
    FROM users u 
    LEFT JOIN roles r ON u.role_id = r.id 
    WHERE LOWER(r.name) != 'admin' OR r.id IS NULL
  `);
  console.log(`   - Post-restart Non-Admin User Count: ${postInitUsers.length}`);
  if (postInitUsers.length === 0) {
    console.log('✔ SUCCESS: Backend restart did NOT recreate any deleted non-admin demo accounts!');
  } else {
    console.error('✖ FAIL: Deleted accounts were recreated on backend restart!');
  }

  process.exit(0);
}

testVerification().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
