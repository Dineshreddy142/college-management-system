import { Award, Plus, Search } from "lucide-react";
import { Card, Badge, Btn } from "../App";

export function ExamsModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Exam & Marks Management</h2>
          <p className="text-sm text-slate-500">Manage internal exams and enter student marks.</p>
        </div>
        <Btn variant="primary" icon={<Plus size={14} />}>Schedule Exam</Btn>
      </div>

      <Card className="p-5">
        <div className="flex justify-between items-center mb-5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search exams..." className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
          </div>
        </div>
        <div className="space-y-3">
          {[
            { name: "Mid Term - Data Structures", date: "April 10, 2024", status: "Upcoming", class: "CS301-A" },
            { name: "Quiz 1 - Algorithms", date: "March 5, 2024", status: "Marks Pending", class: "CS401-A" },
            { name: "Lab Exam - OS", date: "Feb 20, 2024", status: "Published", class: "CS305-B" }
          ].map((e, i) => (
            <div key={i} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600">
                  <Award size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{e.name}</p>
                  <p className="text-xs text-slate-400">{e.class} • {e.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={e.status === 'Published' ? 'success' : e.status === 'Upcoming' ? 'info' : 'warning'}>{e.status}</Badge>
                <Btn variant="outline" size="sm">{e.status === 'Marks Pending' ? 'Enter Marks' : 'View Details'}</Btn>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
