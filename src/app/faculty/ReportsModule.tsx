import { BarChart3, Download, FileText } from "lucide-react";
import { Card, Btn } from "../App";

export function ReportsModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reports & Analytics</h2>
          <p className="text-sm text-slate-500">Generate and export class performance reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          { title: "Attendance Report", desc: "Monthly attendance analysis per class." },
          { title: "Marks Report", desc: "Detailed marks and grading sheets." },
          { title: "Student Performance", desc: "Overall performance and risk analysis." },
        ].map((r, i) => (
          <Card key={i} className="p-5 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                <FileText size={20} />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{r.title}</h3>
              <p className="text-sm text-slate-500 mb-6">{r.desc}</p>
            </div>
            <Btn variant="outline" className="w-full" icon={<Download size={14} />}>Export PDF</Btn>
          </Card>
        ))}
      </div>
    </div>
  );
}
