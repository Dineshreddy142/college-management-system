import { 
  LayoutDashboard, BookOpen, UserCheck, FileText, Award, 
  BarChart3, Users, CalendarDays, Clock, Bell, MessageSquare, 
  Phone, Settings, Zap, GraduationCap, ChevronLeft, Shield, Map,
  FileSpreadsheet
} from "lucide-react";
import { cn } from "../App";

export const FACULTY_SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
  { id: "bulk-data", label: "Bulk Excel Hub", icon: FileSpreadsheet, badge: "Sync" },
  { id: "mentor", label: "Mentor Portal", icon: Shield, badge: "New" },
  { id: "classes", label: "Classes", icon: BookOpen, badge: null },
  { id: "attendance", label: "Attendance", icon: UserCheck, badge: "Pending" },
  { id: "assignments", label: "Assignments", icon: FileText, badge: "3" },
  { id: "exams", label: "Examinations", icon: Award, badge: null },
  { id: "marks", label: "Marks Entry", icon: BarChart3, badge: null },
  { id: "students", label: "Students", icon: Users, badge: null },
  { id: "leaves", label: "Leaves", icon: CalendarDays, badge: null },
  { id: "timetable", label: "Timetable", icon: Clock, badge: null },
  { id: "announcements", label: "Announcements", icon: Bell, badge: null },
  { id: "communication", label: "Communication", icon: MessageSquare, badge: null },
  { id: "meetings", label: "Meetings", icon: Phone, badge: null },
  { id: "reports", label: "Reports", icon: BarChart3, badge: null },
  { id: "profile", label: "Profile", icon: Settings, badge: null },
  { id: "ai", label: "AI Assistant", icon: Zap, badge: "New" },
];

export function FacultySidebar({ active, onChange, collapsed, onToggle, onNav, mobileOpen, onMobileClose }: {
  active: string; onChange: (m: string) => void;
  collapsed: boolean; onToggle: () => void; onNav: (v: string) => void;
  mobileOpen?: boolean; onMobileClose?: () => void;
}) {
  const handleItemClick = (id: string) => {
    onChange(id);
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "h-screen bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 z-50",
        "lg:static fixed top-0 bottom-0 left-0",
        mobileOpen ? "translate-x-0 w-72 shadow-2xl" : "-translate-x-full lg:translate-x-0",
        collapsed ? "lg:w-16" : "lg:w-64"
      )}>
        {/* Logo */}
        <div className={cn("flex items-center h-16 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 px-4", (collapsed && !mobileOpen) ? "lg:justify-center justify-between" : "justify-between px-5")}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <GraduationCap size={15} className="text-white" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">EduERP</p>
                <p className="text-xs text-slate-400 mt-0.5">Faculty Portal</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => {
              if (mobileOpen && onMobileClose) {
                onMobileClose();
              } else {
                onToggle();
              }
            }} 
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {mobileOpen ? <ChevronLeft size={18} /> : (!collapsed && <ChevronLeft size={15} className="hidden lg:block" />)}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
          {FACULTY_SIDEBAR_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = active === item.id;
            const isCollapsedDesktop = collapsed && !mobileOpen;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-left",
                  isActive 
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white",
                  isCollapsedDesktop && "lg:justify-center px-0"
                )}
                title={isCollapsedDesktop ? item.label : undefined}
              >
                <div className={cn("relative flex-shrink-0 transition-transform duration-200", isActive && "scale-110")}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {(!collapsed || mobileOpen) && (
                  <div className="flex-1 flex justify-between items-center min-w-0">
                    <span className="text-sm truncate">{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold leading-tight",
                        isActive 
                          ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300" 
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
    </>
  );
}
