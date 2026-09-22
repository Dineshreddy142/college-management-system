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
        <div className="p-8 text-center">
          <p className="text-xs text-slate-400">No counseling session records available.</p>
        </div>
      </Card>
    </div>
  );
}
