import { useState } from "react";
import { Plus, User, FileText, CheckCircle, Clock } from "lucide-react";
import { Card, Badge, Btn, Avatar } from "../../App";

export function CounselingModule() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Counseling Sessions</h2>
          <p className="text-sm text-slate-500">Record and track 1-on-1 counseling history.</p>
        </div>
        <Btn variant="primary" icon={<Plus size={16} />} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New Session"}
        </Btn>
      </div>

      {showForm && (
        <Card className="p-5 border-2 border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-900/10">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Record New Session</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Select Student</label>
              <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>Arjun Sharma (CS2021001)</option>
                <option>Priya Patel (CS2021045)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Session Date</label>
              <input type="date" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Discussion Details</label>
              <textarea rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Action Plan</label>
              <textarea rows={2} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
            </div>
          </div>
          <div className="flex justify-end">
            <Btn variant="primary">Save Session</Btn>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Date</th>
                <th className="px-5 py-4 font-medium">Student</th>
                <th className="px-5 py-4 font-medium">Discussion</th>
                <th className="px-5 py-4 font-medium">Action Plan</th>
                <th className="px-5 py-4 font-medium">Follow-up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { date: "Oct 12, 2023", student: "Priya Patel", discussion: "Low attendance and backlogs in OS.", action: "Submit medical proofs. Attend remedial.", followup: "Oct 26, 2023", status: "completed" },
                { date: "Oct 10, 2023", student: "Arjun Sharma", discussion: "Placement preparation for Tier 1.", action: "Mock interview scheduled next week.", followup: "Oct 17, 2023", status: "pending" },
              ].map((s, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{s.date}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={s.student} size="sm" />
                      <span className="font-medium text-slate-900 dark:text-white">{s.student}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">{s.discussion}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">{s.action}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      {s.status === 'completed' ? <CheckCircle size={14} className="text-emerald-500" /> : <Clock size={14} className="text-amber-500" />}
                      {s.followup}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
