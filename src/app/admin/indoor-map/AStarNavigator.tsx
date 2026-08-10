import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Navigation,
  Accessibility,
  Flame,
  Clock,
  Activity,
  ArrowRight,
  Shield,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Link2,
  Unlink,
  Compass,
  Repeat,
  Sparkles,
  Zap,
  GitMerge,
  Route,
  Layers,
  Footprints,
  Sliders,
  Check,
  X,
  RotateCw
} from "lucide-react";
import { REFERENCE_ROOMS } from "./FloorViewer";
import client from "../../../api/client";

export type NavNodeType = "room" | "corridor" | "junction" | "door" | "elevator" | "stair" | "floor_connector" | "facility" | "exit";
export type PathAlgorithm = "a_star" | "dijkstra" | "bidirectional" | "wheelchair" | "emergency";

export interface NavNode {
  id: string;
  node_name: string;
  node_type: NavNodeType;
  x: number;
  y: number;
  floor_id?: number;
  status?: "Active" | "Maintenance" | "Blocked";
  is_accessible?: boolean;
}

export interface NavEdge {
  id: string;
  from_node: string;
  to_node: string;
  distance_meters: number;
  is_bidirectional?: boolean;
  is_accessible?: boolean;
  is_emergency?: boolean;
}

// Initial Sample Navigation Graph for Block A • Floor 1
const INITIAL_GRAPH_NODES: NavNode[] = [
  { id: "N_ENTRANCE", node_name: "South Main Entrance Gateway", node_type: "door", x: 405, y: 645, is_accessible: true },
  { id: "N_CORR_SOUTH", node_name: "South Corridor Crossway", node_type: "junction", x: 405, y: 505, is_accessible: true },
  { id: "N_CORR_EAST", node_name: "East Wing Main Corridor", node_type: "junction", x: 745, y: 505, is_accessible: true },
  { id: "N_CORR_WEST", node_name: "West Wing Main Corridor", node_type: "junction", x: 165, y: 505, is_accessible: true },
  { id: "N_A108", node_name: "Classroom A108 (IT Lab)", node_type: "room", x: 165, y: 595, is_accessible: true },
  { id: "N_ADM", node_name: "Admin & Accounts Office", node_type: "room", x: 312, y: 595, is_accessible: true },
  { id: "N_A107", node_name: "Classroom A107 (IT Lecture)", node_type: "room", x: 675, y: 595, is_accessible: true },
  { id: "N_A106", node_name: "Classroom A106 (CSE Lecture)", node_type: "room", x: 827, y: 595, is_accessible: true },
  { id: "N_ELEVATOR_1", node_name: "Passenger Elevator #1 (Vertical Lift)", node_type: "elevator", x: 745, y: 415, is_accessible: true },
  { id: "N_STAIRS_EAST", node_name: "East Wing Fire Staircase", node_type: "stair", x: 827, y: 415, is_accessible: false },
  { id: "N_A105", node_name: "Turing Seminar Hall (A105)", node_type: "room", x: 872, y: 412, is_accessible: true },
  { id: "N_FACULTY", node_name: "CSE Faculty Lounge", node_type: "room", x: 872, y: 267, is_accessible: true },
  { id: "N_CORR_NORTH_E", node_name: "North-East Junction", node_type: "junction", x: 745, y: 175, is_accessible: true },
  { id: "N_CORR_NORTH_W", node_name: "North-West Junction", node_type: "junction", x: 165, y: 175, is_accessible: true },
  { id: "N_A104", node_name: "Classroom A104 (AI/DS)", node_type: "room", x: 842, y: 115, is_accessible: true },
  { id: "N_A103", node_name: "Classroom A103 (AI/DS)", node_type: "room", x: 707, y: 115, is_accessible: true },
  { id: "N_RESTROOM", node_name: "Central Accessible Restroom", node_type: "facility", x: 437, y: 115, is_accessible: true },
  { id: "N_A102", node_name: "Classroom A102 (CSE)", node_type: "room", x: 310, y: 115, is_accessible: true },
  { id: "N_A101", node_name: "Classroom A101 (CSE)", node_type: "room", x: 165, y: 115, is_accessible: true },
  { id: "N_LIB", node_name: "Central Digital Library", node_type: "room", x: 107, y: 267, is_accessible: true },
  { id: "N_A109", node_name: "Computer Systems Lab (A109)", node_type: "room", x: 107, y: 412, is_accessible: true },
  { id: "N_EXIT_WEST", node_name: "West Emergency Fire Exit", node_type: "exit", x: 40, y: 505, is_accessible: true },
  { id: "N_FLOOR_2_LINK", node_name: "Floor 2 Multi-Level Transition", node_type: "floor_connector", x: 745, y: 360, is_accessible: true }
];

const INITIAL_GRAPH_EDGES: NavEdge[] = [
  { id: "E_1", from_node: "N_ENTRANCE", to_node: "N_CORR_SOUTH", distance_meters: 7.0, is_bidirectional: true, is_accessible: true },
  { id: "E_2", from_node: "N_CORR_SOUTH", to_node: "N_CORR_EAST", distance_meters: 17.0, is_bidirectional: true, is_accessible: true },
  { id: "E_3", from_node: "N_CORR_SOUTH", to_node: "N_CORR_WEST", distance_meters: 12.0, is_bidirectional: true, is_accessible: true },
  { id: "E_4", from_node: "N_CORR_WEST", to_node: "N_A108", distance_meters: 4.5, is_bidirectional: true, is_accessible: true },
  { id: "E_5", from_node: "N_CORR_WEST", to_node: "N_ADM", distance_meters: 7.5, is_bidirectional: true, is_accessible: true },
  { id: "E_6", from_node: "N_CORR_WEST", to_node: "N_EXIT_WEST", distance_meters: 6.0, is_bidirectional: true, is_accessible: true, is_emergency: true },
  { id: "E_7", from_node: "N_CORR_EAST", to_node: "N_A107", distance_meters: 5.5, is_bidirectional: true, is_accessible: true },
  { id: "E_8", from_node: "N_CORR_EAST", to_node: "N_A106", distance_meters: 6.0, is_bidirectional: true, is_accessible: true },
  { id: "E_9", from_node: "N_CORR_EAST", to_node: "N_ELEVATOR_1", distance_meters: 4.5, is_bidirectional: true, is_accessible: true },
  { id: "E_10", from_node: "N_ELEVATOR_1", to_node: "N_FLOOR_2_LINK", distance_meters: 3.0, is_bidirectional: true, is_accessible: true },
  { id: "E_11", from_node: "N_ELEVATOR_1", to_node: "N_STAIRS_EAST", distance_meters: 4.0, is_bidirectional: true, is_accessible: false },
  { id: "E_12", from_node: "N_ELEVATOR_1", to_node: "N_A105", distance_meters: 6.5, is_bidirectional: true, is_accessible: true },
  { id: "E_13", from_node: "N_ELEVATOR_1", to_node: "N_FACULTY", distance_meters: 7.5, is_bidirectional: true, is_accessible: true },
  { id: "E_14", from_node: "N_ELEVATOR_1", to_node: "N_CORR_NORTH_E", distance_meters: 12.0, is_bidirectional: true, is_accessible: true },
  { id: "E_15", from_node: "N_CORR_NORTH_E", to_node: "N_A104", distance_meters: 5.5, is_bidirectional: true, is_accessible: true },
  { id: "E_16", from_node: "N_CORR_NORTH_E", to_node: "N_A103", distance_meters: 4.0, is_bidirectional: true, is_accessible: true },
  { id: "E_17", from_node: "N_CORR_NORTH_E", to_node: "N_RESTROOM", distance_meters: 15.5, is_bidirectional: true, is_accessible: true },
  { id: "E_18", from_node: "N_RESTROOM", to_node: "N_CORR_NORTH_W", distance_meters: 13.5, is_bidirectional: true, is_accessible: true },
  { id: "E_19", from_node: "N_CORR_NORTH_W", to_node: "N_A102", distance_meters: 7.0, is_bidirectional: true, is_accessible: true },
  { id: "E_20", from_node: "N_CORR_NORTH_W", to_node: "N_A101", distance_meters: 3.5, is_bidirectional: true, is_accessible: true },
  { id: "E_21", from_node: "N_CORR_NORTH_W", to_node: "N_LIB", distance_meters: 5.0, is_bidirectional: true, is_accessible: true },
  { id: "E_22", from_node: "N_LIB", to_node: "N_A109", distance_meters: 7.0, is_bidirectional: true, is_accessible: true },
  { id: "E_23", from_node: "N_A109", to_node: "N_CORR_WEST", distance_meters: 5.0, is_bidirectional: true, is_accessible: true }
];

export function AStarNavigator() {
  // Graph state
  const [nodes, setNodes] = useState<NavNode[]>(INITIAL_GRAPH_NODES);
  const [edges, setEdges] = useState<NavEdge[]>(INITIAL_GRAPH_EDGES);

  // Active Tool Mode in Graph Workbench
  const [graphMode, setGraphMode] = useState<"navigate" | "add-node" | "connect-nodes" | "delete-node" | "validate">("navigate");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("N_ENTRANCE");
  const [connectSourceNodeId, setConnectSourceNodeId] = useState<string | null>(null);
  const [newNodeType, setNewNodeType] = useState<NavNodeType>("junction");

  // Wayfinding State
  const [startPoint, setStartPoint] = useState<string>("N_ENTRANCE");
  const [destination, setDestination] = useState<string>("N_A105");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<PathAlgorithm>("a_star");
  const [wheelchairOnly, setWheelchairOnly] = useState<boolean>(false);
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Validation Report State
  const [validationReport, setValidationReport] = useState<{
    isValid: boolean;
    disconnectedNodes: string[];
    deadEnds: string[];
    totalNodes: number;
    totalEdges: number;
    graphDensity: number;
    reachabilityPercent: number;
  } | null>(null);

  // Route Result
  const [routeData, setRouteData] = useState<any>({
    algorithmUsed: "A* (EUCLIDEAN HEURISTIC)",
    distanceMeters: 48,
    estimatedMinutes: 1,
    estimatedSeconds: 40,
    stepsCount: 62,
    caloriesBurned: 2.2,
    directions: [
      "Start at South Main Entrance Gateway",
      "Continue straight past South Corridor Crossway",
      "Turn right at East Wing Main Corridor",
      "Continue past Passenger Elevator #1",
      "Arrive at destination: Turing Seminar Hall (A105)"
    ],
    pathCoordinates: [
      { x: 405, y: 645 },
      { x: 405, y: 505 },
      { x: 745, y: 505 },
      { x: 745, y: 415 },
      { x: 872, y: 412 }
    ]
  });

  // Calculate shortest path via A* / Multi-Algorithm Engine
  const handleFindRoute = useCallback(async () => {
    setIsCalculating(true);
    try {
      const res = await client.post("/indoor-map/navigation/route", {
        floorId: 1,
        startNodeId: startPoint,
        endNodeId: destination,
        algorithm: selectedAlgorithm,
        wheelchairOnly,
        emergencyMode
      });
      if (res.data?.success) {
        setRouteData({
          ...res.data.data,
          pathCoordinates: res.data.data.path?.map((p: any) => ({ x: p.x, y: p.y })) || []
        });
      }
    } catch (err) {
      console.error("Navigation error:", err);
    } finally {
      setIsCalculating(false);
    }
  }, [startPoint, destination, selectedAlgorithm, wheelchairOnly, emergencyMode]);

  // Graph Validation Engine
  const handleValidateGraph = () => {
    const nodeIds = new Set(nodes.map(n => n.id));
    const degreeMap = new Map<string, number>();
    nodes.forEach(n => degreeMap.set(n.id, 0));

    edges.forEach(e => {
      if (degreeMap.has(e.from_node)) degreeMap.set(e.from_node, (degreeMap.get(e.from_node) || 0) + 1);
      if (degreeMap.has(e.to_node)) degreeMap.set(e.to_node, (degreeMap.get(e.to_node) || 0) + 1);
    });

    const disconnected = nodes.filter(n => (degreeMap.get(n.id) || 0) === 0).map(n => n.node_name || n.id);
    const deadEnds = nodes.filter(n => (degreeMap.get(n.id) || 0) === 1 && n.node_type !== "room" && n.node_type !== "exit").map(n => n.node_name || n.id);

    const reachableNodes = nodes.filter(n => (degreeMap.get(n.id) || 0) > 0).length;
    const reachability = Math.round((reachableNodes / (nodes.length || 1)) * 100);
    const density = Number((edges.length / (nodes.length || 1)).toFixed(2));

    setValidationReport({
      isValid: disconnected.length === 0,
      disconnectedNodes: disconnected,
      deadEnds,
      totalNodes: nodes.length,
      totalEdges: edges.length,
      graphDensity: density,
      reachabilityPercent: reachability
    });
    setGraphMode("validate");
  };

  // Node Canvas Click
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (graphMode !== "add-node") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 750);

    const nodeId = `N_${newNodeType.toUpperCase()}_${Date.now().toString().slice(-4)}`;
    const newNode: NavNode = {
      id: nodeId,
      node_name: `${newNodeType.toUpperCase()} Node`,
      node_type: newNodeType,
      x,
      y,
      is_accessible: true
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setGraphMode("navigate");
  };

  // Node Connection Click
  const handleNodeClick = (node: NavNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);

    if (graphMode === "connect-nodes") {
      if (!connectSourceNodeId) {
        setConnectSourceNodeId(node.id);
      } else if (connectSourceNodeId !== node.id) {
        const sourceNode = nodes.find(n => n.id === connectSourceNodeId);
        if (sourceNode) {
          const distM = Math.round(Math.hypot(node.x - sourceNode.x, node.y - sourceNode.y) * 0.05);
          const newEdge: NavEdge = {
            id: `E_${Date.now()}`,
            from_node: connectSourceNodeId,
            to_node: node.id,
            distance_meters: distM,
            is_bidirectional: true,
            is_accessible: true
          };
          setEdges(prev => [...prev, newEdge]);
          setConnectSourceNodeId(null);
          setGraphMode("navigate");
        }
      }
    } else if (graphMode === "delete-node") {
      setNodes(prev => prev.filter(n => n.id !== node.id));
      setEdges(prev => prev.filter(e => e.from_node !== node.id && e.to_node !== node.id));
      setSelectedNodeId(null);
      setGraphMode("navigate");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl select-none">
      
      {/* ------------------------------------------------------------ */}
      {/* LEFT: LIVE NAVIGATION GRAPH SVG BLUEPRINT VIEWPORT */}
      {/* ------------------------------------------------------------ */}
      <div className="flex-1 relative bg-slate-950 flex flex-col overflow-hidden">
        
        {/* Top Graph Workbench Bar */}
        <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10 backdrop-blur-md">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-black uppercase text-teal-400 font-mono px-1">🔗 GRAPH TOOLS:</span>

            {/* Navigate Mode */}
            <button
              onClick={() => { setGraphMode("navigate"); setConnectSourceNodeId(null); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                graphMode === "navigate" ? "bg-teal-600 text-white shadow" : "bg-slate-950 text-slate-300 hover:text-white"
              }`}
            >
              <Navigation size={12} />
              <span>Wayfinding</span>
            </button>

            {/* Add Node Tool */}
            <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
              <button
                onClick={() => setGraphMode("add-node")}
                className={`px-2 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                  graphMode === "add-node" ? "bg-indigo-600 text-white" : "text-slate-300 hover:text-white"
                }`}
              >
                <Plus size={12} />
                <span>Add Node</span>
              </button>
              <select
                value={newNodeType}
                onChange={(e) => setNewNodeType(e.target.value as NavNodeType)}
                className="bg-slate-900 text-[10px] font-bold text-indigo-300 px-1 py-0.5 rounded border-none"
              >
                <option value="junction">Junction (Hub)</option>
                <option value="room">Room Node</option>
                <option value="door">Entrance Door</option>
                <option value="elevator">Elevator Node</option>
                <option value="stair">Stair Node</option>
                <option value="floor_connector">Floor Connector</option>
                <option value="facility">Facility POI</option>
              </select>
            </div>

            {/* Connect Nodes */}
            <button
              onClick={() => { setGraphMode("connect-nodes"); setConnectSourceNodeId(null); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                graphMode === "connect-nodes" ? "bg-teal-500 text-black font-black shadow" : "bg-slate-950 text-slate-300 hover:text-white"
              }`}
              title="Click Node 1 then Node 2 to link"
            >
              <Link2 size={12} />
              <span>{connectSourceNodeId ? `Link from [${connectSourceNodeId}]` : "Connect Nodes"}</span>
            </button>

            {/* Delete Node */}
            <button
              onClick={() => setGraphMode("delete-node")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                graphMode === "delete-node" ? "bg-red-600 text-white shadow" : "bg-slate-950 text-red-300 hover:text-white"
              }`}
            >
              <Trash2 size={12} />
              <span>Delete Node</span>
            </button>

            {/* Validate Graph */}
            <button
              onClick={handleValidateGraph}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                graphMode === "validate" ? "bg-amber-600 text-white shadow" : "bg-slate-950 text-amber-300 hover:text-white"
              }`}
            >
              <Shield size={12} />
              <span>Validate Graph</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Nodes: <strong className="text-white">{nodes.length}</strong></span>
            <span>Edges: <strong className="text-white">{edges.length}</strong></span>
          </div>
        </div>

        {/* SVG Canvas with Graph Overlay */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden p-2">
          <svg viewBox="0 0 1000 750" onClick={handleCanvasClick} className="w-full h-full">
            {/* Floor Base */}
            <rect width="1000" height="750" fill="#090d16" />
            <rect x="20" y="20" width="960" height="670" rx="16" fill="#0f172a" stroke="#334155" strokeWidth="6" />

            {/* Rooms Outline */}
            {REFERENCE_ROOMS.map((r) => (
              <g key={r.id}>
                <rect x={r.x} y={r.y} width={r.width} height={r.height} rx="6" fill={r.fill} stroke={r.stroke} strokeWidth={2} opacity={0.65} />
                <text x={r.x + r.width / 2} y={r.y + r.height / 2} textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="bold">{r.room_number}</text>
              </g>
            ))}

            {/* 1. RENDER ALL GRAPH EDGES */}
            {edges.map((e) => {
              const fromN = nodes.find(n => n.id === e.from_node);
              const toN = nodes.find(n => n.id === e.to_node);
              if (!fromN || !toN) return null;

              return (
                <g key={e.id}>
                  {/* Edge clearance band */}
                  <line x1={fromN.x} y1={fromN.y} x2={toN.x} y2={toN.y} stroke="#10b981" strokeWidth="6" opacity="0.12" strokeLinecap="round" />
                  {/* Edge spine */}
                  <line x1={fromN.x} y1={fromN.y} x2={toN.x} y2={toN.y} stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 2" />
                </g>
              );
            })}

            {/* 2. RENDER OPTIMAL ROUTE PATH OVERLAY */}
            {routeData?.pathCoordinates && routeData.pathCoordinates.length > 1 && (
              <g>
                <path
                  d={`M ${routeData.pathCoordinates.map((p: any) => `${p.x} ${p.y}`).join(" L ")}`}
                  fill="none"
                  stroke={emergencyMode ? "#ef4444" : "#38bdf8"}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-pulse"
                  style={{ filter: `drop-shadow(0 0 10px ${emergencyMode ? "rgba(239,68,68,0.9)" : "rgba(56,189,248,0.9)"})` }}
                />
              </g>
            )}

            {/* 3. RENDER ALL GRAPH NODES */}
            {nodes.map((n) => {
              const isSelected = selectedNodeId === n.id;
              const isConnectSource = connectSourceNodeId === n.id;
              let nodeColor = "#10b981";
              if (n.node_type === "room") nodeColor = "#f59e0b";
              if (n.node_type === "elevator") nodeColor = "#0284c7";
              if (n.node_type === "stair") nodeColor = "#64748b";
              if (n.node_type === "exit") nodeColor = "#ef4444";
              if (n.node_type === "floor_connector") nodeColor = "#a855f7";

              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x}, ${n.y})`}
                  onClick={(e) => handleNodeClick(n, e)}
                  className="cursor-pointer group"
                >
                  {/* Outer selection ring */}
                  {(isSelected || isConnectSource) && (
                    <circle r="12" fill="none" stroke={isConnectSource ? "#22c55e" : "#38bdf8"} strokeWidth="2.5" strokeDasharray="3 3" className="animate-spin" />
                  )}

                  {/* Node Circle */}
                  <circle r={n.node_type === "junction" ? "7" : "6"} fill={nodeColor} stroke="#ffffff" strokeWidth="2" />

                  {/* Node Label on hover */}
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <rect x="-40" y="-22" width="80" height="16" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                    <text textAnchor="middle" y="-10" fill="#ffffff" fontSize="8" fontWeight="bold">{n.node_name || n.id}</text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

      </div>

      {/* ------------------------------------------------------------ */}
      {/* RIGHT: MULTI-ALGORITHM WAYFINDING & GRAPH WORKBENCH */}
      {/* ------------------------------------------------------------ */}
      <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 space-y-4 overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Compass size={16} className="text-teal-400" />
              <span>{graphMode === "validate" ? "Graph Quality Validation" : "A* Multi-Algorithm Wayfinding"}</span>
            </h3>
            <p className="text-[11px] text-slate-400">Turn-by-turn indoor graph route computation</p>
          </div>
        </div>

        {/* VALIDATION REPORT VIEW */}
        {graphMode === "validate" && validationReport ? (
          <div className="space-y-3 text-xs">
            <div className={`p-3 rounded-xl border flex items-center gap-3 ${
              validationReport.isValid ? "bg-emerald-500/10 border-emerald-500 text-emerald-300" : "bg-amber-500/10 border-amber-500 text-amber-300"
            }`}>
              {validationReport.isValid ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
              <div>
                <h5 className="font-black text-sm">{validationReport.isValid ? "Graph Topology Validated" : "Graph Issues Detected"}</h5>
                <p className="text-[11px]">{validationReport.reachabilityPercent}% Reachability • {validationReport.graphDensity} avg degree</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Total Navigation Nodes:</span>
                <span className="text-white font-bold">{validationReport.totalNodes}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Bidirectional Edges:</span>
                <span className="text-white font-bold">{validationReport.totalEdges}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Disconnected Nodes:</span>
                <span className={validationReport.disconnectedNodes.length > 0 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                  {validationReport.disconnectedNodes.length}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Dead-End Nodes:</span>
                <span className="text-amber-400 font-bold">{validationReport.deadEnds.length}</span>
              </div>
            </div>

            {validationReport.disconnectedNodes.length > 0 && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase text-red-400">Disconnected Nodes:</span>
                <ul className="text-[11px] text-red-200 list-disc list-inside">
                  {validationReport.disconnectedNodes.map(n => <li key={n}>{n}</li>)}
                </ul>
              </div>
            )}

            <button
              onClick={() => setGraphMode("navigate")}
              className="w-full py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs"
            >
              Back to Wayfinding
            </button>
          </div>
        ) : (
          /* STANDARD WAYFINDING & ALGORITHM CONTROLS */
          <div className="space-y-4 text-xs">
            
            {/* Start Node */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Start Waypoint</label>
              <select
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              >
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.node_name || n.id} ({n.node_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Node */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Destination Target</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              >
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.node_name || n.id} ({n.node_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Algorithm Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5">Pathfinding Algorithm</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "a_star", label: "A* (Recommended)", desc: "Heuristic Euclidean", icon: "⚡" },
                  { id: "dijkstra", label: "Dijkstra's", desc: "Uniform Shortest", icon: "📐" },
                  { id: "bfs", label: "BFS Traversal", desc: "Fewest Hops (Simple)", icon: "🔄" },
                  { id: "emergency", label: "Fire Evacuation", desc: "Direct to Fire Exit", icon: "🚨" }
                ].map(alg => (
                  <button
                    key={alg.id}
                    onClick={() => {
                      setSelectedAlgorithm(alg.id as any);
                      if (alg.id === "emergency") setEmergencyMode(true);
                      else setEmergencyMode(false);
                    }}
                    className={`p-2 rounded-xl border text-left font-bold transition-all text-[11px] ${
                      selectedAlgorithm === alg.id
                        ? "bg-teal-600/20 border-teal-500 text-teal-300 shadow"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{alg.icon}</span>
                      <span>{alg.label}</span>
                    </div>
                    <span className="text-[9.5px] font-normal text-slate-400 block pl-5">{alg.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modifiers (Wheelchair / Emergency) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setWheelchairOnly(!wheelchairOnly)}
                className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all text-[11px] ${
                  wheelchairOnly ? "bg-blue-600/20 border-blue-500 text-blue-300" : "bg-slate-950 border-slate-800 text-slate-400"
                }`}
              >
                <Accessibility size={14} />
                <span>ADA Accessible</span>
              </button>

              <button
                onClick={() => {
                  setEmergencyMode(!emergencyMode);
                  if (!emergencyMode) setSelectedAlgorithm("emergency");
                }}
                className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all text-[11px] ${
                  emergencyMode ? "bg-red-600/20 border-red-500 text-red-300" : "bg-slate-950 border-slate-800 text-slate-400"
                }`}
              >
                <Flame size={14} />
                <span>Fire Evac</span>
              </button>
            </div>

            {/* Run Navigation Engine */}
            <button
              onClick={handleFindRoute}
              disabled={isCalculating}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2"
            >
              <Navigation size={14} />
              <span>{isCalculating ? "Calculating Route..." : "Find Shortest Route"}</span>
            </button>

            {/* ROUTE METRICS CARD */}
            {routeData && (
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-mono font-bold text-teal-400">{routeData.algorithmUsed}</span>
                  <span className="text-xs font-black text-white">{routeData.distanceMeters} meters</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono text-[10px]">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Walk Time</span>
                    <strong className="text-teal-400 text-xs">{routeData.estimatedSeconds || 40}s</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Steps</span>
                    <strong className="text-indigo-400 text-xs">{routeData.stepsCount || 62}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Calories</span>
                    <strong className="text-emerald-400 text-xs">{routeData.caloriesBurned || 2.2} kcal</strong>
                  </div>
                </div>

                {/* Turn-by-Turn Steps */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Turn-by-Turn Instructions:</span>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {routeData.directions?.map((dir: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 p-1.5 bg-slate-900/60 rounded-lg border border-slate-800/80 text-[11px] text-slate-300">
                        <div className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[9px] font-bold mt-0.5 shrink-0">
                          {idx + 1}
                        </div>
                        <span>{dir}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
