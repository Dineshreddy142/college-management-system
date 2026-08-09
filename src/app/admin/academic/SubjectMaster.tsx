import { useState, useEffect } from "react";
import { Search, Filter, Plus, Edit, Trash2, BookOpen, Upload, Download, MoreVertical, Copy } from "lucide-react";
import { Card, Badge, Btn, cn } from "../../App";

export function SubjectMaster() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a real app, this would be an API call to /api/academic/subjects
    setSubjects([
      { id: 1, code: "CS301", name: "Data Structures", dept: "Computer Science", course: "B.Tech", year: 2, sem: "Semester 3", credits: 4, type: "Core", status: "Active" },
      { id: 2, code: "CS302", name: "Operating Systems", dept: "Computer Science", course: "B.Tech", year: 2, sem: "Semester 3", credits: 4, type: "Core", status: "Active" },
      { id: 3, code: "CS303", name: "Database Systems", dept: "Computer Science", course: "B.Tech", year: 2, sem: "Semester 3", credits: 4, type: "Core", status: "Active" },
      { id: 4, code: "CS304", name: "Java Programming Lab", dept: "Computer Science", course: "B.Tech", year: 2, sem: "Semester 3", credits: 2, type: "Lab", status: "Active" },
      { id: 5, code: "IT401", name: "Web Technologies", dept: "Information Tech", course: "B.Tech", year: 3, sem: "Semester 5", credits: 3, type: "Core", status: "Active" },
    ]);
  }, []);

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Core': return 'primary';
      case 'Elective': return 'purple';
      case 'Lab': return 'warning';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Subject Master</h2>
          <p className="text-sm text-slate-500">Manage academic subjects, credits, and syllabus details.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="outline" size="sm" icon={<Upload size={16} />}>Import</Btn>
          <Btn variant="outline" size="sm" icon={<Download size={16} />}>Export</Btn>
          <Btn variant="primary" size="sm" icon={<Plus size={16} />}>Add Subject</Btn>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-900/20">
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by code or name..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Departments</option>
              <option value="cs">Computer Science</option>
              <option value="it">Information Tech</option>
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Types</option>
              <option value="Core">Core</option>
              <option value="Elective">Elective</option>
              <option value="Lab">Lab</option>
            </select>
            <Btn variant="outline" icon={<Filter size={14} />}>Filters</Btn>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
              <tr>
                <th className="px-5 py-4">Subject Code & Name</th>
                <th className="px-5 py-4">Department & Course</th>
                <th className="px-5 py-4">Semester</th>
                <th className="px-5 py-4">Type & Credits</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {subjects.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900 dark:text-white">{s.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{s.code}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-900 dark:text-slate-300">{s.dept}</p>
                    <p className="text-xs text-slate-500">{s.course} - Year {s.year}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                    {s.sem}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2 items-center">
                      <Badge variant={getTypeColor(s.type) as any} size="sm">{s.type}</Badge>
                      <span className="text-xs font-medium text-slate-500">{s.credits} CR</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={s.status === 'Active' ? 'success' : 'neutral'} size="sm">{s.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500 rounded-lg transition-colors" title="Edit"><Edit size={15} /></button>
                      <button className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500 rounded-lg transition-colors" title="Duplicate"><Copy size={15} /></button>
                      <button className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
