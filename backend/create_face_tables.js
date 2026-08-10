import mysql from 'mysql2/promise';

async function createFaceTables() {
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '2ZhWtaNceZkmRfJ.root',
    password: 'Jlriyn1naUq72MxB',
    database: 'test',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });

  console.log('Creating face_embeddings table in TiDB...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS face_embeddings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      encrypted_embedding MEDIUMBLOB NOT NULL,
      encryption_iv VARBINARY(16) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id)
    );
  `);

  console.log('Creating face_auth_audit_log table in TiDB...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS face_auth_audit_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      matched TINYINT(1) NOT NULL,
      confidence DECIMAL(5,4) NULL,
      ip_address VARCHAR(45),
      liveness_passed TINYINT(1) NOT NULL,
      INDEX idx_face_audit_user (user_id)
    );
  `);

  console.log('Verifying tables in TiDB:');
  const [tables] = await conn.query('SHOW TABLES;');
  console.log('Tables:', tables);

  await conn.end();
  console.log('FACE BIOMETRIC TABLES CREATED SUCCESSFULLY IN TIDB CLOUD!');
}

createFaceTables().catch(console.error);
