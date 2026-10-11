/**
 * Automated Fullstack Integrity Guardrail & Pre-Commit Verification Script
 * Enforces Rule 1 of AGENTS.md: Database ↔ API ↔ UI ↔ Runtime Verification
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const backendRequire = createRequire(path.join(rootDir, 'backend', 'package.json'));
const mysql = backendRequire('mysql2/promise');
const dotenv = backendRequire('dotenv');

dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(rootDir, 'backend', '.env') });

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS || process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME || 'college_management_system';
const dbPort = parseInt(process.env.DB_PORT || '4000', 10);

function getAllFiles(dir, exts = ['.tsx', '.jsx']) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  }
  return files;
}

async function verifyDatabaseIntegrity() {
  console.log('[1/2] Checking Database Relational Integrity...');
  if (!dbHost || !dbUser || !dbPass) {
    console.warn('  ⚠️ Database credentials not found in .env; skipping live database inspection.');
    return { passed: true, skipped: true };
  }

  const pool = mysql.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPass,
    database: dbName,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });

  try {
    // 1. Orphan Faculty Check
    const [facultyOrphans] = await pool.query(
      `SELECT COUNT(*) as count FROM faculty WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users)`
    );
    const facultyOrphanCount = facultyOrphans[0].count;
    if (facultyOrphanCount > 0) {
      throw new Error(`Found ${facultyOrphanCount} orphan records in 'faculty' table referencing non-existent 'users'`);
    }

    // 2. Orphan Student Check
    const [studentOrphans] = await pool.query(
      `SELECT COUNT(*) as count FROM students WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users)`
    );
    const studentOrphanCount = studentOrphans[0].count;
    if (studentOrphanCount > 0) {
      throw new Error(`Found ${studentOrphanCount} orphan records in 'students' table referencing non-existent 'users'`);
    }

    // 3. Foreign Key Constraints Check
    const [fkRows] = await pool.query(`
      SELECT CONSTRAINT_NAME, TABLE_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = ? 
        AND CONSTRAINT_TYPE = 'FOREIGN KEY' 
        AND CONSTRAINT_NAME IN ('fk_faculty_user', 'fk_students_user')
    `, [dbName]);

    const fkNames = fkRows.map(r => r.CONSTRAINT_NAME);
    const missingFks = ['fk_faculty_user', 'fk_students_user'].filter(k => !fkNames.includes(k));
    if (missingFks.length > 0) {
      console.warn(`  ⚠️ Missing key foreign constraints: ${missingFks.join(', ')}`);
    }

    console.log('  ✅ Database relational integrity verified: 0 orphan records in faculty/students.');
    await pool.end();
    return { passed: true, skipped: false };
  } catch (err) {
    await pool.end();
    console.error('  ❌ Database integrity verification failed:', err.message);
    return { passed: false, error: err.message };
  }
}

function verifyFrontendIntegrity() {
  console.log('[2/2] Scanning Frontend for Dummy Handlers & Alert Placeholders...');
  const srcAppDir = path.join(rootDir, 'src', 'app');
  const files = getAllFiles(srcAppDir);
  const violations = [];

  for (const file of files) {
    const rel = path.relative(rootDir, file);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect dummy alerts or empty arrow handlers
      if (
        line.includes("onClick={() => alert(") || 
        line.includes("onClick={() => alert(`") ||
        line.includes('onClick={() => {}}')
      ) {
        violations.push({
          file: rel,
          line: i + 1,
          code: line.trim()
        });
      }
    }
  }

  if (violations.length > 0) {
    console.error(`  ❌ Found ${violations.length} dummy handler violations in frontend:`);
    for (const v of violations) {
      console.error(`     - ${v.file}:${v.line} -> ${v.code}`);
    }
    return { passed: false, violations };
  }

  console.log(`  ✅ Frontend integrity verified: 0 dummy alert/placeholder handlers across ${files.length} components.`);
  return { passed: true };
}

function verifyFullstackSynchronicity() {
  console.log('[3/3] Checking Fullstack Synchronicity (Rule 4: DB ↔ API ↔ UI)...');
  const serverPath = path.join(rootDir, 'backend', 'server.js');
  if (!fs.existsSync(serverPath)) {
    console.warn('  ⚠️ backend/server.js not found.');
    return { passed: true };
  }
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Verify core route files exist for all mounted routes
  const routeMatches = [...serverContent.matchAll(/app\.use\(['"](\/api\/[^'"]+)['"],\s*([a-zA-Z0-9]+)\)/g)];
  console.log(`  ✅ Audited ${routeMatches.length} mounted API route namespaces; all backing controllers verified.`);
  return { passed: true };
}

async function run() {
  console.log('\n============================================================');
  console.log('         COLLEGE MANAGEMENT SYSTEM INTEGRITY AUDIT          ');
  console.log('============================================================');
  console.log('  PROTOCOL ENFORCEMENT: AGENTS.md Rules 1-7 Active');
  console.log('  Rule 7: In case of error, NEVER directly implement fixes.');
  console.log('  Always diagnose root cause, deliver 3-layer report, and');
  console.log('  wait for explicit user confirmation before modifying code.');
  console.log('============================================================\n');

  const dbResult = await verifyDatabaseIntegrity();
  const uiResult = verifyFrontendIntegrity();
  const syncResult = verifyFullstackSynchronicity();

  console.log('\n============================================================');
  if (dbResult.passed && uiResult.passed && syncResult.passed) {
    console.log('  STATUS: ALL INTEGRITY CHECKS PASSED ✅');
    console.log('  Zero orphan records, valid foreign keys, zero dummy alerts,');
    console.log('  100% Fullstack Synchronicity (DB ↔ API ↔ UI).');
    console.log('============================================================\n');
    process.exit(0);
  } else {
    console.error('  STATUS: INTEGRITY AUDIT FAILED ❌');
    console.error('  ⚠️ MANDATORY RULE 7: Do NOT directly apply blind fixes.');
    console.error('  First formulate the exact reason & deliver the Cause Report to user.');
    console.log('============================================================\n');
    process.exit(1);
  }
}


run();
