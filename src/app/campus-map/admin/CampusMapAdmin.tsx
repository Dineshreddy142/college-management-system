import React, { useState } from "react";
import { CampusLocation, CampusCategory, FloorPlan } from "../types";
import { CATEGORIES_CONFIG, INITIAL_LOCATIONS } from "../campusData";
import { DataImportExportModal } from "./DataImportExportModal";
import {
  X, Plus, Edit2, Trash2, Save, RotateCcw, MapPin, Upload,
  Download, Layers, Building2, Check, AlertCircle, Sparkles,
  Search, Eye
} from "lucide-react";

interface CampusMapAdminProps {
  locations: CampusLocation[];
  onUpdateLocations: (locs: CampusLocation[]) => void;
  onClose: () => void;
  onStartPickingCoords: (onCoordPicked: (lat: number, lng: number) => void) => void;
}

export const CampusMapAdmin: React.FC<CampusMapAdminProps> = ({
  locations,
  onUpdateLocations,
  onClose,
  onStartPickingCoords,
}) => {
  const [editingLoc, setEditingLoc] = useState<CampusLocation | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<CampusLocation>>({
    name: "",
    buildingCode: "",
    category: "Academic Buildings",
    description: "",
    latitude: 12.8235,
    longitude: 80.0445,
    address: "",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80",
    openingHours: "8:00 AM – 6:00 PM",
    contactPhone: "",
    contactEmail: "",
    departments: [],
    facilities: [],
  });

  const [departmentsInput, setDepartmentsInput] = useState("");
  const [facilitiesInput, setFacilitiesInput] = useState("");

  const handleEditClick = (loc: CampusLocation) => {
    setEditingLoc(loc);
    setIsCreatingNew(false);
    setFormData(loc);
    setDepartmentsInput(loc.departments?.join(", ") || "");
    setFacilitiesInput(loc.facilities?.join(", ") || "");
  };

  const handleNewClick = () => {
    setEditingLoc(null);
    setIsCreatingNew(true);
    setFormData({
      id: `campus-loc-${Date.now()}`,
      name: "",
      buildingCode: `B-${locations.length + 1}`,
      category: "Academic Buildings",
      description: "",
      latitude: 12.8235,
      longitude: 80.0445,
      address: "University Campus Road",
      image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80",
      openingHours: "8:00 AM – 6:00 PM (Mon-Fri)",
      contactPhone: "+91 (044) 2741-7000",
      contactEmail: "info@techuniv.edu",
      departments: [],
      facilities: ["Wi-Fi", "Elevator", "Restrooms"],
      accessibility: {
        wheelchairAccessible: true,
        elevatorAvailable: true,
        brailleSignage: false,
        accessibleRestrooms: true,
        accessibleParking: true,
        rampAccess: true,
      },
    });
    setDepartmentsInput("");
    setFacilitiesInput("Wi-Fi, Elevator, Restrooms");
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this campus location?")) {
      const updated = locations.filter((l) => l.id !== id);
      onUpdateLocations(updated);
      if (editingLoc?.id === id) {
        setEditingLoc(null);
      }
      triggerToast("Location deleted successfully");
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert("Building Name is required.");
      return;
    }

    const depts = departmentsInput
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    const facs = facilitiesInput
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    const completeLocation: CampusLocation = {
      id: formData.id || `loc-${Date.now()}`,
      name: formData.name,
      buildingCode: formData.buildingCode || "BLDG",
      category: (formData.category as CampusCategory) || "Academic Buildings",
      description: formData.description || "",
      latitude: Number(formData.latitude) || 12.8235,
      longitude: Number(formData.longitude) || 80.0445,
      address: formData.address || "Campus Grounds",
      image: formData.image || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80",
      openingHours: formData.openingHours || "8:00 AM – 6:00 PM",
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      departments: depts,
      facilities: facs,
      accessibility: formData.accessibility || {
        wheelchairAccessible: true,
        elevatorAvailable: true,
        brailleSignage: false,
        accessibleRestrooms: true,
        accessibleParking: true,
        rampAccess: true,
      },
      floors: formData.floors,
      emergencyInfo: formData.emergencyInfo,
      hostelDetails: formData.hostelDetails,
      virtualTour: formData.virtualTour,
    };

    if (isCreatingNew) {
      onUpdateLocations([completeLocation, ...locations]);
      triggerToast(`Added "${completeLocation.name}"`);
    } else {
      const updated = locations.map((l) => (l.id === completeLocation.id ? completeLocation : l));
      onUpdateLocations(updated);
      triggerToast(`Saved "${completeLocation.name}"`);
    }

    setEditingLoc(null);
    setIsCreatingNew(false);
  };

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handlePickOnMap = () => {
    onClose(); // temporarily minimize to allow map click
    onStartPickingCoords((lat, lng) => {
      setFormData((prev) => ({ ...prev, latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) }));
    });
  };

  const handleResetDefaults = () => {
    if (confirm("Reset campus database to the original default 25+ locations? Any custom additions will be restored.")) {
      onUpdateLocations(INITIAL_LOCATIONS);
      triggerToast("Reset to factory defaults");
    }
  };

  const filteredLocations = locations.filter((loc) => {
    if (!adminSearch.trim()) return true;
    const q = adminSearch.toLowerCase();
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.buildingCode.toLowerCase().includes(q) ||
      loc.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Campus Location Administrator
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create, edit, adjust coordinates, and manage live university buildings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportExport(true)}
              className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import / Export</span>
            </button>
            <button
              onClick={handleNewClick}
              className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Location</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {saveToast && (
          <div className="bg-emerald-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <span>✓ {saveToast}</span>
            <button onClick={() => setSaveToast(null)}>✕</button>
          </div>
        )}

        {/* Main Body: 2 Columns on desktop */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Location List */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter locations list..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="flex-1 max-h-[500px] overflow-y-auto space-y-2 pr-1">
              {filteredLocations.map((loc) => {
                const isSelected = editingLoc?.id === loc.id;
                return (
                  <div
                    key={loc.id}
                    onClick={() => handleEditClick(loc)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-50/80 dark:bg-blue-900/30 border-blue-400 shadow-sm"
                        : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={loc.image}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover border shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                            {loc.buildingCode}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">{loc.category}</span>
                        </div>
                        <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate mt-0.5">
                          {loc.name}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(loc.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                        title="Delete Location"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">{locations.length} Total Buildings</span>
              <button
                onClick={handleResetDefaults}
                className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default Data</span>
              </button>
            </div>
          </div>

          {/* Right Column: Editor Form */}
          <div className="lg:col-span-7 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800">
            {editingLoc || isCreatingNew ? (
              <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {isCreatingNew ? "Add New Campus Location" : `Editing: ${editingLoc?.name}`}
                  </h3>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase">
                    Live Sync Enabled
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Building Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Science & Computing Tower"
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Building Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.buildingCode || ""}
                      onChange={(e) => setFormData({ ...formData, buildingCode: e.target.value })}
                      placeholder="e.g. SC-05"
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      {CATEGORIES_CONFIG.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.emoji} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Opening Hours</label>
                    <input
                      type="text"
                      value={formData.openingHours || ""}
                      onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                      placeholder="e.g. 8:00 AM – 7:00 PM"
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Geographic Coordinates Picker */}
                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Map Geographic Position
                    </span>
                    <button
                      type="button"
                      onClick={handlePickOnMap}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold text-[10px] hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      🎯 Pick Point on Live Map
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-500 text-[10px] font-semibold block mb-0.5">Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formData.latitude || 12.8235}
                        onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                        className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 text-[10px] font-semibold block mb-0.5">Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={formData.longitude || 80.0445}
                        onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                        className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Photo Image URL</label>
                  <input
                    type="text"
                    value={formData.image || ""}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the facility and student access..."
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      Departments (comma separated)
                    </label>
                    <input
                      type="text"
                      value={departmentsInput}
                      onChange={(e) => setDepartmentsInput(e.target.value)}
                      placeholder="e.g. CSE, IT, Data Science"
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      Facilities (comma separated)
                    </label>
                    <input
                      type="text"
                      value={facilitiesInput}
                      onChange={(e) => setFacilitiesInput(e.target.value)}
                      placeholder="e.g. Wi-Fi, Cafeteria, Elevator, ATM"
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLoc(null);
                      setIsCreatingNew(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Location</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Building2 className="w-12 h-12 mx-auto opacity-30 text-blue-500" />
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  Select a building to edit or create a new one
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Admins can update building names, categories, floor rooms, facilities, and exact geographic coordinates.
                </p>
                <button
                  onClick={handleNewClick}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Location</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showImportExport && (
        <DataImportExportModal
          locations={locations}
          onClose={() => setShowImportExport(false)}
          onImportSuccess={(newLocs) => {
            onUpdateLocations(newLocs);
            triggerToast(`Imported ${newLocs.length} locations`);
          }}
        />
      )}
    </div>
  );
};
