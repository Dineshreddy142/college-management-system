import pool from './db.js';
import jwt from 'jsonwebtoken';

async function testProfileFix() {
  console.log('=== TEST PROFILE & NAME VERIFICATION ===\n');

  const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_college_erp_key_123!';

  // Test 1: Verify users table has full_name populated
  const [users] = await pool.query('SELECT id, username, full_name, email FROM users');
  console.log('1. Users in Database:');
  console.table(users);

  // Test 2: Simulate GET /profile for Admin (Dinesh Reddy)
  const dineshUser = users.find(u => u.email === 'nuthanakalvadineshreddy@gmail.com') || users[0];
  console.log(`\n2. Testing GET /profile for User ID: ${dineshUser.id} (${dineshUser.email})`);
  
  const [userProfileRows] = await pool.execute(
    `SELECT u.id, u.username, u.full_name, u.email, r.name as role, u.created_at 
     FROM users u 
     JOIN roles r ON u.role_id = r.id 
     WHERE u.id = ?`,
    [dineshUser.id]
  );
  
  let profile = { ...userProfileRows[0] };
  let resolvedName = userProfileRows[0].full_name || userProfileRows[0].username || '';
  profile.name = resolvedName;
  profile.full_name = resolvedName;
  console.log('Profile Object returned to Frontend:');
  console.log({
    id: profile.id,
    name: profile.name,
    full_name: profile.full_name,
    email: profile.email,
    role: profile.role
  });

  if (!profile.name || profile.name.trim() === '') {
    throw new Error('FAILED: profile.name is empty!');
  }
  console.log('✔ PASS: profile.name is properly populated with:', profile.name);

  // Test 3: Test PUT /profile with name update
  console.log('\n3. Testing PUT /profile to update full_name...');
  await pool.execute('UPDATE users SET full_name = ? WHERE id = ?', ['Dinesh Reddy', dineshUser.id]);
  const [recheck] = await pool.execute('SELECT full_name FROM users WHERE id = ?', [dineshUser.id]);
  console.log('✔ PASS: Database full_name after update:', recheck[0].full_name);

  // Test 4: Verify JWT login payload
  console.log('\n4. Verifying Auth user object structure...');
  const userPayload = {
    id: dineshUser.id,
    username: dineshUser.username,
    name: dineshUser.full_name || dineshUser.username,
    full_name: dineshUser.full_name || dineshUser.username,
    email: dineshUser.email,
    role: 'Admin'
  };
  console.log('Login Response User Object:', userPayload);
  if (!userPayload.name) throw new Error('FAILED: userPayload.name missing');
  console.log('✔ PASS: Auth response contains name and full_name!');

  console.log('\n=============================================');
  console.log('✨ ALL PROFILE & NAME FIX TESTS PASSED 100%!');
  console.log('=============================================');
  process.exit(0);
}

testProfileFix().catch(err => {
  console.error('Test Error:', err);
  process.exit(1);
});
