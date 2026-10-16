import { useState } from "react";
import { 
  LayoutDashboard, User, UserCheck, BookOpen, Clock, FileText, 
  Award, BarChart3, DollarSign, Library as LibraryIcon, Briefcase, 
  CalendarDays, Calendar, MessageSquare, Folder, AlertCircle, 
  Zap, TrendingUp, GraduationCap, ChevronLeft, Map, X, Building, Layers, ChevronDown,
  ShieldCheck, Wallet, Activity, Sparkles
} from "lucide-react";
import { cn } from "../App";

export const STUDENT_SIDEBAR_ITEMS = [
  // 1. Overview & Academics
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
  { id: "registration", label: "Course Registration", icon: BookOpen, badge: null },
  { id: "my-subjects", label: "My Subjects", icon: Layers, badge: null },
  { id: "timetable", label: "Timetable", icon: Clock, badge: null },
  { id: "attendance", label: "Attendance", icon: UserCheck, badge: "88%" },
  { id: "daily-mcqs", label: "Daily Topic MCQs", icon: Sparkles, badge: "Daily" },

  // 2. Assessments & Performance
  { id: "assignments", label: "Assignments", icon: FileText, badge: "3 Due" },
  { id: "examination", label: "Examination", icon: Award, badge: null },
  { id: "exam-portal", label: "Exam Browser", icon: ShieldCheck, badge: "CBT Live" },
  { id: "results", label: "Results", icon: BarChart3, badge: "New" },
  { id: "analytics", label: "Analytics", icon: TrendingUp, badge: null },

  // 3. Campus Facilities & Career
  { id: "fees", label: "Fees", icon: DollarSign, badge: null },
  { id: "library", label: "Library", icon: LibraryIcon, badge: null },
  { id: "placement", label: "Placement", icon: Briefcase, badge: null },
  { id: "events", label: "Events", icon: CalendarDays, badge: null },
  { id: "leaves", label: "Leave Management", icon: Calendar, badge: null },

  // 4. Support & Services
  { id: "communication", label: "Communication", icon: MessageSquare, badge: null },
  { id: "documents", label: "Documents", icon: Folder, badge: null },
  { id: "complaints", label: "Complaints", icon: AlertCircle, badge: null },
  { id: "ai", label: "AI Assistant", icon: Zap, badge: "Beta" },

  // 5. Account & Settings (Bottom)
  { id: "profile", label: "My Profile", icon: User, badge: null },
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
        "h-screen bg-[#1E3A5F] text-slate-100 border-r border-white/10 flex flex-col transition-all duration-200 ease-in-out flex-shrink-0 z-50",
        "lg:static fixed top-0 bottom-0 left-0",
        mobileOpen ? "translate-x-0 w-72 shadow-2xl" : "-translate-x-full lg:translate-x-0",
        collapsed ? "lg:w-16" : "lg:w-64"
      )}>
        {/* Logo */}
        <div className={cn("flex items-center h-16 bg-[#13263E] border-b border-white/10 flex-shrink-0 px-4", (collapsed && !mobileOpen) ? "lg:justify-center justify-between" : "justify-between px-4")}>
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNav('landing')}>
            <div className="w-8 h-8 bg-[#2563EB] rounded-md flex items-center justify-center flex-shrink-0 shadow-xs">
              <GraduationCap size={16} className="text-white" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-white tracking-tight leading-none">SmartCampus360</p>
                <p className="text-xs text-slate-300 mt-0.5 truncate">Student Portal</p>
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
            className="p-1.5 rounded-md text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X size={18} /> : (!collapsed && <ChevronLeft size={15} className="hidden lg:block" />)}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin">
          {STUDENT_SIDEBAR_ITEMS.map(item => {
            const Icon = item.icon;
            const hasChildren = (item as any).children && (item as any).children.length > 0;
            const isChildActive = hasChildren && (item as any).children!.some((c: any) => c.id === active);
            const isActive = active === item.id || isChildActive;
            const isCollapsedDesktop = collapsed && !mobileOpen;

            if (hasChildren) {
              return (
                <div key={item.id} className="space-y-1">
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
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 text-left",
                      isActive ? "bg-[#2563EB] text-white font-semibold shadow-xs" : "text-slate-200 hover:bg-white/[0.08] hover:text-white",
                      isCollapsedDesktop && "lg:justify-center"
                    )}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    {(!collapsed || mobileOpen) && (
                      <>
                        <span className="flex-1 text-left truncate text-sm">{item.label}</span>
                        <ChevronDown size={14} className={cn("transition-transform duration-150 text-slate-300", (menuExpanded || isChildActive) && "rotate-180")} />
                      </>
                    )}
                  </button>

                  {/* Submenu Accordion */}
                  {(!collapsed || mobileOpen) && (menuExpanded || isChildActive) && (
                    <div className="pl-3 space-y-1 border-l border-white/15 ml-4 my-1">
                      {(item as any).children!.map((child: any) => {
                        const ChildIcon = child.icon;
                        const isSubActive = active === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleItemClick(child.id)}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                              isSubActive
                                ? "bg-[#2563EB] text-white shadow-xs font-semibold"
                                : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
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
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 group text-left",
                  isActive 
                    ? "bg-[#2563EB] text-white font-semibold shadow-xs" 
                    : "text-slate-200 hover:bg-white/[0.08] hover:text-white",
                  isCollapsedDesktop && "lg:justify-center px-0"
                )}
                title={isCollapsedDesktop ? item.label : undefined}
              >
                <div className="relative flex-shrink-0">
                  <Icon size={16} />
                </div>
                {(!collapsed || mobileOpen) && (
                  <div className="flex-1 flex justify-between items-center min-w-0">
                    <span className="text-sm truncate">{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-semibold leading-tight",
                        isActive 
                          ? "bg-white/25 text-white" 
                          : "bg-white/15 text-slate-200"
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

        {/* Small Exam Browser Gateway Button */}
        <div className="p-2.5 border-t border-white/10 bg-[#13263E]/80 flex-shrink-0">
          <a
            href="/exam-portal"
            target="_blank"
            rel="noreferrer"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-950/40 transition-all group cursor-pointer",
              collapsed && !mobileOpen ? "justify-center px-0" : ""
            )}
            title="Launch Secure CBT Exam Browser"
          >
            <ShieldCheck size={17} className="text-emerald-300 flex-shrink-0 animate-pulse" />
            {(!collapsed || mobileOpen) && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">Exam Browser</span>
                  <span className="text-[9px] font-mono uppercase bg-white/20 text-white px-1.5 py-0.5 rounded leading-none">
                    Open
                  </span>
                </div>
                <p className="text-[10px] text-emerald-200/80 truncate">Secure CBT Portal</p>
              </div>
            )}
          </a>
        </div>
      </div>
    </>
  );
}
