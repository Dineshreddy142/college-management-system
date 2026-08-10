import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Navigation,
  Crosshair,
  Search,
  Flag,
  Compass,
  Sliders,
  Sparkles,
  Layers,
  Radio,
  Share2,
  CheckCircle2,
  Footprints,
  Play,
  Pause,
  RotateCcw,
  Target,
  ArrowRight,
  Shield,
  HelpCircle,
  Building,
  Info,
  Maximize2
} from "lucide-react";
import { REFERENCE_ROOMS } from "./FloorViewer";

export interface CampusLandmark {
  id: string;
  name: string;
  category: "Academic" | "Administration" | "Social" | "Facility";
  x: number;
  y: number;
  icon: string;
  description: string;
}

const CAMPUS_LANDMARKS: CampusLandmark[] = [
  { id: "LM_1", name: "Central Quadrangle Atrium", category: "Social", x: 480, y: 330, icon: "🌳", description: "Open-air landscaped campus courtyard and central gathering space." },
  { id: "LM_2", name: "South Main Entrance Lobby", category: "Administration", x: 405, y: 645, icon: "🏛️", description: "Primary campus check-in security checkpoint and visitor foyer." },
  { id: "LM_3", name: "Turing Seminar Hall (A105)", category: "Academic", x: 872, y: 412, icon: "🎤", description: "150-seat state-of-the-art auditorium with 4K projection." },
  { id: "LM_4", name: "Central Digital Library", category: "Academic", x: 107, y: 267, icon: "📖", description: "Digital archives, e-learning terminals, and quiet study carrels." },
  { id: "LM_5", name: "Passenger Elevator #1", category: "Facility", x: 745, y: 415, icon: "🛗", description: "ADA wheelchair-accessible high-speed multi-floor passenger lift." },
  { id: "LM_6", name: "West Emergency Fire Exit", category: "Facility", x: 40, y: 505, icon: "🚨", description: "External fire escape evacuation gateway leading to primary assembly field." }
];

export function LocationTools() {
  // Current "You Are Here" User Position
  const [userPos, setUserPos] = useState<{ x: number; y: number; heading: number }>({ x: 405, y: 645, heading: 0 });
  const [accuracyRadiusMeters, setAccuracyRadiusMeters] = useState<number>(2.5); // meters
  const [isLiveTracking, setIsLiveTracking] = useState<boolean>(true);

  // Search and Markers
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startLocation, setStartLocation] = useState<{ name: string; x: number; y: number }>({ name: "South Main Entrance Lobby", x: 405, y: 645 });
  const [destinationLocation, setDestinationLocation] = useState<{ name: string; x: number; y: number }>({ name: "Turing Seminar Hall (A105)", x: 872, y: 412 });
  const [customMarkers, setCustomMarkers] = useState<{ id: string; name: string; x: number; y: number; color: string }[]>([
    { id: "M_1", name: "My Study Desk", x: 165, y: 115, color: "#a855f7" }
  ]);

  // Selected Room / Landmark for Inspector
  const [selectedItem, setSelectedItem] = useState<any>(CAMPUS_LANDMARKS[0]);

  // Coordinate Editor Manual Inputs
  const [coordX, setCoordX] = useState<number>(405);
  const [coordY, setCoordY] = useState<number>(645);

  // Live Step Simulator State
  const [isSimulatingWalk, setIsSimulatingWalk] = useState<boolean>(false);
  const [walkProgress, setWalkProgress] = useState<number>(0);
  const walkIntervalRef = useRef<any>(null);

  // Simulation Path coordinates
  const simulationWaypoints = [
    { x: 405, y: 645 },
    { x: 405, y: 505 },
    { x: 745, y: 505 },
    { x: 745, y: 415 },
    { x: 872, y: 412 }
  ];

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Synchronize Manual Coordinate Inputs
  useEffect(() => {
    setCoordX(Math.round(userPos.x));
    setCoordY(Math.round(userPos.y));
  }, [userPos]);

  // Filtered Search Results (Rooms + Landmarks + Markers)
  const searchResults = searchQuery.trim() === "" ? [] : [
    ...REFERENCE_ROOMS.filter(r => r.room_number.toLowerCase().includes(searchQuery.toLowerCase()) || r.room_name.toLowerCase().includes(searchQuery.toLowerCase())).map(r => ({
      type: "room",
      name: `${r.room_number} - ${r.room_name}`,
      x: r.x + r.width / 2,
      y: r.y + r.height / 2,
      raw: r
    })),
    ...CAMPUS_LANDMARKS.filter(lm => lm.name.toLowerCase().includes(searchQuery.toLowerCase())).map(lm => ({
      type: "landmark",
      name: `${lm.icon} ${lm.name}`,
      x: lm.x,
      y: lm.y,
      raw: lm
    }))
  ];

  // Handle Setting Start / Destination
  const handleSetAsStart = (name: string, x: number, y: number) => {
    setStartLocation({ name, x, y });
    setUserPos({ x, y, heading: userPos.heading });
    showToast(`✓ Set Start Location: ${name}`);
  };

  const handleSetAsDestination = (name: string, x: number, y: number) => {
    setDestinationLocation({ name, x, y });
    showToast(`✓ Set Destination Target: ${name}`);
  };

  // Step Walking Simulation
  const handleToggleSimulateWalk = () => {
    if (isSimulatingWalk) {
      clearInterval(walkIntervalRef.current);
      setIsSimulatingWalk(false);
    } else {
      setIsSimulatingWalk(true);
      let step = 0;
      const totalSteps = 100;
      
      walkIntervalRef.current = setInterval(() => {
        step++;
        if (step > totalSteps) {
          clearInterval(walkIntervalRef.current);
          setIsSimulatingWalk(false);
          setWalkProgress(100);
          setUserPos({ x: destinationLocation.x, y: destinationLocation.y, heading: 0 });
          showToast("🎉 Arrived at Destination: " + destinationLocation.name);
          return;
        }

        const t = step / totalSteps;
        setWalkProgress(Math.round(t * 100));

        // Interpolate along simulation path
        const segmentCount = simulationWaypoints.length - 1;
        const segIndex = Math.min(segmentCount - 1, Math.floor(t * segmentCount));
        const segT = (t * segmentCount) - segIndex;

        const p1 = simulationWaypoints[segIndex];
        const p2 = simulationWaypoints[segIndex + 1];

        const curX = p1.x + (p2.x - p1.x) * segT;
        const curY = p1.y + (p2.y - p1.y) * segT;
        const heading = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI) + 90;

        setUserPos({ x: curX, y: curY, heading });
      }, 100);
    }
  };

  const handleResetWalk = () => {
    if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
    setIsSimulatingWalk(false);
    setWalkProgress(0);
    setUserPos({ x: startLocation.x, y: startLocation.y, heading: 0 });
    showToast("✓ Reset Position to Start Origin");
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl select-none">
      
      {/* ------------------------------------------------------------ */}
      {/* LEFT: BLUEPRINT CANVAS WITH LIVE POSITIONING HUD */}
      {/* ------------------------------------------------------------ */}
      <div className="flex-1 relative bg-slate-950 flex flex-col overflow-hidden">
        
        {/* Top Location Tools Ribbon */}
        <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10 backdrop-blur-md">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-black uppercase text-sky-400 font-mono px-1">📍 LOCATION TOOLS:</span>

            {/* You Are Here Button */}
            <button
              onClick={() => {
                setUserPos({ x: 405, y: 645, heading: 0 });
                showToast("📍 Centered on Current User Position");
              }}
              className="px-2.5 py-1 rounded-lg bg-sky-500 text-black font-black text-xs shadow-md shadow-sky-500/25 flex items-center gap-1"
            >
              <Crosshair size={13} />
              <span>You Are Here</span>
            </button>

            {/* Set Accuracy Radius */}
            <div className="flex items-center bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs text-slate-300 gap-1.5 font-mono">
              <Radio size={12} className="text-sky-400 animate-pulse" />
              <span>Accuracy:</span>
              <select
                value={accuracyRadiusMeters}
                onChange={(e) => setAccuracyRadiusMeters(Number(e.target.value))}
                className="bg-slate-900 border-none text-sky-300 font-bold text-xs rounded"
              >
                <option value={1.0}>±1.0m (High Precision BLE)</option>
                <option value={2.5}>±2.5m (Wi-Fi 6 RTT)</option>
                <option value={5.0}>±5.0m (Standard IPS)</option>
                <option value={10.0}>±10.0m (Coarse RSSI)</option>
              </select>
            </div>

            {/* Live Tracking Toggle */}
            <button
              onClick={() => setIsLiveTracking(!isLiveTracking)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                isLiveTracking ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-950 text-slate-400"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{isLiveTracking ? "Live IPS Online" : "Tracking Paused"}</span>
            </button>
          </div>

          {/* Real-time Position HUD */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <span>POS: <strong className="text-sky-400">{Math.round(userPos.x)}px, {Math.round(userPos.y)}px</strong></span>
            <span className="text-slate-600">|</span>
            <span>METRIC: <strong className="text-white">{(userPos.x * 0.05).toFixed(1)}m, {(userPos.y * 0.05).toFixed(1)}m</strong></span>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute top-14 right-6 z-30 bg-slate-900/95 border border-sky-500/50 text-sky-200 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2">
            <Sparkles size={14} className="text-sky-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Blueprint SVG Canvas */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden p-2">
          <svg
            viewBox="0 0 1000 750"
            className="w-full h-full cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
              const clickY = Math.round(((e.clientY - rect.top) / rect.height) * 750);
              setUserPos({ x: clickX, y: clickY, heading: userPos.heading });
              showToast(`📍 Relocated User to [${clickX}px, ${clickY}px]`);
            }}
          >
            {/* Building Shell */}
            <rect width="1000" height="750" fill="#090d16" />
            <rect x="20" y="20" width="960" height="670" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="6" />

            {/* All Campus Rooms */}
            {REFERENCE_ROOMS.map((r) => {
              const isDest = destinationLocation.name.includes(r.room_number);
              const isStart = startLocation.name.includes(r.room_number);

              return (
                <g
                  key={r.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem(r);
                  }}
                  className="cursor-pointer group"
                >
                  <rect
                    x={r.x}
                    y={r.y}
                    width={r.width}
                    height={r.height}
                    rx="6"
                    fill={r.fill}
                    stroke={isDest ? "#ef4444" : isStart ? "#10b981" : r.stroke}
                    strokeWidth={isDest || isStart ? 3.5 : 2}
                    opacity={0.8}
                  />
                  <text x={r.x + r.width / 2} y={r.y + r.height / 2 + 3} textAnchor="middle" fill="#0f172a" fontSize="10.5" fontWeight="bold">
                    {r.room_number}
                  </text>
                  
                  {/* Entrance point marker */}
                  <circle cx={r.x + r.width / 2} cy={r.y + r.height} r="3" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
                </g>
              );
            })}

            {/* Campus Landmarks */}
            {CAMPUS_LANDMARKS.map((lm) => (
              <g
                key={lm.id}
                transform={`translate(${lm.x}, ${lm.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem(lm);
                }}
                className="cursor-pointer"
              >
                <circle r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="0" y="4" textAnchor="middle" fontSize="12">{lm.icon}</text>
              </g>
            ))}

            {/* Custom Location Markers */}
            {customMarkers.map((m) => (
              <g key={m.id} transform={`translate(${m.x}, ${m.y})`}>
                <circle r="8" fill={m.color} stroke="#ffffff" strokeWidth="2" />
                <text x="0" y="-12" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">{m.name}</text>
              </g>
            ))}

            {/* Simulation Route Path */}
            <path
              d={`M ${simulationWaypoints.map(p => `${p.x} ${p.y}`).join(" L ")}`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="4"
              strokeDasharray="6 4"
              opacity="0.4"
            />

            {/* START LOCATION MARKER (A) */}
            <g transform={`translate(${startLocation.x}, ${startLocation.y})`}>
              <circle r="12" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" className="animate-bounce" />
              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">A</text>
              <text x="0" y="24" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="bold">START ORIGIN</text>
            </g>

            {/* DESTINATION LOCATION MARKER (B) */}
            <g transform={`translate(${destinationLocation.x}, ${destinationLocation.y})`}>
              <circle r="14" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />
              <circle r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
              <text x="0" y="3.5" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">🏁</text>
              <text x="0" y="24" textAnchor="middle" fill="#f87171" fontSize="9" fontWeight="bold">DESTINATION</text>
            </g>

            {/* 📍 CURRENT LOCATION "YOU ARE HERE" PULSING RADAR BEACON */}
            <g transform={`translate(${userPos.x}, ${userPos.y})`}>
              {/* Location Accuracy Radius (Uncertainty Circle) */}
              <circle
                r={accuracyRadiusMeters * 20}
                fill="rgba(56, 189, 248, 0.12)"
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="4 2"
              />

              {/* Directional Radar Beam / Heading Cone */}
              <polygon
                points="-16,-28 16,-28 0,0"
                fill="rgba(56, 189, 248, 0.35)"
                transform={`rotate(${userPos.heading})`}
              />

              {/* Outer Pulsing Ping Wave */}
              <circle r="16" fill="rgba(56, 189, 248, 0.4)" className="animate-ping" />

              {/* Inner Core Blue Dot */}
              <circle r="8" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
              <circle r="3.5" fill="#ffffff" />

              {/* "You Are Here" Badge */}
              <g transform="translate(0, -22)" className="pointer-events-none">
                <rect x="-38" y="-9" width="76" height="18" rx="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
                <text textAnchor="middle" y="3.5" fill="#ffffff" fontSize="8.5" fontWeight="black" fontFamily="sans-serif">
                  YOU ARE HERE
                </text>
              </g>
            </g>
          </svg>
        </div>

        {/* Bottom Step Walking Simulator Bar */}
        <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs z-10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSimulateWalk}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                isSimulatingWalk
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25"
                  : "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25"
              }`}
            >
              {isSimulatingWalk ? <Pause size={14} /> : <Play size={14} />}
              <span>{isSimulatingWalk ? "Pause Walk" : "Simulate User Walk"}</span>
            </button>

            <button
              onClick={handleResetWalk}
              className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
              title="Reset Position to Start"
            >
              <RotateCcw size={14} />
            </button>

            <div className="flex items-center gap-2 text-slate-400 text-xs pl-2 font-mono">
              <Footprints size={14} className="text-sky-400" />
              <span>Route Progress:</span>
              <strong className="text-white">{walkProgress}%</strong>
            </div>
          </div>

          <div className="flex-1 max-w-xs bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-150" style={{ width: `${walkProgress}%` }} />
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------ */}
      {/* RIGHT: LOCATION SEARCH & COORDINATE INSPECTOR */}
      {/* ------------------------------------------------------------ */}
      <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 space-y-4 overflow-y-auto">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-2">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <MapPin size={16} className="text-sky-400" />
            <span>Campus Location Hub</span>
          </h3>
          <p className="text-[11px] text-slate-400">Positioning, Geocoding & Coordinate Editor</p>
        </div>

        {/* 1. SEARCH LOCATION GEOCODER */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1">Search Location (Rooms & Landmarks)</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search e.g. A101, Library, Elevator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 font-semibold focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="mt-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl max-h-44 overflow-y-auto space-y-1 text-xs">
              {searchResults.map((res, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setUserPos({ x: res.x, y: res.y, heading: userPos.heading });
                    setSelectedItem(res.raw);
                    setSearchQuery("");
                    showToast(`📍 Located: ${res.name}`);
                  }}
                  className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-between text-slate-300 hover:text-white"
                >
                  <span className="font-bold">{res.name}</span>
                  <span className="text-[10px] text-sky-400 font-mono">{Math.round(res.x)}px, {Math.round(res.y)}px</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. ORIGIN & DESTINATION SUMMARY CARDS */}
        <div className="space-y-2 text-xs">
          
          {/* Start Origin Card */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                <Navigation size={12} /> Start Origin (A)
              </span>
              <span className="text-[10px] font-mono text-slate-500">{Math.round(startLocation.x)}, {Math.round(startLocation.y)}</span>
            </div>
            <p className="font-bold text-white text-xs">{startLocation.name}</p>
          </div>

          {/* Destination Target Card */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-red-400 flex items-center gap-1">
                <Flag size={12} /> Destination Target (B)
              </span>
              <span className="text-[10px] font-mono text-slate-500">{Math.round(destinationLocation.x)}, {Math.round(destinationLocation.y)}</span>
            </div>
            <p className="font-bold text-white text-xs">{destinationLocation.name}</p>
          </div>

        </div>

        {/* 3. COORDINATE EDITOR & REAL-WORLD METRICS */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
          <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider block">Coordinate Editor (Manual Override)</span>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Canvas X (px)</label>
              <input
                type="number"
                value={coordX}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCoordX(val);
                  setUserPos(prev => ({ ...prev, x: val }));
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Canvas Y (px)</label>
              <input
                type="number"
                value={coordY}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCoordY(val);
                  setUserPos(prev => ({ ...prev, y: val }));
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold"
              />
            </div>
          </div>

          {/* Metric & GPS Coordinates */}
          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1 font-mono text-[10.5px]">
            <div className="flex justify-between text-slate-400">
              <span>Metric Scale:</span>
              <span className="text-white font-bold">{(coordX * 0.05).toFixed(2)}m • {(coordY * 0.05).toFixed(2)}m</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Calibrated WGS84:</span>
              <span className="text-sky-300 font-bold">12.9716°N, 77.5946°E</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Floor Level:</span>
              <span className="text-indigo-400 font-bold">Block A • Floor 1</span>
            </div>
          </div>
        </div>

        {/* 4. SELECTED ITEM ACTION CONTROLS */}
        {selectedItem && (
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Selected Location</span>
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedItem.icon || "🏛️"}</span>
              <div>
                <h5 className="font-bold text-white text-xs">{selectedItem.name || selectedItem.room_name}</h5>
                <span className="text-[10px] text-slate-400">{selectedItem.category || selectedItem.room_type || "Campus Location"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => handleSetAsStart(selectedItem.name || selectedItem.room_name, selectedItem.x || 400, selectedItem.y || 400)}
                className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1"
              >
                <Navigation size={12} /> Set as Start
              </button>
              <button
                onClick={() => handleSetAsDestination(selectedItem.name || selectedItem.room_name, selectedItem.x || 400, selectedItem.y || 400)}
                className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-300 hover:text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1"
              >
                <Flag size={12} /> Set as Target
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
