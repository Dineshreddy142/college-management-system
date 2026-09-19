import { useState } from "react";
import { 
  LayoutDashboard, User, UserCheck, BookOpen, Clock, FileText, 
  Award, BarChart3, DollarSign, Library as LibraryIcon, Briefcase, 
  CalendarDays, Calendar, MessageSquare, Folder, AlertCircle, 
  Zap, TrendingUp, GraduationCap, ChevronLeft, Map, X, Building, Layers, ChevronDown
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

export function StudentSidebar({ active, onChange, collapsed, onToggle, onNav, mobileOpen, onMobileClose }: {
  active: string; onChange: (m: string) => void;
  collapsed: boolean; onToggle: () => void; onNav: (v: string) => void;
  mobileOpen?: boolean; onMobileClose?: () => void;
}) {
  const [menuExpanded, setMenuExpanded] = useState<boolean>(true);

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
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNav('landing')}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <GraduationCap size={15} className="text-white" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">EduERP</p>
                <p className="text-xs text-slate-400 mt-0.5">Student Portal</p>
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
            {mobileOpen ? <X size={20} className="text-slate-600 dark:text-slate-300" /> : (!collapsed && <ChevronLeft size={15} className="hidden lg:block" />)}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
          {STUDENT_SIDEBAR_ITEMS.map(item => {
            const Icon = item.icon;
            const hasChildren = (item as any).children && (item as any).children.length > 0;
            const isChildActive = hasChildren && (item as any).children!.some((c: any) => c.id === active);
            const isActive = active === item.id || isChildActive;
            const isCollapsedDesktop = collapsed && !mobileOpen;

            if (hasChildren) {
              return (
                <div key={item.id} className="space-y-0.5">
                  <button
                    onClick={() => {
                      if (isCollapsedDesktop) {
                        handleItemClick((item as any).children![0].id);
                      } else {
                        setMenuExpanded(!menuExpanded);
                      }
                    }}
                    title={isCollapsedDesktop ? item.label : undefined}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left",
                      isActive ? "bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
                      isCollapsedDesktop && "lg:justify-center"
                    )}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {(!collapsed || mobileOpen) && (
                      <>
                        <span className="flex-1 text-left truncate text-sm">{item.label}</span>
                        <ChevronDown size={14} className={cn("transition-transform duration-200 text-slate-400", (menuExpanded || isChildActive) && "rotate-180")} />
                      </>
                    )}
                  </button>

                  {/* Submenu Accordion */}
                  {(!collapsed || mobileOpen) && (menuExpanded || isChildActive) && (
                    <div className="pl-4 space-y-0.5 border-l-2 border-slate-100 dark:border-slate-800 ml-5 my-1">
                      {(item as any).children!.map((child: any) => {
                        const ChildIcon = child.icon;
                        const isSubActive = active === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleItemClick(child.id)}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150",
                              isSubActive
                                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            )}
                          >
                            <ChildIcon size={14} className="flex-shrink-0" />
                            <span className="flex-1 text-left truncate">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-left",
                  isActive 
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium" 
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
    </>
  );
}
