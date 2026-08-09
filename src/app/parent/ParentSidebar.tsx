import { 
  Home, Users, UserCheck, Award, FileText, Calendar, 
  CheckCircle, DollarSign, BookOpen, Trophy, Flag, 
  Clock, MessageSquare, Settings, ChevronLeft, ChevronRight, Map
} from "lucide-react";
import { cn } from "../App";

export function ParentSidebar({ active, onChange, collapsed, onToggle, onNav }: { 
  active: string; 
  onChange: (v: string) => void; 
  collapsed: boolean; 
  onToggle: () => void;
  onNav: (v: string) => void;
}) {
  const menu = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={20} /> },
    { id: "children", label: "My Children", icon: <Users size={20} /> },
    { id: "attendance", label: "Attendance", icon: <UserCheck size={20} /> },
    { id: "academics", label: "Academics", icon: <Award size={20} /> },
    { id: "timetable", label: "Timetable", icon: <Calendar size={20} /> },
    { id: "assignments", label: "Assignments", icon: <FileText size={20} /> },
    { id: "examination", label: "Examination", icon: <CheckCircle size={20} /> },
    { id: "fees", label: "Fee Management", icon: <DollarSign size={20} /> },
    { id: "library", label: "Library", icon: <BookOpen size={20} /> },
    { id: "placement", label: "Placement", icon: <Trophy size={20} /> },
    { id: "events", label: "Events & Meetings", icon: <Flag size={20} /> },
    { id: "leaves", label: "Leave Requests", icon: <Clock size={20} /> },
    { id: "communication", label: "Communication", icon: <MessageSquare size={20} /> },
    { id: "profile", label: "Profile", icon: <Settings size={20} /> },
  ];

  return (
    <aside className={cn(
      "bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-all duration-300 flex flex-col relative z-20",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 shrink-0 justify-between">
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <Home size={15} className="text-white" />
          </div>
          {!collapsed && <span className="text-sm font-bold text-slate-900 dark:text-white">EduERP</span>}
          {!collapsed && <span className="text-xs text-slate-400 font-medium">· Parent</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <nav className="px-3 space-y-1">
          {menu.map((item) => (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                active === item.id 
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-medium" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <div className={cn("shrink-0", active === item.id ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500")}>
                {item.icon}
              </div>
              {!collapsed && <span className="text-sm whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : (
            <>
              <ChevronLeft size={18} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
