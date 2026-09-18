import { useState } from "react";
import { FacultySidebar } from "./FacultySidebar";
import { FacultyTopNav } from "./FacultyTopNav";
import { DashboardHome } from "../shared/DashboardHome";
import { ClassesModule } from "./ClassesModule";
import { AttendanceModule } from "../shared/AttendanceModule";
import { AssignmentsModule } from "../shared/AssignmentsModule";
import { ExamsModule } from "./ExamsModule";
import { StudentsModule } from "./StudentsModule";
import { LeavesModule } from "../shared/LeavesModule";
import { TimetableModule } from "../shared/TimetableModule";
import { AnnouncementsModule } from "./AnnouncementsModule";
import { CommunicationModule } from "../shared/CommunicationModule";
import { MeetingsModule } from "./MeetingsModule";
import { ReportsModule } from "./ReportsModule";
import { ProfileModule } from "../shared/ProfileModule";
import { AIAssistantModule } from "../shared/AIAssistantModule";
import { MentorDashboardModule } from "./mentor/MentorDashboardModule";
import { BulkDataHub } from "../admin/bulk/BulkDataHub";

import { FacultyAttendanceMarking } from "./FacultyAttendanceMarking";

export function FacultyDashboard({ onNav, theme, toggleTheme }: { onNav: (v: string) => void; theme: string; toggleTheme: () => void }) {
  const [mod, setMod] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const render = () => {
    switch (mod) {
      case "dashboard": return <DashboardHome />;
      case "bulk-data": return <BulkDataHub defaultTab="attendance" />;
      case "mentor": return <MentorDashboardModule />;
      case "classes": return <ClassesModule />;
      case "attendance": return <FacultyAttendanceMarking />;
      case "assignments": return <AssignmentsModule />;
      case "exams": return <ExamsModule />;
      case "marks": return <ExamsModule />;
      case "students": return <StudentsModule />;
      case "leaves": return <LeavesModule />;
      case "timetable": return <TimetableModule />;
      case "announcements": return <AnnouncementsModule />;
      case "communication": return <CommunicationModule />;
      case "meetings": return <MeetingsModule />;
      case "reports": return <ReportsModule />;
      case "profile": return <ProfileModule />;
      case "ai": return <AIAssistantModule />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <FacultySidebar 
        active={mod} 
        onChange={setMod} 
        collapsed={collapsed} 
        onToggle={() => setCollapsed(!collapsed)} 
        onNav={onNav} 
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <FacultyTopNav 
          module={mod} 
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
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 scrollbar-thin min-w-0">{render()}</main>
      </div>
    </div>
  );
}
