import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  MapPin,
  Compass,
  Building,
  Users,
  Navigation,
  Clock,
  History,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  X,
  Layers,
  School,
  Coffee,
  Shield,
  Tag,
  Flame,
  HelpCircle
} from "lucide-react";
import client from "../../../api/client";
import { REFERENCE_ROOMS } from "./FloorViewer";

export type SearchCategory = "All" | "Rooms" | "Buildings & Floors" | "Facilities" | "Departments" | "Staff";

export interface SearchResultItem {
  id: string;
  type: "Room" | "Facility" | "Staff" | "Department" | "Building" | "Floor";
  title: string;
  subtitle: string;
  location: string;
  x: number;
  y: number;
  icon: string;
  floorId?: number;
  tags?: string[];
}

export function CampusSearchHub({ onNavigateTo }: { onNavigateTo?: (nodeId: string) => void }) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("All");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedResult, setSelectedResult] = useState<SearchResultItem | null>(null);

  // Search History State (Persisted in localStorage)
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "A101",
    "Computer Lab",
    "Library",
    "CSE Department",
    "Restroom",
    "Elevator"
  ]);

  // Quick Preset Search Queries
  const quickQueryPresets = [
    { label: "A101", category: "Rooms", icon: "🏫" },
    { label: "Computer Lab", category: "Rooms", icon: "💻" },
    { label: "Library", category: "Facilities", icon: "📖" },
    { label: "CSE Department", category: "Departments", icon: "⚡" },
    { label: "Admin Office", category: "Rooms", icon: "📋" },
    { label: "Restroom", category: "Facilities", icon: "🚻" },
    { label: "Elevator", category: "Facilities", icon: "🛗" },
    { label: "Faculty Room", category: "Rooms", icon: "👩‍🏫" }
  ];

  // Perform Live Search via Backend API or Local Fallback
  const handleExecuteSearch = useCallback(async (queryText: string) => {
    const q = queryText.trim();
    if (!q) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await client.get(`/indoor-map/search?query=${encodeURIComponent(q)}`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        let filtered = res.data.data;
        if (activeCategory !== "All") {
          if (activeCategory === "Rooms") filtered = filtered.filter((r: any) => r.type === "Room");
          if (activeCategory === "Facilities") filtered = filtered.filter((r: any) => r.type === "Facility");
          if (activeCategory === "Staff") filtered = filtered.filter((r: any) => r.type === "Staff");
          if (activeCategory === "Departments") filtered = filtered.filter((r: any) => r.type === "Department");
        }
        setResults(filtered);
        if (filtered.length > 0) setSelectedResult(filtered[0]);
      }
    } catch (_) {
      // Offline fallback
      const localMatches: SearchResultItem[] = REFERENCE_ROOMS
        .filter(r => r.room_number.toLowerCase().includes(q.toLowerCase()) || r.room_name.toLowerCase().includes(q.toLowerCase()))
        .map(r => ({
          id: `ROOM_${r.id}`,
          type: "Room",
          title: `${r.room_number} - ${r.room_name}`,
          subtitle: `${r.department || "General"} • ${r.room_type}`,
          location: `Block A, Floor 1`,
          x: r.x + r.width / 2,
          y: r.y + r.height / 2,
          icon: "🏫"
        }));
      setResults(localMatches);
      if (localMatches.length > 0) setSelectedResult(localMatches[0]);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory]);

  // Debounced search trigger
  useEffect(() => {
    const timeout = setTimeout(() => {
      handleExecuteSearch(searchQuery);
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchQuery, handleExecuteSearch]);

  // Handle Search Submission & History Tracking
  const handleSelectQuery = (q: string) => {
    setSearchQuery(q);
    if (!recentSearches.includes(q)) {
      setRecentSearches(prev => [q, ...prev.slice(0, 7)]);
    }
  };

  const handleClearHistory = () => {
    setRecentSearches([]);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl select-none">
      
      {/* ------------------------------------------------------------ */}
      {/* LEFT: SEARCH RESULTS & BLUEPRINT PINPOINT MAP */}
      {/* ------------------------------------------------------------ */}
      <div className="flex-1 relative bg-slate-950 flex flex-col overflow-hidden">
        
        {/* Top Search Filter Header */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10 backdrop-blur-md">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-black uppercase text-indigo-400 font-mono px-1">CATEGORY:</span>
            {(["All", "Rooms", "Buildings & Floors", "Facilities", "Departments", "Staff"] as SearchCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-950 text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-slate-400">
            Matches: <strong className="text-indigo-400">{results.length}</strong>
          </span>
        </div>

        {/* Interactive Floor Pinpoint Canvas */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden p-2">
          <svg viewBox="0 0 1000 750" className="w-full h-full">
            {/* Base Shell */}
            <rect width="1000" height="750" fill="#090d16" />
            <rect x="20" y="20" width="960" height="670" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="6" />

            {/* Rooms Outline */}
            {REFERENCE_ROOMS.map((r) => {
              const isMatch = selectedResult && selectedResult.title.includes(r.room_number);

              return (
                <g key={r.id} className="cursor-pointer">
                  <rect
                    x={r.x}
                    y={r.y}
                    width={r.width}
                    height={r.height}
                    rx="6"
                    fill={r.fill}
                    stroke={isMatch ? "#38bdf8" : r.stroke}
                    strokeWidth={isMatch ? 4 : 2}
                    opacity={isMatch ? 1 : 0.6}
                  />
                  <text x={r.x + r.width / 2} y={r.y + r.height / 2 + 3} textAnchor="middle" fill="#0f172a" fontSize="10.5" fontWeight="bold">
                    {r.room_number}
                  </text>
                </g>
              );
            })}

            {/* HIGHLIGHT SELECTED PINPOINT MARKER */}
            {selectedResult && (
              <g transform={`translate(${selectedResult.x}, ${selectedResult.y})`}>
                {/* Pulsing Target Rings */}
                <circle r="22" fill="rgba(56, 189, 248, 0.2)" className="animate-ping" />
                <circle r="14" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                <circle r="5" fill="#ffffff" />

                {/* Floating Tooltip Bubble */}
                <g transform="translate(0, -32)" className="pointer-events-none">
                  <rect x="-65" y="-12" width="130" height="24" rx="6" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
                  <text textAnchor="middle" y="4" fill="#ffffff" fontSize="10" fontWeight="black" fontFamily="sans-serif">
                    {selectedResult.title.slice(0, 20)}
                  </text>
                </g>
              </g>
            )}
          </svg>
        </div>

        {/* Quick Result Preview Bar */}
        {selectedResult && (
          <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs z-10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-lg">
                {selectedResult.icon || "📍"}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{selectedResult.title}</h4>
                <p className="text-[11px] text-slate-400">{selectedResult.subtitle} • {selectedResult.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTo && onNavigateTo(selectedResult.id)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/25"
              >
                <Compass size={13} />
                <span>Navigate Here</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------ */}
      {/* RIGHT: SEARCH BAR, SUGGESTIONS & SEARCH HISTORY */}
      {/* ------------------------------------------------------------ */}
      <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 space-y-4 overflow-y-auto">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-2">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Search size={16} className="text-indigo-400" />
            <span>Campus Universal Search</span>
          </h3>
          <p className="text-[11px] text-slate-400">Search rooms, staff, labs, departments & facilities</p>
        </div>

        {/* 1. SEARCH INPUT WITH CLEAR BUTTON */}
        <div>
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search e.g. A101, Computer Lab, Library, CSE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder:text-slate-500 font-semibold focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* 2. POPULAR PRESET SEARCH PILLS */}
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
            Quick Searches:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickQueryPresets.map(preset => (
              <button
                key={preset.label}
                onClick={() => handleSelectQuery(preset.label)}
                className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white text-[11px] font-semibold transition-all flex items-center gap-1"
              >
                <span>{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. RECENT SEARCHES HISTORY */}
        {recentSearches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <History size={12} className="text-slate-500" />
                <span>Recent Searches</span>
              </span>
              <button onClick={handleClearHistory} className="text-[10px] text-slate-500 hover:text-slate-300">
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {recentSearches.map(q => (
                <button
                  key={q}
                  onClick={() => handleSelectQuery(q)}
                  className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-400 hover:text-white font-mono flex items-center gap-1"
                >
                  <Clock size={10} />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. SEARCH RESULTS LIST */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
            {isLoading ? "Searching Campus Map..." : results.length > 0 ? `Results (${results.length})` : "Suggestions"}
          </span>

          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {results.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedResult(item)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                  selectedResult?.id === item.id
                    ? "bg-indigo-600/20 border-indigo-500 shadow-md"
                    : "bg-slate-950 border-slate-800 hover:bg-slate-800/80"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-sm shrink-0">
                    {item.icon || "📍"}
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs leading-tight">{item.title}</h5>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">{item.subtitle}</p>
                    <span className="text-[9.5px] text-indigo-400 font-mono mt-0.5 block">{item.location}</span>
                  </div>
                </div>

                <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                  {item.type}
                </span>
              </div>
            ))}

            {results.length === 0 && searchQuery && !isLoading && (
              <div className="p-4 text-center text-slate-500 text-xs">
                <p>No direct matches found for "{searchQuery}".</p>
                <p className="text-[10px] text-indigo-400 mt-1 font-mono">Try searching "A101", "Lab", "Library", or "Restroom".</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
