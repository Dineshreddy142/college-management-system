import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Unlock, Download, Filter, Search, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react';
import client from '../../../api/client';

export const AdminRegistrationControl: React.FC = () => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [windowStatus, setWindowStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterProg, setFilterProg] = useState('all');
  const [filterSem, setFilterSem] = useState('all');
  const [filterSec, setFilterSec] = useState('all');

  // Override Modal state
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [overrideStudentId, setOverrideStudentId] = useState('');
  const [overrideSubjectId, setOverrideSubjectId] = useState('');
  const [overrideAction, setOverrideAction] = useState<'ADD' | 'DROP'>('ADD');
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterDept !== 'all') params.department_id = filterDept;
      if (filterProg !== 'all') params.course_id = filterProg;
      if (filterSem !== 'all') params.semester_id = filterSem;
      if (filterSec !== 'all') params.section_id = filterSec;

      const res = await client.get('/admin/registrations', { params });
      if (res.data) {
        const raw = Array.isArray(res.data) ? res.data : res.data.data || [];
        setRegistrations(raw);
      }
    } catch (err) {
      console.error('Error fetching registrations report:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterDept, filterProg, filterSem, filterSec]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await client.get('/admin/elective-analytics');
      if (res.data && res.data.data) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  }, []);

  const fetchMetadata = useCallback(async () => {
    try {
      const [dRes, pRes, semRes, secRes] = await Promise.allSettled([
        client.get('/v1/academic/departments'),
        client.get('/v1/academic/courses'),
        client.get('/v1/academic/semesters'),
        client.get('/academic/sections')
      ]);

      if (dRes.status === 'fulfilled' && dRes.value.data) {
        setDepartments(Array.isArray(dRes.value.data) ? dRes.value.data : dRes.value.data.data || []);
      }
      if (pRes.status === 'fulfilled' && pRes.value.data) {
        setPrograms(Array.isArray(pRes.value.data) ? pRes.value.data : pRes.value.data.data || []);
      }
      if (semRes.status === 'fulfilled' && semRes.value.data) {
        setSemesters(Array.isArray(semRes.value.data) ? semRes.value.data : semRes.value.data.data || []);
      }
      if (secRes.status === 'fulfilled' && secRes.value.data) {
        setSections(Array.isArray(secRes.value.data) ? secRes.value.data : secRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
    fetchAnalytics();
  }, [fetchMetadata, fetchAnalytics]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleToggleWindowStatus = async (newStatus: 'OPEN' | 'CLOSED') => {
    try {
      const res = await client.post('/admin/registration-periods/toggle', { status: newStatus });
      if (res.data && res.data.success) {
        setWindowStatus(newStatus);
        showToast(`Registration window successfully set to ${newStatus}.`);
      }
    } catch (err: any) {
      showToast('Failed to toggle registration window status.', 'error');
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideStudentId || !overrideSubjectId || !overrideReason.trim()) {
      showToast('Student ID, Subject ID, and Override Reason are required.', 'error');
      return;
    }

    setIsSubmittingOverride(true);
    try {
      const res = await client.post('/admin/registrations/override', {
        student_id: Number(overrideStudentId),
        subject_id: Number(overrideSubjectId),
        action: overrideAction,
        reason: overrideReason.trim()
      });

      if (res.data && res.data.success) {
        showToast(`Manual registration override '${overrideAction}' executed.`);
        setIsOverrideOpen(false);
        setOverrideReason('');
        fetchRegistrations();
        fetchAnalytics();
      }
    } catch (err: any) {
      showToast('Override execution failed.', 'error');
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  const handleExportCSV = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(registrations, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `Student_Registrations_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Registration report exported successfully.');
  };

  const filteredRegistrations = registrations.filter(r => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (r.roll_number && r.roll_number.toLowerCase().includes(term)) ||
      (r.student_first_name && r.student_first_name.toLowerCase().includes(term)) ||
      (r.subject_code && r.subject_code.toLowerCase().includes(term)) ||
      (r.subject_name && r.subject_name.toLowerCase().includes(term))
    );
  });

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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Student Registration & Window Control
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage registration windows, review student subject enrollments, and process administrative overrides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {windowStatus === 'OPEN' ? (
            <button
              onClick={() => handleToggleWindowStatus('CLOSED')}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Lock className="w-4 h-4" />
              <span>Close Registration Window</span>
            </button>
          ) : (
            <button
              onClick={() => handleToggleWindowStatus('OPEN')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <Unlock className="w-4 h-4" />
              <span>Open Registration Window</span>
            </button>
          )}

          <button
            onClick={() => setIsOverrideOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Admin Manual Override</span>
          </button>
        </div>
      </div>

      {/* Elective Selection Analytics Cards */}
      {analytics.length > 0 && (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-purple-500" /> Elective Subject Selection Analytics Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {analytics.map((item: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">{item.elective_group || 'Elective'}</p>
                <p className="font-bold text-slate-900 dark:text-white text-xs mt-0.5 truncate">{item.subject_name} ({item.subject_code})</p>
                <p className="text-base font-extrabold text-purple-700 dark:text-purple-300 mt-1">{item.student_count} Students</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-3.5 flex flex-wrap gap-2.5 items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student roll number, name, or subject..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
          >
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <select
            value={filterSem}
            onChange={(e) => setFilterSem(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
          >
            <option value="all">All Semesters</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name || `Semester ${s.semester_number}`}</option>)}
          </select>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Registrations Data Grid */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading student registration records...</div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No student registration records found matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Roll No & Student Name</th>
                  <th className="px-4 py-3">Subject Code & Name</th>
                  <th className="px-4 py-3 text-center">Type</th>
                  <th className="px-4 py-3 text-center">Credits</th>
                  <th className="px-4 py-3">Assigned Faculty</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRegistrations.map((row) => (
                  <tr key={row.registration_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900 dark:text-white">{row.student_first_name} {row.student_last_name}</p>
                      <p className="font-mono text-[10px] text-blue-600 dark:text-blue-400">{row.roll_number || row.admission_number || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900 dark:text-white">{row.subject_name}</p>
                      <p className="font-mono text-[10px] text-slate-500">{row.subject_code}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded text-[10px]">
                        {row.registration_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {row.credits} Cr
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                      {row.faculty_first_name ? `${row.faculty_first_name} ${row.faculty_last_name}` : 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        row.registration_status === 'REGISTERED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      }`}>
                        {row.registration_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Override Modal */}
      {isOverrideOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Admin Registration Manual Override</h3>
              <button onClick={() => setIsOverrideOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Student Database ID *</label>
                <input
                  type="number"
                  value={overrideStudentId}
                  onChange={(e) => setOverrideStudentId(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject Database ID *</label>
                <input
                  type="number"
                  value={overrideSubjectId}
                  onChange={(e) => setOverrideSubjectId(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Action *</label>
                <select
                  value={overrideAction}
                  onChange={(e) => setOverrideAction(e.target.value as 'ADD' | 'DROP')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold"
                >
                  <option value="ADD">ADD Subject Registration</option>
                  <option value="DROP">DROP Subject Registration</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Override Reason *</label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Enter reason (e.g. Approved for elective change by HOD)..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white resize-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOverrideOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOverride}
                  className="px-4 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md"
                >
                  Execute Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
