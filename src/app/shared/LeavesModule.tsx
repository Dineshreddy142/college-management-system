import { useState, useEffect, useCallback } from "react";
import { Plus, CheckCircle, Clock, XCircle, Calendar, FileText, X, Check, Loader2, AlertCircle } from "lucide-react";
import { Card, Badge, Btn } from "../App";
import client from "../../api/client";
import { useAuth } from "../portal/AuthContext";

interface LeaveItem {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "Approved" | "Pending" | "Rejected";
  applied_at: string;
  applicant_name?: string;
  applicant_email?: string;
  reviewer_name?: string;
  reviewer_remarks?: string;
}

export function LeavesModule() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [leaveType, setLeaveType] = useState("Medical Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const userRole = (user?.role || '').toLowerCase();
  const isApprover = ['admin', 'chancellor', 'vicechancellor', 'principal', 'dean', 'hod', 'officestaff', 'office'].some(r => userRole.includes(r));

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get('/leaves');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setLeaves(res.data.data);
      }
    } catch (err: any) {
      console.error("Failed to load leaves:", err);
      setError("Failed to fetch leaves from server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const totalLeaves = leaves.length;
  const approvedLeaves = leaves.filter(l => l.status === "Approved").length;
  const pendingLeaves = leaves.filter(l => l.status === "Pending").length;
  const rejectedLeaves = leaves.filter(l => l.status === "Rejected").length;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      setError("Please fill out all fields.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const res = await client.post('/leaves', {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim()
      });

      if (res.data?.success) {
        setSuccessMsg("Leave application submitted successfully!");
        setShowModal(false);
        setReason("");
        setStartDate("");
        setEndDate("");
        await fetchLeaves();
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit leave application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id: number, status: 'Approved' | 'Rejected') => {
    try {
      setActionLoadingId(id);
      const res = await client.patch(`/leaves/${id}/review`, {
        status,
        remarks: status === 'Approved' ? 'Leave granted by departmental authority' : 'Rejected due to academic schedule constraints'
      });

      if (res.data?.success) {
        setLeaves(prev => prev.map(l => l.id === id ? { ...l, status, reviewer_name: user?.name || 'Administrator' } : l));
        setSuccessMsg(`Leave request ${status.toLowerCase()} successfully`);
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update review status");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Leave Management System</h2>
          <p className="text-sm text-slate-500">Apply for student/faculty leave and track real-time departmental approvals.</p>
        </div>
        <Btn variant="primary" icon={<Plus size={14} />} onClick={() => { setError(""); setShowModal(true); }}>
          Apply Leave
        </Btn>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle size={15} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{totalLeaves}</p>
          <p className="text-xs text-slate-500 font-medium">Total Applications</p>
        </Card>
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-emerald-600 mb-1">{approvedLeaves}</p>
          <p className="text-xs text-slate-500 font-medium">Approved</p>
        </Card>
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-amber-500 mb-1">{pendingLeaves}</p>
          <p className="text-xs text-slate-500 font-medium">Pending Review</p>
        </Card>
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-red-500 mb-1">{rejectedLeaves}</p>
          <p className="text-xs text-slate-500 font-medium">Rejected</p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">Leave Audit & Applications</h3>
          <span className="text-xs text-slate-400">Live MySQL Synchronized</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} />
            <span>Loading leave records...</span>
          </div>
        ) : leaves.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No leave applications recorded in database. Click "Apply Leave" to submit a request.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3">Ticket ID</th>
                  {isApprover && <th className="p-3">Applicant</th>}
                  <th className="p-3">Leave Type</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Applied Date</th>
                  <th className="p-3">Status</th>
                  {isApprover && <th className="p-3 text-right">Governance Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaves.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">LV-{l.id}</td>
                    {isApprover && (
                      <td className="p-3">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{l.applicant_name || 'University Member'}</p>
                        <p className="text-[11px] text-slate-400">{l.applicant_email}</p>
                      </td>
                    )}
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{l.leave_type}</td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400">
                      {new Date(l.start_date).toLocaleDateString()} to {new Date(l.end_date).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">{l.reason}</td>
                    <td className="p-3 text-xs text-slate-500">{new Date(l.applied_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Badge 
                        variant={l.status === 'Approved' ? 'success' : l.status === 'Pending' ? 'warning' : 'danger'}
                        size="sm"
                      >
                        {l.status}
                      </Badge>
                    </td>
                    {isApprover && (
                      <td className="p-3 text-right">
                        {l.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleReview(l.id, 'Approved')}
                              disabled={actionLoadingId === l.id}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Check size={12} /> Approve
                            </button>
                            <button
                              onClick={() => handleReview(l.id, 'Rejected')}
                              disabled={actionLoadingId === l.id}
                              className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <X size={12} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {l.reviewer_name ? `By ${l.reviewer_name}` : 'Finalized'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Apply for Official Leave</h3>
            <p className="text-xs text-slate-500 mb-4">Persists directly to university governance database.</p>

            {error && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-1.5">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Leave Type</label>
                <select 
                  value={leaveType} 
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Medical Leave">Medical Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Academic Leave">Academic / On-Duty Leave</option>
                  <option value="Personal Leave">Personal Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">From Date</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">To Date</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason for Leave</label>
                <textarea 
                  rows={3} 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide brief context for leave request..."
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Btn variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Btn>
                <Btn variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
