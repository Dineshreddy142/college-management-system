import { BookOpen, Download, User } from "lucide-react";
import { Card, Badge, Btn, Avatar } from "../App";

export function AcademicsModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Academics</h2>
          <p className="text-sm text-slate-500">View syllabus, subjects, and study materials.</p>
        </div>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Semester 6 Subjects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { sub: "Data Structures", code: "CS301", credits: 4, faculty: "Dr. Ramesh Gupta", type: "Core" },
            { sub: "Mathematics III", code: "MA301", credits: 4, faculty: "Dr. S. Sharma", type: "Core" },
            { sub: "Digital Circuits", code: "EC301", credits: 3, faculty: "Prof. K. Verma", type: "Core" },
            { sub: "Cloud Computing", code: "CS305", credits: 3, faculty: "Dr. A. Singh", type: "Elective" },
            { sub: "OS Lab", code: "CS302", credits: 2, faculty: "Prof. D. Joshi", type: "Lab" },
          ].map((s, i) => (
            <div key={i} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <BookOpen size={20} />
                </div>
                <Badge variant={s.type === 'Core' ? 'info' : s.type === 'Lab' ? 'warning' : 'default'}>{s.type}</Badge>
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white leading-tight">{s.sub}</h4>
              <p className="text-xs text-slate-500 mt-1">{s.code} • {s.credits} Credits</p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Avatar name={s.faculty} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{s.faculty}</p>
                  <p className="text-[10px] text-slate-400">Course Instructor</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Btn variant="outline" size="sm" className="w-full">Syllabus</Btn>
                <Btn variant="primary" size="sm" className="w-full" icon={<Download size={14}/>}>Material</Btn>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
