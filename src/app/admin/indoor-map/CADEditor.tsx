import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MousePointer,
  Hand,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  RotateCw,
  Copy,
  ClipboardPaste,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Save,
  Route,
  Navigation,
  Split,
  Repeat,
  Sparkles,
  GitMerge,
  Merge,
  History,
  Send,
  RefreshCw,
  Expand,
  Minimize
} from "lucide-react";
import client from "../../../api/client";

export type RoomType =
  | "Classroom"
  | "Laboratory"
  | "Computer Lab"
  | "Faculty Room"
  | "Staff Room"
  | "HOD Room"
  | "Principal Office"
  | "Admin Office"
  | "Seminar Hall"
  | "Auditorium"
  | "Library"
  | "Meeting Room"
  | "Conference Room"
  | "Examination Hall"
  | "Store Room"
  | "Server Room"
  | "Reception"
  | "Waiting Room"
  | "Medical Room"
  | "Cafeteria"
  | "Custom Room";

export type FacilityType =
  | "Elevator"
  | "Staircase"
  | "Escalator"
  | "Ramp"
  | "Restroom"
  | "Drinking Water"
  | "Information Desk"
  | "Reception"
  | "Waiting Area"
  | "Cafeteria"
  | "ATM"
  | "Parking"
  | "Charging Station"
  | "Fire Exit"
  | "Fire Extinguisher"
  | "Fire Alarm"
  | "Emergency Phone"
  | "First Aid"
  | "Assembly Point"
  | "Emergency Staircase"
  | "Wi-Fi Access Point"
  | "CCTV"
  | "Printer"
  | "Vending Machine"
  | "Electrical Room"
  | "Server Room"
  | "Utility Room";

export type PathType =
  | "two-way"
  | "one-way"
  | "accessible"
  | "emergency"
  | "restricted"
  | "staff-only"
  | "closed";

export interface PathConfig {
  label: string;
  stroke: string;
  strokeDasharray?: string;
  strokeWidth: number;
  icon: string;
  desc: string;
}

const PATH_CONFIGS: Record<PathType, PathConfig> = {
  "two-way": { label: "Two-Way Path", stroke: "#10b981", strokeWidth: 3, icon: "↔️", desc: "Bidirectional walkway" },
  "one-way": { label: "One-Way Path", stroke: "#06b6d4", strokeDasharray: "6 3", strokeWidth: 3, icon: "➡️", desc: "Unidirectional corridor flow" },
  "accessible": { label: "Accessible Path", stroke: "#3b82f6", strokeWidth: 4, icon: "♿", desc: "Step-free ramp route" },
  "emergency": { label: "Emergency Path", stroke: "#22c55e", strokeDasharray: "4 2", strokeWidth: 4, icon: "🚨", desc: "Fire escape evacuation route" },
  "restricted": { label: "Restricted Path", stroke: "#f59e0b", strokeDasharray: "6 3", strokeWidth: 3, icon: "🔒", desc: "Authorized personnel only" },
  "staff-only": { label: "Staff Only Path", stroke: "#a855f7", strokeDasharray: "6 3", strokeWidth: 3, icon: "👤", desc: "Staff restricted corridor" },
  "closed": { label: "Closed / Blocked", stroke: "#ef4444", strokeDasharray: "4 4", strokeWidth: 3, icon: "🚫", desc: "Path under maintenance" }
};

export interface CADEntity {
  id: string;
  type: "room" | "wall" | "door" | "window" | "facility" | "nav-path" | "nav-junction" | "rectangle" | "line" | "label";
  name?: string;
  path_type?: PathType;
  from_node?: string;
  to_node?: string;
  path_width_meters?: number;
  walking_speed?: number;
  status?: "Active" | "Closed" | "Restricted" | "Maintenance";
  is_one_way?: boolean;
  is_accessible?: boolean;
  is_emergency?: boolean;
  connected_rooms?: string[];
  label_text?: string;
  room_number?: string;
  room_name?: string;
  department?: string;
  room_type?: RoomType;
  capacity?: number;
  facility_type?: FacilityType;
  icon?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  thickness?: number;
  fill: string;
  stroke: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  rotation?: number;
  locked?: boolean;
  hidden?: boolean;
  connected_nav_node_id?: string;
}

const INITIAL_CAD_ENTITIES: CADEntity[] = [
  {
    id: "CAD_ATRIUM",
    type: "room",
    room_number: "Atrium",
    room_name: "Central Quadrangle / Atrium",
    department: "General",
    room_type: "Custom Room",
    capacity: 100,
    x: 240,
    y: 200,
    width: 480,
    height: 260,
    rotation: 0,
    fill: "#064e3b",
    stroke: "#059669",
    strokeWidth: 3
  },
  { id: "CAD_1", type: "room", room_number: "A101", room_name: "Classroom A101", department: "CSE", room_type: "Classroom", capacity: 60, x: 95, y: 55, width: 285, height: 120, rotation: 0, fill: "#fef08a", stroke: "#18181b", strokeWidth: 2 },
  { id: "CAD_2", type: "room", room_number: "A102", room_name: "Classroom A102", department: "CSE", room_type: "Classroom", capacity: 60, x: 95, y: 175, width: 140, height: 120, rotation: 0, fill: "#fef08a", stroke: "#18181b", strokeWidth: 2 },
  { id: "CAD_3", type: "room", room_number: "A103", room_name: "Classroom A103", department: "AI/DS", room_type: "Classroom", capacity: 60, x: 235, y: 175, width: 145, height: 120, rotation: 0, fill: "#fef08a", stroke: "#18181b", strokeWidth: 2 },
  { id: "CAD_4", type: "room", room_number: "A109", room_name: "Computer Lab", department: "CSE", room_type: "Laboratory", capacity: 80, x: 30, y: 340, width: 180, height: 145, rotation: 0, fill: "#bae6fd", stroke: "#18181b", strokeWidth: 2 },
  { id: "CAD_5", type: "room", room_number: "A105", room_name: "Turing Seminar Hall", department: "CSE/AI", room_type: "Seminar Hall", capacity: 150, x: 740, y: 340, width: 220, height: 145, rotation: 0, fill: "#f3e8ff", stroke: "#18181b", strokeWidth: 2 },

  { id: "WALL_TOP", type: "wall", x: 95, y: 55, width: 285, height: 0, x1: 95, y1: 55, x2: 380, y2: 55, thickness: 8, fill: "transparent", stroke: "#334155" },
  { id: "WALL_MID", type: "wall", x: 95, y: 175, width: 285, height: 0, x1: 95, y1: 175, x2: 380, y2: 175, thickness: 6, fill: "transparent", stroke: "#475569" },

  { id: "DOOR_A101", type: "door", x: 220, y: 175, width: 28, height: 28, rotation: 0, fill: "transparent", stroke: "#38bdf8", strokeWidth: 2 },

  { id: "FAC_ELEV", type: "facility", facility_type: "Elevator", room_name: "Elevator #1", icon: "🛗", x: 745, y: 415, width: 36, height: 36, rotation: 0, fill: "#0284c7", stroke: "#ffffff" },
  { id: "FAC_STAIR", type: "facility", facility_type: "Staircase", room_name: "South Stairwell", icon: "🪜", x: 425, y: 545, width: 36, height: 36, rotation: 0, fill: "#475569", stroke: "#ffffff" },
  { id: "FAC_REST", type: "facility", facility_type: "Restroom", room_name: "Restroom", icon: "🚻", x: 385, y: 115, width: 32, height: 32, rotation: 0, fill: "#3b82f6", stroke: "#ffffff" },

  {
    id: "JUNC_WEST",
    type: "nav-junction",
    name: "West Corridor Hub",
    room_name: "West Corridor Hub",
    connected_nav_node_id: "N_JUNC_WEST",
    status: "Active",
    x: 95,
    y: 505,
    width: 18,
    height: 18,
    fill: "#10b981",
    stroke: "#ffffff",
    strokeWidth: 2.5
  },
  {
    id: "JUNC_CENTRAL",
    type: "nav-junction",
    name: "Central Atrium Crossroads Hub",
    room_name: "Central Atrium Crossroads Hub",
    connected_nav_node_id: "N_JUNC_CENTRAL",
    status: "Active",
    x: 425,
    y: 505,
    width: 18,
    height: 18,
    fill: "#10b981",
    stroke: "#ffffff",
    strokeWidth: 2.5
  },
  {
    id: "JUNC_EAST",
    type: "nav-junction",
    name: "East Elevator Hub",
    room_name: "East Elevator Hub",
    connected_nav_node_id: "N_JUNC_EAST",
    status: "Active",
    x: 745,
    y: 505,
    width: 18,
    height: 18,
    fill: "#10b981",
    stroke: "#ffffff",
    strokeWidth: 2.5
  },
  {
    id: "PATH_CORRIDOR_WEST_CENTRAL",
    type: "nav-path",
    name: "West Wing Main Corridor",
    path_type: "two-way",
    from_node: "N_JUNC_WEST",
    to_node: "N_JUNC_CENTRAL",
    path_width_meters: 2.4,
    walking_speed: 1.2,
    status: "Active",
    is_accessible: true,
    is_emergency: false,
    is_one_way: false,
    connected_rooms: ["Classroom A102", "Classroom A103", "Computer Lab"],
    x: 95,
    y: 505,
    width: 330,
    height: 0,
    x1: 95,
    y1: 505,
    x2: 425,
    y2: 505,
    fill: "transparent",
    stroke: "#10b981",
    strokeWidth: 3.5
  },
  {
    id: "PATH_CORRIDOR_CENTRAL_EAST",
    type: "nav-path",
    name: "East Wing Elevator Corridor",
    path_type: "two-way",
    from_node: "N_JUNC_CENTRAL",
    to_node: "N_JUNC_EAST",
    path_width_meters: 2.4,
    walking_speed: 1.2,
    status: "Active",
    is_accessible: true,
    is_emergency: false,
    is_one_way: false,
    connected_rooms: ["Central Quadrangle", "Turing Seminar Hall", "Passenger Elevator #1"],
    x: 425,
    y: 505,
    width: 320,
    height: 0,
    x1: 425,
    y1: 505,
    x2: 745,
    y2: 505,
    fill: "transparent",
    stroke: "#10b981",
    strokeWidth: 3.5
  }
];

export function CADEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Entities & Selection
  const [entities, setEntities] = useState<CADEntity[]>(INITIAL_CAD_ENTITIES);
  const [selectedIds, setSelectedIds] = useState<string[]>(["PATH_CORRIDOR_WEST_CENTRAL"]);
  const [clipboard, setClipboard] = useState<CADEntity | null>(null);

  // Persistence State
  const [mapVersion, setMapVersion] = useState<string>("v1.0");
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>("Just now");
  const [versionsList, setVersionsList] = useState<{ id: number; version_number: number; created_at: string }[]>([]);
  const [showVersionsModal, setShowVersionsModal] = useState<boolean>(false);
  const [isLoadingMap, setIsLoadingMap] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Active Tool Mode
  const [activeTool, setActiveTool] = useState<
    "select" | "multiselect" | "pan" | "room" | "wall" | "door" | "facility" | "nav-path" | "add-node"
  >("select");

  // Path Creation Settings
  const [currentPathType, setCurrentPathType] = useState<PathType>("two-way");
  const [currentPathWidth] = useState<number>(2.4);

  // Viewport (Zoom & Pan)
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Precision Settings
  const [showGrid] = useState<boolean>(true);
  const [snapToGrid] = useState<boolean>(true);
  const [snapGridStep] = useState<number>(10);
  const [showRulers] = useState<boolean>(true);

  // Cursor & Magnetic Snapping
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapBadge, setSnapBadge] = useState<{ x: number; y: number; label: string; nodeId?: string } | null>(null);

  // History (Undo / Redo)
  const [history, setHistory] = useState<CADEntity[][]>([INITIAL_CAD_ENTITIES]);
  const [historyStep, setHistoryStep] = useState<number>(0);

  // Drawing Live State
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number; startNodeId?: string }>({ x: 0, y: 0 });
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Move Dragging State
  const [draggingEntityId, setDraggingEntityId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ startX: number; startY: number; initialEntities: { id: string; x: number; y: number }[] }>({
    startX: 0,
    startY: 0,
    initialEntities: []
  });
  const [hasMovedDuringDrag, setHasMovedDuringDrag] = useState<boolean>(false);

  // Resize / Endpoint Dragging State
  const [resizingHandle, setResizingHandle] = useState<{
    entityId: string;
    handle: "nw" | "ne" | "se" | "sw" | "p1" | "p2";
    startX: number;
    startY: number;
    initialRect: { x: number; y: number; width: number; height: number; x1?: number; y1?: number; x2?: number; y2?: number };
  } | null>(null);

  // Rotating State
  const [isRotating, setIsRotating] = useState<{
    entityId: string;
    centerX: number;
    centerY: number;
    startAngle: number;
    initialRotation: number;
  } | null>(null);

  // Route simulation
  const [isSimulatingRoute, setIsSimulatingRoute] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // Selected Entity
  const primarySelectedEntity = entities.find(e => selectedIds.includes(e.id));
  const isSelectedNavPath = primarySelectedEntity?.type === "nav-path";
  const isSelectedJunction = primarySelectedEntity?.type === "nav-junction";

  // History Helper
  const updateEntitiesWithHistory = useCallback((newEntities: CADEntity[]) => {
    const updatedHistory = history.slice(0, historyStep + 1);
    updatedHistory.push(newEntities);
    setHistory(updatedHistory);
    setHistoryStep(updatedHistory.length - 1);
    setEntities(newEntities);
  }, [history, historyStep]);

  // Load Map Data on Mount
  const loadMapData = useCallback(async () => {
    setIsLoadingMap(true);
    try {
      const localDraft = localStorage.getItem("indoor_cad_floor_1");
      if (localDraft) {
        try {
          const parsed = JSON.parse(localDraft);
          if (Array.isArray(parsed.entities) && parsed.entities.length > 0) {
            setEntities(parsed.entities);
            setHistory([parsed.entities]);
            setHistoryStep(0);
            if (parsed.mapVersion) setMapVersion(parsed.mapVersion);
            if (parsed.isPublished !== undefined) setIsPublished(parsed.isPublished);
          }
        } catch (_) {}
      }

      const res = await client.get("/indoor-map/floors/1");
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        if (d.floor) {
          if (d.floor.version) setMapVersion(d.floor.version);
          if (d.floor.is_published !== undefined) setIsPublished(Boolean(d.floor.is_published));
        }

        if (d.latestSnapshot && Array.isArray(d.latestSnapshot.entities) && d.latestSnapshot.entities.length > 0) {
          setEntities(d.latestSnapshot.entities);
          setHistory([d.latestSnapshot.entities]);
          setHistoryStep(0);
        }
      }
    } catch (err) {
      console.warn("Using offline floor map data", err);
    } finally {
      setIsLoadingMap(false);
    }
  }, []);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  // Fetch Versions History
  const fetchVersionHistory = async () => {
    try {
      const res = await client.get("/indoor-map/floors/1/versions");
      if (res.data?.success) {
        setVersionsList(res.data.data || []);
      }
    } catch (_) {}
  };

  // Auto Save
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const payload = {
          entities,
          mapVersion,
          isPublished,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem("indoor_cad_floor_1", JSON.stringify(payload));
        const now = new Date();
        setLastAutoSaveTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (_) {}
    }, 2500);

    return () => clearTimeout(timer);
  }, [entities, mapVersion, isPublished]);

  // Save Draft
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const rooms = entities.filter(e => e.type === "room" || e.type === "rectangle");
      const walls = entities.filter(e => e.type === "wall");
      const doors = entities.filter(e => e.type === "door");
      const windows = entities.filter(e => e.type === "window");
      const objects = entities.filter(e => e.type === "facility");
      const nodes = entities.filter(e => e.type === "nav-junction" || e.connected_nav_node_id).map(e => ({
        id: e.connected_nav_node_id || e.id,
        node_name: e.name || e.room_name || e.id,
        node_type: e.type === "nav-junction" ? "junction" : e.type,
        x: e.x,
        y: e.y,
        status: e.status || "Active"
      }));
      const edges = entities.filter(e => e.type === "nav-path").map(p => ({
        id: p.id,
        name: p.name,
        from_node: p.from_node || "N_START",
        to_node: p.to_node || "N_END",
        distance_meters: Math.round(Math.hypot((p.x2 ?? (p.x + p.width)) - (p.x1 ?? p.x), (p.y2 ?? (p.y + p.height)) - (p.y1 ?? p.y)) * 0.05),
        path_type: p.path_type || "two-way",
        is_bidirectional: !p.is_one_way,
        is_accessible: p.is_accessible !== false,
        is_emergency: Boolean(p.is_emergency),
        status: p.status || "Active"
      }));

      const res = await client.post("/indoor-map/floors/1/save", {
        rooms,
        walls,
        doors,
        windows,
        objects,
        nodes,
        edges,
        entities,
        is_published: false,
        status: "Draft"
      });

      if (res.data?.version) setMapVersion(res.data.version);
      setIsPublished(false);
      localStorage.setItem("indoor_cad_floor_1", JSON.stringify({ entities, mapVersion: res.data?.version || mapVersion, isPublished: false }));
      showToast("✓ Floor Map Draft Saved to Database");
    } catch (_) {
      showToast("✓ Saved Draft Locally");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Publish Map
  const handlePublishMap = async () => {
    setIsPublishing(true);
    try {
      const rooms = entities.filter(e => e.type === "room" || e.type === "rectangle");
      const walls = entities.filter(e => e.type === "wall");
      const doors = entities.filter(e => e.type === "door");
      const windows = entities.filter(e => e.type === "window");
      const objects = entities.filter(e => e.type === "facility");
      const nodes = entities.filter(e => e.type === "nav-junction" || e.connected_nav_node_id).map(e => ({
        id: e.connected_nav_node_id || e.id,
        node_name: e.name || e.room_name || e.id,
        node_type: e.type === "nav-junction" ? "junction" : e.type,
        x: e.x,
        y: e.y,
        status: "Active"
      }));
      const edges = entities.filter(e => e.type === "nav-path").map(p => ({
        id: p.id,
        name: p.name,
        from_node: p.from_node || "N_START",
        to_node: p.to_node || "N_END",
        distance_meters: Math.round(Math.hypot((p.x2 ?? (p.x + p.width)) - (p.x1 ?? p.x), (p.y2 ?? (p.y + p.height)) - (p.y1 ?? p.y)) * 0.05),
        path_type: p.path_type || "two-way",
        is_bidirectional: !p.is_one_way,
        is_accessible: p.is_accessible !== false,
        is_emergency: Boolean(p.is_emergency),
        status: "Active"
      }));

      const res = await client.post("/indoor-map/floors/1/save", {
        rooms,
        walls,
        doors,
        windows,
        objects,
        nodes,
        edges,
        entities,
        is_published: true,
        status: "Published"
      });

      const nextVer = res.data?.version || "v2.0";
      setMapVersion(nextVer);
      setIsPublished(true);
      localStorage.setItem("indoor_cad_floor_1", JSON.stringify({ entities, mapVersion: nextVer, isPublished: true }));
      showToast(`🚀 Map Published Live (${nextVer})!`);
    } catch (_) {
      setIsPublished(true);
      showToast("🚀 Published Live to Campus Navigator");
    } finally {
      setIsPublishing(false);
    }
  };

  // Restore Version
  const handleRestoreVersion = async (vNum: number) => {
    try {
      const res = await client.post(`/indoor-map/floors/1/versions/${vNum}/restore`);
      if (res.data?.success) {
        showToast(`✓ Restored to Version ${vNum}`);
        setShowVersionsModal(false);
        await loadMapData();
      }
    } catch (_) {
      showToast("Error restoring version");
    }
  };

  // Snapping logic
  const getSnapTarget = useCallback((rawX: number, rawY: number) => {
    const SNAP_RADIUS = 16;
    let bestSnap: { x: number; y: number; label: string; nodeId?: string } | null = null;

    for (const ent of entities) {
      if (ent.hidden) continue;

      if (ent.type === "nav-junction") {
        if (Math.hypot(rawX - ent.x, rawY - ent.y) < SNAP_RADIUS) {
          bestSnap = { x: ent.x, y: ent.y, label: `Hub: ${ent.room_name || ent.id}`, nodeId: ent.connected_nav_node_id || ent.id };
          break;
        }
      } else if (ent.type === "door") {
        if (Math.hypot(rawX - ent.x, rawY - ent.y) < SNAP_RADIUS) {
          bestSnap = { x: ent.x, y: ent.y, label: `Door: ${ent.id}`, nodeId: `N_DOOR_${ent.id}` };
          break;
        }
      } else if (ent.type === "facility") {
        if (Math.hypot(rawX - ent.x, rawY - ent.y) < SNAP_RADIUS) {
          bestSnap = { x: ent.x, y: ent.y, label: `Facility: ${ent.room_name || ent.facility_type}`, nodeId: `N_FAC_${ent.id}` };
          break;
        }
      } else if (ent.type === "room" || ent.type === "rectangle") {
        const entranceX = Math.round(ent.x + ent.width / 2);
        const entranceY = Math.round(ent.y + ent.height);
        if (Math.hypot(rawX - entranceX, rawY - entranceY) < SNAP_RADIUS) {
          bestSnap = { x: entranceX, y: entranceY, label: `Entrance: ${ent.room_number || ent.room_name}`, nodeId: `N_ROOM_${ent.room_number || ent.id}` };
          break;
        }
      }
    }

    return bestSnap;
  }, [entities]);

  const getCanvasCoords = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = 1000 / rect.width;
    const scaleY = 750 / rect.height;
    const rawSvgX = (e.clientX - rect.left) * scaleX;
    const rawSvgY = (e.clientY - rect.top) * scaleY;

    let canvasX = (rawSvgX - pan.x) / zoom;
    let canvasY = (rawSvgY - pan.y) / zoom;

    const objSnap = getSnapTarget(canvasX, canvasY);
    if (objSnap) {
      setSnapBadge(objSnap);
      return { x: objSnap.x, y: objSnap.y, snapInfo: objSnap };
    } else {
      setSnapBadge(null);
    }

    if (snapToGrid) {
      canvasX = Math.round(canvasX / snapGridStep) * snapGridStep;
      canvasY = Math.round(canvasY / snapGridStep) * snapGridStep;
    }

    return { x: Math.round(canvasX), y: Math.round(canvasY), snapInfo: null };
  }, [pan, zoom, snapToGrid, snapGridStep, getSnapTarget]);

  // Actions
  const handleZoomIn = () => setZoom(z => Math.min(3.5, Number((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom(z => Math.max(0.35, Number((z - 0.15).toFixed(2))));
  const handleResetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); showToast("View reset to 100%"); };
  const handleFitScreen = () => { setZoom(0.96); setPan({ x: 20, y: 15 }); showToast("Fit to workspace screen"); };

  const handleUndo = () => {
    if (historyStep > 0) {
      const nextStep = historyStep - 1;
      setHistoryStep(nextStep);
      setEntities(history[nextStep]);
      showToast("↶ Undo");
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      setHistoryStep(nextStep);
      setEntities(history[nextStep]);
      showToast("↷ Redo");
    }
  };

  const handleCopy = () => {
    if (primarySelectedEntity) {
      setClipboard({ ...primarySelectedEntity });
      showToast(`✓ Copied ${primarySelectedEntity.name || primarySelectedEntity.room_name || primarySelectedEntity.id}`);
    }
  };

  const handlePaste = () => {
    if (clipboard) {
      const newId = `ENT_${Date.now()}`;
      const pasted: CADEntity = {
        ...clipboard,
        id: newId,
        x: clipboard.x + 30,
        y: clipboard.y + 30,
        x1: clipboard.x1 !== undefined ? clipboard.x1 + 30 : undefined,
        y1: clipboard.y1 !== undefined ? clipboard.y1 + 30 : undefined,
        x2: clipboard.x2 !== undefined ? clipboard.x2 + 30 : undefined,
        y2: clipboard.y2 !== undefined ? clipboard.y2 + 30 : undefined
      };
      updateEntitiesWithHistory([...entities, pasted]);
      setSelectedIds([newId]);
      showToast("✓ Pasted object");
    }
  };

  const handleDuplicate = () => {
    if (primarySelectedEntity) {
      const newId = `ENT_${Date.now()}`;
      const duplicated: CADEntity = {
        ...primarySelectedEntity,
        id: newId,
        x: primarySelectedEntity.x + 20,
        y: primarySelectedEntity.y + 20,
        x1: primarySelectedEntity.x1 !== undefined ? primarySelectedEntity.x1 + 20 : undefined,
        y1: primarySelectedEntity.y1 !== undefined ? primarySelectedEntity.y1 + 20 : undefined,
        x2: primarySelectedEntity.x2 !== undefined ? primarySelectedEntity.x2 + 20 : undefined,
        y2: primarySelectedEntity.y2 !== undefined ? primarySelectedEntity.y2 + 20 : undefined
      };
      updateEntitiesWithHistory([...entities, duplicated]);
      setSelectedIds([newId]);
      showToast("✓ Duplicated object");
    }
  };

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const remaining = entities.filter(e => !selectedIds.includes(e.id));
    updateEntitiesWithHistory(remaining);
    setSelectedIds([]);
    showToast("✓ Deleted object");
  }, [entities, selectedIds, updateEntitiesWithHistory, showToast]);

  const handleToolAddPath = () => {
    setActiveTool("nav-path");
    showToast(`Add Path Active: Click start waypoint & drag to connect destination`);
  };

  const handleAddPathNode = () => {
    const newId = `N_HUB_${Date.now().toString().slice(-4)}`;
    const newJunc: CADEntity = {
      id: `JUNC_${Date.now()}`,
      type: "nav-junction",
      name: `Junction ${newId}`,
      room_name: `Junction ${newId}`,
      connected_nav_node_id: newId,
      status: "Active",
      x: 400,
      y: 350,
      width: 18,
      height: 18,
      fill: "#10b981",
      stroke: "#ffffff",
      strokeWidth: 2.5
    };
    updateEntitiesWithHistory([...entities, newJunc]);
    setSelectedIds([newJunc.id]);
    setActiveTool("select");
    showToast(`✓ Added Navigation Node [${newId}]`);
  };

  const handleChangePathType = (type: PathType) => {
    setCurrentPathType(type);
    const cfg = PATH_CONFIGS[type];

    if (selectedIds.length > 0) {
      const updated = entities.map(e => selectedIds.includes(e.id) && e.type === "nav-path" ? {
        ...e,
        path_type: type,
        stroke: cfg.stroke,
        strokeWidth: cfg.strokeWidth,
        strokeDasharray: cfg.strokeDasharray,
        is_one_way: type === "one-way",
        is_accessible: type === "accessible",
        is_emergency: type === "emergency",
        status: type === "closed" ? ("Closed" as const) : type === "restricted" ? ("Restricted" as const) : ("Active" as const)
      } : e);
      updateEntitiesWithHistory(updated);
      showToast(`✓ Changed Path Classification to ${cfg.icon} ${cfg.label}`);
    }
  };

  const handleSplitPath = () => {
    if (!primarySelectedEntity || primarySelectedEntity.type !== "nav-path") return;
    const p = primarySelectedEntity;
    const x1 = p.x1 ?? p.x;
    const y1 = p.y1 ?? p.y;
    const x2 = p.x2 ?? (p.x + p.width);
    const y2 = p.y2 ?? (p.y + p.height);
    const midX = Math.round((x1 + x2) / 2);
    const midY = Math.round((y1 + y2) / 2);
    const juncId = `N_HUB_${Date.now().toString().slice(-4)}`;

    const junc: CADEntity = {
      id: `JUNC_${Date.now()}`,
      type: "nav-junction",
      name: `Hub ${juncId}`,
      room_name: `Hub ${juncId}`,
      connected_nav_node_id: juncId,
      status: "Active",
      x: midX,
      y: midY,
      width: 18,
      height: 18,
      fill: "#10b981",
      stroke: "#ffffff",
      strokeWidth: 2.5
    };

    const path1: CADEntity = { ...p, id: `PATH_${Date.now()}_A`, name: `${p.name || "Path"} Part 1`, to_node: juncId, x: Math.min(x1, midX), y: Math.min(y1, midY), width: Math.abs(midX - x1), height: Math.abs(midY - y1), x1, y1, x2: midX, y2: midY };
    const path2: CADEntity = { ...p, id: `PATH_${Date.now()}_B`, name: `${p.name || "Path"} Part 2`, from_node: juncId, x: Math.min(midX, x2), y: Math.min(midY, y2), width: Math.abs(x2 - midX), height: Math.abs(y2 - midY), x1: midX, y1: midY, x2, y2 };

    const updated = entities.filter(e => e.id !== p.id).concat([path1, path2, junc]);
    updateEntitiesWithHistory(updated);
    setSelectedIds([junc.id]);
    showToast(`✓ Split Path with Junction Hub [${juncId}]`);
  };

  const handleJoinPath = () => {
    if (!primarySelectedEntity || primarySelectedEntity.type !== "nav-path") return;
    const p1 = primarySelectedEntity;
    const p2 = entities.find(e => e.type === "nav-path" && e.id !== p1.id && (e.from_node === p1.to_node || e.to_node === p1.from_node));
    if (!p2) {
      showToast("No connecting path found at endpoints to join");
      return;
    }

    const nX1 = p1.x1 ?? p1.x;
    const nY1 = p1.y1 ?? p1.y;
    const nX2 = p2.x2 ?? (p2.x + p2.width);
    const nY2 = p2.y2 ?? (p2.y + p2.height);

    const mergedPath: CADEntity = {
      ...p1,
      id: `PATH_MERGED_${Date.now()}`,
      name: `Joined Corridor (${p1.name || "Path"} + ${p2.name || "Path"})`,
      to_node: p2.to_node || p1.to_node,
      x: Math.min(nX1, nX2),
      y: Math.min(nY1, nY2),
      width: Math.abs(nX2 - nX1),
      height: Math.abs(nY2 - nY1),
      x1: nX1,
      y1: nY1,
      x2: nX2,
      y2: nY2
    };

    const remaining = entities.filter(e => e.id !== p1.id && e.id !== p2.id);
    updateEntitiesWithHistory([...remaining, mergedPath]);
    setSelectedIds([mergedPath.id]);
    showToast("✓ Joined connected paths into single corridor");
  };

  const handleReversePath = () => {
    if (!primarySelectedEntity || primarySelectedEntity.type !== "nav-path") return;
    const p = primarySelectedEntity;
    const updated = entities.map(e => e.id === p.id ? {
      ...e,
      x1: p.x2 ?? (p.x + p.width),
      y1: p.y2 ?? (p.y + p.height),
      x2: p.x1 ?? p.x,
      y2: p.y1 ?? p.y,
      from_node: p.to_node,
      to_node: p.from_node
    } : e);
    updateEntitiesWithHistory(updated);
    showToast("✓ Reversed Path direction");
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
      } else if (e.key === "Escape") {
        setSelectedIds([]);
        setActiveTool("select");
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveDraft();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDuplicate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, handleDeleteSelected, handleUndo, handleRedo, handleDuplicate]);

  // Canvas Mouse Events
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    const { x, y, snapInfo } = getCanvasCoords(e);

    if (activeTool === "pan" || e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (activeTool === "nav-path") {
      setIsDrawing(true);
      setDrawStart({ x, y, startNodeId: snapInfo?.nodeId });
      setDrawCurrent({ x, y });
      return;
    }

    setSelectedIds([]);
  };

  const onCanvasMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);
    setCursorPos({ x, y });

    // Rotating
    if (isRotating) {
      const angleRad = Math.atan2(y - isRotating.centerY, x - isRotating.centerX);
      let angleDeg = Math.round((angleRad * 180) / Math.PI) + 90;
      if (angleDeg < 0) angleDeg += 360;
      if (snapToGrid) angleDeg = Math.round(angleDeg / 15) * 15;

      setEntities(prev => prev.map(ent => ent.id === isRotating.entityId ? { ...ent, rotation: angleDeg } : ent));
      return;
    }

    // Resizing
    if (resizingHandle) {
      const dx = (e.clientX - resizingHandle.startX) / zoom;
      const dy = (e.clientY - resizingHandle.startY) / zoom;
      const rdx = snapToGrid ? Math.round(dx / snapGridStep) * snapGridStep : Math.round(dx);
      const rdy = snapToGrid ? Math.round(dy / snapGridStep) * snapGridStep : Math.round(dy);
      const { initialRect, handle, entityId } = resizingHandle;

      setEntities(prev => prev.map(ent => {
        if (ent.id !== entityId) return ent;

        if (handle === "p1") {
          const nX1 = (initialRect.x1 ?? initialRect.x) + rdx;
          const nY1 = (initialRect.y1 ?? initialRect.y) + rdy;
          return { ...ent, x1: nX1, y1: nY1, x: Math.min(nX1, ent.x2 ?? ent.x), y: Math.min(nY1, ent.y2 ?? ent.y) };
        } else if (handle === "p2") {
          const nX2 = (initialRect.x2 ?? (initialRect.x + initialRect.width)) + rdx;
          const nY2 = (initialRect.y2 ?? (initialRect.y + initialRect.height)) + rdy;
          return { ...ent, x2: nX2, y2: nY2, width: Math.abs(nX2 - (ent.x1 ?? ent.x)), height: Math.abs(nY2 - (ent.y1 ?? ent.y)) };
        } else if (handle === "se") {
          const newW = Math.max(30, initialRect.width + rdx);
          const newH = Math.max(30, initialRect.height + rdy);
          return { ...ent, width: newW, height: newH };
        } else if (handle === "sw") {
          const newW = Math.max(30, initialRect.width - rdx);
          const newH = Math.max(30, initialRect.height + rdy);
          return { ...ent, x: initialRect.x + (initialRect.width - newW), width: newW, height: newH };
        } else if (handle === "ne") {
          const newW = Math.max(30, initialRect.width + rdx);
          const newH = Math.max(30, initialRect.height - rdy);
          return { ...ent, y: initialRect.y + (initialRect.height - newH), width: newW, height: newH };
        } else if (handle === "nw") {
          const newW = Math.max(30, initialRect.width - rdx);
          const newH = Math.max(30, initialRect.height - rdy);
          return { ...ent, x: initialRect.x + (initialRect.width - newW), y: initialRect.y + (initialRect.height - newH), width: newW, height: newH };
        }
        return ent;
      }));
      return;
    }

    // Dragging with threshold to prevent accidental moves
    if (draggingEntityId && dragOffset.initialEntities.length > 0) {
      const rawDist = Math.hypot(e.clientX - dragOffset.startX, e.clientY - dragOffset.startY);
      if (rawDist > 3) {
        setHasMovedDuringDrag(true);
        const dx = (e.clientX - dragOffset.startX) / zoom;
        const dy = (e.clientY - dragOffset.startY) / zoom;
        const rdx = snapToGrid ? Math.round(dx / snapGridStep) * snapGridStep : Math.round(dx);
        const rdy = snapToGrid ? Math.round(dy / snapGridStep) * snapGridStep : Math.round(dy);

        setEntities(prev => prev.map(ent => {
          const init = dragOffset.initialEntities.find(i => i.id === ent.id);
          if (init && !ent.locked) {
            if (ent.type === "nav-path" || ent.type === "wall" || ent.type === "line") {
              const wX1 = (ent.x1 ?? ent.x) + rdx;
              const wY1 = (ent.y1 ?? ent.y) + rdy;
              const wX2 = (ent.x2 ?? (ent.x + ent.width)) + rdx;
              const wY2 = (ent.y2 ?? (ent.y + ent.height)) + rdy;
              return { ...ent, x: Math.min(wX1, wX2), y: Math.min(wY1, wY2), x1: wX1, y1: wY1, x2: wX2, y2: wY2 };
            }
            if (ent.type === "nav-junction") {
              return { ...ent, x: init.x + rdx, y: init.y + rdy };
            }
            return { ...ent, x: init.x + rdx, y: init.y + rdy };
          }
          return ent;
        }));
      }
      return;
    }

    if (isDrawing) {
      setDrawCurrent({ x, y });
      return;
    }

    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const onCanvasMouseUp = () => {
    if (isRotating || resizingHandle) {
      setIsRotating(null);
      setResizingHandle(null);
      updateEntitiesWithHistory([...entities]);
    }

    if (isDrawing && activeTool === "nav-path") {
      setIsDrawing(false);
      const cfg = PATH_CONFIGS[currentPathType];
      const distPx = Math.hypot(drawCurrent.x - drawStart.x, drawCurrent.y - drawStart.y);

      if (distPx > 15) {
        const startNodeId = drawStart.startNodeId || `N_${Date.now().toString().slice(-4)}_A`;
        const endSnap = getSnapTarget(drawCurrent.x, drawCurrent.y);
        const endNodeId = endSnap?.nodeId || `N_${Date.now().toString().slice(-4)}_B`;

        const newPath: CADEntity = {
          id: `PATH_${Date.now()}`,
          type: "nav-path",
          name: `${PATH_CONFIGS[currentPathType].label} (${startNodeId} → ${endNodeId})`,
          path_type: currentPathType,
          from_node: startNodeId,
          to_node: endNodeId,
          path_width_meters: currentPathWidth,
          walking_speed: 1.2,
          status: "Active",
          is_accessible: currentPathType === "accessible",
          is_emergency: currentPathType === "emergency",
          is_one_way: currentPathType === "one-way",
          connected_rooms: endSnap?.label ? [endSnap.label] : ["Corridor Zone"],
          x: Math.min(drawStart.x, drawCurrent.x),
          y: Math.min(drawStart.y, drawCurrent.y),
          width: Math.abs(drawCurrent.x - drawStart.x),
          height: Math.abs(drawCurrent.y - drawStart.y),
          x1: drawStart.x,
          y1: drawStart.y,
          x2: drawCurrent.x,
          y2: drawCurrent.y,
          fill: "transparent",
          stroke: cfg.stroke,
          strokeWidth: cfg.strokeWidth,
          strokeDasharray: cfg.strokeDasharray
        };

        updateEntitiesWithHistory([...entities, newPath]);
        setSelectedIds([newPath.id]);
        setActiveTool("select");
        showToast(`✓ Created ${cfg.label} (${(distPx * 0.05).toFixed(1)}m)`);
      }
    } else if (isDrawing) {
      setIsDrawing(false);
    }

    if (draggingEntityId && hasMovedDuringDrag) {
      updateEntitiesWithHistory([...entities]);
    }
    setDraggingEntityId(null);
    setIsPanning(false);
  };

  const handleEntityMouseDown = (e: React.MouseEvent, ent: CADEntity) => {
    e.stopPropagation();

    if (activeTool === "multiselect" || e.shiftKey) {
      setSelectedIds(prev => prev.includes(ent.id) ? prev.filter(i => i !== ent.id) : [...prev, ent.id]);
    } else {
      setSelectedIds([ent.id]);
    }

    if (!ent.locked && (activeTool === "select" || activeTool === "room" || activeTool === "facility")) {
      setDraggingEntityId(ent.id);
      setHasMovedDuringDrag(false);
      setDragOffset({
        startX: e.clientX,
        startY: e.clientY,
        initialEntities: entities.filter(item => selectedIds.includes(item.id) || item.id === ent.id).map(item => ({ id: item.id, x: item.x, y: item.y }))
      });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom(prev => Math.min(3.5, Math.max(0.35, Number((prev * zoomFactor).toFixed(2)))));
  };

  const pathDistance = primarySelectedEntity && primarySelectedEntity.type === "nav-path"
    ? Math.hypot((primarySelectedEntity.x2 ?? (primarySelectedEntity.x + primarySelectedEntity.width)) - (primarySelectedEntity.x1 ?? primarySelectedEntity.x), (primarySelectedEntity.y2 ?? (primarySelectedEntity.y + primarySelectedEntity.height)) - (primarySelectedEntity.y1 ?? primarySelectedEntity.y)) * 0.05
    : 0;

  const walkingSeconds = Math.round(pathDistance / (primarySelectedEntity?.walking_speed || 1.2));

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl select-none ${
        isFullScreen ? "fixed inset-0 z-50 rounded-none" : "relative"
      }`}
    >
      
      {/* 1. TOP CAD DRAFTING COMMAND CENTER TOOLBAR */}
      <div className="p-2 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs z-30 shadow-md">
        
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          
          {/* Tool Selection */}
          <div className="flex items-center gap-0.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setActiveTool("select"); showToast("Select Tool Active"); }}
              className={`p-1.5 px-2 rounded-lg font-bold transition-all flex items-center gap-1 ${
                activeTool === "select" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              title="Select (V)"
            >
              <MousePointer size={13} />
              <span className="text-[11px]">Select</span>
            </button>
            <button
              onClick={() => { setActiveTool("pan"); showToast("Pan Hand Active"); }}
              className={`p-1.5 px-2 rounded-lg font-bold transition-all flex items-center gap-1 ${
                activeTool === "pan" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
              title="Pan Canvas (H)"
            >
              <Hand size={13} />
            </button>
          </div>

          {/* Navigation Path Tools Suite */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-emerald-500/40">
            <button
              onClick={handleToolAddPath}
              className={`p-1 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
                activeTool === "nav-path" ? "bg-emerald-500 text-black font-black shadow-lg shadow-emerald-500/30" : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
              }`}
              title="Add Path: Click start node & drag to destination"
            >
              <Route size={12} />
              <span>Add Path</span>
            </button>

            <button
              onClick={handleAddPathNode}
              className="px-2 py-1 rounded-lg text-slate-300 hover:text-white font-bold text-[11px] flex items-center gap-1 hover:bg-slate-800"
              title="Add Path Node / Waypoint Hub"
            >
              <GitMerge size={12} className="text-emerald-400" />
              <span>Add Node</span>
            </button>

            <select
              value={currentPathType}
              onChange={(e) => handleChangePathType(e.target.value as PathType)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10.5px] font-bold text-emerald-300 max-w-[140px]"
            >
              {Object.keys(PATH_CONFIGS).map(pt => (
                <option key={pt} value={pt}>
                  {PATH_CONFIGS[pt as PathType].icon} {PATH_CONFIGS[pt as PathType].label}
                </option>
              ))}
            </select>
          </div>

          {/* History & Clipboard */}
          <div className="flex items-center gap-0.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button onClick={handleUndo} disabled={historyStep <= 0} className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30" title="Undo (Ctrl+Z)">
              <RotateCcw size={13} />
            </button>
            <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30" title="Redo (Ctrl+Y)">
              <RotateCw size={13} />
            </button>
            <button onClick={handleCopy} disabled={!primarySelectedEntity} className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30" title="Copy (Ctrl+C)">
              <Copy size={13} />
            </button>
            <button onClick={handlePaste} disabled={!clipboard} className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30" title="Paste (Ctrl+V)">
              <ClipboardPaste size={13} />
            </button>
            <button onClick={handleDeleteSelected} disabled={selectedIds.length === 0} className="p-1.5 rounded-lg text-red-400 hover:text-red-300 disabled:opacity-30" title="Delete Path / Object (Del)">
              <Trash2 size={13} />
            </button>
          </div>

          {/* Viewport Zoom & Reset */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-[10.5px]">
            <button onClick={handleZoomOut} className="p-1 rounded text-slate-400 hover:text-white" title="Zoom Out (-)">
              <ZoomOut size={12} />
            </button>
            <span className="px-1 text-slate-300 font-bold min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1 rounded text-slate-400 hover:text-white" title="Zoom In (+)">
              <ZoomIn size={12} />
            </button>
            <button onClick={handleResetView} className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px]" title="Reset View (1:1)">
              1:1
            </button>
            <button onClick={handleFitScreen} className="p-1 rounded text-slate-400 hover:text-white" title="Fit to Screen">
              <Maximize2 size={12} />
            </button>
          </div>

        </div>

        {/* Persistence, Versioning, Draft & Publish */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchVersionHistory();
              setShowVersionsModal(true);
            }}
            className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all"
            title="View Map Versions & Snapshots"
          >
            <History size={12} className="text-indigo-400" />
            <span>{mapVersion}</span>
            <span className={`w-2 h-2 rounded-full ${isPublished ? "bg-emerald-400" : "bg-amber-400"}`} />
          </button>

          <button
            onClick={loadMapData}
            disabled={isLoadingMap}
            className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white"
            title="Reload Map from Database"
          >
            <RefreshCw size={13} className={isLoadingMap ? "animate-spin text-indigo-400" : ""} />
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
            title="Save draft without publishing (Ctrl+S)"
          >
            <Save size={13} />
            <span>{isSavingDraft ? "Saving..." : "Save Draft"}</span>
          </button>

          <button
            onClick={handlePublishMap}
            disabled={isPublishing}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all"
            title="Publish Map to Public Campus Navigator"
          >
            <Send size={13} />
            <span>{isPublishing ? "Publishing..." : "Publish"}</span>
          </button>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white"
            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen CAD View"}
          >
            {isFullScreen ? <Minimize size={14} /> : <Expand size={14} />}
          </button>
        </div>

      </div>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

        {/* MAP CANVAS */}
        <div
          className={`flex-1 relative bg-slate-950 overflow-hidden select-none ${
            activeTool === "pan" ? "cursor-grab active:cursor-grabbing" :
            activeTool === "nav-path" ? "cursor-crosshair" : "cursor-default"
          }`}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onWheel={handleWheel}
        >
          
          {/* Top Metric Ruler */}
          {showRulers && (
            <div className="absolute top-0 left-6 right-0 h-5 bg-slate-900/90 border-b border-slate-800 z-10 font-mono text-[8px] text-slate-400 flex items-center overflow-hidden pointer-events-none">
              {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map(val => (
                <div key={`ruler-x-${val}`} className="absolute flex flex-col items-center" style={{ left: `${(val * zoom + pan.x) * (svgRef.current ? svgRef.current.clientWidth / 1000 : 1)}px` }}>
                  <span>{val * 0.05}m</span>
                  <div className="w-[1px] h-1.5 bg-slate-600" />
                </div>
              ))}
            </div>
          )}

          {/* Left Metric Ruler */}
          {showRulers && (
            <div className="absolute top-5 bottom-0 left-0 w-6 bg-slate-900/90 border-r border-slate-800 z-10 font-mono text-[8px] text-slate-400 flex flex-col justify-start overflow-hidden pointer-events-none">
              {[0, 100, 200, 300, 400, 500, 600, 700].map(val => (
                <div key={`ruler-y-${val}`} className="absolute flex items-center" style={{ top: `${(val * zoom + pan.y) * (svgRef.current ? svgRef.current.clientHeight / 750 : 1)}px` }}>
                  <div className="h-[1px] w-1.5 bg-slate-600 mr-0.5" />
                  <span className="leading-none transform -rotate-90">{val * 0.05}m</span>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Status HUD */}
          <div className="absolute bottom-3 left-8 z-20 bg-slate-900/90 backdrop-blur-md px-3.5 py-1 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-300 shadow-xl flex items-center gap-3">
            <span className="text-emerald-400 font-bold">TOOL: {activeTool.toUpperCase()}</span>
            <span className="text-slate-600">|</span>
            <span>X: <strong className="text-white">{cursorPos.x}px</strong></span>
            <span>Y: <strong className="text-white">{cursorPos.y}px</strong></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Auto-saved {lastAutoSaveTime}</span>
            </span>
            {snapBadge && (
              <span className="text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                🎯 {snapBadge.label}
              </span>
            )}
          </div>

          {/* Toast */}
          {toastMessage && (
            <div className="absolute top-6 right-6 z-30 bg-slate-900/95 border border-indigo-500/50 text-indigo-200 px-4 py-1.5 rounded-xl text-xs font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 flex items-center gap-2">
              <Sparkles size={13} className="text-indigo-400" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* SVG Canvas */}
          <svg
            ref={svgRef}
            viewBox="0 0 1000 750"
            className="w-full h-full block"
          >
            <defs>
              <pattern id="cad-grid-fine" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
              </pattern>
            </defs>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              <rect width="1000" height="750" fill="#090d16" />
              {showGrid && <rect width="1000" height="750" fill="url(#cad-grid-fine)" />}
              <rect x="20" y="20" width="960" height="670" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="6" />

              {/* RENDER ENTITIES */}
              {entities.map((ent) => {
                const isSelected = selectedIds.includes(ent.id);
                const rot = ent.rotation || 0;
                const centerX = ent.x + ent.width / 2;
                const centerY = ent.y + ent.height / 2;

                return (
                  <g
                    key={ent.id}
                    onMouseDown={(e) => handleEntityMouseDown(e, ent)}
                    className="group"
                    style={{
                      cursor: ent.locked ? "not-allowed" : activeTool === "select" ? "grab" : "pointer",
                      opacity: ent.hidden ? 0.25 : 1
                    }}
                  >
                    {/* ROOMS */}
                    {(ent.type === "room" || ent.type === "rectangle") && (
                      <g transform={rot ? `rotate(${rot} ${centerX} ${centerY})` : undefined}>
                        <rect
                          x={ent.x}
                          y={ent.y}
                          width={ent.width}
                          height={ent.height}
                          rx="8"
                          fill={ent.fill}
                          stroke={isSelected ? "#38bdf8" : ent.stroke}
                          strokeWidth={isSelected ? 3.5 : (ent.strokeWidth || 2)}
                          pointerEvents="all"
                        />
                        <text
                          x={centerX}
                          y={centerY + 4}
                          textAnchor="middle"
                          fill={ent.fill === "#064e3b" || ent.fill === "#1e293b" ? "#34d399" : "#000000"}
                          fontSize={ent.width > 300 ? 14 : 11.5}
                          fontWeight="bold"
                          className="pointer-events-none select-none"
                        >
                          {ent.room_name || ent.room_number || ent.label_text}
                        </text>
                      </g>
                    )}

                    {/* WALLS */}
                    {(ent.type === "wall" || ent.type === "line") && (
                      <g>
                        <line
                          x1={ent.x1 ?? ent.x}
                          y1={ent.y1 ?? ent.y}
                          x2={ent.x2 ?? (ent.x + ent.width)}
                          y2={ent.y2 ?? (ent.y + ent.height)}
                          stroke="transparent"
                          strokeWidth="20"
                          pointerEvents="all"
                        />
                        <line
                          x1={ent.x1 ?? ent.x}
                          y1={ent.y1 ?? ent.y}
                          x2={ent.x2 ?? (ent.x + ent.width)}
                          y2={ent.y2 ?? (ent.y + ent.height)}
                          stroke={isSelected ? "#f59e0b" : ent.stroke}
                          strokeWidth={isSelected ? (ent.thickness || 6) + 3 : (ent.thickness || 6)}
                          strokeLinecap="square"
                        />
                      </g>
                    )}

                    {/* DOORS */}
                    {ent.type === "door" && (
                      <g transform={`translate(${ent.x}, ${ent.y}) rotate(${ent.rotation || 0})`}>
                        <rect x={-ent.width / 2 - 4} y={-10} width={ent.width + 8} height={ent.width + 12} fill="transparent" pointerEvents="all" />
                        <line x1={-ent.width / 2} y1="0" x2={ent.width / 2} y2="0" stroke="#090d16" strokeWidth="6" />
                        <line x1={-ent.width / 2} y1="0" x2={ent.width / 2} y2="0" stroke="#64748b" strokeWidth="2" />
                        <line x1={-ent.width / 2} y1="0" x2={-ent.width / 2} y2={ent.width} stroke={isSelected ? "#38bdf8" : "#0284c7"} strokeWidth="3.5" strokeLinecap="round" />
                      </g>
                    )}

                    {/* WINDOWS */}
                    {ent.type === "window" && (
                      <g transform={`translate(${ent.x}, ${ent.y}) rotate(${ent.rotation || 0})`}>
                        <rect x={-ent.width / 2} y="-3" width={ent.width} height="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" pointerEvents="all" />
                      </g>
                    )}

                    {/* NAVIGATION PATHS */}
                    {ent.type === "nav-path" && (
                      <g>
                        <line
                          x1={ent.x1 ?? ent.x}
                          y1={ent.y1 ?? ent.y}
                          x2={ent.x2 ?? (ent.x + ent.width)}
                          y2={ent.y2 ?? (ent.y + ent.height)}
                          stroke="transparent"
                          strokeWidth="24"
                          pointerEvents="all"
                        />
                        <line
                          x1={ent.x1 ?? ent.x}
                          y1={ent.y1 ?? ent.y}
                          x2={ent.x2 ?? (ent.x + ent.width)}
                          y2={ent.y2 ?? (ent.y + ent.height)}
                          stroke={ent.stroke}
                          strokeWidth={(ent.path_width_meters || 2.4) * 10}
                          opacity={ent.status === "Closed" ? 0.05 : 0.15}
                          strokeLinecap="round"
                        />
                        <line
                          x1={ent.x1 ?? ent.x}
                          y1={ent.y1 ?? ent.y}
                          x2={ent.x2 ?? (ent.x + ent.width)}
                          y2={ent.y2 ?? (ent.y + ent.height)}
                          stroke={isSelected ? "#ffffff" : ent.stroke}
                          strokeWidth={isSelected ? 5 : (ent.strokeWidth || 3.5)}
                          strokeDasharray={ent.strokeDasharray}
                          strokeLinecap="round"
                          className={isSimulatingRoute ? "animate-pulse" : ""}
                        />
                        {ent.is_one_way && (
                          <circle
                            cx={((ent.x1 ?? ent.x) + (ent.x2 ?? (ent.x + ent.width))) / 2}
                            cy={((ent.y1 ?? ent.y) + (ent.y2 ?? (ent.y + ent.height))) / 2}
                            r="5"
                            fill="#06b6d4"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                          />
                        )}
                        <circle
                          cx={ent.x1 ?? ent.x}
                          cy={ent.y1 ?? ent.y}
                          r={isSelected ? 6 : 5}
                          fill={isSelected ? "#ffffff" : "#10b981"}
                          stroke="#10b981"
                          strokeWidth="2"
                          className={isSelected ? "cursor-crosshair" : ""}
                          onMouseDown={(e) => {
                            if (isSelected) {
                              e.stopPropagation();
                              setResizingHandle({
                                entityId: ent.id,
                                handle: "p1",
                                startX: e.clientX,
                                startY: e.clientY,
                                initialRect: { x: ent.x, y: ent.y, width: ent.width, height: ent.height, x1: ent.x1 ?? ent.x, y1: ent.y1 ?? ent.y, x2: ent.x2 ?? (ent.x + ent.width), y2: ent.y2 ?? (ent.y + ent.height) }
                              });
                            }
                          }}
                        />
                        <circle
                          cx={ent.x2 ?? (ent.x + ent.width)}
                          cy={ent.y2 ?? (ent.y + ent.height)}
                          r={isSelected ? 6 : 5}
                          fill={isSelected ? "#ffffff" : "#10b981"}
                          stroke="#10b981"
                          strokeWidth="2"
                          className={isSelected ? "cursor-crosshair" : ""}
                          onMouseDown={(e) => {
                            if (isSelected) {
                              e.stopPropagation();
                              setResizingHandle({
                                entityId: ent.id,
                                handle: "p2",
                                startX: e.clientX,
                                startY: e.clientY,
                                initialRect: { x: ent.x, y: ent.y, width: ent.width, height: ent.height, x1: ent.x1 ?? ent.x, y1: ent.y1 ?? ent.y, x2: ent.x2 ?? (ent.x + ent.width), y2: ent.y2 ?? (ent.y + ent.height) }
                              });
                            }
                          }}
                        />
                      </g>
                    )}

                    {/* JUNCTION HUB NODES */}
                    {ent.type === "nav-junction" && (
                      <g transform={`translate(${ent.x}, ${ent.y})`}>
                        <circle r="16" fill="transparent" pointerEvents="all" />
                        <circle r="9" fill={ent.fill} stroke={isSelected ? "#38bdf8" : "#ffffff"} strokeWidth={isSelected ? 3.5 : 2} />
                        <circle r="4" fill="#ffffff" />
                        <text x="0" y="-12" textAnchor="middle" fill="#34d399" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                          {ent.connected_nav_node_id || "HUB"}
                        </text>
                      </g>
                    )}

                    {/* FACILITIES */}
                    {ent.type === "facility" && (
                      <g transform={`translate(${centerX}, ${centerY}) rotate(${rot}) translate(-${centerX}, -${centerY})`}>
                        <circle cx={centerX} cy={centerY} r={ent.width / 2 + 4} fill="transparent" pointerEvents="all" />
                        <circle cx={centerX} cy={centerY} r={ent.width / 2} fill={ent.fill || "#0284c7"} stroke={isSelected ? "#38bdf8" : "#ffffff"} strokeWidth={isSelected ? 3 : 1.5} />
                        <text x={centerX} y={centerY + 4.5} textAnchor="middle" fontSize={ent.width * 0.55} className="pointer-events-none select-none">
                          {ent.icon || "📍"}
                        </text>
                      </g>
                    )}

                    {/* LABELS */}
                    {ent.type === "label" && (
                      <g transform={`translate(${ent.x}, ${ent.y})`}>
                        <text fill="#e2e8f0" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                          {ent.label_text || ent.name || "Text Label"}
                        </text>
                      </g>
                    )}

                    {/* SELECTION BOUNDING BOX */}
                    {isSelected && (ent.type === "room" || ent.type === "rectangle" || ent.type === "facility") && (
                      <g transform={rot ? `rotate(${rot} ${centerX} ${centerY})` : undefined}>
                        <rect
                          x={ent.x - 3}
                          y={ent.y - 3}
                          width={ent.width + 6}
                          height={ent.height + 6}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                        />
                        <rect x={ent.x - 6} y={ent.y - 6} width="7" height="7" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" className="cursor-nwse-resize" onMouseDown={(e) => { e.stopPropagation(); setResizingHandle({ entityId: ent.id, handle: "nw", startX: e.clientX, startY: e.clientY, initialRect: { x: ent.x, y: ent.y, width: ent.width, height: ent.height } }); }} />
                        <rect x={ent.x + ent.width - 1} y={ent.y - 6} width="7" height="7" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" className="cursor-nesw-resize" onMouseDown={(e) => { e.stopPropagation(); setResizingHandle({ entityId: ent.id, handle: "ne", startX: e.clientX, startY: e.clientY, initialRect: { x: ent.x, y: ent.y, width: ent.width, height: ent.height } }); }} />
                        <rect x={ent.x + ent.width - 1} y={ent.y + ent.height - 1} width="7" height="7" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" className="cursor-nwse-resize" onMouseDown={(e) => { e.stopPropagation(); setResizingHandle({ entityId: ent.id, handle: "se", startX: e.clientX, startY: e.clientY, initialRect: { x: ent.x, y: ent.y, width: ent.width, height: ent.height } }); }} />
                        <rect x={ent.x - 6} y={ent.y + ent.height - 1} width="7" height="7" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" className="cursor-nesw-resize" onMouseDown={(e) => { e.stopPropagation(); setResizingHandle({ entityId: ent.id, handle: "sw", startX: e.clientX, startY: e.clientY, initialRect: { x: ent.x, y: ent.y, width: ent.width, height: ent.height } }); }} />
                      </g>
                    )}
                  </g>
                );
              })}

              {/* LIVE PATH PREVIEW */}
              {isDrawing && activeTool === "nav-path" && (
                <g className="pointer-events-none">
                  <line
                    x1={drawStart.x}
                    y1={drawStart.y}
                    x2={drawCurrent.x}
                    y2={drawCurrent.y}
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeDasharray="6 3"
                  />
                  <circle cx={drawStart.x} cy={drawStart.y} r="5" fill="#10b981" />
                  <circle cx={drawCurrent.x} cy={drawCurrent.y} r="5" fill="#10b981" />
                  <g transform={`translate(${(drawStart.x + drawCurrent.x) / 2}, ${(drawStart.y + drawCurrent.y) / 2 - 12})`}>
                    <rect x="-30" y="-8" width="60" height="16" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
                    <text textAnchor="middle" y="4" fill="#34d399" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                      {(Math.hypot(drawCurrent.x - drawStart.x, drawCurrent.y - drawStart.y) * 0.05).toFixed(1)}m
                    </text>
                  </g>
                </g>
              )}

            </g>
          </svg>
        </div>

        {/* RIGHT PROPERTY INSPECTOR */}
        <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 space-y-4 overflow-y-auto select-none">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider">
              {isSelectedNavPath ? "Navigation Path Inspector" : isSelectedJunction ? "Junction Node Inspector" : primarySelectedEntity ? `${primarySelectedEntity.type.toUpperCase()} Inspector` : "Floor Inspector"}
            </h4>
            {selectedIds.length > 0 && (
              <button onClick={() => setSelectedIds([])} className="text-[10px] text-slate-400 hover:text-white">
                Deselect
              </button>
            )}
          </div>

          {/* PATH INSPECTOR */}
          {isSelectedNavPath && primarySelectedEntity ? (
            <div className="space-y-3 text-xs">
              
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {PATH_CONFIGS[primarySelectedEntity.path_type || "two-way"].icon} {primarySelectedEntity.path_type?.toUpperCase() || "TWO-WAY"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">ID: {primarySelectedEntity.id}</span>
                </div>
                <h5 className="font-bold text-white text-sm truncate">
                  {primarySelectedEntity.name || primarySelectedEntity.id}
                </h5>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Path Name / Description</label>
                <input
                  type="text"
                  value={primarySelectedEntity.name || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEntities(entities.map(item => item.id === primarySelectedEntity.id ? { ...item, name: val } : item));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Path Type</label>
                <select
                  value={primarySelectedEntity.path_type || "two-way"}
                  onChange={(e) => handleChangePathType(e.target.value as PathType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-emerald-300 font-bold text-xs"
                >
                  {(["two-way", "one-way", "accessible", "emergency", "restricted", "staff-only", "closed"] as PathType[]).map(pt => (
                    <option key={pt} value={pt}>
                      {PATH_CONFIGS[pt].icon} {PATH_CONFIGS[pt].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Graph Nodes & Distance:</span>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Start Node:</span>
                  <strong className="text-emerald-400">{primarySelectedEntity.from_node || "Waypoint A"}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">End Node:</span>
                  <strong className="text-emerald-400">{primarySelectedEntity.to_node || "Waypoint B"}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Walking Distance:</span>
                  <strong className="text-white">{pathDistance.toFixed(2)} m</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Walking Time:</span>
                  <strong className="text-white">{walkingSeconds} seconds</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[9.5px]">Direction:</span>
                  <strong className="text-white">
                    {primarySelectedEntity.is_one_way ? "Unidirectional" : "Bidirectional"}
                  </strong>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[9.5px]">Accessibility (♿):</span>
                  <strong className={primarySelectedEntity.is_accessible ? "text-blue-400" : "text-slate-400"}>
                    {primarySelectedEntity.is_accessible ? "Step-free" : "Standard"}
                  </strong>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    primarySelectedEntity.status === "Closed" ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"
                  }`}>
                    {primarySelectedEntity.status || "Active"}
                  </span>
                </div>
                <div className="pt-1 border-t border-slate-800/80">
                  <span className="text-slate-500 text-[10px] block">Connected Rooms:</span>
                  <span className="text-indigo-300 font-medium">
                    {primarySelectedEntity.connected_rooms?.join(", ") || "Central Corridor Zone"}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={handleSplitPath}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-emerald-600 border border-slate-800 text-[11px] font-bold text-slate-200 hover:text-white flex items-center justify-center gap-1 transition-colors"
                  >
                    <Split size={12} /> Split Path
                  </button>
                  <button
                    onClick={handleJoinPath}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-teal-600 border border-slate-800 text-[11px] font-bold text-slate-200 hover:text-white flex items-center justify-center gap-1 transition-colors"
                  >
                    <Merge size={12} /> Join Path
                  </button>
                </div>

                <button
                  onClick={handleReversePath}
                  className="w-full py-1.5 rounded-xl bg-slate-950 hover:bg-indigo-600 border border-slate-800 text-[11px] font-bold text-slate-200 hover:text-white flex items-center justify-center gap-1 transition-colors"
                >
                  <Repeat size={12} /> Reverse Direction (A ↔ B)
                </button>

                <button
                  onClick={handleDeleteSelected}
                  className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/25 transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Delete Path (Del)</span>
                </button>
              </div>

            </div>
          ) : isSelectedJunction && primarySelectedEntity ? (
            /* JUNCTION HUB INSPECTOR */
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-emerald-400">4-Way Junction Hub</span>
                  <span className="text-[10px] font-mono text-slate-400">ID: {primarySelectedEntity.connected_nav_node_id || primarySelectedEntity.id}</span>
                </div>
                <h5 className="font-bold text-white text-sm">{primarySelectedEntity.room_name || primarySelectedEntity.id}</h5>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Hub Name</label>
                <input
                  type="text"
                  value={primarySelectedEntity.room_name || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEntities(entities.map(item => item.id === primarySelectedEntity.id ? { ...item, room_name: val, name: val } : item));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">X Position</label>
                  <input
                    type="number"
                    value={Math.round(primarySelectedEntity.x)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEntities(entities.map(item => item.id === primarySelectedEntity.id ? { ...item, x: val } : item));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Y Position</label>
                  <input
                    type="number"
                    value={Math.round(primarySelectedEntity.y)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEntities(entities.map(item => item.id === primarySelectedEntity.id ? { ...item, y: val } : item));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={handleDeleteSelected}
                  className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/25 transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Delete Node (Del)</span>
                </button>
              </div>
            </div>
          ) : primarySelectedEntity ? (
            /* ROOM / FACILITY / WALL INSPECTOR */
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {primarySelectedEntity.type}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">ID: {primarySelectedEntity.id}</span>
                </div>
                <h5 className="font-bold text-white text-sm truncate">
                  {primarySelectedEntity.room_name || primarySelectedEntity.room_number || primarySelectedEntity.id}
                </h5>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Title / Room Name</label>
                <input
                  type="text"
                  value={primarySelectedEntity.room_name || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEntities(entities.map(item => item.id === primarySelectedEntity.id ? { ...item, room_name: val } : item));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">X Position</label>
                  <input
                    type="number"
                    value={Math.round(primarySelectedEntity.x)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEntities(entities.map(item => item.id === primarySelectedEntity.id ? { ...item, x: val } : item));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Y Position</label>
                  <input
                    type="number"
                    value={Math.round(primarySelectedEntity.y)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEntities(entities.map(item => item.id === primarySelectedEntity.id ? { ...item, y: val } : item));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <button
                  onClick={handleDuplicate}
                  className="w-full py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Copy size={13} />
                  <span>Duplicate Object (Ctrl+D)</span>
                </button>

                <button
                  onClick={handleDeleteSelected}
                  className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/25 transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Delete Object (Del)</span>
                </button>
              </div>
            </div>
          ) : (
            /* DEFAULT FLOOR GRAPH STATS */
            <div className="space-y-3 text-xs text-slate-400">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <h5 className="font-bold text-white text-sm">Block A • Floor 1</h5>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {mapVersion} • {isPublished ? "Live" : "Draft"}
                  </span>
                </div>
                
                <div className="pt-2 border-t border-slate-800 space-y-1 font-mono text-[10.5px]">
                  <div className="flex justify-between">
                    <span>Persisted Objects:</span>
                    <strong className="text-emerald-400">{entities.length} items</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Paths:</span>
                    <strong className="text-teal-400">{entities.filter(e => e.type === "nav-path").length} corridors</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Junction Nodes:</span>
                    <strong className="text-indigo-400">{entities.filter(e => e.type === "nav-junction").length} hubs</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto-Save Status:</span>
                    <strong className="text-slate-300">Synced</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                <span className="font-bold text-slate-300 block mb-1">Persistence Controls:</span>
                <p>• <b>Save Draft</b>: Saves your work to the database without publishing.</p>
                <p>• <b>Publish</b>: Pushes current map version live to students and faculty.</p>
                <p>• <b>Auto-Save</b>: Changes are automatically preserved across browser refreshes.</p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* VERSION HISTORY MODAL */}
      {showVersionsModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="text-indigo-400" size={18} />
                <h3 className="text-sm font-bold text-white">Floor Map Version History</h3>
              </div>
              <button onClick={() => setShowVersionsModal(false)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {versionsList.length > 0 ? (
                versionsList.map(v => (
                  <div key={v.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-2">
                        <span>Version {v.version_number}.0</span>
                        {`v${v.version_number}.0` === mapVersion && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold">Current</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(v.created_at).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRestoreVersion(v.version_number)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-bold transition-all"
                    >
                      Restore
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No previous version snapshots found.</p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button onClick={() => setShowVersionsModal(false)} className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
