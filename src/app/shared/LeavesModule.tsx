import { Plus, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, Badge, Btn } from "../App";

export function LeavesModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Leave Management</h2>
          <p className="text-sm text-slate-500">Apply for leave and track approval status.</p>
        </div>
        <Btn variant="primary" icon={<Plus size={14} />}>Apply Leave</Btn>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">5</p>
          <p className="text-xs text-slate-500">Total Leaves Taken</p>
        </Card>
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-emerald-600 mb-1">2</p>
          <p className="text-xs text-slate-500">Approved</p>
        </Card>
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-amber-500 mb-1">1</p>
          <p className="text-xs text-slate-500">Pending</p>
        </Card>
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-red-500 mb-1">0</p>
          <p className="text-xs text-slate-500">Rejected</p>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Leave History</h3>
        <div className="space-y-3">
          {[
            { date: "Oct 20 - Oct 22 (3 days)", reason: "Medical Leave (Fever)", status: "Pending", appliedOn: "Oct 18" },
            { date: "Sept 5 (1 day)", reason: "Personal Reason", status: "Approved", appliedOn: "Sept 1" },
            { date: "Aug 10 - Aug 11 (2 days)", reason: "Family Event", status: "Approved", appliedOn: "Aug 5" },
          ].map((l, i) => (
            <div key={i} className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <div>
                <p className="font-medium text-slate-900 dark:text-white text-sm mb-1">{l.reason}</p>
                <p className="text-xs text-slate-500">{l.date} • Applied on {l.appliedOn}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={l.status === 'Approved' ? 'success' : l.status === 'Pending' ? 'warning' : 'danger'}>
                  <div className="flex items-center gap-1">
                    {l.status === 'Approved' ? <CheckCircle size={12}/> : l.status === 'Pending' ? <Clock size={12}/> : <XCircle size={12}/>}
                    {l.status}
                  </div>
                </Badge>
                {l.status === 'Pending' && <Btn variant="outline" size="sm">Cancel</Btn>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
