import React from "react";
import { CampusLocation } from "../types";
import { CATEGORIES_CONFIG } from "../campusData";
import {
  X, Navigation, Eye, Clock, MapPin, Sparkles, CheckCircle2,
  ExternalLink, Phone, Share2
} from "lucide-react";

interface LocationCardProps {
  location: CampusLocation;
  onClose: () => void;
  onViewDetails: (loc: CampusLocation) => void;
  onGetDirections: (loc: CampusLocation) => void;
  onStartVirtualTour?: (loc: CampusLocation) => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  onClose,
  onViewDetails,
  onGetDirections,
  onStartVirtualTour,
}) => {
  const catConfig = CATEGORIES_CONFIG.find((c) => c.id === location.category);

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[380px] z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Image & Header Overlay */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-900">
        <img
          src={location.image}
          alt={location.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-md flex items-center gap-1 backdrop-blur-md"
              style={{ backgroundColor: catConfig?.color || "#2563EB" }}
            >
              <span>{catConfig?.emoji || "📍"}</span>
              <span>{location.buildingCode}</span>
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/50 text-white/90 backdrop-blur-md border border-white/20">
              {location.category}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center backdrop-blur-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title over image */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="text-base font-bold leading-snug drop-shadow-md line-clamp-1">
            {location.name}
          </h3>
          <p className="text-xs text-slate-200/90 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{location.address}</span>
          </p>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 space-y-3 text-xs">
        {/* Description */}
        <p className="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {location.description}
        </p>

        {/* Facilities Chips */}
        {location.facilities && location.facilities.length > 0 && (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Key Facilities:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {location.facilities.slice(0, 3).map((f, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                >
                  • {f}
                </span>
              ))}
              {location.facilities.length > 3 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                  +{location.facilities.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Opening Hours Status */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{location.openingHours}</span>
          </div>
          <span
            className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
              location.isOpenNow !== false
                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
            }`}
          >
            {location.isOpenNow !== false ? "Open Now" : "Closed"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={() => onGetDirections(location)}
            className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Get Directions</span>
          </button>

          <button
            onClick={() => onViewDetails(location)}
            className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Details</span>
          </button>

          {location.virtualTour?.enabled && (
            <button
              onClick={() => onStartVirtualTour && onStartVirtualTour(location)}
              title="Start 360° Virtual Tour"
              className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
