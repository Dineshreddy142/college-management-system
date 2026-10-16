import { useState, useEffect } from "react";
import { StudentSidebar } from "./StudentSidebar";
import { StudentTopNav } from "./StudentTopNav";
import { DashboardHome } from "../shared/DashboardHome";
import { ProfileModule } from "../shared/ProfileModule";
import { StudentAttendanceAnalytics } from "./StudentAttendanceAnalytics";
import { WeeklyTimetable } from "./WeeklyTimetable";
import { AssignmentsModule } from "../shared/AssignmentsModule";
import { ExaminationModule } from "../shared/ExaminationModule";
import { StudentResultsView } from "./StudentResultsView";
import { StudentFeeDashboard } from "./StudentFeeDashboard";
import { StudentLibraryDashboard } from "./StudentLibraryDashboard";
import { PlacementModule } from "../shared/PlacementModule";
import { EventsModule } from "../shared/EventsModule";
import { LeavesModule } from "../shared/LeavesModule";
import { CommunicationModule } from "../shared/CommunicationModule";
import { DocumentsModule } from "./DocumentsModule";
import { ComplaintsModule } from "./ComplaintsModule";
import { StudentDailyMcqModule } from "./StudentDailyMcqModule";
import { AIAssistantModule } from "../shared/AIAssistantModule";
import { AnalyticsModule } from "./AnalyticsModule";
import { StudentSemesterRegistration } from "./StudentSemesterRegistration";
import { StudentMySubjects } from "./StudentMySubjects";
import { ShieldCheck, ExternalLink, Lock, Key, Camera } from "lucide-react";

export function StudentDashboard({ onNav, theme, toggleTheme }: { onNav: (v: string) => void; theme: string; toggleTheme: () => void }) {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard": return <DashboardHome />;
      case "registration": return <StudentSemesterRegistration />;
      case "my-subjects": return <StudentMySubjects />;
      case "profile": return <ProfileModule />;
      case "attendance": return <StudentAttendanceAnalytics />;
      case "daily-mcqs": return <StudentDailyMcqModule />;
      case "timetable": return <WeeklyTimetable />;
      case "assignments": return <AssignmentsModule />;
      case "examination": return <ExaminationModule />;
      case "results": return <StudentResultsView />;
      case "fees": return <StudentFeeDashboard />;
      case "library": return <StudentLibraryDashboard />;
      case "placement": return <PlacementModule />;
      case "events": return <EventsModule />;
      case "leaves": return <LeavesModule />;
      case "communication": return <CommunicationModule />;
      case "documents": return <DocumentsModule />;
      case "complaints": return <ComplaintsModule />;
      case "analytics": return <AnalyticsModule />;

      case "ai": return <AIAssistantModule onNavigate={setActiveModule} />;
      default: return <DashboardHome />;
    }
  };

  useEffect(() => {
    const handleNav = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) setActiveModule(customEvent.detail);
    };
    window.addEventListener('cms:navigate', handleNav);
    return () => window.removeEventListener('cms:navigate', handleNav);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9] dark:bg-slate-950 relative">
      <StudentSidebar 
        active={activeModule} 
        onChange={setActiveModule} 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        onNav={onNav}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <StudentTopNav 
          module={activeModule} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          collapsed={sidebarCollapsed} 
          onToggleSidebar={() => {
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              setMobileOpen(prev => !prev);
            } else {
              setSidebarCollapsed(prev => !prev);
            }
          }}
          onNav={onNav}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 scrollbar-thin min-w-0">
          <div className="max-w-7xl mx-auto pb-20">
            {renderModule()}
          </div>
        </main>
      </div>
    </div>
  );
}
