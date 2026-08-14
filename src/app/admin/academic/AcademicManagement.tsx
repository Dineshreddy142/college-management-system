import { useState } from "react";
import { BookOpen, UserPlus, BarChart, Structure, CalendarDays, TrendingUp, Layers } from "lucide-react";
import { cn } from "../../App";
import { SubjectMaster } from "./SubjectMaster";
import { AllocationManager } from "./AllocationManager";
import { WorkloadReport } from "./WorkloadReport";
import { AcademicStructure } from "./AcademicStructure";
import { CurriculumManager } from "./CurriculumManager";
import { AcademicCalendar } from "./AcademicCalendar";
import { PromotionSystem } from "./PromotionSystem";
import { AdminRegistrationControl } from "../registration-control/AdminRegistrationControl";
import { HODAdminAttendanceDashboard } from "../attendance-dashboard/HODAdminAttendanceDashboard";

export function AcademicManagement() {
  const [activeTab, setActiveTab] = useState("structure");

  const renderContent = () => {
    switch (activeTab) {
      case "structure": return <AcademicStructure />;
      case "curriculum": return <CurriculumManager />;
      case "registration": return <AdminRegistrationControl />;
      case "attendance-control": return <HODAdminAttendanceDashboard />;
      case "calendar": return <AcademicCalendar />;
      case "promotions": return <PromotionSystem />;
      case "subjects": return <SubjectMaster />;
      case "allocations": return <AllocationManager />;
      case "workload": return <WorkloadReport />;
      default: return <AcademicStructure />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl w-full overflow-x-auto scrollbar-none">
        {[
          { id: "structure", label: "Academic Structure", icon: <Layers size={16} /> },
          { id: "curriculum", label: "Curriculum", icon: <BookOpen size={16} /> },
          { id: "registration", label: "Student Registration", icon: <UserPlus size={16} /> },
          { id: "attendance-control", label: "Attendance Control", icon: <BarChart size={16} /> },
          { id: "calendar", label: "Calendar & Events", icon: <CalendarDays size={16} /> },
          { id: "promotions", label: "Promotions", icon: <TrendingUp size={16} /> },
          { id: "subjects", label: "Subject Master", icon: <BookOpen size={16} /> },
          { id: "allocations", label: "Subject Allocation", icon: <UserPlus size={16} /> },
          { id: "workload", label: "Workload Reports", icon: <BarChart size={16} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn("flex whitespace-nowrap items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === t.id ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  );
}
