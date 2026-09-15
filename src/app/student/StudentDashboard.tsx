import { useState, useEffect } from "react";
import { StudentSidebar } from "./StudentSidebar";
import { StudentTopNav } from "./StudentTopNav";
import { DashboardHome } from "../shared/DashboardHome";
import { ProfileModule } from "../shared/ProfileModule";
import { AttendanceModule } from "../shared/AttendanceModule";
import { AcademicsModule } from "./AcademicsModule";
import { TimetableModule } from "../shared/TimetableModule";
import { AssignmentsModule } from "../shared/AssignmentsModule";
import { ExaminationModule } from "../shared/ExaminationModule";
import { ResultsModule } from "./ResultsModule";
import { FeesModule } from "./FeesModule";
import { LibraryModule } from "../shared/LibraryModule";
import { PlacementModule } from "../shared/PlacementModule";
import { EventsModule } from "../shared/EventsModule";
import { LeavesModule } from "../shared/LeavesModule";
import { CommunicationModule } from "../shared/CommunicationModule";
import { DocumentsModule } from "./DocumentsModule";
import { ComplaintsModule } from "./ComplaintsModule";
import { AIAssistantModule } from "../shared/AIAssistantModule";
import { AnalyticsModule } from "./AnalyticsModule";
import { CampusMap } from "../campus-map/CampusMap";

export function StudentDashboard({ onNav, theme, toggleTheme }: { onNav: (v: string) => void; theme: string; toggleTheme: () => void }) {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard": return <DashboardHome />;
      case "profile": return <ProfileModule />;
      case "attendance": return <AttendanceModule />;
      case "my-subjects": return <AcademicsModule />;
      case "academics": return <AcademicsModule />;
      case "timetable": return <TimetableModule />;
      case "assignments": return <AssignmentsModule />;
      case "examination": return <ExaminationModule />;
      case "results": return <ResultsModule />;
      case "fees": return <FeesModule />;
      case "library": return <LibraryModule />;
      case "placement": return <PlacementModule />;
      case "events": return <EventsModule />;
      case "leaves": return <LeavesModule />;
      case "communication": return <CommunicationModule />;
      case "documents": return <DocumentsModule />;
      case "complaints": return <ComplaintsModule />;
      case "analytics": return <AnalyticsModule />;
      case "campus-map": return <CampusMap isAdmin={false} theme={theme as any} onToggleTheme={toggleTheme} onBackToDashboard={() => setActiveModule("dashboard")} />;
      case "ai": return <AIAssistantModule />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <StudentSidebar 
        active={activeModule} 
        onChange={setActiveModule} 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        onNav={onNav}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <StudentTopNav 
          module={activeModule} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          collapsed={sidebarCollapsed} 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNav={onNav}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
          <div className="max-w-7xl mx-auto pb-20">
            {renderModule()}
          </div>
        </main>
      </div>
    </div>
  );
}
