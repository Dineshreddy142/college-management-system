import React, { useState, useEffect } from "react";
import {
  MapPin,
  Compass,
  Navigation,
  Clock,
  BookOpen,
  Laptop,
  Users,
  Building2,
  Shield,
  X,
  Droplets,
  AlertTriangle,
  Info,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Footprints,
  Accessibility,
  Layers,
  ChevronUp,
  ChevronDown,
  Columns,
  Box,
  Eye,
  ArrowUpDown,
  Sparkles,
  CheckCircle2,
  Repeat
} from "lucide-react";

export interface IndoorRoomData {
  id: string;
  room_number: string;
  room_name: string;
  room_type: string;
  department: string;
  capacity: number;
  faculty: string;
  description: string;
  status: 'Available' | 'Occupied' | 'Maintenance';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  icon?: string;
  currentClass?: string;
  facilities?: string[];
  floorLevel?: string;
}

// 5 Complete Campus Floors for Block A
export const CAMPUS_FLOORS_DATA: Record<string, { label: string; levelName: string; rooms: IndoorRoomData[] }> = {
  "G": {
    label: "Ground Floor",
    levelName: "Level 0 • Campus Foyer & Food Court",
    rooms: [
      { id: "G01", room_number: "G01", room_name: "Main Reception & Visitor Lobby", room_type: "Reception", department: "Admin", capacity: 40, faculty: "Admissions Desk", description: "Campus entrance visitor helpdesk.", status: "Available", x: 95, y: 55, width: 285, height: 120, fill: "#fae8ff", stroke: "#18181b", facilities: ["Helpdesk", "Visitor Lounge"] },
      { id: "G02", room_number: "G02", room_name: "Campus Food Court & Cafeteria", room_type: "Cafeteria", department: "General", capacity: 200, faculty: "Catering Services", description: "Multi-cuisine student canteen.", status: "Occupied", x: 640, y: 55, width: 265, height: 120, fill: "#ffedd5", stroke: "#18181b", facilities: ["Coffee Kiosk", "Dining Tables"] },
      { id: "G_ELEV", room_number: "Elevator", room_name: "Passenger Elevator #1", room_type: "Elevator", department: "General", capacity: 16, faculty: "Building Services", description: "Vertical elevator access Ground to Floor 4.", status: "Available", x: 745, y: 415, width: 45, height: 115, fill: "#99f6e4", stroke: "#18181b", facilities: ["ADA Accessible"] },
      { id: "G_STAIR", room_number: "Staircase", room_name: "South Central Stairwell", room_type: "Staircase", department: "General", capacity: 25, faculty: "Facilities", description: "Main south staircase.", status: "Available", x: 425, y: 545, width: 105, height: 115, fill: "#dcfce7", stroke: "#18181b", facilities: ["Emergency Exit"] }
    ]
  },
  "1": {
    label: "First Floor",
    levelName: "Level 1 • CSE & AI/DS Core Complex",
    rooms: [
      { id: "A101", room_number: "A101", room_name: "Classroom", room_type: "Classroom", department: "CSE", capacity: 60, faculty: "Prof. S. R. Dixit", description: "Interactive smart classroom with 4K projection.", status: "Available", x: 95, y: 55, width: 140, height: 120, fill: "#fef08a", stroke: "#18181b", currentClass: "CS201: Data Structures", facilities: ["Smart Board", "Air Conditioned"] },
      { id: "A102", room_number: "A102", room_name: "Classroom", room_type: "Classroom", department: "CSE", capacity: 60, faculty: "Dr. Anand Verma", description: "Tiered lecture classroom with acoustic panelling.", status: "Occupied", x: 240, y: 55, width: 140, height: 120, fill: "#fef08a", stroke: "#18181b", currentClass: "CS301: Database Systems", facilities: ["Smart Board", "Workstations"] },
      { id: "A103", room_number: "A103", room_name: "Classroom", room_type: "Classroom", department: "AI/DS", capacity: 60, faculty: "Dr. Kavita Nair", description: "High-tech smart room for AI and data science lectures.", status: "Occupied", x: 640, y: 55, width: 135, height: 120, fill: "#fef08a", stroke: "#18181b", currentClass: "AI401: Deep Learning", facilities: ["Dual 4K Laser Displays"] },
      { id: "A104", room_number: "A104", room_name: "Classroom", room_type: "Classroom", department: "AI/DS", capacity: 60, faculty: "Prof. Priya Sharma", description: "Modern multimedia lecture hall.", status: "Available", x: 780, y: 55, width: 125, height: 120, fill: "#fef08a", stroke: "#18181b", facilities: ["Smart Board", "Wi-Fi 6"] },
      { id: "LIB", room_number: "Library", room_name: "Central Digital Library", room_type: "Library", department: "Central", capacity: 120, faculty: "Chief Librarian", description: "Digital reference library, silent study pods.", status: "Available", x: 30, y: 200, width: 155, height: 135, fill: "#f3e8ff", stroke: "#18181b", facilities: ["Digital Kiosks", "Wi-Fi 6"] },
      { id: "A109", room_number: "A109", room_name: "Computer Lab", room_type: "Laboratory", department: "CSE", capacity: 80, faculty: "Dr. Sandeep Jha", description: "80 high-performance Dell Optiplex workstations.", status: "Occupied", x: 30, y: 340, width: 155, height: 145, fill: "#bae6fd", stroke: "#18181b", currentClass: "CS402: Cloud Virtualization Lab", facilities: ["80 Workstations", "Gigabit LAN"] },
      { id: "A105", room_number: "A105", room_name: "Seminar Hall", room_type: "Seminar Hall", department: "CSE/AI", capacity: 150, faculty: "Dr. Ramesh Kumar (HOD)", description: "Tiered presentation auditorium with laser projector.", status: "Occupied", x: 780, y: 340, width: 185, height: 145, fill: "#bae6fd", stroke: "#18181b", currentClass: "Guest Keynote: AI in Industry", facilities: ["Stage Mic", "Surround Sound"] },
      { id: "ATRIUM", room_number: "Atrium", room_name: "Central Quadrangle / Atrium", room_type: "Custom Room", department: "General", capacity: 100, faculty: "Campus Landscape", description: "Open-air landscaped campus courtyard and central gathering space.", status: "Available", x: 240, y: 200, width: 480, height: 260, fill: "#064e3b", stroke: "#059669", facilities: ["Landscaped Garden", "Benches"] },
      { id: "ELEV_1", room_number: "Elevator", room_name: "Passenger Elevator #1", room_type: "Elevator", department: "General", capacity: 16, faculty: "Building Services", description: "Vertical elevator access Ground to Floor 4.", status: "Available", x: 745, y: 415, width: 45, height: 115, fill: "#99f6e4", stroke: "#18181b", facilities: ["ADA Accessible"] },
      { id: "STAIR_1", room_number: "Staircase", room_name: "South Central Stairwell", room_type: "Staircase", department: "General", capacity: 25, faculty: "Facilities", description: "Main south staircase.", status: "Available", x: 425, y: 545, width: 105, height: 115, fill: "#dcfce7", stroke: "#18181b", facilities: ["Emergency Exit"] }
    ]
  },
  "2": {
    label: "Second Floor",
    levelName: "Level 2 • IT, ECE & Robotics Laboratories",
    rooms: [
      { id: "A201", room_number: "A201", room_name: "Robotics & IoT Innovation Arena", room_type: "Laboratory", department: "ECE", capacity: 50, faculty: "Prof. Vikram Das", description: "Hardware benches with robotic arms and sensor rigs.", status: "Occupied", x: 95, y: 55, width: 285, height: 120, fill: "#bae6fd", stroke: "#18181b", facilities: ["Soldering Stations", "3D Printers"] },
      { id: "A202", room_number: "A202", room_name: "VLSI & Microprocessor Lab", room_type: "Laboratory", department: "ECE", capacity: 60, faculty: "Dr. M. S. Rao", description: "Digital logic oscilloscopes and FPGA boards.", status: "Available", x: 640, y: 55, width: 265, height: 120, fill: "#bae6fd", stroke: "#18181b", facilities: ["FPGA Racks", "Logic Analyzers"] },
      { id: "ELEV_2", room_number: "Elevator", room_name: "Passenger Elevator #1", room_type: "Elevator", department: "General", capacity: 16, faculty: "Building Services", description: "Vertical elevator shaft.", status: "Available", x: 745, y: 415, width: 45, height: 115, fill: "#99f6e4", stroke: "#18181b", facilities: ["ADA Accessible"] },
      { id: "STAIR_2", room_number: "Staircase", room_name: "South Central Stairwell", room_type: "Staircase", department: "General", capacity: 25, faculty: "Facilities", description: "Main south staircase.", status: "Available", x: 425, y: 545, width: 105, height: 115, fill: "#dcfce7", stroke: "#18181b", facilities: ["Emergency Exit"] }
    ]
  },
  "3": {
    label: "Third Floor",
    levelName: "Level 3 • Postgrad Research & High Performance Data Center",
    rooms: [
      { id: "A301", room_number: "A301", room_name: "High-Performance Computing (HPC) Data Center", room_type: "Server Room", department: "CSE", capacity: 20, faculty: "IT Systems Admin", description: "High-density GPU cluster servers for AI model training.", status: "Occupied", x: 95, y: 55, width: 285, height: 120, fill: "#1e293b", stroke: "#38bdf8", facilities: ["Server Racks", "Precision AC"] },
      { id: "A302", room_number: "A302", room_name: "PhD Research & Thesis Wing", room_type: "Faculty Room", department: "Research", capacity: 40, faculty: "Dean of Research", description: "Dedicated research workstations for doctorate scholars.", status: "Available", x: 640, y: 55, width: 265, height: 120, fill: "#f3e8ff", stroke: "#18181b", facilities: ["High-speed LAN", "Meeting Pods"] },
      { id: "ELEV_3", room_number: "Elevator", room_name: "Passenger Elevator #1", room_type: "Elevator", department: "General", capacity: 16, faculty: "Building Services", description: "Vertical elevator shaft.", status: "Available", x: 745, y: 415, width: 45, height: 115, fill: "#99f6e4", stroke: "#18181b", facilities: ["ADA Accessible"] },
      { id: "STAIR_3", room_number: "Staircase", room_name: "South Central Stairwell", room_type: "Staircase", department: "General", capacity: 25, faculty: "Facilities", description: "Main south staircase.", status: "Available", x: 425, y: 545, width: 105, height: 115, fill: "#dcfce7", stroke: "#18181b", facilities: ["Emergency Exit"] }
    ]
  },
  "4": {
    label: "Fourth Floor",
    levelName: "Level 4 • Executive Boardroom & Dean Suite",
    rooms: [
      { id: "A401", room_number: "A401", room_name: "Principal & Executive Boardroom", room_type: "Principal Office", department: "Executive", capacity: 35, faculty: "Principal Office", description: "Executive conference suite with global video telepresence.", status: "Available", x: 95, y: 55, width: 380, height: 140, fill: "#fed7aa", stroke: "#18181b", facilities: ["Video Conference", "Boardroom Table"] },
      { id: "A402", room_number: "A402", room_name: "Rooftop Solar & Innovation Terrace", room_type: "Custom Room", department: "General", capacity: 60, faculty: "Green Energy Cell", description: "Rooftop observation deck and solar innovation lounge.", status: "Available", x: 540, y: 55, width: 365, height: 140, fill: "#dcfce7", stroke: "#18181b", facilities: ["Solar Panels", "Observation Lounge"] },
      { id: "ELEV_4", room_number: "Elevator", room_name: "Passenger Elevator #1", room_type: "Elevator", department: "General", capacity: 16, faculty: "Building Services", description: "Vertical elevator top terminus.", status: "Available", x: 745, y: 415, width: 45, height: 115, fill: "#99f6e4", stroke: "#18181b", facilities: ["ADA Accessible"] },
      { id: "STAIR_4", room_number: "Staircase", room_name: "South Central Stairwell", room_type: "Staircase", department: "General", capacity: 25, faculty: "Facilities", description: "Main south staircase top floor.", status: "Available", x: 425, y: 545, width: 105, height: 115, fill: "#dcfce7", stroke: "#18181b", facilities: ["Emergency Exit"] }
    ]
  }
};

export const REFERENCE_ROOMS: IndoorRoomData[] = CAMPUS_FLOORS_DATA["1"].rooms;

export function FloorViewer({ onNavigateTo }: { onNavigateTo?: (roomId: string) => void }) {
  const floorKeys = ["G", "1", "2", "3", "4"];
  const [currentFloorKey, setCurrentFloorKey] = useState<string>("1");
  const [comparisonFloorKey, setComparisonFloorKey] = useState<string>("2");
  const [viewMode, setViewMode] = useState<"standard" | "comparison" | "stacked_3d">("standard");

  const [selectedRoom, setSelectedRoom] = useState<IndoorRoomData | null>(CAMPUS_FLOORS_DATA["1"].rooms[0]);

  // Vertical Navigation State
  const [verticalTransition, setVerticalTransition] = useState<{ mode: "elevator" | "stairs"; from: string; to: string } | null>(null);

  // Steppers
  const handleNextFloor = () => {
    const idx = floorKeys.indexOf(currentFloorKey);
    if (idx < floorKeys.length - 1) {
      setCurrentFloorKey(floorKeys[idx + 1]);
      setSelectedRoom(CAMPUS_FLOORS_DATA[floorKeys[idx + 1]].rooms[0] || null);
    }
  };

  const handlePrevFloor = () => {
    const idx = floorKeys.indexOf(currentFloorKey);
    if (idx > 0) {
      setCurrentFloorKey(floorKeys[idx - 1]);
      setSelectedRoom(CAMPUS_FLOORS_DATA[floorKeys[idx - 1]].rooms[0] || null);
    }
  };

  const activeFloorData = CAMPUS_FLOORS_DATA[currentFloorKey] || CAMPUS_FLOORS_DATA["1"];
  const compareFloorData = CAMPUS_FLOORS_DATA[comparisonFloorKey] || CAMPUS_FLOORS_DATA["2"];

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl select-none">
      
      {/* ------------------------------------------------------------ */}
      {/* LEFT: BLUEPRINT VIEWPORT & MULTI-FLOOR NAVIGATION */}
      {/* ------------------------------------------------------------ */}
      <div className="flex-1 relative bg-slate-950 flex flex-col overflow-hidden">
        
        {/* TOP FLOOR NAVIGATION TOOLBAR (#14 FLOOR NAVIGATION) */}
        <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10 backdrop-blur-md">
          
          {/* Floor Steppers & Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-black uppercase text-indigo-400 font-mono px-1">FLOORS:</span>

            {/* Previous Floor Button */}
            <button
              onClick={handlePrevFloor}
              disabled={floorKeys.indexOf(currentFloorKey) === 0}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
              title="Previous Floor (Down)"
            >
              <ChevronDown size={14} />
            </button>

            {/* Floor Pill Buttons */}
            {floorKeys.map((fk) => (
              <button
                key={fk}
                onClick={() => {
                  setCurrentFloorKey(fk);
                  setSelectedRoom(CAMPUS_FLOORS_DATA[fk].rooms[0] || null);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                  currentFloorKey === fk
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {fk === "G" ? "GROUND" : `FLOOR ${fk}`}
              </button>
            ))}

            {/* Next Floor Button */}
            <button
              onClick={handleNextFloor}
              disabled={floorKeys.indexOf(currentFloorKey) === floorKeys.length - 1}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
              title="Next Floor (Up)"
            >
              <ChevronUp size={14} />
            </button>

            {/* Building & Block Dropdown */}
            <select
              value={currentFloorKey}
              onChange={(e) => {
                setCurrentFloorKey(e.target.value);
                setSelectedRoom(CAMPUS_FLOORS_DATA[e.target.value].rooms[0] || null);
              }}
              className="bg-slate-950 border border-slate-800 text-indigo-300 font-bold text-xs rounded-xl px-2.5 py-1"
            >
              <option value="G">Block A • Ground Floor</option>
              <option value="1">Block A • Floor 1 (CSE/AI)</option>
              <option value="2">Block A • Floor 2 (IT/Robotics)</option>
              <option value="3">Block A • Floor 3 (HPC/Research)</option>
              <option value="4">Block A • Floor 4 (Executive)</option>
            </select>
          </div>

          {/* View Mode Switcher (Standard, Comparison, 3D Stack) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode("standard")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === "standard" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers size={13} />
              <span>Standard</span>
            </button>

            <button
              onClick={() => setViewMode("comparison")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === "comparison" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              title="Side-by-side floor comparison"
            >
              <Columns size={13} />
              <span>Compare</span>
            </button>

            <button
              onClick={() => setViewMode("stacked_3d")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === "stacked_3d" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              title="3D Isometric Stack View"
            >
              <Box size={13} />
              <span>3D Stack</span>
            </button>
          </div>

        </div>

        {/* ============================================================ */}
        {/* 1. STANDARD SINGLE FLOOR VIEW */}
        {/* ============================================================ */}
        {viewMode === "standard" && (
          <div className="flex-1 relative flex items-center justify-center overflow-hidden p-2">
            <svg viewBox="0 0 1000 750" className="w-full h-full">
              {/* Outer Shell */}
              <rect width="1000" height="750" fill="#090d16" />
              <rect x="20" y="20" width="960" height="670" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="6" />

              {/* Current Floor Rooms */}
              {activeFloorData.rooms.map((r) => {
                const isSelected = selectedRoom?.id === r.id;

                return (
                  <g
                    key={r.id}
                    onClick={() => setSelectedRoom(r)}
                    className="cursor-pointer group"
                  >
                    <rect
                      x={r.x}
                      y={r.y}
                      width={r.width}
                      height={r.height}
                      rx="6"
                      fill={r.fill}
                      stroke={isSelected ? "#38bdf8" : r.stroke}
                      strokeWidth={isSelected ? 4 : 2}
                      className="transition-all"
                    />
                    <text x={r.x + r.width / 2} y={r.y + r.height / 2 + 4} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="bold">
                      {r.room_number}
                    </text>
                  </g>
                );
              })}

              {/* Floor Level Watermark Badge */}
              <g transform="translate(60, 60)" className="pointer-events-none">
                <rect x="0" y="0" width="140" height="28" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1" />
                <text x="70" y="18" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="black" fontFamily="monospace">
                  BLOCK A • {currentFloorKey === "G" ? "GROUND" : `FLOOR ${currentFloorKey}`}
                </text>
              </g>
            </svg>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. FLOOR COMPARISON SPLIT-SCREEN VIEW */}
        {/* ============================================================ */}
        {viewMode === "comparison" && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-2 overflow-hidden bg-slate-950">
            
            {/* Left Comparison Floor */}
            <div className="flex flex-col bg-slate-900 rounded-xl border border-slate-800 p-2 overflow-hidden">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-xs font-bold text-indigo-300">
                <span>Left: {activeFloorData.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">Floor {currentFloorKey}</span>
              </div>
              <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 1000 750" className="w-full h-full">
                  <rect width="1000" height="750" fill="#090d16" />
                  <rect x="20" y="20" width="960" height="670" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="6" />
                  {activeFloorData.rooms.map(r => (
                    <rect key={r.id} x={r.x} y={r.y} width={r.width} height={r.height} rx="6" fill={r.fill} stroke={r.stroke} strokeWidth={2} />
                  ))}
                </svg>
              </div>
            </div>

            {/* Right Comparison Floor */}
            <div className="flex flex-col bg-slate-900 rounded-xl border border-slate-800 p-2 overflow-hidden">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-xs font-bold text-teal-300">
                <div className="flex items-center gap-1">
                  <span>Right Floor:</span>
                  <select
                    value={comparisonFloorKey}
                    onChange={(e) => setComparisonFloorKey(e.target.value)}
                    className="bg-slate-950 text-teal-300 rounded px-1 text-xs"
                  >
                    {floorKeys.map(k => <option key={k} value={k}>{CAMPUS_FLOORS_DATA[k].label}</option>)}
                  </select>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Floor {comparisonFloorKey}</span>
              </div>
              <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 1000 750" className="w-full h-full">
                  <rect width="1000" height="750" fill="#090d16" />
                  <rect x="20" y="20" width="960" height="670" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="6" />
                  {compareFloorData.rooms.map(r => (
                    <rect key={r.id} x={r.x} y={r.y} width={r.width} height={r.height} rx="6" fill={r.fill} stroke={r.stroke} strokeWidth={2} />
                  ))}
                </svg>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* 3. MULTI-FLOOR 3D / ISOMETRIC STACK VIEW */}
        {/* ============================================================ */}
        {viewMode === "stacked_3d" && (
          <div className="flex-1 relative flex flex-col items-center justify-center p-6 overflow-y-auto bg-slate-950">
            <div className="w-full max-w-lg space-y-4">
              <div className="text-center pb-2">
                <h4 className="text-sm font-black text-white flex items-center justify-center gap-2">
                  <Box size={16} className="text-indigo-400" />
                  <span>3D Isometric Multi-Floor Stack</span>
                </h4>
                <p className="text-[11px] text-slate-400">Vertical Elevator Shafts & Multi-Level Stair Transitions</p>
              </div>

              {/* Stacked Floor Cards with Vertical Connectors */}
              <div className="space-y-2">
                {["4", "3", "2", "1", "G"].map((lvl) => {
                  const data = CAMPUS_FLOORS_DATA[lvl];
                  const isCurrent = currentFloorKey === lvl;

                  return (
                    <div
                      key={lvl}
                      onClick={() => {
                        setCurrentFloorKey(lvl);
                        setSelectedRoom(data.rooms[0] || null);
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between shadow-xl ${
                        isCurrent
                          ? "bg-indigo-600/25 border-indigo-500 shadow-indigo-600/20 scale-105"
                          : "bg-slate-900 border-slate-800 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                          isCurrent ? "bg-indigo-600 text-white shadow" : "bg-slate-950 text-slate-400"
                        }`}>
                          {lvl}
                        </div>
                        <div>
                          <h5 className="font-bold text-white text-xs">{data.label}</h5>
                          <p className="text-[10px] text-slate-400">{data.levelName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-teal-400 text-[10px] border border-slate-800 flex items-center gap-1">
                          🛗 Lift #1
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-emerald-400 text-[10px] border border-slate-800 flex items-center gap-1">
                          🪜 Stairs
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------ */}
      {/* RIGHT: FLOOR PROPERTY INSPECTOR & VERTICAL NAVIGATION */}
      {/* ------------------------------------------------------------ */}
      <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 space-y-4 overflow-y-auto">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-2">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Building2 size={16} className="text-indigo-400" />
            <span>Floor Details & Vertical Transit</span>
          </h3>
          <p className="text-[11px] text-slate-400">{activeFloorData.levelName}</p>
        </div>

        {/* Selected Room / Facility Card */}
        {selectedRoom ? (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-indigo-400">{selectedRoom.department}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedRoom.status === "Occupied" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                }`}>
                  {selectedRoom.status}
                </span>
              </div>
              <h4 className="text-sm font-black text-white">{selectedRoom.room_number} - {selectedRoom.room_name}</h4>
              <p className="text-[11px] text-slate-400">{selectedRoom.description}</p>
            </div>

            {/* Vertical Elevator Transit Action */}
            <div className="p-3 bg-slate-950 rounded-xl border border-teal-500/30 space-y-2">
              <div className="text-[11px] font-bold text-teal-400 flex items-center gap-1.5">
                <span>🛗 Vertical Navigation (Inter-Floor Transit)</span>
              </div>
              <p className="text-[11px] text-slate-300">Take Passenger Elevator #1 to travel vertically between Floor G, 1, 2, 3, and 4.</p>
              
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={() => {
                    handlePrevFloor();
                  }}
                  disabled={floorKeys.indexOf(currentFloorKey) === 0}
                  className="p-2 rounded-xl bg-teal-600/20 hover:bg-teal-600 border border-teal-500/40 text-teal-300 hover:text-white font-bold text-[11px] disabled:opacity-30 transition-all flex items-center justify-center gap-1"
                >
                  <ChevronDown size={12} /> Ride Lift Down
                </button>
                <button
                  onClick={() => {
                    handleNextFloor();
                  }}
                  disabled={floorKeys.indexOf(currentFloorKey) === floorKeys.length - 1}
                  className="p-2 rounded-xl bg-teal-600/20 hover:bg-teal-600 border border-teal-500/40 text-teal-300 hover:text-white font-bold text-[11px] disabled:opacity-30 transition-all flex items-center justify-center gap-1"
                >
                  <ChevronUp size={12} /> Ride Lift Up
                </button>
              </div>
            </div>

            {/* Navigate Button */}
            <button
              onClick={() => onNavigateTo && onNavigateTo(selectedRoom.room_number)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
            >
              <Navigation size={14} />
              <span>Navigate to {selectedRoom.room_number}</span>
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            Click any room on the floor map to inspect details.
          </div>
        )}

      </div>

    </div>
  );
}
