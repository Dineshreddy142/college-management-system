import pool from '../db.js';
import { createRegulation, updateRegulation } from '../controllers/curriculumController.js';

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
 * CBCS Enhancement Verification Test Suite
 * Validates Regulation policy controls and CBCS automated elective allocation contract.
 */
async function runCBCSEnhancementTests() {
  console.log('========================================================================');
  console.log('   CBCS ENHANCEMENT & REGULATION POLICY CONTROLS TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Verify Regulation Table Columns
  console.log('[1/7] Verifying Regulation Policy Schema Columns...');
  try {
    const [cols] = await pool.execute('DESCRIBE regulations');
    const fieldNames = cols.map(c => c.Field);

    if (fieldNames.includes('improvement_policy') && fieldNames.includes('cgpa_calculation_rule')) {
      console.log('  ✔ Column check OK: improvement_policy and cgpa_calculation_rule present in DB schema');
      passed++;
    } else {
      console.error('  ✖ Column check FAILED: Missing policy columns on regulations table');
      failed++;
    }
  } catch (e) {
    console.error(`  ✖ DB Column query failed: ${e.message}`);
    failed++;
  }

  // 2. Validate Regulation Policy Enum Defaults
  console.log('\n[2/7] Testing Regulation Default Policies...');
  try {
    const [rows] = await pool.execute('SELECT name, improvement_policy, cgpa_calculation_rule FROM regulations LIMIT 5');
    if (rows.length > 0) {
      const first = rows[0];
      const validPolicy = ['BEST_GRADE', 'LATEST_GRADE'].includes(first.improvement_policy || 'BEST_GRADE');
      const validRule = ['BEST_ATTEMPT_ONLY', 'ALL_ATTEMPTS'].includes(first.cgpa_calculation_rule || 'BEST_ATTEMPT_ONLY');

      if (validPolicy && validRule) {
        console.log(`  ✔ Regulation '${first.name}' policies valid: Improvement = ${first.improvement_policy || 'BEST_GRADE'}, CGPA Rule = ${first.cgpa_calculation_rule || 'BEST_ATTEMPT_ONLY'}`);
        passed++;
      } else {
        console.error('  ✖ Invalid policy values found on regulation record');
        failed++;
      }
    } else {
      console.log('  ✔ Table empty, schema structure verified');
      passed++;
    }
  } catch (e) {
    console.error(`  ✖ Regulation policy check error: ${e.message}`);
    failed++;
  }

  // 3. Verify CBCS Registration Windows Table Contract
  console.log('\n[3/7] Verifying CBCS Registration Windows Table Contract...');
  try {
    const [rows] = await pool.execute('SELECT id, title, status FROM cbcs_registration_windows LIMIT 1');
    console.log(`  ✔ CBCS Windows Table Accessible. Records found: ${rows.length}`);
    passed++;
  } catch (e) {
    console.error(`  ✖ CBCS Windows Table query error: ${e.message}`);
    failed++;
  }

  // 4. Verify CBCS Preferences & Allocation Logs Schema
  console.log('\n[4/7] Verifying CBCS Preferences & Seat Allocation Tables...');
  try {
    const [prefs] = await pool.execute('SELECT COUNT(*) as count FROM student_cbcs_preferences');
    console.log(`  ✔ CBCS Student Preferences Table Verified. Count: ${prefs[0].count}`);
    passed++;
  } catch (e) {
    console.error(`  ✖ CBCS Preferences check error: ${e.message}`);
    failed++;
  }

  // 5-7. Controller Level Focused Regulation Policy CRUD Tests
  let testRegId = null;
  try {
    console.log('\n[5/7] Testing createRegulation policy field persistence...');
    const reqCreate = {
      body: {
        name: 'TEST_REG_POLICY_88',
        effective_year: 2026,
        description: 'Focused test regulation',
        status: 'Active',
        improvement_policy: 'LATEST_GRADE',
        cgpa_calculation_rule: 'ALL_ATTEMPTS'
      }
    };
    const resCreate = createMockRes();
    await createRegulation(reqCreate, resCreate);

    testRegId = resCreate.jsonPayload?.data?.id;
    const [dbRow1] = await pool.query('SELECT improvement_policy, cgpa_calculation_rule FROM regulations WHERE id = ?', [testRegId]);

    if (
      resCreate.statusCode === 201 &&
      resCreate.jsonPayload.success &&
      dbRow1[0].improvement_policy === 'LATEST_GRADE' &&
      dbRow1[0].cgpa_calculation_rule === 'ALL_ATTEMPTS'
    ) {
      console.log('  ✔ createRegulation verified: saved improvement_policy=LATEST_GRADE and cgpa_calculation_rule=ALL_ATTEMPTS');
      passed++;
    } else {
      console.error('  ✖ createRegulation test failed:', dbRow1);
      failed++;
    }

    console.log('\n[6/7] Testing updateRegulation updating improvement_policy alone...');
    const reqUpdate1 = {
      params: { id: testRegId },
      body: { improvement_policy: 'BEST_GRADE' }
    };
    const resUpdate1 = createMockRes();
    await updateRegulation(reqUpdate1, resUpdate1);

    const [dbRow2] = await pool.query('SELECT improvement_policy, cgpa_calculation_rule FROM regulations WHERE id = ?', [testRegId]);

    if (
      resUpdate1.statusCode === 200 &&
      dbRow2[0].improvement_policy === 'BEST_GRADE' &&
      dbRow2[0].cgpa_calculation_rule === 'ALL_ATTEMPTS'
    ) {
      console.log('  ✔ updateRegulation verified: improvement_policy updated to BEST_GRADE, cgpa_calculation_rule preserved as ALL_ATTEMPTS');
      passed++;
    } else {
      console.error('  ✖ updateRegulation (improvement_policy) failed:', dbRow2);
      failed++;
    }

    console.log('\n[7/7] Testing updateRegulation updating cgpa_calculation_rule alone...');
    const reqUpdate2 = {
      params: { id: testRegId },
      body: { cgpa_calculation_rule: 'BEST_ATTEMPT_ONLY' }
    };
    const resUpdate2 = createMockRes();
    await updateRegulation(reqUpdate2, resUpdate2);

    const [dbRow3] = await pool.query('SELECT improvement_policy, cgpa_calculation_rule FROM regulations WHERE id = ?', [testRegId]);

    if (
      resUpdate2.statusCode === 200 &&
      dbRow3[0].improvement_policy === 'BEST_GRADE' &&
      dbRow3[0].cgpa_calculation_rule === 'BEST_ATTEMPT_ONLY'
    ) {
      console.log('  ✔ updateRegulation verified: cgpa_calculation_rule updated to BEST_ATTEMPT_ONLY, improvement_policy preserved as BEST_GRADE');
      passed++;
    } else {
      console.error('  ✖ updateRegulation (cgpa_calculation_rule) failed:', dbRow3);
      failed++;
    }

  } catch (err) {
    console.error('  ✖ Regulation CRUD test error:', err.message);
    failed++;
  } finally {
    if (testRegId) {
      await pool.query('DELETE FROM regulations WHERE id = ?', [testRegId]);
      console.log('\n[Teardown] Isolated test regulation fixture deleted.');
    }
  }

  console.log('\n========================================================================');
  console.log(`   SUMMARY: ${passed} PASSED, ${failed} FAILED OUT OF 7 TESTS`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runCBCSEnhancementTests().catch(err => {
  console.error('Fatal CBCS Test Suite Error:', err);
  process.exit(1);
});
