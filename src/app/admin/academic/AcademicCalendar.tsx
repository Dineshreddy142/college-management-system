import { useState } from "react";
import { Plus, Calendar, Clock, Flag, Search, Edit, Trash2 } from "lucide-react";
import { Card, Badge, Btn } from "../../App";

export function AcademicCalendar() {
  const [events] = useState([
    { id: 1, title: "Odd Semester Starts", date: "2025-08-01", type: "Event", visibility: "All" },
    { id: 2, name: "Independence Day", date: "2025-08-15", type: "Holiday", visibility: "All" },
    { id: 3, title: "Mid-Term Examinations", date: "2025-10-10", type: "Exam", visibility: "Students" },
    { id: 4, title: "Parent-Teacher Meeting", date: "2025-10-25", type: "Parent Meeting", visibility: "Parents" },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Academic Calendar</h2>
          <p className="text-sm text-slate-500">Manage academic dates, events, exams, and holidays for the session.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="outline" size="sm" icon={<Flag size={16} />}>Manage Holidays</Btn>
          <Btn variant="primary" size="sm" icon={<Plus size={16} />}>Add Event</Btn>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" /> Upcoming Schedule
              </h3>
              <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm">
                <option>All Event Types</option>
                <option>Exams</option>
                <option>Holidays</option>
              </select>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {events.map(e => (
                <div key={e.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400">
                      <span className="text-xs font-medium uppercase">{new Date(e.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-lg font-bold leading-none">{new Date(e.date).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{e.title || e.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant={e.type === 'Holiday' ? 'success' : e.type === 'Exam' ? 'danger' : 'default'} size="sm">{e.type}</Badge>
                        <span className="text-xs text-slate-500 flex items-center gap-1"><UsersIcon size={12} /> {e.visibility}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-blue-500 rounded-lg"><Edit size={16} /></button>
                    <button className="p-2 text-slate-400 hover:text-red-500 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Working Days</span>
                <span className="font-medium text-slate-900 dark:text-white">184</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Holidays</span>
                <span className="font-medium text-slate-900 dark:text-white">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Exam Days</span>
                <span className="font-medium text-slate-900 dark:text-white">18</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function UsersIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  );
}
