import pool from '../db.js';

// Helper to ensure Library Member record exists for user
const ensureLibraryMember = async (userId, userRole = 'Student') => {
  let [members] = await pool.query('SELECT * FROM library_members WHERE user_id = ?', [userId]);
  if (members.length === 0) {
    const memberType = userRole.toLowerCase().includes('faculty') ? 'FACULTY' : 'STUDENT';
    const limit = memberType === 'FACULTY' ? 10 : 5;
    const loanDays = memberType === 'FACULTY' ? 30 : 14;

    const [ins] = await pool.query(`
      INSERT INTO library_members (user_id, member_type, issue_limit, loan_period_days, status)
      VALUES (?, ?, ?, ?, 'ACTIVE')
    `, [userId, memberType, limit, loanDays]);

    [members] = await pool.query('SELECT * FROM library_members WHERE id = ?', [ins.insertId]);
  }
  return members[0];
};

// --- CATALOG SEARCH & READ ENDPOINTS ---

// GET /api/library/books/search
export const searchBooks = async (req, res) => {
  try {
    const { query, category_id, branch_id, availability } = req.query;

    let sql = `
      SELECT b.*, bc.name as category_name, p.name as publisher_name,
             lb.name as branch_name, ls.shelf_code, ls.shelf_name,
             COUNT(bcop.id) as total_copies,
             SUM(CASE WHEN bcop.status = 'AVAILABLE' THEN 1 ELSE 0 END) as available_copies
      FROM books b
      LEFT JOIN book_categories bc ON b.category_id = bc.id
      LEFT JOIN publishers p ON b.publisher_id = p.id
      LEFT JOIN library_branches lb ON b.branch_id = lb.id
      LEFT JOIN library_shelves ls ON b.shelf_id = ls.id
      LEFT JOIN book_copies bcop ON b.id = bcop.book_id
      WHERE b.status = 'ACTIVE'
    `;
    const params = [];

    if (query && query.trim()) {
      const q = `%${query.trim()}%`;
      sql += ` AND (b.title LIKE ? OR b.isbn LIKE ? OR b.description LIKE ?)`;
      params.push(q, q, q);
    }

    if (category_id) {
      sql += ` AND b.category_id = ?`;
      params.push(Number(category_id));
    }

    if (branch_id) {
      sql += ` AND b.branch_id = ?`;
      params.push(Number(branch_id));
    }

    sql += ` GROUP BY b.id ORDER BY b.id DESC`;

    const [books] = await pool.query(sql, params);

    // Fetch authors for each book
    for (const b of books) {
      const [auths] = await pool.query(`
        SELECT a.id, a.name
        FROM authors a
        JOIN book_authors ba ON a.id = ba.author_id
        WHERE ba.book_id = ?
      `, [b.id]);
      b.authors = auths;
    }

    let filtered = books;
    if (availability === 'available') {
      filtered = books.filter(b => b.available_copies > 0);
    }

    res.json({ success: true, data: filtered });
  } catch (error) {
    console.error('Error searching books:', error);
    res.status(500).json({ success: false, message: 'Failed to search books catalog', error: error.message });
  }
};

// GET /api/library/books/:id
export const getBookDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [books] = await pool.query(`
      SELECT b.*, bc.name as category_name, p.name as publisher_name,
             lb.name as branch_name, ls.shelf_code, ls.shelf_name
      FROM books b
      LEFT JOIN book_categories bc ON b.category_id = bc.id
      LEFT JOIN publishers p ON b.publisher_id = p.id
      LEFT JOIN library_branches lb ON b.branch_id = lb.id
      LEFT JOIN library_shelves ls ON b.shelf_id = ls.id
      WHERE b.id = ?
    `, [id]);

    if (books.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const book = books[0];

    // Fetch authors
    const [auths] = await pool.query(`
      SELECT a.id, a.name, a.country
      FROM authors a
      JOIN book_authors ba ON a.id = ba.author_id
      WHERE ba.book_id = ?
    `, [id]);
    book.authors = auths;

    // Fetch physical copies
    const [copies] = await pool.query(`
      SELECT bc.*, lb.name as branch_name, ls.shelf_code
      FROM book_copies bc
      LEFT JOIN library_branches lb ON bc.branch_id = lb.id
      LEFT JOIN library_shelves ls ON bc.shelf_id = ls.id
      WHERE bc.book_id = ?
      ORDER BY bc.id ASC
    `, [id]);
    book.copies = copies;

    res.json({ success: true, data: book });
  } catch (error) {
    console.error('Error fetching book details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch book details', error: error.message });
  }
};

// POST /api/library/books
export const createBook = async (req, res) => {
  try {
    const { isbn, title, subtitle, edition, category_id, publisher_id, publication_year, shelf_id, branch_id, author_ids, description } = req.body;

    if (!isbn || !title || !category_id) {
      return res.status(400).json({ success: false, message: 'ISBN, Title, and Category are required.' });
    }

    const [insRes] = await pool.query(`
      INSERT INTO books (isbn, title, subtitle, edition, category_id, publisher_id, publication_year, shelf_id, branch_id, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [isbn.trim(), title.trim(), subtitle || null, edition || null, category_id, publisher_id || null, publication_year || null, shelf_id || null, branch_id || null, description || null]);

    const bookId = insRes.insertId;

    if (Array.isArray(author_ids) && author_ids.length > 0) {
      for (const aid of author_ids) {
        await pool.query('INSERT IGNORE INTO book_authors (book_id, author_id) VALUES (?, ?)', [bookId, aid]);
      }
    }

    res.json({ success: true, message: 'Book catalog entry created successfully!', book_id: bookId });
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ success: false, message: 'Failed to create book entry', error: error.message });
  }
};

// POST /api/library/copies
export const createBookCopy = async (req, res) => {
  try {
    const { book_id, accession_number, barcode, branch_id, shelf_id, purchase_price } = req.body;

    if (!book_id || !accession_number || !branch_id) {
      return res.status(400).json({ success: false, message: 'Book ID, Accession Number, and Branch ID are required.' });
    }

    const barcodeVal = barcode && barcode.trim() ? barcode.trim() : `BC-${accession_number.trim()}`;

    await pool.query(`
      INSERT INTO book_copies (book_id, accession_number, barcode, branch_id, shelf_id, purchase_price, status)
      VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE')
    `, [book_id, accession_number.trim(), barcodeVal, branch_id, shelf_id || null, purchase_price || null]);

    res.json({ success: true, message: 'Physical book copy registered & barcode assigned successfully!' });
  } catch (error) {
    console.error('Error creating book copy:', error);
    res.status(500).json({ success: false, message: 'Failed to register physical copy', error: error.message });
  }
};

// --- TRANSACTIONAL CIRCULATION WORKFLOW ---

// POST /api/library/issues
export const issueBook = async (req, res) => {
  try {
    const { copy_id, user_id } = req.body;
    const targetUserId = user_id || req.user.id;

    if (!copy_id) {
      return res.status(400).json({ success: false, message: 'Book Copy ID is required.' });
    }

    // Lock and check copy status
    const [copies] = await pool.query('SELECT * FROM book_copies WHERE id = ?', [copy_id]);
    if (copies.length === 0) {
      return res.status(404).json({ success: false, message: 'Physical book copy record not found.' });
    }
    const copy = copies[0];

    if (copy.status !== 'AVAILABLE') {
      return res.status(400).json({ success: false, message: `Copy is currently ${copy.status} and cannot be issued.` });
    }

    const member = await ensureLibraryMember(targetUserId, req.user.role || 'Student');
    if (member.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Library membership is currently suspended or expired.' });
    }

    // Check active issue count
    const [activeIssues] = await pool.query('SELECT COUNT(*) as count FROM library_issues WHERE member_id = ? AND status = "ISSUED"', [member.id]);
    if (parseInt(activeIssues[0]?.count) >= member.issue_limit) {
      return res.status(400).json({ success: false, message: `Issue limit reached (${member.issue_limit} books). Please return active borrowings first.` });
    }

    // Calculate due date
    const loanDays = member.loan_period_days || 14;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + loanDays);

    // Insert issue record & update copy status
    const [issRes] = await pool.query(`
      INSERT INTO library_issues (copy_id, book_id, member_id, user_id, due_date, issued_by, status)
      VALUES (?, ?, ?, ?, ?, ?, 'ISSUED')
    `, [copy.id, copy.book_id, member.id, targetUserId, dueDate, req.user.id]);

    await pool.query('UPDATE book_copies SET status = "ISSUED" WHERE id = ?', [copy.id]);

    res.json({
      success: true,
      message: `Book copy #${copy.accession_number} issued successfully! Due Date: ${dueDate.toLocaleDateString()}`,
      issue_id: issRes.insertId,
      due_date: dueDate
    });
  } catch (error) {
    console.error('Error issuing book:', error);
    res.status(500).json({ success: false, message: 'Failed to issue book', error: error.message });
  }
};

// POST /api/library/returns
export const returnBook = async (req, res) => {
  try {
    const { issue_id, copy_id, item_condition } = req.body;

    let issue;
    if (issue_id) {
      const [issues] = await pool.query('SELECT * FROM library_issues WHERE id = ?', [issue_id]);
      if (issues.length === 0) return res.status(404).json({ success: false, message: 'Issue transaction record not found.' });
      issue = issues[0];
    } else if (copy_id) {
      const [issues] = await pool.query('SELECT * FROM library_issues WHERE copy_id = ? AND status = "ISSUED" ORDER BY id DESC LIMIT 1', [copy_id]);
      if (issues.length === 0) return res.status(404).json({ success: false, message: 'No active issue record found for this copy.' });
      issue = issues[0];
    } else {
      return res.status(400).json({ success: false, message: 'Issue ID or Copy ID is required.' });
    }

    const returnDate = new Date();
    const dueDate = new Date(issue.due_date);

    // Overdue calculation (₹2.00 / day)
    let fineAmount = 0.0;
    if (returnDate > dueDate) {
      const diffTime = Math.abs(returnDate.getTime() - dueDate.getTime());
      const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fineAmount = overdueDays * 2.0; // ₹2/day fine
    }

    // Integrate Fine with Phase 8 Finance if applicable
    if (fineAmount > 0) {
      const [stRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [issue.user_id]);
      if (stRows.length > 0) {
        const studentId = stRows[0].id;
        await pool.query(`
          INSERT INTO fines (student_id, amount, reason)
          VALUES (?, ?, ?)
        `, [studentId, fineAmount, `Overdue Library Fine for Issue #${issue.id}`]);

        // Update student fee account
        await pool.query('UPDATE student_fee_accounts SET total_fines = total_fines + ?, outstanding_balance = outstanding_balance + ? WHERE student_id = ?', [fineAmount, fineAmount, studentId]);
      }
    }

    // Update issue record
    await pool.query(`
      UPDATE library_issues
      SET return_date = CURRENT_TIMESTAMP, returned_by = ?, fine_amount = ?, status = 'RETURNED'
      WHERE id = ?
    `, [req.user.id, fineAmount, issue.id]);

    // Check if waiting reservation exists for this book
    const [reservations] = await pool.query('SELECT * FROM library_reservations WHERE book_id = ? AND status = "WAITING" ORDER BY queue_position ASC LIMIT 1', [issue.book_id]);

    if (reservations.length > 0) {
      await pool.query('UPDATE library_reservations SET status = "READY" WHERE id = ?', [reservations[0].id]);
      await pool.query('UPDATE book_copies SET status = "RESERVED" WHERE id = ?', [issue.copy_id]);
    } else {
      const conditionVal = item_condition || 'GOOD';
      const copyStatus = conditionVal === 'DAMAGED' ? 'DAMAGED' : conditionVal === 'LOST' ? 'LOST' : 'AVAILABLE';
      await pool.query('UPDATE book_copies SET item_condition = ?, status = ? WHERE id = ?', [conditionVal, copyStatus, issue.copy_id]);
    }

    res.json({
      success: true,
      message: `Book copy returned successfully! ${fineAmount > 0 ? `Overdue fine of ₹${fineAmount} logged to student finance account.` : ''}`,
      fine_amount: fineAmount
    });
  } catch (error) {
    console.error('Error returning book:', error);
    res.status(500).json({ success: false, message: 'Failed to return book', error: error.message });
  }
};

// POST /api/library/renew
export const renewBook = async (req, res) => {
  try {
    const { issue_id } = req.body;

    const [issues] = await pool.query('SELECT * FROM library_issues WHERE id = ?', [issue_id]);
    if (issues.length === 0) {
      return res.status(404).json({ success: false, message: 'Issue record not found.' });
    }
    const issue = issues[0];

    if (issue.renew_count >= 2) {
      return res.status(400).json({ success: false, message: 'Maximum renewal limit (2 times) reached for this borrowing.' });
    }

    // Check if reservation queue exists
    const [resv] = await pool.query('SELECT id FROM library_reservations WHERE book_id = ? AND status = "WAITING"', [issue.book_id]);
    if (resv.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot renew: Other students have reserved this title.' });
    }

    const newDueDate = new Date(issue.due_date);
    newDueDate.setDate(newDueDate.getDate() + 14); // Extend by 14 days

    await pool.query('UPDATE library_issues SET due_date = ?, renew_count = renew_count + 1 WHERE id = ?', [newDueDate, issue.id]);

    res.json({ success: true, message: `Loan renewed successfully! New Due Date: ${newDueDate.toLocaleDateString()}` });
  } catch (error) {
    console.error('Error renewing book:', error);
    res.status(500).json({ success: false, message: 'Failed to renew book', error: error.message });
  }
};

// POST /api/library/reservations
export const reserveBook = async (req, res) => {
  try {
    const { book_id } = req.body;

    if (!book_id) {
      return res.status(400).json({ success: false, message: 'Book ID is required.' });
    }

    const [existing] = await pool.query('SELECT id FROM library_reservations WHERE book_id = ? AND user_id = ? AND status IN ("WAITING", "READY")', [book_id, req.user.id]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'You already have an active reservation for this book.' });
    }

    const [qRows] = await pool.query('SELECT COUNT(*) as count FROM library_reservations WHERE book_id = ? AND status = "WAITING"', [book_id]);
    const nextPos = (parseInt(qRows[0]?.count) || 0) + 1;

    await pool.query(`
      INSERT INTO library_reservations (book_id, user_id, queue_position, status)
      VALUES (?, ?, ?, 'WAITING')
    `, [book_id, req.user.id, nextPos]);

    res.json({ success: true, message: `Book reserved successfully! You are #${nextPos} in the reservation queue.` });
  } catch (error) {
    console.error('Error reserving book:', error);
    res.status(500).json({ success: false, message: 'Failed to reserve book', error: error.message });
  }
};

// --- DASHBOARD & OVERVIEW ENDPOINTS ---

// GET /api/library/my
export const getStudentLibrarySummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const member = await ensureLibraryMember(userId, req.user.role || 'Student');

    // Fetch active issues
    const [issues] = await pool.query(`
      SELECT li.*, b.title, b.isbn, bc.accession_number, bc.barcode,
             lb.name as branch_name, ls.shelf_code
      FROM library_issues li
      JOIN books b ON li.book_id = b.id
      JOIN book_copies bc ON li.copy_id = bc.id
      LEFT JOIN library_branches lb ON bc.branch_id = lb.id
      LEFT JOIN library_shelves ls ON bc.shelf_id = ls.id
      WHERE li.user_id = ? AND li.status = 'ISSUED'
      ORDER BY li.due_date ASC
    `, [userId]);

    // Fetch active reservations
    const [reservations] = await pool.query(`
      SELECT lr.*, b.title, b.isbn
      FROM library_reservations lr
      JOIN books b ON lr.book_id = b.id
      WHERE lr.user_id = ? AND lr.status IN ('WAITING', 'READY')
      ORDER BY lr.request_date DESC
    `, [userId]);

    // Fetch borrowing history
    const [history] = await pool.query(`
      SELECT li.*, b.title, b.isbn
      FROM library_issues li
      JOIN books b ON li.book_id = b.id
      WHERE li.user_id = ? AND li.status = 'RETURNED'
      ORDER BY li.return_date DESC
      LIMIT 10
    `, [userId]);

    res.json({
      success: true,
      member,
      active_issues: issues,
      reservations,
      history
    });
  } catch (error) {
    console.error('Error fetching student library summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch library summary', error: error.message });
  }
};

// GET /api/library/dashboard
export const getAdminLibraryOverview = async (req, res) => {
  try {
    const [bSum] = await pool.query('SELECT COUNT(*) as total_books FROM books WHERE status = "ACTIVE"');
    const [cSum] = await pool.query(`
      SELECT 
        COUNT(*) as total_copies,
        SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) as available_copies,
        SUM(CASE WHEN status = 'ISSUED' THEN 1 ELSE 0 END) as issued_copies,
        SUM(CASE WHEN status = 'RESERVED' THEN 1 ELSE 0 END) as reserved_copies
      FROM book_copies
    `);
    const [oSum] = await pool.query('SELECT COUNT(*) as overdue_count FROM library_issues WHERE status = "ISSUED" AND due_date < CURRENT_TIMESTAMP');

    res.json({
      success: true,
      data: {
        total_books: parseInt(bSum[0]?.total_books) || 0,
        total_copies: parseInt(cSum[0]?.total_copies) || 0,
        available_copies: parseInt(cSum[0]?.available_copies) || 0,
        issued_copies: parseInt(cSum[0]?.issued_copies) || 0,
        reserved_copies: parseInt(cSum[0]?.reserved_copies) || 0,
        overdue_count: parseInt(oSum[0]?.overdue_count) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching library admin overview:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch library overview', error: error.message });
  }
};

// GET /api/library/digital-resources
export const getDigitalResources = async (req, res) => {
  try {
    const [resources] = await pool.query('SELECT * FROM digital_resources WHERE status = "ACTIVE" ORDER BY id DESC');
    res.json({ success: true, data: resources });
  } catch (error) {
    console.error('Error fetching digital resources:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch digital resources', error: error.message });
  }
};
