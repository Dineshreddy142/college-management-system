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
      case "exam-portal": return <StudentExamPortalBridge />;
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

function StudentExamPortalBridge() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-[#0B1528] to-[#162746] text-white rounded-3xl p-6 sm:p-8 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-2.5 py-0.5 rounded-full">
              Zero-Trust Lockdown Environment
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">Institutional CBT Exam Portal</h2>
            <p className="text-xs text-slate-300">Secure Computer-Based Examination Browser with AI Biometrics</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
          The Secure Exam Portal operates in an isolated, tamper-proof lockdown environment. Before entering your scheduled test, you will clear a mandatory 3-Factor verification protocol.
        </p>

        {/* 3 Steps Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-xs font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
              <span>1. Credentials</span>
            </div>
            <p className="text-[11px] text-slate-300">Log in with institutional email & password to verify candidate course enrollment.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5">
              <span>2. Exam Passkey</span>
            </div>
            <p className="text-[11px] text-slate-300">Enter the secret access code from your hall ticket or announced by your invigilator.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-xs font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
              <span>3. Face Biometrics</span>
            </div>
            <p className="text-[11px] text-slate-300">Live WebRTC camera verification with liveness and facial feature matching.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <a
            href="/exam-portal"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Launch Secure Exam Browser</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
          </a>
        </div>
      </div>
    </div>
  );
}
