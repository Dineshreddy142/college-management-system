import { useState } from "react";
import { Plus, Building, BookOpen, Clock, Calendar as CalendarIcon, Users } from "lucide-react";
import { Card, Badge, Btn, cn } from "../../App";

export function AcademicStructure() {
  const [activeTab, setActiveTab] = useState("departments");

  const renderContent = () => {
    switch(activeTab) {
      case "departments": return <DepartmentsView />;
      case "sessions": return <SessionsView />;
      case "courses": return <CoursesView />;
      case "sections": return <SectionsView />;
      default: return <DepartmentsView />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Academic Structure</h2>
          <p className="text-sm text-slate-500">Manage Departments, Courses, Sessions, and Sections hierarchy.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="primary" size="sm" icon={<Plus size={16} />}>Add New</Btn>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {[
          { id: "departments", label: "Departments", icon: <Building size={16} /> },
          { id: "courses", label: "Courses", icon: <BookOpen size={16} /> },
          { id: "sessions", label: "Academic Sessions", icon: <CalendarIcon size={16} /> },
          { id: "sections", label: "Sections", icon: <Users size={16} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn("flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === t.id ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200")}>
            {t.icon} <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  );
}

function DepartmentsView() {
  const depts = [
    { id: 1, name: "Computer Science Engineering", code: "CSE", courses: 3, faculties: 45, status: "Active" },
    { id: 2, name: "Information Technology", code: "IT", courses: 2, faculties: 30, status: "Active" },
    { id: 3, name: "Electronics & Comm", code: "ECE", courses: 2, faculties: 38, status: "Active" },
  ];
  return (
    <Card className="p-0 overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
          <tr>
            <th className="px-5 py-4">Department Name</th>
            <th className="px-5 py-4">Code</th>
            <th className="px-5 py-4 text-center">Courses</th>
            <th className="px-5 py-4 text-center">Faculties</th>
            <th className="px-5 py-4 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {depts.map(d => (
            <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">{d.name}</td>
              <td className="px-5 py-4 font-mono text-xs text-slate-500">{d.code}</td>
              <td className="px-5 py-4 text-center">{d.courses}</td>
              <td className="px-5 py-4 text-center">{d.faculties}</td>
              <td className="px-5 py-4 text-right"><Badge variant="success" size="sm">{d.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function SessionsView() {
  const sessions = [
    { id: 1, name: "2025-2026", start: "Aug 2025", end: "May 2026", status: "Upcoming" },
    { id: 2, name: "2024-2025", start: "Aug 2024", end: "May 2025", status: "Current" },
    { id: 3, name: "2023-2024", start: "Aug 2023", end: "May 2024", status: "Completed" },
  ];
  return (
    <Card className="p-0 overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
          <tr>
            <th className="px-5 py-4">Session Name</th>
            <th className="px-5 py-4">Start Date</th>
            <th className="px-5 py-4">End Date</th>
            <th className="px-5 py-4 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {sessions.map(s => (
            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">{s.name}</td>
              <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{s.start}</td>
              <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{s.end}</td>
              <td className="px-5 py-4 text-right">
                <Badge variant={s.status === 'Current' ? 'info' : s.status === 'Upcoming' ? 'warning' : 'default'} size="sm">
                  {s.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function CoursesView() {
  const courses = [
    { id: 1, name: "B.Tech", dept: "Computer Science Engineering", duration: "4 Years", semesters: 8 },
    { id: 2, name: "M.Tech", dept: "Computer Science Engineering", duration: "2 Years", semesters: 4 },
  ];
  return (
    <Card className="p-0 overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
          <tr>
            <th className="px-5 py-4">Course Name</th>
            <th className="px-5 py-4">Department</th>
            <th className="px-5 py-4 text-center">Duration</th>
            <th className="px-5 py-4 text-center">Semesters</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {courses.map(c => (
            <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">{c.name}</td>
              <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{c.dept}</td>
              <td className="px-5 py-4 text-center">{c.duration}</td>
              <td className="px-5 py-4 text-center">{c.semesters}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function SectionsView() {
  const sections = [
    { id: 1, name: "Sec A", course: "B.Tech (CSE)", year: "2nd Year", sem: "Semester 3", capacity: 60 },
    { id: 2, name: "Sec B", course: "B.Tech (CSE)", year: "2nd Year", sem: "Semester 3", capacity: 60 },
  ];
  return (
    <Card className="p-0 overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
          <tr>
            <th className="px-5 py-4">Section Name</th>
            <th className="px-5 py-4">Course</th>
            <th className="px-5 py-4">Year & Semester</th>
            <th className="px-5 py-4 text-center">Capacity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {sections.map(s => (
            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">{s.name}</td>
              <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{s.course}</td>
              <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{s.year} • {s.sem}</td>
              <td className="px-5 py-4 text-center">{s.capacity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
