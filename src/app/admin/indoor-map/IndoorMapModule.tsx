import React, { useState } from "react";
import {
  Map,
  Compass,
  Layers,
  Flame,
  ShieldCheck,
  Building2,
  Share2,
  FolderTree,
  MapPin,
  Search,
  Eye,
  Lock
} from "lucide-react";
import { BuildingFloorTools } from "./BuildingFloorTools";
import { FloorViewer } from "./FloorViewer";
import { CADEditor } from "./CADEditor";
import { CampusSearchHub } from "./CampusSearchHub";
import { LocationTools } from "./LocationTools";
import { MapDisplayTools } from "./MapDisplayTools";
import { AStarNavigator } from "./AStarNavigator";
import { OccupancyHeatmap } from "./OccupancyHeatmap";
import { MapValidator } from "./MapValidator";
import { AdminPermissionTools } from "./AdminPermissionTools";

export function IndoorMapModule() {
  const [activeTab, setActiveTab] = useState<"hierarchy" | "viewer" | "editor" | "display" | "search" | "location" | "navigator" | "heatmap" | "validator" | "permissions">("hierarchy");

  const tabs = [
    { id: "hierarchy", label: "Building & Floor Tools", icon: FolderTree },
    { id: "viewer", label: "Floor Map Viewer", icon: Map },
    { id: "editor", label: "CAD Map Editor", icon: Layers },
    { id: "display", label: "Map Display Tools", icon: Eye },
    { id: "search", label: "Search Tools", icon: Search },
    { id: "location", label: "Location Tools", icon: MapPin },
    { id: "navigator", label: "A* Wayfinding", icon: Compass },
    { id: "heatmap", label: "Live Occupancy Heatmap", icon: Flame },
    { id: "permissions", label: "Admin Permissions", icon: Lock },
    { id: "validator", label: "Map Quality Validator", icon: ShieldCheck }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
      
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Building2 size={22} />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
              <span>Indoor Floor Map & CAD System</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Building • Block • Floor Hierarchy
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Complete Building Hierarchy, CAD vector editor, permissions matrix, search & heatmaps
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "hierarchy" && <BuildingFloorTools onSelectFloorForCAD={() => setActiveTab("editor")} />}
        {activeTab === "viewer" && <FloorViewer onNavigateTo={() => setActiveTab("navigator")} />}
        {activeTab === "editor" && <CADEditor />}
        {activeTab === "display" && <MapDisplayTools onNavigateTo={() => setActiveTab("navigator")} />}
        {activeTab === "search" && <CampusSearchHub onNavigateTo={() => setActiveTab("navigator")} />}
        {activeTab === "location" && <LocationTools />}
        {activeTab === "navigator" && <AStarNavigator />}
        {activeTab === "heatmap" && <OccupancyHeatmap />}
        {activeTab === "permissions" && <AdminPermissionTools />}
        {activeTab === "validator" && <MapValidator />}
      </div>

    </div>
  );
}
