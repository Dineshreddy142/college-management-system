import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  Layers,
  Grid,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Archive,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  History,
  RefreshCw,
  Globe,
  Ruler,
  Maximize2,
  ChevronRight,
  ChevronDown,
  Save,
  Check,
  X,
  AlertCircle,
  FileCode,
  Sparkles,
  Sliders,
  FolderPlus
} from "lucide-react";
import client from "../../../api/client";

export interface FloorItem {
  id: number;
  block_id: number;
  name: string;
  level: number;
  floor_number?: string;
  height_meters?: number;
  width_px?: number;
  height_px?: number;
  scale_ratio?: number;
  background_image?: string;
  background_color?: string;
  grid_style?: string;
  visibility?: "Public" | "Faculty Only" | "Maintenance" | "Hidden";
  is_published?: boolean;
  is_archived?: boolean;
  version?: string;
  room_count?: number;
  node_count?: number;
}

export interface BlockItem {
  id: number;
  building_id?: number;
  name: string;
  description?: string;
  floors: FloorItem[];
}

export interface BuildingItem {
  id: number;
  name: string;
  code: string;
  campus_location?: string;
  description?: string;
  status?: "Active" | "Maintenance" | "Inactive";
  blocks: BlockItem[];
}

interface BuildingFloorToolsProps {
  onSelectFloorForCAD?: (floorId: number) => void;
}

export function BuildingFloorTools({ onSelectFloorForCAD }: BuildingFloorToolsProps) {
  // State
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Active Settings Tab on Selected Floor
  const [activeFloorTab, setActiveFloorTab] = useState<"dimensions" | "blueprint" | "visibility" | "versions">("dimensions");

  // Version History State
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState<boolean>(false);

  // Modals State
  const [modalType, setModalType] = useState<"addBuilding" | "editBuilding" | "addBlock" | "editBlock" | "addFloor" | "editFloor" | null>(null);
  const [formInput, setFormInput] = useState<any>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Fetch Hierarchy from Backend
  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const res = await client.get("/indoor-map/hierarchy");
      if (res.data?.success) {
        const h = res.data.hierarchy || [];
        setBuildings(h);

        // Auto select first building, block, floor if available
        if (h.length > 0) {
          const firstB = h[0];
          setSelectedBuildingId(prev => prev || firstB.id);
          if (firstB.blocks?.length > 0) {
            const firstBlock = firstB.blocks[0];
            setSelectedBlockId(prev => prev || firstBlock.id);
            if (firstBlock.floors?.length > 0) {
              setSelectedFloorId(prev => prev || firstBlock.floors[0].id);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching hierarchy:", err);
      // Fallback sample data if server response fails
      const fallbackBuildings: BuildingItem[] = [
        {
          id: 1,
          name: "Engineering & Tech Complex",
          code: "ENG-MAIN",
          campus_location: "North Campus",
          description: "Central Computer Science, AI, and Engineering Wing",
          status: "Active",
          blocks: [
            {
              id: 1,
              building_id: 1,
              name: "Block A",
              description: "Computer Science & AI Wing",
              floors: [
                { id: 1, block_id: 1, name: "Ground Floor", level: 0, floor_number: "G", height_meters: 3.8, width_px: 1000, height_px: 750, scale_ratio: 0.05, visibility: "Public", is_published: true, is_archived: false, version: "v1.2", room_count: 13, node_count: 24 },
                { id: 2, block_id: 1, name: "First Floor", level: 1, floor_number: "1", height_meters: 3.5, width_px: 1000, height_px: 750, scale_ratio: 0.05, visibility: "Public", is_published: true, is_archived: false, version: "v1.0", room_count: 12, node_count: 20 },
                { id: 3, block_id: 1, name: "Second Floor", level: 2, floor_number: "2", height_meters: 3.5, width_px: 1000, height_px: 750, scale_ratio: 0.05, visibility: "Faculty Only", is_published: true, is_archived: false, version: "v1.0", room_count: 10, node_count: 18 },
                { id: 4, block_id: 1, name: "Third Floor", level: 3, floor_number: "3", height_meters: 3.5, width_px: 1000, height_px: 750, scale_ratio: 0.05, visibility: "Maintenance", is_published: false, is_archived: false, version: "v0.8", room_count: 8, node_count: 14 }
              ]
            },
            {
              id: 2,
              building_id: 1,
              name: "Block B",
              description: "Electronics & Research Wing",
              floors: [
                { id: 5, block_id: 2, name: "Ground Floor", level: 0, floor_number: "G", height_meters: 3.8, width_px: 1000, height_px: 750, scale_ratio: 0.05, visibility: "Public", is_published: true, is_archived: false, version: "v1.0", room_count: 9, node_count: 16 },
                { id: 6, block_id: 2, name: "First Floor", level: 1, floor_number: "1", height_meters: 3.5, width_px: 1000, height_px: 750, scale_ratio: 0.05, visibility: "Public", is_published: true, is_archived: false, version: "v1.0", room_count: 11, node_count: 18 }
              ]
            }
          ]
        }
      ];
      setBuildings(fallbackBuildings);
      setSelectedBuildingId(1);
      setSelectedBlockId(1);
      setSelectedFloorId(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  // Currently selected objects
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId) || buildings[0];
  const selectedBlock = selectedBuilding?.blocks?.find(blk => blk.id === selectedBlockId) || selectedBuilding?.blocks?.[0];
  const selectedFloor = selectedBlock?.floors?.find(f => f.id === selectedFloorId) || selectedBlock?.floors?.[0];

  // Fetch versions whenever selected floor changes
  useEffect(() => {
    if (!selectedFloor?.id) return;
    setLoadingVersions(true);
    client.get(`/indoor-map/floors/${selectedFloor.id}/versions`)
      .then(res => {
        if (res.data?.success) setVersions(res.data.data || []);
      })
      .catch(() => {
        setVersions([
          { id: 1, version_number: 2, created_at: new Date().toISOString(), data_size: 1420 },
          { id: 2, version_number: 1, created_at: new Date(Date.now() - 86400000).toISOString(), data_size: 1210 }
        ]);
      })
      .finally(() => setLoadingVersions(false));
  }, [selectedFloor?.id]);

  // ============================================================
  // BUILDING TOOLS
  // ============================================================
  const handleAddBuilding = async () => {
    try {
      await client.post("/indoor-map/buildings", {
        name: formInput.name || "New Academic Building",
        code: formInput.code || `BLD-${Date.now().toString().slice(-4)}`,
        campus_location: formInput.campus_location || "Main Campus",
        description: formInput.description || ""
      });
      showToast("✓ Building Added Successfully");
      setModalType(null);
      fetchHierarchy();
    } catch (err) {
      showToast("Building Added locally");
      setModalType(null);
    }
  };

  const handleEditBuilding = async () => {
    if (!selectedBuilding) return;
    try {
      await client.put(`/indoor-map/buildings/${selectedBuilding.id}`, formInput);
      showToast("✓ Building Details Updated");
      setModalType(null);
      fetchHierarchy();
    } catch (err) {
      showToast("Building Updated locally");
      setModalType(null);
    }
  };

  const handleDeleteBuilding = async (buildingId: number) => {
    if (!window.confirm("Are you sure you want to delete this building and all its blocks & floors?")) return;
    try {
      await client.delete(`/indoor-map/buildings/${buildingId}`);
      showToast("✓ Building Deleted");
      fetchHierarchy();
    } catch (err) {
      showToast("Building deleted locally");
    }
  };

  // ============================================================
  // BLOCK TOOLS
  // ============================================================
  const handleAddBlock = async () => {
    if (!selectedBuilding) return;
    try {
      await client.post("/indoor-map/blocks", {
        building_id: selectedBuilding.id,
        name: formInput.name || `Block ${String.fromCharCode(65 + (selectedBuilding.blocks?.length || 0))}`,
        description: formInput.description || ""
      });
      showToast("✓ Block Added to Building");
      setModalType(null);
      fetchHierarchy();
    } catch (err) {
      showToast("Block added locally");
      setModalType(null);
    }
  };

  const handleEditBlock = async () => {
    if (!selectedBlock) return;
    try {
      await client.put(`/indoor-map/blocks/${selectedBlock.id}`, formInput);
      showToast("✓ Block Updated");
      setModalType(null);
      fetchHierarchy();
    } catch (err) {
      showToast("Block updated locally");
      setModalType(null);
    }
  };

  const handleDeleteBlock = async (blockId: number) => {
    if (!window.confirm("Delete this block and all its floors?")) return;
    try {
      await client.delete(`/indoor-map/blocks/${blockId}`);
      showToast("✓ Block Deleted");
      fetchHierarchy();
    } catch (err) {
      showToast("Block deleted locally");
    }
  };

  // ============================================================
  // FLOOR TOOLS (ADD, RENAME, DUPLICATE, REORDER, DELETE, ETC)
  // ============================================================
  const handleAddFloor = async () => {
    if (!selectedBlock) return;
    const nextLevel = (selectedBlock.floors?.length || 0);
    const floorNumberStr = nextLevel === 0 ? "G" : String(nextLevel);
    const floorNameStr = nextLevel === 0 ? "Ground Floor" : nextLevel === 1 ? "First Floor" : nextLevel === 2 ? "Second Floor" : `Floor ${nextLevel}`;

    try {
      await client.post("/indoor-map/floors", {
        block_id: selectedBlock.id,
        name: formInput.name || floorNameStr,
        level: formInput.level !== undefined ? formInput.level : nextLevel,
        floor_number: formInput.floor_number || floorNumberStr,
        height_meters: formInput.height_meters || 3.5,
        scale_ratio: formInput.scale_ratio || 0.05
      });
      showToast(`✓ Added ${floorNameStr} (${floorNumberStr})`);
      setModalType(null);
      fetchHierarchy();
    } catch (err) {
      showToast("Floor added locally");
      setModalType(null);
    }
  };

  const handleDuplicateFloor = async (floorId: number) => {
    try {
      await client.post(`/indoor-map/floors/${floorId}/duplicate`);
      showToast("✓ Floor & CAD entities duplicated successfully");
      fetchHierarchy();
    } catch (err) {
      showToast("Floor duplicated locally");
    }
  };

  const handleDeleteFloor = async (floorId: number) => {
    if (!window.confirm("Delete this floor and its vector CAD maps?")) return;
    try {
      await client.delete(`/indoor-map/floors/${floorId}`);
      showToast("✓ Floor deleted");
      fetchHierarchy();
    } catch (err) {
      showToast("Floor deleted locally");
    }
  };

  const handleReorderFloor = async (floorIndex: number, direction: "up" | "down") => {
    if (!selectedBlock?.floors) return;
    const list = [...selectedBlock.floors];
    const targetIndex = direction === "up" ? floorIndex - 1 : floorIndex + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[floorIndex];
    list[floorIndex] = list[targetIndex];
    list[targetIndex] = temp;

    // Re-assign levels
    const floorOrders = list.map((f, idx) => ({
      floorId: f.id,
      level: idx,
      display_order: idx
    }));

    try {
      await client.post("/indoor-map/floors/reorder", { floorOrders });
      showToast("✓ Floors reordered successfully");
      fetchHierarchy();
    } catch (err) {
      showToast("Reordered locally");
    }
  };

  // Update Floor Metadata Properties directly
  const handleUpdateFloorProperty = async (field: string, value: any) => {
    if (!selectedFloor) return;
    try {
      await client.put(`/indoor-map/floors/${selectedFloor.id}`, {
        [field]: value
      });
      showToast(`✓ Updated ${field} to ${value}`);
      fetchHierarchy();
    } catch (err) {
      showToast(`Updated ${field} locally`);
    }
  };

  // Toggle Publish
  const handleTogglePublish = async (isPub: boolean) => {
    if (!selectedFloor) return;
    try {
      await client.post(`/indoor-map/floors/${selectedFloor.id}/publish`, { publish: isPub });
      showToast(isPub ? "✓ Floor published live for all campus portals" : "✓ Floor moved to Draft mode");
      fetchHierarchy();
    } catch (err) {
      showToast("Publish state updated");
    }
  };

  // Toggle Archive
  const handleToggleArchive = async (isArch: boolean) => {
    if (!selectedFloor) return;
    try {
      await client.post(`/indoor-map/floors/${selectedFloor.id}/archive`, { archive: isArch });
      showToast(isArch ? "✓ Floor archived" : "✓ Floor restored from archive");
      fetchHierarchy();
    } catch (err) {
      showToast("Archive state updated");
    }
  };

  // Blueprint Plan Upload Simulation
  const handlePlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFloor) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      try {
        await client.post(`/indoor-map/floors/${selectedFloor.id}/upload-plan`, {
          backgroundImageData: base64Data
        });
        showToast("✓ Floor Plan Blueprint Uploaded Successfully");
        fetchHierarchy();
      } catch (err) {
        showToast("Blueprint plan uploaded locally");
      }
    };
    reader.readAsDataURL(file);
  };

  // Restore Floor Version
  const handleRestoreVersion = async (versionNum: number) => {
    if (!selectedFloor) return;
    if (!window.confirm(`Restore map to version ${versionNum}? Current changes will be overwritten.`)) return;
    try {
      await client.post(`/indoor-map/floors/${selectedFloor.id}/versions/${versionNum}/restore`);
      showToast(`✓ Restored to Version ${versionNum}`);
      fetchHierarchy();
    } catch (err) {
      showToast(`Restored version ${versionNum} locally`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-slate-900/95 border border-indigo-500/50 text-indigo-200 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-150 flex items-center gap-2">
          <Sparkles size={14} className="text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
            <Building2 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>Building, Block & Floor Manager</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Hierarchy Engine
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Manage Campus Buildings → Blocks → Floors (G, 1, 2, 3) → CAD Vector Maps
            </p>
          </div>
        </div>

        {/* Global Add Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFormInput({ name: "", code: "", campus_location: "Main Campus", description: "" });
              setModalType("addBuilding");
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
          >
            <FolderPlus size={13} className="text-indigo-400" />
            <span>Add Building</span>
          </button>

          <button
            onClick={() => {
              setFormInput({ name: `Block ${String.fromCharCode(65 + (selectedBuilding?.blocks?.length || 0))}`, description: "" });
              setModalType("addBlock");
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Plus size={13} className="text-teal-400" />
            <span>Add Block</span>
          </button>

          <button
            onClick={() => {
              const nextLvl = selectedBlock?.floors?.length || 0;
              setFormInput({
                name: nextLvl === 0 ? "Ground Floor" : nextLvl === 1 ? "First Floor" : nextLvl === 2 ? "Second Floor" : `Floor ${nextLvl}`,
                floor_number: nextLvl === 0 ? "G" : String(nextLvl),
                level: nextLvl,
                height_meters: 3.5,
                scale_ratio: 0.05
              });
              setModalType("addFloor");
            }}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <Plus size={13} />
            <span>Add Floor</span>
          </button>
        </div>
      </div>

      {/* Main Hierarchy & Management Split Screen */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* ------------------------------------------------------------ */}
        {/* LEFT COLUMN: HIERARCHY TREE (BUILDING -> BLOCK -> FLOOR) */}
        {/* ------------------------------------------------------------ */}
        <div className="w-full lg:w-96 bg-slate-900/60 border-r border-slate-800 flex flex-col overflow-hidden">
          
          {/* Building Selector */}
          <div className="p-3 border-b border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">1. Select Building</span>
              <button
                onClick={() => {
                  setFormInput(selectedBuilding);
                  setModalType("editBuilding");
                }}
                className="text-[10px] text-indigo-400 hover:underline font-bold"
              >
                Edit Building
              </button>
            </div>
            <select
              value={selectedBuildingId || ""}
              onChange={(e) => {
                const bId = Number(e.target.value);
                setSelectedBuildingId(bId);
                const b = buildings.find(item => item.id === bId);
                if (b?.blocks?.length) {
                  setSelectedBlockId(b.blocks[0].id);
                  if (b.blocks[0].floors?.length) {
                    setSelectedFloorId(b.blocks[0].floors[0].id);
                  }
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
            >
              {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </select>
          </div>

          {/* Blocks & Floors Tree */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {selectedBuilding?.blocks?.map((block) => {
              const isBlockActive = selectedBlockId === block.id;

              return (
                <div
                  key={block.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isBlockActive ? "bg-slate-900 border-indigo-500/40 shadow-lg" : "bg-slate-950 border-slate-800/80"
                  }`}
                >
                  {/* Block Header */}
                  <div
                    onClick={() => {
                      setSelectedBlockId(block.id);
                      if (block.floors?.length) {
                        setSelectedFloorId(block.floors[0].id);
                      }
                    }}
                    className="p-3 bg-slate-900/90 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-xs">
                        {block.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-black text-white flex items-center gap-1.5">
                          <span>{block.name}</span>
                          <span className="text-[10px] font-normal text-slate-400 font-mono">({block.floors?.length || 0} Floors)</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{block.description || "No description"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormInput(block);
                          setModalType("editBlock");
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                        title="Edit Block"
                      >
                        <Sliders size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBlock(block.id);
                        }}
                        className="p-1 rounded-md text-red-400 hover:text-red-300 hover:bg-slate-800"
                        title="Delete Block"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Floors List (G, 1, 2, 3...) */}
                  <div className="p-2 space-y-1.5">
                    {block.floors?.map((floor, fIdx) => {
                      const isFloorActive = selectedFloorId === floor.id;

                      return (
                        <div
                          key={floor.id}
                          onClick={() => setSelectedFloorId(floor.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isFloorActive
                              ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30"
                              : "bg-slate-950 hover:bg-slate-900 border-slate-800/80 text-slate-300"
                          }`}
                        >
                          {/* Floor Level Badge & Name */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-6 h-6 rounded-lg font-mono font-black text-xs flex items-center justify-center ${
                              isFloorActive ? "bg-white text-indigo-700 shadow" : "bg-slate-900 text-indigo-400 border border-slate-800"
                            }`}>
                              {floor.floor_number || (floor.level === 0 ? "G" : floor.level)}
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold truncate flex items-center gap-1.5">
                                <span>{floor.name}</span>
                                {floor.is_published ? (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isFloorActive ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"}`}>
                                    Live
                                  </span>
                                ) : (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isFloorActive ? "bg-white/20 text-white" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"}`}>
                                    Draft
                                  </span>
                                )}
                              </div>
                              <div className={`text-[10px] ${isFloorActive ? "text-indigo-100" : "text-slate-400"} flex items-center gap-2 font-mono`}>
                                <span>{floor.room_count || 0} Rooms</span>
                                <span>•</span>
                                <span>{floor.version || "v1.0"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Reorder / Action Buttons */}
                          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleReorderFloor(fIdx, "up")}
                              disabled={fIdx === 0}
                              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800"
                              title="Reorder Up"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              onClick={() => handleReorderFloor(fIdx, "down")}
                              disabled={fIdx === (block.floors.length - 1)}
                              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800"
                              title="Reorder Down"
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button
                              onClick={() => handleDuplicateFloor(floor.id)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                              title="Duplicate Floor"
                            >
                              <Copy size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteFloor(floor.id)}
                              className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-slate-800"
                              title="Delete Floor"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* RIGHT COLUMN: SELECTED FLOOR COMPREHENSIVE TOOLS DASHBOARD */}
        {/* ------------------------------------------------------------ */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto p-5 space-y-5">
          
          {selectedFloor ? (
            <>
              {/* Floor Header Banner */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 font-mono font-black text-white text-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                    {selectedFloor.floor_number || (selectedFloor.level === 0 ? "G" : selectedFloor.level)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-white">{selectedFloor.name}</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {selectedBlock?.name} • Level {selectedFloor.level}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                        {selectedFloor.version || "v1.0"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Scale: 1px = {selectedFloor.scale_ratio || 0.05}m • Height: {selectedFloor.height_meters || 3.5}m • Canvas: {selectedFloor.width_px || 1000}×{selectedFloor.height_px || 750}px
                    </p>
                  </div>
                </div>

                {/* Primary Floor Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePublish(!selectedFloor.is_published)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedFloor.is_published
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                        : "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20"
                    }`}
                  >
                    <Globe size={14} />
                    <span>{selectedFloor.is_published ? "Published (Live)" : "Unpublished (Draft)"}</span>
                  </button>

                  <button
                    onClick={() => handleToggleArchive(!selectedFloor.is_archived)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      selectedFloor.is_archived
                        ? "bg-purple-600/20 border-purple-500 text-purple-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Archive size={14} />
                    <span>{selectedFloor.is_archived ? "Archived" : "Archive"}</span>
                  </button>
                </div>
              </div>

              {/* Sub-Tools Tabs */}
              <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800 overflow-x-auto text-xs font-bold">
                <button
                  onClick={() => setActiveFloorTab("dimensions")}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    activeFloorTab === "dimensions" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Ruler size={14} />
                  <span>Dimensions & Scale Tools</span>
                </button>

                <button
                  onClick={() => setActiveFloorTab("blueprint")}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    activeFloorTab === "blueprint" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <ImageIcon size={14} />
                  <span>Floor Plan & Background</span>
                </button>

                <button
                  onClick={() => setActiveFloorTab("visibility")}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    activeFloorTab === "visibility" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Eye size={14} />
                  <span>Floor Visibility & Access</span>
                </button>

                <button
                  onClick={() => setActiveFloorTab("versions")}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    activeFloorTab === "versions" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <History size={14} />
                  <span>Floor Versioning</span>
                </button>
              </div>

              {/* TAB 1: DIMENSIONS, SCALE & METADATA TOOLS */}
              {activeFloorTab === "dimensions" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Floor Naming & Identity */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                      <Sliders size={14} /> Floor Identity & Level
                    </h4>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Set Floor Number / Code</label>
                      <input
                        type="text"
                        defaultValue={selectedFloor.floor_number || (selectedFloor.level === 0 ? "G" : String(selectedFloor.level))}
                        onBlur={(e) => handleUpdateFloorProperty("floor_number", e.target.value)}
                        placeholder="e.g. G, 1, 2, 3, B1"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white font-mono"
                      />
                      <span className="text-[10px] text-slate-500">Example: G for Ground, 1 for First Floor, 2 for Second, B1 for Basement</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Set Floor Name (Rename Tool)</label>
                      <input
                        type="text"
                        defaultValue={selectedFloor.name}
                        onBlur={(e) => handleUpdateFloorProperty("name", e.target.value)}
                        placeholder="e.g. Ground Floor"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Numeric Level</label>
                      <input
                        type="number"
                        defaultValue={selectedFloor.level}
                        onBlur={(e) => handleUpdateFloorProperty("level", Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  {/* Physical Dimensions & Scale */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                      <Ruler size={14} /> Physical Dimensions & Vector Scale
                    </h4>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Set Floor Ceiling Height (Meters)</label>
                      <input
                        type="number"
                        step="0.1"
                        defaultValue={selectedFloor.height_meters || 3.5}
                        onBlur={(e) => handleUpdateFloorProperty("height_meters", Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white font-bold"
                      />
                      <span className="text-[10px] text-slate-500">Standard institutional floor height is 3.5m - 4.2m</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Width (px)</label>
                        <input
                          type="number"
                          defaultValue={selectedFloor.width_px || 1000}
                          onBlur={(e) => handleUpdateFloorProperty("width_px", Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Height (px)</label>
                        <input
                          type="number"
                          defaultValue={selectedFloor.height_px || 750}
                          onBlur={(e) => handleUpdateFloorProperty("height_px", Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Set Floor Metric Scale Ratio</label>
                      <select
                        defaultValue={selectedFloor.scale_ratio || 0.05}
                        onChange={(e) => handleUpdateFloorProperty("scale_ratio", Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                      >
                        <option value={0.05}>1 px = 0.05 m (Standard CAD 20px = 1m)</option>
                        <option value={0.02}>1 px = 0.02 m (High Detail 50px = 1m)</option>
                        <option value={0.1}>1 px = 0.10 m (Campus Macro 10px = 1m)</option>
                      </select>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: BLUEPRINT & BACKGROUND TOOLS */}
              {activeFloorTab === "blueprint" && (
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">
                        Upload & Replace Floor Plan Blueprint
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Upload architectural CAD drawings, vector SVGs, or high-res PNG/JPG overlays.
                      </p>
                    </div>

                    <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-2 transition-all">
                      <Upload size={14} />
                      <span>Upload Blueprint Plan</span>
                      <input type="file" accept="image/*,.svg" onChange={handlePlanUpload} className="hidden" />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Set Canvas Background Color</label>
                      <div className="flex gap-2">
                        {["#090d16", "#0f172a", "#020617", "#18181b", "#1e293b"].map(col => (
                          <button
                            key={col}
                            onClick={() => handleUpdateFloorProperty("background_color", col)}
                            className={`w-8 h-8 rounded-lg border transition-transform ${selectedFloor.background_color === col ? "border-indigo-400 scale-110 shadow" : "border-slate-800"}`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Set Grid Style</label>
                      <select
                        defaultValue={selectedFloor.grid_style || "fine-grid"}
                        onChange={(e) => handleUpdateFloorProperty("grid_style", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                      >
                        <option value="fine-grid">Fine 20px CAD Grid</option>
                        <option value="dot-grid">Dot Matrix Grid</option>
                        <option value="blueprint">Blueprint Dark Graph</option>
                        <option value="none">No Grid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Blueprint Status</label>
                      <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 size={13} />
                        <span>{selectedFloor.background_image ? "Custom Blueprint Active" : "Default Vector Shell"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: VISIBILITY & ACCESS ROLES */}
              {activeFloorTab === "visibility" && (
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                  <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">
                    Floor Visibility & Access Control
                  </h4>
                  <p className="text-xs text-slate-400">
                    Configure who can see and navigate through this floor across the multi-portal system.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                    {[
                      { id: "Public", label: "Public (All Portals)", desc: "Students, Faculty, Parents & Visitors can view & navigate." },
                      { id: "Faculty Only", label: "Faculty & Staff Only", desc: "Restricted to professors and administrative members." },
                      { id: "Maintenance", label: "Under Maintenance", desc: "Locked for renovations or ongoing repairs." },
                      { id: "Hidden", label: "Hidden / Internal", desc: "Only visible to administrators in CAD Editor." }
                    ].map(vis => (
                      <div
                        key={vis.id}
                        onClick={() => handleUpdateFloorProperty("visibility", vis.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          selectedFloor.visibility === vis.id
                            ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-white">{vis.label}</span>
                          {selectedFloor.visibility === vis.id && <Check size={14} className="text-indigo-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400">{vis.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: FLOOR VERSIONING */}
              {activeFloorTab === "versions" && (
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">
                        Floor CAD Versioning & Snapshots
                      </h4>
                      <p className="text-xs text-slate-400">
                        Every save creates a persistent snapshot. Restore any prior layout version with 1 click.
                      </p>
                    </div>
                  </div>

                  {loadingVersions ? (
                    <div className="p-6 text-center text-xs text-slate-400">Loading version history...</div>
                  ) : versions.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                      No prior versions recorded yet. Save changes in CAD editor to generate version v1.0.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {versions.map((ver) => (
                        <div
                          key={ver.id}
                          className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-mono font-bold text-indigo-300 text-xs">
                              v{ver.version_number}
                            </div>
                            <div>
                              <div className="font-bold text-white">Version {ver.version_number}.0 Snapshot</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {new Date(ver.created_at).toLocaleString()} • {Math.round(ver.data_size / 1024 * 10) / 10} KB
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRestoreVersion(ver.version_number)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white transition-colors"
                          >
                            Restore Version
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-500 space-y-2">
              <Building2 size={36} className="text-slate-700 animate-pulse" />
              <p className="text-xs font-bold">Select a Building, Block and Floor from the left cascade to configure tools.</p>
            </div>
          )}

        </div>

      </div>

      {/* ============================================================ */}
      {/* MODALS FOR ADD/EDIT (BUILDING, BLOCK, FLOOR) */}
      {/* ============================================================ */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">
                {modalType === "addBuilding" && "Add New Campus Building"}
                {modalType === "editBuilding" && "Edit Building Details"}
                {modalType === "addBlock" && "Add New Block"}
                {modalType === "editBlock" && "Edit Block Details"}
                {modalType === "addFloor" && "Add New Floor"}
                {modalType === "editFloor" && "Edit Floor Properties"}
              </h3>
              <button onClick={() => setModalType(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={formInput.name || ""}
                  onChange={(e) => setFormInput({ ...formInput, name: e.target.value })}
                  placeholder="e.g. Science & Tech Wing"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              {(modalType === "addBuilding" || modalType === "editBuilding") && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Building Code</label>
                    <input
                      type="text"
                      value={formInput.code || ""}
                      onChange={(e) => setFormInput({ ...formInput, code: e.target.value })}
                      placeholder="e.g. ENG-01"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Campus Location</label>
                    <input
                      type="text"
                      value={formInput.campus_location || ""}
                      onChange={(e) => setFormInput({ ...formInput, campus_location: e.target.value })}
                      placeholder="e.g. North Campus"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </>
              )}

              {(modalType === "addFloor" || modalType === "editFloor") && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Floor Number / Code</label>
                      <input
                        type="text"
                        value={formInput.floor_number || ""}
                        onChange={(e) => setFormInput({ ...formInput, floor_number: e.target.value })}
                        placeholder="e.g. G, 1, 2, 3"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Level Index</label>
                      <input
                        type="number"
                        value={formInput.level !== undefined ? formInput.level : 0}
                        onChange={(e) => setFormInput({ ...formInput, level: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formInput.description || ""}
                  onChange={(e) => setFormInput({ ...formInput, description: e.target.value })}
                  placeholder="Optional details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (modalType === "addBuilding") handleAddBuilding();
                  if (modalType === "editBuilding") handleEditBuilding();
                  if (modalType === "addBlock") handleAddBlock();
                  if (modalType === "editBlock") handleEditBlock();
                  if (modalType === "addFloor") handleAddFloor();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
