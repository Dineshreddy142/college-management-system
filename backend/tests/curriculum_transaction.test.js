import pool from '../db.js';
import { addSubjectToCurriculum, removeSubjectFromCurriculum } from '../controllers/curriculumController.js';

/**
 * Mock Response Factory for testing express controller endpoints directly.
 */
function createMockRes() {
  const res = {
    statusCode: 200,
    jsonPayload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    }
  };
  return res;
}

/**
 * Connection Spy & Fault Injector Helper
 */
async function withConnectionSpy(interceptor, testFn) {
  const origGetConnection = pool.getConnection.bind(pool);
  let activeSpyData = null;

  pool.getConnection = async function () {
    const conn = await origGetConnection();
    const calls = [];
    let beginTransactionCalled = false;
    let released = false;
    let rollbacked = false;
    let committed = false;

    const origQuery = conn.query.bind(conn);
    const origBegin = conn.beginTransaction.bind(conn);
    const origCommit = conn.commit.bind(conn);
    const origRollback = conn.rollback.bind(conn);
    const origRelease = conn.release.bind(conn);

    conn.beginTransaction = async function () {
      beginTransactionCalled = true;
      calls.push({ type: 'beginTransaction' });
      return origBegin();
    };

    conn.commit = async function () {
      committed = true;
      calls.push({ type: 'commit' });
      return origCommit();
    };

    conn.rollback = async function () {
      rollbacked = true;
      calls.push({ type: 'rollback' });
      if (interceptor?.failRollback) {
        throw new Error('SIMULATED_ROLLBACK_FAILURE');
      }
      return origRollback();
    };

    conn.release = function () {
      released = true;
      calls.push({ type: 'release' });
      return origRelease();
    };

    conn.query = async function (sql, params) {
      const sqlStr = typeof sql === 'string' ? sql : sql.sql;
      calls.push({ type: 'query', sql: sqlStr, beginTransactionCalled });

      if (interceptor?.shouldFailQuery && interceptor.shouldFailQuery(sqlStr)) {
        throw new Error(interceptor.failMessage || 'SIMULATED_QUERY_FAILURE');
      }

      return origQuery(sql, params);
    };

    activeSpyData = {
      calls,
      get beginTransactionCalled() { return beginTransactionCalled; },
      get released() { return released; },
      get rollbacked() { return rollbacked; },
      get committed() { return committed; }
    };

    return conn;
  };

  try {
    const res = await testFn(() => activeSpyData);
    return res;
  } finally {
    pool.getConnection = origGetConnection;
  }
}

/**
 * Curriculum Subject Controller Transaction Atomicity & Failure Test Suite
 */
async function runTransactionTests() {
  console.log('========================================================================');
  console.log('   CURRICULUM SUBJECT TRANSACTION ATOMICITY & CONTROLLER TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Connection Pool & Rollback Mechanics Baseline
  console.log('[1/10] Testing Low-Level Connection Acquisition & Rollback Mechanics...');
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const [res] = await conn.execute('SELECT 1 as val');
    if (res[0].val === 1) {
      console.log('  ✔ Connection acquired and transaction started successfully');
    }
    await conn.rollback();
    console.log('  ✔ Explicit transaction rollback executed without error');
    passed++;
  } catch (e) {
    if (conn) await conn.rollback();
    console.error(`  ✖ Low-level transaction test failed: ${e.message}`);
    failed++;
  } finally {
    if (conn) conn.release();
  }

  // 2. Validation & Response Behavior: Missing Subject ID
  console.log('\n[2/10] Testing Controller Validation: Missing Subject ID...');
  try {
    const req = { params: { id: 99999 }, body: {} };
    const res = createMockRes();
    await addSubjectToCurriculum(req, res);

    if (res.statusCode === 400 && res.jsonPayload.success === false) {
      console.log('  ✔ Validated: missing subject_id returns HTTP 400 Bad Request');
      passed++;
    } else {
      console.error(`  ✖ Validation failed: unexpected status ${res.statusCode}`);
      failed++;
    }
  } catch (e) {
    console.error(`  ✖ Validation test error: ${e.message}`);
    failed++;
  }

  // 3. Validation & Response Behavior: Non-Existent Curriculum (404)
  console.log('\n[3/10] Testing Controller Validation & Rollback: Non-Existent Curriculum...');
  try {
    await withConnectionSpy(null, async (getSpy) => {
      const req = { params: { id: 999999 }, body: { subject_id: 1 } };
      const res = createMockRes();
      await addSubjectToCurriculum(req, res);

      const spy = getSpy();
      if (res.statusCode === 404 && spy.rollbacked && spy.released) {
        console.log('  ✔ Verified: non-existent curriculum rolls back transaction, releases connection, returns 404');
        passed++;
      } else {
        console.error(`  ✖ 404 validation failed: code=${res.statusCode}, rollbacked=${spy?.rollbacked}, released=${spy?.released}`);
        failed++;
      }
    });
  } catch (e) {
    console.error(`  ✖ 404 validation test error: ${e.message}`);
    failed++;
  }

  // Setup Test Curriculum & Subject Fixtures for DB controller testing
  console.log('\n[Setup] Provisioning isolated test curriculum & subject fixtures...');
  let testCurrId = null;
  let testSubjId = null;

  try {
    const [dept] = await pool.query('SELECT id FROM departments LIMIT 1');
    const [course] = await pool.query('SELECT id FROM courses LIMIT 1');
    const [reg] = await pool.query('SELECT id FROM regulations LIMIT 1');
    const [sem] = await pool.query('SELECT id FROM semesters LIMIT 1');
    const [subj] = await pool.query('SELECT id FROM subjects LIMIT 1');

    testSubjId = subj[0].id;

    const [insertCurr] = await pool.query(`
      INSERT INTO curriculums (department_id, course_id, regulation_id, semester_id, total_credits, total_subjects, status)
      VALUES (?, ?, ?, ?, 0, 0, 'Active')
    `, [dept[0].id, course[0].id, reg[0].id, sem[0].id]);

    testCurrId = insertCurr.insertId;
    console.log(`  ✔ Fixture created: Curriculum ID=${testCurrId}, Subject ID=${testSubjId}`);
  } catch (e) {
    console.error(`  ✖ Failed to provision test fixtures: ${e.message}`);
    process.exit(1);
  }

  try {
    // 4. Lock Acquisition Ordering Verification (SELECT ... FOR UPDATE after beginTransaction)
    console.log('\n[4/10] Testing Lock Acquisition Ordering (beginTransaction BEFORE SELECT FOR UPDATE)...');
    await withConnectionSpy(null, async (getSpy) => {
      const req = { params: { id: testCurrId }, body: { subject_id: testSubjId, credits: 3.0 } };
      const res = createMockRes();
      await addSubjectToCurriculum(req, res);

      const spy = getSpy();
      const lockCall = spy.calls.find(c => c.type === 'query' && c.sql.includes('FOR UPDATE'));
      if (lockCall && lockCall.beginTransactionCalled) {
        console.log('  ✔ Lock acquisition ordering verified: SELECT ... FOR UPDATE executed INSIDE active transaction');
        passed++;
      } else {
        console.error('  ✖ Lock acquisition ordering failed: SELECT FOR UPDATE occurred before beginTransaction!');
        failed++;
      }
    });

    // Cleanup added mapping from step 4 for clean state
    await pool.query('DELETE FROM curriculum_subjects WHERE curriculum_id = ?', [testCurrId]);
    await pool.query('UPDATE curriculums SET total_subjects = 0, total_credits = 0 WHERE id = ?', [testCurrId]);

    // 5. Successful Operations Commit (addSubjectToCurriculum)
    console.log('\n[5/10] Testing Successful Mapping Commit (addSubjectToCurriculum)...');
    await withConnectionSpy(null, async (getSpy) => {
      const req = { params: { id: testCurrId }, body: { subject_id: testSubjId, credits: 4.0 } };
      const res = createMockRes();
      await addSubjectToCurriculum(req, res);

      const spy = getSpy();
      const [currHeader] = await pool.query('SELECT total_subjects, total_credits FROM curriculums WHERE id = ?', [testCurrId]);
      const [mappings] = await pool.query('SELECT * FROM curriculum_subjects WHERE curriculum_id = ? AND subject_id = ?', [testCurrId, testSubjId]);

      if (res.statusCode === 200 && spy.committed && spy.released && mappings.length === 1 && currHeader[0].total_subjects === 1 && parseFloat(currHeader[0].total_credits) === 4.0) {
        console.log('  ✔ Mapping commit verified: subject mapped, totals updated (subjects=1, credits=4.0), transaction committed, connection released');
        passed++;
      } else {
        console.error(`  ✖ Mapping commit failed: statusCode=${res.statusCode}, committed=${spy?.committed}, mappings=${mappings.length}`);
        failed++;
      }
    });

    // 6. Successful Operations Commit (removeSubjectFromCurriculum)
    console.log('\n[6/10] Testing Successful Unmap Commit (removeSubjectFromCurriculum)...');
    await withConnectionSpy(null, async (getSpy) => {
      const req = { params: { id: testCurrId, subjectId: testSubjId } };
      const res = createMockRes();
      await removeSubjectFromCurriculum(req, res);

      const spy = getSpy();
      const [currHeader] = await pool.query('SELECT total_subjects, total_credits FROM curriculums WHERE id = ?', [testCurrId]);
      const [mappings] = await pool.query('SELECT * FROM curriculum_subjects WHERE curriculum_id = ? AND subject_id = ?', [testCurrId, testSubjId]);

      if (res.statusCode === 200 && spy.committed && spy.released && mappings.length === 0 && currHeader[0].total_subjects === 0 && parseFloat(currHeader[0].total_credits) === 0) {
        console.log('  ✔ Unmap commit verified: mapping removed, totals updated (subjects=0, credits=0), transaction committed, connection released');
        passed++;
      } else {
        console.error(`  ✖ Unmap commit failed: statusCode=${res.statusCode}, committed=${spy?.committed}`);
        failed++;
      }
    });

    // 7. Mapping Insert Failure -> Rollback Data Integrity Verification
    console.log('\n[7/10] Testing Mapping Insert Followed By Aggregate Recalculation Failure (Rollback Integrity)...');
    await withConnectionSpy({
      shouldFailQuery: (sql) => sql.includes('SELECT COUNT(*) as count, COALESCE(SUM(credits)'),
      failMessage: 'SIMULATED_AGGREGATE_RECALC_FAILURE'
    }, async (getSpy) => {
      const req = { params: { id: testCurrId }, body: { subject_id: testSubjId, credits: 3.0 } };
      const res = createMockRes();
      await addSubjectToCurriculum(req, res);

      const spy = getSpy();
      const [mappings] = await pool.query('SELECT * FROM curriculum_subjects WHERE curriculum_id = ? AND subject_id = ?', [testCurrId, testSubjId]);
      const [currHeader] = await pool.query('SELECT total_subjects, total_credits FROM curriculums WHERE id = ?', [testCurrId]);

      if (res.statusCode === 500 && spy.rollbacked && spy.released && mappings.length === 0 && currHeader[0].total_subjects === 0) {
        console.log('  ✔ Rollback integrity verified: aggregate failure triggered rollback, connection released, 0 partial mapping records remain in DB');
        passed++;
      } else {
        console.error(`  ✖ Insert failure rollback test failed: statusCode=${res.statusCode}, rollbacked=${spy?.rollbacked}, mappingCount=${mappings.length}`);
        failed++;
      }
    });

    // Provision mapping for deletion rollback test
    await pool.query(`
      INSERT INTO curriculum_subjects (curriculum_id, subject_id, is_compulsory, is_elective, is_lab, credits, status)
      VALUES (?, ?, 1, 0, 0, 3.0, 'Active')
    `, [testCurrId, testSubjId]);
    await pool.query('UPDATE curriculums SET total_subjects = 1, total_credits = 3.0 WHERE id = ?', [testCurrId]);

    // 8. Mapping Deletion Failure -> Rollback Data Integrity Verification
    console.log('\n[8/10] Testing Mapping Deletion Followed By Aggregate Recalculation Failure (Rollback Integrity)...');
    await withConnectionSpy({
      shouldFailQuery: (sql) => sql.includes('UPDATE curriculums SET total_subjects = ?'),
      failMessage: 'SIMULATED_DELETE_UPDATE_FAILURE'
    }, async (getSpy) => {
      const req = { params: { id: testCurrId, subjectId: testSubjId } };
      const res = createMockRes();
      await removeSubjectFromCurriculum(req, res);

      const spy = getSpy();
      const [mappings] = await pool.query('SELECT * FROM curriculum_subjects WHERE curriculum_id = ? AND subject_id = ?', [testCurrId, testSubjId]);
      const [currHeader] = await pool.query('SELECT total_subjects, total_credits FROM curriculums WHERE id = ?', [testCurrId]);

      if (res.statusCode === 500 && spy.rollbacked && spy.released && mappings.length === 1 && currHeader[0].total_subjects === 1) {
        console.log('  ✔ Deletion rollback integrity verified: update failure triggered rollback, mapping row restored, connection released');
        passed++;
      } else {
        console.error(`  ✖ Deletion rollback test failed: statusCode=${res.statusCode}, rollbacked=${spy?.rollbacked}, mappingCount=${mappings.length}`);
        failed++;
      }
    });

    // 9. Original Database Error Preservation When Rollback Also Fails
    console.log('\n[9/10] Testing Original Error Preservation When Rollback Fails...');
    await withConnectionSpy({
      shouldFailQuery: (sql) => sql.includes('INSERT INTO curriculum_subjects'),
      failMessage: 'PRIMARY_DATABASE_DISK_ERROR',
      failRollback: true
    }, async (getSpy) => {
      const req = { params: { id: testCurrId }, body: { subject_id: testSubjId, credits: 3.0 } };
      const res = createMockRes();
      await addSubjectToCurriculum(req, res);

      const spy = getSpy();
      if (res.statusCode === 500 && res.jsonPayload.error === 'PRIMARY_DATABASE_DISK_ERROR' && spy.released) {
        console.log('  ✔ Original error preserved: returned primary DB error even when rollback threw exception, connection released in finally');
        passed++;
      } else {
        console.error(`  ✖ Error preservation test failed: error=${res.jsonPayload?.error}, released=${spy?.released}`);
        failed++;
      }
    });

    // 10. Connection Release Safety Guarantee
    console.log('\n[10/10] Testing Connection Release Safety Guarantee...');
    await withConnectionSpy({
      shouldFailQuery: (sql) => sql.includes('FOR UPDATE'),
      failMessage: 'LOCK_TIMEOUT_ERROR'
    }, async (getSpy) => {
      const req = { params: { id: testCurrId }, body: { subject_id: testSubjId } };
      const res = createMockRes();
      await addSubjectToCurriculum(req, res);

      const spy = getSpy();
      if (spy.released) {
        console.log('  ✔ Connection release safety verified: connection released immediately on query exception');
        passed++;
      } else {
        console.error('  ✖ Connection release safety failed: connection leaked after exception!');
        failed++;
      }
    });

  } finally {
    // Teardown Test Fixtures
    if (testCurrId) {
      await pool.query('DELETE FROM curriculum_subjects WHERE curriculum_id = ?', [testCurrId]);
      await pool.query('DELETE FROM curriculums WHERE id = ?', [testCurrId]);
      console.log('\n[Teardown] Test curriculum fixtures cleaned up.');
    }
  }

  console.log('\n========================================================================');
  console.log(`   SUMMARY: ${passed} PASSED, ${failed} FAILED OUT OF 10 TESTS`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTransactionTests().catch(err => {
  console.error('Fatal Transaction Test Suite Error:', err);
  process.exit(1);
});
