import React, { useState } from "react";
import { CampusLocation } from "../types";
import { CATEGORIES_CONFIG } from "../campusData";
import { FloorPlanViewer } from "./FloorPlanViewer";
import {
  X, Navigation, MapPin, Phone, Mail, Globe, Clock, Check,
  Sparkles, Layers, ShieldAlert, Users, Info, Building2,
  ChevronRight, ArrowLeft
} from "lucide-react";

interface LocationDetailModalProps {
  location: CampusLocation | null;
  onClose: () => void;
  onGetDirections: (loc: CampusLocation) => void;
  onStartVirtualTour?: (loc: CampusLocation) => void;
  allLocations: CampusLocation[];
  onSelectNearby: (loc: CampusLocation) => void;
}

type ModalTab = "overview" | "floors" | "accessibility" | "hostel" | "emergency";

export const LocationDetailModal: React.FC<LocationDetailModalProps> = ({
  location,
  onClose,
  onGetDirections,
  onStartVirtualTour,
  allLocations,
  onSelectNearby,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>("overview");
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  if (!location) return null;

  const catConfig = CATEGORIES_CONFIG.find((c) => c.id === location.category);

  // Gallery array
  const photos = [
    location.image,
    ...(location.gallery || []),
  ];

  // Find nearby locations (within ~500m Euclidean approximation)
  const nearbyLocations = allLocations
    .filter((l) => l.id !== location.id)
    .map((l) => {
      const dLat = (l.latitude - location.latitude) * 111320;
      const dLng = (l.longitude - location.longitude) * 111320 * Math.cos(location.latitude * (Math.PI / 180));
      const dist = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
      return { ...l, distanceMeters: dist };
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Map</span>
            </button>
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: catConfig?.color || "#2563EB" }}
              >
                {location.buildingCode}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {location.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onGetDirections(location);
              }}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Directions</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero Image Showcase */}
          <div className="relative h-64 sm:h-80 w-full bg-slate-900">
            <img
              src={photos[activeImageIndex] || location.image}
              alt={location.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Bottom Title Overlay */}
            <div className="absolute bottom-4 left-6 right-6 text-white">
              <h2 className="text-2xl sm:text-3xl font-black drop-shadow-md">
                {location.name}
              </h2>
              <p className="text-sm text-slate-200 flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>{location.address}</span>
              </p>
            </div>

            {/* Gallery Thumbnails */}
            {photos.length > 1 && (
              <div className="absolute top-4 right-4 flex gap-1.5">
                {photos.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImageIndex === i ? "border-blue-500 scale-105" : "border-white/60 opacity-80"
                    }`}
                  >
                    <img src={p} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Overview & Facilities
            </button>
            <button
              onClick={() => setActiveTab("floors")}
              className={`pb-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "floors"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Floor Plans</span>
              {location.floors && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                  {location.floors.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("accessibility")}
              className={`pb-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "accessibility"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Accessibility
            </button>
            {location.hostelDetails && (
              <button
                onClick={() => setActiveTab("hostel")}
                className={`pb-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === "hostel"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Residence & Hostel Info
              </button>
            )}
            <button
              onClick={() => setActiveTab("emergency")}
              className={`pb-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === "emergency"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Emergency & Safety
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-6 space-y-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    About this building
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {location.description}
                  </p>
                </div>

                {/* Operating Hours & Contacts Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block">Opening Hours</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{location.openingHours}</p>
                      <span className={`inline-block text-[10px] font-bold mt-1 px-2 py-0.5 rounded ${
                        location.isOpenNow !== false ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}>
                        {location.isOpenNow !== false ? "Currently Open" : "Currently Closed"}
                      </span>
                    </div>
                  </div>

                  {location.contactPhone && (
                    <div className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block">Contact Phone</span>
                        <a href={`tel:${location.contactPhone}`} className="font-semibold text-blue-600 hover:underline">
                          {location.contactPhone}
                        </a>
                      </div>
                    </div>
                  )}

                  {location.contactEmail && (
                    <div className="flex items-start gap-2.5">
                      <Mail className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block">Official Email</span>
                        <a href={`mailto:${location.contactEmail}`} className="font-semibold text-blue-600 hover:underline truncate block">
                          {location.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Departments Roster */}
                {location.departments && location.departments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Academic Departments & Units
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {location.departments.map((dept, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                        >
                          <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                          <span>{dept}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Facilities Grid */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Available Facilities & Amenities
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {location.facilities.map((fac, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-700 dark:text-slate-300 font-medium"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{fac}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Virtual Tour Banner if available */}
                {location.virtualTour?.enabled && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-300" />
                        <h4 className="font-bold text-sm">Interactive 360° Virtual Tour</h4>
                      </div>
                      <p className="text-xs text-purple-200 mt-1">
                        Take a self-guided 360-degree panoramic walkthrough of {location.name}.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onStartVirtualTour && onStartVirtualTour(location);
                      }}
                      className="px-4 py-2 rounded-xl bg-white text-purple-900 font-bold text-xs hover:bg-purple-50 transition-colors shadow-lg shrink-0"
                    >
                      Start 360° Tour
                    </button>
                  </div>
                )}

                {/* Nearby Campus Points of Interest */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Nearby Campus Buildings
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {nearbyLocations.map((nearby) => (
                      <div
                        key={nearby.id}
                        onClick={() => onSelectNearby(nearby)}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 cursor-pointer bg-white dark:bg-slate-800 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block">
                            {nearby.buildingCode}
                          </span>
                          <h5 className="font-semibold text-xs text-slate-800 dark:text-slate-200 line-clamp-1 mt-0.5">
                            {nearby.name}
                          </h5>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-2 font-medium">
                          ~{nearby.distanceMeters} m away
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Floor Plans Tab */}
            {activeTab === "floors" && (
              <FloorPlanViewer
                floors={location.floors || []}
                buildingName={location.name}
                buildingCode={location.buildingCode}
              />
            )}

            {/* Accessibility Tab */}
            {activeTab === "accessibility" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Our campus is committed to universal accessibility for all students, faculty, and campus visitors.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Wheelchair Accessible Entrances", active: location.accessibility.wheelchairAccessible },
                    { label: "Elevator Access to All Floors", active: location.accessibility.elevatorAvailable },
                    { label: "Braille & High-Contrast Signage", active: location.accessibility.brailleSignage },
                    { label: "ADA-Compliant Accessible Restrooms", active: location.accessibility.accessibleRestrooms },
                    { label: "Designated Accessible Parking Slots", active: location.accessibility.accessibleParking },
                    { label: "Gradual Incline Ramp Access", active: location.accessibility.rampAccess },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
                        item.active
                          ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400"
                      }`}
                    >
                      <span className="text-base">{item.active ? "✅" : "❌"}</span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hostel Info Tab */}
            {activeTab === "hostel" && location.hostelDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[11px] block">Resident Category</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {location.hostelDetails.gender} Students ({location.hostelDetails.residenceType})
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[11px] block">Residential Capacity</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {location.hostelDetails.capacity} Students
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[11px] block">Resident Warden</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {location.hostelDetails.wardenName}
                    </span>
                    <p className="text-blue-600 font-medium mt-0.5">{location.hostelDetails.wardenContact}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[11px] block">Dining & Curfew</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {location.hostelDetails.curfew}
                    </span>
                    <p className="text-slate-500 mt-0.5">{location.hostelDetails.messType}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Emergency & Safety Tab */}
            {activeTab === "emergency" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
                  <div className="flex items-center gap-2 font-bold mb-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Emergency Safety Protocol for {location.buildingCode}</span>
                  </div>
                  <ul className="space-y-2">
                    <li>• <strong>Nearest AED:</strong> {location.emergencyInfo?.nearestAED || "Atrium Reception Counter"}</li>
                    <li>• <strong>Emergency Exits:</strong> {location.emergencyInfo?.nearestExit || "East & West Wing Stairwells"}</li>
                    <li>• <strong>Evacuation Assembly Zone:</strong> {location.emergencyInfo?.assemblyPoint || "Central Quadrangle Lawn"}</li>
                    <li>• <strong>Campus Emergency Hotline:</strong> {location.emergencyInfo?.emergencyHotline || "+91 (044) 2741-9999"}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
