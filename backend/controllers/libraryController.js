import pool from '../db.js';

// Helper to ensure Library Member record mock exists for user
const ensureLibraryMember = async (userId, userRole = 'Student') => {
  const memberType = (userRole || '').toLowerCase().includes('faculty') ? 'FACULTY' : 'STUDENT';
  return {
    id: userId,
    user_id: userId,
    member_type: memberType,
    issue_limit: memberType === 'FACULTY' ? 10 : 5,
    loan_period_days: memberType === 'FACULTY' ? 30 : 14,
    status: 'ACTIVE'
  };
};

// --- CATALOG SEARCH & READ ENDPOINTS ---

// GET /api/library/books/search
export const searchBooks = async (req, res) => {
  try {
    const { query, category_id, availability } = req.query;

    let sql = `
      SELECT b.*, bc.name as category_name, p.name as publisher_name,
             NULL as branch_name, NULL as shelf_code, NULL as shelf_name,
             COUNT(bcop.id) as total_copies,
             SUM(CASE WHEN bcop.status = 'AVAILABLE' THEN 1 ELSE 0 END) as available_copies
      FROM books b
      LEFT JOIN book_categories bc ON b.category_id = bc.id
      LEFT JOIN publishers p ON b.publisher_id = p.id
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
             NULL as branch_name, NULL as shelf_code, NULL as shelf_name
      FROM books b
      LEFT JOIN book_categories bc ON b.category_id = bc.id
      LEFT JOIN publishers p ON b.publisher_id = p.id
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
      SELECT bc.*, NULL as branch_name, NULL as shelf_code
      FROM book_copies bc
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
    const { isbn, title, subtitle, edition, category_id, publisher_id, publication_year, author_ids, description } = req.body;

    if (!isbn || !title || !category_id) {
      return res.status(400).json({ success: false, message: 'ISBN, Title, and Category are required.' });
    }

    const [insRes] = await pool.query(`
      INSERT INTO books (isbn, title, subtitle, edition, category_id, publisher_id, publication_year, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [isbn.trim(), title.trim(), subtitle || null, edition || null, category_id, publisher_id || null, publication_year || null, description || null]);

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
    const { book_id, accession_number, barcode, purchase_price } = req.body;

    if (!book_id || !accession_number) {
      return res.status(400).json({ success: false, message: 'Book ID and Accession Number are required.' });
    }

    const barcodeVal = barcode && barcode.trim() ? barcode.trim() : `BC-${accession_number.trim()}`;

    await pool.query(`
      INSERT INTO book_copies (book_id, accession_number, barcode, purchase_price, status)
      VALUES (?, ?, ?, ?, 'AVAILABLE')
    `, [book_id, accession_number.trim(), barcodeVal, purchase_price || null]);

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
    res.status(200).json({
      success: true,
      message: 'Physical book circulation issue service is currently disabled.'
    });
  } catch (error) {
    console.error('Error issuing book:', error);
    res.status(500).json({ success: false, message: 'Failed to issue book', error: error.message });
  }
};

// POST /api/library/returns
export const returnBook = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Physical book circulation return service is currently disabled.',
      fine_amount: 0
    });
  } catch (error) {
    console.error('Error returning book:', error);
    res.status(500).json({ success: false, message: 'Failed to return book', error: error.message });
  }
};

// POST /api/library/renew
export const renewBook = async (req, res) => {
  try {
    res.status(200).json({ success: true, message: 'Renewal service is currently disabled.' });
  } catch (error) {
    console.error('Error renewing book:', error);
    res.status(500).json({ success: false, message: 'Failed to renew book', error: error.message });
  }
};

// POST /api/library/reservations
export const reserveBook = async (req, res) => {
  try {
    res.status(200).json({ success: true, message: 'Reservation service is currently disabled.' });
  } catch (error) {
    console.error('Error reserving book:', error);
    res.status(500).json({ success: false, message: 'Failed to reserve book', error: error.message });
  }
};

// --- DASHBOARD & OVERVIEW ENDPOINTS ---

// GET /api/library/my
export const getStudentLibrarySummary = async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const member = await ensureLibraryMember(userId, req.user?.role || 'Student');

    res.json({
      success: true,
      member,
      active_issues: [],
      reservations: [],
      history: []
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

    res.json({
      success: true,
      data: {
        total_books: parseInt(bSum[0]?.total_books) || 0,
        total_copies: parseInt(cSum[0]?.total_copies) || 0,
        available_copies: parseInt(cSum[0]?.available_copies) || 0,
        issued_copies: parseInt(cSum[0]?.issued_copies) || 0,
        reserved_copies: parseInt(cSum[0]?.reserved_copies) || 0,
        overdue_count: 0
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
