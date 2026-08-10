import React, { useState, useEffect } from "react";
import {
  Users,
  Activity,
  TrendingUp,
  Clock,
  Flame,
  BarChart3,
  Calendar,
  Footprints,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  Zap,
  Radio,
  Sliders,
  DoorOpen
} from "lucide-react";
import client from "../../../api/client";
import { REFERENCE_ROOMS } from "./FloorViewer";

export type HeatmapType =
  | "occupancy"
  | "traffic"
  | "room_usage"
  | "navigation"
  | "popular"
  | "entry_exit"
  | "time_based";

export type HeatmapTimeRange =
  | "live"
  | "5min"
  | "30min"
  | "today"
  | "yesterday"
  | "7days"
  | "30days"
  | "custom";

export function OccupancyHeatmap() {
  const [heatmapType, setHeatmapType] = useState<HeatmapType>("occupancy");
  const [timeRange, setTimeRange] = useState<HeatmapTimeRange>("live");
  const [timelineHour, setTimelineHour] = useState<number>(11); // 11 AM
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);

  const [metrics, setMetrics] = useState<any>({
    totalPeopleOnFloor: 380,
    averageOccupancy: 64,
    totalFootfallPerHour: 1420,
    peakHours: "10:30 AM - 1:30 PM & 3:00 PM - 5:00 PM",
    mostOccupied: { room_number: "A105", room_name: "Turing Seminar Hall", occupancyPercentage: 92, currentPeople: 138 },
    hotspotCorridors: [
      { name: "Central Atrium Crossway", footfallPerHour: 480, intensity: 0.92 },
      { name: "East Wing Lab Corridor", footfallPerHour: 340, intensity: 0.78 },
      { name: "South Main Entrance Lobby", footfallPerHour: 620, intensity: 0.98 }
    ]
  });

  // Fetch telemetry from backend
  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const res = await client.get(`/indoor-map/floors/1/occupancy?type=${heatmapType}&timeRange=${timeRange}`);
        if (res.data?.success && res.data.data) {
          setMetrics(res.data.data);
        }
      } catch (_) {}
    };
    fetchHeatmap();
  }, [heatmapType, timeRange]);

  // Hourly timeline animation playback
  useEffect(() => {
    let interval: any = null;
    if (isPlayingTimeline && heatmapType === "time_based") {
      interval = setInterval(() => {
        setTimelineHour((prev) => (prev >= 18 ? 8 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlayingTimeline, heatmapType]);

  const heatmapCategories = [
    { id: "occupancy", label: "Occupancy Heatmap", icon: "👥", desc: "Headcount vs Capacity %" },
    { id: "traffic", label: "People Traffic", icon: "🚶", desc: "Footfall along corridors" },
    { id: "room_usage", label: "Room Usage Hours", icon: "⏱️", desc: "Booking & Lecture hours" },
    { id: "navigation", label: "Navigation Heatmap", icon: "🧭", desc: "A* Wayfinding searches" },
    { id: "popular", label: "Popular Locations", icon: "⭐", desc: "Highest dwell time spots" },
    { id: "entry_exit", label: "Entry / Exit Velocity", icon: "🚪", desc: "Turnstile ingress/egress" },
    { id: "time_based", label: "Time-Based Replay", icon: "🕒", desc: "Hourly usage timeline" }
  ];

  const timeRangeButtons = [
    { id: "live", label: "Live Stream" },
    { id: "5min", label: "Last 5m" },
    { id: "30min", label: "Last 30m" },
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "7days", label: "Last 7d" },
    { id: "30days", label: "Last 30d" },
    { id: "custom", label: "Custom Range" }
  ];

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl select-none">
      
      {/* ------------------------------------------------------------ */}
      {/* LEFT: SVG HEATMAP BLUEPRINT VIEWPORT */}
      {/* ------------------------------------------------------------ */}
      <div className="flex-1 relative bg-slate-950 flex flex-col overflow-hidden">
        
        {/* Top Time Range Bar */}
        <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10 backdrop-blur-md">
          
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-black uppercase text-amber-400 font-mono px-1 flex items-center gap-1">
              <Flame size={13} /> TIME RANGE:
            </span>

            {timeRangeButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setTimeRange(btn.id as HeatmapTimeRange)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  timeRange === btn.id
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/30 font-black"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>IPS Telemetry: <strong className="text-emerald-400">Online</strong></span>
          </div>
        </div>

        {/* SVG Blueprint Canvas with Heat Gradient Overlays */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden p-2">
          
          <svg viewBox="0 0 1000 750" className="w-full h-full">
            <defs>
              {/* Heat Radial Glows */}
              <radialGradient id="heat-high" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#f97316" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="heat-med" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.75" />
                <stop offset="70%" stopColor="#eab308" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="heat-low" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
                <stop offset="80%" stopColor="#059669" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Base Shell */}
            <rect width="1000" height="750" fill="#090d16" />
            <rect x="20" y="20" width="960" height="670" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="6" />

            {/* Central Atrium Heat Zone */}
            <rect x="240" y="200" width="480" height="260" rx="12" fill="url(#heat-low)" stroke="#059669" strokeWidth="3" />
            <text x="480" y="335" textAnchor="middle" fill="#34d399" fontSize="13" fontWeight="bold">Central Quadrangle (Moderate Flow)</text>

            {/* CORRIDOR FOOTFALL HEAT TRAFFIC LINES (For Traffic & Navigation Heatmaps) */}
            {(heatmapType === "traffic" || heatmapType === "navigation" || heatmapType === "popular") && (
              <g>
                {/* Main Crossway Corridor (High Heat) */}
                <line x1="95" y1="505" x2="745" y2="505" stroke="#ef4444" strokeWidth="18" opacity="0.45" strokeLinecap="round" />
                <line x1="95" y1="505" x2="745" y2="505" stroke="#f97316" strokeWidth="6" opacity="0.85" strokeLinecap="round" />

                {/* North Corridor (Medium Heat) */}
                <line x1="95" y1="175" x2="745" y2="175" stroke="#f59e0b" strokeWidth="14" opacity="0.4" strokeLinecap="round" />
                <line x1="95" y1="175" x2="745" y2="175" stroke="#eab308" strokeWidth="4" opacity="0.8" strokeLinecap="round" />

                {/* East Corridor (High Heat near Elevators) */}
                <line x1="745" y1="175" x2="745" y2="505" stroke="#ef4444" strokeWidth="16" opacity="0.45" strokeLinecap="round" />

                {/* West Corridor (Moderate Heat) */}
                <line x1="165" y1="175" x2="165" y2="505" stroke="#10b981" strokeWidth="12" opacity="0.4" strokeLinecap="round" />
              </g>
            )}

            {/* ENTRY / EXIT HEATMAP GATES */}
            {heatmapType === "entry_exit" && (
              <g>
                {/* South Main Entrance Ingress */}
                <circle cx="405" cy="645" r="45" fill="url(#heat-high)" />
                <text x="405" y="650" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="black">620 exits/hr</text>

                {/* West Emergency Gate */}
                <circle cx="40" cy="505" r="28" fill="url(#heat-low)" />
                <text x="40" y="510" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">12 exits/hr</text>
              </g>
            )}

            {/* ROOMS HEAT OVERLAYS */}
            {REFERENCE_ROOMS.map((r, idx) => {
              // Calculate simulated occupancy or usage based on time / type
              let pct = r.status === "Occupied" ? 85 + (idx % 3) * 4 : 22 + (idx % 4) * 3;
              if (heatmapType === "time_based") {
                pct = Math.min(100, Math.round(pct * (timelineHour >= 10 && timelineHour <= 14 ? 1.15 : 0.6)));
              }

              const isHigh = pct >= 75;
              const isMed = pct >= 40 && pct < 75;
              const fillGrad = isHigh ? "url(#heat-high)" : isMed ? "url(#heat-med)" : "url(#heat-low)";
              const strokeCol = isHigh ? "#ef4444" : isMed ? "#f59e0b" : "#10b981";

              return (
                <g key={r.id} className="cursor-pointer">
                  {/* Heat gradient rectangle */}
                  <rect
                    x={r.x}
                    y={r.y}
                    width={r.width}
                    height={r.height}
                    rx="8"
                    fill={fillGrad}
                    stroke={strokeCol}
                    strokeWidth={isHigh ? 3.5 : 2}
                  />

                  {/* Pulsing center heat centroid */}
                  <circle
                    cx={r.x + r.width / 2}
                    cy={r.y + r.height / 2 - 12}
                    r={isHigh ? 22 : 12}
                    fill={strokeCol}
                    opacity="0.3"
                    className={isHigh ? "animate-ping" : ""}
                  />

                  {/* Room Number */}
                  <text
                    x={r.x + r.width / 2}
                    y={r.y + r.height / 2 - 6}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="black"
                  >
                    {r.room_number}
                  </text>

                  {/* Density Metric Label */}
                  <text
                    x={r.x + r.width / 2}
                    y={r.y + r.height / 2 + 14}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10.5"
                    fontWeight="black"
                    fontFamily="monospace"
                  >
                    {heatmapType === "room_usage" ? `${(pct * 0.08).toFixed(1)} hrs` : `${pct}% Full`}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Heat Intensity Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 flex items-center gap-3 text-xs text-slate-300 shadow-2xl">
            <span className="font-bold text-amber-400 font-mono uppercase text-[10px]">Heat Scale:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="font-mono text-[11px]">0–40% (Low)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="font-mono text-[11px]">40–75% (Moderate)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-[11px] text-red-400 font-bold">75–100% (High Density)</span>
            </div>
          </div>

        </div>

        {/* TIME-BASED TIMELINE REPLAY BAR */}
        {heatmapType === "time_based" && (
          <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs z-10 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  isPlayingTimeline
                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25 font-black"
                    : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                }`}
              >
                {isPlayingTimeline ? <Pause size={13} /> : <Play size={13} />}
                <span>{isPlayingTimeline ? "Pause Replay" : "Play Timeline"}</span>
              </button>

              <button
                onClick={() => { setIsPlayingTimeline(false); setTimelineHour(8); }}
                className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
                title="Reset to 8:00 AM"
              >
                <RotateCcw size={13} />
              </button>

              <span className="text-xs font-mono font-bold text-amber-400 pl-2">
                Time: {timelineHour <= 12 ? `${timelineHour}:00 AM` : `${timelineHour - 12}:00 PM`}
              </span>
            </div>

            <div className="flex-1 max-w-sm">
              <input
                type="range"
                min="8"
                max="18"
                value={timelineHour}
                onChange={(e) => setTimelineHour(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------ */}
      {/* RIGHT: 7 HEATMAP CATEGORIES & OCCUPANCY ANALYTICS */}
      {/* ------------------------------------------------------------ */}
      <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 space-y-4 overflow-y-auto">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-2">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Flame size={16} className="text-amber-400" />
            <span>Campus Heatmap Intelligence</span>
          </h3>
          <p className="text-[11px] text-slate-400">Real-time spatial density & traffic telemetry</p>
        </div>

        {/* 7 HEATMAP CATEGORIES */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            Heatmap Category:
          </span>

          {heatmapCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setHeatmapType(cat.id as HeatmapType)}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                heatmapType === cat.id
                  ? "bg-amber-500/20 border-amber-500 text-white shadow-md font-bold"
                  : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/80"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">{cat.icon}</span>
                <div>
                  <h5 className="font-bold text-xs leading-tight">{cat.label}</h5>
                  <p className="text-[10px] text-slate-400">{cat.desc}</p>
                </div>
              </div>
              <ArrowRight size={13} className={heatmapType === cat.id ? "text-amber-400" : "text-slate-600"} />
            </button>
          ))}
        </div>

        {/* REAL-TIME OCCUPANCY METRICS CARDS */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
          <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
            Spatial Telemetry Metrics
          </span>

          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Headcount</span>
              <strong className="text-white text-sm">{metrics.totalPeopleOnFloor || 380} students</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Avg Occupancy</span>
              <strong className="text-amber-400 text-sm">{metrics.averageOccupancy || 64}%</strong>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1 font-mono text-[10.5px]">
            <div className="flex justify-between text-slate-400">
              <span>Peak Hours:</span>
              <span className="text-white font-bold">{metrics.peakHours}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Hourly Traffic:</span>
              <span className="text-emerald-400 font-bold">{metrics.totalFootfallPerHour || 1420} trips/hr</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Highest Density:</span>
              <span className="text-red-400 font-bold">{metrics.mostOccupied?.room_number || "A105"} ({metrics.mostOccupied?.occupancyPercentage || 92}%)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
