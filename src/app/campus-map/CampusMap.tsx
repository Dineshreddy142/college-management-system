import React, { useState, useEffect, useCallback } from "react";
import { CampusLocation, ShuttleRoute, DirectionsResult } from "./types";
import { INITIAL_LOCATIONS, SHUTTLE_ROUTES, CAMPUS_CENTER, CATEGORIES_CONFIG } from "./campusData";
import { MapView } from "./components/MapView";
import { Sidebar } from "./components/Sidebar";
import { LocationCard } from "./components/LocationCard";
import { LocationDetailModal } from "./components/LocationDetailModal";
import { DirectionsPanel } from "./components/DirectionsPanel";
import { VirtualTourViewer } from "./components/VirtualTourViewer";
import { EmergencyPanel } from "./components/EmergencyPanel";
import { CampusDirectoryModal } from "./components/CampusDirectoryModal";
import { LandingOverlay } from "./components/LandingOverlay";
import { CampusMapAdmin } from "./admin/CampusMapAdmin";
import {
  Menu, X, Search, Compass, Navigation, ShieldAlert, BookOpen,
  Bus, Layers, Sun, Moon, Sparkles, SlidersHorizontal, Settings
} from "lucide-react";

interface CampusMapProps {
  isAdmin?: boolean;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  onBackToDashboard?: () => void;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  isAdmin = true, // default admin access enabled or toggleable
  theme = "light",
  onToggleTheme,
  onBackToDashboard,
}) => {
  // Master Location Database state (persisted to localStorage)
  const [locations, setLocations] = useState<CampusLocation[]>(() => {
    try {
      const saved = localStorage.getItem("campus-map-locations-data");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load campus locations from localStorage", e);
    }
    return INITIAL_LOCATIONS;
  });

  // Persist locations whenever updated
  const handleUpdateLocations = (newLocs: CampusLocation[]) => {
    setLocations(newLocs);
    try {
      localStorage.setItem("campus-map-locations-data", JSON.stringify(newLocs));
    } catch (e) {
      console.error("Failed to save campus locations to localStorage", e);
    }
  };

  // UI States
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);
  const [detailModalLocation, setDetailModalLocation] = useState<CampusLocation | null>(null);
  const [virtualTourLocation, setVirtualTourLocation] = useState<CampusLocation | null>(null);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hostelFilter, setHostelFilter] = useState<string | null>(null);

  // Active Layers Toggle Map
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    CATEGORIES_CONFIG.forEach((c) => {
      initial[c.id] = true;
    });
    return initial;
  });

  const [showShuttleLayer, setShowShuttleLayer] = useState<boolean>(true);
  const [isEmergencyMode, setIsEmergencyMode] = useState<boolean>(false);

  // Directions & Wayfinding
  const [showDirections, setShowDirections] = useState<boolean>(false);
  const [directionsTarget, setDirectionsTarget] = useState<CampusLocation | null>(null);
  const [activeRoute, setActiveRoute] = useState<DirectionsResult | null>(null);

  // Directory & Modals
  const [showDirectory, setShowDirectory] = useState<boolean>(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [showLandingOverlay, setShowLandingOverlay] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);

  // Coordinate Picking for Admin
  const [isPickingCoords, setIsPickingCoords] = useState<boolean>(false);
  const [coordPickCallback, setCoordPickCallback] = useState<((lat: number, lng: number) => void) | null>(null);

  // Geolocation
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);

  // Mobile sidebar drawer
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Geolocation Handler
  const handleRequestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser. Using Campus South Gate as starting point.");
      setUserLocation([12.8202, 80.0440]);
      return;
    }

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation([lat, lng]);
      },
      (err) => {
        setIsLocatingUser(false);
        console.warn("Geolocation permission error or timeout:", err);
        // Graceful fallback to campus entrance gate
        setUserLocation([12.8202, 80.0440]);
        alert("Location access was denied or timed out. Defaulted to Campus Main South Gate.");
      },
      { timeout: 8000 }
    );
  }, []);

  // Handle marker selection
  const handleSelectLocation = (loc: CampusLocation | null) => {
    setSelectedLocation(loc);
  };

  // Trigger Get Directions from a card or modal
  const handleStartDirections = (loc?: CampusLocation) => {
    setDirectionsTarget(loc || null);
    setShowDirections(true);
  };

  // Admin Coordinate Picker Initiator
  const handleStartPickingCoords = (onPicked: (lat: number, lng: number) => void) => {
    setShowAdminModal(false);
    setIsPickingCoords(true);
    setCoordPickCallback(() => (lat: number, lng: number) => {
      onPicked(lat, lng);
      setIsPickingCoords(false);
      setShowAdminModal(true);
    });
  };

  const handleMapClickCoords = (lat: number, lng: number) => {
    if (coordPickCallback) {
      coordPickCallback(lat, lng);
    }
  };

  return (
    <div className={`relative w-full h-screen overflow-hidden flex flex-col font-[Inter,sans-serif] ${theme === "dark" ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      
      {/* Top Floating App Bar */}
      <header className="z-20 h-14 px-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-sm">
        {/* Left: Mobile Menu Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Categories"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight leading-none block text-slate-900 dark:text-white">
                CAMPUS INTERACTIVE MAP
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                University Virtual Visit & Wayfinding
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* My Location GPS */}
          <button
            onClick={handleRequestUserLocation}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              userLocation
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            title="Detect My Location"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocatingUser ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">My Location</span>
          </button>

          {/* Directions Toggle */}
          <button
            onClick={() => setShowDirections((p) => !p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showDirections
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Directions</span>
          </button>

          {/* Directory Button */}
          <button
            onClick={() => setShowDirectory(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-500" />
            <span className="hidden sm:inline">Directory</span>
          </button>

          {/* Shuttle Layer Toggle */}
          <button
            onClick={() => setShowShuttleLayer((p) => !p)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showShuttleLayer
                ? "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Bus className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden md:inline">Shuttle</span>
          </button>

          {/* Emergency SOS Button */}
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all hover:scale-105"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SOS</span>
          </button>

          {/* Admin Editor Button */}
          {isAdmin && (
            <button
              onClick={() => setShowAdminModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Admin Editor</span>
            </button>
          )}

          {/* Back to Portal / Dashboard if callback provided */}
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 transition-colors"
            >
              Portal
            </button>
          )}

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Light/Dark Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Content: Sidebar + Full Map */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          locations={locations}
          selectedLocation={selectedLocation}
          onSelectLocation={handleSelectLocation}
          activeCategory={activeCategory}
          onSelectCategory={(cat) => setActiveCategory(cat)}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          onOpenDirections={handleStartDirections}
          onOpenDirectory={() => setShowDirectory(true)}
          onToggleEmergency={() => setIsEmergencyMode((p) => !p)}
          isEmergencyMode={isEmergencyMode}
          onOpenAdmin={() => setShowAdminModal(true)}
          isAdmin={isAdmin}
          showShuttleLayer={showShuttleLayer}
          onToggleShuttle={() => setShowShuttleLayer((p) => !p)}
          hostelFilter={hostelFilter}
          onHostelFilterChange={(hf) => setHostelFilter(hf)}
          isOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Map Container View */}
        <main className="relative flex-1 h-full w-full">
          <MapView
            locations={locations}
            selectedLocation={selectedLocation}
            onSelectLocation={handleSelectLocation}
            activeCategory={activeCategory}
            activeLayers={activeLayers}
            showShuttleLayer={showShuttleLayer}
            shuttleRoutes={SHUTTLE_ROUTES}
            activeRoute={activeRoute}
            userLocation={userLocation}
            isEmergencyMode={isEmergencyMode}
            onMapClickCoords={handleMapClickCoords}
            isPickingCoords={isPickingCoords}
          />

          {/* Floating Marker Preview Card */}
          {selectedLocation && !showDirections && (
            <LocationCard
              location={selectedLocation}
              onClose={() => setSelectedLocation(null)}
              onViewDetails={(loc) => setDetailModalLocation(loc)}
              onGetDirections={handleStartDirections}
              onStartVirtualTour={(loc) => setVirtualTourLocation(loc)}
            />
          )}

          {/* Directions / Wayfinding Panel */}
          {showDirections && (
            <DirectionsPanel
              locations={locations}
              initialDestination={directionsTarget || selectedLocation}
              userLocation={userLocation}
              onRequestUserLocation={handleRequestUserLocation}
              onClose={() => {
                setShowDirections(false);
                setActiveRoute(null);
              }}
              onRouteCalculated={(route) => setActiveRoute(route)}
            />
          )}
        </main>
      </div>

      {/* Comprehensive Location Details Modal */}
      {detailModalLocation && (
        <LocationDetailModal
          location={detailModalLocation}
          onClose={() => setDetailModalLocation(null)}
          onGetDirections={handleStartDirections}
          onStartVirtualTour={(loc) => {
            setDetailModalLocation(null);
            setVirtualTourLocation(loc);
          }}
          allLocations={locations}
          onSelectNearby={(nearby) => {
            setDetailModalLocation(nearby);
            setSelectedLocation(nearby);
          }}
        />
      )}

      {/* 360 Virtual Tour Modal */}
      {virtualTourLocation && (
        <VirtualTourViewer
          location={virtualTourLocation}
          onClose={() => setVirtualTourLocation(null)}
        />
      )}

      {/* Campus Directory Modal */}
      {showDirectory && (
        <CampusDirectoryModal
          locations={locations}
          onClose={() => setShowDirectory(false)}
          onSelectLocation={(loc) => {
            setSelectedLocation(loc);
            setShowDirectory(false);
          }}
          onGetDirections={(loc) => {
            setShowDirectory(false);
            handleStartDirections(loc);
          }}
        />
      )}

      {/* Emergency SOS Dispatch Modal */}
      {showEmergencyModal && (
        <EmergencyPanel
          locations={locations}
          onClose={() => setShowEmergencyModal(false)}
          onSelectLocation={(loc) => {
            setSelectedLocation(loc);
            setIsEmergencyMode(true);
            setShowEmergencyModal(false);
          }}
        />
      )}

      {/* Landing / Welcome Hero Overlay */}
      {showLandingOverlay && (
        <LandingOverlay
          onClose={() => setShowLandingOverlay(false)}
          onSearch={(q) => {
            setSearchQuery(q);
            setShowLandingOverlay(false);
          }}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            setShowLandingOverlay(false);
          }}
        />
      )}

      {/* Admin Location Editor & Data Manager Modal */}
      {showAdminModal && (
        <CampusMapAdmin
          locations={locations}
          onUpdateLocations={handleUpdateLocations}
          onClose={() => setShowAdminModal(false)}
          onStartPickingCoords={handleStartPickingCoords}
        />
      )}
    </div>
  );
};
