import { FileText, Search, Upload, Clock } from "lucide-react";
import { Card, Badge, Btn, PBar } from "../App";

export function AssignmentsModule() {
  const assignments = [
    { title: "Sorting Algorithms", sub: "Data Structures", due: "Tomorrow, 11:59 PM", status: "Pending", progress: 0 },
    { title: "Graph Traversal", sub: "Data Structures", due: "Next Week", status: "Submitted", progress: 100 },
    { title: "Fourier Transforms", sub: "Mathematics III", due: "Mar 10, 2024", status: "Graded", grade: "9.5/10", progress: 100 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Assignments</h2>
          <p className="text-sm text-slate-500">Track and submit your coursework.</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search assignments..." className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm w-full sm:w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {assignments.map((a, i) => (
          <Card key={i} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                a.status === 'Graded' ? 'bg-emerald-50 text-emerald-600' :
                a.status === 'Submitted' ? 'bg-blue-50 text-blue-600' :
                'bg-amber-50 text-amber-600'
              }`}>
                <FileText size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-900 dark:text-white">{a.title}</h3>
                  <Badge variant={a.status === 'Graded' ? 'success' : a.status === 'Submitted' ? 'info' : 'warning'}>{a.status}</Badge>
                </div>
                <p className="text-sm text-slate-500">{a.sub}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                  <Clock size={12} />
                  <span>Due: {a.due}</span>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4">
              {a.status === 'Graded' && (
                <div className="text-center md:text-right w-full sm:w-auto">
                  <p className="text-xs text-slate-400">Score</p>
                  <p className="font-bold text-emerald-600">{a.grade}</p>
                </div>
              )}
              {a.status === 'Pending' && (
                <Btn variant="primary" icon={<Upload size={14} />} className="w-full sm:w-auto">Submit Work</Btn>
              )}
              {a.status === 'Submitted' && (
                <Btn variant="outline" className="w-full sm:w-auto">View Submission</Btn>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
