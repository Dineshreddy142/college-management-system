import pool from '../db.js';

async function seedBaselineERP() {
  console.log('[SEED] Checking and seeding baseline ERP data for coursework, documents, and grievances...');
  
  try {
    const [students] = await pool.query('SELECT id, user_id FROM students');
    const [subjects] = await pool.query('SELECT id, code, name FROM subjects LIMIT 5');
    const [faculty] = await pool.query('SELECT id, user_id FROM faculty LIMIT 2');

    // 1. Coursework assignments
    const [existingAssign] = await pool.query('SELECT id FROM coursework_assignments LIMIT 1');
    if (existingAssign.length === 0 && subjects.length > 0 && faculty.length > 0) {
      await pool.query(`
        INSERT INTO coursework_assignments (subject_id, faculty_id, title, description, due_date, max_score, status) VALUES
        (?, ?, 'Mini Project: Dynamic Memory Allocation in C', 'Implement malloc/free using linked list memory pool with boundary tag coalescing.', DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY), 100, 'Active'),
        (?, ?, 'Problem Set: Bellman-Ford & Shortest Path Trees', 'Analyze negative weight cycles and write algorithmic proof of convergence.', DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), 50, 'Active'),
        (?, ?, 'Design Document: Relational Database Schema Normalization (3NF/BCNF)', 'Decompose unnormalized university clinic dataset to Boyce-Codd Normal Form.', DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY), 100, 'Active')
      `, [
        subjects[0].id, faculty[0].id,
        subjects[1]?.id || subjects[0].id, faculty[0].id,
        subjects[2]?.id || subjects[0].id, faculty[1]?.id || faculty[0].id
      ]);
      console.log('[SEED] Coursework assignments seeded.');
    }

    // 2. Official documents for each student
    const [existingDocs] = await pool.query('SELECT id FROM official_documents LIMIT 1');
    if (existingDocs.length === 0 && students.length > 0) {
      for (const s of students) {
        await pool.query(`
          INSERT INTO official_documents (student_id, document_type, title, description, status) VALUES
          (?, 'ID_CARD', 'Student Identity Card (Digital Copy)', 'Official university identity card with barcode and security seal.', 'Available'),
          (?, 'BONAFIDE', 'Bonafide Student Certificate', 'Issued for education loan, passport verification, or scholarship claims.', 'Available'),
          (?, 'GRADE_CARD', 'Semester Grade Transcript (End-Term)', 'Official computerized statement of marks and SGPA for latest completed semester.', 'Available'),
          (?, 'FEE_RECEIPT', 'Fee Payment Receipt - Academic Year 2026-27', 'Computer generated receipt for tuition and laboratory fee clearance.', 'Available'),
          (?, 'TRANSFER_CERTIFICATE', 'Transfer & Conduct Certificate (TC)', 'Provisional leaving certificate generated upon graduation clearance.', 'Unavailable')
        `, [s.id, s.id, s.id, s.id, s.id]);
      }
      console.log('[SEED] Official documents seeded for students.');
    }

    // 3. Baseline grievances
    const [existingGriev] = await pool.query('SELECT id FROM grievances LIMIT 1');
    if (existingGriev.length === 0 && students.length > 0) {
      await pool.query(`
        INSERT INTO grievances (ticket_code, user_id, student_id, category, title, description, status, priority) VALUES
        ('TKT-100234', ?, ?, 'Hostel Maintenance', 'Ceiling Fan Regulator Malfunction in Room 302', 'The fan regulator in room 302 is stuck at maximum speed. Requested technician visit.', 'Resolved', 'Low'),
        ('TKT-100235', ?, ?, 'Academics', 'Attendance Discrepancy in Operating Systems Lab Session', 'Marked absent on 12th Oct despite biometric punching at lab entrance.', 'In Progress', 'Medium'),
        ('TKT-100236', ?, ?, 'IT Infrastructure', 'Wi-Fi Bandwidth Shortage in Central Library 2nd Floor', 'Frequent disconnection during online research journal access in quiet study bay.', 'Open', 'Low')
      `, [
        students[0].user_id, students[0].id,
        students[0].user_id, students[0].id,
        students[0].user_id, students[0].id
      ]);
      console.log('[SEED] Baseline grievances seeded.');
    }

    console.log('[SEED] Finished ERP baseline seeding.');
    process.exit(0);
  } catch (err) {
    console.error('[SEED ERROR]', err);
    process.exit(1);
  }
}

seedBaselineERP();
