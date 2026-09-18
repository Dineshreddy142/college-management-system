import { useState, useRef, useCallback, useEffect, useReducer } from "react";
import {
  MousePointer2, Square, Minus, Hexagon, Type, MapPin, Edit3, Trash2,
  RotateCcw, RotateCw, ZoomIn, ZoomOut, Maximize2, Grid, Layers,
  Save, Upload, Download, Settings, Eye, EyeOff, Lock, Unlock,
  ChevronRight, ChevronDown, Map, Palette, Building2, Car, Trees,
  Coffee, BookOpen, Dumbbell, Heart, Home, GraduationCap, X,
  Move, Sliders
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Tool =
  | "select" | "building" | "road" | "zone" | "label" | "marker"
  | "delete" | "pan";

type MarkerCategory =
  | "Entry" | "Canteen" | "Library" | "Parking" | "Sports"
  | "Medical" | "Hostel" | "Admin" | "Classroom" | "Lab" | "Other";

interface BaseElement {
  id: string;
  layer: "buildings" | "roads" | "zones" | "labels";
  locked: boolean;
  visible: boolean;
  name: string;
}

interface BuildingElement extends BaseElement {
  type: "building";
  x: number; y: number; w: number; h: number;
  color: string;
  floors: number;
  department: string;
  tag: string;
}

interface RoadElement extends BaseElement {
  type: "road";
  points: { x: number; y: number }[];
  color: string;
  width: number;
  dashed: boolean;
}

interface ZoneElement extends BaseElement {
  type: "zone";
  points: { x: number; y: number }[];
  color: string;
  opacity: number;
  zoneType: string;
}

interface LabelElement extends BaseElement {
  type: "label";
  x: number; y: number;
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
}

interface MarkerElement extends BaseElement {
  type: "marker";
  x: number; y: number;
  category: MarkerCategory;
  color: string;
  description: string;
}

type MapElement = BuildingElement | RoadElement | ZoneElement | LabelElement | MarkerElement;

interface MapState {
  title: string;
  campusName: string;
  bgColor: string;
  elements: MapElement[];
}

interface ViewState {
  x: number; y: number; scale: number;
}

type HistoryAction =
  | { type: "SET_ELEMENTS"; elements: MapElement[] }
  | { type: "ADD"; element: MapElement }
  | { type: "UPDATE"; id: string; patch: Partial<MapElement> }
  | { type: "DELETE"; id: string }
  | { type: "SET_MAP"; map: Partial<MapState> };

interface HistoryState {
  past: MapState[];
  present: MapState;
  future: MapState[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BUILDING_COLORS = [
  "#3B82F6","#6366F1","#8B5CF6","#EC4899","#EF4444",
  "#F59E0B","#10B981","#06B6D4","#84CC16","#F97316",
];

const ZONE_COLORS = [
  "#22C55E","#86EFAC","#FDE68A","#BFDBFE","#DDD6FE",
  "#FCA5A5","#A7F3D0","#BAE6FD","#E9D5FF","#FED7AA",
];

const MARKER_CATEGORIES: MarkerCategory[] = [
  "Entry","Canteen","Library","Parking","Sports",
  "Medical","Hostel","Admin","Classroom","Lab","Other",
];

const MARKER_ICONS: Record<MarkerCategory, typeof Map> = {
  Entry: MapPin, Canteen: Coffee, Library: BookOpen, Parking: Car,
  Sports: Dumbbell, Medical: Heart, Hostel: Home, Admin: Building2,
  Classroom: GraduationCap, Lab: Edit3, Other: MapPin,
};

const MARKER_COLORS: Record<MarkerCategory, string> = {
  Entry: "#22C55E", Canteen: "#F97316", Library: "#3B82F6", Parking: "#94A3B8",
  Sports: "#10B981", Medical: "#EF4444", Hostel: "#8B5CF6", Admin: "#6366F1",
  Classroom: "#06B6D4", Lab: "#F59E0B", Other: "#64748B",
};

const INITIAL_MAP: MapState = {
  title: "Campus Map",
  campusName: "My College Campus",
  bgColor: "#F1F5F9",
  elements: [
    // Sample pre-placed buildings
    {
      id: "sample-b1", type: "building", layer: "buildings", locked: false, visible: true,
      name: "Main Block", x: 300, y: 200, w: 180, h: 120,
      color: "#3B82F6", floors: 4, department: "Administration", tag: "A"
    },
    {
      id: "sample-b2", type: "building", layer: "buildings", locked: false, visible: true,
      name: "CS Department", x: 550, y: 200, w: 140, h: 100,
      color: "#6366F1", floors: 3, department: "Computer Science", tag: "CS"
    },
    {
      id: "sample-b3", type: "building", layer: "buildings", locked: false, visible: true,
      name: "Library", x: 300, y: 380, w: 160, h: 110,
      color: "#10B981", floors: 2, department: "Library", tag: "LIB"
    },
    {
      id: "sample-z1", type: "zone", layer: "zones", locked: false, visible: true,
      name: "Sports Ground", points: [
        {x:600,y:380},{x:780,y:380},{x:780,y:520},{x:600,y:520}
      ], color: "#22C55E", opacity: 0.25, zoneType: "Sports"
    },
    {
      id: "sample-r1", type: "road", layer: "roads", locked: false, visible: true,
      name: "Main Road", points: [{x:200,y:150},{x:800,y:150}],
      color: "#94A3B8", width: 12, dashed: false
    },
    {
      id: "sample-r2", type: "road", layer: "roads", locked: false, visible: true,
      name: "Internal Path", points: [{x:480,y:150},{x:480,y:600}],
      color: "#CBD5E1", width: 8, dashed: true
    },
    {
      id: "sample-m1", type: "marker", layer: "labels", locked: false, visible: true,
      name: "Main Gate", x: 200, y: 150, category: "Entry", color: "#22C55E", description: "Main entrance"
    },
    {
      id: "sample-m2", type: "marker", layer: "labels", locked: false, visible: true,
      name: "Canteen", x: 540, y: 380, category: "Canteen", color: "#F97316", description: "College canteen"
    },
  ],
};

const LAYER_CONFIG = [
  { id: "buildings", label: "Buildings", icon: Building2, color: "#3B82F6" },
  { id: "roads", label: "Roads & Paths", icon: Minus, color: "#94A3B8" },
  { id: "zones", label: "Zones", icon: Hexagon, color: "#22C55E" },
  { id: "labels", label: "Labels & Markers", icon: MapPin, color: "#F97316" },
];

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY REDUCER
// ─────────────────────────────────────────────────────────────────────────────

function applyAction(state: MapState, action: HistoryAction): MapState {
  switch (action.type) {
    case "SET_ELEMENTS": return { ...state, elements: action.elements };
    case "ADD": return { ...state, elements: [...state.elements, action.element] };
    case "UPDATE": return {
      ...state,
      elements: state.elements.map(e =>
        e.id === action.id ? { ...e, ...action.patch } as MapElement : e
      ),
    };
    case "DELETE": return { ...state, elements: state.elements.filter(e => e.id !== action.id) };
    case "SET_MAP": return { ...state, ...action.map };
    default: return state;
  }
}

function historyReducer(
  state: HistoryState,
  action: { type: "DO"; action: HistoryAction } | { type: "UNDO" } | { type: "REDO" } | { type: "RESET"; map: MapState }
): HistoryState {
  if (action.type === "UNDO") {
    if (state.past.length === 0) return state;
    const [prev, ...rest] = [...state.past].reverse();
    return { past: rest.reverse(), present: prev, future: [state.present, ...state.future] };
  }
  if (action.type === "REDO") {
    if (state.future.length === 0) return state;
    const [next, ...rest] = state.future;
    return { past: [...state.past, state.present], present: next, future: rest };
  }
  if (action.type === "RESET") {
    return { past: [], present: action.map, future: [] };
  }
  const next = applyAction(state.present, action.action);
  return { past: [...state.past.slice(-49), state.present], present: next, future: [] };
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────

function uid() { return `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function svgPointsStr(pts: { x: number; y: number }[]) {
  return pts.map(p => `${p.x},${p.y}`).join(" ");
}

function polylinePath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  return `M ${pts.map(p => `${p.x} ${p.y}`).join(" L ")}`;
}

function polygonCentroid(pts: { x: number; y: number }[]) {
  const n = pts.length;
  return { x: pts.reduce((a, p) => a + p.x, 0) / n, y: pts.reduce((a, p) => a + p.y, 0) / n };
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI MAP
// ─────────────────────────────────────────────────────────────────────────────

function MiniMap({ elements, view, bgColor, containerW, containerH }: {
  elements: MapElement[]; view: ViewState; bgColor: string; containerW: number; containerH: number;
}) {
  const W = 160; const H = 100;
  const scaleX = W / 1000; const scaleY = H / 700;
  return (
    <div className="absolute bottom-4 right-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg" style={{ width: W, height: H }}>
      <svg width={W} height={H} style={{ background: bgColor }}>
        {elements.filter(e => e.visible).map(e => {
          if (e.type === "building") return (
            <rect key={e.id} x={e.x * scaleX} y={e.y * scaleY} width={e.w * scaleX} height={e.h * scaleY}
              fill={e.color} fillOpacity={0.8} rx={1} />
          );
          if (e.type === "zone") return (
            <polygon key={e.id} points={svgPointsStr(e.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY })))}
              fill={e.color} fillOpacity={e.opacity} />
          );
          if (e.type === "road") return (
            <polyline key={e.id} points={svgPointsStr(e.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY })))}
              stroke={e.color} strokeWidth={1} fill="none" />
          );
          if (e.type === "marker") return (
            <circle key={e.id} cx={e.x * scaleX} cy={e.y * scaleY} r={3} fill={e.color} />
          );
          return null;
        })}
        {/* Viewport rect */}
        <rect
          x={(-view.x / view.scale) * scaleX}
          y={(-view.y / view.scale) * scaleY}
          width={(containerW / view.scale) * scaleX}
          height={(containerH / view.scale) * scaleY}
          fill="none" stroke="#3B82F6" strokeWidth={1.5} strokeOpacity={0.8}
        />
      </svg>
      <p className="absolute bottom-0.5 left-1 text-[9px] text-slate-500 font-medium">Map Overview</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTIES PANEL
// ─────────────────────────────────────────────────────────────────────────────

function PropertiesPanel({ element, onUpdate, onDelete }: {
  element: MapElement | null;
  onUpdate: (id: string, patch: Partial<MapElement>) => void;
  onDelete: (id: string) => void;
}) {
  if (!element) return (
    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
      <MousePointer2 size={28} className="mb-2 opacity-40" />
      <p className="text-xs text-center">Select an element<br />to edit its properties</p>
    </div>
  );

  const field = (label: string, children: React.ReactNode) => (
    <div key={label} className="mb-3">
      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );

  const inp = (val: string | number, onChange: (v: string) => void, type = "text") => (
    <input type={type} value={val}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
  );

  return (
    <div className="p-3 text-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          {element.type}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onUpdate(element.id, { locked: !element.locked })}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            title={element.locked ? "Unlock" : "Lock"}
          >
            {element.locked ? <Lock size={13} /> : <Unlock size={13} />}
          </button>
          <button
            onClick={() => onUpdate(element.id, { visible: !element.visible })}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            title={element.visible ? "Hide" : "Show"}
          >
            {element.visible ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
          <button
            onClick={() => onDelete(element.id)}
            className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {field("Name", inp(element.name, v => onUpdate(element.id, { name: v })))}

      {element.type === "building" && <>
        {field("Color", (
          <div className="flex items-center gap-2">
            <input type="color" value={element.color}
              onChange={e => onUpdate(element.id, { color: e.target.value })}
              className="w-8 h-7 rounded cursor-pointer border border-slate-200" />
            <div className="flex gap-1 flex-wrap">
              {BUILDING_COLORS.map(c => (
                <button key={c} onClick={() => onUpdate(element.id, { color: c })}
                  className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ background: c, borderColor: element.color === c ? "#fff" : "transparent" }} />
              ))}
            </div>
          </div>
        ))}
        {field("Floors", inp(element.floors, v => onUpdate(element.id, { floors: parseInt(v) || 1 }), "number"))}
        {field("Department", inp(element.department, v => onUpdate(element.id, { department: v })))}
        {field("Tag / Short Label", inp(element.tag, v => onUpdate(element.id, { tag: v })))}
        <div className="grid grid-cols-2 gap-2 mt-1">
          {field("Width", inp(element.w, v => onUpdate(element.id, { w: Math.max(20, parseInt(v) || 20) }), "number"))}
          {field("Height", inp(element.h, v => onUpdate(element.id, { h: Math.max(20, parseInt(v) || 20) }), "number"))}
        </div>
      </>}

      {element.type === "road" && <>
        {field("Color", (
          <div className="flex items-center gap-2">
            <input type="color" value={element.color}
              onChange={e => onUpdate(element.id, { color: e.target.value })}
              className="w-8 h-7 rounded cursor-pointer border border-slate-200" />
          </div>
        ))}
        {field("Width", inp(element.width, v => onUpdate(element.id, { width: parseInt(v) || 4 }), "number"))}
        {field("Style", (
          <div className="flex gap-2">
            {[{ v: false, l: "Solid" }, { v: true, l: "Dashed" }].map(opt => (
              <button key={String(opt.v)} onClick={() => onUpdate(element.id, { dashed: opt.v })}
                className={`flex-1 py-1 text-xs rounded-lg border transition-all ${element.dashed === opt.v ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"}`}>
                {opt.l}
              </button>
            ))}
          </div>
        ))}
      </>}

      {element.type === "zone" && <>
        {field("Zone Type", inp(element.zoneType, v => onUpdate(element.id, { zoneType: v })))}
        {field("Color", (
          <div className="flex items-center gap-2">
            <input type="color" value={element.color}
              onChange={e => onUpdate(element.id, { color: e.target.value })}
              className="w-8 h-7 rounded cursor-pointer border border-slate-200" />
            <div className="flex gap-1 flex-wrap">
              {ZONE_COLORS.map(c => (
                <button key={c} onClick={() => onUpdate(element.id, { color: c })}
                  className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ background: c, borderColor: element.color === c ? "#334155" : "transparent" }} />
              ))}
            </div>
          </div>
        ))}
        {field("Opacity", (
          <div className="flex items-center gap-2">
            <input type="range" min={0.05} max={0.95} step={0.05} value={element.opacity}
              onChange={e => onUpdate(element.id, { opacity: parseFloat(e.target.value) })}
              className="flex-1 accent-blue-600" />
            <span className="text-xs text-slate-500 w-8">{Math.round(element.opacity * 100)}%</span>
          </div>
        ))}
      </>}

      {element.type === "label" && <>
        {field("Text", inp(element.text, v => onUpdate(element.id, { text: v })))}
        {field("Font Size", inp(element.fontSize, v => onUpdate(element.id, { fontSize: parseInt(v) || 12 }), "number"))}
        {field("Color", (
          <input type="color" value={element.color}
            onChange={e => onUpdate(element.id, { color: e.target.value })}
            className="w-8 h-7 rounded cursor-pointer border border-slate-200" />
        ))}
        {field("Bold", (
          <button onClick={() => onUpdate(element.id, { bold: !element.bold })}
            className={`px-3 py-1 text-xs rounded-lg border transition-all ${element.bold ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"}`}>
            Bold
          </button>
        ))}
      </>}

      {element.type === "marker" && <>
        {field("Category", (
          <select value={element.category}
            onChange={e => {
              const cat = e.target.value as MarkerCategory;
              onUpdate(element.id, { category: cat, color: MARKER_COLORS[cat] });
            }}
            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {MARKER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        ))}
        {field("Description", (
          <textarea value={element.description}
            onChange={e => onUpdate(element.id, { description: e.target.value })}
            rows={2}
            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        ))}
        {field("Color", (
          <input type="color" value={element.color}
            onChange={e => onUpdate(element.id, { color: e.target.value })}
            className="w-8 h-7 rounded cursor-pointer border border-slate-200" />
        ))}
      </>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYERS PANEL
// ─────────────────────────────────────────────────────────────────────────────

function LayersPanel({ elements, onToggleLayer, layerVisibility }: {
  elements: MapElement[];
  onToggleLayer: (layer: string) => void;
  layerVisibility: Record<string, boolean>;
}) {
  return (
    <div className="p-3">
      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Layers</p>
      {LAYER_CONFIG.map(layer => {
        const count = elements.filter(e => e.layer === layer.id).length;
        const visible = layerVisibility[layer.id] ?? true;
        return (
          <div key={layer.id}
            className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: layer.color }} />
              <span className={`text-xs font-medium ${visible ? "text-slate-700 dark:text-slate-300" : "text-slate-400"}`}>
                {layer.label}
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 rounded px-1">{count}</span>
            </div>
            <button onClick={() => onToggleLayer(layer.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all">
              {visible ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function CampusMapEditor() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [history, dispatch] = useReducer(historyReducer, {
    past: [], present: INITIAL_MAP, future: [],
  });
  const map = history.present;

  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [rightPanel, setRightPanel] = useState<"properties" | "layers" | "settings">("properties");
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    buildings: true, roads: true, zones: true, labels: true,
  });

  // Drawing state
  const [drawing, setDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<{ x: number; y: number }[]>([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [isResizing, setIsResizing] = useState<string | null>(null); // handle name

  // Building placement drag
  const [buildingDraft, setBuildingDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [buildingDraftStart, setBuildingDraftStart] = useState<{ x: number; y: number } | null>(null);

  // Cursor position display
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // UI
  const [showMapSettings, setShowMapSettings] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });

  const selectedElement = map.elements.find(e => e.id === selectedId) ?? null;

  // ── Load from localStorage ─────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("campus-map-data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as MapState;
        dispatch({ type: "RESET", map: parsed });
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        setContainerSize({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Helper: canvas coords ──────────────────────────────────────────────────
  const toCanvas = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const sx = (clientX - rect.left - view.x) / view.scale;
    const sy = (clientY - rect.top - view.y) / view.scale;
    if (snapToGrid) {
      const G = 20;
      return { x: Math.round(sx / G) * G, y: Math.round(sy / G) * G };
    }
    return { x: sx, y: sy };
  }, [view, snapToGrid]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const doAction = useCallback((action: HistoryAction) => {
    dispatch({ type: "DO", action });
  }, []);

  const updateElement = useCallback((id: string, patch: Partial<MapElement>) => {
    doAction({ type: "UPDATE", id, patch });
  }, [doAction]);

  const deleteElement = useCallback((id: string) => {
    doAction({ type: "DELETE", id });
    setSelectedId(null);
  }, [doAction]);

  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);

  const save = useCallback(() => {
    localStorage.setItem("campus-map-data", JSON.stringify(map));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  }, [map]);

  const clearMap = useCallback(() => {
    if (window.confirm("Clear all elements? This cannot be undone.")) {
      doAction({ type: "SET_ELEMENTS", elements: [] });
      setSelectedId(null);
    }
  }, [doAction]);

  // ── Toggle layer visibility ────────────────────────────────────────────────
  const toggleLayer = useCallback((layer: string) => {
    setLayerVisibility(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const zoom = useCallback((delta: number, cx?: number, cy?: number) => {
    setView(v => {
      const factor = delta > 0 ? 1.12 : 0.89;
      const newScale = Math.min(Math.max(v.scale * factor, 0.15), 6);
      const ox = cx ?? containerSize.w / 2;
      const oy = cy ?? containerSize.h / 2;
      const wx = (ox - v.x) / v.scale;
      const wy = (oy - v.y) / v.scale;
      return { scale: newScale, x: ox - wx * newScale, y: oy - wy * newScale };
    });
  }, [containerSize]);

  const fitToScreen = useCallback(() => {
    setView({ x: 40, y: 40, scale: Math.min((containerSize.w - 80) / 1000, (containerSize.h - 80) / 700) });
  }, [containerSize]);

  // Wheel handler
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoom(-e.deltaY, e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [zoom]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) { e.preventDefault(); redo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); }
      if (e.key === "Delete" || e.key === "Backspace") { if (selectedId) deleteElement(selectedId); }
      if (e.key === "Escape") { setSelectedId(null); setDrawing(false); setDrawPoints([]); setBuildingDraft(null); }
      if (e.key === "v") setTool("select");
      if (e.key === "b") setTool("building");
      if (e.key === "r") setTool("road");
      if (e.key === "z") setTool("zone");
      if (e.key === "l") setTool("label");
      if (e.key === "m") setTool("marker");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, save, selectedId, deleteElement]);

  // ── SVG Pointer Handlers ───────────────────────────────────────────────────
  const handleSvgMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pt = toCanvas(e.clientX, e.clientY);

    if (e.button === 1 || (e.button === 0 && tool === "pan") || (e.altKey && e.button === 0)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - view.x, y: e.clientY - view.y });
      return;
    }

    if (tool === "building") {
      setBuildingDraftStart(pt);
      setBuildingDraft({ x: pt.x, y: pt.y, w: 0, h: 0 });
      return;
    }

    if (tool === "road" || tool === "zone") {
      if (!drawing) {
        setDrawing(true);
        setDrawPoints([pt]);
      } else {
        setDrawPoints(p => [...p, pt]);
      }
      return;
    }

    if (tool === "label") {
      const el: LabelElement = {
        id: uid(), type: "label", layer: "labels", locked: false, visible: true,
        name: "New Label", x: pt.x, y: pt.y, text: "Label", fontSize: 14, color: "#1E293B", bold: false,
      };
      doAction({ type: "ADD", element: el });
      setSelectedId(el.id);
      setTool("select");
      return;
    }

    if (tool === "marker") {
      const el: MarkerElement = {
        id: uid(), type: "marker", layer: "labels", locked: false, visible: true,
        name: "New Marker", x: pt.x, y: pt.y, category: "Other", color: MARKER_COLORS.Other, description: "",
      };
      doAction({ type: "ADD", element: el });
      setSelectedId(el.id);
      setTool("select");
      return;
    }

    // Select on background click
    if (tool === "select") {
      setSelectedId(null);
    }
  }, [tool, drawing, view, toCanvas, doAction]);

  const handleSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pt = toCanvas(e.clientX, e.clientY);
    setCursorPos(pt);

    if (isPanning && panStart) {
      setView(v => ({ ...v, x: e.clientX - panStart.x, y: e.clientY - panStart.y }));
      return;
    }

    if (buildingDraftStart) {
      const x = Math.min(buildingDraftStart.x, pt.x);
      const y = Math.min(buildingDraftStart.y, pt.y);
      const w = Math.abs(pt.x - buildingDraftStart.x);
      const h = Math.abs(pt.y - buildingDraftStart.y);
      setBuildingDraft({ x, y, w, h });
    }

    if (dragStart && selectedId) {
      const el = map.elements.find(e => e.id === selectedId);
      if (!el || el.locked) return;
      if (el.type === "building" || el.type === "label" || el.type === "marker") {
        updateElement(selectedId, { x: pt.x - dragOffset.x, y: pt.y - dragOffset.y } as any);
      }
      if (el.type === "road" || el.type === "zone") {
        const dx = pt.x - dragStart.x;
        const dy = pt.y - dragStart.y;
        updateElement(selectedId, { points: el.points.map(p => ({ x: p.x + dx, y: p.y + dy })) } as any);
        setDragStart(pt);
      }
    }
  }, [isPanning, panStart, buildingDraftStart, dragStart, dragOffset, selectedId, map.elements, toCanvas, updateElement]);

  const handleSvgMouseUp = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) { setIsPanning(false); setPanStart(null); return; }

    if (buildingDraftStart && buildingDraft && (buildingDraft.w > 10 || buildingDraft.h > 10)) {
      const el: BuildingElement = {
        id: uid(), type: "building", layer: "buildings", locked: false, visible: true,
        name: "New Building", x: buildingDraft.x, y: buildingDraft.y,
        w: Math.max(40, buildingDraft.w), h: Math.max(30, buildingDraft.h),
        color: BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)],
        floors: 1, department: "", tag: "B",
      };
      doAction({ type: "ADD", element: el });
      setSelectedId(el.id);
      setTool("select");
    }
    setBuildingDraftStart(null);
    setBuildingDraft(null);
    setDragStart(null);
  }, [isPanning, buildingDraftStart, buildingDraft, doAction]);

  // Double-click to finish road/zone
  const handleSvgDblClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!drawing || drawPoints.length < 2) { setDrawing(false); setDrawPoints([]); return; }
    if (tool === "road") {
      const el: RoadElement = {
        id: uid(), type: "road", layer: "roads", locked: false, visible: true,
        name: "New Road", points: drawPoints, color: "#94A3B8", width: 10, dashed: false,
      };
      doAction({ type: "ADD", element: el });
      setSelectedId(el.id);
    } else if (tool === "zone") {
      const el: ZoneElement = {
        id: uid(), type: "zone", layer: "zones", locked: false, visible: true,
        name: "New Zone", points: drawPoints, color: "#22C55E", opacity: 0.3, zoneType: "General",
      };
      doAction({ type: "ADD", element: el });
      setSelectedId(el.id);
    }
    setDrawing(false);
    setDrawPoints([]);
    setTool("select");
  }, [drawing, drawPoints, tool, doAction]);

  // ── Element interaction handlers ───────────────────────────────────────────
  const handleElementClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tool === "delete") { deleteElement(id); return; }
    if (tool === "select") { setSelectedId(id); }
  }, [tool, deleteElement]);

  const handleElementMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tool !== "select") return;
    const el = map.elements.find(el => el.id === id);
    if (!el || el.locked) return;
    const pt = toCanvas(e.clientX, e.clientY);
    setDragStart(pt);
    if (el.type === "building" || el.type === "label" || el.type === "marker") {
      setDragOffset({ x: pt.x - (el as any).x, y: pt.y - (el as any).y });
    }
  }, [tool, map.elements, toCanvas]);

  // ── Export ────────────────────────────────────────────────────────────────
  const exportSVG = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${map.title.replace(/\s+/g, "_")}.svg`; a.click();
  }, [map.title]);

  const exportPNG = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = containerSize.w * 2; canvas.height = containerSize.h * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(2, 2); ctx.drawImage(img, 0, 0);
      const a = document.createElement("a"); a.href = canvas.toDataURL("image/png");
      a.download = `${map.title.replace(/\s+/g, "_")}.png`; a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
  }, [containerSize, map.title]);

  // ── Toolbar definition ────────────────────────────────────────────────────
  const tools: { id: Tool; icon: typeof Map; label: string; shortcut: string }[] = [
    { id: "select", icon: MousePointer2, label: "Select & Move", shortcut: "V" },
    { id: "pan", icon: Move, label: "Pan Canvas", shortcut: "Space" },
    { id: "building", icon: Square, label: "Add Building", shortcut: "B" },
    { id: "road", icon: Minus, label: "Draw Road", shortcut: "R" },
    { id: "zone", icon: Hexagon, label: "Draw Zone", shortcut: "Z" },
    { id: "label", icon: Type, label: "Add Label", shortcut: "L" },
    { id: "marker", icon: MapPin, label: "Add Marker", shortcut: "M" },
    { id: "delete", icon: Trash2, label: "Delete", shortcut: "Del" },
  ];

  // ── Cursor style ──────────────────────────────────────────────────────────
  const cursorStyle =
    isPanning ? "cursor-grabbing" :
    tool === "pan" ? "cursor-grab" :
    tool === "delete" ? "cursor-crosshair" :
    (tool === "road" || tool === "zone" || tool === "building") ? "cursor-crosshair" :
    "cursor-default";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 -m-5 overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 z-10 overflow-x-auto scrollbar-thin">
        {/* Title */}
        <div className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Map size={14} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{map.title}</p>
            <p className="text-[10px] text-slate-400">{map.campusName}</p>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Undo / Redo */}
        <button onClick={undo} disabled={history.past.length === 0}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-colors" title="Undo (Ctrl+Z)">
          <RotateCcw size={15} />
        </button>
        <button onClick={redo} disabled={history.future.length === 0}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-colors" title="Redo (Ctrl+Y)">
          <RotateCw size={15} />
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Grid */}
        <button onClick={() => setShowGrid(g => !g)}
          className={`p-1.5 rounded-lg transition-colors ${showGrid ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"}`} title="Toggle Grid">
          <Grid size={15} />
        </button>
        <button onClick={() => setSnapToGrid(s => !s)}
          className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${snapToGrid ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"}`} title="Snap to Grid">
          Snap
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Zoom */}
        <button onClick={() => zoom(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"><ZoomOut size={15} /></button>
        <span className="text-xs font-mono text-slate-500 w-12 text-center">{Math.round(view.scale * 100)}%</span>
        <button onClick={() => zoom(1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"><ZoomIn size={15} /></button>
        <button onClick={fitToScreen} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" title="Fit to Screen"><Maximize2 size={15} /></button>

        <div className="flex-1" />

        {/* Coords */}
        <span className="text-[11px] font-mono text-slate-400 hidden sm:block">x:{Math.round(cursorPos.x)} y:{Math.round(cursorPos.y)}</span>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Map Settings */}
        <button onClick={() => setShowMapSettings(true)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" title="Map Settings">
          <Sliders size={15} />
        </button>

        {/* Export */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <Download size={13} /> Export
          </button>
          <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50 overflow-hidden">
            <button onClick={exportPNG} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <Download size={12} /> Export PNG
            </button>
            <button onClick={exportSVG} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <Download size={12} /> Export SVG
            </button>
          </div>
        </div>

        {/* Save */}
        <button onClick={save}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isSaved ? "bg-emerald-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
          <Save size={13} /> {isSaved ? "Saved!" : "Save"}
        </button>
      </div>

      {/* ── MAIN AREA ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT TOOLBAR ─────────────────────────────────────────────── */}
        <div className="w-14 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-3 gap-1 flex-shrink-0">
          {tools.map(t => {
            const Icon = t.icon;
            const active = tool === t.id;
            return (
              <button key={t.id} onClick={() => setTool(t.id)}
                title={`${t.label} (${t.shortcut})`}
                className={`relative group w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                <Icon size={17} />
                {/* Tooltip */}
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {t.label} <span className="text-slate-400">[{t.shortcut}]</span>
                </span>
              </button>
            );
          })}

          <div className="flex-1" />

          {/* Clear */}
          <button onClick={clearMap} title="Clear All"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>

        {/* ── CANVAS AREA ──────────────────────────────────────────────── */}
        <div ref={containerRef} className={`flex-1 relative overflow-hidden ${cursorStyle}`}>

          {/* Drawing hint */}
          {(tool === "road" || tool === "zone") && !drawing && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
              Click to start drawing · Double-click to finish
            </div>
          )}
          {drawing && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-blue-600/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
              {drawPoints.length} point{drawPoints.length !== 1 ? "s" : ""} · Double-click to finish · Esc to cancel
            </div>
          )}
          {tool === "building" && !buildingDraftStart && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
              Click & drag to place a building
            </div>
          )}

          <svg
            ref={svgRef}
            width="100%" height="100%"
            onMouseDown={handleSvgMouseDown}
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onDoubleClick={handleSvgDblClick}
            style={{ userSelect: "none", touchAction: "none" }}
          >
            <defs>
              <pattern id="grid-small" width="20" height="20" patternUnits="userSpaceOnUse"
                patternTransform={`translate(${view.x % (20 * view.scale)},${view.y % (20 * view.scale)}) scale(${view.scale})`}>
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth={0.5} />
              </pattern>
              <pattern id="grid-large" width="100" height="100" patternUnits="userSpaceOnUse"
                patternTransform={`translate(${view.x % (100 * view.scale)},${view.y % (100 * view.scale)}) scale(${view.scale})`}>
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth={1} />
              </pattern>
              <filter id="shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
              </filter>
              <filter id="shadow-sm">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.12" />
              </filter>
            </defs>

            {/* Background */}
            <rect width="100%" height="100%" fill={map.bgColor} />

            {/* Grid */}
            {showGrid && <>
              <rect width="100%" height="100%" fill="url(#grid-small)" />
              <rect width="100%" height="100%" fill="url(#grid-large)" />
            </>}

            {/* All elements in transform group */}
            <g transform={`translate(${view.x},${view.y}) scale(${view.scale})`}>

              {/* ZONES (render first — bottom) */}
              {layerVisibility.zones && map.elements
                .filter(e => e.type === "zone" && e.visible)
                .map(e => {
                  const z = e as ZoneElement;
                  const sel = selectedId === z.id;
                  const c = polygonCentroid(z.points);
                  return (
                    <g key={z.id} onClick={ev => handleElementClick(ev, z.id)} onMouseDown={ev => handleElementMouseDown(ev, z.id)}>
                      <polygon points={svgPointsStr(z.points)} fill={z.color} fillOpacity={z.opacity}
                        stroke={sel ? "#3B82F6" : z.color} strokeWidth={sel ? 2 : 1}
                        strokeOpacity={0.8} strokeDasharray={sel ? "6 3" : "none"}
                        style={{ cursor: "pointer" }} filter="url(#shadow-sm)" />
                      {z.visible && (
                        <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="middle"
                          fontSize={11} fontWeight="600" fill={z.color} fillOpacity={0.9}
                          style={{ pointerEvents: "none" }}>
                          {z.name}
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* ROADS */}
              {layerVisibility.roads && map.elements
                .filter(e => e.type === "road" && e.visible)
                .map(e => {
                  const r = e as RoadElement;
                  const sel = selectedId === r.id;
                  return (
                    <g key={r.id} onClick={ev => handleElementClick(ev, r.id)} onMouseDown={ev => handleElementMouseDown(ev, r.id)}>
                      {/* Hit area */}
                      <polyline points={svgPointsStr(r.points)} stroke="transparent" strokeWidth={r.width + 12} fill="none" style={{ cursor: "pointer" }} />
                      {/* Road casing */}
                      <polyline points={svgPointsStr(r.points)} stroke="rgba(0,0,0,0.1)" strokeWidth={r.width + 2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      {/* Road fill */}
                      <polyline points={svgPointsStr(r.points)} stroke={r.color} strokeWidth={r.width}
                        fill="none" strokeLinecap="round" strokeLinejoin="round"
                        strokeDasharray={r.dashed ? `${r.width * 1.5} ${r.width}` : "none"}
                        stroke-opacity={sel ? 1 : 0.85} />
                      {sel && <polyline points={svgPointsStr(r.points)} stroke="#3B82F6" strokeWidth={r.width + 4} fill="none" strokeOpacity={0.3} strokeLinecap="round" />}
                      {/* Road name */}
                      {r.points.length >= 2 && (
                        <text style={{ pointerEvents: "none" }} fontSize={9} fill="#64748B" fontWeight="500">
                          <textPath href={`#road-path-${r.id}`} startOffset="50%" textAnchor="middle">{r.name}</textPath>
                        </text>
                      )}
                      <defs>
                        <path id={`road-path-${r.id}`} d={polylinePath(r.points)} />
                      </defs>
                    </g>
                  );
                })}

              {/* BUILDINGS */}
              {layerVisibility.buildings && map.elements
                .filter(e => e.type === "building" && e.visible)
                .map(e => {
                  const b = e as BuildingElement;
                  const sel = selectedId === b.id;
                  return (
                    <g key={b.id} onClick={ev => handleElementClick(ev, b.id)} onMouseDown={ev => handleElementMouseDown(ev, b.id)} style={{ cursor: "pointer" }}>
                      {/* Shadow */}
                      <rect x={b.x + 3} y={b.y + 3} width={b.w} height={b.h} rx={5} fill="rgba(0,0,0,0.15)" />
                      {/* Body */}
                      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={5}
                        fill={b.color} fillOpacity={0.92}
                        stroke={sel ? "#fff" : "rgba(255,255,255,0.3)"} strokeWidth={sel ? 2.5 : 1} />
                      {/* Accent bar at top */}
                      <rect x={b.x} y={b.y} width={b.w} height={6} rx={5} fill="rgba(255,255,255,0.25)" />
                      {/* Selection glow */}
                      {sel && <rect x={b.x - 3} y={b.y - 3} width={b.w + 6} height={b.h + 6} rx={8}
                        fill="none" stroke="#3B82F6" strokeWidth={2.5} strokeDasharray="6 3" opacity={0.8} />}
                      {/* Tag badge */}
                      <rect x={b.x + 6} y={b.y + 6} width={Math.max(20, b.tag.length * 8 + 8)} height={18} rx={4}
                        fill="rgba(0,0,0,0.25)" />
                      <text x={b.x + 10} y={b.y + 18} fontSize={10} fontWeight="700" fill="white" style={{ pointerEvents: "none" }}>{b.tag}</text>
                      {/* Name */}
                      <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 6} textAnchor="middle" dominantBaseline="middle"
                        fontSize={Math.min(13, b.w / (b.name.length * 0.6))} fontWeight="600" fill="white"
                        style={{ pointerEvents: "none" }}>{b.name}</text>
                      {/* Floor badge */}
                      {b.h > 60 && (
                        <text x={b.x + b.w - 8} y={b.y + b.h - 8} textAnchor="end"
                          fontSize={9} fill="rgba(255,255,255,0.7)" fontWeight="500"
                          style={{ pointerEvents: "none" }}>{b.floors}F</text>
                      )}
                      {/* Resize handles when selected */}
                      {sel && [
                        { cx: b.x, cy: b.y, name: "tl" }, { cx: b.x + b.w, cy: b.y, name: "tr" },
                        { cx: b.x, cy: b.y + b.h, name: "bl" }, { cx: b.x + b.w, cy: b.y + b.h, name: "br" },
                      ].map(h => (
                        <rect key={h.name} x={h.cx - 5} y={h.cy - 5} width={10} height={10} rx={2}
                          fill="white" stroke="#3B82F6" strokeWidth={1.5} style={{ cursor: "nwse-resize" }} />
                      ))}
                    </g>
                  );
                })}

              {/* LABELS */}
              {layerVisibility.labels && map.elements
                .filter(e => e.type === "label" && e.visible)
                .map(e => {
                  const l = e as LabelElement;
                  const sel = selectedId === l.id;
                  return (
                    <g key={l.id} onClick={ev => handleElementClick(ev, l.id)} onMouseDown={ev => handleElementMouseDown(ev, l.id)} style={{ cursor: "pointer" }}>
                      {sel && <rect x={l.x - 4} y={l.y - l.fontSize - 2} width={l.text.length * l.fontSize * 0.6 + 8} height={l.fontSize + 8} rx={4} fill="#EFF6FF" stroke="#3B82F6" strokeWidth={1.5} />}
                      <text x={l.x} y={l.y} fontSize={l.fontSize} fill={l.color}
                        fontWeight={l.bold ? "700" : "500"} style={{ pointerEvents: "none" }}>
                        {l.text}
                      </text>
                    </g>
                  );
                })}

              {/* MARKERS */}
              {layerVisibility.labels && map.elements
                .filter(e => e.type === "marker" && e.visible)
                .map(e => {
                  const m = e as MarkerElement;
                  const sel = selectedId === m.id;
                  return (
                    <g key={m.id} onClick={ev => handleElementClick(ev, m.id)} onMouseDown={ev => handleElementMouseDown(ev, m.id)} style={{ cursor: "pointer" }}>
                      {/* Pin drop shadow */}
                      <ellipse cx={m.x} cy={m.y + 22} rx={6} ry={3} fill="rgba(0,0,0,0.2)" />
                      {/* Pin body */}
                      <path d={`M ${m.x} ${m.y - 20} C ${m.x - 12} ${m.y - 20} ${m.x - 12} ${m.y} ${m.x} ${m.y} C ${m.x + 12} ${m.y} ${m.x + 12} ${m.y - 20} ${m.x} ${m.y - 20} Z`}
                        fill={m.color} stroke={sel ? "#fff" : "rgba(255,255,255,0.6)"} strokeWidth={sel ? 2.5 : 1.5} />
                      {/* Pin point */}
                      <path d={`M ${m.x - 5} ${m.y - 2} L ${m.x} ${m.y + 16} L ${m.x + 5} ${m.y - 2}`}
                        fill={m.color} />
                      {/* Category icon */}
                      <text x={m.x} y={m.y - 10} textAnchor="middle" dominantBaseline="middle"
                        fontSize={11} fill="white" fontWeight="700" style={{ pointerEvents: "none" }}>
                        {m.category[0]}
                      </text>
                      {/* Marker label */}
                      <text x={m.x} y={m.y + 24} textAnchor="middle" fontSize={10} fontWeight="600"
                        fill={m.color} stroke="white" strokeWidth={3} paintOrder="stroke"
                        style={{ pointerEvents: "none" }}>
                        {m.name}
                      </text>
                      {sel && <circle cx={m.x} cy={m.y - 10} r={16} fill="none" stroke="#3B82F6" strokeWidth={2} strokeDasharray="4 2" opacity={0.8} />}
                    </g>
                  );
                })}

              {/* ── DRAWING PREVIEW ────────────────────────────────────── */}
              {drawing && drawPoints.length > 0 && (
                <>
                  <polyline points={svgPointsStr([...drawPoints, cursorPos])}
                    stroke={tool === "road" ? "#94A3B8" : "#22C55E"}
                    strokeWidth={tool === "road" ? 8 : 1.5}
                    fill="none" strokeLinecap="round" strokeDasharray="6 4" opacity={0.7} />
                  {tool === "zone" && (
                    <polygon points={svgPointsStr([...drawPoints, cursorPos])}
                      fill="#22C55E" fillOpacity={0.15} stroke="#22C55E" strokeWidth={1.5} strokeDasharray="6 4" />
                  )}
                  {drawPoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={4} fill={tool === "road" ? "#64748B" : "#22C55E"} />
                  ))}
                </>
              )}

              {/* ── BUILDING DRAFT ─────────────────────────────────────── */}
              {buildingDraft && buildingDraft.w > 0 && buildingDraft.h > 0 && (
                <>
                  <rect x={buildingDraft.x} y={buildingDraft.y} width={buildingDraft.w} height={buildingDraft.h}
                    fill="#3B82F6" fillOpacity={0.2} stroke="#3B82F6" strokeWidth={2} strokeDasharray="6 3" rx={4} />
                  <text x={buildingDraft.x + buildingDraft.w / 2} y={buildingDraft.y + buildingDraft.h / 2}
                    textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#3B82F6" fontWeight="600">
                    {Math.round(buildingDraft.w)} × {Math.round(buildingDraft.h)}
                  </text>
                </>
              )}

              {/* Cursor crosshair for drawing tools */}
              {(tool === "road" || tool === "zone" || tool === "label" || tool === "marker") && (
                <>
                  <line x1={cursorPos.x - 12} y1={cursorPos.y} x2={cursorPos.x + 12} y2={cursorPos.y}
                    stroke="#3B82F6" strokeWidth={1} opacity={0.6} />
                  <line x1={cursorPos.x} y1={cursorPos.y - 12} x2={cursorPos.x} y2={cursorPos.y + 12}
                    stroke="#3B82F6" strokeWidth={1} opacity={0.6} />
                  <circle cx={cursorPos.x} cy={cursorPos.y} r={3} fill="#3B82F6" opacity={0.8} />
                </>
              )}
            </g>
          </svg>

          {/* Mini map */}
          <MiniMap elements={map.elements} view={view} bgColor={map.bgColor}
            containerW={containerSize.w} containerH={containerSize.h} />
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────────────── */}
        <div className="w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 overflow-hidden">
          {/* Panel tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            {[
              { id: "properties", icon: Sliders, label: "Props" },
              { id: "layers", icon: Layers, label: "Layers" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setRightPanel(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${rightPanel === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                <tab.icon size={13} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {rightPanel === "properties" && (
              <PropertiesPanel element={selectedElement} onUpdate={updateElement} onDelete={deleteElement} />
            )}
            {rightPanel === "layers" && (
              <LayersPanel elements={map.elements} onToggleLayer={toggleLayer} layerVisibility={layerVisibility} />
            )}
          </div>

          {/* Element list */}
          <div className="border-t border-slate-200 dark:border-slate-800">
            <div className="px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Elements</span>
              <span className="text-[10px] text-slate-400">{map.elements.length} items</span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {map.elements.length === 0 && (
                <p className="text-xs text-slate-400 px-3 pb-3 text-center">No elements yet.<br />Use the tools to draw!</p>
              )}
              {map.elements.map(el => {
                const Icon = el.type === "building" ? Building2 :
                  el.type === "road" ? Minus :
                  el.type === "zone" ? Hexagon :
                  el.type === "marker" ? MapPin : Type;
                const color =
                  el.type === "building" ? (el as BuildingElement).color :
                  el.type === "road" ? (el as RoadElement).color :
                  el.type === "zone" ? (el as ZoneElement).color :
                  el.type === "marker" ? (el as MarkerElement).color :
                  (el as LabelElement).color;
                return (
                  <button key={el.id} onClick={() => { setSelectedId(el.id); setRightPanel("properties"); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${selectedId === el.id ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <Icon size={11} className="text-slate-400 flex-shrink-0" />
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1">{el.name}</span>
                    {el.locked && <Lock size={10} className="text-slate-400 flex-shrink-0" />}
                    {!el.visible && <EyeOff size={10} className="text-slate-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAP SETTINGS MODAL ──────────────────────────────────────────── */}
      {showMapSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Map Settings</h3>
              <button onClick={() => setShowMapSettings(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Map Title</label>
                <input value={map.title} onChange={e => doAction({ type: "DO", action: { type: "SET_MAP", map: { title: e.target.value } } } as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Campus Name</label>
                <input value={map.campusName} onChange={e => doAction({ type: "DO", action: { type: "SET_MAP", map: { campusName: e.target.value } } } as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Background Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={map.bgColor}
                    onChange={e => doAction({ type: "DO", action: { type: "SET_MAP", map: { bgColor: e.target.value } } } as any)}
                    className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer" />
                  <div className="flex gap-2 flex-wrap">
                    {["#F1F5F9","#E2E8F0","#0F172A","#EFF6FF","#ECFDF5","#FFF7ED"].map(c => (
                      <button key={c} onClick={() => doAction({ type: "DO", action: { type: "SET_MAP", map: { bgColor: c } } } as any)}
                        className="w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110"
                        style={{ background: c, borderColor: map.bgColor === c ? "#3B82F6" : "#E2E8F0" }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button onClick={save}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  Save Settings
                </button>
                <button onClick={() => setShowMapSettings(false)}
                  className="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampusMapEditor;
