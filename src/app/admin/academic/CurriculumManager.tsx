import { useState } from "react";
import { Plus, Search, Filter, Link, Book, Layers } from "lucide-react";
import { Card, Badge, Btn, cn } from "../../App";

export function CurriculumManager() {
  const [activeTab, setActiveTab] = useState("regulations");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Curriculum & Regulations</h2>
          <p className="text-sm text-slate-500">Manage academic regulations and map subjects to curriculums.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="primary" size="sm" icon={<Plus size={16} />}>Create New</Btn>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {[
          { id: "regulations", label: "Regulations", icon: <Book size={16} /> },
          { id: "curriculum", label: "Curriculum Mapping", icon: <Link size={16} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn("flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === t.id ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200")}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === "regulations" ? <RegulationsView /> : <CurriculumMappingView />}
    </div>
  );
}

function RegulationsView() {
  const regs = [
    { id: 1, name: "R24", year: 2024, description: "New Outcome Based Education Model", status: "Active" },
    { id: 2, name: "R22", year: 2022, description: "Standard Engineering Curriculum", status: "Active" },
    { id: 3, name: "R20", year: 2020, description: "Legacy CBCS Curriculum", status: "Inactive" },
  ];
  return (
    <Card className="p-0 overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
          <tr>
            <th className="px-5 py-4">Regulation Name</th>
            <th className="px-5 py-4">Effective Year</th>
            <th className="px-5 py-4">Description</th>
            <th className="px-5 py-4 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {regs.map(r => (
            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{r.name}</td>
              <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-300">{r.year}</td>
              <td className="px-5 py-4 text-slate-500">{r.description}</td>
              <td className="px-5 py-4 text-right">
                <Badge variant={r.status === 'Active' ? 'success' : 'neutral'} size="sm">{r.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function CurriculumMappingView() {
  const mappings = [
    { id: 1, dept: "Computer Science", course: "B.Tech", reg: "R24", sem: "Semester 3", subjects: 6, credits: 22 },
    { id: 2, dept: "Computer Science", course: "B.Tech", reg: "R22", sem: "Semester 5", subjects: 5, credits: 18 },
  ];
  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50/50 dark:bg-slate-900/20">
        <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm">
          <option>All Regulations</option>
          <option>R24</option>
          <option>R22</option>
        </select>
        <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm">
          <option>All Departments</option>
          <option>Computer Science</option>
        </select>
      </div>
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
          <tr>
            <th className="px-5 py-4">Department & Course</th>
            <th className="px-5 py-4">Regulation</th>
            <th className="px-5 py-4">Semester</th>
            <th className="px-5 py-4 text-center">Total Subjects</th>
            <th className="px-5 py-4 text-center">Total Credits</th>
            <th className="px-5 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {mappings.map(m => (
            <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">
                {m.dept} <span className="text-slate-400 font-normal">({m.course})</span>
              </td>
              <td className="px-5 py-4"><Badge variant="primary" size="sm">{m.reg}</Badge></td>
              <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{m.sem}</td>
              <td className="px-5 py-4 text-center font-medium">{m.subjects}</td>
              <td className="px-5 py-4 text-center font-medium">{m.credits}</td>
              <td className="px-5 py-4 text-right">
                <Btn variant="outline" size="sm">Manage Subjects</Btn>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
