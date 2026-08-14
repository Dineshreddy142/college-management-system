import { 
  LayoutDashboard, User, UserCheck, BookOpen, Clock, FileText, 
  Award, BarChart3, DollarSign, Library as LibraryIcon, Briefcase, 
  CalendarDays, Calendar, MessageSquare, Folder, AlertCircle, 
  Zap, TrendingUp, GraduationCap, ChevronLeft, Map 
} from "lucide-react";
import { cn } from "../App";

export const STUDENT_SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
  { id: "profile", label: "My Profile", icon: User, badge: null },
  { id: "attendance", label: "Attendance", icon: UserCheck, badge: "88%" },
  { id: "my-subjects", label: "My Subjects", icon: BookOpen, badge: "Registration" },
  { id: "academics", label: "Academics", icon: BookOpen, badge: null },
  { id: "timetable", label: "Timetable", icon: Clock, badge: null },
  { id: "assignments", label: "Assignments", icon: FileText, badge: "3 Due" },
  { id: "examination", label: "Examination", icon: Award, badge: null },
  { id: "results", label: "Results", icon: BarChart3, badge: "New" },
  { id: "fees", label: "Fees", icon: DollarSign, badge: null },
  { id: "library", label: "Library", icon: LibraryIcon, badge: null },
  { id: "placement", label: "Placement", icon: Briefcase, badge: null },
  { id: "events", label: "Events", icon: CalendarDays, badge: null },
  { id: "leaves", label: "Leave Management", icon: Calendar, badge: null },
  { id: "communication", label: "Communication", icon: MessageSquare, badge: null },
  { id: "documents", label: "Documents", icon: Folder, badge: null },
  { id: "complaints", label: "Complaints", icon: AlertCircle, badge: null },
  { id: "analytics", label: "Analytics", icon: TrendingUp, badge: null },
  { id: "ai", label: "AI Assistant", icon: Zap, badge: "Beta" },
];

export function StudentSidebar({ active, onChange, collapsed, onToggle, onNav }: {
  active: string; onChange: (m: string) => void;
  collapsed: boolean; onToggle: () => void; onNav: (v: string) => void;
}) {
  return (
    <div className={cn("h-screen bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0", collapsed ? "w-16" : "w-64")}>
      {/* Logo */}
      <div className={cn("flex items-center h-16 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 px-4", collapsed ? "justify-center" : "justify-between px-5")}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNav('landing')}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <GraduationCap size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">EduERP</p>
              <p className="text-xs text-slate-400 mt-0.5">Student Portal</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm cursor-pointer" onClick={() => onNav('landing')}>
            <GraduationCap size={15} className="text-white" />
          </div>
        )}
        {!collapsed && (
          <button onClick={onToggle} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <ChevronLeft size={15} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {STUDENT_SIDEBAR_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-left",
                isActive 
                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <div className={cn("relative flex-shrink-0 transition-transform duration-200", isActive && "scale-110")}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              {!collapsed && (
                <div className="flex-1 flex justify-between items-center min-w-0">
                  <span className="text-sm truncate">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold leading-tight",
                      isActive 
                        ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
