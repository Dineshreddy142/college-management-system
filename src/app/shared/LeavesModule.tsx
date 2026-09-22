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
          <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">0</p>
          <p className="text-xs text-slate-500">Total Leaves Taken</p>
        </Card>
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-emerald-600 mb-1">0</p>
          <p className="text-xs text-slate-500">Approved</p>
        </Card>
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-amber-500 mb-1">0</p>
          <p className="text-xs text-slate-500">Pending</p>
        </Card>
        <Card className="p-5 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-bold text-red-500 mb-1">0</p>
          <p className="text-xs text-slate-500">Rejected</p>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Leave History</h3>
        <div className="p-6 text-center text-slate-400 text-sm">
          No leave applications found.
        </div>
      </Card>
    </div>
  );
}
