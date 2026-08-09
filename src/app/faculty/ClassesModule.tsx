import { useState, useEffect } from "react";
import { BookOpen, Users, Search, Filter } from "lucide-react";
import { Card, Badge, Btn, PBar } from "../App";
import client from "../../api/client";

export function ClassesModule() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await client.get('/faculty/classes');
        setClasses(res.data);
      } catch (err) {
        console.error(err);
        // Mock fallback if backend is not fully seeded
        setClasses([
          { allocation_id: 1, subject_name: "Data Structures", subject_code: "CS301", section_name: "A", semester_name: "Semester 3", course_name: "Computer Science", student_count: 52 },
          { allocation_id: 2, subject_name: "Data Structures", subject_code: "CS301", section_name: "B", semester_name: "Semester 3", course_name: "Computer Science", student_count: 48 },
          { allocation_id: 3, subject_name: "Algorithms", subject_code: "CS401", section_name: "A", semester_name: "Semester 4", course_name: "Computer Science", student_count: 44 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Assigned Classes</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search classes..." className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64" />
          </div>
          <Btn variant="outline" icon={<Filter size={14} />}>Filter</Btn>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((c, i) => (
            <Card key={i} className="p-5" hover>
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <BookOpen size={20} />
                </div>
                <Badge variant="info">{c.course_name}</Badge>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{c.subject_name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{c.subject_code} • Section {c.section_name}</p>
              
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Users size={14} /> Students</span>
                  <span className="font-medium text-slate-900 dark:text-white">{c.student_count}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Semester</span>
                  <span className="font-medium text-slate-900 dark:text-white">{c.semester_name}</span>
                </div>
              </div>
              
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Btn variant="outline" size="sm" className="w-full">View Students</Btn>
                <Btn variant="primary" size="sm" className="w-full">Mark Attendance</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
