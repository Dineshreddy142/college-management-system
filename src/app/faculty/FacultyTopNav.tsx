import { Menu, LogOut, Sun, Moon } from "lucide-react";
import { Avatar } from "../App";

export function FacultyTopNav({ module, theme, toggleTheme, collapsed, onToggleSidebar, onNav }: {
  module: string; theme: string; toggleTheme: () => void; collapsed: boolean; onToggleSidebar: () => void;
  onNav: (v: string) => void;
}) {
  const labels: Record<string, string> = {
    dashboard: "Dashboard", classes: "Class Management", attendance: "Attendance",
    assignments: "Assignments", exams: "Examinations", marks: "Marks Entry",
    students: "Student Management", leaves: "Leave Management", timetable: "Timetable",
    announcements: "Announcements", communication: "Communication", meetings: "Meetings",
    reports: "Reports & Analytics", profile: "Profile", ai: "AI Assistant",
  };
  
  return (
    <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 gap-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        {collapsed && (
          <button onClick={onToggleSidebar} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Menu size={17} />
          </button>
        )}
        <div>
          <h1 className="text-base font-semibold text-slate-900 dark:text-white leading-none">{labels[module] || "Dashboard"}</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Tech University • AY 2023-24</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">Dr. Ramesh Gupta</p>
            <p className="text-xs text-slate-400 mt-0.5">Professor (CS)</p>
          </div>
          <Avatar name="Dr. Ramesh Gupta" size="md" />
        </div>
        <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); onNav("landing"); }} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ml-1" title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
