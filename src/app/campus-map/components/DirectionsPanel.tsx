import React, { useState, useEffect } from "react";
import { CampusLocation, DirectionsResult } from "../types";
import { calculateCampusRoute, CAMPUS_CENTER } from "../campusData";
import {
  X, Navigation, ArrowUpDown, Footprints, Car, Clock, MapPin,
  Compass, CheckCircle2, ChevronRight
} from "lucide-react";

interface DirectionsPanelProps {
  locations: CampusLocation[];
  initialDestination?: CampusLocation | null;
  userLocation: [number, number] | null;
  onRequestUserLocation: () => void;
  onClose: () => void;
  onRouteCalculated: (route: DirectionsResult | null) => void;
}

export const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  locations,
  initialDestination,
  userLocation,
  onRequestUserLocation,
  onClose,
  onRouteCalculated,
}) => {
  // "USER_LOC" or "MAIN_GATE" or location ID
  const [fromId, setFromId] = useState<string>("MAIN_GATE");
  const [toId, setToId] = useState<string>(
    initialDestination ? initialDestination.id : locations[0]?.id || ""
  );
  const [travelMode, setTravelMode] = useState<"walking" | "driving">("walking");
  const [routeResult, setRouteResult] = useState<DirectionsResult | null>(null);

  // When initialDestination changes, update toId
  useEffect(() => {
    if (initialDestination) {
      setToId(initialDestination.id);
    }
  }, [initialDestination]);

  // Main Gate coordinates preset
  const MAIN_GATE_COORDS: [number, number] = [12.8202, 80.0440];

  // Calculate route
  const handleCalculateRoute = () => {
    let fromLat = MAIN_GATE_COORDS[0];
    let fromLng = MAIN_GATE_COORDS[1];
    let fromName = "Campus Main Entrance Gate";

    if (fromId === "USER_LOC") {
      if (userLocation) {
        fromLat = userLocation[0];
        fromLng = userLocation[1];
        fromName = "My Current Location";
      } else {
        onRequestUserLocation();
        return;
      }
    } else if (fromId !== "MAIN_GATE") {
      const startLoc = locations.find((l) => l.id === fromId);
      if (startLoc) {
        fromLat = startLoc.latitude;
        fromLng = startLoc.longitude;
        fromName = startLoc.name;
      }
    }

    const endLoc = locations.find((l) => l.id === toId);
    if (!endLoc) return;

    const toLat = endLoc.latitude;
    const toLng = endLoc.longitude;
    const toName = endLoc.name;

    const routeData = calculateCampusRoute(fromLat, fromLng, toLat, toLng, travelMode);

    const result: DirectionsResult = {
      fromName,
      toName,
      travelMode,
      distanceMeters: routeData.distanceMeters,
      estimatedMinutes: routeData.durationMinutes,
      path: routeData.path,
      steps: routeData.steps,
    };

    setRouteResult(result);
    onRouteCalculated(result);
  };

  // Trigger route calculation when from, to, or mode change
  useEffect(() => {
    if (toId) {
      handleCalculateRoute();
    }
  }, [fromId, toId, travelMode, userLocation]);

  const handleSwap = () => {
    if (fromId !== "USER_LOC" && fromId !== "MAIN_GATE") {
      const temp = fromId;
      setFromId(toId);
      setToId(temp);
    }
  };

  const handleClear = () => {
    setRouteResult(null);
    onRouteCalculated(null);
    onClose();
  };

  return (
    <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-[380px] z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Campus Wayfinding
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Pedestrian navigation & routes</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Inputs & Travel Mode */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
        {/* Travel Mode Toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setTravelMode("walking")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              travelMode === "walking"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Walking Route</span>
          </button>
          <button
            onClick={() => setTravelMode("driving")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              travelMode === "driving"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Campus Road</span>
          </button>
        </div>

        {/* Origin & Destination Selectors */}
        <div className="space-y-2 relative">
          {/* Origin */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
              A
            </span>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="flex-1 text-xs py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="MAIN_GATE">Campus Main Entrance Gate (South)</option>
              <option value="USER_LOC">
                {userLocation ? "📍 My Current Location" : "📍 Detect My Current Location"}
              </option>
              <optgroup label="Campus Buildings">
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.buildingCode} - {loc.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-end pr-3">
            <button
              onClick={handleSwap}
              title="Swap Start & Destination"
              className="p-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Destination */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
              B
            </span>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="flex-1 text-xs py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <optgroup label="Select Campus Destination">
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.buildingCode} - {loc.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Route Result Summary */}
      {routeResult && (
        <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <span className="text-base font-black text-slate-900 dark:text-slate-100">
                  {routeResult.estimatedMinutes} min
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">
                  {routeResult.travelMode === "walking" ? "Walking Pace" : "Vehicle Travel"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                {routeResult.distanceMeters >= 1000
                  ? `${(routeResult.distanceMeters / 1000).toFixed(2)} km`
                  : `${routeResult.distanceMeters} m`}
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">Campus Distance</span>
            </div>
          </div>

          {/* Turn-by-Turn Steps */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Turn-by-Turn Directions
            </h4>
            <div className="space-y-2 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              {routeResult.steps.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-3 pl-1">
                  <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 border-2 border-blue-500 text-blue-600 flex items-center justify-center shrink-0 z-10 text-[10px] font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <p className="text-slate-800 dark:text-slate-200 text-xs font-medium">
                      {step.instruction}
                    </p>
                    {step.distance !== "0 m" && (
                      <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
                        {step.distance}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
