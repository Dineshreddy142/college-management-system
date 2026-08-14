import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Search, Filter, Clock, BookMarked, ExternalLink, RefreshCw, CheckCircle2, AlertCircle, Compass, Bookmark } from 'lucide-react';
import client from '../../api/client';

export const StudentLibraryDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [activeIssues, setActiveIssues] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [borrowHistory, setBorrowHistory] = useState<any[]>([]);
  const [digitalResources, setDigitalResources] = useState<any[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  // Selected Book Modal
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchLibrarySummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const [sumRes, digRes] = await Promise.allSettled([
        client.get('/library/my'),
        client.get('/library/digital-resources')
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value.data) {
        setActiveIssues(sumRes.value.data.active_issues || []);
        setReservations(sumRes.value.data.reservations || []);
        setBorrowHistory(sumRes.value.data.history || []);
      }

      if (digRes.status === 'fulfilled' && digRes.value.data?.data) {
        setDigitalResources(digRes.value.data.data);
      }
    } catch (err) {
      console.error('Error fetching student library summary:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchLibrarySummary();
    handleSearchCatalog('');
  }, [fetchLibrarySummary]);

  const handleSearchCatalog = async (queryStr: string) => {
    setIsSearching(true);
    try {
      const res = await client.get('/library/books/search', {
        params: { query: queryStr }
      });
      if (res.data && res.data.data) {
        setSearchResults(res.data.data);
      }
    } catch (err) {
      console.error('Error searching catalog:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenBookDetails = async (bookId: number) => {
    setIsDetailModalOpen(true);
    setIsLoadingDetail(true);
    try {
      const res = await client.get(`/library/books/${bookId}`);
      if (res.data && res.data.data) {
        setSelectedBook(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load book details.', 'error');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleRenewBook = async (issueId: number) => {
    try {
      const res = await client.post('/library/renew', { issue_id: issueId });
      if (res.data && res.data.success) {
        showToast(res.data.message || 'Book renewed successfully!');
        fetchLibrarySummary();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Renewal failed.', 'error');
    }
  };

  const handleReserveBook = async (bookId: number) => {
    try {
      const res = await client.post('/library/reservations', { book_id: bookId });
      if (res.data && res.data.success) {
        showToast(res.data.message || 'Book reserved successfully!');
        fetchLibrarySummary();
        if (selectedBook) handleOpenBookDetails(bookId);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Reservation failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${
          toastMessage.type === 'success' ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40' : 'bg-red-950/90 text-red-200 border-red-500/40'
        }`}>
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs opacity-70">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-purple-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Central & Digital Library Portal
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search physical books across library branches, check live shelf locations, manage loans, and access e-resources.
          </p>
        </div>

        <button
          onClick={fetchLibrarySummary}
          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh My Library</span>
        </button>
      </div>

      {/* Active Borrowing KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Issued Books</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{activeIssues.length} / 5</p>
        </div>

        <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 shadow-xs">
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">Active Reservations</p>
          <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">{reservations.length}</p>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Books Borrowed Total</p>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">{borrowHistory.length + activeIssues.length}</p>
        </div>

        <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 shadow-xs">
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Digital E-Resources</p>
          <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">{digitalResources.length}</p>
        </div>
      </div>

      {/* Catalog Search Bar */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Search className="w-4 h-4 text-purple-500" /> Search Library Catalog
        </h3>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearchCatalog(e.target.value);
              }}
              placeholder="Search by Title, ISBN, Author, Category, or Keywords (e.g. Database, Silberschatz, Clean Code)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold"
            />
          </div>
        </div>

        {/* Search Results Grid */}
        <div className="space-y-3 pt-2">
          {isSearching ? (
            <div className="p-8 text-center text-xs text-slate-400">Searching catalog...</div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No book titles matched your search query.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((book) => {
                const isAvail = book.available_copies > 0;
                const authorNames = book.authors && book.authors.length > 0 ? book.authors.map((a: any) => a.name).join(', ') : 'Unknown Author';

                return (
                  <div key={book.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-1">{book.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                          isAvail ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}>
                          {isAvail ? `${book.available_copies} Available` : 'Out of Stock'}
                        </span>
                      </div>

                      <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">{authorNames}</p>
                      <p className="text-[10px] text-slate-400 mt-1">ISBN: <span className="font-mono">{book.isbn}</span> • {book.category_name || 'General'}</p>

                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                        <Compass className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span>{book.branch_name || 'Central Library'} • Shelf <strong className="text-slate-700 dark:text-slate-300">{book.shelf_code || 'Main'}</strong></span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenBookDetails(book.id)}
                        className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      >
                        View Copies & Location
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* My Active Issued Books */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-emerald-500" /> My Active Issued Books
        </h3>

        <div className="overflow-x-auto">
          {activeIssues.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">You currently have no active physical book borrowings.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Book Title & Accession</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-center">Renewals</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeIssues.map((issue) => {
                  const isOverdue = new Date(issue.due_date) < new Date();

                  return (
                    <tr key={issue.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-white">{issue.title}</p>
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">Accession: {issue.accession_number} • Barcode: {issue.barcode}</p>
                      </td>

                      <td className="px-4 py-3 text-slate-500 font-medium">
                        {new Date(issue.issue_date).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3 font-bold">
                        <span className={isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}>
                          {new Date(issue.due_date).toLocaleDateString()}
                        </span>
                        {isOverdue && <span className="ml-2 text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-extrabold">OVERDUE</span>}
                      </td>

                      <td className="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-400">
                        {issue.renew_count} / 2
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={issue.renew_count >= 2}
                          onClick={() => handleRenewBook(issue.id)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 disabled:opacity-40"
                        >
                          Renew Loan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Digital E-Resources */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-blue-500" /> Digital Library & E-Learning Resources
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {digitalResources.map((res) => (
            <div key={res.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">{res.title}</h4>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                  {res.resource_type}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{res.description}</p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <span className="text-[10px] text-purple-600 font-bold">{res.author || 'Institutional E-Resource'}</span>
                <a
                  href={res.url_or_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Access Resource
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Book Copy Details Modal */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Book Catalog & Shelf Location</h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {isLoadingDetail ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading details...</div>
              ) : selectedBook ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{selectedBook.title}</h3>
                    <p className="text-purple-600 font-bold">{selectedBook.authors?.map((a: any) => a.name).join(', ')}</p>
                    <p className="text-[11px] text-slate-400 mt-1">ISBN: {selectedBook.isbn} • Publisher: {selectedBook.publisher_name || 'Standard'}</p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <p><strong className="text-slate-500">Branch Location: </strong><span>{selectedBook.branch_name || 'Central Library'}</span></p>
                    <p><strong className="text-slate-500">Shelf Reference: </strong><span className="font-bold text-indigo-600">{selectedBook.shelf_code} — {selectedBook.shelf_name}</span></p>
                  </div>

                  {/* Physical Copies Roster */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300">Physical Copy Roster:</h4>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {selectedBook.copies?.map((c: any) => (
                        <div key={c.id} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{c.accession_number}</p>
                            <p className="text-[10px] text-slate-400 font-mono">Barcode: {c.barcode}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            c.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                    <button type="button" onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100">Close</button>
                    <button
                      type="button"
                      onClick={() => handleReserveBook(selectedBook.id)}
                      className="px-4 py-2 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md"
                    >
                      Reserve Book Queue
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
