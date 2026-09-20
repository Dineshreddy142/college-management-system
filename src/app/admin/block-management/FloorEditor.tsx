import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Save, Undo, Redo, ZoomIn, ZoomOut, Maximize2, Grid, Ruler, Layers, Eye,
  Play, Upload, Download, MousePointer2, Move, Square, Circle, Minus, Hexagon,
  Type, DoorOpen, Footprints, Sparkles, Building, ChevronRight, X, Copy,
  Trash2, Lock, Unlock, ArrowUp, ArrowDown, Check, AlertCircle, RefreshCw,
  Plus, RotateCw, AlignLeft, AlignCenter, AlignRight, Sliders, Shield, Search
} from 'lucide-react';
import { blockService, FloorRecord, FloorObjectRecord, FloorLayerRecord, GeometryType, Point } from '../../../api/blockService';

const GRID_SIZE = 20;

export interface ToolItem {
  id: string;
  label: string;
  emoji: string;
  category: 'structure' | 'rooms' | 'movement' | 'facilities' | 'locations';
  objectType: string;
  geomType: GeometryType;
  fillColor: string;
  strokeColor: string;
  width: number;
  height: number;
  description: string;
}

export const TOOL_CATEGORIES = [
  { id: 'all', label: 'All Tools', emoji: '🛠️' },
  { id: 'structure', label: 'Building Structure', emoji: '🧱' },
  { id: 'rooms', label: 'Rooms & Halls', emoji: '🏫' },
  { id: 'movement', label: 'Movement & Exits', emoji: '🪜' },
  { id: 'facilities', label: 'Facilities', emoji: '🚻' },
  { id: 'locations', label: 'Important Locations', emoji: '🛡️' }
];

export const ARCHITECTURAL_TOOLS: ToolItem[] = [
  // 1. Building Structure
  { id: 'outer_wall', label: 'Outer Wall', emoji: '🧱', category: 'structure', objectType: 'wall', geomType: 'RECTANGLE', fillColor: '#334155', strokeColor: '#94A3B8', width: 220, height: 14, description: 'Outer structural perimeter wall' },
  { id: 'inner_wall', label: 'Inner Wall', emoji: '🧱', category: 'structure', objectType: 'wall', geomType: 'RECTANGLE', fillColor: '#64748B', strokeColor: '#CBD5E1', width: 140, height: 10, description: 'Interior partition wall' },
  { id: 'door', label: 'Door', emoji: '🚪', category: 'structure', objectType: 'door', geomType: 'RECTANGLE', fillColor: '#EC4899', strokeColor: '#BE185D', width: 40, height: 20, description: 'Single/Double entrance door' },
  { id: 'window', label: 'Window', emoji: '🪟', category: 'structure', objectType: 'window', geomType: 'RECTANGLE', fillColor: '#06B6D4', strokeColor: '#0891B2', width: 50, height: 14, description: 'Wall ventilation window' },
  { id: 'corridor', label: 'Corridor', emoji: '🚶', category: 'structure', objectType: 'corridor', geomType: 'RECTANGLE', fillColor: '#1E293B', strokeColor: '#475569', width: 240, height: 80, description: 'Pedestrian passage corridor' },
  { id: 'open_hall', label: 'Open Area / Hall', emoji: '🔲', category: 'structure', objectType: 'hall', geomType: 'RECTANGLE', fillColor: '#1E1B4B', strokeColor: '#4338CA', width: 260, height: 160, description: 'Open courtyard / central hall' },

  // 2. Rooms
  { id: 'classroom', label: 'Classroom', emoji: '🏫', category: 'rooms', objectType: 'room', geomType: 'RECTANGLE', fillColor: '#2563EB', strokeColor: '#60A5FA', width: 140, height: 100, description: 'Lecture classroom' },
  { id: 'computer_lab', label: 'Computer Lab', emoji: '💻', category: 'rooms', objectType: 'lab', geomType: 'RECTANGLE', fillColor: '#7C3AED', strokeColor: '#A78BFA', width: 180, height: 120, description: 'IT & PC Workstation Lab' },
  { id: 'laboratory', label: 'Laboratory', emoji: '🔬', category: 'rooms', objectType: 'lab', geomType: 'RECTANGLE', fillColor: '#9333EA', strokeColor: '#C084FC', width: 180, height: 120, description: 'Science / Engineering Lab' },
  { id: 'faculty_room', label: 'Faculty Room', emoji: '👨‍🏫', category: 'rooms', objectType: 'office', geomType: 'RECTANGLE', fillColor: '#0D9488', strokeColor: '#2DD4BF', width: 120, height: 90, description: 'Professor / Lecturer Office' },
  { id: 'hod_room', label: 'HOD Room', emoji: '🧑‍💼', category: 'rooms', objectType: 'office', geomType: 'RECTANGLE', fillColor: '#059669', strokeColor: '#34D399', width: 130, height: 100, description: 'Head of Department Executive Office' },
  { id: 'dept_office', label: 'Department Office', emoji: '🏢', category: 'rooms', objectType: 'office', geomType: 'RECTANGLE', fillColor: '#10B981', strokeColor: '#6EE7B7', width: 160, height: 110, description: 'Department Admin Staff Office' },
  { id: 'seminar_hall', label: 'Seminar Hall', emoji: '📚', category: 'rooms', objectType: 'hall', geomType: 'RECTANGLE', fillColor: '#4F46E5', strokeColor: '#818CF8', width: 220, height: 150, description: 'Presentation & Seminar Room' },
  { id: 'auditorium', label: 'Auditorium', emoji: '🎤', category: 'rooms', objectType: 'hall', geomType: 'RECTANGLE', fillColor: '#581C87', strokeColor: '#C084FC', width: 300, height: 200, description: 'Large Scale Event Auditorium' },
  { id: 'exam_hall', label: 'Examination Hall', emoji: '📝', category: 'rooms', objectType: 'hall', geomType: 'RECTANGLE', fillColor: '#0284C7', strokeColor: '#38BDF8', width: 260, height: 180, description: 'Central Examination Facility' },
  { id: 'store_room', label: 'Store Room', emoji: '🗄️', category: 'rooms', objectType: 'storage', geomType: 'RECTANGLE', fillColor: '#52525B', strokeColor: '#A1A1AA', width: 90, height: 70, description: 'Equipment Storage Closet' },

  // 3. Movement
  { id: 'stairs', label: 'Stairs', emoji: '🪜', category: 'movement', objectType: 'stairs', geomType: 'RECTANGLE', fillColor: '#D97706', strokeColor: '#FBBF24', width: 140, height: 100, description: 'Stairwell staircase' },
  { id: 'elevator', label: 'Elevator / Lift', emoji: '🛗', category: 'movement', objectType: 'elevator', geomType: 'RECTANGLE', fillColor: '#EA580C', strokeColor: '#FB923C', width: 80, height: 80, description: 'Passenger & Freight Elevator' },
  { id: 'ramp', label: 'Accessible Ramp', emoji: '♿', category: 'movement', objectType: 'ramp', geomType: 'RECTANGLE', fillColor: '#059669', strokeColor: '#34D399', width: 120, height: 50, description: 'Wheelchair accessible ramp' },
  { id: 'main_entrance', label: 'Main Entrance', emoji: '🚪', category: 'movement', objectType: 'entrance', geomType: 'RECTANGLE', fillColor: '#CA8A04', strokeColor: '#FACC15', width: 100, height: 30, description: 'Building main entrance gate' },
  { id: 'emergency_exit', label: 'Emergency Exit', emoji: '🚨', category: 'movement', objectType: 'exit', geomType: 'RECTANGLE', fillColor: '#DC2626', strokeColor: '#F87171', width: 60, height: 25, description: 'Fire & emergency evacuation exit' },

  // 4. Facilities
  { id: 'mens_toilet', label: "Men's Toilet", emoji: '🚻', category: 'facilities', objectType: 'washroom', geomType: 'RECTANGLE', fillColor: '#2563EB', strokeColor: '#93C5FD', width: 90, height: 80, description: 'Male Restroom' },
  { id: 'womens_toilet', label: "Women's Toilet", emoji: '🚻', category: 'facilities', objectType: 'washroom', geomType: 'RECTANGLE', fillColor: '#E11D48', strokeColor: '#FDA4AF', width: 90, height: 80, description: 'Female Restroom' },
  { id: 'accessible_toilet', label: 'Accessible Toilet', emoji: '♿', category: 'facilities', objectType: 'washroom', geomType: 'RECTANGLE', fillColor: '#0D9488', strokeColor: '#5EEAD4', width: 80, height: 80, description: 'Disability / Wheelchair Restroom' },
  { id: 'drinking_water', label: 'Drinking Water', emoji: '💧', category: 'facilities', objectType: 'facility', geomType: 'RECTANGLE', fillColor: '#0891B2', strokeColor: '#67E8F9', width: 50, height: 40, description: 'Filtered Water Dispenser Kiosk' },
  { id: 'canteen', label: 'Canteen', emoji: '🍽️', category: 'facilities', objectType: 'facility', geomType: 'RECTANGLE', fillColor: '#C2410C', strokeColor: '#FDBA74', width: 200, height: 140, description: 'Food Court & Dining Area' },
  { id: 'cafeteria', label: 'Cafeteria', emoji: '☕', category: 'facilities', objectType: 'facility', geomType: 'RECTANGLE', fillColor: '#B45309', strokeColor: '#FDE047', width: 160, height: 110, description: 'Coffee & Snack Bar' },
  { id: 'waiting_area', label: 'Waiting Area', emoji: '🪑', category: 'facilities', objectType: 'facility', geomType: 'RECTANGLE', fillColor: '#4338CA', strokeColor: '#A5B4FC', width: 130, height: 90, description: 'Visitor Seating & Lounge' },
  { id: 'student_lounge', label: 'Student Lounge', emoji: '🛋️', category: 'facilities', objectType: 'facility', geomType: 'RECTANGLE', fillColor: '#6B21A8', strokeColor: '#E9D5FF', width: 150, height: 100, description: 'Student Activity & Chill Lounge' },

  // 5. Important Locations
  { id: 'security_post', label: 'Security Post', emoji: '🛡️', category: 'locations', objectType: 'security', geomType: 'RECTANGLE', fillColor: '#991B1B', strokeColor: '#FCA5A5', width: 70, height: 70, description: 'Campus Guard Security Desk' },
  { id: 'reception', label: 'Reception', emoji: '🛎️', category: 'locations', objectType: 'reception', geomType: 'RECTANGLE', fillColor: '#B45309', strokeColor: '#FDE047', width: 110, height: 80, description: 'Information & Welcome Desk' },
  { id: 'medical_room', label: 'First-Aid / Medical', emoji: '🩺', category: 'locations', objectType: 'medical', geomType: 'RECTANGLE', fillColor: '#BE123C', strokeColor: '#FECDD3', width: 100, height: 90, description: 'Emergency Clinic & Infirmary' },
  { id: 'fire_extinguisher', label: 'Fire Extinguisher', emoji: '🔥', category: 'locations', objectType: 'safety', geomType: 'RECTANGLE', fillColor: '#B91C1C', strokeColor: '#F87171', width: 35, height: 35, description: 'Safety Fire Extinguisher' },
  { id: 'fire_alarm', label: 'Fire Alarm', emoji: '🚨', category: 'locations', objectType: 'safety', geomType: 'RECTANGLE', fillColor: '#991B1B', strokeColor: '#EF4444', width: 30, height: 30, description: 'Emergency Pull Alarm Station' },
  { id: 'notice_board', label: 'Notice Board', emoji: '📍', category: 'locations', objectType: 'info', geomType: 'RECTANGLE', fillColor: '#A16207', strokeColor: '#FEF08A', width: 80, height: 20, description: 'Information Bulletin Board' },
  { id: 'atm', label: 'ATM', emoji: '🏧', category: 'locations', objectType: 'facility', geomType: 'RECTANGLE', fillColor: '#047857', strokeColor: '#6EE7B7', width: 50, height: 50, description: 'Bank ATM Machine Kiosk' },
  { id: 'parking', label: 'Parking Area', emoji: '🅿️', category: 'locations', objectType: 'parking', geomType: 'RECTANGLE', fillColor: '#334155', strokeColor: '#94A3B8', width: 200, height: 150, description: 'Vehicle Parking Bay' }
];

export const FloorEditor: React.FC<{
  floorId: number;
  onBack?: () => void;
}> = ({ floorId, onBack }) => {
  const [floor, setFloor] = useState<FloorRecord | null>(null);
  const [layers, setLayers] = useState<FloorLayerRecord[]>([]);
  const [objects, setObjects] = useState<FloorObjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Undo / Redo Stack History
  const [history, setHistory] = useState<FloorObjectRecord[][]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);

  // Editor Viewport State
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Canvas Toggles
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showBuildingOutline, setShowBuildingOutline] = useState(true);

  // Active Tool & Selection State
  const [activeTool, setActiveTool] = useState<string>('select');
  const [selectedObjectId, setSelectedObjectId] = useState<string | number | null>(null);
  const [clipboard, setClipboard] = useState<FloorObjectRecord | null>(null);

  // Tool Palette & Architectural Categories State
  const [activeToolCategory, setActiveToolCategory] = useState<string>('all');
  const [toolSearchQuery, setToolSearchQuery] = useState<string>('');
  const [isToolLibraryOpen, setIsToolLibraryOpen] = useState<boolean>(true);

  // Dragging & Resizing State
  const [isDraggingObj, setIsDraggingObj] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragGroupIds, setDragGroupIds] = useState<string[]>([]);
  const [dragGroupStartPositions, setDragGroupStartPositions] = useState<Map<string, { x: number; y: number; points?: Point[] }> | null>(null);
  const [dragStartMousePos, setDragStartMousePos] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState<{ mouseX: number; mouseY: number; x: number; y: number; w: number; h: number } | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; objId: string | number } | null>(null);

  // Building Boundary Points Computation
  const buildingBoundaryPoints: Point[] = React.useMemo(() => {
    if (floor?.boundary_points && floor.boundary_points.length > 0) {
      return floor.boundary_points;
    }
    if (floor?.building_boundary_points && floor.building_boundary_points.length > 0) {
      return floor.building_boundary_points;
    }
    // Fallback polygon perimeter matching floor or building dimensions
    const w = floor?.width || floor?.building_width || 600;
    const h = floor?.height || floor?.building_height || 400;
    return [
      { x: 50, y: 50 },
      { x: 50 + w, y: 50 },
      { x: 50 + w, y: 50 + Math.round(h * 0.5) },
      { x: 50 + Math.round(w * 0.6), y: 50 + Math.round(h * 0.5) },
      { x: 50 + Math.round(w * 0.6), y: 50 + h },
      { x: 50, y: 50 + h }
    ];
  }, [floor]);

  useEffect(() => {
    loadFloorAndObjects();
  }, [floorId]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        handlePaste();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjectId) {
          handleDeleteSelected();
        } else if (showBuildingOutline) {
          setShowBuildingOutline(false);
          showToast('Building boundary outline hidden');
        }
      } else if (e.key === 'Escape') {
        setSelectedObjectId(null);
        setActiveTool('select');
        setContextMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, history, historyIdx, clipboard]);

  const loadFloorAndObjects = async () => {
    try {
      setLoading(true);
      const fl = await blockService.getFloorDetail(floorId);
      setFloor(fl);

      const data = await blockService.getFloorObjects(floorId);
      setLayers(data.layers);
      setObjects(data.objects);
      pushHistory(data.objects);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load floor layout', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Undo / Redo Management
  const pushHistory = (newObjects: FloorObjectRecord[]) => {
    const nextHistory = history.slice(0, historyIdx + 1);
    nextHistory.push(JSON.parse(JSON.stringify(newObjects)));
    setHistory(nextHistory);
    setHistoryIdx(nextHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1;
      setHistoryIdx(prevIdx);
      setObjects(JSON.parse(JSON.stringify(history[prevIdx])));
      setHasUnsavedChanges(true);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      setObjects(JSON.parse(JSON.stringify(history[nextIdx])));
      setHasUnsavedChanges(true);
    }
  };

  // Manual & Autosave
  const handleSaveFloorLayout = async () => {
    try {
      setSaving(true);
      await blockService.saveFloorObjectsBatch(floorId, { objects, layers });
      setHasUnsavedChanges(false);
      showToast('Floor plan layout saved successfully');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save layout', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Tool Selection & Object Creation
  const handleSelectTool = (toolId: string) => {
    setActiveTool(toolId);
    if (toolId === 'select' || toolId === 'pan') return;

    const scale = Math.max(0.1, zoomLevel / 100);
    const snap = (v: number) => snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v;

    const newX = snap(120);
    const newY = snap(120);
    const newObjId = `obj_${Date.now()}`;

    // Check if tool is in ARCHITECTURAL_TOOLS definition
    const archTool = ARCHITECTURAL_TOOLS.find(t => t.id === toolId);
    if (archTool) {
      const newObj: FloorObjectRecord = {
        id: newObjId,
        floor_id: floorId,
        object_type: archTool.objectType,
        geometry_type: archTool.geomType,
        x: newX,
        y: newY,
        width: archTool.width,
        height: archTool.height,
        rotation: 0,
        label: `${archTool.emoji} ${archTool.label}`,
        z_index: objects.length + 1,
        locked: false,
        visible: true,
        fill_color: archTool.fillColor,
        stroke_color: archTool.strokeColor,
        stroke_width: 2,
        properties: {
          category: archTool.category,
          roomType: archTool.label,
          description: archTool.description
        }
      };

      const updated = [...objects, newObj];
      setObjects(updated);
      pushHistory(updated);
      setSelectedObjectId(newObjId);
      setHasUnsavedChanges(true);
      showToast(`Added ${archTool.emoji} ${archTool.label}`);
      setActiveTool('select');
      return;
    }

    // Default shapes fallback
    let objType = toolId.toUpperCase();
    let geomType: GeometryType = 'RECTANGLE';
    let label = toolId.charAt(0).toUpperCase() + toolId.slice(1);
    let fillColor = '#3B82F6';
    let strokeColor = '#1E40AF';
    let width = 180;
    let height = 120;
    let points: Point[] = [];

    if (toolId === 'circle') {
      geomType = 'CIRCLE';
      width = 120;
      height = 120;
      fillColor = '#10B981';
      strokeColor = '#047857';
    } else if (toolId === 'polygon' || toolId === 'garden' || toolId === 'courtyard') {
      geomType = 'POLYGON';
      fillColor = toolId === 'garden' ? '#059669' : '#8B5CF6';
      strokeColor = toolId === 'garden' ? '#047857' : '#6D28D9';
      points = [
        { x: newX, y: newY },
        { x: newX + 180, y: newY },
        { x: newX + 180, y: newY + 80 },
        { x: newX + 100, y: newY + 80 },
        { x: newX + 100, y: newY + 140 },
        { x: newX, y: newY + 140 }
      ];
    } else if (toolId === 'stairs' || toolId === 'elevator') {
      fillColor = '#F59E0B';
      strokeColor = '#B45309';
      width = 140;
      height = 100;
    } else if (toolId === 'door' || toolId === 'window') {
      fillColor = '#EC4899';
      strokeColor = '#BE185D';
      width = 40;
      height = 20;
    }

    const newObj: FloorObjectRecord = {
      id: newObjId,
      floor_id: floorId,
      object_type: objType,
      geometry_type: geomType,
      x: newX,
      y: newY,
      width,
      height,
      rotation: 0,
      points,
      label: `${label} ${objects.length + 1}`,
      z_index: objects.length,
      locked: false,
      visible: true,
      fill_color: fillColor,
      stroke_color: strokeColor,
      stroke_width: 2,
      properties: {
        roomType: toolId === 'classroom' ? 'Classroom' : toolId === 'lab' ? 'Laboratory' : 'General',
        department: 'CSE',
        capacity: 40,
        status: 'Available'
      }
    };

    const updated = [...objects, newObj];
    setObjects(updated);
    pushHistory(updated);
    setSelectedObjectId(newObjId);
    setHasUnsavedChanges(true);
    setActiveTool('select');
  };

  // Object Dragging & Resizing Handlers (Double-click or Alt+Drag clones & drags ALL components together as a structure)
  const handleMouseDownObj = (e: React.MouseEvent, obj: FloorObjectRecord) => {
    e.stopPropagation();
    setContextMenu(null);
    if (obj.locked || isPreviewMode) return;

    const scale = Math.max(0.1, zoomLevel / 100);

    // Double-click (e.detail >= 2) OR Alt+Drag: Clone ALL components and drag the entire structure
    if (e.detail >= 2 || e.altKey) {
      const now = Date.now();
      const startPositionsMap = new Map<string, { x: number; y: number; points?: Point[] }>();
      const groupIds: string[] = [];

      const duplicatedGroup: FloorObjectRecord[] = objects.map((item, idx) => {
        const newId = `obj_${now}_${idx}`;
        const strNewId = String(newId);
        groupIds.push(strNewId);

        startPositionsMap.set(strNewId, {
          x: item.x,
          y: item.y,
          points: item.points ? JSON.parse(JSON.stringify(item.points)) : undefined
        });

        const baseLabel = item.label || item.object_type || 'Component';
        const copyLabel = baseLabel.includes('(Copy)') ? baseLabel : `${baseLabel} (Copy)`;

        return {
          ...JSON.parse(JSON.stringify(item)),
          id: newId,
          label: copyLabel
        };
      });

      const updated = [...objects, ...duplicatedGroup];
      setObjects(updated);
      pushHistory(updated);
      setSelectedObjectId(duplicatedGroup[0]?.id || null);
      setHasUnsavedChanges(true);

      // Enable group dragging for all duplicated objects
      setIsDraggingObj(true);
      setDragGroupIds(groupIds);
      setDragGroupStartPositions(startPositionsMap);
      setDragStartMousePos({
        mouseX: e.clientX / scale,
        mouseY: e.clientY / scale
      });

      showToast(`Copied all ${objects.length} components! Dragging structure copy...`);
      return;
    }

    // Normal single-click select & drag
    setSelectedObjectId(obj.id);
    setIsDraggingObj(true);
    setDragGroupIds([]);
    setDragGroupStartPositions(null);
    setDragStartMousePos(null);
    setDragOffset({
      x: e.clientX / scale - obj.x,
      y: e.clientY / scale - obj.y
    });
  };

  const handleMouseDownResizeHandle = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setResizeHandle(handle);
    const target = objects.find(o => String(o.id) === String(selectedObjectId));
    if (target) {
      setResizeStartPos({
        mouseX: e.clientX,
        mouseY: e.clientY,
        x: target.x,
        y: target.y,
        w: target.width,
        h: target.height
      });
    }
  };

  const handleMouseMoveCanvas = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
      return;
    }

    if (isPreviewMode || !selectedObjectId) return;

    const snap = (v: number) => snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v;
    const scale = Math.max(0.1, zoomLevel / 100);

    if (isDraggingObj) {
      if (dragGroupIds.length > 0 && dragGroupStartPositions && dragStartMousePos) {
        // Multi-component group drag
        const deltaX = snap(e.clientX / scale - dragStartMousePos.mouseX);
        const deltaY = snap(e.clientY / scale - dragStartMousePos.mouseY);

        setObjects(prev => prev.map(o => {
          const strId = String(o.id);
          if (!dragGroupIds.includes(strId)) return o;

          const startInfo = dragGroupStartPositions.get(strId);
          if (!startInfo) return o;

          const newX = Math.max(0, startInfo.x + deltaX);
          const newY = Math.max(0, startInfo.y + deltaY);

          let newPoints = o.points;
          if (startInfo.points && startInfo.points.length > 0) {
            newPoints = startInfo.points.map(pt => ({
              x: Math.max(0, pt.x + deltaX),
              y: Math.max(0, pt.y + deltaY)
            }));
          }

          return { ...o, x: newX, y: newY, points: newPoints };
        }));
        setHasUnsavedChanges(true);
      } else {
        // Single component drag
        const newX = snap(e.clientX / scale - dragOffset.x);
        const newY = snap(e.clientY / scale - dragOffset.y);
        setObjects(prev => prev.map(o => String(o.id) === String(selectedObjectId) ? { ...o, x: Math.max(0, newX), y: Math.max(0, newY) } : o));
        setHasUnsavedChanges(true);
      }
    } else if (resizeHandle && resizeStartPos) {
      const deltaX = (e.clientX - resizeStartPos.mouseX) / scale;
      const deltaY = (e.clientY - resizeStartPos.mouseY) / scale;

      setObjects(prev => prev.map(o => {
        if (String(o.id) !== String(selectedObjectId)) return o;
        let newX = resizeStartPos.x;
        let newY = resizeStartPos.y;
        let newW = resizeStartPos.w;
        let newH = resizeStartPos.h;

        if (resizeHandle.includes('e')) newW = Math.max(30, snap(resizeStartPos.w + deltaX));
        if (resizeHandle.includes('s')) newH = Math.max(20, snap(resizeStartPos.h + deltaY));
        if (resizeHandle.includes('w')) {
          const targetW = Math.max(30, snap(resizeStartPos.w - deltaX));
          newX = Math.max(0, resizeStartPos.x + (resizeStartPos.w - targetW));
          newW = targetW;
        }
        if (resizeHandle.includes('n')) {
          const targetH = Math.max(20, snap(resizeStartPos.h - deltaY));
          newY = Math.max(0, resizeStartPos.y + (resizeStartPos.h - targetH));
          newH = targetH;
        }

        return { ...o, x: newX, y: newY, width: newW, height: newH };
      }));
      setHasUnsavedChanges(true);
    }
  }, [isPanning, panStart, isPreviewMode, selectedObjectId, isDraggingObj, dragOffset, dragGroupIds, dragGroupStartPositions, dragStartMousePos, resizeHandle, resizeStartPos, snapToGrid, zoomLevel]);

  const handleMouseUpCanvas = () => {
    if (isDraggingObj || resizeHandle) {
      pushHistory(objects);
    }
    setIsPanning(false);
    setIsDraggingObj(false);
    setDragGroupIds([]);
    setDragGroupStartPositions(null);
    setDragStartMousePos(null);
    setResizeHandle(null);
    setResizeStartPos(null);
  };

  // Actions
  const handleCopy = () => {
    const sel = objects.find(o => String(o.id) === String(selectedObjectId));
    if (sel) setClipboard(JSON.parse(JSON.stringify(sel)));
  };

  const handlePaste = () => {
    if (!clipboard) return;
    const pasted: FloorObjectRecord = {
      ...JSON.parse(JSON.stringify(clipboard)),
      id: `obj_${Date.now()}`,
      x: clipboard.x + 30,
      y: clipboard.y + 30,
      label: `${clipboard.label || 'Object'} (Copy)`
    };
    const updated = [...objects, pasted];
    setObjects(updated);
    pushHistory(updated);
    setSelectedObjectId(pasted.id);
    setHasUnsavedChanges(true);
  };

  const handleDuplicateSelected = () => {
    handleCopy();
    handlePaste();
  };

  const handleDuplicateAllComponents = () => {
    if (objects.length === 0) {
      showToast('No layout components on canvas to copy', 'error');
      return;
    }
    const now = Date.now();
    const duplicatedGroup: FloorObjectRecord[] = objects.map((item, idx) => {
      const baseLabel = item.label || item.object_type || 'Component';
      const copyLabel = baseLabel.includes('(Copy)') ? baseLabel : `${baseLabel} (Copy)`;
      return {
        ...JSON.parse(JSON.stringify(item)),
        id: `obj_${now}_${idx}`,
        x: item.x + 40,
        y: item.y + 40,
        label: copyLabel
      };
    });

    const updated = [...objects, ...duplicatedGroup];
    setObjects(updated);
    pushHistory(updated);
    setSelectedObjectId(duplicatedGroup[0]?.id || null);
    setHasUnsavedChanges(true);
    showToast(`Duplicated all ${objects.length} layout components!`);
  };

  const handleDeleteSelected = () => {
    if (!selectedObjectId) return;
    const target = objects.find(o => String(o.id) === String(selectedObjectId));
    const label = target?.label || target?.object_type || 'Component';
    const updated = objects.filter(o => String(o.id) !== String(selectedObjectId));
    setObjects(updated);
    pushHistory(updated);
    setSelectedObjectId(null);
    setHasUnsavedChanges(true);
    showToast(`Deleted "${label}"`);
  };

  const handleClearAllObjects = () => {
    if (objects.length === 0) {
      showToast('Canvas is already empty', 'error');
      return;
    }
    const count = objects.length;
    setObjects([]);
    pushHistory([]);
    setSelectedObjectId(null);
    setHasUnsavedChanges(true);
    showToast(`Cleared all ${count} components from floor plan layout`);
  };

  const handleContextMenuObj = (e: React.MouseEvent, obj: FloorObjectRecord) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedObjectId(obj.id);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      objId: obj.id
    });
  };

  const handleRotateSelected = () => {
    if (!selectedObjectId) return;
    setObjects(prev => prev.map(o => String(o.id) === String(selectedObjectId) ? { ...o, rotation: (o.rotation + 90) % 360 } : o));
    setHasUnsavedChanges(true);
  };

  // Vertex Dragging for Polygon Shapes
  const handlePolygonVertexDrag = (vertexIdx: number, dx: number, dy: number) => {
    if (!selectedObjectId) return;
    setObjects(prev => prev.map(o => {
      if (String(o.id) !== String(selectedObjectId) || !o.points) return o;
      const updatedPts = [...o.points];
      updatedPts[vertexIdx] = {
        x: Math.max(0, updatedPts[vertexIdx].x + dx),
        y: Math.max(0, updatedPts[vertexIdx].y + dy)
      };
      return { ...o, points: updatedPts };
    }));
    setHasUnsavedChanges(true);
  };

  // Auto-generate outer walls matching building shape perimeter
  const handleGenerateOuterWalls = () => {
    if (!buildingBoundaryPoints || buildingBoundaryPoints.length < 3) {
      showToast('No building boundary points available', 'error');
      return;
    }

    const wallObjects: FloorObjectRecord[] = [];
    const len = buildingBoundaryPoints.length;

    for (let i = 0; i < len; i++) {
      const p1 = buildingBoundaryPoints[i];
      const p2 = buildingBoundaryPoints[(i + 1) % len];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const wallLength = Math.hypot(dx, dy);
      const angleRad = Math.atan2(dy, dx);
      const angleDeg = (angleRad * 180) / Math.PI;

      wallObjects.push({
        id: `wall_gen_${Date.now()}_${i}`,
        floor_id: floorId,
        object_type: 'wall',
        label: `Outer Wall ${i + 1}`,
        geometry_type: 'RECTANGLE',
        x: p1.x,
        y: p1.y,
        width: Math.round(wallLength),
        height: 12,
        rotation: Math.round(angleDeg),
        z_index: 1,
        visible: true,
        fill_color: '#334155',
        stroke_color: '#94A3B8',
        stroke_width: 2,
        locked: false
      });
    }

    const updated = [...objects, ...wallObjects];
    setObjects(updated);
    pushHistory(updated);
    setHasUnsavedChanges(true);
    showToast(`Generated ${wallObjects.length} outer perimeter walls matching building shape!`);
  };

  // Add preset rooms aligned inside the building outline
  const handleCreatePresetRoom = (type: 'Classroom' | 'Lab' | 'Office' | 'Washroom') => {
    const minX = Math.min(...buildingBoundaryPoints.map(p => p.x));
    const minY = Math.min(...buildingBoundaryPoints.map(p => p.y));

    const roomWidths = { Classroom: 140, Lab: 180, Office: 100, Washroom: 80 };
    const roomHeights = { Classroom: 100, Lab: 120, Office: 80, Washroom: 70 };
    const roomColors = {
      Classroom: '#3B82F6',
      Lab: '#8B5CF6',
      Office: '#10B981',
      Washroom: '#F59E0B'
    };

    const count = objects.filter(o => o.object_type === 'room').length + 1;

    const newRoom: FloorObjectRecord = {
      id: `room_${Date.now()}`,
      floor_id: floorId,
      object_type: 'room',
      label: `${type} R-${100 + count}`,
      geometry_type: 'RECTANGLE',
      x: minX + 30 + ((count * 40) % 320),
      y: minY + 30 + ((count * 30) % 200),
      width: roomWidths[type],
      height: roomHeights[type],
      rotation: 0,
      z_index: 2,
      visible: true,
      fill_color: roomColors[type],
      stroke_color: '#FFFFFF',
      stroke_width: 2,
      locked: false
    };

    const updated = [...objects, newRoom];
    setObjects(updated);
    pushHistory(updated);
    setSelectedObjectId(newRoom.id);
    setHasUnsavedChanges(true);
    showToast(`Added ${type} inside floor boundary`);
  };

  const selectedObj = objects.find(o => String(o.id) === String(selectedObjectId));

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 text-white flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-xs font-bold">Loading Interactive CAD Floor Editor...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP TOOLBAR */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1"
          >
            ← Exit Editor
          </button>

          <div className="h-6 w-px bg-slate-800" />

          <div>
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              {floor?.name || 'Floor Plan CAD Editor'}
            </h2>
            <p className="text-[10px] text-slate-400">
              {hasUnsavedChanges ? '⚠️ Unsaved Changes' : '✓ Saved to Database'}
            </p>
          </div>
        </div>

        {/* Center Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={handleUndo}
            disabled={historyIdx <= 0}
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 text-slate-300"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIdx >= history.length - 1}
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 text-slate-300"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 my-auto mx-1" />

          <button onClick={() => setZoomLevel(prev => Math.max(10, prev - 10))} className="p-1.5 hover:bg-slate-800 rounded-lg"><ZoomOut className="w-4 h-4" /></button>
          <span className="text-[11px] font-mono font-bold w-12 text-center text-blue-400">{zoomLevel}%</span>
          <button onClick={() => setZoomLevel(prev => Math.min(500, prev + 10))} className="p-1.5 hover:bg-slate-800 rounded-lg"><ZoomIn className="w-4 h-4" /></button>
          <button onClick={() => { setZoomLevel(100); setPanX(0); setPanY(0); }} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400" title="Fit Screen"><Maximize2 className="w-4 h-4" /></button>

          <div className="h-4 w-px bg-slate-800 my-auto mx-1" />

          <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded-lg ${showGrid ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`} title="Grid Toggle"><Grid className="w-4 h-4" /></button>
          <button onClick={() => setSnapToGrid(!snapToGrid)} className={`p-1.5 rounded-lg ${snapToGrid ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`} title="Snap to Grid"><Sliders className="w-4 h-4" /></button>
          <button onClick={() => setShowRulers(!showRulers)} className={`p-1.5 rounded-lg ${showRulers ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`} title="Rulers Toggle"><Ruler className="w-4 h-4" /></button>
          <button onClick={() => setShowBuildingOutline(!showBuildingOutline)} className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${showBuildingOutline ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`} title="Toggle Building Outer Boundary Shape">
            <Building className="w-4 h-4" />
            <span className="hidden md:inline">Boundary</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDuplicateAllComponents}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
            title="Duplicate all floor components structure"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Copy All Layout</span>
          </button>

          <button
            onClick={handleGenerateOuterWalls}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
            title="Auto-create walls matching building boundary shape"
          >
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Outer Walls</span>
          </button>

          <button
            onClick={handleSaveFloorLayout}
            disabled={saving}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Floor Plan</span>
          </button>
        </div>
      </div>

      {/* MAIN EDITOR AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT TOOLBOX BAR */}
        <div className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3 space-y-2 z-10 flex-shrink-0 overflow-y-auto scrollbar-none">
          <button
            onClick={() => setActiveTool('select')}
            className={`p-2.5 rounded-xl transition-all ${activeTool === 'select' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
            title="Selection Tool"
          >
            <MousePointer2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTool('pan')}
            className={`p-2.5 rounded-xl transition-all ${activeTool === 'pan' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
            title="Pan Tool (Space + Drag)"
          >
            <Move className="w-5 h-5" />
          </button>

          <div className="w-8 h-px bg-slate-800 my-1" />

          {/* Category Tabs */}
          {TOOL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveToolCategory(cat.id);
                setIsToolLibraryOpen(true);
              }}
              className={`p-2.5 rounded-xl text-base transition-all relative ${activeToolCategory === cat.id && isToolLibraryOpen ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
              title={cat.label}
            >
              <span>{cat.emoji}</span>
              {activeToolCategory === cat.id && isToolLibraryOpen && (
                <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-4 bg-blue-400 rounded-l-full" />
              )}
            </button>
          ))}

          <div className="w-8 h-px bg-slate-800 my-1" />

          {/* Expand / Collapse Tool Library Drawer Toggle */}
          <button
            onClick={() => setIsToolLibraryOpen(!isToolLibraryOpen)}
            className={`p-2 rounded-xl text-xs font-bold transition-all ${isToolLibraryOpen ? 'bg-slate-800 text-blue-400 border border-slate-700' : 'text-slate-500 hover:bg-slate-800'}`}
            title={isToolLibraryOpen ? 'Collapse Tool Library' : 'Expand Tool Library'}
          >
            {isToolLibraryOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* EXPANDABLE ARCHITECTURAL TOOL LIBRARY DRAWER */}
        {isToolLibraryOpen && (
          <div className="w-64 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col z-10 flex-shrink-0 overflow-hidden shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-3 border-b border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                  <span>🛠️ Tool Library</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 text-[10px] font-mono font-bold border border-blue-700/50">
                    {ARCHITECTURAL_TOOLS.length}
                  </span>
                </span>
                <button
                  onClick={() => setIsToolLibraryOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={toolSearchQuery}
                  onChange={(e) => setToolSearchQuery(e.target.value)}
                  placeholder="Search 36 tools..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pt-1">
                {TOOL_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveToolCategory(cat.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                      activeToolCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label.replace('Building ', '').replace('Important ', '')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tools Grid List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              {ARCHITECTURAL_TOOLS.filter((t) => {
                const matchesCat = activeToolCategory === 'all' || t.category === activeToolCategory;
                const matchesSearch = !toolSearchQuery.trim() || t.label.toLowerCase().includes(toolSearchQuery.toLowerCase()) || t.description.toLowerCase().includes(toolSearchQuery.toLowerCase());
                return matchesCat && matchesSearch;
              }).map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleSelectTool(tool.id)}
                  className="w-full p-2 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 border"
                      style={{ backgroundColor: `${tool.fillColor}33`, borderColor: tool.strokeColor }}
                    >
                      {tool.emoji}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-200 group-hover:text-white truncate">
                        {tool.label}
                      </span>
                      <span className="block text-[9px] text-slate-400 font-mono truncate">
                        {tool.width} × {tool.height} px
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                    + Add
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CENTER INTERACTIVE SVG CANVAS */}
        <div
          className="flex-1 bg-slate-950 relative overflow-hidden cursor-crosshair"
          onMouseDown={(e) => {
            if (activeTool === 'pan' || e.button === 1) {
              setIsPanning(true);
              setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
            } else if ((e.target as HTMLElement).tagName === 'svg') {
              setSelectedObjectId(null);
            }
          }}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
        >
          <svg
            className="w-full h-full"
            style={{
              transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel / 100})`,
              transformOrigin: '0 0'
            }}
          >
            <defs>
              <pattern id="cad-grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              </pattern>
            </defs>

            {showGrid && <rect width="4000" height="3000" fill="url(#cad-grid)" />}

            {/* RENDER BUILDING OUTER BOUNDARY SHAPE OVERLAY */}
            {showBuildingOutline && buildingBoundaryPoints.length >= 3 && (
              <g className="building-outer-boundary-layer pointer-events-none">
                {/* Outer building footprint fill & architectural dashed stroke */}
                <polygon
                  points={buildingBoundaryPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="rgba(59, 130, 246, 0.08)"
                  stroke="#3B82F6"
                  strokeWidth="3.5"
                  strokeDasharray="8 4"
                />

                {/* Inner double architectural wall outline */}
                <polygon
                  points={buildingBoundaryPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#60A5FA"
                  strokeWidth="1.5"
                  strokeOpacity="0.7"
                />

                {/* Perimeter Edge Dimension Callouts */}
                {buildingBoundaryPoints.map((p1, i) => {
                  const p2 = buildingBoundaryPoints[(i + 1) % buildingBoundaryPoints.length];
                  const midX = (p1.x + p2.x) / 2;
                  const midY = (p1.y + p2.y) / 2;
                  const distPx = Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y));
                  return (
                    <g key={`edge_${i}`}>
                      <rect x={midX - 25} y={midY - 9} width={50} height={18} rx={4} fill="#0F172A" fillOpacity={0.9} stroke="#3B82F6" strokeWidth={1} />
                      <text x={midX} y={midY + 3} fill="#93C5FD" fontSize={9} fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        {distPx}px
                      </text>
                    </g>
                  );
                })}

                {/* Corner Vertex Nodes & Labels */}
                {buildingBoundaryPoints.map((pt, idx) => (
                  <g key={`vtx_${idx}`}>
                    <circle cx={pt.x} cy={pt.y} r={5} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={2} />
                    <text x={pt.x + 8} y={pt.y - 8} fill="#60A5FA" fontSize={10} fontWeight="bold" fontFamily="monospace">
                      V{idx + 1}
                    </text>
                  </g>
                ))}

                {/* Floating Building Footprint Header Badge with Close (X) button */}
                {(() => {
                  const minX = Math.min(...buildingBoundaryPoints.map(p => p.x));
                  const minY = Math.min(...buildingBoundaryPoints.map(p => p.y));
                  return (
                    <g transform={`translate(${minX + 10}, ${minY + 20})`} className="pointer-events-auto">
                      <rect x={-5} y={-14} width={380} height={26} rx={6} fill="#0F172A" fillOpacity={0.95} stroke="#3B82F6" strokeWidth={1.5} />
                      <text fill="#60A5FA" fontSize={11} fontWeight="bold" x={5} y={3}>
                        🏢 BUILDING PERIMETER: {floor?.building_name || 'CSE Main Block'} ({floor?.building_geometry_type || 'POLYGON'})
                      </text>
                      {/* Clickable Close (X) Icon to Remove / Hide Boundary Overlay */}
                      <g
                        transform="translate(355, 0)"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowBuildingOutline(false);
                          showToast('Building boundary outline hidden');
                        }}
                        className="cursor-pointer hover:opacity-80"
                      >
                        <title>Remove / Hide Building Perimeter Outline</title>
                        <circle cx={0} cy={0} r={8} fill="#EF4444" />
                        <text x={-3.5} y={3.5} fill="#FFFFFF" fontSize={10} fontWeight="bold">✕</text>
                      </g>
                    </g>
                  );
                })()}
              </g>
            )}

            {/* RENDER FLOOR PLAN OBJECTS */}
            {objects.map((obj) => {
              const isSelected = String(selectedObjectId) === String(obj.id);
              const strokeColor = isSelected ? '#3B82F6' : (obj.stroke_color || '#1E40AF');

              return (
                <g
                  key={obj.id}
                  transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation})`}
                  onMouseDown={(e) => handleMouseDownObj(e, obj)}
                  onContextMenu={(e) => handleContextMenuObj(e, obj)}
                  className="cursor-pointer"
                >
                  {obj.geometry_type === 'CIRCLE' ? (
                    <circle
                      cx={obj.width / 2}
                      cy={obj.height / 2}
                      r={Math.min(obj.width, obj.height) / 2}
                      fill={obj.fill_color || '#3B82F6'}
                      fillOpacity={0.4}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3 : (obj.stroke_width || 2)}
                    />
                  ) : obj.geometry_type === 'POLYGON' && obj.points && obj.points.length > 0 ? (
                    <polygon
                      points={obj.points.map((p) => `${p.x - obj.x},${p.y - obj.y}`).join(' ')}
                      fill={obj.fill_color || '#3B82F6'}
                      fillOpacity={0.4}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3 : (obj.stroke_width || 2)}
                    />
                  ) : (
                    <rect
                      width={obj.width}
                      height={obj.height}
                      rx={8}
                      fill={obj.fill_color || '#3B82F6'}
                      fillOpacity={0.4}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3 : (obj.stroke_width || 2)}
                    />
                  )}

                  {/* Label */}
                  <text
                    x={obj.width / 2}
                    y={obj.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#FFFFFF"
                    fontSize={11}
                    fontWeight="bold"
                    pointerEvents="none"
                  >
                    {obj.label || obj.object_type}
                  </text>

                  {/* RESIZE, ROTATE & FLOATING TRASH / DUPLICATE HANDLES FOR SELECTED OBJECT */}
                  {isSelected && !obj.locked && (
                    <>
                      {/* Floating Rotate Handle */}
                      <circle cx={obj.width / 2} cy={-22} r={8} fill="#F59E0B" stroke="#FFFFFF" strokeWidth={2} onClick={handleRotateSelected} className="cursor-pointer">
                        <title>Rotate 90°</title>
                      </circle>

                      {/* Floating Trash / Delete Handle */}
                      <g
                        transform={`translate(${obj.width / 2 + 25}, -22)`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSelected();
                        }}
                        className="cursor-pointer hover:opacity-80"
                      >
                        <title>Delete Component</title>
                        <circle cx={0} cy={0} r={9} fill="#EF4444" stroke="#FFFFFF" strokeWidth={2} />
                        <text x={-4} y={3.5} fill="#FFFFFF" fontSize={10} fontWeight="bold">✕</text>
                      </g>

                      {/* Floating Duplicate Handle */}
                      <g
                        transform={`translate(${obj.width / 2 - 25}, -22)`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateSelected();
                        }}
                        className="cursor-pointer hover:opacity-80"
                      >
                        <title>Duplicate Component</title>
                        <circle cx={0} cy={0} r={9} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={2} />
                        <text x={-4} y={3.5} fill="#FFFFFF" fontSize={10} fontWeight="bold">+</text>
                      </g>

                      {/* Corner Resize Handles */}
                      <rect x={-5} y={-5} width={10} height={10} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={2} onMouseDown={(e) => handleMouseDownResizeHandle(e, 'nw')} className="cursor-nwse-resize" />
                      <rect x={obj.width - 5} y={-5} width={10} height={10} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={2} onMouseDown={(e) => handleMouseDownResizeHandle(e, 'ne')} className="cursor-nesw-resize" />
                      <rect x={obj.width - 5} y={obj.height - 5} width={10} height={10} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={2} onMouseDown={(e) => handleMouseDownResizeHandle(e, 'se')} className="cursor-nwse-resize" />
                      <rect x={-5} y={obj.height - 5} width={10} height={10} fill="#3B82F6" stroke="#FFFFFF" strokeWidth={2} onMouseDown={(e) => handleMouseDownResizeHandle(e, 'sw')} className="cursor-nesw-resize" />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* RIGHT DYNAMIC PROPERTIES PANEL */}
        <div className="w-72 bg-slate-900 border-l border-slate-800 p-4 space-y-4 flex-shrink-0 overflow-y-auto">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
            Object Properties
          </h3>

          {selectedObj ? (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-400 mb-1">Object Label / Name</label>
                <input
                  type="text"
                  value={selectedObj.label || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setObjects(prev => prev.map(o => String(o.id) === String(selectedObjectId) ? { ...o, label: val } : o));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Position X</label>
                  <input
                    type="number"
                    value={selectedObj.x}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setObjects(prev => prev.map(o => String(o.id) === String(selectedObjectId) ? { ...o, x: val } : o));
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Position Y</label>
                  <input
                    type="number"
                    value={selectedObj.y}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setObjects(prev => prev.map(o => String(o.id) === String(selectedObjectId) ? { ...o, y: val } : o));
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={selectedObj.width}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setObjects(prev => prev.map(o => String(o.id) === String(selectedObjectId) ? { ...o, width: val } : o));
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={selectedObj.height}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setObjects(prev => prev.map(o => String(o.id) === String(selectedObjectId) ? { ...o, height: val } : o));
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Rotation Angle (°)</label>
                <input
                  type="number"
                  value={selectedObj.rotation}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setObjects(prev => prev.map(o => String(o.id) === String(selectedObjectId) ? { ...o, rotation: val } : o));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-white font-bold"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={handleDuplicateSelected}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-[11px] font-bold flex items-center gap-1 text-slate-200"
                >
                  <Copy className="w-3.5 h-3.5" /> Duplicate
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-xl text-[11px] font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-blue-400 font-bold">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>Building Boundary Info</span>
                  </div>
                  <button
                    onClick={() => setShowBuildingOutline(!showBuildingOutline)}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 cursor-pointer"
                    title="Toggle outer building perimeter boundary overlay"
                  >
                    {showBuildingOutline ? '✕ Hide Boundary' : '👁️ Show Boundary'}
                  </button>
                </div>
                <div className="space-y-1 text-slate-300 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Building:</span>
                    <span className="font-bold text-white">{floor?.building_name || 'Main Block'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Geometry:</span>
                    <span className="font-bold text-amber-400">{floor?.building_geometry_type || 'POLYGON'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Boundary Nodes:</span>
                    <span className="font-bold text-emerald-400">{buildingBoundaryPoints.length} Vertices</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-400">Quick Room Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCreatePresetRoom('Classroom')}
                    className="p-2 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/50 rounded-xl text-blue-300 font-bold text-[11px] text-left flex flex-col gap-1"
                  >
                    <span>+ Classroom</span>
                    <span className="text-[9px] text-blue-400 font-normal">140 x 100 px</span>
                  </button>
                  <button
                    onClick={() => handleCreatePresetRoom('Lab')}
                    className="p-2 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 rounded-xl text-purple-300 font-bold text-[11px] text-left flex flex-col gap-1"
                  >
                    <span>+ Laboratory</span>
                    <span className="text-[9px] text-purple-400 font-normal">180 x 120 px</span>
                  </button>
                  <button
                    onClick={() => handleCreatePresetRoom('Office')}
                    className="p-2 bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 rounded-xl text-emerald-300 font-bold text-[11px] text-left flex flex-col gap-1"
                  >
                    <span>+ Office Room</span>
                    <span className="text-[9px] text-emerald-400 font-normal">100 x 80 px</span>
                  </button>
                  <button
                    onClick={() => handleCreatePresetRoom('Washroom')}
                    className="p-2 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/50 rounded-xl text-amber-300 font-bold text-[11px] text-left flex flex-col gap-1"
                  >
                    <span>+ Washroom</span>
                    <span className="text-[9px] text-amber-400 font-normal">80 x 70 px</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <button
                  onClick={handleGenerateOuterWalls}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>Generate Building Outer Walls</span>
                </button>

                <button
                  onClick={handleClearAllObjects}
                  className="w-full py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Clear All Canvas Objects</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center font-medium bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                💡 <strong>Tip:</strong> Double-click & drag (or Alt + Drag) any element to copy. Right-click or use the red ✕ handle to delete.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT CLICK CONTEXT MENU */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 w-48 text-xs font-bold space-y-1 text-slate-200"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              handleDeleteSelected();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 hover:bg-rose-600/20 text-rose-400 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Delete Component</span>
          </button>
          <button
            onClick={() => {
              handleDuplicateSelected();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <Copy className="w-4 h-4 text-blue-400" />
            <span>Duplicate</span>
          </button>
          <button
            onClick={() => {
              handleRotateSelected();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <RotateCw className="w-4 h-4 text-amber-400" />
            <span>Rotate 90°</span>
          </button>
        </div>
      )}
    </div>
  );
};
export default FloorEditor;
