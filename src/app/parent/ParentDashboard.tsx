import { useState, useEffect } from "react";
import { ParentSidebar } from "./ParentSidebar";
import { ParentTopNav } from "./ParentTopNav";
import { DashboardHome } from "../shared/DashboardHome";
import { ChildManagementModule } from "./ChildManagementModule";
import { AttendanceModule } from "../shared/AttendanceModule";
import { AcademicPerformanceModule } from "./AcademicPerformanceModule";
import { AssignmentsModule } from "../shared/AssignmentsModule";
import { TimetableModule } from "../shared/TimetableModule";
import { ExaminationModule } from "../shared/ExaminationModule";
import { FeeManagementModule } from "./FeeManagementModule";
import { LibraryModule } from "../shared/LibraryModule";
import { PlacementModule } from "../shared/PlacementModule";
import { EventsModule } from "../shared/EventsModule";
import { LeavesModule } from "../shared/LeavesModule";
import { CommunicationModule } from "../shared/CommunicationModule";
import { ProfileModule } from "../shared/ProfileModule";
import { AIAssistantModule } from "../shared/AIAssistantModule";
import { Bot } from "lucide-react";

export function ParentDashboard({ onNav, theme, toggleTheme }: { onNav: (v: string) => void; theme: string; toggleTheme: () => void }) {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard": return <DashboardHome />;
      case "children": return <ChildManagementModule />;
      case "attendance": return <AttendanceModule />;
      case "academics": return <AcademicPerformanceModule />;
      case "assignments": return <AssignmentsModule />;
      case "timetable": return <TimetableModule />;
      case "examination": return <ExaminationModule />;
      case "fees": return <FeeManagementModule />;
      case "library": return <LibraryModule />;
      case "placement": return <PlacementModule />;
      case "events": return <EventsModule />;
      case "leaves": return <LeavesModule />;
      case "communication": return <CommunicationModule />;
      case "profile": return <ProfileModule />;
      case "settings": return <div>Settings</div>;
      case "ai": return <AIAssistantModule />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden relative ${theme === 'dark' ? 'dark bg-slate-950' : 'bg-[#F1F5F9]'}`}>
      <ParentSidebar 
        active={activeModule} 
        onChange={setActiveModule} 
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        onNav={onNav}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative min-w-0">
        <ParentTopNav 
          module={activeModule} 
          theme={theme} 
          toggleTheme={toggleTheme}
          collapsed={collapsed}
          onToggleSidebar={() => {
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              setMobileOpen(prev => !prev);
            } else {
              setCollapsed(prev => !prev);
            }
          }}
          onNav={onNav}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 scrollbar-thin min-w-0">
          <div className="max-w-7xl mx-auto pb-16">
            {renderModule()}
          </div>
        </main>
        
        {/* Floating AI Assistant Button */}
        {activeModule !== "ai" && (
          <button 
            onClick={() => setActiveModule("ai")}
            className="absolute bottom-6 right-6 w-12 h-12 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 z-50 group"
            title="Open AI Assistant"
          >
            <Bot size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
