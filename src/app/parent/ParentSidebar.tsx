import { 
  Home, Users, UserCheck, Award, FileText, Calendar, 
  CheckCircle, DollarSign, BookOpen, Trophy, Flag, 
  Clock, MessageSquare, Settings, ChevronLeft, ChevronRight, Map, X
} from "lucide-react";
import { cn } from "../App";

export function ParentSidebar({ active, onChange, collapsed, onToggle, onNav, mobileOpen, onMobileClose }: { 
  active: string; 
  onChange: (v: string) => void; 
  collapsed: boolean; 
  onToggle: () => void;
  onNav: (v: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const menu = [
    // 1. Overview
    { id: "dashboard", label: "Dashboard", icon: <Home size={20} /> },
    { id: "children", label: "My Children", icon: <Users size={20} /> },

    // 2. Academics & Schedule
    { id: "academics", label: "Academics", icon: <Award size={20} /> },
    { id: "timetable", label: "Timetable", icon: <Calendar size={20} /> },
    { id: "attendance", label: "Attendance", icon: <UserCheck size={20} /> },
    { id: "assignments", label: "Assignments", icon: <FileText size={20} /> },
    { id: "examination", label: "Examination", icon: <CheckCircle size={20} /> },

    // 3. Finances & Campus Life
    { id: "fees", label: "Fee Management", icon: <DollarSign size={20} /> },
    { id: "library", label: "Library", icon: <BookOpen size={20} /> },
    { id: "placement", label: "Placement", icon: <Trophy size={20} /> },
    { id: "events", label: "Events & Meetings", icon: <Flag size={20} /> },

    // 4. Requests & Comms
    { id: "leaves", label: "Leave Requests", icon: <Clock size={20} /> },
    { id: "communication", label: "Communication", icon: <MessageSquare size={20} /> },

    // 5. Account & Settings (Bottom)
    { id: "profile", label: "Profile", icon: <Settings size={20} /> },
  ];

  const handleItemClick = (id: string) => {
    onChange(id);
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}

      <aside className={cn(
        "bg-[#1E3A5F] text-slate-100 border-r border-white/10 transition-all duration-200 flex flex-col z-50",
        "lg:static fixed top-0 bottom-0 left-0",
        mobileOpen ? "translate-x-0 w-72 shadow-2xl" : "-translate-x-full lg:translate-x-0",
        collapsed ? "lg:w-20" : "lg:w-64"
      )}>
        <div className="h-16 flex items-center px-4 bg-[#13263E] border-b border-white/10 shrink-0 justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 bg-[#2563EB] rounded-md flex items-center justify-center shrink-0 shadow-xs text-white">
              <Home size={16} className="text-white" />
            </div>
            {(!collapsed || mobileOpen) && <span className="text-sm font-bold text-white tracking-tight">SmartCampus360</span>}
            {(!collapsed || mobileOpen) && <span className="text-xs text-slate-300 font-medium">· Parent</span>}
          </div>
          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="p-1.5 rounded-md text-slate-300 hover:bg-white/10 hover:text-white transition-colors lg:hidden"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-3 scrollbar-thin">
          <nav className="px-2 space-y-1">
            {menu.map((item) => {
              const isCollapsedDesktop = collapsed && !mobileOpen;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  title={isCollapsedDesktop ? item.label : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left",
                    active === item.id 
                      ? "bg-[#2563EB] text-white font-semibold shadow-xs" 
                      : "text-slate-200 hover:bg-white/10 hover:text-white",
                    isCollapsedDesktop && "lg:justify-center"
                  )}
                >
                  <div className="shrink-0 text-current">
                    {item.icon}
                  </div>
                  {(!collapsed || mobileOpen) && <span className="text-sm truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 bg-[#13263E] border-t border-white/10 shrink-0">
          <button
            onClick={() => {
              if (mobileOpen && onMobileClose) {
                onMobileClose();
              } else {
                onToggle();
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-white/5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          >
            {mobileOpen ? <ChevronLeft size={16} /> : (collapsed ? <ChevronRight size={16} className="hidden lg:block" /> : (
              <>
                <ChevronLeft size={16} className="hidden lg:block" />
                <span className="hidden lg:inline">Collapse</span>
              </>
            ))}
          </button>
        </div>
      </aside>
    </>
  );
}
