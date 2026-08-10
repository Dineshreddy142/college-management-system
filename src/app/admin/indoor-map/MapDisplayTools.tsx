import React, { useState } from "react";
import {
  Map,
  List,
  Compass,
  Layers,
  Eye,
  EyeOff,
  Navigation,
  Sparkles,
  Sliders,
  Check,
  Building,
  Users,
  Search,
  Flag,
  Crosshair,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Info,
  Shield,
  HelpCircle
} from "lucide-react";
import { REFERENCE_ROOMS } from "./FloorViewer";

export function MapDisplayTools({ onNavigateTo }: { onNavigateTo?: (roomId: string) => void }) {
  // 1. View Mode (Map View vs List View)
  const [displayMode, setDisplayMode] = useState<"map" | "list">("map");

  // 2. Background Style (Satellite Blueprint vs Clean CAD Vector)
  const [backgroundStyle, setBackgroundStyle] = useState<"satellite" | "cad_dark" | "clean_light">("satellite");

  // 3. Layer Visibility Toggles
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showRoomNumbers, setShowRoomNumbers] = useState<boolean>(true);
  const [showFacilityIcons, setShowFacilityIcons] = useState<boolean>(true);
  const [showPathDisplay, setShowPathDisplay] = useState<boolean>(true);
  const [showRouteHighlight, setShowRouteHighlight] = useState<boolean>(true);
  const [showCurrentLocation, setShowCurrentLocation] = useState<boolean>(true);
  const [showDestination, setShowDestination] = useState<boolean>(true);
  const [showLegend, setShowLegend] = useState<boolean>(true);

  // 4. Orientation & Compass
  const [mapRotation, setMapRotation] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // 5. Selected Room for Map / List
  const [selectedRoom, setSelectedRoom] = useState<any>(REFERENCE_ROOMS[0]);
  const [tableSearch, setTableSearch] = useState<string>("");

  // Filtered rooms for list view
  const filteredRooms = REFERENCE_ROOMS.filter(r =>
    r.room_number.toLowerCase().includes(tableSearch.toLowerCase()) ||
    r.room_name.toLowerCase().includes(tableSearch.toLowerCase()) ||
    r.department.toLowerCase().includes(tableSearch.toLowerCase())
  );

  // Facility POIs
  const facilityPins = [
    { id: "F_ELEV", name: "Passenger Elevator #1", icon: "🛗", x: 745, y: 415, color: "#0284c7" },
    { id: "F_STAIR", name: "South Fire Stairwell", icon: "🪜", x: 425, y: 545, color: "#475569" },
    { id: "F_REST", name: "Accessible Restroom", icon: "🚻", x: 385, y: 115, color: "#3b82f6" },
    { id: "F_WATER", name: "RO Drinking Water", icon: "🚰", x: 440, y: 80, color: "#06b6d4" },
    { id: "F_EXIT", name: "West Emergency Exit", icon: "🚨", x: 40, y: 505, color: "#ef4444" },
    { id: "F_WIFI", name: "Wi-Fi 6 High-Speed AP", icon: "📶", x: 240, y: 110, color: "#6366f1" }
  ];

  // Route Coordinates
  const sampleRouteCoords = [
    { x: 405, y: 645 },
    { x: 405, y: 505 },
    { x: 745, y: 505 },
    { x: 745, y: 415 },
    { x: 872, y: 412 }
  ];

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl select-none">
      
      {/* ------------------------------------------------------------ */}
      {/* LEFT: MAP / LIST VIEW CANVAS WITH HUD & SATELLITE STYLES */}
      {/* ------------------------------------------------------------ */}
      <div className="flex-1 relative bg-slate-950 flex flex-col overflow-hidden">
        
        {/* Top Display Controls Ribbon */}
        <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10 backdrop-blur-md">
          
          {/* View Mode Switcher (Map vs List) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setDisplayMode("map")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                displayMode === "map" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <Map size={13} />
              <span>Map View</span>
            </button>
            <button
              onClick={() => setDisplayMode("list")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                displayMode === "list" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <List size={13} />
              <span>List View</span>
            </button>
          </div>

          {/* Background Style Selector */}
          <div className="flex items-center bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs text-slate-300 gap-1.5 font-mono">
            <span>Theme:</span>
            <select
              value={backgroundStyle}
              onChange={(e) => setBackgroundStyle(e.target.value as any)}
              className="bg-slate-900 border-none text-indigo-300 font-bold text-xs rounded"
            >
              <option value="satellite">🛰️ Satellite CAD Dark</option>
              <option value="cad_dark">📐 Vector Blueprint</option>
              <option value="clean_light">📄 Clean Blueprint</option>
            </select>
          </div>

          {/* Rotation & Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMapRotation((r) => (r + 90) % 360)}
              className="p-1 rounded-lg text-slate-300 hover:text-white"
              title="Rotate Map 90°"
            >
              <RotateCw size={13} />
            </button>
            <button
              onClick={() => setZoomLevel(z => Math.min(1.6, z + 0.15))}
              className="p-1 rounded-lg text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={() => setZoomLevel(z => Math.max(0.7, z - 0.15))}
              className="p-1 rounded-lg text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
          </div>

        </div>

        {/* ============================================================ */}
        {/* VIEW 1: MAP CANVAS VIEW */}
        {/* ============================================================ */}
        {displayMode === "map" && (
          <div className="flex-1 relative flex items-center justify-center overflow-hidden p-2">
            
            {/* North Compass Rose Indicator */}
            <div className="absolute top-4 right-4 z-20 flex flex-col items-center bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800 shadow-2xl">
              <div
                className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center transition-transform duration-300 shadow-inner"
                style={{ transform: `rotate(${mapRotation}deg)` }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[14px] border-b-red-500 absolute top-1" />
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[14px] border-t-slate-400 absolute bottom-1" />
                  <span className="text-[7px] font-black text-red-400 absolute -top-1">N</span>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-400 mt-1">{mapRotation}°</span>
            </div>

            {/* Metric Scale Indicator Bar */}
            <div className="absolute bottom-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl font-mono text-[9.5px] text-slate-300 flex flex-col items-end">
              <div className="flex items-center gap-1 mb-0.5">
                <span>0m</span>
                <div className="w-24 h-1.5 bg-slate-700 rounded-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-indigo-500" />
                  <div className="absolute right-0 top-0 bottom-0 w-12 bg-slate-400" />
                </div>
                <span>10m</span>
              </div>
              <span className="text-[8px] text-slate-500">Scale: 1px = 0.05m (1:20)</span>
            </div>

            {/* Interactive Collapsible Legend */}
            {showLegend && (
              <div className="absolute bottom-4 left-4 z-20 bg-slate-900/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 shadow-2xl space-y-1.5 text-[10px]">
                <div className="flex justify-between items-center border-b border-slate-800 pb-1 font-bold text-slate-300">
                  <span>Map Legend</span>
                  <button onClick={() => setShowLegend(false)} className="text-slate-500 hover:text-white">✕</button>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#fef08a]" /> Classroom</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#bae6fd]" /> Lab / Tech</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#f3e8ff]" /> Library/Staff</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#064e3b]" /> Atrium Quad</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" /> 🛗 Elevator</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /> 🚨 Fire Exit</div>
                </div>
              </div>
            )}

            {/* Main Blueprint SVG Canvas */}
            <svg
              viewBox="0 0 1000 750"
              className="w-full h-full transition-transform duration-300"
              style={{
                transform: `rotate(${mapRotation}deg) scale(${zoomLevel})`,
                transformOrigin: "center center"
              }}
            >
              {/* SATELLITE / CAD BACKGROUND OVERLAYS */}
              <rect width="1000" height="750" fill={backgroundStyle === "clean_light" ? "#f8fafc" : backgroundStyle === "cad_dark" ? "#020617" : "#090d16"} />
              
              {backgroundStyle === "satellite" && (
                <rect width="1000" height="750" fill="url(#sat-grid)" opacity="0.15" />
              )}

              {/* Building Outer Wall */}
              <rect x="20" y="20" width="960" height="670" rx="16" fill={backgroundStyle === "clean_light" ? "#ffffff" : "#0f172a"} stroke="#334155" strokeWidth="6" />

              {/* Corridor Path Network Overlay */}
              {showPathDisplay && (
                <g opacity="0.35">
                  <line x1="95" y1="505" x2="745" y2="505" stroke="#10b981" strokeWidth="4" strokeDasharray="4 2" />
                  <line x1="95" y1="175" x2="745" y2="175" stroke="#10b981" strokeWidth="4" strokeDasharray="4 2" />
                  <line x1="745" y1="175" x2="745" y2="505" stroke="#10b981" strokeWidth="4" strokeDasharray="4 2" />
                  <line x1="165" y1="175" x2="165" y2="505" stroke="#10b981" strokeWidth="4" strokeDasharray="4 2" />
                </g>
              )}

              {/* Rooms Rendering */}
              {REFERENCE_ROOMS.map((r) => {
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
                      opacity={0.85}
                    />

                    {/* Room Numbers */}
                    {showRoomNumbers && (
                      <text x={r.x + r.width / 2} y={r.y + r.height / 2 + 3} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="black">
                        {r.room_number}
                      </text>
                    )}

                    {/* Room Subtitle Labels */}
                    {showLabels && (
                      <text x={r.x + r.width / 2} y={r.y + r.height / 2 + 18} textAnchor="middle" fill="#334155" fontSize="8.5" fontWeight="bold">
                        {r.room_name.slice(0, 16)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Facility POI Icons */}
              {showFacilityIcons && facilityPins.map(f => (
                <g key={f.id} transform={`translate(${f.x}, ${f.y})`} className="cursor-pointer">
                  <circle r="12" fill={f.color} stroke="#ffffff" strokeWidth="1.5" />
                  <text x="0" y="4" textAnchor="middle" fontSize="10">{f.icon}</text>
                </g>
              ))}

              {/* Shortest Route Highlight Polyline */}
              {showRouteHighlight && (
                <path
                  d={`M ${sampleRouteCoords.map(p => `${p.x} ${p.y}`).join(" L ")}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="5"
                  strokeDasharray="6 3"
                  strokeLinecap="round"
                  className="animate-pulse"
                  style={{ filter: "drop-shadow(0 0 8px rgba(56,189,248,0.8))" }}
                />
              )}

              {/* Current Location "You Are Here" Marker */}
              {showCurrentLocation && (
                <g transform="translate(405, 645)">
                  <circle r="14" fill="rgba(56, 189, 248, 0.35)" className="animate-ping" />
                  <circle r="8" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                  <circle r="3.5" fill="#ffffff" />
                </g>
              )}

              {/* Destination Target Marker */}
              {showDestination && (
                <g transform="translate(872, 412)">
                  <circle r="12" fill="#ef4444" stroke="#ffffff" strokeWidth="2" className="animate-bounce" />
                  <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">🏁</text>
                </g>
              )}
            </svg>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: LIST VIEW DIRECTORY TABLE */}
        {/* ============================================================ */}
        {displayMode === "list" && (
          <div className="flex-1 p-4 overflow-y-auto bg-slate-950 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter rooms in table..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white"
                />
              </div>
              <span className="text-xs text-slate-400 font-mono">Total Rooms: {filteredRooms.length}</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Room Code</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Capacity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredRooms.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRoom(r)}
                      className={`hover:bg-slate-900/80 cursor-pointer transition-colors ${
                        selectedRoom?.id === r.id ? "bg-indigo-600/15" : ""
                      }`}
                    >
                      <td className="p-3 font-bold text-white flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: r.fill }} />
                        <span>{r.room_number}</span>
                      </td>
                      <td className="p-3 text-slate-200">{r.room_name}</td>
                      <td className="p-3 text-indigo-300">{r.department}</td>
                      <td className="p-3 text-slate-400">{r.room_type}</td>
                      <td className="p-3 font-mono text-slate-300">{r.capacity} seats</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === "Occupied" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateTo) onNavigateTo(r.room_number);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px]"
                        >
                          Navigate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------ */}
      {/* RIGHT: MAP DISPLAY & LAYER TOGGLES INSPECTOR */}
      {/* ------------------------------------------------------------ */}
      <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 space-y-4 overflow-y-auto">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-2">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Layers size={16} className="text-indigo-400" />
            <span>Map Display Settings</span>
          </h3>
          <p className="text-[11px] text-slate-400">Custom layer overlays & legend toggles</p>
        </div>

        {/* Display Toggles */}
        <div className="space-y-2 text-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            Layer Visibility:
          </span>

          {[
            { label: "Room Labels", state: showLabels, setter: setShowLabels },
            { label: "Room Numbers", state: showRoomNumbers, setter: setShowRoomNumbers },
            { label: "Facility POI Icons", state: showFacilityIcons, setter: setShowFacilityIcons },
            { label: "Corridor Path Network", state: showPathDisplay, setter: setShowPathDisplay },
            { label: "Route Highlight Polyline", state: showRouteHighlight, setter: setShowRouteHighlight },
            { label: "Current Location Beacon", state: showCurrentLocation, setter: setShowCurrentLocation },
            { label: "Destination Marker Flag", state: showDestination, setter: setShowDestination },
            { label: "Interactive Legend", state: showLegend, setter: setShowLegend }
          ].map((toggle, i) => (
            <div
              key={i}
              onClick={() => toggle.setter(!toggle.state)}
              className="p-2.5 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 cursor-pointer flex items-center justify-between transition-colors"
            >
              <span className="text-slate-300 font-semibold">{toggle.label}</span>
              <div className={`w-8 h-4 rounded-full transition-colors relative flex items-center ${
                toggle.state ? "bg-indigo-600" : "bg-slate-800"
              }`}>
                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                  toggle.state ? "translate-x-4" : "translate-x-1"
                }`} />
              </div>
            </div>
          ))}
        </div>

        {/* Selected Room Quick Details */}
        {selectedRoom && (
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider block">Selected Room</span>
            <h4 className="font-bold text-white text-sm">{selectedRoom.room_number} - {selectedRoom.room_name}</h4>
            <p className="text-[11px] text-slate-400">{selectedRoom.description}</p>
            <div className="flex justify-between text-slate-400 font-mono text-[10.5px] pt-1">
              <span>Department: <b className="text-white">{selectedRoom.department}</b></span>
              <span>Capacity: <b className="text-white">{selectedRoom.capacity}</b></span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
