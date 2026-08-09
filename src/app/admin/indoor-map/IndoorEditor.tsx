import React, { useState, useRef, useEffect, MouseEvent, WheelEvent } from "react";
import { Card, Btn } from "../../App";
import { 
  MousePointer2, Move, Square, Circle, Minus, PenTool, Type, Eraser, 
  ZoomIn, ZoomOut, Save, Undo, Redo, Settings, Layers as LayersIcon, 
  Copy, Trash2, Maximize, Ruler, DoorClosed, Grid3x3, Focus
} from "lucide-react";

type ToolType = 'select' | 'pan' | 'wall' | 'room' | 'door' | 'window' | 'text' | 'measure' | 'eraser';

interface EditorState {
  walls: { id: string, x1: number, y1: number, x2: number, y2: number, t: number, c: string }[];
  rooms: { id: string, x: number, y: number, w: number, h: number, name: string, c: string }[];
  doors: { id: string, x: number, y: number, w: number, rot: number }[];
}

export default function IndoorEditor() {
  const [tool, setTool] = useState<ToolType>('select');
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  
  const [history, setHistory] = useState<EditorState[]>([{ walls: [], rooms: [], doors: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);

  const svgRef = useRef<SVGSVGElement>(null);
  
  const currentState = history[historyIndex];

  // Helper to get coordinates in SVG space
  const getSVGPos = (e: MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    
    // Apply snap to grid
    let { x, y } = svgP;
    if (snapToGrid) {
      x = Math.round(x / 20) * 20;
      y = Math.round(y / 20) * 20;
    }
    return { x, y };
  };

  const pushState = (newState: EditorState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (tool === 'pan' || e.button === 1) { // Middle click always pans
      setIsPanning(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      return;
    }
    
    const pos = getSVGPos(e);
    setStartPos(pos);
    setCurrentPos(pos);
    
    if (tool === 'wall' || tool === 'room' || tool === 'measure') {
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - startPos.x;
      const dy = e.clientY - startPos.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setStartPos({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isDrawing) {
      setCurrentPos(getSVGPos(e));
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    setIsPanning(false);
    
    if (isDrawing) {
      setIsDrawing(false);
      const endPos = getSVGPos(e);
      
      // Save drawn element based on tool
      const newState = JSON.parse(JSON.stringify(currentState));
      
      if (tool === 'wall') {
        // Only save if length > 0
        if (startPos.x !== endPos.x || startPos.y !== endPos.y) {
          newState.walls.push({
            id: Date.now().toString(),
            x1: startPos.x, y1: startPos.y,
            x2: endPos.x, y2: endPos.y,
            t: 6, c: '#334155'
          });
          pushState(newState);
        }
      } else if (tool === 'room') {
        const x = Math.min(startPos.x, endPos.x);
        const y = Math.min(startPos.y, endPos.y);
        const w = Math.abs(endPos.x - startPos.x);
        const h = Math.abs(endPos.y - startPos.y);
        if (w > 0 && h > 0) {
          newState.rooms.push({
            id: Date.now().toString(),
            x, y, w, h,
            name: "New Room", c: 'rgba(59, 130, 246, 0.1)'
          });
          pushState(newState);
        }
      }
    }
  };

  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey) {
      // Zoom
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const newScale = scale * (1 - e.deltaY * zoomSensitivity);
      setScale(Math.max(0.1, Math.min(newScale, 5)));
    } else {
      // Pan
      setPan({ x: pan.x - e.deltaX, y: pan.y - e.deltaY });
    }
  };

  const handleUndo = () => { if (historyIndex > 0) setHistoryIndex(historyIndex - 1); };
  const handleRedo = () => { if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1); };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-2 relative">
      
      {/* LEFT TOOLBAR */}
      <div className="w-14 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center py-4 gap-2 z-10 shadow-sm shrink-0">
        <ToolBtn icon={<MousePointer2 size={18}/>} active={tool==='select'} onClick={()=>setTool('select')} title="Select (V)" />
        <ToolBtn icon={<Move size={18}/>} active={tool==='pan'} onClick={()=>setTool('pan')} title="Pan (Space)" />
        <div className="w-8 h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
        <ToolBtn icon={<Minus size={18}/>} active={tool==='wall'} onClick={()=>setTool('wall')} title="Wall Tool (W)" />
        <ToolBtn icon={<Square size={18}/>} active={tool==='room'} onClick={()=>setTool('room')} title="Room Tool (R)" />
        <ToolBtn icon={<DoorClosed size={18}/>} active={tool==='door'} onClick={()=>setTool('door')} title="Door Tool (D)" />
        <ToolBtn icon={<Focus size={18}/>} active={tool==='window'} onClick={()=>setTool('window')} title="Window Tool" />
        <div className="w-8 h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
        <ToolBtn icon={<Type size={18}/>} active={tool==='text'} onClick={()=>setTool('text')} title="Text (T)" />
        <ToolBtn icon={<Ruler size={18}/>} active={tool==='measure'} onClick={()=>setTool('measure')} title="Measure (M)" />
        <ToolBtn icon={<Eraser size={18}/>} active={tool==='eraser'} onClick={()=>setTool('eraser')} title="Eraser (E)" />
      </div>

      {/* CANVAS AREA */}
      <div 
        className="flex-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden relative"
        onWheel={handleWheel}
      >
        {/* Top Floating Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
          <div className="flex gap-2 pointer-events-auto">
            <div className="flex bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button onClick={handleUndo} disabled={historyIndex===0} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"><Undo size={16}/></button>
              <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
              <button onClick={handleRedo} disabled={historyIndex===history.length-1} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"><Redo size={16}/></button>
            </div>
            <div className="flex bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button onClick={()=>setSnapToGrid(!snapToGrid)} className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${snapToGrid?'text-blue-500':'text-slate-500'}`} title="Snap to Grid"><Grid3x3 size={16}/></button>
              <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
              <button onClick={()=>setShowGrid(!showGrid)} className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${showGrid?'text-blue-500':'text-slate-500'}`} title="Toggle Grid"><LayersIcon size={16}/></button>
            </div>
          </div>
          
          <div className="flex bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden pointer-events-auto">
            <button onClick={()=>setScale(s => Math.max(0.1, s - 0.1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700"><ZoomOut size={16}/></button>
            <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="p-2 text-xs font-medium w-16 text-center select-none">{Math.round(scale * 100)}%</div>
            <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
            <button onClick={()=>setScale(s => Math.min(5, s + 0.1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700"><ZoomIn size={16}/></button>
          </div>
        </div>

        {/* SVG Canvas */}
        <svg 
          ref={svgRef}
          width="100%" 
          height="100%" 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`touch-none ${tool === 'pan' ? 'cursor-grab' : isPanning ? 'cursor-grabbing' : tool === 'select' ? 'cursor-default' : 'cursor-crosshair'}`}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
            
            {/* Grid Pattern */}
            {showGrid && (
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(150,150,150,0.2)" strokeWidth="1"/>
              </pattern>
            )}
            {showGrid && <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#grid)" pointerEvents="none" />}

            {/* Render Rooms */}
            {currentState.rooms.map(r => (
              <g key={r.id} className="cursor-pointer">
                <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={r.c} stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />
                <text x={r.x + r.w/2} y={r.y + r.h/2} fill="#1e293b" fontSize="12" textAnchor="middle" dominantBaseline="middle" pointerEvents="none">{r.name}</text>
              </g>
            ))}

            {/* Render Walls */}
            {currentState.walls.map(w => (
              <line key={w.id} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke={w.c} strokeWidth={w.t} strokeLinecap="round" className="cursor-pointer hover:stroke-indigo-500" />
            ))}

            {/* Drawing Preview */}
            {isDrawing && tool === 'wall' && (
              <line x1={startPos.x} y1={startPos.y} x2={currentPos.x} y2={currentPos.y} stroke="#334155" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
            )}
            {isDrawing && tool === 'room' && (
              <rect 
                x={Math.min(startPos.x, currentPos.x)} 
                y={Math.min(startPos.y, currentPos.y)} 
                width={Math.abs(currentPos.x - startPos.x)} 
                height={Math.abs(currentPos.y - startPos.y)} 
                fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" opacity="0.5" 
              />
            )}
            {isDrawing && tool === 'measure' && (
              <g>
                <line x1={startPos.x} y1={startPos.y} x2={currentPos.x} y2={currentPos.y} stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx={startPos.x} cy={startPos.y} r="4" fill="#f59e0b" />
                <circle cx={currentPos.x} cy={currentPos.y} r="4" fill="#f59e0b" />
                <text 
                  x={(startPos.x + currentPos.x)/2} 
                  y={(startPos.y + currentPos.y)/2 - 10} 
                  fill="#b45309" fontSize="12" fontWeight="bold" textAnchor="middle"
                  style={{ textShadow: "1px 1px 0 #fff, -1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff" }}
                >
                  {Math.round(Math.hypot(currentPos.x - startPos.x, currentPos.y - startPos.y))} px
                </text>
              </g>
            )}

          </g>
        </svg>

        {/* Save Button */}
        <div className="absolute bottom-4 right-4 z-10">
          <Btn icon={<Save size={16} />}>Save Layout</Btn>
        </div>
      </div>

      {/* RIGHT PROPERTY PANEL */}
      <div className="w-64 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 overflow-y-auto shrink-0 shadow-sm">
        <h3 className="font-semibold text-sm mb-4 text-slate-900 dark:text-white flex items-center gap-2">
          <Settings size={16} /> Properties
        </h3>
        
        <div className="text-center py-10 text-slate-400 text-sm">
          Select an object to edit its properties.
        </div>
        
        {/* Mock Property Panel (would be dynamic) */}
        <div className="space-y-4 hidden">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Width</label>
            <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm outline-none" defaultValue={100} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Color</label>
            <input type="color" className="w-full h-8 rounded cursor-pointer" defaultValue="#3b82f6" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ icon, active, onClick, title }: { icon: React.ReactNode, active: boolean, onClick: () => void, title: string }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={`p-2.5 rounded-xl transition-all ${
        active 
          ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-sm" 
          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      {icon}
    </button>
  );
}
