import { useState } from "react";
import { Calendar, UploadCloud, Grid, Building, Clock, FileCheck } from "lucide-react";
import { cn } from "../../App";
import { TimetableUpload } from "./TimetableUpload";
import { TimetableGrid } from "./TimetableGrid";
import { ClassroomManager } from "./ClassroomManager";
// Placeholder for TimeSlotManager for future expansion

export function TimetableManager() {
  const [activeTab, setActiveTab] = useState("grid");

  const renderContent = () => {
    switch (activeTab) {
      case "upload": return <TimetableUpload />;
      case "grid": return <TimetableGrid />;
      case "rooms": return <ClassroomManager />;
      // case "slots": return <TimeSlotManager />;
      default: return <TimetableGrid />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl w-full overflow-x-auto scrollbar-none">
        {[
          { id: "grid", label: "View Timetables", icon: <Grid size={16} /> },
          { id: "upload", label: "Upload & Validate", icon: <UploadCloud size={16} /> },
          { id: "rooms", label: "Classrooms", icon: <Building size={16} /> },
          { id: "slots", label: "Time Slots & Days", icon: <Clock size={16} /> },
          { id: "versions", label: "Version History", icon: <FileCheck size={16} /> },
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
