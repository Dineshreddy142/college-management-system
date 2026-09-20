import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Save, Undo, Redo, ZoomIn, ZoomOut, Maximize2, Grid, Ruler, Layers, Eye,
  Play, Upload, Download, MousePointer2, Move, Square, Circle, Minus, Hexagon,
  Type, DoorOpen, Footprints, Sparkles, Building, ChevronRight, X, Copy,
  Trash2, Lock, Unlock, ArrowUp, ArrowDown, Check, AlertCircle, RefreshCw,
  Plus, RotateCw, AlignLeft, AlignCenter, AlignRight, Sliders, Shield, Search,
  Box, Compass, FileText, Image, Palette, Users, FileDown, Layers3, Monitor, CheckCircle2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { blockService, FloorRecord, FloorObjectRecord, FloorLayerRecord, GeometryType, Point } from '../../../api/blockService';

const GRID_SIZE = 20;

export interface DepartmentInfo {
  code: string;
  name: string;
  fill: string;
  stroke: string;
  badgeBg: string;
  badgeText: string;
}

export const DEPARTMENT_MAP: Record<string, DepartmentInfo> = {
  CSE: { code: 'CSE', name: 'Computer Science (CSE)', fill: '#3B82F6', stroke: '#1D4ED8', badgeBg: 'bg-blue-900/60', badgeText: 'text-blue-300' },
  ECE: { code: 'ECE', name: 'Electronics (ECE)', fill: '#8B5CF6', stroke: '#6D28D9', badgeBg: 'bg-purple-900/60', badgeText: 'text-purple-300' },
  MECH: { code: 'MECH', name: 'Mechanical (MECH)', fill: '#10B981', stroke: '#047857', badgeBg: 'bg-emerald-900/60', badgeText: 'text-emerald-300' },
  CIVIL: { code: 'CIVIL', name: 'Civil Engineering', fill: '#F59E0B', stroke: '#B45309', badgeBg: 'bg-amber-900/60', badgeText: 'text-amber-300' },
  ADMIN: { code: 'ADMIN', name: 'Administration', fill: '#14B8A6', stroke: '#0D9488', badgeBg: 'bg-teal-900/60', badgeText: 'text-teal-300' },
  AMENITY: { code: 'AMENITY', name: 'Facilities & Washrooms', fill: '#EC4899', stroke: '#BE185D', badgeBg: 'bg-pink-900/60', badgeText: 'text-pink-300' }
};

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
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Undo / Redo Stack History
  const [history, setHistory] = useState<FloorObjectRecord[][]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);

  // Viewport & Mode State
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // 2D / 3D Isometric View & Export State
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
  const [isometricAngle, setIsometricAngle] = useState<number>(45);
  const [isometricWallHeight, setIsometricWallHeight] = useState<number>(35);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Magnetic Snap-to-Wall & Grid State
  const [magneticSnapActive, setMagneticSnapActive] = useState<boolean>(true);
  const [activeSnapGuide, setActiveSnapGuide] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

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

  // Dragging & Resizing State
  const [isDraggingObj, setIsDraggingObj] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragGroupIds, setDragGroupIds] = useState<string[]>([]);
  const [dragGroupStartPositions, setDragGroupStartPositions] = useState<Map<string, { x: number; y: number; points?: Point[] }> | null>(null);
  const [dragStartMousePos, setDragStartMousePos] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [isPendingCopyDrag, setIsPendingCopyDrag] = useState(false);
  const [pendingCopyMouseStart, setPendingCopyMouseStart] = useState<{ clientX: number; clientY: number } | null>(null);
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

    // Create corresponding floor object
    const scale = Math.max(0.1, zoomLevel / 100);
    const snap = (v: number) => snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v;

    const newX = snap(100);
    const newY = snap(100);
    const newObjId = `obj_${Date.now()}`;

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

  // Object Dragging & Resizing Handlers
  // Note: Simple double-click does NOT clone. ONLY when user double-clicks AND drags the cursor, ALL components are duplicated together.
  const handleMouseDownObj = (e: React.MouseEvent, obj: FloorObjectRecord) => {
    e.stopPropagation();
    setContextMenu(null);
    if (obj.locked || isPreviewMode) return;

    const scale = Math.max(0.1, zoomLevel / 100);
    setSelectedObjectId(obj.id);
    setIsDraggingObj(true);

    // If double-click (e.detail >= 2) OR Alt key is held down, mark as pending copy-drag!
    if (e.detail >= 2 || e.altKey) {
      setIsPendingCopyDrag(true);
      setPendingCopyMouseStart({ clientX: e.clientX, clientY: e.clientY });
    } else {
      setIsPendingCopyDrag(false);
      setPendingCopyMouseStart(null);
    }

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

    // If a copy-drag is pending (double-click down) AND the mouse has actually started moving/dragging:
    if (isPendingCopyDrag && pendingCopyMouseStart) {
      const dist = Math.hypot(e.clientX - pendingCopyMouseStart.clientX, e.clientY - pendingCopyMouseStart.clientY);
      if (dist > 4) {
        // NOW duplicate ALL components on the canvas!
        setIsPendingCopyDrag(false);

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

        setDragGroupIds(groupIds);
        setDragGroupStartPositions(startPositionsMap);
        setDragStartMousePos({
          mouseX: e.clientX / scale,
          mouseY: e.clientY / scale
        });

        showToast(`Copied structure (all ${objects.length} components)! Dragging copy...`);
        return;
      }
    }

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
        let newX = snap(e.clientX / scale - dragOffset.x);
        let newY = snap(e.clientY / scale - dragOffset.y);

        const currentObj = objects.find(o => String(o.id) === String(selectedObjectId));

        if (currentObj && magneticSnapActive) {
          const objType = (currentObj.object_type || '').toLowerCase();
          const isDoorOrWindow = objType === 'door' || objType === 'window';

          // Collect wall segments from existing wall objects & building boundary lines
          const wallSegments: Array<{ p1: Point; p2: Point; angle: number }> = [];

          objects.filter(o => String(o.id) !== String(selectedObjectId) && (o.object_type === 'wall' || o.object_type === 'WALL')).forEach(w => {
            const rad = (w.rotation * Math.PI) / 180;
            const p1 = { x: w.x, y: w.y };
            const p2 = { x: w.x + w.width * Math.cos(rad), y: w.y + w.width * Math.sin(rad) };
            wallSegments.push({ p1, p2, angle: w.rotation });
          });

          if (buildingBoundaryPoints && buildingBoundaryPoints.length >= 3) {
            for (let i = 0; i < buildingBoundaryPoints.length; i++) {
              const p1 = buildingBoundaryPoints[i];
              const p2 = buildingBoundaryPoints[(i + 1) % buildingBoundaryPoints.length];
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
              wallSegments.push({ p1, p2, angle: (angle + 360) % 360 });
            }
          }

          const centerX = newX + currentObj.width / 2;
          const centerY = newY + currentObj.height / 2;

          let closestDist = Infinity;
          let bestProj: Point | null = null;
          let bestAngle = 0;

          wallSegments.forEach(seg => {
            const l2 = Math.hypot(seg.p2.x - seg.p1.x, seg.p2.y - seg.p1.y);
            if (l2 === 0) return;
            let t = ((centerX - seg.p1.x) * (seg.p2.x - seg.p1.x) + (centerY - seg.p1.y) * (seg.p2.y - seg.p1.y)) / (l2 * l2);
            t = Math.max(0, Math.min(1, t));
            const projX = seg.p1.x + t * (seg.p2.x - seg.p1.x);
            const projY = seg.p1.y + t * (seg.p2.y - seg.p1.y);
            const dist = Math.hypot(centerX - projX, centerY - projY);

            if (dist < closestDist) {
              closestDist = dist;
              bestProj = { x: projX, y: projY };
              bestAngle = seg.angle;
            }
          });

          if (isDoorOrWindow && closestDist <= 35 && bestProj) {
            // Feature A: Auto Door & Window Snap-to-Wall + Orientation Rotation!
            newX = Math.round(bestProj.x - currentObj.width / 2);
            newY = Math.round(bestProj.y - currentObj.height / 2);
            const targetRotation = Math.round(bestAngle);

            setActiveSnapGuide({
              x1: bestProj.x - 20,
              y1: bestProj.y - 20,
              x2: bestProj.x + 20,
              y2: bestProj.y + 20
            });

            setObjects(prev => prev.map(o => String(o.id) === String(selectedObjectId) ? {
              ...o,
              x: Math.max(0, newX),
              y: Math.max(0, newY),
              rotation: targetRotation
            } : o));
            setHasUnsavedChanges(true);
            return;
          } else if (closestDist <= 15 && bestProj) {
            // Magnetic alignment to prevent 1-2px awkward gaps against walls
            newX = Math.round(bestProj.x - currentObj.width / 2);
            newY = Math.round(bestProj.y - currentObj.height / 2);
            setActiveSnapGuide({
              x1: bestProj.x - 30,
              y1: bestProj.y - 30,
              x2: bestProj.x + 30,
              y2: bestProj.y + 30
            });
          } else {
            setActiveSnapGuide(null);
          }
        }

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
  }, [isPanning, panStart, isPreviewMode, selectedObjectId, isDraggingObj, dragOffset, isPendingCopyDrag, pendingCopyMouseStart, objects, dragGroupIds, dragGroupStartPositions, dragStartMousePos, resizeHandle, resizeStartPos, snapToGrid, zoomLevel]);

  const handleMouseUpCanvas = () => {
    if (isDraggingObj || resizeHandle) {
      pushHistory(objects);
    }
    setIsPanning(false);
    setIsDraggingObj(false);
    setIsPendingCopyDrag(false);
    setPendingCopyMouseStart(null);
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

  // Export Floor Blueprint Methods (PNG / PDF)
  const handleExportPNG = async () => {
    try {
      const el = canvasContainerRef.current;
      if (!el) return;
      showToast('Exporting high-resolution PNG blueprint...', 'success');
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#090D16',
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `${floor?.name || 'Floor'}_Blueprint_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Downloaded High-Res PNG Blueprint!');
      setShowExportModal(false);
    } catch (err: any) {
      showToast('Failed to export PNG blueprint', 'error');
    }
  };

  const handleExportPDF = async () => {
    try {
      const el = canvasContainerRef.current;
      if (!el) return;
      showToast('Generating architectural printable PDF blueprint...', 'success');
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#090D16',
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Blueprint Header Block
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pdfWidth, 18, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${floor?.building_name || 'Main Block'} - ${floor?.name || 'Floor Plan'} Architectural Blueprint`, 10, 11);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Date: ${new Date().toLocaleDateString()} | Scale 1:100 | College CAD System`, pdfWidth - 85, 11);

      // Blueprint Canvas Screenshot Image
      pdf.addImage(imgData, 'PNG', 10, 22, pdfWidth - 20, pdfHeight - 34);

      // Blueprint Summary Footer Bar
      pdf.setFillColor(30, 41, 59);
      pdf.rect(0, pdfHeight - 9, pdfWidth, 9, 'F');
      pdf.setTextColor(226, 232, 240);
      pdf.setFontSize(8);

      const totalArea = objects.reduce((acc, o) => acc + Math.round((o.width * o.height) / 10), 0);
      const totalSeats = objects.reduce((acc, o) => acc + Math.round((o.width * o.height) / 10 * 0.35), 0);

      pdf.text(`Total Floor Area: ${totalArea} m²  |  Seating Capacity: ${totalSeats} Seats  |  Total Components: ${objects.length}`, 10, pdfHeight - 3);
      pdf.text(`Official College Floor Blueprint - Administration Copy`, pdfWidth - 75, pdfHeight - 3);

      pdf.save(`${floor?.name || 'Floor'}_Blueprint_${Date.now()}.pdf`);
      showToast('Downloaded Architectural Printable PDF Blueprint!');
      setShowExportModal(false);
    } catch (err: any) {
      showToast('Failed to export PDF blueprint', 'error');
    }
  };

  // Add preset rooms aligned inside the building outline
  const handleCreatePresetRoom = (type: 'Classroom' | 'Lab' | 'Office' | 'Washroom' | 'Seminar' | 'Cafeteria') => {
    const minX = Math.min(...buildingBoundaryPoints.map(p => p.x));
    const minY = Math.min(...buildingBoundaryPoints.map(p => p.y));

    const roomWidths = { Classroom: 140, Lab: 180, Office: 100, Washroom: 80, Seminar: 220, Cafeteria: 200 };
    const roomHeights = { Classroom: 100, Lab: 120, Office: 80, Washroom: 70, Seminar: 150, Cafeteria: 140 };
    const deptCodes: Record<string, string> = {
      Classroom: 'CSE',
      Lab: 'ECE',
      Office: 'ADMIN',
      Washroom: 'AMENITY',
      Seminar: 'MECH',
      Cafeteria: 'CIVIL'
    };

    const deptCode = deptCodes[type] || 'CSE';
    const deptInfo = DEPARTMENT_MAP[deptCode] || DEPARTMENT_MAP.CSE;
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
      fill_color: deptInfo.fill,
      stroke_color: deptInfo.stroke,
      stroke_width: 2,
      locked: false,
      properties: {
        roomType: type,
        department: deptCode,
        capacity: Math.round(((roomWidths[type] * roomHeights[type]) / 10) * 0.35),
        status: 'Available'
      }
    };

    const updated = [...objects, newRoom];
    setObjects(updated);
    pushHistory(updated);
    setSelectedObjectId(newRoom.id);
    setHasUnsavedChanges(true);
    showToast(`Added ${type} (${deptCode}) inside floor boundary`);
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
          <button onClick={() => setMagneticSnapActive(!magneticSnapActive)} className={`p-1.5 rounded-lg flex items-center gap-1 ${magneticSnapActive ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`} title="Magnetic Wall & Grid Snap Toggle">
            <Sliders className="w-4 h-4" />
            <span className="text-[10px] font-bold hidden xl:inline">Magnetic Snap</span>
          </button>
          <button onClick={() => setShowRulers(!showRulers)} className={`p-1.5 rounded-lg ${showRulers ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`} title="Rulers Toggle"><Ruler className="w-4 h-4" /></button>
          <button onClick={() => setShowBuildingOutline(!showBuildingOutline)} className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${showBuildingOutline ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`} title="Toggle Building Outer Boundary Shape">
            <Building className="w-4 h-4" />
            <span className="hidden md:inline">Boundary</span>
          </button>
        </div>

        {/* Feature D & Feature C Top Actions: 2D/3D Mode & Export Blueprint */}
        <div className="flex items-center gap-2">
          {/* 2D / 3D Isometric View Mode Toggle (Feature D) */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('2D')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${viewMode === '2D' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>2D CAD</span>
            </button>
            <button
              onClick={() => setViewMode('3D')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${viewMode === '3D' ? 'bg-purple-600 text-white shadow animate-pulse' : 'text-purple-400 hover:text-white'}`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D View</span>
            </button>
          </div>

          {/* Export Blueprint Button (Feature C) */}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            title="Export High-Res Blueprint PNG or PDF"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Blueprint</span>
          </button>

          <button
            onClick={handleDuplicateAllComponents}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
            title="Duplicate all floor components structure"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Copy All Layout</span>
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
        {/* LEFT TOOLBOX */}
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

          {/* Tools List */}
          {[
            { id: 'rectangle', icon: Square, label: 'Rectangle' },
            { id: 'circle', icon: Circle, label: 'Circle' },
            { id: 'polygon', icon: Hexagon, label: 'Polygon / L-Shape' },
            { id: 'classroom', icon: DoorOpen, label: 'Classroom' },
            { id: 'lab', icon: Sparkles, label: 'Laboratory' },
            { id: 'stairs', icon: Footprints, label: 'Stairs / Elevator' },
            { id: 'door', icon: Building, label: 'Door / Entrance' }
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => handleSelectTool(t.id)}
                className={`p-2.5 rounded-xl transition-all ${activeTool === t.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
                title={t.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        {/* CENTER INTERACTIVE CANVAS (2D SVG OR 3D ISOMETRIC VIEW) */}
        <div
          ref={canvasContainerRef}
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
          {viewMode === '2D' ? (
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

              {/* Magnetic Wall Snap Visual Alignment Guide (Feature A & Usability) */}
              {activeSnapGuide && (
                <g className="pointer-events-none z-30">
                  <circle cx={activeSnapGuide.x1 + 20} cy={activeSnapGuide.y1 + 20} r={12} fill="rgba(34, 211, 238, 0.2)" stroke="#22D3EE" strokeWidth={2} className="animate-ping" />
                  <line x1={activeSnapGuide.x1} y1={activeSnapGuide.y1} x2={activeSnapGuide.x2} y2={activeSnapGuide.y2} stroke="#22D3EE" strokeWidth={2} strokeDasharray="4 2" />
                </g>
              )}

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

                // Feature B: Real-Time Room Area & Seating Capacity Metrics
                const areaSqM = Math.max(1, Math.round((obj.width * obj.height) / 10));
                const capacity = Math.max(0, Math.round(areaSqM * 0.35));

                const isFilteredOut = selectedDeptFilter && obj.properties?.department !== selectedDeptFilter;

                return (
                  <g
                    key={obj.id}
                    transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation})`}
                    onMouseDown={(e) => handleMouseDownObj(e, obj)}
                    onContextMenu={(e) => handleContextMenuObj(e, obj)}
                    className={`cursor-pointer transition-opacity ${isFilteredOut ? 'opacity-25' : 'opacity-100'}`}
                  >
                    {obj.geometry_type === 'CIRCLE' ? (
                      <circle
                        cx={obj.width / 2}
                        cy={obj.height / 2}
                        r={Math.min(obj.width, obj.height) / 2}
                        fill={obj.fill_color || '#3B82F6'}
                        fillOpacity={0.45}
                        stroke={strokeColor}
                        strokeWidth={isSelected ? 3 : (obj.stroke_width || 2)}
                      />
                    ) : obj.geometry_type === 'POLYGON' && obj.points && obj.points.length > 0 ? (
                      <polygon
                        points={obj.points.map((p) => `${p.x - obj.x},${p.y - obj.y}`).join(' ')}
                        fill={obj.fill_color || '#3B82F6'}
                        fillOpacity={0.45}
                        stroke={strokeColor}
                        strokeWidth={isSelected ? 3 : (obj.stroke_width || 2)}
                      />
                    ) : (
                      <rect
                        width={obj.width}
                        height={obj.height}
                        rx={8}
                        fill={obj.fill_color || '#3B82F6'}
                        fillOpacity={0.45}
                        stroke={strokeColor}
                        strokeWidth={isSelected ? 3 : (obj.stroke_width || 2)}
                      />
                    )}

                    {/* Feature B: Real-Time Label & Area + Seating Capacity Display */}
                    <text
                      x={obj.width / 2}
                      y={obj.height > 40 ? obj.height / 2 - 7 : obj.height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#FFFFFF"
                      fontSize={11}
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      {obj.label || obj.object_type}
                    </text>

                    {/* Seating & Square Meters sub-text badge */}
                    {obj.height > 40 && obj.object_type !== 'wall' && (
                      <text
                        x={obj.width / 2}
                        y={obj.height / 2 + 8}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="rgba(255,255,255,0.85)"
                        fontSize={9}
                        fontWeight="600"
                        pointerEvents="none"
                      >
                        ({areaSqM} m² | {capacity} Seats)
                      </text>
                    )}

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
          ) : (
            /* FEATURE D: INTERACTIVE 3D ISOMETRIC BUILDING CANVAS VIEW */
            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden select-none">
              {/* 3D Viewport Controls Floating Header */}
              <div className="absolute top-4 left-4 z-30 bg-slate-900/90 border border-purple-500/40 p-3 rounded-2xl shadow-2xl backdrop-blur-md space-y-2 text-xs">
                <div className="flex items-center gap-2 text-purple-400 font-black">
                  <Box className="w-4 h-4 animate-bounce text-purple-400" />
                  <span>3D Isometric Floor View Mode</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Orbit Angle:</span>
                  <div className="flex gap-1">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map(ang => (
                      <button
                        key={ang}
                        onClick={() => setIsometricAngle(ang)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold ${isometricAngle === ang ? 'bg-purple-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                      >
                        {ang}°
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-bold">Extrusion Height:</span>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={isometricWallHeight}
                    onChange={(e) => setIsometricWallHeight(Number(e.target.value))}
                    className="w-28 accent-purple-500 cursor-pointer"
                  />
                  <span className="font-mono text-purple-300 font-bold">{isometricWallHeight}px</span>
                </div>
              </div>

              {/* Interactive 3D Extruded SVG Container */}
              <div className="w-full h-full flex items-center justify-center p-8 overflow-auto">
                <svg
                  width="1000"
                  height="800"
                  viewBox="0 0 1000 800"
                  className="transition-transform duration-300 ease-out"
                >
                  <defs>
                    <linearGradient id="wall3dGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#475569" />
                      <stop offset="100%" stopColor="#1E293B" />
                    </linearGradient>
                  </defs>

                  {/* 3D Isometric Projection Transform Group */}
                  <g transform={`translate(500, 350) rotate(${isometricAngle - 45}) scale(0.85, 0.5)`}>
                    {/* 3D Floor Base Grid */}
                    <rect x="-400" y="-300" width="800" height="600" rx="16" fill="#090D16" stroke="#3B82F6" strokeWidth="2" strokeDasharray="6 3" />

                    {/* 3D Extruded Objects */}
                    {objects.map((obj, i) => {
                      const areaSqM = Math.max(1, Math.round((obj.width * obj.height) / 10));
                      const capacity = Math.max(0, Math.round(areaSqM * 0.35));
                      const isWall = obj.object_type === 'wall';
                      const h = isWall ? isometricWallHeight * 1.2 : isometricWallHeight;

                      return (
                        <g key={`3d_${obj.id}_${i}`} transform={`translate(${obj.x - 300}, ${obj.y - 200})`}>
                          {/* 3D Floor Shadow */}
                          <rect
                            x={4}
                            y={4}
                            width={obj.width}
                            height={obj.height}
                            fill="#000000"
                            fillOpacity={0.5}
                            rx={4}
                          />

                          {/* 3D Side Depth Extrusion Faces */}
                          <polygon
                            points={`0,${obj.height} ${obj.width},${obj.height} ${obj.width},${obj.height - h} 0,${obj.height - h}`}
                            fill="#1E293B"
                            stroke="#334155"
                            strokeWidth="1"
                          />
                          <polygon
                            points={`${obj.width},0 ${obj.width},${obj.height} ${obj.width + h / 2},${obj.height - h / 2} ${obj.width + h / 2},${-h / 2}`}
                            fill="#0F172A"
                            stroke="#334155"
                            strokeWidth="1"
                          />

                          {/* 3D Top Roof / Cap Face */}
                          <rect
                            x={0}
                            y={-h}
                            width={obj.width}
                            height={obj.height}
                            rx={4}
                            fill={isWall ? '#334155' : (obj.fill_color || '#3B82F6')}
                            fillOpacity={isWall ? 1 : 0.65}
                            stroke={obj.stroke_color || '#60A5FA'}
                            strokeWidth={2}
                          />

                          {/* 3D Floating Label & Metrics */}
                          <text
                            x={obj.width / 2}
                            y={obj.height / 2 - h - 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#FFFFFF"
                            fontSize={12}
                            fontWeight="extrabold"
                          >
                            {obj.label || obj.object_type}
                          </text>
                          {!isWall && (
                            <text
                              x={obj.width / 2}
                              y={obj.height / 2 - h + 12}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#93C5FD"
                              fontSize={9}
                              fontWeight="bold"
                            >
                              {areaSqM} m² | {capacity} Seats
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>
            </div>
          )}

          {/* FEATURE E: INTERACTIVE DEPARTMENT COLOR LEGENDS OVERLAY */}
          <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl shadow-2xl backdrop-blur-md space-y-1.5 text-xs max-w-md">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <span className="font-bold text-slate-300 flex items-center gap-1 text-[11px]">
                <Palette className="w-3.5 h-3.5 text-blue-400" />
                <span>Department Color Legends</span>
              </span>
              {selectedDeptFilter && (
                <button
                  onClick={() => setSelectedDeptFilter(null)}
                  className="text-[10px] text-rose-400 hover:underline font-bold"
                >
                  Clear Filter
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(DEPARTMENT_MAP).map(([code, dept]) => {
                const count = objects.filter(o => o.properties?.department === code).length;
                const isSel = selectedDeptFilter === code;
                return (
                  <button
                    key={code}
                    onClick={() => setSelectedDeptFilter(isSel ? null : code)}
                    className={`px-2 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${isSel ? 'border-white shadow-lg scale-105' : 'border-slate-800 hover:border-slate-700'}`}
                    style={{ backgroundColor: dept.fill + '25', color: '#FFFFFF' }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.fill }} />
                    <span>{code}</span>
                    <span className="text-[9px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FEATURE B: CANVAS LIVE FLOOR METRICS & STATS SUMMARY BAR */}
          <div className="absolute bottom-4 right-80 z-20 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-4 text-xs font-bold text-slate-200">
            {(() => {
              const totalArea = objects.reduce((acc, o) => acc + Math.round((o.width * o.height) / 10), 0);
              const totalSeats = objects.reduce((acc, o) => acc + Math.round((o.width * o.height) / 10 * 0.35), 0);
              const roomCount = objects.filter(o => o.object_type === 'room').length;
              return (
                <>
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Area: <strong className="text-white">{totalArea} m²</strong></span>
                  </div>
                  <div className="h-3 w-px bg-slate-800" />
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>Seats: <strong className="text-white">{totalSeats}</strong></span>
                  </div>
                  <div className="h-3 w-px bg-slate-800" />
                  <div className="flex items-center gap-1.5 text-purple-400">
                    <DoorOpen className="w-3.5 h-3.5" />
                    <span>Rooms: <strong className="text-white">{roomCount}</strong></span>
                  </div>
                </>
              );
            })()}
          </div>
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

              {/* Department Color Legend Selector (Feature E) */}
              {selectedObj.object_type === 'room' && (
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Department / Category</label>
                  <select
                    value={selectedObj.properties?.department || 'CSE'}
                    onChange={(e) => {
                      const deptCode = e.target.value;
                      const info = DEPARTMENT_MAP[deptCode] || DEPARTMENT_MAP.CSE;
                      setObjects(prev => prev.map(o => String(o.id) === String(selectedObjectId) ? {
                        ...o,
                        fill_color: info.fill,
                        stroke_color: info.stroke,
                        properties: { ...o.properties, department: deptCode }
                      } : o));
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold cursor-pointer"
                  >
                    {Object.entries(DEPARTMENT_MAP).map(([code, d]) => (
                      <option key={code} value={code}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Feature B: Real-Time Calculated Metrics */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-center">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Area (m²)</span>
                  <span className="text-sm font-black text-blue-400">
                    {Math.max(1, Math.round((selectedObj.width * selectedObj.height) / 10))} m²
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Est. Capacity</span>
                  <span className="text-sm font-black text-emerald-400">
                    {Math.max(0, Math.round((selectedObj.width * selectedObj.height) / 10 * 0.35))} Seats
                  </span>
                </div>
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

              {/* 1-Click Room Preset Buttons */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-400">1-Click Room Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCreatePresetRoom('Classroom')}
                    className="p-2 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/50 rounded-xl text-blue-300 font-bold text-[11px] text-left flex flex-col gap-1 cursor-pointer"
                  >
                    <span>+ Classroom</span>
                    <span className="text-[9px] text-blue-400 font-normal">140x100px • CSE</span>
                  </button>
                  <button
                    onClick={() => handleCreatePresetRoom('Lab')}
                    className="p-2 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 rounded-xl text-purple-300 font-bold text-[11px] text-left flex flex-col gap-1 cursor-pointer"
                  >
                    <span>+ Laboratory</span>
                    <span className="text-[9px] text-purple-400 font-normal">180x120px • ECE</span>
                  </button>
                  <button
                    onClick={() => handleCreatePresetRoom('Office')}
                    className="p-2 bg-teal-900/40 hover:bg-teal-800/60 border border-teal-700/50 rounded-xl text-teal-300 font-bold text-[11px] text-left flex flex-col gap-1 cursor-pointer"
                  >
                    <span>+ Office Room</span>
                    <span className="text-[9px] text-teal-400 font-normal">100x80px • ADMIN</span>
                  </button>
                  <button
                    onClick={() => handleCreatePresetRoom('Washroom')}
                    className="p-2 bg-pink-900/40 hover:bg-pink-800/60 border border-pink-700/50 rounded-xl text-pink-300 font-bold text-[11px] text-left flex flex-col gap-1 cursor-pointer"
                  >
                    <span>+ Washroom</span>
                    <span className="text-[9px] text-pink-400 font-normal">80x70px • FACILITY</span>
                  </button>
                  <button
                    onClick={() => handleCreatePresetRoom('Seminar')}
                    className="p-2 bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 rounded-xl text-emerald-300 font-bold text-[11px] text-left flex flex-col gap-1 cursor-pointer"
                  >
                    <span>+ Seminar Hall</span>
                    <span className="text-[9px] text-emerald-400 font-normal">220x150px • MECH</span>
                  </button>
                  <button
                    onClick={() => handleCreatePresetRoom('Cafeteria')}
                    className="p-2 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/50 rounded-xl text-amber-300 font-bold text-[11px] text-left flex flex-col gap-1 cursor-pointer"
                  >
                    <span>+ Cafeteria</span>
                    <span className="text-[9px] text-amber-400 font-normal">200x140px • CIVIL</span>
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

      {/* FEATURE C: EXPORT BLUEPRINT MODAL DIALOG */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 text-slate-100 relative">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <FileDown className="w-5 h-5 text-emerald-400" />
                Export Floor Plan Blueprint
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Download printable blueprint vector PDF or high-resolution PNG image for college administration.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleExportPNG}
                className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl flex flex-col items-center gap-2 text-center transition-all hover:scale-105 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Image className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs text-white">Download PNG</span>
                <span className="text-[10px] text-slate-400">High-Res Image (2000px+)</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl flex flex-col items-center gap-2 text-center transition-all hover:scale-105 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs text-white">Export PDF</span>
                <span className="text-[10px] text-slate-400">Printable A4 Architectural</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
