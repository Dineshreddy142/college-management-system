import { Menu, LogOut, Sun, Moon } from "lucide-react";
import { Avatar } from "../App";
import { STUDENT_SIDEBAR_ITEMS } from "./StudentSidebar";
import { useAuth } from "../portal/AuthContext";

export function StudentTopNav({ module, theme, toggleTheme, collapsed, onToggleSidebar, onNav }: {
  module: string; theme: string; toggleTheme: () => void; collapsed: boolean; onToggleSidebar: () => void;
  onNav: (v: string) => void;
}) {
  const { user } = useAuth();
  const currentModule = STUDENT_SIDEBAR_ITEMS.find(m => m.id === module);
  const title = currentModule ? currentModule.label : "Dashboard";
  
  const studentName = user?.name || user?.full_name || user?.username || "Student User";
  
  return (
    <div className="h-16 bg-white dark:bg-slate-900 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 gap-4 flex-shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebar} 
          className="p-2 -ml-2 rounded-md text-[#64748B] hover:text-[#0F172A] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white tracking-tight leading-tight">{title}</h1>
          <p className="text-[11px] text-[#64748B] dark:text-slate-400">Academic Student Portal</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button onClick={toggleTheme} className="p-2 rounded-md text-[#64748B] hover:text-[#0F172A] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Toggle Theme">
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <div className="w-px h-5 bg-[#E2E8F0] dark:bg-slate-700 mx-1"></div>
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-[#0F172A] dark:text-white leading-tight capitalize">{studentName}</p>
            <p className="text-[11px] text-[#64748B] dark:text-slate-400">{user?.email || 'Student'}</p>
          </div>
          <Avatar name={studentName} size="sm" />
        </div>
        <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); onNav("landing"); }} className="p-2 rounded-lg text-[#64748B] hover:text-[#B91C1C] hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors" title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
