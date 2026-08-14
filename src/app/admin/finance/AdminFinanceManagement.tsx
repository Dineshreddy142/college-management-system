import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, CheckCircle2, AlertTriangle, RefreshCw, Filter, FileSpreadsheet, ShieldCheck, Award } from 'lucide-react';
import client from '../../../api/client';

export const AdminFinanceManagement: React.FC = () => {
  const [financeOverview, setFinanceOverview] = useState<any | null>(null);
  const [feeCategories, setFeeCategories] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [scholarships, setScholarships] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // New Fee Structure Modal
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [structDeptId, setStructDeptId] = useState('');
  const [structSemId, setStructSemId] = useState('');
  const [structCategoryId, setStructCategoryId] = useState('');
  const [structAmount, setStructAmount] = useState('');
  const [structDueDate, setStructDueDate] = useState('');
  const [isSavingStructure, setIsSavingStructure] = useState(false);

  // Scholarship Modal
  const [isScholModalOpen, setIsScholModalOpen] = useState(false);
  const [scholStudentId, setScholStudentId] = useState('');
  const [scholTypeId, setScholTypeId] = useState('');
  const [scholAmount, setScholAmount] = useState('');
  const [scholReason, setScholReason] = useState('');
  const [isSavingSchol, setIsSavingSchol] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchFinanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ovRes, catRes, strRes, dRes, semRes] = await Promise.allSettled([
        client.get('/admin/fees/overview'),
        client.get('/fees/categories'),
        client.get('/admin/fee-structures'),
        client.get('/v1/academic/departments'),
        client.get('/v1/academic/semesters')
      ]);

      if (ovRes.status === 'fulfilled' && ovRes.value.data?.data) {
        setFinanceOverview(ovRes.value.data.data);
      }
      if (catRes.status === 'fulfilled' && catRes.value.data?.data) {
        const cats = catRes.value.data.data;
        setFeeCategories(cats);
        if (cats.length > 0) setStructCategoryId(String(cats[0].id));
      }
      if (strRes.status === 'fulfilled' && strRes.value.data?.data) {
        setFeeStructures(strRes.value.data.data);
      }
      if (dRes.status === 'fulfilled' && dRes.value.data) {
        setDepartments(Array.isArray(dRes.value.data) ? dRes.value.data : dRes.value.data.data || []);
      }
      if (semRes.status === 'fulfilled' && semRes.value.data) {
        setSemesters(Array.isArray(semRes.value.data) ? semRes.value.data : semRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching finance metadata:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structCategoryId || !structAmount) {
      showToast('Fee Category and Amount are required.', 'error');
      return;
    }

    setIsSavingStructure(true);
    try {
      const res = await client.post('/admin/fee-structures', {
        department_id: structDeptId ? Number(structDeptId) : null,
        semester_id: structSemId ? Number(structSemId) : null,
        fee_category_id: Number(structCategoryId),
        amount: parseFloat(structAmount),
        due_date: structDueDate || null
      });

      if (res.data && res.data.success) {
        showToast(res.data.message || 'Fee structure created & assigned!');
        setIsStructureModalOpen(false);
        setStructAmount('');
        fetchFinanceData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create fee structure.', 'error');
    } finally {
      setIsSavingStructure(false);
    }
  };

  const handleAssignScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scholStudentId || !scholAmount || !scholReason.trim()) {
      showToast('Student ID, Amount, and Audit Reason are required.', 'error');
      return;
    }

    setIsSavingSchol(true);
    try {
      const res = await client.post('/admin/scholarships/assign', {
        student_id: Number(scholStudentId),
        type: 'CONCESSION',
        amount: parseFloat(scholAmount),
        reason: scholReason.trim()
      });

      if (res.data && res.data.success) {
        showToast(res.data.message || 'Concession assigned successfully!');
        setIsScholModalOpen(false);
        setScholStudentId('');
        setScholAmount('');
        setScholReason('');
        fetchFinanceData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to assign concession.', 'error');
    } finally {
      setIsSavingSchol(false);
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
            Fees & Financial Administration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage institutional fee structures, student fee assignments, scholarship waivers, and collection metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScholModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20"
          >
            <Award className="w-4 h-4" />
            <span>Assign Concession</span>
          </button>

          <button
            onClick={() => setIsStructureModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Fee Structure</span>
          </button>
        </div>
      </div>

      {/* Financial Overview KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Assigned Fees</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">₹{(financeOverview?.total_assigned || 0).toLocaleString('en-IN')}</p>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Total Collected Fees</p>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">₹{(financeOverview?.total_collected || 0).toLocaleString('en-IN')}</p>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 shadow-xs">
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Total Outstanding Dues</p>
          <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">₹{(financeOverview?.total_outstanding || 0).toLocaleString('en-IN')}</p>
        </div>

        <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 shadow-xs">
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Today's Collection</p>
          <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">₹{(financeOverview?.todays_collection || 0).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Fee Structures Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Active Institutional Fee Structures
        </h3>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading fee structures...</div>
          ) : feeStructures.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No active fee structures found. Click "Create Fee Structure" to define one.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Fee Category</th>
                  <th className="px-4 py-3">Department & Semester</th>
                  <th className="px-4 py-3 text-right">Amount (₹)</th>
                  <th className="px-4 py-3 text-center">Due Date</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {feeStructures.map((fs) => (
                  <tr key={fs.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {fs.category_name}
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                      {fs.department_name || 'All Departments'} • Semester {fs.semester_name || fs.semester_id || 'All'}
                    </td>

                    <td className="px-4 py-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{parseFloat(fs.amount).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3 text-center text-slate-500 font-medium">
                      {fs.due_date ? new Date(fs.due_date).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                        {fs.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Fee Structure Modal */}
      {isStructureModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create & Assign Fee Structure</h3>
              <button onClick={() => setIsStructureModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <form onSubmit={handleCreateStructure} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fee Category *</label>
                <select
                  value={structCategoryId}
                  onChange={(e) => setStructCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                >
                  {feeCategories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <select
                    value={structDeptId}
                    onChange={(e) => setStructDeptId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
                  <select
                    value={structSemId}
                    onChange={(e) => setStructSemId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">All Semesters</option>
                    {semesters.map(s => <option key={s.id} value={s.id}>Semester {s.name || s.id}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fee Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={structAmount}
                  onChange={(e) => setStructAmount(e.target.value)}
                  placeholder="e.g. 80000.00"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={structDueDate}
                  onChange={(e) => setStructDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button type="button" onClick={() => setIsStructureModalOpen(false)} className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={isSavingStructure} className="px-4 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md">Create & Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Concession Modal */}
      {isScholModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assign Student Concession & Audit Trail</h3>
              <button onClick={() => setIsScholModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <form onSubmit={handleAssignScholarship} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Student ID *</label>
                <input
                  type="number"
                  value={scholStudentId}
                  onChange={(e) => setScholStudentId(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Concession Waiver Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={scholAmount}
                  onChange={(e) => setScholAmount(e.target.value)}
                  placeholder="e.g. 10000.00"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mandatory Audit Reason *</label>
                <textarea
                  rows={3}
                  value={scholReason}
                  onChange={(e) => setScholReason(e.target.value)}
                  placeholder="e.g. Staff ward concession approved by Registrar..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button type="button" onClick={() => setIsScholModalOpen(false)} className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={isSavingSchol} className="px-4 py-2 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md">Assign Concession</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
