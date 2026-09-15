import React, { useState, useMemo } from "react";
import { CampusLocation, CampusCategory } from "../types";
import { CATEGORIES_CONFIG } from "../campusData";
import {
  X, Search, BookOpen, MapPin, Navigation, ArrowUpDown, Filter,
  Building2, Phone, ExternalLink, ArrowRight
} from "lucide-react";

interface CampusDirectoryModalProps {
  locations: CampusLocation[];
  onClose: () => void;
  onSelectLocation: (loc: CampusLocation) => void;
  onGetDirections: (loc: CampusLocation) => void;
}

export const CampusDirectoryModal: React.FC<CampusDirectoryModalProps> = ({
  locations,
  onClose,
  onSelectLocation,
  onGetDirections,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"name" | "code" | "category">("name");

  // Filter & Sort
  const directoryList = useMemo(() => {
    return locations
      .filter((loc) => {
        if (selectedCategory !== "ALL" && loc.category !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = loc.name.toLowerCase().includes(q);
          const matchCode = loc.buildingCode.toLowerCase().includes(q);
          const matchDept = loc.departments?.some((d) => d.toLowerCase().includes(q));
          const matchFacility = loc.facilities?.some((f) => f.toLowerCase().includes(q));
          return matchName || matchCode || matchDept || matchFacility;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "code") return a.buildingCode.localeCompare(b.buildingCode);
        return a.category.localeCompare(b.category);
      });
  }, [locations, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Official Campus Directory
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comprehensive registry of university buildings, labs, departments & amenities
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search departments, labs, faculty offices, facilities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Categories ({locations.length})</option>
              {CATEGORIES_CONFIG.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="name">Sort by Name</option>
              <option value="code">Sort by Building Code</option>
              <option value="category">Sort by Category</option>
            </select>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {directoryList.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No campus directory entries match your query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {directoryList.map((loc) => {
                const catConfig = CATEGORIES_CONFIG.find((c) => c.id === loc.category);
                return (
                  <div
                    key={loc.id}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-600 shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                          {loc.buildingCode}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">{loc.category}</span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                        {loc.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {loc.description}
                      </p>

                      {/* Departments or Facilities badges */}
                      {loc.departments && loc.departments.length > 0 && (
                        <div className="mt-2 text-[10px] text-blue-600 dark:text-blue-400 font-semibold truncate">
                          Dept: {loc.departments.slice(0, 2).join(", ")}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          onClose();
                          onSelectLocation(loc);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>View on Map</span>
                      </button>

                      <button
                        onClick={() => {
                          onClose();
                          onGetDirections(loc);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Directions</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
