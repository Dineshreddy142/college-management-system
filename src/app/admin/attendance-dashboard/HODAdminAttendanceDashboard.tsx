import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, AlertTriangle, ShieldCheck, Download, Filter, Search, Edit3, XCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import client from '../../../api/client';

export const HODAdminAttendanceDashboard: React.FC = () => {
  const [shortageStudents, setShortageStudents] = useState<any[]>([]);
  const [adminOverview, setAdminOverview] = useState<any | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterDept, setFilterDept] = useState('all');
  const [filterSem, setFilterSem] = useState('all');
  const [filterSec, setFilterSec] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Correction Modal
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [correctionRecordId, setCorrectionRecordId] = useState('');
  const [correctionNewStatus, setCorrectionNewStatus] = useState<'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'>('PRESENT');
  const [correctionReason, setCorrectionReason] = useState('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  // Cancel Session Modal
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelSessionId, setCancelSessionId] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchHODShortage = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterDept !== 'all') params.department_id = filterDept;
      if (filterSem !== 'all') params.semester_id = filterSem;
      if (filterSec !== 'all') params.section_id = filterSec;

      const res = await client.get('/attendance/hod/overview', { params });
      if (res.data && res.data.shortage_students) {
        setShortageStudents(res.data.shortage_students);
      }
    } catch (err) {
      console.error('Error fetching HOD shortage students:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterDept, filterSem, filterSec]);

  const fetchAdminOverview = useCallback(async () => {
    try {
      const res = await client.get('/attendance/admin/overview');
      if (res.data && res.data.data) {
        setAdminOverview(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin overview:', err);
    }
  }, []);

  const fetchMetadata = useCallback(async () => {
    try {
      const [dRes, semRes, secRes] = await Promise.allSettled([
        client.get('/v1/academic/departments'),
        client.get('/v1/academic/semesters'),
        client.get('/academic/sections')
      ]);

      if (dRes.status === 'fulfilled' && dRes.value.data) {
        setDepartments(Array.isArray(dRes.value.data) ? dRes.value.data : dRes.value.data.data || []);
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
    fetchAdminOverview();
  }, [fetchMetadata, fetchAdminOverview]);

  useEffect(() => {
    fetchHODShortage();
  }, [fetchHODShortage]);

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionRecordId || !correctionReason.trim()) {
      showToast('Record ID and Correction Reason are required.', 'error');
      return;
    }

    setIsSubmittingCorrection(true);
    try {
      const res = await client.post('/attendance/admin/correct', {
        record_id: Number(correctionRecordId),
        new_status: correctionNewStatus,
        reason: correctionReason.trim()
      });

      if (res.data && res.data.success) {
        showToast(res.data.message || 'Attendance correction processed.');
        setIsCorrectionOpen(false);
        setCorrectionReason('');
        fetchHODShortage();
        fetchAdminOverview();
      }
    } catch (err: any) {
      showToast('Correction execution failed.', 'error');
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const handleCancelSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelSessionId || !cancelReason.trim()) {
      showToast('Session ID and Cancellation Reason are required.', 'error');
      return;
    }

    setIsSubmittingCancel(true);
    try {
      const res = await client.post('/attendance/admin/cancel-session', {
        session_id: Number(cancelSessionId),
        reason: cancelReason.trim()
      });

      if (res.data && res.data.success) {
        showToast(res.data.message || 'Class session cancelled.');
        setIsCancelOpen(false);
        setCancelReason('');
        fetchHODShortage();
        fetchAdminOverview();
      }
    } catch (err: any) {
      showToast('Class cancellation failed.', 'error');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const filteredShortage = shortageStudents.filter(st => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (st.roll_number && st.roll_number.toLowerCase().includes(term)) ||
      (st.first_name && st.first_name.toLowerCase().includes(term)) ||
      (st.last_name && st.last_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">

      {/* Toast */}
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
            Attendance Administration & Shortage Control
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Department attendance overview, shortage list (< 75%), session cancellations, and authorized corrections audit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCancelOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel Class Session</span>
          </button>

          <button
            onClick={() => setIsCorrectionOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <Edit3 className="w-4 h-4" />
            <span>Attendance Correction</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Scheduled Sessions</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{adminOverview?.total_sessions || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Completed Sessions</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{adminOverview?.submitted_sessions || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 shadow-xs">
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase">Overall Attendance Rate</p>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">{adminOverview?.overall_attendance_percentage || 100}%</p>
        </div>

        <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 shadow-xs">
          <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold uppercase">Shortage Students (&lt; 75%)</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-300 mt-1">{shortageStudents.length} Students</p>
        </div>
      </div>

      {/* Shortage List Section */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Attendance Shortage Roster (&lt; 75%)
          </h3>

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
              value={filterSec}
              onChange={(e) => setFilterSec(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Sections</option>
              {sections.map(sec => <option key={sec.id} value={sec.id}>Section {sec.name}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Calculating department shortage roster...</div>
          ) : filteredShortage.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No students currently fall below the 75% attendance threshold.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Department & Section</th>
                  <th className="px-4 py-3 text-center">Attended / Total Sessions</th>
                  <th className="px-4 py-3 text-center">Percentage</th>
                  <th className="px-4 py-3 text-right">Shortage Gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredShortage.map((st) => (
                  <tr key={st.student_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3 font-mono font-bold text-red-600 dark:text-red-400">
                      {st.roll_number || st.admission_number || 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {st.first_name} {st.last_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {st.department_name || 'Department'} • Section {st.section_name || 'A'}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">
                      <span className="text-emerald-600 font-bold">{st.present_sessions}</span> / <span className="text-slate-800 dark:text-slate-200 font-bold">{st.total_sessions}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-extrabold text-red-600 dark:text-red-400">
                      {st.percentage}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-300">
                        -{(75.0 - st.percentage).toFixed(2)}% below 75%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Attendance Correction Modal */}
      {isCorrectionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attendance Correction & Audit Log</h3>
              <button onClick={() => setIsCorrectionOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Attendance Record ID *</label>
                <input
                  type="number"
                  value={correctionRecordId}
                  onChange={(e) => setCorrectionRecordId(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Attendance Status *</label>
                <select
                  value={correctionNewStatus}
                  onChange={(e) => setCorrectionNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="LATE">LATE</option>
                  <option value="EXCUSED">EXCUSED</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mandatory Correction Reason *</label>
                <textarea
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Approved medical leave certificate verified by HOD..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCorrectionOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCorrection}
                  className="px-4 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md"
                >
                  Execute Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Class Session Modal */}
      {isCancelOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cancel Scheduled Class Session</h3>
              <button onClick={() => setIsCancelOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <form onSubmit={handleCancelSessionSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Attendance Session ID *</label>
                <input
                  type="number"
                  value={cancelSessionId}
                  onChange={(e) => setCancelSessionId(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cancellation Reason *</label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Faculty on official duty / National Holiday..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCancelOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancel}
                  className="px-4 py-2 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md"
                >
                  Cancel Class Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
