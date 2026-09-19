import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Save, Undo, Redo, ZoomIn, ZoomOut, Maximize2, Grid, Ruler, Layers, Eye,
  Play, Upload, Download, MousePointer2, Move, Square, Circle, Minus, Hexagon,
  Type, DoorOpen, Footprints, Sparkles, Building, ChevronRight, X, Copy,
  Trash2, Lock, Unlock, ArrowUp, ArrowDown, Check, AlertCircle, RefreshCw,
  Plus, RotateCw, AlignLeft, AlignCenter, AlignRight, Sliders, Shield
} from 'lucide-react';
import { blockService, FloorRecord, FloorObjectRecord, FloorLayerRecord, GeometryType, Point } from '../../../api/blockService';

const GRID_SIZE = 20;

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

  // Active Tool & Selection State
  const [activeTool, setActiveTool] = useState<string>('select');
  const [selectedObjectId, setSelectedObjectId] = useState<string | number | null>(null);
  const [clipboard, setClipboard] = useState<FloorObjectRecord | null>(null);

  // Dragging & Resizing State
  const [isDraggingObj, setIsDraggingObj] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState<{ mouseX: number; mouseY: number; x: number; y: number; w: number; h: number } | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; objId: string | number } | null>(null);

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
        if (selectedObjectId) handleDeleteSelected();
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
  const handleMouseDownObj = (e: React.MouseEvent, obj: FloorObjectRecord) => {
    e.stopPropagation();
    setContextMenu(null);
    setSelectedObjectId(obj.id);
    if (obj.locked || isPreviewMode) return;

    setIsDraggingObj(true);
    const scale = Math.max(0.1, zoomLevel / 100);
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
      const newX = snap(e.clientX / scale - dragOffset.x);
      const newY = snap(e.clientY / scale - dragOffset.y);
      setObjects(prev => prev.map(o => String(o.id) === String(selectedObjectId) ? { ...o, x: Math.max(0, newX), y: Math.max(0, newY) } : o));
      setHasUnsavedChanges(true);
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
  }, [isPanning, panStart, isPreviewMode, selectedObjectId, isDraggingObj, dragOffset, resizeHandle, resizeStartPos, snapToGrid, zoomLevel]);

  const handleMouseUpCanvas = () => {
    if (isDraggingObj || resizeHandle) {
      pushHistory(objects);
    }
    setIsPanning(false);
    setIsDraggingObj(false);
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

  const handleDeleteSelected = () => {
    if (!selectedObjectId) return;
    const updated = objects.filter(o => String(o.id) !== String(selectedObjectId));
    setObjects(updated);
    pushHistory(updated);
    setSelectedObjectId(null);
    setHasUnsavedChanges(true);
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
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
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

            {/* RENDER FLOOR PLAN OBJECTS */}
            {objects.map((obj) => {
              const isSelected = String(selectedObjectId) === String(obj.id);
              const strokeColor = isSelected ? '#3B82F6' : (obj.stroke_color || '#1E40AF');

              return (
                <g
                  key={obj.id}
                  transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation})`}
                  onMouseDown={(e) => handleMouseDownObj(e, obj)}
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

                  {/* RESIZE & ROTATE HANDLES FOR SELECTED OBJECT */}
                  {isSelected && !obj.locked && (
                    <>
                      <circle cx={obj.width / 2} cy={-20} r={7} fill="#F59E0B" stroke="#FFFFFF" strokeWidth={2} onClick={handleRotateSelected} className="cursor-pointer" title="Rotate 90°" />
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
            <div className="p-6 text-center text-slate-500 space-y-2">
              <MousePointer2 className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">Click any element on canvas to inspect properties.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default FloorEditor;
