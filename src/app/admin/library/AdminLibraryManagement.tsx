import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, CheckCircle2, AlertTriangle, RefreshCw, Barcode, ArrowUpRight, ArrowDownLeft, ShieldCheck } from 'lucide-react';
import client from '../../../api/client';

export const AdminLibraryManagement: React.FC = () => {
  const [overview, setOverview] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [shelves, setShelves] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // New Book Modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bIsbn, setBIsbn] = useState('');
  const [bTitle, setBTitle] = useState('');
  const [bCategoryId, setBCategoryId] = useState('');
  const [bPublisherId, setBPublisherId] = useState('');
  const [bPubYear, setBPubYear] = useState('');
  const [bAuthorId, setBAuthorId] = useState('');
  const [bDescription, setBDescription] = useState('');
  const [isSavingBook, setIsSavingBook] = useState(false);

  // New Copy Modal
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [cBookId, setCBookId] = useState('');
  const [cAccNum, setCAccNum] = useState('');
  const [cBranchId, setCBranchId] = useState('');
  const [isSavingCopy, setIsSavingCopy] = useState(false);

  // Circulation Terminal (Issue / Return)
  const [isCirculationModalOpen, setIsCirculationModalOpen] = useState(false);
  const [circMode, setCircMode] = useState<'ISSUE' | 'RETURN'>('ISSUE');
  const [circCopyId, setCircCopyId] = useState('');
  const [circUserId, setCircUserId] = useState('');
  const [circCondition, setCircCondition] = useState<'GOOD' | 'FAIR' | 'DAMAGED' | 'LOST'>('GOOD');
  const [isProcessingCirc, setIsProcessingCirc] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchLibraryAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ovRes, catRes] = await Promise.allSettled([
        client.get('/library/dashboard'),
        client.get('/library/books/search')
      ]);

      if (ovRes.status === 'fulfilled' && ovRes.value.data?.data) {
        setOverview(ovRes.value.data.data);
      }
    } catch (err) {
      console.error('Error fetching library overview:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibraryAdminData();
  }, [fetchLibraryAdminData]);

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bIsbn || !bTitle || !bCategoryId) {
      showToast('ISBN, Title, and Category are required.', 'error');
      return;
    }

    setIsSavingBook(true);
    try {
      const res = await client.post('/library/books', {
        isbn: bIsbn.trim(),
        title: bTitle.trim(),
        category_id: Number(bCategoryId),
        publisher_id: bPublisherId ? Number(bPublisherId) : null,
        publication_year: bPubYear ? Number(bPubYear) : null,
        author_ids: bAuthorId ? [Number(bAuthorId)] : [],
        description: bDescription || null
      });

      if (res.data && res.data.success) {
        showToast(res.data.message || 'Book catalog entry created successfully!');
        setIsBookModalOpen(false);
        setBIsbn('');
        setBTitle('');
        fetchLibraryAdminData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create book entry.', 'error');
    } finally {
      setIsSavingBook(false);
    }
  };

  const handleProcessCirculation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!circCopyId) {
      showToast('Book Copy ID is required.', 'error');
      return;
    }

    setIsProcessingCirc(true);
    try {
      if (circMode === 'ISSUE') {
        const res = await client.post('/library/issues', {
          copy_id: Number(circCopyId),
          user_id: circUserId ? Number(circUserId) : undefined
        });
        if (res.data && res.data.success) {
          showToast(res.data.message || 'Book issued successfully!');
          setIsCirculationModalOpen(false);
          fetchLibraryAdminData();
        }
      } else {
        const res = await client.post('/library/returns', {
          copy_id: Number(circCopyId),
          item_condition: circCondition
        });
        if (res.data && res.data.success) {
          showToast(res.data.message || 'Book returned successfully!');
          setIsCirculationModalOpen(false);
          fetchLibraryAdminData();
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Circulation transaction failed.', 'error');
    } finally {
      setIsProcessingCirc(false);
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
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs opacity-70">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Library Catalog & Circulation Terminal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Catalog new titles, accession physical barcodes, issue/return borrowings, and manage overdue fines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCircMode('ISSUE');
              setIsCirculationModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Circulation Terminal</span>
          </button>

          <button
            onClick={() => setIsBookModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Catalog New Book</span>
          </button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Book Titles</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{overview?.total_books || 0}</p>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Physical Copies Total</p>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">{overview?.total_copies || 0}</p>
        </div>

        <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 shadow-xs">
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Currently Issued</p>
          <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">{overview?.issued_copies || 0}</p>
        </div>

        <div className="p-5 rounded-2xl bg-red-50/50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 shadow-xs">
          <p className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">Overdue Borrowings</p>
          <p className="text-2xl font-extrabold text-red-700 dark:text-red-300 mt-1">{overview?.overdue_count || 0}</p>
        </div>
      </div>

      {/* Circulation Terminal Modal */}
      {isCirculationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Circulation Terminal ({circMode})</h3>
              <button onClick={() => setIsCirculationModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <form onSubmit={handleProcessCirculation} className="p-6 space-y-4 text-xs">
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCircMode('ISSUE')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    circMode === 'ISSUE' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Issue Book
                </button>
                <button
                  type="button"
                  onClick={() => setCircMode('RETURN')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    circMode === 'RETURN' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Return Book
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Book Copy ID / Accession Number *</label>
                <input
                  type="number"
                  value={circCopyId}
                  onChange={(e) => setCircCopyId(e.target.value)}
                  placeholder="e.g. 1 (Copy ID)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              {circMode === 'ISSUE' ? (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Borrower User ID</label>
                  <input
                    type="number"
                    value={circUserId}
                    onChange={(e) => setCircUserId(e.target.value)}
                    placeholder="e.g. 2 (Leave blank for current logged-in user)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Return Item Condition</label>
                  <select
                    value={circCondition}
                    onChange={(e) => setCircCondition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="GOOD">Good / Undamaged</option>
                    <option value="FAIR">Fair Condition</option>
                    <option value="DAMAGED">Damaged (Fine Applied)</option>
                    <option value="LOST">Lost Book Copy</option>
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCirculationModalOpen(false)} className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={isProcessingCirc} className="px-4 py-2 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md">Process Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Catalog New Book Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Catalog New Book Entry</h3>
              <button onClick={() => setIsBookModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <form onSubmit={handleCreateBook} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ISBN Number *</label>
                <input
                  type="text"
                  value={bIsbn}
                  onChange={(e) => setBIsbn(e.target.value)}
                  placeholder="e.g. 978-0078022159"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Book Title *</label>
                <input
                  type="text"
                  value={bTitle}
                  onChange={(e) => setBTitle(e.target.value)}
                  placeholder="e.g. Database System Concepts"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                  <select
                    value={bCategoryId}
                    onChange={(e) => setBCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="1">Computer Science</option>
                    <option value="2">Database Management</option>
                    <option value="3">Operating Systems</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Author</label>
                  <select
                    value={bAuthorId}
                    onChange={(e) => setBAuthorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">Select Author</option>
                    <option value="1">Abraham Silberschatz</option>
                    <option value="4">Robert C. Martin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={bDescription}
                  onChange={(e) => setBDescription(e.target.value)}
                  placeholder="Bibliographic summary..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button type="button" onClick={() => setIsBookModalOpen(false)} className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={isSavingBook} className="px-4 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md">Create Book Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
