import React, { useState } from "react";
import { CampusLocation, CampusCategory } from "../types";
import {
  X, Upload, Download, FileSpreadsheet, FileCode, CheckCircle,
  AlertTriangle, Info, Copy
} from "lucide-react";

interface DataImportExportModalProps {
  locations: CampusLocation[];
  onClose: () => void;
  onImportSuccess: (newLocations: CampusLocation[]) => void;
}

export const DataImportExportModal: React.FC<DataImportExportModalProps> = ({
  locations,
  onClose,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  const [rawInput, setRawInput] = useState<string>("");
  const [fileType, setFileType] = useState<"json" | "csv">("json");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);

  // CSV Template string
  const sampleCsv = `id,name,category,latitude,longitude,building_code,description,image
demo-bldg-01,Innovation Research Tower,Academic Buildings,12.8250,80.0430,IRT-01,Flagship research complex for postgraduate scholars,https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80
demo-cafe-02,Terrace Espresso Lounge,Cafes,12.8240,80.0445,TEL-02,Open air coffee deck with wifi and snacks,https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80`;

  // Parse and validate CSV
  const parseCsv = (csvText: string): CampusLocation[] => {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) throw new Error("CSV file must have at least a header and one data row.");

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const required = ["name", "latitude", "longitude"];
    for (const r of required) {
      if (!headers.includes(r)) {
        throw new Error(`Missing required CSV column header: "${r}".`);
      }
    }

    const nameIdx = headers.indexOf("name");
    const latIdx = headers.indexOf("latitude");
    const lngIdx = headers.indexOf("longitude");
    const idIdx = headers.indexOf("id");
    const catIdx = headers.indexOf("category");
    const codeIdx = headers.indexOf("building_code");
    const descIdx = headers.indexOf("description");
    const imgIdx = headers.indexOf("image");

    const parsed: CampusLocation[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",").map((c) => c.trim());
      if (row.length < 3 || !row[nameIdx]) continue;

      const lat = parseFloat(row[latIdx]);
      const lng = parseFloat(row[lngIdx]);

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error(`Row ${i + 1} has invalid numeric coordinates: lat="${row[latIdx]}", lng="${row[lngIdx]}"`);
      }

      parsed.push({
        id: (idIdx !== -1 && row[idIdx]) || `import-loc-${Date.now()}-${i}`,
        name: row[nameIdx],
        category: ((catIdx !== -1 && row[catIdx]) as CampusCategory) || "Academic Buildings",
        latitude: lat,
        longitude: lng,
        buildingCode: (codeIdx !== -1 && row[codeIdx]) || `BLDG-${i}`,
        description: (descIdx !== -1 && row[descIdx]) || "University facility",
        image: (imgIdx !== -1 && row[imgIdx]) || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80",
        address: "Campus Ground",
        openingHours: "8:00 AM – 6:00 PM",
        facilities: ["Wi-Fi", "Accessible Entrance"],
        accessibility: {
          wheelchairAccessible: true,
          elevatorAvailable: true,
          brailleSignage: false,
          accessibleRestrooms: true,
          accessibleParking: true,
          rampAccess: true,
        },
      });
    }

    return parsed;
  };

  const handleImport = () => {
    setValidationError(null);
    setValidationSuccess(null);

    try {
      if (!rawInput.trim()) {
        setValidationError("Please paste JSON or CSV data to import.");
        return;
      }

      let importedLocations: CampusLocation[] = [];

      if (fileType === "json") {
        const parsed = JSON.parse(rawInput);
        if (!Array.isArray(parsed)) {
          throw new Error("JSON root element must be an array of campus locations.");
        }
        // Validate each item
        parsed.forEach((item, idx) => {
          if (!item.name || typeof item.latitude !== "number" || typeof item.longitude !== "number") {
            throw new Error(`Location at index ${idx} is missing required fields (name, latitude, longitude).`);
          }
        });
        importedLocations = parsed;
      } else {
        importedLocations = parseCsv(rawInput);
      }

      setValidationSuccess(`Successfully validated ${importedLocations.length} locations!`);
      onImportSuccess(importedLocations);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setValidationError(err.message || "Invalid data format.");
    }
  };

  // Export handlers
  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(locations, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `campus_locations_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  };

  const downloadCsv = () => {
    const header = "id,name,category,latitude,longitude,building_code,description,image\n";
    const rows = locations
      .map(
        (l) =>
          `"${l.id}","${l.name.replace(/"/g, '""')}","${l.category}",${l.latitude},${l.longitude},"${l.buildingCode}","${l.description.replace(/"/g, '""')}","${l.image}"`
      )
      .join("\n");
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(header + rows);
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `campus_locations_${new Date().toISOString().slice(0, 10)}.csv`);
    dlAnchor.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Campus Data Import & Export Hub
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sync locations via CSV spreadsheets or JSON arrays
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-3 gap-4">
          <button
            onClick={() => setActiveTab("import")}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "import"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Import Locations</span>
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "export"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export Current Dataset</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {activeTab === "import" ? (
            <div className="space-y-4">
              {/* Format Switcher */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Data Format:</span>
                  <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 font-semibold">
                    <button
                      onClick={() => setFileType("json")}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        fileType === "json"
                          ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      JSON Array
                    </button>
                    <button
                      onClick={() => setFileType("csv")}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        fileType === "csv"
                          ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      CSV Text
                    </button>
                  </div>
                </div>

                {fileType === "csv" && (
                  <button
                    onClick={() => setRawInput(sampleCsv)}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Load Sample CSV</span>
                  </button>
                )}
              </div>

              {/* Text Area */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1.5">
                  Paste {fileType.toUpperCase()} Payload:
                </label>
                <textarea
                  rows={8}
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder={
                    fileType === "json"
                      ? '[\n  {\n    "name": "Library",\n    "latitude": 12.8225,\n    "longitude": 80.0448,\n    "buildingCode": "LIB-01"\n  }\n]'
                      : "id,name,category,latitude,longitude,building_code,description,image"
                  }
                  className="w-full font-mono text-[11px] p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Validation Status */}
              {validationError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {validationSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{validationSuccess}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleImport}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Validate & Import Locations</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                <Download className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Export {locations.length} Campus Locations
                </h4>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Download a snapshot of the current active campus location database in your chosen format.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={downloadJson}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <FileCode className="w-4 h-4" />
                  <span>Export as JSON</span>
                </button>
                <button
                  onClick={downloadCsv}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export as CSV</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
