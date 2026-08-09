import { Briefcase, Upload, CheckCircle, Clock, Search } from "lucide-react";
import { Card, Badge, Btn, Avatar } from "../App";

export function PlacementModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Placement Cell</h2>
          <p className="text-sm text-slate-500">Apply for campus drives and track your applications.</p>
        </div>
        <Btn variant="primary" icon={<Upload size={14} />}>Update Resume</Btn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">Upcoming Drives</h3>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search companies..." className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { company: "TechNova Solutions", role: "Software Engineer", pkg: "12 LPA", date: "June 10", eligible: true },
                { company: "Global Systems Inc", role: "Data Analyst", pkg: "9 LPA", date: "June 15", eligible: true },
                { company: "Quant Trading", role: "SDE - 1", pkg: "24 LPA", date: "June 20", eligible: false, reason: "Requires 9.5+ CGPA" },
              ].map((d, i) => (
                <div key={i} className={`p-4 border rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${d.eligible ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 opacity-75'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                      {d.company.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{d.company}</h4>
                      <p className="text-xs text-slate-500">{d.role} • {d.pkg}</p>
                      {!d.eligible && <p className="text-[10px] text-red-500 mt-1">Not Eligible: {d.reason}</p>}
                    </div>
                  </div>
                  <div>
                    {d.eligible ? (
                      <Btn variant="outline" size="sm">Apply by {d.date}</Btn>
                    ) : (
                      <Badge variant="danger">Not Eligible</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">My Applications</h3>
            <div className="space-y-3">
              {[
                { company: "CloudCorp", status: "Interview Scheduled", date: "Tomorrow, 10 AM" },
                { company: "DataFlow", status: "Aptitude Cleared", date: "Awaiting next steps" },
                { company: "NextGen Web", status: "Applied", date: "May 28" }
              ].map((a, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <h4 className="font-medium text-slate-900 dark:text-white text-sm">{a.company}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={a.status.includes('Scheduled') || a.status.includes('Cleared') ? 'success' : 'info'} size="sm">{a.status}</Badge>
                    <span className="text-[10px] text-slate-400">{a.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Eligibility Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">CGPA (9.2)</span>
                <CheckCircle size={16} className="text-emerald-500" />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Active Backlogs (0)</span>
                <CheckCircle size={16} className="text-emerald-500" />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Attendance &gt; 75%</span>
                <CheckCircle size={16} className="text-emerald-500" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
