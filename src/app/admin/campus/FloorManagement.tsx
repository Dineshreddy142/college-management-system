import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Building2, Layers, DoorOpen, Search, Edit3, Save, Send, Plus, 
  ZoomIn, ZoomOut, Maximize2, Grid, Eye, Move, Trash2, CheckCircle2, 
  AlertCircle, ChevronRight, Filter, ShieldCheck, Sparkles, Monitor, 
  Users, Laptop, Cpu, BookOpen, Coffee, HelpCircle, Settings, Download,
  Copy, RefreshCw, ChevronDown, Check, Info, ArrowUpRight, Flame
} from 'lucide-react';
import { cn, Btn } from '../../../components/ui/Btn';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface RoomItem {
  id: string;
  code: string;
  name: string;
  type: 'classroom' | 'lab' | 'office' | 'facility' | 'auditorium' | 'corridor';
  dept: string;
  capacity: number;
  occupancy: number; // Percentage 0-100
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  x: number; // grid position or %
  y: number;
  w: number;
  h: number;
  equipment: string[];
  assignedTo?: string;
  color?: string;
}

export interface BuildingInfo {
  id: string;
  name: string;
  code: string;
  floorsCount: number;
  totalRooms: number;
  builtArea: string;
  status: 'Active' | 'Renovating' | 'Maintenance';
}

export interface FloorInfo {
  id: string;
  buildingId: string;
  level: number;
  name: string;
  roomsCount: number;
  area: string;
  isActive?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const BUILDINGS: BuildingInfo[] = [
  { id: 'b1', name: 'Academic Block (Main)', code: 'AB-MAIN', floorsCount: 4, totalRooms: 68, builtArea: '45,000 sq.ft', status: 'Active' },
  { id: 'b2', name: 'Engineering Wing B', code: 'ENG-WNG', floorsCount: 3, totalRooms: 42, builtArea: '32,000 sq.ft', status: 'Active' },
  { id: 'b3', name: 'Science & Research Center', code: 'SRC-LAB', floorsCount: 5, totalRooms: 80, builtArea: '58,000 sq.ft', status: 'Active' },
  { id: 'b4', name: 'Central Library & Admin', code: 'LIB-ADM', floorsCount: 4, totalRooms: 35, builtArea: '40,000 sq.ft', status: 'Maintenance' },
];

const FLOORS: FloorInfo[] = [
  { id: 'f1', buildingId: 'b1', level: 1, name: 'Floor 1 (Ground Floor)', roomsCount: 18, area: '1,200 sq.m' },
  { id: 'f2', buildingId: 'b1', level: 2, name: 'Floor 2 (First Floor)', roomsCount: 16, area: '1,150 sq.m' },
  { id: 'f3', buildingId: 'b1', level: 3, name: 'Floor 3 (Second Floor)', roomsCount: 16, area: '1,150 sq.m' },
  { id: 'f4', buildingId: 'b1', level: 4, name: 'Floor 4 (Third Floor)', roomsCount: 18, area: '1,100 sq.m' },
];

const INITIAL_ROOMS: RoomItem[] = [
  // Top Row Classrooms
  { id: 'r1', code: 'CR-101', name: 'Lecture Hall 101', type: 'classroom', dept: 'Computer Science', capacity: 60, occupancy: 85, status: 'occupied', x: 4, y: 5, w: 18, h: 24, equipment: ['4K Projector', 'Smart Board', 'AC', 'Wi-Fi 6'], assignedTo: 'Prof. Rajesh Kumar (DBMS Class)' },
  { id: 'r2', code: 'CR-102', name: 'Lecture Hall 102', type: 'classroom', dept: 'Computer Science', capacity: 60, occupancy: 0, status: 'available', x: 24, y: 5, w: 18, h: 24, equipment: ['Projector', 'Audio System', 'AC'], assignedTo: 'Available for scheduling' },
  { id: 'r3', code: 'CR-103', name: 'Interactive Classroom', type: 'classroom', dept: 'Electronics', capacity: 45, occupancy: 100, status: 'occupied', x: 44, y: 5, w: 18, h: 24, equipment: ['Touch Screen', 'Dual AC', 'Surround Sound'], assignedTo: 'Dr. Ananya Sharma (VLSI Design)' },
  { id: 'r4', code: 'CS-LAB-1', name: 'AI & Data Science Lab', type: 'lab', dept: 'Computer Science', capacity: 36, occupancy: 90, status: 'occupied', x: 64, y: 5, w: 32, h: 24, equipment: ['36 RTX Workstations', 'GPU Server', 'High Speed Fiber'], assignedTo: 'AI Research Team' },

  // Middle Corridor & Central Facilities
  { id: 'r5', code: 'HOD-OFFICE', name: 'HOD Computer Science', type: 'office', dept: 'Computer Science', capacity: 6, occupancy: 50, status: 'occupied', x: 4, y: 35, w: 14, h: 18, equipment: ['Conference Table', 'Executive Desk', 'Private Restroom'], assignedTo: 'Dr. V. K. Raman (HOD CSE)' },
  { id: 'r6', code: 'FACULTY-A', name: 'Faculty Cabin Complex A', type: 'office', dept: 'Computer Science', capacity: 12, occupancy: 40, status: 'occupied', x: 20, y: 35, w: 22, h: 18, equipment: ['12 Work Desks', 'Printer Station', 'Coffee Machine'], assignedTo: '6 CSE Assistant Professors' },
  
  // Center Stairs / Elevator Block
  { id: 'r7', code: 'ELEV-BAY', name: 'Elevator & Stairwell 1', type: 'facility', dept: 'Campus Operations', capacity: 15, occupancy: 10, status: 'available', x: 44, y: 35, w: 12, h: 18, equipment: ['Dual High-Speed Lifts', 'Fire Hose', 'Emergency Stairs'] },
  { id: 'r8', code: 'RESTROOM-M', name: 'Gents Restroom', type: 'facility', dept: 'Campus Operations', capacity: 10, occupancy: 20, status: 'available', x: 58, y: 35, w: 12, h: 18, equipment: ['Sensored Faucets', 'Hand Dryer'] },
  { id: 'r9', code: 'RESTROOM-F', name: 'Ladies Restroom', type: 'facility', dept: 'Campus Operations', capacity: 10, occupancy: 20, status: 'available', x: 72, y: 35, w: 12, h: 18, equipment: ['Sensored Faucets', 'Powder Room'] },
  { id: 'r10', code: 'SERVER-ROOM', name: 'Core Network Server Room', type: 'facility', dept: 'IT Infrastructure', capacity: 4, occupancy: 100, status: 'reserved', x: 86, y: 35, w: 10, h: 18, equipment: ['Precision AC', 'Biometric Access', 'UPS Backup'] },

  // Bottom Row
  { id: 'r11', code: 'CS-LAB-2', name: 'Cloud Computing & Cyber Lab', type: 'lab', dept: 'Computer Science', capacity: 40, occupancy: 0, status: 'available', x: 4, y: 58, w: 28, h: 26, equipment: ['40 i7 PCs', 'CISCO Switches', 'Projector'], assignedTo: 'Scheduled: 2:00 PM Cyber Security' },
  { id: 'r12', code: 'AUD-MAIN', name: 'Mini Auditorium', type: 'auditorium', dept: 'Academic Affairs', capacity: 180, occupancy: 75, status: 'occupied', x: 34, y: 58, w: 42, h: 26, equipment: ['Acoustic Panels', 'Stage Lighting', 'PA System', 'Dolby Audio'], assignedTo: 'National Seminar on Robotics' },
  { id: 'r13', code: 'CR-104', name: 'Smart Seminar Room', type: 'classroom', dept: 'Information Tech', capacity: 50, occupancy: 0, status: 'maintenance', x: 78, y: 58, w: 18, h: 26, equipment: ['Projector Repairing', 'Wi-Fi AP'], assignedTo: 'Under AC Maintenance' },
];

export function FloorManagement() {
  // State management
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('b1');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('f1');
  const [rooms, setRooms] = useState<RoomItem[]>(INITIAL_ROOMS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>('r1');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [activeRightTab, setActiveRightTab] = useState<'rooms' | 'buildings' | 'floors'>('rooms');
  
  // Canvas Controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  
  // Modals & Feedback
  const [isRoomModalOpen, setIsRoomModalOpen] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Partial<RoomItem> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Dragging state for edit mode
  const [draggingRoomId, setDraggingRoomId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedBuilding = BUILDINGS.find(b => b.id === selectedBuildingId) || BUILDINGS[0];
  const selectedFloor = FLOORS.find(f => f.id === selectedFloorId) || FLOORS[0];
  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || null;

  // Filtered rooms based on search & category
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = searchQuery === '' || 
        room.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.dept.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedTypeFilter === 'all' || room.type === selectedTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [rooms, searchQuery, selectedTypeFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = rooms.length;
    const classrooms = rooms.filter(r => r.type === 'classroom').length;
    const labs = rooms.filter(r => r.type === 'lab').length;
    const offices = rooms.filter(r => r.type === 'office').length;
    const facilities = rooms.filter(r => r.type === 'facility' || r.type === 'auditorium').length;
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    const avgOccupancy = Math.round(rooms.reduce((acc, r) => acc + r.occupancy, 0) / (total || 1));
    return { total, classrooms, labs, offices, facilities, occupied, avgOccupancy };
  }, [rooms]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      triggerToast('Floor plan layout saved successfully!');
    }, 600);
  };

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      triggerToast('Floor plan published live to Student & Faculty portals!');
    }, 900);
  };

  const handleAddRoom = (presetType: RoomItem['type']) => {
    const newId = `room-${Date.now()}`;
    const count = rooms.length + 1;
    const newRoom: RoomItem = {
      id: newId,
      code: `RM-${100 + count}`,
      name: presetType === 'classroom' ? `New Classroom ${count}` : presetType === 'lab' ? `Tech Lab ${count}` : `Office Cabin ${count}`,
      type: presetType,
      dept: 'Computer Science',
      capacity: presetType === 'classroom' ? 60 : presetType === 'lab' ? 30 : 8,
      occupancy: 0,
      status: 'available',
      x: 10 + (count % 3) * 20,
      y: 10 + Math.floor(count / 3) * 20,
      w: presetType === 'auditorium' ? 36 : presetType === 'lab' ? 26 : 18,
      h: 20,
      equipment: ['Wi-Fi 6', 'AC'],
      assignedTo: 'Unassigned'
    };
    setRooms(prev => [...prev, newRoom]);
    setSelectedRoomId(newId);
    triggerToast(`Added new ${presetType} tile to floor plan`);
  };

  const handleOpenEditModal = (room: RoomItem) => {
    setEditingRoom({ ...room });
    setIsRoomModalOpen(true);
  };

  const handleSaveRoomModal = () => {
    if (!editingRoom || !editingRoom.id) return;
    setRooms(prev => prev.map(r => r.id === editingRoom.id ? { ...r, ...editingRoom } as RoomItem : r));
    setIsRoomModalOpen(false);
    triggerToast(`Updated room details for ${editingRoom.code}`);
  };

  const handleDeleteRoom = (id: string) => {
    setRooms(prev => prev.filter(r => r.id !== id));
    if (selectedRoomId === id) setSelectedRoomId(null);
    triggerToast('Room removed from floor layout');
  };

  const getTypeBadgeColor = (type: RoomItem['type']) => {
    switch (type) {
      case 'classroom': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50';
      case 'lab': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50';
      case 'office': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
      case 'auditorium': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50';
      case 'facility': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800';
      default: return 'bg-blue-500/10 text-blue-600 border-blue-200';
    }
  };

  const getStatusColor = (status: RoomItem['status']) => {
    switch (status) {
      case 'occupied': return 'bg-red-500';
      case 'available': return 'bg-emerald-500';
      case 'maintenance': return 'bg-amber-500';
      case 'reserved': return 'bg-purple-500';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl shadow-2xl border border-slate-800 dark:border-slate-200 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* HEADER & BREADCRUMB */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1">
              <span className="hover:text-blue-600 cursor-pointer">Campus</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="hover:text-blue-600 cursor-pointer">{selectedBuilding.name}</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-blue-600 dark:text-blue-400 font-bold">{selectedFloor.name}</span>
            </div>

            {/* Title & Subtitle */}
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Floor Management</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                Interactive Plan Editor
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              View and manage rooms, labs, classrooms and facilities in the selected building and floor.
            </p>
          </div>

          {/* Action Stats Quick View */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center min-w-[80px]">
              <span className="block text-xs text-slate-400 font-medium">Total Rooms</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">{stats.total}</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center min-w-[80px]">
              <span className="block text-xs text-slate-400 font-medium">Classrooms</span>
              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">{stats.classrooms}</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center min-w-[80px]">
              <span className="block text-xs text-slate-400 font-medium">Labs</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{stats.labs}</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center min-w-[90px]">
              <span className="block text-xs text-slate-400 font-medium">Occupancy</span>
              <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">{stats.avgOccupancy}%</span>
            </div>
          </div>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* TOP CONTROLS BAR */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        
        {/* Dropdowns & Search */}
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          
          {/* Building Select */}
          <div className="relative min-w-[180px]">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Building</label>
            <div className="relative">
              <select
                value={selectedBuildingId}
                onChange={e => setSelectedBuildingId(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BUILDINGS.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Floor Select */}
          <div className="relative min-w-[160px]">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Floor Level</label>
            <div className="relative">
              <select
                value={selectedFloorId}
                onChange={e => setSelectedFloorId(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FLOORS.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Quick Search</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search room code, lab, or dept..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Category Filter</label>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              {['all', 'classroom', 'lab', 'office', 'facility'].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedTypeFilter(type)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all",
                    selectedTypeFilter === type
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm font-semibold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Action Controls: Edit Switcher, Save, Publish */}
        <div className="flex items-center gap-3">
          
          {/* Edit Mode Toggle Switch */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setEditMode(false)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                !editMode
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Mode</span>
            </button>
            <button
              onClick={() => setEditMode(true)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                editMode
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Mode</span>
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm border border-slate-700 dark:border-slate-600"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" /> : <Save className="w-3.5 h-3.5 text-blue-400" />}
            <span>Save</span>
          </button>

          {/* Publish Button */}
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
          >
            {isPublishing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Publish</span>
          </button>

        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MAIN WORKSPACE: FLOOR CANVAS + RIGHT INSPECTOR PANEL */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        
        {/* CENTER FLOOR PLAN CANVAS AREA */}
        <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
          
          {/* Floating Canvas Toolbar */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800">
            <button
              onClick={() => setZoomLevel(prev => Math.min(prev + 15, 160))}
              title="Zoom In"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1 min-w-[40px] text-center">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(prev => Math.max(prev - 15, 60))}
              title="Zoom Out"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              title="Reset Zoom"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 my-auto mx-1" />
            <button
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle Grid Lines"
              className={cn(
                "p-2 rounded-xl transition-colors",
                showGrid ? "bg-blue-100 dark:bg-blue-950 text-blue-600" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              title="Toggle Occupancy Heatmap"
              className={cn(
                "p-2 rounded-xl transition-colors",
                showHeatmap ? "bg-rose-100 dark:bg-rose-950 text-rose-600" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Flame className="w-4 h-4" />
            </button>
          </div>

          {/* Edit Mode Floating Quick Add Bar */}
          {editMode && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-amber-500/95 text-white backdrop-blur-md px-3 py-2 rounded-2xl shadow-xl">
              <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" /> Edit Mode Active:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAddRoom('classroom')}
                  className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Classroom
                </button>
                <button
                  onClick={() => handleAddRoom('lab')}
                  className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Lab
                </button>
                <button
                  onClick={() => handleAddRoom('office')}
                  className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Office
                </button>
              </div>
            </div>
          )}

          {/* Interactive Floor Canvas Grid container */}
          <div className="flex-1 overflow-auto p-8 relative flex items-center justify-center scrollbar-thin">
            
            <div
              ref={canvasRef}
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out'
              }}
              className={cn(
                "relative w-[1100px] h-[720px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-4 border-slate-300 dark:border-slate-800 overflow-hidden flex-shrink-0 transition-all",
                showGrid ? "bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]" : ""
              )}
            >

              {/* Building Floor Label Watermark */}
              <div className="absolute top-6 left-8 pointer-events-none select-none opacity-20 dark:opacity-15">
                <p className="text-4xl font-black uppercase tracking-widest text-slate-800 dark:text-white">{selectedBuilding.code}</p>
                <p className="text-xl font-bold text-slate-600 dark:text-slate-300">{selectedFloor.name}</p>
              </div>

              {/* Central Hallway / Corridor Marker */}
              <div className="absolute left-[4%] top-[31%] w-[92%] h-[3.5%] bg-slate-200/80 dark:bg-slate-800/80 border-y border-dashed border-slate-400/60 dark:border-slate-700 flex items-center justify-between px-6 pointer-events-none">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Main East-West Corridor</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Emergency Exit Passage</span>
              </div>

              {/* Corridor North-South Connector */}
              <div className="absolute left-[47%] top-[4%] w-[4%] h-[92%] bg-slate-200/80 dark:bg-slate-800/80 border-x border-dashed border-slate-400/60 dark:border-slate-700 flex flex-col items-center justify-between py-6 pointer-events-none">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 rotate-90">Central Corridor</span>
              </div>

              {/* ROOM TILES LAYER */}
              {filteredRooms.map(room => {
                const isSelected = selectedRoomId === room.id;
                const isHighlightedBySearch = searchQuery !== '' && (
                  room.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  room.name.toLowerCase().includes(searchQuery.toLowerCase())
                );

                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    style={{
                      left: `${room.x}%`,
                      top: `${room.y}%`,
                      width: `${room.w}%`,
                      height: `${room.h}%`,
                    }}
                    className={cn(
                      "absolute rounded-2xl p-3 border-2 transition-all duration-200 flex flex-col justify-between cursor-pointer group shadow-sm select-none",
                      
                      // Room Type Backgrounds
                      room.type === 'classroom' && "bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 hover:border-indigo-500",
                      room.type === 'lab' && "bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 hover:border-emerald-500",
                      room.type === 'office' && "bg-amber-50/90 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 hover:border-amber-500",
                      room.type === 'auditorium' && "bg-purple-50/90 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 hover:border-purple-500",
                      room.type === 'facility' && "bg-slate-100/90 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 hover:border-slate-500",

                      // Heatmap Overlay
                      showHeatmap && (
                        room.occupancy > 75 ? "!bg-rose-500/80 !border-rose-600 !text-white" :
                        room.occupancy > 40 ? "!bg-amber-500/80 !border-amber-600 !text-white" :
                        "!bg-emerald-500/70 !border-emerald-600 !text-white"
                      ),

                      // Selected state styling
                      isSelected && "ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 border-blue-600 shadow-xl scale-[1.02] z-10",
                      isHighlightedBySearch && "ring-4 ring-amber-400 animate-pulse z-10",
                      editMode && "hover:cursor-move hover:ring-2 hover:ring-amber-400"
                    )}
                  >
                    
                    {/* Top Row: Room Code & Status Indicator */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs tracking-wider text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {room.code}
                        </span>
                        {room.type === 'lab' && <Cpu className="w-3.5 h-3.5 text-emerald-500" />}
                        {room.type === 'classroom' && <BookOpen className="w-3.5 h-3.5 text-indigo-500" />}
                        {room.type === 'office' && <Users className="w-3.5 h-3.5 text-amber-500" />}
                      </div>

                      {/* Status Dot */}
                      <div className="flex items-center gap-1">
                        <span title={room.status} className={cn("w-2 h-2 rounded-full", getStatusColor(room.status))} />
                        {editMode && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEditModal(room); }}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Room Name & Dept */}
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1 leading-tight">{room.name}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-400 truncate">{room.dept}</p>
                    </div>

                    {/* Bottom Info Bar: Capacity & Occupancy */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                      <span className="font-semibold">{room.capacity} Seats</span>
                      <span className={cn(
                        "font-extrabold px-1.5 py-0.5 rounded-md text-[9px]",
                        room.status === 'occupied' ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400" :
                        room.status === 'available' ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400" :
                        "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400"
                      )}>
                        {room.occupancy}% Occupied
                      </span>
                    </div>

                  </div>
                );
              })}

            </div>

          </div>

          {/* Canvas Bottom Legend Bar */}
          <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-700 dark:text-slate-300">Room Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-500/20 border border-indigo-500" />
                <span>Classroom</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500" />
                <span>Computer Lab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500" />
                <span>Faculty Office</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500" />
                <span>Auditorium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-400/20 border border-slate-400" />
                <span>Facility</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Available</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Occupied</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Maintenance</span>
            </div>
          </div>

        </div>

        {/* ───────────────────────────────────────────────────────────────────────────── */}
        {/* RIGHT INSPECTOR PANEL (TABS: ROOMS, BUILDINGS, FLOORS) */}
        {/* ───────────────────────────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0">
          
          {/* Panel Header Tabs */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <button
              onClick={() => setActiveRightTab('rooms')}
              className={cn(
                "flex-1 py-3 px-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5",
                activeRightTab === 'rooms'
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              <DoorOpen className="w-4 h-4" /> Rooms ({filteredRooms.length})
            </button>

            <button
              onClick={() => setActiveRightTab('buildings')}
              className={cn(
                "flex-1 py-3 px-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5",
                activeRightTab === 'buildings'
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              <Building2 className="w-4 h-4" /> Buildings ({BUILDINGS.length})
            </button>

            <button
              onClick={() => setActiveRightTab('floors')}
              className={cn(
                "flex-1 py-3 px-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5",
                activeRightTab === 'floors'
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              <Layers className="w-4 h-4" /> Floors ({FLOORS.length})
            </button>
          </div>

          {/* Panel Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            
            {/* ───────────────────────────────────────────────────────────── */}
            {/* TAB 1: ROOMS LIST & INSPECTOR */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeRightTab === 'rooms' && (
              <>
                {/* Selected Room Detailed Inspector Card */}
                {selectedRoom ? (
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider", getTypeBadgeColor(selectedRoom.type))}>
                          {selectedRoom.type}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{selectedRoom.code}: {selectedRoom.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{selectedRoom.dept}</p>
                      </div>
                      <button
                        onClick={() => handleOpenEditModal(selectedRoom)}
                        className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-200 transition-colors"
                        title="Edit Room Config"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Capacity</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRoom.capacity} Seats</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Status</span>
                        <span className="font-bold capitalize text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full", getStatusColor(selectedRoom.status))} />
                          {selectedRoom.status}
                        </span>
                      </div>
                    </div>

                    {selectedRoom.assignedTo && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-slate-400 block text-[10px] font-semibold">Current Activity / Assigned</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{selectedRoom.assignedTo}</span>
                      </div>
                    )}

                    {selectedRoom.equipment && selectedRoom.equipment.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 block text-[10px] font-semibold mb-1.5">Room Facilities & Tech</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedRoom.equipment.map((eq, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-semibold border border-slate-200 dark:border-slate-600">
                              {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {editMode && (
                      <button
                        onClick={() => handleDeleteRoom(selectedRoom.id)}
                        className="w-full mt-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Room from Floor
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                    Click any room on the floor canvas to view its configuration.
                  </div>
                )}

                {/* Edit Mode Room Presets Palette */}
                {editMode && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-200 dark:border-amber-900/50 space-y-2">
                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                      <Plus className="w-4 h-4" /> Add Room Palette
                    </h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-500">Click a room type below to place a new tile on this floor level:</p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleAddRoom('classroom')}
                        className="p-2 bg-white dark:bg-slate-800 hover:bg-amber-100 rounded-xl text-left border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        <span className="block text-xs font-bold text-indigo-600">Classroom</span>
                        <span className="text-[10px] text-slate-400">Standard 60 Seats</span>
                      </button>
                      <button
                        onClick={() => handleAddRoom('lab')}
                        className="p-2 bg-white dark:bg-slate-800 hover:bg-amber-100 rounded-xl text-left border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        <span className="block text-xs font-bold text-emerald-600">Computer Lab</span>
                        <span className="text-[10px] text-slate-400">30-40 Workstations</span>
                      </button>
                      <button
                        onClick={() => handleAddRoom('office')}
                        className="p-2 bg-white dark:bg-slate-800 hover:bg-amber-100 rounded-xl text-left border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        <span className="block text-xs font-bold text-amber-600">Faculty Office</span>
                        <span className="text-[10px] text-slate-400">Staff & HOD Cabin</span>
                      </button>
                      <button
                        onClick={() => handleAddRoom('auditorium')}
                        className="p-2 bg-white dark:bg-slate-800 hover:bg-amber-100 rounded-xl text-left border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        <span className="block text-xs font-bold text-purple-600">Auditorium</span>
                        <span className="text-[10px] text-slate-400">Large 180+ Seats</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Rooms List */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                    <span>Floor Rooms List</span>
                    <span>{filteredRooms.length} Found</span>
                  </div>

                  <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                    {filteredRooms.map(r => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRoomId(r.id)}
                        className={cn(
                          "p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs",
                          selectedRoomId === r.id
                            ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 font-bold"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-white">{r.code}</span>
                            <span className={cn("px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase", getTypeBadgeColor(r.type))}>
                              {r.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{r.name}</p>
                        </div>

                        <div className="text-right">
                          <span className="block font-semibold text-slate-700 dark:text-slate-300">{r.capacity} Seats</span>
                          <span className="text-[10px] text-slate-400 capitalize">{r.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* TAB 2: BUILDINGS OVERVIEW */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeRightTab === 'buildings' && (
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Selected Building</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-extrabold">{selectedBuilding.status}</span>
                  </div>
                  <h3 className="text-xl font-black">{selectedBuilding.name}</h3>
                  <p className="text-xs text-blue-100">Code: {selectedBuilding.code} | Built Area: {selectedBuilding.builtArea}</p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-xs">
                    <div>
                      <span className="text-blue-200 block text-[10px]">Floors Count</span>
                      <span className="font-black text-lg">{selectedBuilding.floorsCount} Floors</span>
                    </div>
                    <div>
                      <span className="text-blue-200 block text-[10px]">Total Rooms</span>
                      <span className="font-black text-lg">{selectedBuilding.totalRooms} Rooms</span>
                    </div>
                  </div>
                </div>

                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 pt-2">All Campus Buildings</h4>
                <div className="space-y-2">
                  {BUILDINGS.map(b => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBuildingId(b.id)}
                      className={cn(
                        "p-3 rounded-2xl border transition-all cursor-pointer space-y-1",
                        selectedBuildingId === b.id
                          ? "bg-blue-50 dark:bg-blue-950/50 border-blue-500"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900 dark:text-white">{b.name}</span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{b.code}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{b.floorsCount} Floors • {b.totalRooms} Rooms</span>
                        <span>{b.builtArea}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* TAB 3: FLOORS DIRECTORY */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeRightTab === 'floors' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Floors in {selectedBuilding.code}</h4>
                  <button
                    onClick={() => triggerToast('Floor addition module ready')}
                    className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Floor
                  </button>
                </div>

                <div className="space-y-2">
                  {FLOORS.map(f => (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFloorId(f.id)}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                        selectedFloorId === f.id
                          ? "bg-blue-500 text-white border-blue-600 shadow-md"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      )}
                    >
                      <div>
                        <span className={cn("text-xs font-bold block", selectedFloorId === f.id ? "text-white" : "text-slate-900 dark:text-white")}>
                          {f.name}
                        </span>
                        <span className={cn("text-[11px]", selectedFloorId === f.id ? "text-blue-100" : "text-slate-400")}>
                          Level {f.level} • {f.area}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={cn("text-xs font-bold block", selectedFloorId === f.id ? "text-white" : "text-slate-700 dark:text-slate-300")}>
                          {f.roomsCount} Rooms
                        </span>
                        {selectedFloorId === f.id && (
                          <span className="text-[10px] font-extrabold uppercase bg-white/20 px-2 py-0.5 rounded-md text-white">Active</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* EDIT ROOM DETAILS MODAL */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {isRoomModalOpen && editingRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-500" /> Edit Room Configuration
              </h3>
              <button onClick={() => setIsRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Room Code</label>
                <input
                  type="text"
                  value={editingRoom.code || ''}
                  onChange={e => setEditingRoom(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Room Title / Display Name</label>
                <input
                  type="text"
                  value={editingRoom.name || ''}
                  onChange={e => setEditingRoom(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Category Type</label>
                  <select
                    value={editingRoom.type || 'classroom'}
                    onChange={e => setEditingRoom(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="classroom">Classroom</option>
                    <option value="lab">Computer / Science Lab</option>
                    <option value="office">Faculty Office</option>
                    <option value="auditorium">Auditorium</option>
                    <option value="facility">Facility / Utility</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    value={editingRoom.capacity || 0}
                    onChange={e => setEditingRoom(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Assigned Department</label>
                <input
                  type="text"
                  value={editingRoom.dept || ''}
                  onChange={e => setEditingRoom(prev => ({ ...prev, dept: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Status</label>
                <select
                  value={editingRoom.status || 'available'}
                  onChange={e => setEditingRoom(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Under Maintenance</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Current Class / Activity</label>
                <input
                  type="text"
                  value={editingRoom.assignedTo || ''}
                  onChange={e => setEditingRoom(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsRoomModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoomModal}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-md"
              >
                Save Room Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default FloorManagement;
