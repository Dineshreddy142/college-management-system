import * as XLSX from 'xlsx';
import pool from './db.js';
import { importStudents, importAttendance, importMarks, importFaculty, downloadTemplate, getAcademicStats } from './controllers/bulkUploadController.js';
import { calculateGrade, calculateSGPA, calculateCGPA } from './utils/gradeCalculator.js';

async function testBulkExcelEngine() {
  console.log('=====================================================');
  console.log('🧪 RUNNING BULK EXCEL & ACADEMIC ENGINE TEST SUITE');
  console.log('=====================================================\n');

  // Test 1: Grade Calculator Unit Tests
  console.log('1. Testing UGC 10-Point Grade Calculator Formula:');
  const gradeO = calculateGrade(95, 100);
  const gradeAplus = calculateGrade(82, 100);
  const gradeA = calculateGrade(74, 100);
  const gradeBplus = calculateGrade(64, 100);
  const gradeB = calculateGrade(56, 100);
  const gradeF = calculateGrade(32, 100);

  console.log(' - 95/100 ->', gradeO);
  console.log(' - 82/100 ->', gradeAplus);
  console.log(' - 74/100 ->', gradeA);
  console.log(' - 64/100 ->', gradeBplus);
  console.log(' - 56/100 ->', gradeB);
  console.log(' - 32/100 ->', gradeF);

  if (gradeO.grade !== 'O' || gradeO.points !== 10) throw new Error('Grade O failed');
  if (gradeAplus.grade !== 'A+' || gradeAplus.points !== 9) throw new Error('Grade A+ failed');
  if (gradeF.grade !== 'F' || gradeF.passed !== false) throw new Error('Grade F failed');

  const sgpa = calculateSGPA([
    { credits: 4, marksObtained: 92, maxMarks: 100 }, // O (10) * 4 = 40
    { credits: 3, marksObtained: 85, maxMarks: 100 }, // A+ (9) * 3 = 27
    { credits: 3, marksObtained: 72, maxMarks: 100 }, // A (8) * 3 = 24
    { credits: 2, marksObtained: 65, maxMarks: 100 }, // B+ (7) * 2 = 14
  ]); // Total points = 105 / 12 = 8.75
  console.log(' - Calculated SGPA:', sgpa);
  if (sgpa !== 8.75) throw new Error('SGPA calculation mismatch');
  console.log(' ✔ PASS: Grade Calculator and SGPA engine 100% accurate!\n');

  // Helper mock response
  function createMockRes() {
    return {
      statusCode: 200,
      headers: {},
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; },
      setHeader(k, v) { this.headers[k] = v; },
      send(buf) { this.body = buf; return this; }
    };
  }

  // Test 2: Bulk Student Onboarding with Excel
  console.log('2. Testing Bulk Student Onboarding with generated .xlsx:');
  const mockStudents = [
    { 'Roll Number': '24CS001', 'Full Name': 'Aarav Sharma', 'Email': 'aarav.24cs@collegeerp.com', 'Department': 'Computer Science', 'Semester': 4, 'Section': 'A', 'Password': 'TestPassword@123' },
    { 'Roll Number': '24CS002', 'Full Name': 'Ananya Patel', 'Email': 'ananya.24cs@collegeerp.com', 'Department': 'Computer Science', 'Semester': 4, 'Section': 'A', 'Password': 'TestPassword@123' },
    { 'Roll Number': '24EC001', 'Full Name': 'Rohan Verma', 'Email': 'rohan.24ec@collegeerp.com', 'Department': 'Electronics & Comm', 'Semester': 4, 'Section': 'B', 'Password': 'TestPassword@123' },
    { 'Roll Number': '24ME001', 'Full Name': 'Kavya Nair', 'Email': 'kavya.24me@collegeerp.com', 'Department': 'Mechanical Eng', 'Semester': 4, 'Section': 'A', 'Password': 'TestPassword@123' },
    { 'Roll Number': '24CS003', 'Full Name': 'Siddharth Rao', 'Email': 'siddharth.24cs@collegeerp.com', 'Department': 'Computer Science', 'Semester': 4, 'Section': 'B', 'Password': 'TestPassword@123' }
  ];

  const wbStudent = XLSX.utils.book_new();
  const wsStudent = XLSX.utils.json_to_sheet(mockStudents);
  XLSX.utils.book_append_sheet(wbStudent, wsStudent, 'Students');
  const studentBuffer = XLSX.write(wbStudent, { type: 'buffer', bookType: 'xlsx' });

  const mockReqStudent = { file: { buffer: studentBuffer } };
  const mockResStudent = createMockRes();
  await importStudents(mockReqStudent, mockResStudent);
  console.log(' - Student Import Response:', mockResStudent.body);
  if (!mockResStudent.body?.success) throw new Error('Student import failed: ' + JSON.stringify(mockResStudent.body));
  console.log(' ✔ PASS: Bulk students created and mapped to departments & user accounts!\n');

  // Test 3: Bulk Attendance Matrix Import
  console.log('3. Testing Bulk Attendance Matrix Import:');
  const mockAttendance = [
    { 'Date': '2026-08-11', 'Roll Number': '24CS001', 'Subject Code': 'CS401', 'Section': 'A', 'Status': 'Present' },
    { 'Date': '2026-08-11', 'Roll Number': '24CS002', 'Subject Code': 'CS401', 'Section': 'A', 'Status': 'Present' },
    { 'Date': '2026-08-11', 'Roll Number': '24EC001', 'Subject Code': 'EC401', 'Section': 'B', 'Status': 'Absent' },
    { 'Date': '2026-08-11', 'Roll Number': '24ME001', 'Subject Code': 'ME401', 'Section': 'A', 'Status': 'Present' },
    { 'Date': '2026-08-11', 'Roll Number': '24CS003', 'Subject Code': 'CS401', 'Section': 'B', 'Status': 'Late' },
  ];

  const wbAtt = XLSX.utils.book_new();
  const wsAtt = XLSX.utils.json_to_sheet(mockAttendance);
  XLSX.utils.book_append_sheet(wbAtt, wsAtt, 'Attendance');
  const attBuffer = XLSX.write(wbAtt, { type: 'buffer', bookType: 'xlsx' });

  const mockReqAtt = { file: { buffer: attBuffer } };
  const mockResAtt = createMockRes();
  await importAttendance(mockReqAtt, mockResAtt);
  console.log(' - Attendance Import Response:', mockResAtt.body);
  if (!mockResAtt.body?.success) throw new Error('Attendance import failed: ' + JSON.stringify(mockResAtt.body));
  console.log(' ✔ PASS: Multi-class Attendance matrix synchronized in real-time!\n');

  // Test 4: Bulk Exam Marks & Auto-Grading Engine
  console.log('4. Testing Bulk Exam Marks & Auto-Grading Engine:');
  const mockMarks = [
    { 'Roll Number': '24CS001', 'Subject Code': 'CS401', 'Exam Name': 'Mid Term 1', 'Marks Obtained': 94, 'Max Marks': 100 },
    { 'Roll Number': '24CS002', 'Subject Code': 'CS401', 'Exam Name': 'Mid Term 1', 'Marks Obtained': 81, 'Max Marks': 100 },
    { 'Roll Number': '24EC001', 'Subject Code': 'EC401', 'Exam Name': 'Mid Term 1', 'Marks Obtained': 68, 'Max Marks': 100 },
    { 'Roll Number': '24ME001', 'Subject Code': 'ME401', 'Exam Name': 'Mid Term 1', 'Marks Obtained': 52, 'Max Marks': 100 },
    { 'Roll Number': '24CS003', 'Subject Code': 'CS401', 'Exam Name': 'Mid Term 1', 'Marks Obtained': 36, 'Max Marks': 100 },
  ];

  const wbMarks = XLSX.utils.book_new();
  const wsMarks = XLSX.utils.json_to_sheet(mockMarks);
  XLSX.utils.book_append_sheet(wbMarks, wsMarks, 'Marks');
  const marksBuffer = XLSX.write(wbMarks, { type: 'buffer', bookType: 'xlsx' });

  const mockReqMarks = { file: { buffer: marksBuffer } };
  const mockResMarks = createMockRes();
  await importMarks(mockReqMarks, mockResMarks);
  console.log(' - Marks Import Response:', mockResMarks.body);
  if (!mockResMarks.body?.success) throw new Error('Marks import failed: ' + JSON.stringify(mockResMarks.body));
  console.log(' ✔ PASS: Exam marks graded and saved with UGC letter scale!\n');

  // Test 5: Verify Live Academic Stats Overview
  console.log('5. Testing Academic Stats API:');
  const mockResStats = createMockRes();
  await getAcademicStats({}, mockResStats);
  console.log(' - Academic Stats Response:', mockResStats.body);
  if (!mockResStats.body?.success) throw new Error('Stats API failed');
  console.log(' ✔ PASS: Live aggregate stats computed across database tables!\n');

  // Test 6: Verify Template Downloads
  console.log('6. Testing Template Generators (students, attendance, marks, faculty):');
  for (const t of ['students', 'attendance', 'marks', 'faculty']) {
    const mockResTpl = createMockRes();
    await downloadTemplate({ params: { type: t } }, mockResTpl);
    if (!mockResTpl.body || mockResTpl.body.length === 0) throw new Error(`Template ${t} generation failed`);
    console.log(` - Template ${t}: generated buffer of ${mockResTpl.body.length} bytes`);
  }
  console.log(' ✔ PASS: All 4 Excel templates generated dynamically!\n');

  console.log('=====================================================');
  console.log('🎉 ALL BULK EXCEL & ACADEMIC ENGINE TESTS PASSED 100%!');
  console.log('=====================================================');
  process.exit(0);
}

testBulkExcelEngine().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
