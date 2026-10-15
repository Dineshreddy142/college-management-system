import { useState } from "react";
import { 
  LayoutDashboard, BookOpen, UserCheck, FileText, Award, 
  BarChart3, Users, CalendarDays, Clock, Bell, MessageSquare, 
  Phone, Settings, Zap, GraduationCap, ChevronLeft, Shield, Map,
  FileSpreadsheet, X, Building, Layers, ChevronDown
} from "lucide-react";
import { cn } from "../App";

export const FACULTY_SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
  { id: "mentor", label: "Mentor Portal", icon: Shield, badge: "New" },
  { id: "offered-subjects", label: "My Offered Subjects", icon: Layers, badge: "Offerings" },
  { id: "classes", label: "Classes", icon: BookOpen, badge: null },

  { id: "attendance", label: "Attendance", icon: UserCheck, badge: "Pending" },
  { id: "assignments", label: "Assignments", icon: FileText, badge: "3" },
  { id: "exams", label: "Exams & Marks Entry", icon: Award, badge: null },
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#2563EB] rounded-md flex items-center justify-center flex-shrink-0 shadow-xs">
              <GraduationCap size={16} className="text-white" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-white tracking-tight leading-none">SmartCampus360</p>
                <p className="text-xs text-slate-300 mt-0.5 truncate">Faculty Portal</p>
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
          {FACULTY_SIDEBAR_ITEMS.map(item => {
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
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 text-left",
                  isActive ? "bg-[#2563EB] text-white font-semibold shadow-xs" : "text-slate-200 hover:bg-white/[0.08] hover:text-white",
                  isCollapsedDesktop && "lg:justify-center"
                )}
                title={isCollapsedDesktop ? item.label : undefined}
              >
                <Icon size={16} className="flex-shrink-0" />
                {(!collapsed || mobileOpen) && (
                  <>
                    <span className="flex-1 text-left truncate text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-white/20 text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
