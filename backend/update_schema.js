import mysql from 'mysql2/promise';

async function updateSchema() {
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '2ZhWtaNceZkmRfJ.root',
    password: 'Jlriyn1naUq72MxB',
    database: 'test',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });

  console.log('Inspecting users table columns...');
  const [cols] = await conn.query('DESCRIBE users;');
  console.log('Columns in users:', cols.map(c => c.Field));

  // Add face_registered if missing
  const hasFaceReg = cols.some(c => c.Field === 'face_registered');
  if (!hasFaceReg) {
    console.log('Adding face_registered column to users...');
    await conn.query('ALTER TABLE users ADD COLUMN face_registered TINYINT(1) DEFAULT 0 AFTER status;');
  }

  // Add face_id if missing
  const hasFaceId = cols.some(c => c.Field === 'face_id');
  if (!hasFaceId) {
    console.log('Adding face_id column to users...');
    await conn.query('ALTER TABLE users ADD COLUMN face_id VARCHAR(255) NULL AFTER face_registered;');
  }

  // Add full_name if missing
  const hasFullName = cols.some(c => c.Field === 'full_name');
  if (!hasFullName) {
    console.log('Adding full_name column to users...');
    await conn.query('ALTER TABLE users ADD COLUMN full_name VARCHAR(150) NULL AFTER username;');
  }

  // Add must_change_password if missing
  const hasMustChangePass = cols.some(c => c.Field === 'must_change_password');
  if (!hasMustChangePass) {
    console.log('Adding must_change_password column to users...');
    await conn.query('ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) DEFAULT 1 AFTER status;');
  }

  console.log('Updated columns:');
  const [updatedCols] = await conn.query('DESCRIBE users;');
  console.table(updatedCols);

  await conn.end();
  console.log('SCHEMA UPDATED SUCCESSFULLY IN TIDB CLOUD!');
}

updateSchema().catch(console.error);
