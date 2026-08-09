import { Users, Search, Download } from "lucide-react";
import { Card, Badge, Btn, Avatar } from "../App";

export function StudentsModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Student Management</h2>
          <p className="text-sm text-slate-500">View profiles and progress of assigned students.</p>
        </div>
        <Btn variant="primary" icon={<Download size={14} />}>Export List</Btn>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { name: "Arjun Sharma", roll: "CS2021001", sem: "Semester 6", cgpa: 9.2 },
            { name: "Priya Patel", roll: "CS2021002", sem: "Semester 6", cgpa: 8.8 },
            { name: "Rahul Kumar", roll: "ME2021003", sem: "Semester 4", cgpa: 7.5 },
          ].map((s, i) => (
            <div key={i} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={s.name} size="lg" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.roll}</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-slate-500">{s.sem}</span>
                <Badge variant="success">CGPA: {s.cgpa}</Badge>
              </div>
              <Btn variant="outline" size="sm" className="w-full mt-3">View Full Profile</Btn>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
