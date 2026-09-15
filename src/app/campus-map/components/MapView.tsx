import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { CampusLocation, ShuttleRoute, DirectionsResult } from "../types";
import { CAMPUS_CENTER, CATEGORIES_CONFIG } from "../campusData";
import {
  Layers, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw,
  Navigation, Eye, EyeOff, Bus, Flame, ShieldAlert, Sparkles
} from "lucide-react";

interface MapViewProps {
  locations: CampusLocation[];
  selectedLocation: CampusLocation | null;
  onSelectLocation: (loc: CampusLocation | null) => void;
  activeCategory: string | null;
  activeLayers: Record<string, boolean>;
  showShuttleLayer: boolean;
  shuttleRoutes: ShuttleRoute[];
  activeRoute: DirectionsResult | null;
  userLocation: [number, number] | null;
  isEmergencyMode: boolean;
  onMapClickCoords?: (lat: number, lng: number) => void;
  isPickingCoords?: boolean;
}

type BasemapStyle = "roadmap" | "satellite" | "dark";

export const MapView: React.FC<MapViewProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  activeCategory,
  activeLayers,
  showShuttleLayer,
  shuttleRoutes,
  activeRoute,
  userLocation,
  isEmergencyMode,
  onMapClickCoords,
  isPickingCoords = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeMarkersRef = useRef<L.LayerGroup | null>(null);
  const shuttleGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [basemap, setBasemap] = useState<BasemapStyle>("roadmap");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: CAMPUS_CENTER,
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
      maxZoom: 19,
      minZoom: 14,
    });

    // Add initial tile layer
    const initialTile = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
        subdomains: "abcd",
      }
    ).addTo(map);

    tileLayerRef.current = initialTile;
    markersGroupRef.current = L.layerGroup().addTo(map);
    routeMarkersRef.current = L.layerGroup().addTo(map);
    shuttleGroupRef.current = L.layerGroup().addTo(map);

    // Map click listener for coordinate picker or dismissing card
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (isPickingCoords && onMapClickCoords) {
        onMapClickCoords(e.latlng.lat, e.latlng.lng);
      } else {
        // click on empty map unselects if not picking coords
        onSelectLocation(null);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Tiles
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    let url = "";
    let options: L.TileLayerOptions = { maxZoom: 19 };

    if (basemap === "satellite") {
      url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      options = { maxZoom: 19, attribution: "Esri" };
    } else if (basemap === "dark") {
      url = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      options = { maxZoom: 19, subdomains: "abcd" };
    } else {
      url = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      options = { maxZoom: 19, subdomains: "abcd" };
    }

    const newTile = L.tileLayer(url, options).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [basemap]);

  // Render Building Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    // Filter locations based on activeCategory, activeLayers, and emergencyMode
    const filteredLocations = locations.filter((loc) => {
      if (isEmergencyMode) {
        return loc.category === "Emergency Services" || loc.category === "Health & Medical";
      }
      if (activeCategory && loc.category !== activeCategory) {
        return false;
      }
      if (activeLayers[loc.category] === false) {
        return false;
      }
      return true;
    });

    filteredLocations.forEach((loc) => {
      const isSelected = selectedLocation?.id === loc.id;
      const catConfig = CATEGORIES_CONFIG.find((c) => c.id === loc.category);
      const markerColor = catConfig?.color || "#2563EB";
      const emoji = catConfig?.emoji || "📍";

      // Create rich custom HTML marker
      const markerHtml = `
        <div class="group relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${
          isSelected ? "scale-125 z-50" : "hover:scale-110"
        }">
          ${
            isSelected
              ? `<div class="absolute -inset-2 rounded-full bg-blue-500/40 animate-ping"></div>`
              : ""
          }
          <div class="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full shadow-lg border border-white/80 font-medium text-xs text-white transition-all ${
            isEmergencyMode ? "bg-red-600 ring-4 ring-red-300 animate-bounce" : ""
          }" style="background-color: ${isEmergencyMode ? "#DC2626" : markerColor};">
            <span class="text-sm">${emoji}</span>
            <span class="font-semibold whitespace-nowrap drop-shadow-sm">${loc.buildingCode}</span>
          </div>
          <div class="w-2 h-2 rotate-45 border-r border-b border-white -mt-1 shadow-sm" style="background-color: ${
            isEmergencyMode ? "#DC2626" : markerColor
          };"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-campus-marker",
        html: markerHtml,
        iconSize: [80, 40],
        iconAnchor: [40, 36],
      });

      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: customIcon,
        title: loc.name,
      });

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectLocation(loc);
      });

      markersGroupRef.current?.addLayer(marker);
    });

    // Auto-fit bounds if a category is selected and has markers
    if (activeCategory && filteredLocations.length > 0 && mapInstanceRef.current) {
      const bounds = L.latLngBounds(filteredLocations.map((l) => [l.latitude, l.longitude]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [80, 80], maxZoom: 17, animate: true });
    }
  }, [locations, selectedLocation, activeCategory, activeLayers, isEmergencyMode]);

  // Fly to selected location when changed
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation) return;
    mapInstanceRef.current.flyTo(
      [selectedLocation.latitude, selectedLocation.longitude],
      17,
      { animate: true, duration: 1.2 }
    );
  }, [selectedLocation]);

  // Render Shuttle Routes & Stops
  useEffect(() => {
    if (!mapInstanceRef.current || !shuttleGroupRef.current) return;
    shuttleGroupRef.current.clearLayers();

    if (!showShuttleLayer) return;

    shuttleRoutes.forEach((route) => {
      // Draw route line
      const polyline = L.polyline(route.path, {
        color: route.color,
        weight: 5,
        opacity: 0.85,
        dashArray: "8, 8",
        lineCap: "round",
      });
      polyline.bindTooltip(route.name, { sticky: true });
      shuttleGroupRef.current?.addLayer(polyline);

      // Draw stops
      route.stops.forEach((stop) => {
        const stopIcon = L.divIcon({
          className: "shuttle-stop-icon",
          html: `
            <div class="flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-md border-2 border-blue-600 text-blue-600 hover:scale-125 transition-transform">
              <span class="text-xs">🚌</span>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const stopMarker = L.marker([stop.latitude, stop.longitude], { icon: stopIcon });
        stopMarker.bindPopup(`
          <div class="p-2 text-xs">
            <h4 class="font-bold text-sm text-slate-800">${stop.name}</h4>
            <p class="text-slate-500 mt-1">Routes: ${stop.routes.join(", ")}</p>
            <p class="text-blue-600 font-medium mt-1">Next arrival: ${stop.nextArrival}</p>
          </div>
        `);
        shuttleGroupRef.current?.addLayer(stopMarker);
      });
    });
  }, [showShuttleLayer, shuttleRoutes]);

  // Render Active Navigation Route
  useEffect(() => {
    if (!mapInstanceRef.current || !routeMarkersRef.current) return;

    if (routePolylineRef.current) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    routeMarkersRef.current.clearLayers();

    if (!activeRoute || activeRoute.path.length < 2) return;

    // Glowing background line
    const bgLine = L.polyline(activeRoute.path, {
      color: "#3B82F6",
      weight: 8,
      opacity: 0.4,
    });
    routeMarkersRef.current.addLayer(bgLine);

    // Primary path line
    const routeLine = L.polyline(activeRoute.path, {
      color: activeRoute.travelMode === "walking" ? "#2563EB" : "#10B981",
      weight: 5,
      dashArray: activeRoute.travelMode === "walking" ? "6, 8" : undefined,
      lineCap: "round",
    }).addTo(mapInstanceRef.current);
    routePolylineRef.current = routeLine;

    // Start Marker
    const startPoint = activeRoute.path[0];
    const startIcon = L.divIcon({
      className: "route-pin-start",
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white shadow-lg border-2 border-white animate-bounce">
          <span class="text-xs font-bold">A</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const startMarker = L.marker(startPoint, { icon: startIcon });
    routeMarkersRef.current.addLayer(startMarker);

    // End Marker
    const endPoint = activeRoute.path[activeRoute.path.length - 1];
    const endIcon = L.divIcon({
      className: "route-pin-end",
      html: `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white shadow-lg border-2 border-white">
          <span class="text-xs font-bold">B</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const endMarker = L.marker(endPoint, { icon: endIcon });
    routeMarkersRef.current.addLayer(endMarker);

    // Fit bounds to the route
    const bounds = L.latLngBounds(activeRoute.path);
    mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], animate: true });
  }, [activeRoute]);

  // Render User Location
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (userMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (!userLocation) return;

    const userIcon = L.divIcon({
      className: "user-gps-marker",
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-8 h-8 rounded-full bg-blue-500/40 animate-ping"></div>
          <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker(userLocation, { icon: userIcon, title: "Your Location" }).addTo(
      mapInstanceRef.current
    );
    userMarkerRef.current = marker;
  }, [userLocation]);

  // Map Controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetMap = () => {
    onSelectLocation(null);
    mapInstanceRef.current?.flyTo(CAMPUS_CENTER, 16, { animate: true });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.parentElement?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* Picking coordinates banner if admin mode active */}
      {isPickingCoords && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-sm font-medium animate-pulse border border-white/40">
          <Navigation className="w-4 h-4" />
          Click anywhere on the campus map to place building coordinates
        </div>
      )}

      {/* Emergency Mode Glowing Bar */}
      {isEmergencyMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-600 text-white px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 text-sm font-bold border-2 border-red-300 animate-pulse">
          <ShieldAlert className="w-5 h-5" />
          CAMPUS EMERGENCY MODE ACTIVE: Highlighting Medical, Security & Exits
        </div>
      )}

      {/* Top-Right Floating Controls Bar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Basemap Switcher Pill */}
        <div className="flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-1 shadow-lg border border-slate-200/80 dark:border-slate-800">
          <button
            onClick={() => setBasemap("roadmap")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              basemap === "roadmap"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Roadmap
          </button>
          <button
            onClick={() => setBasemap("satellite")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              basemap === "satellite"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setBasemap("dark")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              basemap === "dark"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Night
          </button>
        </div>
      </div>

      {/* Bottom-Right Zoom, Reset & Fullscreen Action Palette */}
      <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={handleResetMap}
          title="Reset Map View"
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
