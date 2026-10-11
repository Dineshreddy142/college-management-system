import { useState, useEffect } from "react";
import { Plus, CheckCircle, Clock, XCircle, Calendar, FileText, X } from "lucide-react";
import { Card, Badge, Btn } from "../App";

interface LeaveItem {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "Approved" | "Pending" | "Rejected";
  appliedAt: string;
}

export function LeavesModule() {
  const [leaves, setLeaves] = useState<LeaveItem[]>(() => {
    try {
      const saved = localStorage.getItem("cms_leave_applications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showModal, setShowModal] = useState(false);
  const [leaveType, setLeaveType] = useState("Medical Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("cms_leave_applications", JSON.stringify(leaves));
    } catch (e) {
      console.error("Failed to save leaves to localStorage", e);
    }
  }, [leaves]);

  const totalLeaves = leaves.length;
  const approvedLeaves = leaves.filter(l => l.status === "Approved").length;
  const pendingLeaves = leaves.filter(l => l.status === "Pending").length;
  const rejectedLeaves = leaves.filter(l => l.status === "Rejected").length;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      setError("Please fill out all fields.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date.");
      return;
    }

    const newLeave: LeaveItem = {
      id: "LV-" + Date.now().toString().slice(-6),
      type: leaveType,
      startDate,
      endDate,
      reason: reason.trim(),
      status: "Pending",
      appliedAt: new Date().toISOString().split("T")[0]
    };

    setLeaves(prev => [newLeave, ...prev]);
    setShowModal(false);
    setReason("");
    setStartDate("");
    setEndDate("");
    setError("");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Leave Management</h2>
          <p className="text-sm text-slate-500">Apply for student/staff leave and track approval status.</p>
        </div>
        <Btn variant="primary" icon={<Plus size={14} />} onClick={() => { setError(""); setShowModal(true); }}>
          Apply Leave
        </Btn>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{totalLeaves}</p>
          <p className="text-xs text-slate-500">Total Leaves Taken</p>
        </Card>
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-emerald-600 mb-1">{approvedLeaves}</p>
          <p className="text-xs text-slate-500">Approved</p>
        </Card>
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-amber-500 mb-1">{pendingLeaves}</p>
          <p className="text-xs text-slate-500">Pending</p>
        </Card>
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-red-500 mb-1">{rejectedLeaves}</p>
          <p className="text-xs text-slate-500">Rejected</p>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Leave History</h3>
        {leaves.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No leave applications recorded yet. Click "Apply Leave" to submit a new request.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Applied Date</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaves.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">{l.id}</td>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{l.type}</td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400">
                      {l.startDate} to {l.endDate}
                    </td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">{l.reason}</td>
                    <td className="p-3 text-xs text-slate-500">{l.appliedAt}</td>
                    <td className="p-3 text-right">
                      <Badge 
                        variant={l.status === 'Approved' ? 'success' : l.status === 'Pending' ? 'warning' : 'danger'}
                        size="sm"
                      >
                        {l.status}
                      </Badge>
                    </td>
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
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Apply for Leave</h3>
            <p className="text-xs text-slate-500 mb-4">Submit leave details for administrative approval.</p>

            {error && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs">
                {error}
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
                <Btn variant="primary" type="submit">Submit Application</Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
