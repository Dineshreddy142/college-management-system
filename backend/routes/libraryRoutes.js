import express from 'express';
import {
  searchBooks,
  getBookDetails,
  createBook,
  createBookCopy,
  issueBook,
  returnBook,
  renewBook,
  reserveBook,
  getStudentLibrarySummary,
  getAdminLibraryOverview,
  getDigitalResources
} from '../controllers/libraryController.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// Catalog Search & Read
router.get('/library/books/search', authenticateToken, searchBooks);
router.get('/library/books/:id', authenticateToken, getBookDetails);
router.get('/library/my', authenticateToken, getStudentLibrarySummary);
router.get('/library/digital-resources', authenticateToken, getDigitalResources);

// Member Circulation Actions
router.post('/library/renew', authenticateToken, renewBook);
router.post('/library/reservations', authenticateToken, reserveBook);

// Librarian / Admin Actions
router.post('/library/books', authenticateToken, authorizeRole(['Admin', 'HOD', 'Librarian']), createBook);
router.post('/library/copies', authenticateToken, authorizeRole(['Admin', 'HOD', 'Librarian']), createBookCopy);
router.post('/library/issues', authenticateToken, authorizeRole(['Admin', 'HOD', 'Librarian']), issueBook);
router.post('/library/returns', authenticateToken, authorizeRole(['Admin', 'HOD', 'Librarian']), returnBook);
router.get('/library/dashboard', authenticateToken, authorizeRole(['Admin', 'HOD', 'Librarian']), getAdminLibraryOverview);

export default router;
