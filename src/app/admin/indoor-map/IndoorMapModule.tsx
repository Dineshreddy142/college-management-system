import { useState } from "react";
import { LayoutDashboard, Layers, Box, Map, Info, Compass } from "lucide-react";
import { cn } from "../../App";

// Mock sub-components until implemented
import BlockDashboard from "./BlockDashboard";
import FloorManagement from "./FloorManagement";
import IndoorEditor from "./IndoorEditor";
import Navigation from "./IndoorNavigation";
import RoomManagement from "./RoomManagement";
import ObjectLibrary from "./ObjectLibrary";

export function IndoorMapModule() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    { id: "dashboard", label: "Block Dashboard", icon: LayoutDashboard },
    { id: "floors", label: "Floor Management", icon: Layers },
    { id: "editor", label: "Indoor Editor", icon: Map },
    { id: "navigation", label: "Navigation", icon: Compass },
    { id: "rooms", label: "Room Management", icon: Info },
    { id: "objects", label: "Object Library", icon: Box },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <BlockDashboard />;
      case "floors": return <FloorManagement />;
      case "editor": return <IndoorEditor />;
      case "navigation": return <Navigation />;
      case "rooms": return <RoomManagement />;
      case "objects": return <ObjectLibrary />;
      default: return <BlockDashboard />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
          <Map className="text-indigo-600 dark:text-indigo-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Indoor Block Map</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Design and manage interactive campus floor plans.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 mb-6 pb-2 overflow-x-auto scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {renderTab()}
      </div>
    </div>
  );
}
