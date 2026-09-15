import React, { useState, useMemo } from "react";
import { CampusCategory, CampusLocation, CategoryMetadata } from "../types";
import { CATEGORIES_CONFIG } from "../campusData";
import {
  Search, X, ChevronDown, ChevronRight, MapPin, Navigation,
  Layers, Bus, ShieldAlert, Sparkles, SlidersHorizontal, BookOpen,
  Eye, Building2, Check, ArrowRight
} from "lucide-react";

interface SidebarProps {
  locations: CampusLocation[];
  selectedLocation: CampusLocation | null;
  onSelectLocation: (loc: CampusLocation | null) => void;
  activeCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenDirections: (loc?: CampusLocation) => void;
  onOpenDirectory: () => void;
  onToggleEmergency: () => void;
  isEmergencyMode: boolean;
  onOpenAdmin: () => void;
  isAdmin: boolean;
  showShuttleLayer: boolean;
  onToggleShuttle: () => void;
  hostelFilter: string | null;
  onHostelFilterChange: (gender: string | null) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onOpenDirections,
  onOpenDirectory,
  onToggleEmergency,
  isEmergencyMode,
  onOpenAdmin,
  isAdmin,
  showShuttleLayer,
  onToggleShuttle,
  hostelFilter,
  onHostelFilterChange,
  isOpen,
  onCloseMobile,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "Academic Buildings": true,
  });

  // Toggle Category Accordion
  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
    if (activeCategory === catId) {
      onSelectCategory(null);
    } else {
      onSelectCategory(catId);
    }
  };

  // Filtered locations for search / suggestions
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return locations.filter((loc) => {
      const matchName = loc.name.toLowerCase().includes(q);
      const matchCode = loc.buildingCode.toLowerCase().includes(q);
      const matchDesc = loc.description.toLowerCase().includes(q);
      const matchDept = loc.departments?.some((d) => d.toLowerCase().includes(q));
      const matchFacility = loc.facilities?.some((f) => f.toLowerCase().includes(q));
      const matchCategory = loc.category.toLowerCase().includes(q);
      return matchName || matchCode || matchDesc || matchDept || matchFacility || matchCategory;
    });
  }, [locations, searchQuery]);

  // Group locations by category
  const locationsByCategory = useMemo(() => {
    const grouped: Record<string, CampusLocation[]> = {};
    CATEGORIES_CONFIG.forEach((cat) => {
      grouped[cat.id] = locations.filter((l) => {
        if (l.category !== cat.id) return false;
        if (cat.id === "Hostels / Residence Halls" && hostelFilter) {
          if (hostelFilter === "Men" && l.hostelDetails?.gender !== "Men") return false;
          if (hostelFilter === "Women" && l.hostelDetails?.gender !== "Women") return false;
          if (hostelFilter === "International" && l.hostelDetails?.residenceType !== "International") return false;
          if (hostelFilter === "PG" && l.hostelDetails?.residenceType !== "Postgraduate") return false;
        }
        return true;
      });
    });
    return grouped;
  }, [locations, hostelFilter]);

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-30 w-full md:w-[380px] lg:w-[420px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl md:shadow-none transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      {/* Header & University Branding */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md border border-white/20">
            U
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide leading-none text-white">
              CAMPUS NAVIGATOR
            </h1>
            <p className="text-[11px] text-blue-200/90 font-medium mt-0.5">
              Interactive University Map & Directory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/20 text-blue-200 hover:bg-blue-500/40 transition-colors border border-blue-400/30"
              title="Campus Map Admin"
            >
              Admin
            </button>
          )}
          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Campus Search Bar */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search buildings, CSE, library, labs, cafe..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        {!searchQuery && (
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar text-[11px]">
            <span className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Quick:</span>
            {["Library", "CSE", "Hostel", "Food Court", "ATM", "Sports"].map((tag) => (
              <button
                key={tag}
                onClick={() => onSearchChange(tag)}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="grid grid-cols-4 gap-1 p-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px]">
        <button
          onClick={() => onOpenDirections()}
          className="flex flex-col items-center justify-center p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Navigation className="w-4 h-4 text-blue-600 mb-1" />
          <span className="font-semibold text-[10px]">Directions</span>
        </button>
        <button
          onClick={onOpenDirectory}
          className="flex flex-col items-center justify-center p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <BookOpen className="w-4 h-4 text-purple-600 mb-1" />
          <span className="font-semibold text-[10px]">Directory</span>
        </button>
        <button
          onClick={onToggleShuttle}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors ${
            showShuttleLayer
              ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold"
              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
        >
          <Bus className="w-4 h-4 text-sky-600 mb-1" />
          <span className="text-[10px]">Shuttle</span>
        </button>
        <button
          onClick={onToggleEmergency}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors ${
            isEmergencyMode
              ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold animate-pulse"
              : "hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-300 hover:text-red-600"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-red-600 mb-1" />
          <span className="text-[10px]">Emergency</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Search Results View */}
        {searchQuery.trim() ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>Found {searchResults.length} location{searchResults.length !== 1 ? "s" : ""}</span>
              <button
                onClick={() => onSearchChange("")}
                className="text-blue-600 hover:underline text-[11px]"
              >
                Clear
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No campus locations matching &ldquo;{searchQuery}&rdquo;</p>
              </div>
            ) : (
              searchResults.map((loc) => (
                <div
                  key={loc.id}
                  onClick={() => onSelectLocation(loc)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedLocation?.id === loc.id
                      ? "bg-blue-50/80 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 shadow-sm"
                      : "bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <img
                      src={loc.image}
                      alt={loc.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-100 dark:border-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                          {loc.buildingCode}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">{loc.category}</span>
                      </div>
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 mt-1 truncate">
                        {loc.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {loc.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Categories Tree View */
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Explore Categories
              </span>
              {activeCategory && (
                <button
                  onClick={() => onSelectCategory(null)}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Show All Markers
                </button>
              )}
            </div>

            {CATEGORIES_CONFIG.map((cat) => {
              const catLocations = locationsByCategory[cat.id] || [];
              const isExpanded = !!expandedCategories[cat.id];
              const isCategoryActive = activeCategory === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`rounded-xl border transition-all overflow-hidden ${
                    isCategoryActive
                      ? "border-blue-500/80 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm"
                      : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80"
                  }`}
                >
                  {/* Category Header Row */}
                  <div
                    onClick={() => toggleCategory(cat.id)}
                    className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base">{cat.emoji}</span>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {cat.label}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {catLocations.length}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Category Items */}
                  {isExpanded && (
                    <div className="px-2.5 pb-2.5 pt-1 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5">
                      {/* Sub-filter if category is Hostels */}
                      {cat.id === "Hostels / Residence Halls" && (
                        <div className="flex items-center gap-1 pb-1 pt-0.5 overflow-x-auto text-[10px]">
                          {["All", "Men", "Women", "International", "PG"].map((sub) => {
                            const active = (sub === "All" && !hostelFilter) || hostelFilter === sub;
                            return (
                              <button
                                key={sub}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onHostelFilterChange(sub === "All" ? null : sub);
                                }}
                                className={`px-2 py-0.5 rounded-full font-medium transition-all ${
                                  active
                                    ? "bg-purple-600 text-white"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                {sub}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {catLocations.length === 0 ? (
                        <p className="text-[11px] text-slate-400 py-1 italic">No locations under this filter.</p>
                      ) : (
                        catLocations.map((loc) => {
                          const isLocSelected = selectedLocation?.id === loc.id;
                          return (
                            <div
                              key={loc.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectLocation(loc);
                              }}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                                isLocSelected
                                  ? "bg-blue-600 text-white font-medium shadow-sm"
                                  : "hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    isLocSelected
                                      ? "bg-white/20 text-white"
                                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                  }`}
                                >
                                  {loc.buildingCode}
                                </span>
                                <span className="text-xs truncate">{loc.name}</span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenDirections(loc);
                                }}
                                title="Get Directions"
                                className={`p-1 rounded transition-colors ${
                                  isLocSelected
                                    ? "hover:bg-white/20 text-white"
                                    : "hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400"
                                }`}
                              >
                                <Navigation className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center text-[11px] text-slate-400 flex items-center justify-between">
        <span>University Campus Map v2.0</span>
        <button
          onClick={onToggleEmergency}
          className="text-red-500 font-semibold hover:underline flex items-center gap-1"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          24/7 Security: (044) 2741-9999
        </button>
      </div>
    </aside>
  );
};
