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
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      <ParentSidebar 
        active={activeModule} 
        onChange={setActiveModule} 
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        onNav={onNav}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <ParentTopNav 
          module={activeModule} 
          theme={theme} 
          toggleTheme={toggleTheme}
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed(!collapsed)}
          onNav={onNav}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto pb-20">
            {renderModule()}
          </div>
        </main>
        
        {/* Floating AI Assistant Button */}
        {activeModule !== "ai" && (
          <button 
            onClick={() => setActiveModule("ai")}
            className="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform hover:scale-110 z-50 group"
          >
            <Bot size={24} className="group-hover:animate-bounce" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white border-2 border-emerald-500"></span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
