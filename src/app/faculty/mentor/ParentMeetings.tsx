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
                <option>Arjun Sharma (CS2021001)</option>
                <option>Priya Patel (CS2021045)</option>
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
        {[
          { 
            student: "Priya Patel", parent: "Mr. Ramesh Patel", date: "Tomorrow, 10:00 AM",
            mode: "Online", agenda: "Low Attendance & Backlogs", status: "Scheduled", icon: <Video size={16} />
          },
          { 
            student: "Vikram Singh", parent: "Mrs. Sunita Singh", date: "Oct 28, 02:30 PM",
            mode: "Offline", agenda: "Disciplinary Issue", status: "Confirmed", icon: <Users size={16} />
          },
          { 
            student: "Arjun Sharma", parent: "Mr. Sharma", date: "Oct 15, 11:00 AM",
            mode: "Phone", agenda: "Placement Preparation", status: "Completed", icon: <MapPin size={16} />
          }
        ].map((m, i) => (
          <Card key={i} className="p-5 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <Badge variant={m.status === 'Completed' ? 'success' : m.status === 'Confirmed' ? 'info' : 'warning'}>{m.status}</Badge>
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                {m.icon}
              </div>
            </div>
            
            <div className="mb-4 flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Avatar name={m.student} size="sm" /> {m.student}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Parent: {m.parent}</p>
            </div>
            
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Clock size={14} /> {m.date}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <FileText size={14} className="text-transparent" /> Agenda: {m.agenda}
              </div>
            </div>
            
            {m.status === 'Completed' ? (
              <Btn variant="outline" size="sm" className="w-full justify-center" icon={<Download size={14} />}>Download MoM</Btn>
            ) : (
              <div className="flex gap-2">
                <Btn variant="outline" size="sm" className="flex-1 justify-center">Reschedule</Btn>
                <Btn variant="primary" size="sm" className="flex-1 justify-center">Join / Start</Btn>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
