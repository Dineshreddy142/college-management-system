import { AlertCircle, Plus, Search } from "lucide-react";
import { Card, Badge, Btn } from "../App";

export function ComplaintsModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Grievance & Complaints</h2>
          <p className="text-sm text-slate-500">Raise issues related to infrastructure, academics, or hostel.</p>
        </div>
        <Btn variant="primary" icon={<Plus size={14} />}>Raise Complaint</Btn>
      </div>

      <Card className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">My Complaints</h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search ticket ID..." className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
          </div>
        </div>
        
        <div className="space-y-3">
          {[
            { id: "TKT-0012", type: "Hostel Maintenance", desc: "Fan not working in Room 302", status: "Resolved", date: "May 10" },
            { id: "TKT-0045", type: "Academics", desc: "Attendance discrepancy in OS Lab", status: "In Progress", date: "June 2" },
            { id: "TKT-0078", type: "IT Infrastructure", desc: "Wi-Fi extremely slow in library", status: "Open", date: "Yesterday" },
          ].map((c, i) => (
            <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-slate-200 text-slate-700">{c.id}</Badge>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{c.type}</span>
                </div>
                <Badge variant={c.status === 'Resolved' ? 'success' : c.status === 'In Progress' ? 'warning' : 'danger'}>{c.status}</Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{c.desc}</p>
              <p className="text-xs text-slate-400 mt-3 flex items-center gap-1"><AlertCircle size={12}/> Raised: {c.date}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
