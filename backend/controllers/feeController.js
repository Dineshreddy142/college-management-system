import pool from '../db.js';

// Helper to resolve Student ID from authenticated user
const resolveStudentId = async (userId) => {
  const [rows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [userId]);
  return rows.length > 0 ? rows[0].id : null;
};

// Helper to ensure student fee account exists and recalculates balances
const syncStudentFeeAccount = async (studentId) => {
  let [accounts] = await pool.query('SELECT * FROM student_fee_accounts WHERE student_id = ?', [studentId]);
  let accountId;

  if (accounts.length === 0) {
    const [insRes] = await pool.query('INSERT INTO student_fee_accounts (student_id) VALUES (?)', [studentId]);
    accountId = insRes.insertId;
  } else {
    accountId = accounts[0].id;
  }

  // Recalculate sums
  const [itemSum] = await pool.query('SELECT COALESCE(SUM(amount), 0.00) as total, COALESCE(SUM(paid_amount), 0.00) as paid FROM student_fee_items WHERE student_fee_account_id = ?', [accountId]);
  const [scholSum] = await pool.query('SELECT COALESCE(SUM(amount), 0.00) as total FROM student_scholarships WHERE student_id = ?', [studentId]);
  const [concSum] = await pool.query('SELECT COALESCE(SUM(amount), 0.00) as total FROM concessions WHERE student_id = ?', [studentId]);
  const [paySum] = await pool.query('SELECT COALESCE(SUM(amount), 0.00) as total FROM payments WHERE student_id = ? AND status = "SUCCESS"', [studentId]);
  const [refSum] = await pool.query('SELECT COALESCE(SUM(amount), 0.00) as total FROM refunds WHERE student_id = ? AND status = "PROCESSED"', [studentId]);
  const [fineSum] = await pool.query('SELECT COALESCE(SUM(amount), 0.00) as total FROM fines WHERE student_id = ?', [studentId]);

  const totalCharges = parseFloat(itemSum[0]?.total) || 0.0;
  const totalScholarships = parseFloat(scholSum[0]?.total) || 0.0;
  const totalConcessions = parseFloat(concSum[0]?.total) || 0.0;
  const totalPaid = parseFloat(paySum[0]?.total) || 0.0;
  const totalRefunded = parseFloat(refSum[0]?.total) || 0.0;
  const totalFines = parseFloat(fineSum[0]?.total) || 0.0;

  // Outstanding = Total Charges - Scholarships - Concessions - Paid + Fines - Refunds
  let outstanding = totalCharges - totalScholarships - totalConcessions - totalPaid + totalFines - totalRefunded;
  if (outstanding < 0) outstanding = 0.0;

  let statusVal = 'PENDING';
  if (outstanding === 0 && totalCharges > 0) {
    statusVal = 'PAID';
  } else if (totalPaid > 0) {
    statusVal = 'PARTIALLY_PAID';
  }

  await pool.query(`
    UPDATE student_fee_accounts
    SET total_charges = ?, total_scholarships = ?, total_concessions = ?,
        total_paid = ?, total_refunded = ?, total_fines = ?,
        outstanding_balance = ?, status = ?
    WHERE id = ?
  `, [totalCharges, totalScholarships, totalConcessions, totalPaid, totalRefunded, totalFines, outstanding, statusVal, accountId]);

  const [updatedAccounts] = await pool.query('SELECT * FROM student_fee_accounts WHERE id = ?', [accountId]);
  return updatedAccounts[0];
};

// Helper to generate unique receipt number REC-YYYY-XXXXXX
const generateUniqueReceiptNumber = async () => {
  const year = new Date().getFullYear();
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM payments');
  const nextSeq = (parseInt(rows[0]?.count) || 0) + 1;
  const seqStr = String(nextSeq).padStart(6, '0');
  return `REC-${year}-${seqStr}`;
};

// --- STUDENT ENDPOINTS ---

// GET /api/fees/my-account
export const getStudentFeeAccount = async (req, res) => {
  try {
    const studentId = await resolveStudentId(req.user.id);
    if (!studentId) {
      return res.status(404).json({ success: false, message: 'Student profile record not found' });
    }

    const account = await syncStudentFeeAccount(studentId);

    // Fetch fee items breakdown
    const [items] = await pool.query(`
      SELECT sfi.*, fc.name as category_name, fc.code as category_code
      FROM student_fee_items sfi
      JOIN fee_categories fc ON sfi.fee_category_id = fc.id
      WHERE sfi.student_id = ?
      ORDER BY sfi.id ASC
    `, [studentId]);

    // Fetch student scholarships
    const [scholarships] = await pool.query(`
      SELECT ss.*, s.name as scholarship_name, s.code as scholarship_code
      FROM student_scholarships ss
      JOIN scholarships s ON ss.scholarship_id = s.id
      WHERE ss.student_id = ?
    `, [studentId]);

    // Fetch concessions
    const [concessions] = await pool.query(`
      SELECT c.*, fc.name as category_name
      FROM concessions c
      LEFT JOIN fee_categories fc ON c.fee_category_id = fc.id
      WHERE c.student_id = ?
    `, [studentId]);

    res.json({
      success: true,
      account,
      fee_items: items,
      scholarships,
      concessions
    });
  } catch (error) {
    console.error('Error fetching student fee account:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch fee account', error: error.message });
  }
};

// GET /api/fees/my-history
export const getStudentPaymentHistory = async (req, res) => {
  try {
    const studentId = await resolveStudentId(req.user.id);
    if (!studentId) {
      return res.status(404).json({ success: false, message: 'Student profile record not found' });
    }

    const [payments] = await pool.query(`
      SELECT p.*
      FROM payments p
      WHERE p.student_id = ?
      ORDER BY p.payment_date DESC
    `, [studentId]);

    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment history', error: error.message });
  }
};

// POST /api/fees/payment/process
export const processStudentPayment = async (req, res) => {
  try {
    const studentId = await resolveStudentId(req.user.id);
    if (!studentId) {
      return res.status(404).json({ success: false, message: 'Student profile record not found' });
    }

    const { payment_method, transaction_reference, item_ids } = req.body;
    const account = await syncStudentFeeAccount(studentId);

    if (account.outstanding_balance <= 0) {
      return res.status(400).json({ success: false, message: 'You have no outstanding fee balance to pay.' });
    }

    // SERVER-SIDE PAYABLE AMOUNT CALCULATION (Strict Security)
    let payableAmount = 0.0;
    if (Array.isArray(item_ids) && item_ids.length > 0) {
      const [items] = await pool.query('SELECT amount, paid_amount FROM student_fee_items WHERE student_id = ? AND id IN (?)', [studentId, item_ids]);
      for (const it of items) {
        const itemRem = parseFloat(it.amount) - parseFloat(it.paid_amount);
        if (itemRem > 0) payableAmount += itemRem;
      }
    } else {
      payableAmount = parseFloat(account.outstanding_balance);
    }

    if (payableAmount <= 0) {
      payableAmount = parseFloat(account.outstanding_balance);
    }

    const receiptNumber = await generateUniqueReceiptNumber();
    const txnRef = transaction_reference && transaction_reference.trim() ? transaction_reference.trim() : `TXN${Date.now()}`;
    const payMethod = ['ONLINE', 'BANK_TRANSFER', 'CARD', 'UPI', 'CASH', 'CHEQUE'].includes(payment_method) ? payment_method : 'UPI';

    // Insert payment record
    const [payRes] = await pool.query(`
      INSERT INTO payments
      (receipt_number, student_id, student_fee_account_id, amount, payment_method, transaction_reference, status, payment_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS', CURRENT_TIMESTAMP, ?)
    `, [receiptNumber, studentId, account.id, payableAmount, payMethod, txnRef, req.user.id]);

    const paymentId = payRes.insertId;

    // Update paid_amount on student_fee_items
    const [items] = await pool.query('SELECT id, amount, paid_amount FROM student_fee_items WHERE student_id = ? AND status != "PAID"', [studentId]);
    let remainingPayment = payableAmount;

    for (const it of items) {
      if (remainingPayment <= 0) break;
      const due = parseFloat(it.amount) - parseFloat(it.paid_amount);
      if (due > 0) {
        const payForThisItem = Math.min(due, remainingPayment);
        const newPaid = parseFloat(it.paid_amount) + payForThisItem;
        const newStatus = newPaid >= parseFloat(it.amount) ? 'PAID' : 'PARTIALLY_PAID';

        await pool.query('UPDATE student_fee_items SET paid_amount = ?, status = ? WHERE id = ?', [newPaid, newStatus, it.id]);
        remainingPayment -= payForThisItem;
      }
    }

    // Sync account balance
    await syncStudentFeeAccount(studentId);

    res.json({
      success: true,
      message: `Payment of ₹${payableAmount.toLocaleString('en-IN')} processed successfully! Receipt #${receiptNumber} generated.`,
      data: {
        payment_id: paymentId,
        receipt_number: receiptNumber,
        amount: payableAmount,
        transaction_reference: txnRef
      }
    });
  } catch (error) {
    console.error('Error processing student payment:', error);
    res.status(500).json({ success: false, message: 'Payment processing failed', error: error.message });
  }
};

// GET /api/fees/receipt/:id
export const getReceiptDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [payments] = await pool.query(`
      SELECT p.*, st.first_name, st.last_name, st.roll_number, st.admission_number,
             d.name as department_name, sec.name as section_name
      FROM payments p
      JOIN students st ON p.student_id = st.id
      LEFT JOIN departments d ON st.department_id = d.id
      LEFT JOIN sections sec ON st.section_id = sec.id
      WHERE p.id = ? OR p.receipt_number = ?
    `, [id, id]);

    if (payments.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment receipt not found' });
    }

    res.json({ success: true, data: payments[0] });
  } catch (error) {
    console.error('Error fetching receipt details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch receipt', error: error.message });
  }
};

// --- ADMIN / FINANCE ENDPOINTS ---

// GET /api/fees/categories
export const getFeeCategories = async (req, res) => {
  try {
    const [cats] = await pool.query('SELECT * FROM fee_categories ORDER BY name ASC');
    res.json({ success: true, data: cats });
  } catch (error) {
    console.error('Error fetching fee categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch fee categories', error: error.message });
  }
};

// POST /api/fees/categories
export const createFeeCategory = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Category Name and Code are required.' });
    }

    await pool.query('INSERT INTO fee_categories (name, code, description) VALUES (?, ?, ?)', [name.trim(), code.trim().toUpperCase(), description || null]);
    res.json({ success: true, message: 'Fee category created successfully!' });
  } catch (error) {
    console.error('Error creating fee category:', error);
    res.status(500).json({ success: false, message: 'Failed to create fee category', error: error.message });
  }
};

// GET /api/admin/fee-structures
export const getFeeStructures = async (req, res) => {
  try {
    const [structures] = await pool.query(`
      SELECT fs.*, fc.name as category_name, fc.code as category_code,
             d.name as department_name, sem.name as semester_name, c.name as course_name
      FROM fee_structures fs
      JOIN fee_categories fc ON fs.fee_category_id = fc.id
      LEFT JOIN departments d ON fs.department_id = d.id
      LEFT JOIN semesters sem ON fs.semester_id = sem.id
      LEFT JOIN courses c ON fs.course_id = c.id
      ORDER BY fs.id DESC
    `);
    res.json({ success: true, data: structures });
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch fee structures', error: error.message });
  }
};

// POST /api/admin/fee-structures
export const createFeeStructure = async (req, res) => {
  try {
    const { department_id, course_id, semester_id, fee_category_id, amount, due_date } = req.body;

    if (!fee_category_id || !amount) {
      return res.status(400).json({ success: false, message: 'Fee Category and Amount are required.' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Fee amount must be a positive number.' });
    }

    const [insRes] = await pool.query(`
      INSERT INTO fee_structures
      (department_id, course_id, semester_id, fee_category_id, amount, due_date, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    `, [department_id || null, course_id || null, semester_id || null, fee_category_id, numAmount, due_date || null, req.user.id]);

    const structureId = insRes.insertId;

    // Automatically assign this fee item to matching active students
    let query = 'SELECT id FROM students WHERE status = "Active"';
    const params = [];
    if (department_id) {
      query += ' AND department_id = ?';
      params.push(department_id);
    }
    if (semester_id) {
      query += ' AND semester = ?';
      params.push(semester_id);
    }

    const [students] = await pool.query(query, params);
    for (const st of students) {
      const account = await syncStudentFeeAccount(st.id);
      await pool.query(`
        INSERT INTO student_fee_items (student_fee_account_id, student_id, fee_structure_id, fee_category_id, semester_id, amount, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [account.id, st.id, structureId, fee_category_id, semester_id || null, numAmount, due_date || null]);

      await syncStudentFeeAccount(st.id);
    }

    res.json({ success: true, message: `Fee structure created & assigned to ${students.length} students!` });
  } catch (error) {
    console.error('Error creating fee structure:', error);
    res.status(500).json({ success: false, message: 'Failed to create fee structure', error: error.message });
  }
};

// GET /api/admin/fees/overview
export const getAdminFinanceOverview = async (req, res) => {
  try {
    const [accSum] = await pool.query(`
      SELECT 
        COALESCE(SUM(total_charges), 0.00) as total_assigned,
        COALESCE(SUM(total_paid), 0.00) as total_collected,
        COALESCE(SUM(outstanding_balance), 0.00) as total_outstanding,
        COALESCE(SUM(total_scholarships + total_concessions), 0.00) as total_discounts
      FROM student_fee_accounts
    `);

    const todayStr = new Date().toISOString().slice(0, 10);
    const [todayColl] = await pool.query('SELECT COALESCE(SUM(amount), 0.00) as total FROM payments WHERE status = "SUCCESS" AND DATE(payment_date) = ?', [todayStr]);

    res.json({
      success: true,
      data: {
        total_assigned: parseFloat(accSum[0]?.total_assigned) || 0.0,
        total_collected: parseFloat(accSum[0]?.total_collected) || 0.0,
        total_outstanding: parseFloat(accSum[0]?.total_outstanding) || 0.0,
        total_discounts: parseFloat(accSum[0]?.total_discounts) || 0.0,
        todays_collection: parseFloat(todayColl[0]?.total) || 0.0
      }
    });
  } catch (error) {
    console.error('Error fetching admin finance overview:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch finance overview', error: error.message });
  }
};

// POST /api/admin/scholarships/assign
export const assignScholarshipOrConcession = async (req, res) => {
  try {
    const { student_id, type, scholarship_id, fee_category_id, amount, reason } = req.body;

    if (!student_id || !amount || !reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Student ID, Amount, and Mandatory Audit Reason are required.' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
    }

    if (type === 'SCHOLARSHIP' && scholarship_id) {
      await pool.query(`
        INSERT INTO student_scholarships (student_id, scholarship_id, amount, reason, approved_by)
        VALUES (?, ?, ?, ?, ?)
      `, [student_id, scholarship_id, numAmount, reason.trim(), req.user.id]);
    } else {
      await pool.query(`
        INSERT INTO concessions (student_id, fee_category_id, amount, reason, approved_by)
        VALUES (?, ?, ?, ?, ?)
      `, [student_id, fee_category_id || null, numAmount, reason.trim(), req.user.id]);
    }

    // Sync student fee account
    await syncStudentFeeAccount(student_id);

    res.json({ success: true, message: `${type || 'Concession'} assigned successfully with audit trail.` });
  } catch (error) {
    console.error('Error assigning scholarship/concession:', error);
    res.status(500).json({ success: false, message: 'Failed to assign scholarship/concession', error: error.message });
  }
};

// POST /api/admin/refunds
export const requestRefund = async (req, res) => {
  try {
    const { payment_id, amount, reason } = req.body;

    if (!payment_id || !amount || !reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Payment ID, Refund Amount, and Reason are required.' });
    }

    const [payments] = await pool.query('SELECT * FROM payments WHERE id = ?', [payment_id]);
    if (payments.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }
    const payment = payments[0];
    const refundAmt = parseFloat(amount);

    if (refundAmt > parseFloat(payment.amount)) {
      return res.status(400).json({ success: false, message: `Refund Validation Error: Refund amount (₹${refundAmt}) cannot exceed original payment amount (₹${payment.amount}).` });
    }

    await pool.query(`
      INSERT INTO refunds (payment_id, student_id, amount, reason, status, requested_by)
      VALUES (?, ?, ?, ?, 'REQUESTED', ?)
    `, [payment_id, payment.student_id, refundAmt, reason.trim(), req.user.id]);

    res.json({ success: true, message: 'Refund request submitted for administrative review.' });
  } catch (error) {
    console.error('Error requesting refund:', error);
    res.status(500).json({ success: false, message: 'Failed to request refund', error: error.message });
  }
};

// POST /api/admin/refunds/:id/review
export const reviewRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body; // 'APPROVED' or 'REJECTED'

    const [refunds] = await pool.query('SELECT * FROM refunds WHERE id = ?', [id]);
    if (refunds.length === 0) {
      return res.status(404).json({ success: false, message: 'Refund request not found.' });
    }

    const ref = refunds[0];

    if (decision === 'APPROVED') {
      await pool.query("UPDATE refunds SET status = 'PROCESSED', approved_by = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?", [req.user.id, id]);
      await pool.query("UPDATE payments SET status = 'REFUNDED' WHERE id = ?", [ref.payment_id]);
      await syncStudentFeeAccount(ref.student_id);
    } else {
      await pool.query("UPDATE refunds SET status = 'REJECTED', approved_by = ? WHERE id = ?", [req.user.id, id]);
    }

    res.json({ success: true, message: `Refund request review processed (${decision}).` });
  } catch (error) {
    console.error('Error reviewing refund:', error);
    res.status(500).json({ success: false, message: 'Failed to review refund', error: error.message });
  }
};
