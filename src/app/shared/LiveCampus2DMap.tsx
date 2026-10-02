import React, { useState, useEffect, useCallback } from 'react';
import { Building, Layers, Clock, Users, RefreshCw, ZoomIn, ZoomOut, Maximize2, Shield, AlertCircle, CheckCircle2, Info, Monitor, Wind, Sparkles, Navigation, X } from 'lucide-react';
import client from '../../api/client';

interface LiveCampus2DMapProps {
  blockId?: number;
  floorId?: number;
  isAdminMode?: boolean;
}

export const LiveCampus2DMap: React.FC<LiveCampus2DMapProps> = ({ isAdminMode = false }) => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);

  const [liveData, setLiveData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OCCUPIED' | 'VACANT' | 'LABS' | 'RESTROOMS'>('ALL');

  // Modals / Editor States (For Admin)
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isAddCorridorOpen, setIsAddCorridorOpen] = useState(false);
  const [isEditDimensionsOpen, setIsEditDimensionsOpen] = useState(false);
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<'SELECT' | 'ROOM' | 'CORRIDOR' | 'DIMENSIONS' | 'DELETE'>('SELECT');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [dimForm, setDimForm] = useState({
    name: 'First Floor - CSE Wing',
    widthMeters: '60',
    lengthMeters: '40',
    pixelWidth: '1600',
    pixelHeight: '1000'
  });

  const [newBlock, setNewBlock] = useState({
    code: 'BLK-ECE',
    name: 'Electronics & Communication Block',
    buildingType: 'Academic',
    totalFloors: '4'
  });

  const [newFloor, setNewFloor] = useState({
    floorNumber: '2',
    name: 'Second Floor - CSE Wing',
    widthMeters: '60',
    lengthMeters: '40',
    pixelWidth: '1600',
    pixelHeight: '1000'
  });

  const [newRoom, setNewRoom] = useState({
    roomCode: 'CSE-105',
    name: 'Embedded Systems Lab',
    roomCategory: 'LABORATORY',
    seatingCapacity: '40',
    xPos: '60',
    yPos: '480',
    width: '260',
    height: '140',
    fillColor: '#8B5CF6',
    hasProjector: true,
    hasAc: true,
    hasLabPcs: true
  });

  const [newCorridor, setNewCorridor] = useState({
    code: 'CORR-SOUTH',
    name: 'South Wing Passage',
    xPos: '60',
    yPos: '490',
    width: '1080',
    height: '60',
    fillColor: '#E2E8F0'
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Blocks
  const fetchBlocks = useCallback(async () => {
    try {
      const res = await client.get('/campus/blocks');
      if (res.data && res.data.data?.blocks) {
        setBlocks(res.data.data.blocks);
        if (res.data.data.blocks.length > 0 && !selectedBlockId) {
          setSelectedBlockId(res.data.data.blocks[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching campus blocks:', err);
    }
  }, [selectedBlockId]);

  // Fetch Floors for selected block
  const fetchFloors = useCallback(async (bId: number) => {
    try {
      const res = await client.get(`/campus/blocks/${bId}/floors`);
      if (res.data && res.data.data?.floors) {
        setFloors(res.data.data.floors);
        if (res.data.data.floors.length > 0) {
          setSelectedFloorId(res.data.data.floors[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching block floors:', err);
    }
  }, []);

  // Fetch Live 2D Occupancy for selected floor
  const fetchLiveOccupancy = useCallback(async (fId: number) => {
    setIsLoading(true);
    try {
      const res = await client.get(`/campus/floors/${fId}/live-occupancy`);
      if (res.data && res.data.data) {
        setLiveData(res.data.data);
        if (res.data.data.floor) {
          setDimForm({
            name: res.data.data.floor.name || 'Floor',
            widthMeters: String(res.data.data.floor.floor_width_meters || 60),
            lengthMeters: String(res.data.data.floor.floor_length_meters || 40),
            pixelWidth: String(res.data.data.floor.canvas_pixel_width || 1600),
            pixelHeight: String(res.data.data.floor.canvas_pixel_height || 1000)
          });
        }
      }
    } catch (err) {
      console.error('Error fetching live occupancy:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDimensionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFloorId) return;
    try {
      const res = await client.put(`/campus/floors/${selectedFloorId}/dimensions`, {
        name: dimForm.name,
        widthMeters: Number(dimForm.widthMeters),
        lengthMeters: Number(dimForm.lengthMeters),
        pixelWidth: Number(dimForm.pixelWidth),
        pixelHeight: Number(dimForm.pixelHeight)
      });
      if (res.data && res.data.success) {
        showToast('Floor building space size updated!');
        setIsEditDimensionsOpen(false);
        fetchLiveOccupancy(selectedFloorId);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update floor dimensions', 'error');
    }
  };

  const handleAddBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await client.post('/campus/blocks', {
        code: newBlock.code,
        name: newBlock.name,
        buildingType: newBlock.buildingType,
        totalFloors: Number(newBlock.totalFloors)
      });
      if (res.data && res.data.success) {
        showToast(`Building block "${newBlock.name}" created!`);
        setIsAddBlockOpen(false);
        fetchBlocks();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create block', 'error');
    }
  };

  const handleAddFloorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlockId) return;
    try {
      const res = await client.post(`/campus/blocks/${selectedBlockId}/floors`, {
        floorNumber: Number(newFloor.floorNumber),
        name: newFloor.name,
        widthMeters: Number(newFloor.widthMeters),
        lengthMeters: Number(newFloor.lengthMeters),
        pixelWidth: Number(newFloor.pixelWidth),
        pixelHeight: Number(newFloor.pixelHeight)
      });
      if (res.data && res.data.success) {
        showToast(`Floor Level "${newFloor.name}" created!`);
        setIsAddFloorOpen(false);
        fetchFloors(selectedBlockId);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create floor', 'error');
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!window.confirm('Are you sure you want to remove this room from the 2D floor plan?')) return;
    try {
      const res = await client.delete(`/campus/rooms/${roomId}`);
      if (res.data && res.data.success) {
        showToast('Room removed from floor layout.');
        setSelectedRoom(null);
        if (selectedFloorId) fetchLiveOccupancy(selectedFloorId);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete room', 'error');
    }
  };

  const handleDeleteCorridor = async (corridorId: number) => {
    if (!window.confirm('Are you sure you want to remove this corridor passage from the 2D floor plan?')) return;
    try {
      const res = await client.delete(`/campus/corridors/${corridorId}`);
      if (res.data && res.data.success) {
        showToast('Corridor removed from floor layout.');
        if (selectedFloorId) fetchLiveOccupancy(selectedFloorId);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete corridor', 'error');
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  useEffect(() => {
    if (selectedBlockId) {
      fetchFloors(selectedBlockId);
    }
  }, [selectedBlockId, fetchFloors]);

  useEffect(() => {
    if (selectedFloorId) {
      fetchLiveOccupancy(selectedFloorId);
    }
  }, [selectedFloorId, fetchLiveOccupancy]);

  const handleAddRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFloorId) return;
    try {
      const res = await client.post(`/campus/floors/${selectedFloorId}/rooms`, {
        roomCode: newRoom.roomCode,
        name: newRoom.name,
        roomCategory: newRoom.roomCategory,
        seatingCapacity: Number(newRoom.seatingCapacity),
        xPos: Number(newRoom.xPos),
        yPos: Number(newRoom.yPos),
        width: Number(newRoom.width),
        height: Number(newRoom.height),
        fillColor: newRoom.fillColor,
        hasProjector: newRoom.hasProjector,
        hasAc: newRoom.hasAc,
        hasLabPcs: newRoom.hasLabPcs
      });

      if (res.data && res.data.success) {
        showToast('Room added to customizable 2D floor layout!');
        setIsAddRoomOpen(false);
        fetchLiveOccupancy(selectedFloorId);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add room.', 'error');
    }
  };

  const handleAddCorridorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFloorId) return;
    try {
      const res = await client.post(`/campus/floors/${selectedFloorId}/corridors`, {
        code: newCorridor.code,
        name: newCorridor.name,
        xPos: Number(newCorridor.xPos),
        yPos: Number(newCorridor.yPos),
        width: Number(newCorridor.width),
        height: Number(newCorridor.height),
        fillColor: newCorridor.fillColor
      });

      if (res.data && res.data.success) {
        showToast('Corridor hallway added to 2D floor plan!');
        setIsAddCorridorOpen(false);
        fetchLiveOccupancy(selectedFloorId);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add corridor.', 'error');
    }
  };

  const floor = liveData?.floor || {};
  const corridors = Array.isArray(liveData?.corridors) ? liveData.corridors : [];
  const rooms = Array.isArray(liveData?.rooms) ? liveData.rooms : [];
  const currentTime = liveData?.currentTime || {};

  const filteredRooms = rooms.filter((r: any) => {
    if (activeFilter === 'OCCUPIED') return r.occupancyStatus === 'OCCUPIED';
    if (activeFilter === 'VACANT') return r.occupancyStatus === 'VACANT';
    if (activeFilter === 'LABS') return r.room_category === 'LABORATORY';
    if (activeFilter === 'RESTROOMS') return r.room_category === 'RESTROOM';
    return true;
  });

  const occupiedCount = rooms.filter((r: any) => r.occupancyStatus === 'OCCUPIED').length;
  const vacantCount = rooms.filter((r: any) => r.occupancyStatus === 'VACANT').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg ${
          toastMessage.type === 'success' ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40' : 'bg-red-950/90 text-red-200 border-red-500/40'
        }`}>
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs opacity-70">Dismiss</button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Building className="w-4 h-4" />
            <span>Interactive Campus 2D Digital Twin & Live Occupancy</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {floor.block_name || 'CSE Academic Block'} — {floor.name || 'First Floor'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
            <span>Dimensions: <strong className="text-slate-200">{floor.floor_width_meters || 60}m × {floor.floor_length_meters || 40}m</strong></span>
            <span>•</span>
            <span>Current Period: <strong className="text-emerald-400">{currentTime.day || 'Today'}, {currentTime.time || ''}</strong></span>
            <span>•</span>
            <span>Occupancy: <strong className="text-emerald-400">{occupiedCount} Occupied</strong> / <strong className="text-slate-300">{vacantCount} Vacant</strong></span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Block Selector */}
          <select
            value={selectedBlockId || ''}
            onChange={e => setSelectedBlockId(Number(e.target.value))}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white"
          >
            {blocks.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
            ))}
          </select>

          {/* Floor Selector */}
          <select
            value={selectedFloorId || ''}
            onChange={e => setSelectedFloorId(Number(e.target.value))}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white"
          >
            {floors.map((f: any) => (
              <option key={f.id} value={f.id}>{f.name} (Floor {f.floor_number})</option>
            ))}
          </select>

          {isAdminMode && (
            <>
              <button
                onClick={() => setIsAddBlockOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                title="Create a new Building Block"
              >
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                <span>+ Block</span>
              </button>
              <button
                onClick={() => setIsAddFloorOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                title="Add new floor level to block"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Floor Level</span>
              </button>
              <button
                onClick={() => setIsEditDimensionsOpen(true)}
                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/20"
                title="Change length, width & building space size"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Resize Floor</span>
              </button>
              <button
                onClick={() => setIsAddRoomOpen(true)}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                + Add Room
              </button>
              <button
                onClick={() => setIsAddCorridorOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                + Add Corridor
              </button>
            </>
          )}

          <button
            onClick={() => selectedFloorId && fetchLiveOccupancy(selectedFloorId)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
            title="Refresh Live Occupancy"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Filter View:</span>
          {(['ALL', 'OCCUPIED', 'VACANT', 'LABS', 'RESTROOMS'] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeFilter === f ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-emerald-500" /> Ongoing Class</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-blue-500" /> Classroom</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-purple-500" /> Laboratory</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-cyan-500" /> Restroom</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-amber-500" /> Faculty Cabin</span>
        </div>
      </div>

      {/* 2D CANVAS CONTAINER */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl overflow-auto relative min-h-[600px] scrollbar-thin">
        {/* FLOOR MAKER TOOLBAR PALETTE (Admin Mode) */}
        {isAdminMode && (
          <div className="sticky top-0 left-0 z-40 float-left flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-2xl shadow-2xl backdrop-blur-md mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 border-r border-slate-700/80 mr-1">Floor Tools:</span>
            
            <button
              onClick={() => setActiveTool('SELECT')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTool === 'SELECT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Select & Inspect Room"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>

            <button
              onClick={() => { setActiveTool('ROOM'); setIsAddRoomOpen(true); }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTool === 'ROOM' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Add Room to Layout"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>+ Room</span>
            </button>

            <button
              onClick={() => { setActiveTool('CORRIDOR'); setIsAddCorridorOpen(true); }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTool === 'CORRIDOR' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Add Corridor Passageway"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Corridor</span>
            </button>

            <button
              onClick={() => { setActiveTool('DIMENSIONS'); setIsEditDimensionsOpen(true); }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTool === 'DIMENSIONS' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Resize Length & Width"
            >
              <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Dimensions</span>
            </button>
          </div>
        )}

        {/* Zoom & Viewport Controls Overlay */}
        <div className="sticky top-0 right-0 z-40 float-right flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-2xl shadow-2xl backdrop-blur-md mb-2">
          <button onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 2.5))} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-indigo-400 px-1.5">{Math.round(zoomLevel * 100)}%</span>
          <button onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.4))} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={() => setZoomLevel(1.0)} className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs font-bold cursor-pointer" title="Reset Zoom">
            100%
          </button>
        </div>
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-xs font-semibold">Loading Customizable 2D Floor Plan & Live Occupancy...</p>
          </div>
        ) : (
          <div
            className="relative mx-auto transition-transform duration-200"
            style={{
              width: `${floor.canvas_pixel_width || 1200}px`,
              height: `${floor.canvas_pixel_height || 700}px`,
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              background: 'radial-gradient(circle, rgba(30,41,59,0.4) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            {/* Render Corridor Hallways */}
            {corridors.map((corr: any) => (
              <div
                key={corr.id}
                className="absolute rounded-xl border border-slate-700/60 flex items-center justify-center text-[11px] font-bold text-slate-400 select-none"
                style={{
                  left: `${corr.x_pos}px`,
                  top: `${corr.y_pos}px`,
                  width: `${corr.width}px`,
                  height: `${corr.height}px`,
                  backgroundColor: corr.fill_color || '#1E293B'
                }}
              >
                <div className="flex items-center gap-2 opacity-60">
                  <Navigation className="w-3.5 h-3.5 text-slate-400 rotate-90" />
                  <span>{corr.name}</span>
                </div>
              </div>
            ))}

            {/* Render 2D Rooms */}
            {filteredRooms.map((rm: any) => {
              const isOccupied = rm.occupancyStatus === 'OCCUPIED';
              return (
                <div
                  key={rm.id}
                  onClick={() => setSelectedRoom(rm)}
                  className={`absolute rounded-2xl border-2 p-3 flex flex-col justify-between transition-all cursor-pointer shadow-lg hover:scale-[1.02] hover:z-30 group ${
                    isOccupied
                      ? 'bg-emerald-950/90 border-emerald-500 shadow-emerald-500/20 text-emerald-100'
                      : rm.room_category === 'RESTROOM'
                      ? 'bg-cyan-950/90 border-cyan-500 text-cyan-100'
                      : rm.room_category === 'LABORATORY'
                      ? 'bg-purple-950/90 border-purple-500 text-purple-100'
                      : rm.room_category === 'CABIN'
                      ? 'bg-amber-950/90 border-amber-500 text-amber-100'
                      : 'bg-slate-900/90 border-blue-500/80 text-white'
                  }`}
                  style={{
                    left: `${rm.x_pos}px`,
                    top: `${rm.y_pos}px`,
                    width: `${rm.width}px`,
                    height: `${rm.height}px`
                  }}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-white/10 uppercase">
                        {rm.room_code}
                      </span>
                      <p className="font-bold text-xs mt-1 truncate">{rm.name}</p>
                    </div>

                    {isOccupied && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    )}
                  </div>

                  {/* Live Status Overlay */}
                  <div className="text-[10px] space-y-0.5 pt-1 border-t border-white/10">
                    {isOccupied && rm.activeClass ? (
                      <div>
                        <p className="font-extrabold text-emerald-300 truncate">{rm.activeClass.subjectName}</p>
                        <p className="opacity-80 truncate">{rm.activeClass.facultyName} ({rm.activeClass.sectionName})</p>
                      </div>
                    ) : rm.room_category === 'RESTROOM' ? (
                      <p className="font-bold opacity-80">Restroom Sanitation</p>
                    ) : rm.room_category === 'CABIN' ? (
                      <p className="font-bold opacity-80">Faculty / HOD Cabin</p>
                    ) : (
                      <p className="font-bold opacity-70">⚪ Free for Self-Study ({rm.seating_capacity} Seats)</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Room Details Modal / Drawer */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-400 uppercase">{selectedRoom.room_code}</span>
                <h3 className="font-bold text-lg text-white">{selectedRoom.name}</h3>
              </div>
              <button onClick={() => setSelectedRoom(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-800 rounded-2xl space-y-1">
                <p className="flex justify-between"><span>Category:</span> <strong className="text-white">{selectedRoom.room_category}</strong></p>
                <p className="flex justify-between"><span>Capacity:</span> <strong className="text-white">{selectedRoom.seating_capacity} Seats</strong></p>
                <p className="flex justify-between"><span>Equipment:</span> <strong className="text-white">{selectedRoom.has_projector ? 'Projector' : ''} {selectedRoom.has_ac ? '• AC' : ''} {selectedRoom.has_lab_pcs ? `• ${selectedRoom.pc_count} Lab PCs` : ''}</strong></p>
              </div>

              {selectedRoom.occupancyStatus === 'OCCUPIED' && selectedRoom.activeClass && (
                <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-emerald-200 space-y-1">
                  <p className="font-bold text-sm text-emerald-400">Ongoing Live Class Session</p>
                  <p>Subject: <strong>{selectedRoom.activeClass.subjectName} ({selectedRoom.activeClass.subjectCode})</strong></p>
                  <p>Faculty: <strong>{selectedRoom.activeClass.facultyName}</strong></p>
                  <p>Section: <strong>Section {selectedRoom.activeClass.sectionName}</strong></p>
                  <p>Time Slot: <strong>{selectedRoom.activeClass.timeSlot}</strong></p>
                </div>
              )}

              {selectedRoom.occupancyStatus === 'VACANT' && (
                <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl text-slate-300">
                  <p className="font-bold text-emerald-400">Room Available for Self-Study</p>
                  <p className="text-[11px] mt-0.5">No ongoing class scheduled for the current period. Students may utilize seating capacity for study.</p>
                </div>
              )}

              {isAdminMode && (
                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleDeleteRoom(selectedRoom.id)}
                    className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Delete Room from Floor</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Room (Admin) */}
      {isAddRoomOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Add Customizable Room to 2D Floor Plan</h3>
              <button onClick={() => setIsAddRoomOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRoomSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Room Code</label>
                  <input
                    type="text"
                    value={newRoom.roomCode}
                    onChange={e => setNewRoom(prev => ({ ...prev, roomCode: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={e => setNewRoom(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={newRoom.roomCategory}
                    onChange={e => setNewRoom(prev => ({ ...prev, roomCategory: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    <option value="CLASSROOM">Classroom</option>
                    <option value="LABORATORY">Laboratory</option>
                    <option value="CABIN">Faculty Cabin</option>
                    <option value="SEMINAR_HALL">Seminar Hall</option>
                    <option value="RESTROOM">Restroom</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    value={newRoom.seatingCapacity}
                    onChange={e => setNewRoom(prev => ({ ...prev, seatingCapacity: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">X Pos (px)</label>
                  <input
                    type="number"
                    value={newRoom.xPos}
                    onChange={e => setNewRoom(prev => ({ ...prev, xPos: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Y Pos (px)</label>
                  <input
                    type="number"
                    value={newRoom.yPos}
                    onChange={e => setNewRoom(prev => ({ ...prev, yPos: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={newRoom.width}
                    onChange={e => setNewRoom(prev => ({ ...prev, width: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={newRoom.height}
                    onChange={e => setNewRoom(prev => ({ ...prev, height: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddRoomOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold">Save Room on Canvas</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Corridor (Admin) */}
      {isAddCorridorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Add Corridor Hallway to 2D Floor Plan</h3>
              <button onClick={() => setIsAddCorridorOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCorridorSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Corridor Code</label>
                <input
                  type="text"
                  value={newCorridor.code}
                  onChange={e => setNewCorridor(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Passage Name</label>
                <input
                  type="text"
                  value={newCorridor.name}
                  onChange={e => setNewCorridor(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">X (px)</label>
                  <input
                    type="number"
                    value={newCorridor.xPos}
                    onChange={e => setNewCorridor(prev => ({ ...prev, xPos: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Y (px)</label>
                  <input
                    type="number"
                    value={newCorridor.yPos}
                    onChange={e => setNewCorridor(prev => ({ ...prev, yPos: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Width</label>
                  <input
                    type="number"
                    value={newCorridor.width}
                    onChange={e => setNewCorridor(prev => ({ ...prev, width: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Height</label>
                  <input
                    type="number"
                    value={newCorridor.height}
                    onChange={e => setNewCorridor(prev => ({ ...prev, height: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddCorridorOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold">Save Corridor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Floor Dimensions & Building Space (Admin) */}
      {isEditDimensionsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Customize Floor Building Space Size</h3>
                <p className="text-xs text-slate-500">Configure physical meters & 2D canvas workspace size</p>
              </div>
              <button onClick={() => setIsEditDimensionsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDimensionsSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Name / Wing</label>
                <input
                  type="text"
                  value={dimForm.name}
                  onChange={e => setDimForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  placeholder="e.g. First Floor - CSE Wing"
                  required
                />
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-3">
                <p className="font-bold text-indigo-700 dark:text-indigo-400 text-xs flex items-center gap-1.5">
                  <Maximize2 className="w-4 h-4" /> Physical Floor Dimensions (Meters)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Width (Meters)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={dimForm.widthMeters}
                      onChange={e => setDimForm(prev => ({ ...prev, widthMeters: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Length (Meters)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={dimForm.lengthMeters}
                      onChange={e => setDimForm(prev => ({ ...prev, lengthMeters: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-100 dark:border-purple-900/50 space-y-3">
                <p className="font-bold text-purple-700 dark:text-purple-400 text-xs flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> 2D Visualizer Canvas Space (Pixels)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Canvas Width (px)</label>
                    <input
                      type="number"
                      value={dimForm.pixelWidth}
                      onChange={e => setDimForm(prev => ({ ...prev, pixelWidth: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                      placeholder="e.g. 1600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Canvas Height (px)</label>
                    <input
                      type="number"
                      value={dimForm.pixelHeight}
                      onChange={e => setDimForm(prev => ({ ...prev, pixelHeight: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                      placeholder="e.g. 1000"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditDimensionsOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/30">Save Dimensions</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Building Block (Admin) */}
      {isAddBlockOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-500" /> Create Campus Building Block
              </h3>
              <button onClick={() => setIsAddBlockOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBlockSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Block Code</label>
                <input
                  type="text"
                  value={newBlock.code}
                  onChange={e => setNewBlock(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  placeholder="e.g. BLK-ECE"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Building Block Name</label>
                <input
                  type="text"
                  value={newBlock.name}
                  onChange={e => setNewBlock(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  placeholder="e.g. Electronics & Communication Block"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Building Type</label>
                  <select
                    value={newBlock.buildingType}
                    onChange={e => setNewBlock(prev => ({ ...prev, buildingType: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Research">Research Lab</option>
                    <option value="Auditorium">Auditorium / Library</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Total Floors</label>
                  <input
                    type="number"
                    value={newBlock.totalFloors}
                    onChange={e => setNewBlock(prev => ({ ...prev, totalFloors: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddBlockOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30">Create Block</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Floor Level (Admin) */}
      {isAddFloorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" /> Add Floor Level to Block
              </h3>
              <button onClick={() => setIsAddFloorOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFloorSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Number</label>
                  <input
                    type="number"
                    value={newFloor.floorNumber}
                    onChange={e => setNewFloor(prev => ({ ...prev, floorNumber: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                    placeholder="0 for Ground"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Designation Name</label>
                  <input
                    type="text"
                    value={newFloor.name}
                    onChange={e => setNewFloor(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                    placeholder="e.g. Ground Floor"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Width (Meters)</label>
                  <input
                    type="number"
                    value={newFloor.widthMeters}
                    onChange={e => setNewFloor(prev => ({ ...prev, widthMeters: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Length (Meters)</label>
                  <input
                    type="number"
                    value={newFloor.lengthMeters}
                    onChange={e => setNewFloor(prev => ({ ...prev, lengthMeters: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddFloorOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/30">Create Floor Level</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
