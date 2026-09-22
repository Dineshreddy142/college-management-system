import { useState } from "react";
import { Plus, Video, Users, MapPin, Calendar, Clock, Download, FileText } from "lucide-react";
import { Card, Badge, Btn, Avatar } from "../../App";

export function ParentMeetings() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Parent Communication</h2>
          <p className="text-sm text-slate-500">Schedule and record meetings with parents.</p>
        </div>
        <Btn variant="primary" icon={<Plus size={16} />} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Schedule Meeting"}
        </Btn>
      </div>

      {showForm && (
        <Card className="p-5 border-2 border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-900/10">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Schedule New Meeting</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Select Student</label>
              <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Student</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Meeting Date & Time</label>
              <input type="datetime-local" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Meeting Mode</label>
              <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>Offline (Campus)</option>
                <option>Online (G-Meet/Zoom)</option>
                <option>Phone Call</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Agenda / Reason</label>
              <input type="text" placeholder="e.g. Discuss attendance drop" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Btn variant="outline" icon={<Calendar size={14} />}>Add to Calendar</Btn>
            <Btn variant="primary">Send Invite</Btn>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-8 text-center text-slate-400 text-sm col-span-full">
          No parent meetings scheduled.
        </Card>
      </div>
    </div>
  );
}
