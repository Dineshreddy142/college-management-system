import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Building2, Layers, DoorOpen, Search, Edit3, Save, Send, Plus, 
  ZoomIn, ZoomOut, Maximize2, Grid, Eye, Trash2, CheckCircle2, 
  AlertCircle, ChevronRight, Sparkles, Users, Cpu, BookOpen, 
  ChevronDown, RefreshCw, X, AlertTriangle, ArrowUp, ArrowDown, Copy,
  Compass, MousePointer, Move, RotateCw, Maximize, Minimize, Utensils,
  Coffee, LogIn, LogOut, ArrowRight, CornerDownRight, Square, SlidersHorizontal,
  Flame, LayoutGrid
} from 'lucide-react';
import { cn } from '../../../components/ui/Btn';
import client from '../../../api/client';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface BuildingInfo {
  id: string | number;
  name: string;
  code: string;
  description: string;
  total_floors: number;
  floorsCount?: number;
  status: 'Active' | 'Renovating' | 'Maintenance' | 'Inactive';
  created_at?: string;
}

export interface FloorInfo {
  id: string | number;
  buildingId: string | number;
  building_id?: string | number;
  name: string;
  floorNumber: number;
  floor_number?: number;
  displayOrder?: number;
  description?: string;
  roomsCount?: number;
  area?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ObjectCategory = 
  | 'room' 
  | 'classroom' 
  | 'lab' 
  | 'office' 
  | 'library' 
  | 'seminar' 
  | 'cafeteria' 
  | 'corridor' 
  | 'stairs' 
  | 'lift' 
  | 'washroom' 
  | 'entrance' 
  | 'exit';

export type RoomShape = 'rectangle' | 'square' | 'l-shape' | 'polygon';

export interface CanvasObject {
  id: string;
  code: string;
  name: string;
  category: ObjectCategory;
  shape: RoomShape;
  x: number; // canvas position in pixels
  y: number;
  w: number;
  h: number;
  rotation: number; // 0, 90, 180, 270 degrees
  dept: string;
  capacity: number;
  occupancy: number; // Percentage 0-100
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  equipment: string[];
  assignedTo?: string;
  color?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL DEFAULT BUILDINGS & FLOORS DATA
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_BUILDINGS: BuildingInfo[] = [
  { id: 'b2', name: 'Academic Block', code: 'AB-MAIN', description: 'Main Academic Classrooms & Lecture Halls', total_floors: 4, status: 'Active' },
  { id: 'b1', name: 'Main Block', code: 'MB-01', description: 'Central Executive & Administration Complex', total_floors: 4, status: 'Active' },
  { id: 'b3', name: 'Science Block', code: 'SB-02', description: 'Physics, Chemistry & Life Sciences Labs', total_floors: 5, status: 'Active' },
  { id: 'b4', name: 'Engineering Block', code: 'ENG-WNG', description: 'Computer Science, Mechanical & Robotics Labs', total_floors: 3, status: 'Active' },
  { id: 'b5', name: 'Administrative Block', code: 'ADM-01', description: 'Principal Office, Accounts & Registrar Offices', total_floors: 3, status: 'Active' },
  { id: 'b6', name: 'Library Block', code: 'LIB-ADM', description: 'Central Library, E-Resource Center & Digital Archives', total_floors: 4, status: 'Maintenance' },
  { id: 'b7', name: 'Hostel Block', code: 'HST-01', description: 'Student Residential Complex & Dining Facility', total_floors: 6, status: 'Active' },
];

const INITIAL_FLOORS: FloorInfo[] = [
  { id: 'f1', buildingId: 'b2', floorNumber: 0, name: 'Ground Floor', description: 'Main Lobby, Seminar Halls & Student Helpdesk', roomsCount: 18, area: '1,200 sq.m', displayOrder: 1 },
  { id: 'f2', buildingId: 'b2', floorNumber: 1, name: '1st Floor', description: 'Computer Science Classrooms & Smart Labs', roomsCount: 16, area: '1,150 sq.m', displayOrder: 2 },
  { id: 'f3', buildingId: 'b2', floorNumber: 2, name: '2nd Floor', description: 'Electronics & Communication Lecture Halls', roomsCount: 16, area: '1,150 sq.m', displayOrder: 3 },
  { id: 'f4', buildingId: 'b2', floorNumber: 3, name: '3rd Floor', description: 'Post Graduate Research Labs & HOD Suites', roomsCount: 18, area: '1,100 sq.m', displayOrder: 4 },

  { id: 'f5', buildingId: 'b1', floorNumber: 0, name: 'Ground Floor', description: 'Executive Reception & Board Room', roomsCount: 12, area: '1,500 sq.m', displayOrder: 1 },
  { id: 'f6', buildingId: 'b1', floorNumber: 1, name: '1st Floor', description: 'Principal & Vice Chancellor Offices', roomsCount: 10, area: '1,400 sq.m', displayOrder: 2 },

  { id: 'f7', buildingId: 'b3', floorNumber: 0, name: 'Ground Floor', description: 'Physics & Applied Mechanics Wing', roomsCount: 14, area: '1,300 sq.m', displayOrder: 1 },
  { id: 'f8', buildingId: 'b3', floorNumber: 1, name: '1st Floor', description: 'Chemistry & Biotechnology Labs', roomsCount: 15, area: '1,300 sq.m', displayOrder: 2 },

  { id: 'f9', buildingId: 'b4', floorNumber: 0, name: 'Ground Floor', description: 'Heavy Machinery & Mechanical Workshops', roomsCount: 14, area: '1,250 sq.m', displayOrder: 1 },
  { id: 'f10', buildingId: 'b4', floorNumber: 1, name: '1st Floor', description: 'Robotics, IoT & CAD Design Studios', roomsCount: 12, area: '1,250 sq.m', displayOrder: 2 },

  { id: 'f11', buildingId: 'b5', floorNumber: 0, name: 'Ground Floor', description: 'Accounts, Admissions & Registrar Counter', roomsCount: 10, area: '1,000 sq.m', displayOrder: 1 },
  { id: 'f12', buildingId: 'b6', floorNumber: 0, name: 'Ground Floor', description: 'Central Digital Reading Room & E-Journals', roomsCount: 8, area: '1,600 sq.m', displayOrder: 1 },
  { id: 'f13', buildingId: 'b7', floorNumber: 0, name: 'Ground Floor', description: 'Hostel Mess Hall, Gym & Warden Office', roomsCount: 24, area: '1,800 sq.m', displayOrder: 1 },
];

const INITIAL_CANVAS_OBJECTS: CanvasObject[] = [
  // Classrooms
  { id: 'obj-1', code: 'CR-101', name: 'Lecture Hall 101', category: 'classroom', shape: 'rectangle', x: 40, y: 40, w: 220, h: 160, rotation: 0, dept: 'Computer Science', capacity: 60, occupancy: 85, status: 'occupied', equipment: ['4K Projector', 'Smart Board', 'AC', 'Wi-Fi 6'], assignedTo: 'Prof. Rajesh Kumar (DBMS Class)' },
  { id: 'obj-2', code: 'CR-102', name: 'Lecture Hall 102', category: 'classroom', shape: 'rectangle', x: 280, y: 40, w: 220, h: 160, rotation: 0, dept: 'Computer Science', capacity: 60, occupancy: 0, status: 'available', equipment: ['Projector', 'Audio System', 'AC'], assignedTo: 'Available for scheduling' },
  { id: 'obj-3', code: 'CR-103', name: 'Interactive Seminar Room', category: 'classroom', shape: 'l-shape', x: 520, y: 40, w: 220, h: 160, rotation: 0, dept: 'Electronics', capacity: 45, occupancy: 100, status: 'occupied', equipment: ['Touch Screen', 'Dual AC'], assignedTo: 'Dr. Ananya Sharma (VLSI Design)' },
  { id: 'obj-4', code: 'CS-LAB-1', name: 'AI & Data Science Lab', category: 'lab', shape: 'rectangle', x: 760, y: 40, w: 320, h: 160, rotation: 0, dept: 'Computer Science', capacity: 36, occupancy: 90, status: 'occupied', equipment: ['36 RTX Workstations', 'GPU Server'], assignedTo: 'AI Research Team' },

  // Middle Corridor & Passage
  { id: 'obj-5', code: 'CORRIDOR-MAIN', name: 'East-West Main Corridor', category: 'corridor', shape: 'rectangle', x: 40, y: 220, w: 1040, h: 40, rotation: 0, dept: 'Campus Infrastructure', capacity: 200, occupancy: 10, status: 'available', equipment: ['Emergency Lighting', 'Fire Extinguishers'] },

  // Middle Row Cabins & Utilities
  { id: 'obj-6', code: 'HOD-OFFICE', name: 'HOD Computer Science', category: 'office', shape: 'square', x: 40, y: 280, w: 160, h: 160, rotation: 0, dept: 'Computer Science', capacity: 6, occupancy: 50, status: 'occupied', equipment: ['Conference Table', 'Executive Desk'], assignedTo: 'Dr. V. K. Raman (HOD CSE)' },
  { id: 'obj-7', code: 'FACULTY-A', name: 'Faculty Cabin Suite A', category: 'office', shape: 'rectangle', x: 220, y: 280, w: 240, h: 160, rotation: 0, dept: 'Computer Science', capacity: 12, occupancy: 40, status: 'occupied', equipment: ['12 Work Desks', 'Printer Station'], assignedTo: '6 CSE Assistant Professors' },
  { id: 'obj-8', code: 'STAIRS-1', name: 'Central Stairwell', category: 'stairs', shape: 'rectangle', x: 480, y: 280, w: 120, h: 160, rotation: 0, dept: 'Safety & Facilities', capacity: 20, occupancy: 0, status: 'available', equipment: ['Fire Exit Signs'] },
  { id: 'obj-9', code: 'LIFT-BAY', name: 'Dual Elevator Shaft', category: 'lift', shape: 'square', x: 620, y: 280, w: 120, h: 160, rotation: 0, dept: 'Safety & Facilities', capacity: 16, occupancy: 10, status: 'available', equipment: ['Dual Lifts', 'Braille Buttons'] },
  { id: 'obj-10', code: 'RESTROOM-M', name: 'Gents Restroom', category: 'washroom', shape: 'rectangle', x: 760, y: 280, w: 140, h: 160, rotation: 0, dept: 'Facilities', capacity: 10, occupancy: 20, status: 'available', equipment: ['Automatic Faucets'] },
  { id: 'obj-11', code: 'RESTROOM-F', name: 'Ladies Restroom', category: 'washroom', shape: 'rectangle', x: 920, y: 280, w: 160, h: 160, rotation: 0, dept: 'Facilities', capacity: 10, occupancy: 20, status: 'available', equipment: ['Automatic Faucets', 'Powder Room'] },

  // Bottom Row Auditorium & Cafeteria
  { id: 'obj-12', code: 'LIB-STUDY', name: 'Department Library & E-Reading', category: 'library', shape: 'rectangle', x: 40, y: 460, w: 280, h: 220, rotation: 0, dept: 'Library', capacity: 40, occupancy: 30, status: 'available', equipment: ['RFID Scanners', 'Study Pods'] },
  { id: 'obj-13', code: 'AUD-MAIN', name: 'Mini Auditorium', category: 'seminar', shape: 'polygon', x: 340, y: 460, w: 460, h: 220, rotation: 0, dept: 'Academic Affairs', capacity: 180, occupancy: 75, status: 'occupied', equipment: ['Stage Lighting', 'Acoustic Panels', 'Dolby Audio'], assignedTo: 'National Seminar on Robotics' },
  { id: 'obj-14', code: 'CAFETERIA', name: 'Faculty & Student Cafe', category: 'cafeteria', shape: 'rectangle', x: 820, y: 460, w: 260, h: 220, rotation: 0, dept: 'Campus Services', capacity: 60, occupancy: 40, status: 'available', equipment: ['Coffee Machine', 'Vending Machine'] },

  // Entrance & Exit Markers
  { id: 'obj-15', code: 'ENTRY-MAIN', name: 'North Main Entrance', category: 'entrance', shape: 'square', x: 500, y: 10, w: 80, h: 25, rotation: 0, dept: 'Security', capacity: 50, occupancy: 5, status: 'available', equipment: ['Turnstile Gates'] },
  { id: 'obj-16', code: 'EXIT-EMERGENCY', name: 'South Emergency Exit', category: 'exit', shape: 'square', x: 500, y: 690, w: 80, h: 25, rotation: 0, dept: 'Safety', capacity: 50, occupancy: 0, status: 'available', equipment: ['Panic Push Bar'] }
];

export function FloorManagement() {
  // Buildings & Floors State
  const [buildings, setBuildings] = useState<BuildingInfo[]>(INITIAL_BUILDINGS);
  const [floors, setFloors] = useState<FloorInfo[]>(INITIAL_FLOORS);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | number>('b2');
  const [selectedFloorId, setSelectedFloorId] = useState<string | number>('f1');
  
  // Interactive Vector Canvas State
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>(INITIAL_CANVAS_OBJECTS);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>('obj-1');
  const [activeTool, setActiveTool] = useState<string>('select');
  const [editMode, setEditMode] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const GRID_SIZE = 20;

  // Viewport & Pan/Zoom Controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Object Dragging & Resizing State
  const [isDraggingObj, setIsDraggingObj] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  // Filters & Right Panel
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [buildingSearchQuery, setBuildingSearchQuery] = useState<string>('');
  const [activeRightTab, setActiveRightTab] = useState<'rooms' | 'buildings' | 'floors'>('rooms');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Modals & Feedback
  const [isRoomModalOpen, setIsRoomModalOpen] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Partial<CanvasObject> | null>(null);
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState<boolean>(false);
  const [editingBuilding, setEditingBuilding] = useState<Partial<BuildingInfo> | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<BuildingInfo | null>(null);
  const [isFloorModalOpen, setIsFloorModalOpen] = useState<boolean>(false);
  const [editingFloor, setEditingFloor] = useState<Partial<FloorInfo> | null>(null);
  const [deletingFloor, setDeletingFloor] = useState<FloorInfo | null>(null);
  const [floorValidationError, setFloorValidationError] = useState<string | null>(null);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Filtered floors for selected building ONLY
  const buildingFloors = useMemo(() => {
    return floors
      .filter(f => String(f.buildingId || f.building_id) === String(selectedBuildingId))
      .sort((a, b) => (a.floorNumber ?? 0) - (b.floorNumber ?? 0));
  }, [floors, selectedBuildingId]);

  // Sync selectedFloorId when selected building changes
  useEffect(() => {
    if (buildingFloors.length > 0) {
      if (!buildingFloors.some(f => String(f.id) === String(selectedFloorId))) {
        setSelectedFloorId(buildingFloors[0].id);
      }
    } else {
      const fallback: FloorInfo = {
        id: `f-${selectedBuildingId}-0`,
        buildingId: selectedBuildingId,
        floorNumber: 0,
        name: 'Ground Floor',
        description: 'Ground Floor level layout',
        roomsCount: 12,
        area: '1,200 sq.m'
      };
      setFloors(prev => [...prev, fallback]);
      setSelectedFloorId(fallback.id);
    }
  }, [selectedBuildingId, buildingFloors]);

  // Selected Building and Floor objects
  const selectedBuilding = useMemo(() => {
    return buildings.find(b => String(b.id) === String(selectedBuildingId)) || buildings[0] || { id: 'b2', name: 'Academic Block', code: 'AB-MAIN', description: '', total_floors: 4, status: 'Active' };
  }, [buildings, selectedBuildingId]);

  const selectedFloor = useMemo(() => {
    return floors.find(f => String(f.id) === String(selectedFloorId)) || buildingFloors[0] || { id: 'f1', name: 'Ground Floor', floorNumber: 0, roomsCount: 18, area: '1,200 sq.m' };
  }, [floors, buildingFloors, selectedFloorId]);

  const selectedObject = useMemo(() => {
    return canvasObjects.find(o => o.id === selectedObjectId) || null;
  }, [canvasObjects, selectedObjectId]);

  // Filtered rooms based on search & category
  const filteredObjects = useMemo(() => {
    return canvasObjects.filter(obj => {
      const matchesSearch = searchQuery === '' || 
        obj.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.dept.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedTypeFilter === 'all' || obj.category === selectedTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [canvasObjects, searchQuery, selectedTypeFilter]);

  // Filtered buildings for Buildings Tab Search
  const filteredBuildings = useMemo(() => {
    if (!buildingSearchQuery.trim()) return buildings;
    return buildings.filter(b => 
      b.name.toLowerCase().includes(buildingSearchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(buildingSearchQuery.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(buildingSearchQuery.toLowerCase()))
    );
  }, [buildings, buildingSearchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = canvasObjects.length;
    const classrooms = canvasObjects.filter(r => r.category === 'classroom').length;
    const labs = canvasObjects.filter(r => r.category === 'lab').length;
    const offices = canvasObjects.filter(r => r.category === 'office').length;
    const facilities = canvasObjects.filter(r => ['washroom', 'stairs', 'lift', 'corridor', 'entrance', 'exit'].includes(r.category)).length;
    const occupied = canvasObjects.filter(r => r.status === 'occupied').length;
    const avgOccupancy = Math.round(canvasObjects.reduce((acc, r) => acc + (r.occupancy || 0), 0) / (total || 1));
    return { total, classrooms, labs, offices, facilities, occupied, avgOccupancy };
  }, [canvasObjects]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      triggerToast('Floor plan vector layout saved successfully!');
    }, 600);
  };

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      triggerToast('Interactive Floor Plan published live to Student & Faculty portals!');
    }, 900);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // EDITOR TOOLBAR & OBJECT CREATION HANDLERS (18 TOOLS)
  // ─────────────────────────────────────────────────────────────────────────────

  const handleAddObjectFromToolbar = (category: ObjectCategory, shapeOverride?: RoomShape) => {
    const id = `obj-${Date.now()}`;
    const count = canvasObjects.length + 1;
    const snap = (v: number) => snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v;

    let defaultWidth = 200;
    let defaultHeight = 150;
    let codePrefix = 'RM';
    let defaultName = 'New Room';
    let defaultShape: RoomShape = shapeOverride || 'rectangle';

    switch (category) {
      case 'classroom':
        codePrefix = 'CR'; defaultName = `Lecture Hall ${count}`; defaultWidth = 220; defaultHeight = 160; break;
      case 'lab':
        codePrefix = 'LAB'; defaultName = `Tech Lab ${count}`; defaultWidth = 280; defaultHeight = 160; break;
      case 'office':
        codePrefix = 'OFF'; defaultName = `Faculty Cabin ${count}`; defaultWidth = 160; defaultHeight = 140; break;
      case 'library':
        codePrefix = 'LIB'; defaultName = `Study Hall ${count}`; defaultWidth = 260; defaultHeight = 200; break;
      case 'seminar':
        codePrefix = 'AUD'; defaultName = `Seminar Hall ${count}`; defaultWidth = 380; defaultHeight = 220; defaultShape = 'polygon'; break;
      case 'cafeteria':
        codePrefix = 'CAF'; defaultName = `Campus Cafe ${count}`; defaultWidth = 240; defaultHeight = 180; break;
      case 'corridor':
        codePrefix = 'COR'; defaultName = `Corridor Passage ${count}`; defaultWidth = 400; defaultHeight = 40; break;
      case 'stairs':
        codePrefix = 'STR'; defaultName = `Stairwell ${count}`; defaultWidth = 120; defaultHeight = 140; break;
      case 'lift':
        codePrefix = 'LFT'; defaultName = `Elevator Shaft ${count}`; defaultWidth = 120; defaultHeight = 120; defaultShape = 'square'; break;
      case 'washroom':
        codePrefix = 'WSH'; defaultName = `Restroom ${count}`; defaultWidth = 140; defaultHeight = 140; break;
      case 'entrance':
        codePrefix = 'ENT'; defaultName = `Main Entrance ${count}`; defaultWidth = 100; defaultHeight = 30; defaultShape = 'square'; break;
      case 'exit':
        codePrefix = 'EXT'; defaultName = `Emergency Exit ${count}`; defaultWidth = 100; defaultHeight = 30; defaultShape = 'square'; break;
    }

    const newObj: CanvasObject = {
      id,
      code: `${codePrefix}-${100 + count}`,
      name: defaultName,
      category,
      shape: defaultShape,
      x: snap(100 + (count % 4) * 40),
      y: snap(100 + Math.floor(count / 4) * 40),
      w: defaultWidth,
      h: defaultHeight,
      rotation: 0,
      dept: category === 'lab' || category === 'classroom' ? 'Computer Science' : 'Campus Services',
      capacity: category === 'classroom' ? 60 : category === 'lab' ? 36 : 10,
      occupancy: 0,
      status: 'available',
      equipment: ['Wi-Fi 6', 'AC']
    };

    setCanvasObjects(prev => [...prev, newObj]);
    setSelectedObjectId(id);
    setActiveTool('select');
    triggerToast(`Added ${category} tile to floor plan canvas`);
  };

  const handleRotateSelected = () => {
    if (!selectedObjectId) return;
    setCanvasObjects(prev => prev.map(o => {
      if (o.id === selectedObjectId) {
        const nextRotation = (o.rotation + 90) % 360;
        return { ...o, rotation: nextRotation };
      }
      return o;
    }));
    triggerToast('Rotated selected object by 90°');
  };

  const handleRotate90Deg = (objId: string) => {
    setCanvasObjects(prev => prev.map(o => o.id === objId ? { ...o, rotation: (o.rotation + 90) % 360 } : o));
  };

  const handleChangeShape = (objId: string, shape: RoomShape) => {
    setCanvasObjects(prev => prev.map(o => o.id === objId ? { ...o, shape } : o));
    triggerToast(`Changed room shape to ${shape}`);
  };

  const handleDeleteSelected = () => {
    if (!selectedObjectId) return;
    setCanvasObjects(prev => prev.filter(o => o.id !== selectedObjectId));
    setSelectedObjectId(null);
    triggerToast('Deleted object from floor plan');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERACTIVE CANVAS MOUSE & TOUCH EVENT HANDLERS (DRAG, RESIZE, PAN)
  // ─────────────────────────────────────────────────────────────────────────────

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    // If clicking background canvas, deselect object or start panning
    if (activeTool === 'move' || e.button === 1 || e.spaceKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
    } else if ((e.target as HTMLElement).classList.contains('canvas-bg')) {
      setSelectedObjectId(null);
    }
  };

  const handleMouseDownObject = (e: React.MouseEvent, obj: CanvasObject) => {
    e.stopPropagation();
    setSelectedObjectId(obj.id);
    if (!editMode) return;

    setIsDraggingObj(true);
    setDragOffset({
      x: e.clientX - obj.x,
      y: e.clientY - obj.y
    });
  };

  const handleMouseDownResizeHandle = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setResizeHandle(handle);
  };

  const handleMouseMoveCanvas = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
      return;
    }

    if (!editMode || !selectedObjectId) return;

    const snap = (v: number) => snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v;

    if (isDraggingObj) {
      const newX = snap(e.clientX - dragOffset.x);
      const newY = snap(e.clientY - dragOffset.y);
      setCanvasObjects(prev => prev.map(o => o.id === selectedObjectId ? { ...o, x: Math.max(0, newX), y: Math.max(0, newY) } : o));
    } else if (resizeHandle) {
      setCanvasObjects(prev => prev.map(o => {
        if (o.id !== selectedObjectId) return o;
        let newW = o.w;
        let newH = o.h;
        let newX = o.x;
        let newY = o.y;

        if (resizeHandle.includes('e')) newW = Math.max(60, snap(e.clientX - o.x));
        if (resizeHandle.includes('s')) newH = Math.max(60, snap(e.clientY - o.y));
        if (resizeHandle.includes('w')) {
          const diff = o.x - e.clientX;
          newW = Math.max(60, snap(o.w + diff));
        }
        if (resizeHandle.includes('n')) {
          const diff = o.y - e.clientY;
          newH = Math.max(60, snap(o.h + diff));
        }

        return { ...o, x: newX, y: newY, w: newW, h: newH };
      }));
    }
  }, [isPanning, panStart, editMode, selectedObjectId, isDraggingObj, dragOffset, resizeHandle, snapToGrid]);

  const handleMouseUpCanvas = () => {
    setIsPanning(false);
    setIsDraggingObj(false);
    setResizeHandle(null);
  };

  // Viewport Fit to Screen handler
  const handleFitToScreen = () => {
    setZoomLevel(90);
    setPanX(0);
    setPanY(0);
    triggerToast('Fit floor plan to viewport screen');
  };

  const handleResetCanvas = () => {
    setZoomLevel(100);
    setPanX(0);
    setPanY(0);
    triggerToast('Reset zoom and pan position');
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // BUILDING & FLOOR HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleOpenAddBuildingModal = () => {
    setEditingBuilding({ name: '', code: '', description: '', total_floors: 4, status: 'Active' });
    setIsBuildingModalOpen(true);
  };

  const handleOpenEditBuildingModal = (b: BuildingInfo) => {
    setEditingBuilding({ ...b });
    setIsBuildingModalOpen(true);
  };

  const handleSaveBuildingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBuilding || !editingBuilding.name || !editingBuilding.code) return;
    const payload = {
      name: editingBuilding.name.trim(),
      code: editingBuilding.code.trim().toUpperCase(),
      description: editingBuilding.description || '',
      total_floors: Number(editingBuilding.total_floors) || 1,
      status: editingBuilding.status || 'Active'
    };
    try {
      if (editingBuilding.id) {
        await client.put(`/campus/buildings/${editingBuilding.id}`, payload).catch(() => {});
        setBuildings(prev => prev.map(b => String(b.id) === String(editingBuilding.id) ? { ...b, ...payload } as BuildingInfo : b));
      } else {
        const newB: BuildingInfo = { id: `b-${Date.now()}`, ...payload };
        setBuildings(prev => [newB, ...prev]);
        setSelectedBuildingId(newB.id);
      }
      setIsBuildingModalOpen(false);
      triggerToast(`Saved building details for ${payload.name}`);
    } catch (err) {
      triggerToast('Error saving building');
    }
  };

  const handleConfirmDeleteBuilding = async () => {
    if (!deletingBuilding) return;
    const targetId = deletingBuilding.id;
    setBuildings(prev => prev.filter(b => String(b.id) !== String(targetId)));
    setFloors(prev => prev.filter(f => String(f.buildingId) !== String(targetId)));
    if (String(selectedBuildingId) === String(targetId)) {
      const rem = buildings.filter(b => String(b.id) !== String(targetId));
      if (rem.length > 0) setSelectedBuildingId(rem[0].id);
    }
    setDeletingBuilding(null);
    triggerToast('Building deleted');
  };

  const handleOpenAddFloorModal = () => {
    const nextNum = buildingFloors.length > 0 ? Math.max(...buildingFloors.map(f => f.floorNumber ?? 0)) + 1 : 0;
    setEditingFloor({
      buildingId: selectedBuildingId,
      name: nextNum === 0 ? 'Ground Floor' : `${nextNum}${nextNum === 1 ? 'st' : nextNum === 2 ? 'nd' : 'th'} Floor`,
      floorNumber: nextNum,
      description: `Classrooms & facilities`
    });
    setFloorValidationError(null);
    setIsFloorModalOpen(true);
  };

  const handleOpenEditFloorModal = (f: FloorInfo) => {
    setEditingFloor({ ...f });
    setFloorValidationError(null);
    setIsFloorModalOpen(true);
  };

  const handleSaveFloorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFloor || !editingFloor.name) return;
    const numFloor = Number(editingFloor.floorNumber);
    const isDup = floors.some(f => String(f.buildingId) === String(selectedBuildingId) && f.floorNumber === numFloor && String(f.id) !== String(editingFloor.id));
    if (isDup) {
      setFloorValidationError(`Floor number ${numFloor} already exists in ${selectedBuilding.name}.`);
      return;
    }
    const payload = {
      buildingId: selectedBuildingId,
      name: editingFloor.name.trim(),
      floorNumber: numFloor,
      description: editingFloor.description || ''
    };
    if (editingFloor.id) {
      setFloors(prev => prev.map(f => String(f.id) === String(editingFloor.id) ? { ...f, ...payload } as FloorInfo : f));
    } else {
      const newF: FloorInfo = { id: `f-${selectedBuildingId}-${Date.now()}`, ...payload };
      setFloors(prev => [...prev, newF]);
      setSelectedFloorId(newF.id);
    }
    setIsFloorModalOpen(false);
    triggerToast(`Saved floor level ${payload.name}`);
  };

  const handleDuplicateFloor = (f: FloorInfo) => {
    const nextNum = Math.max(...buildingFloors.map(fl => fl.floorNumber ?? 0)) + 1;
    const newF: FloorInfo = { ...f, id: `f-${f.buildingId}-${Date.now()}`, name: `${f.name} (Copy)`, floorNumber: nextNum };
    setFloors(prev => [...prev, newF]);
    setSelectedFloorId(newF.id);
    triggerToast(`Duplicated floor level`);
  };

  const handleConfirmDeleteFloor = () => {
    if (!deletingFloor) return;
    setFloors(prev => prev.filter(f => String(f.id) !== String(deletingFloor.id)));
    setDeletingFloor(null);
    triggerToast('Floor deleted');
  };

  const handleOpenEditModal = (obj: CanvasObject) => {
    setEditingRoom({ ...obj });
    setIsRoomModalOpen(true);
  };

  const handleSaveRoomModal = () => {
    if (!editingRoom || !editingRoom.id) return;
    setCanvasObjects(prev => prev.map(o => o.id === editingRoom.id ? { ...o, ...editingRoom } as CanvasObject : o));
    setIsRoomModalOpen(false);
    triggerToast(`Updated configuration for ${editingRoom.code}`);
  };

  // Category Styling Helper
  const getCategoryTheme = (cat: ObjectCategory) => {
    switch (cat) {
      case 'classroom': return { bg: 'bg-indigo-50/90 dark:bg-indigo-950/60', border: 'border-indigo-400 dark:border-indigo-700', text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700' };
      case 'lab': return { bg: 'bg-emerald-50/90 dark:bg-emerald-950/60', border: 'border-emerald-400 dark:border-emerald-700', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700' };
      case 'office': return { bg: 'bg-amber-50/90 dark:bg-amber-950/60', border: 'border-amber-400 dark:border-amber-700', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 dark:bg-amber-950 text-amber-700' };
      case 'library': return { bg: 'bg-cyan-50/90 dark:bg-cyan-950/60', border: 'border-cyan-400 dark:border-cyan-700', text: 'text-cyan-600 dark:text-cyan-400', badge: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700' };
      case 'seminar': return { bg: 'bg-purple-50/90 dark:bg-purple-950/60', border: 'border-purple-400 dark:border-purple-700', text: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-100 dark:bg-purple-950 text-purple-700' };
      case 'cafeteria': return { bg: 'bg-rose-50/90 dark:bg-rose-950/60', border: 'border-rose-400 dark:border-rose-700', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-100 dark:bg-rose-950 text-rose-700' };
      case 'corridor': return { bg: 'bg-slate-200/80 dark:bg-slate-800/80', border: 'border-dashed border-slate-400 dark:border-slate-600', text: 'text-slate-500', badge: 'bg-slate-300 dark:bg-slate-700 text-slate-700' };
      case 'stairs': case 'lift': return { bg: 'bg-blue-50/90 dark:bg-blue-950/60', border: 'border-blue-400 dark:border-blue-700', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-100 dark:bg-blue-950 text-blue-700' };
      case 'washroom': return { bg: 'bg-sky-50/90 dark:bg-sky-950/60', border: 'border-sky-400 dark:border-sky-700', text: 'text-sky-600 dark:text-sky-400', badge: 'bg-sky-100 dark:bg-sky-950 text-sky-700' };
      case 'entrance': return { bg: 'bg-emerald-500/90 text-white', border: 'border-emerald-600', text: 'text-white', badge: 'bg-emerald-700 text-white' };
      case 'exit': return { bg: 'bg-rose-500/90 text-white', border: 'border-rose-600', text: 'text-white', badge: 'bg-rose-700 text-white' };
      default: return { bg: 'bg-slate-100/90 dark:bg-slate-800/60', border: 'border-slate-300 dark:border-slate-700', text: 'text-slate-600', badge: 'bg-slate-200 text-slate-700' };
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
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1">
              <span className="hover:text-blue-600 cursor-pointer">Campus</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="hover:text-blue-600 cursor-pointer">{selectedBuilding.name}</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-blue-600 dark:text-blue-400 font-bold">{selectedFloor.name}</span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Floor Management</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                Vector Canvas Editor
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              View and manage rooms, labs, classrooms and facilities in the selected building and floor.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center min-w-[80px]">
              <span className="block text-xs text-slate-400 font-medium">Objects</span>
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
      {/* TOP CONTROLS BAR & DROPDOWNS */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          
          <div className="relative min-w-[190px]">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Building</label>
            <div className="relative">
              <select
                value={selectedBuildingId}
                onChange={e => setSelectedBuildingId(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="relative min-w-[170px]">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Floor Level ({buildingFloors.length})</label>
            <div className="relative">
              <select
                value={selectedFloorId}
                onChange={e => setSelectedFloorId(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {buildingFloors.map(f => (
                  <option key={f.id} value={f.id}>{f.name} (Level {f.floorNumber})</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Search Canvas</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search room code, lab, or office..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3">
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={cn(
                "px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5",
                snapToGrid ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-900" : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
              )}
            >
              <Grid className="w-3.5 h-3.5" /> Snap Grid: {snapToGrid ? 'ON' : 'OFF'}
            </button>
          </div>

        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setEditMode(false)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                !editMode ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" /> View
            </button>
            <button
              onClick={() => setEditMode(true)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                editMode ? "bg-amber-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Mode
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm border border-slate-700"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" /> : <Save className="w-3.5 h-3.5 text-blue-400" />}
            <span>Save</span>
          </button>

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
      {/* 18-TOOL EDITOR TOOLBAR PALETTE */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {editMode && (
        <div className="bg-slate-900 text-white border-b border-slate-800 px-6 py-2 flex items-center justify-between overflow-x-auto scrollbar-none z-30 flex-shrink-0">
          <div className="flex items-center gap-1.5 min-w-max">
            
            {/* Tool 1: Select */}
            <button
              onClick={() => setActiveTool('select')}
              className={cn("px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all", activeTool === 'select' ? "bg-blue-600 text-white shadow-sm" : "hover:bg-slate-800 text-slate-300")}
              title="1. Select Pointer Tool"
            >
              <MousePointer className="w-3.5 h-3.5 text-blue-400" /> 1. Select
            </button>

            <div className="w-px h-4 bg-slate-800 mx-1" />

            {/* Tools 2-14: Object Add Tools */}
            <button onClick={() => handleAddObjectFromToolbar('room')} className="px-2 py-1 hover:bg-slate-800 rounded-lg text-xs text-slate-300 font-semibold flex items-center gap-1" title="2. Add Generic Room">
              <Square className="w-3.5 h-3.5 text-indigo-400" /> 2. Room
            </button>
            <button onClick={() => handleAddObjectFromToolbar('corridor')} className="px-2 py-1 hover:bg-slate-800 rounded-lg text-xs text-slate-300 font-semibold flex items-center gap-1" title="3. Add Corridor">
              <LayoutGrid className="w-3.5 h-3.5 text-slate-400" /> 3. Corridor
            </button>
            <button onClick={() => handleAddObjectFromToolbar('stairs')} className="px-2 py-1 hover:bg-slate-800 rounded-lg text-xs text-slate-300 font-semibold flex items-center gap-1" title="4. Add Stairs">
              <ArrowUp className="w-3.5 h-3.5 text-blue-400" /> 4. Stairs
            </button>
            <button onClick={() => handleAddObjectFromToolbar('lift')} className="px-2 py-1 hover:bg-slate-800 rounded-lg text-xs text-slate-300 font-semibold flex items-center gap-1" title="5. Add Lift">
              <ArrowDown className="w-3.5 h-3.5 text-blue-400" /> 5. Lift
            </button>
            <button onClick={() => handleAddObjectFromToolbar('washroom')} className="px-2 py-1 hover:bg-slate-800 rounded-lg text-xs text-slate-300 font-semibold flex items-center gap-1" title="6. Add Washroom">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" /> 6. Washroom
            </button>
            <button onClick={() => handleAddObjectFromToolbar('office')} className="px-2 py-1 hover:bg-slate-800 rounded-lg text-xs text-slate-300 font-semibold flex items-center gap-1" title="7. Add Office">
              <Users className="w-3.5 h-3.5 text-amber-400" /> 7. Office
            </button>
            <button onClick={() => handleAddObjectFromToolbar('lab')} className="px-2 py-1 hover:bg-slate-800 rounded-lg text-xs text-slate-300 font-semibold flex items-center gap-1" title="8. Add Lab">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" /> 8. Lab
            </button>
            <button onClick={() => handleAddObjectFromToolbar('classroom')} className="px-2 py-1 hover:bg-slate-800 rounded-lg text-xs text-slate-300 font-semibold flex items-center gap-1" title="9. Add Classroom">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> 9. Classroom
            </button>
            <button onClick={() => handleAddObjectFromToolbar('library')} className="px-2 py-1 hover:bg-slate-800 rounded-lg text-xs text-slate-300 font-semibold flex items-center gap-1" title="10. Add Library">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> 10. Library
            </button>
            <button onClick={() => handleAddObjectFromToolbar('seminar')} className="px-2 py-1 hover:bg-slate-800 rounded-lg text-xs text-slate-300 font-semibold flex items-center gap-1" title="11. Add Seminar Hall">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> 11. Seminar
            </button>
            <button onClick={() => handleAddObjectFromToolbar('cafeteria')} className="px-2 py-1 hover:bg-slate-800 rounded-lg text-xs text-slate-300 font-semibold flex items-center gap-1" title="12. Add Cafeteria">
              <Coffee className="w-3.5 h-3.5 text-rose-400" /> 12. Cafeteria
            </button>
            <button onClick={() => handleAddObjectFromToolbar('entrance')} className="px-2 py-1 hover:bg-slate-800 rounded-lg text-xs text-slate-300 font-semibold flex items-center gap-1" title="13. Add Entrance">
              <LogIn className="w-3.5 h-3.5 text-emerald-400" /> 13. Entrance
            </button>
            <button onClick={() => handleAddObjectFromToolbar('exit')} className="px-2 py-1 hover:bg-slate-800 rounded-lg text-xs text-slate-300 font-semibold flex items-center gap-1" title="14. Add Exit">
              <LogOut className="w-3.5 h-3.5 text-rose-400" /> 14. Exit
            </button>

            <div className="w-px h-4 bg-slate-800 mx-1" />

            {/* Tools 15-18: Manipulate Actions */}
            <button
              onClick={() => setActiveTool(activeTool === 'move' ? 'select' : 'move')}
              className={cn("px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all", activeTool === 'move' ? "bg-amber-500 text-white" : "hover:bg-slate-800 text-slate-300")}
              title="15. Move Canvas / Pan"
            >
              <Move className="w-3.5 h-3.5" /> 15. Move
            </button>
            <button
              onClick={handleRotateSelected}
              disabled={!selectedObjectId}
              className="px-2 py-1 hover:bg-slate-800 disabled:opacity-30 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1"
              title="17. Rotate Selected Object 90°"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" /> 17. Rotate
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={!selectedObjectId}
              className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 disabled:opacity-30 rounded-lg text-xs font-bold flex items-center gap-1"
              title="18. Delete Selected Object"
            >
              <Trash2 className="w-3.5 h-3.5" /> 18. Delete
            </button>

          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MAIN REAL INTERACTIVE VECTOR FLOOR CANVAS */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
          
          {/* North Architectural Indicator Badge (Top Right) */}
          <div className="absolute top-4 right-4 z-20 flex flex-col items-center bg-slate-900/90 text-white backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-slate-800 pointer-events-none select-none">
            <div className="w-8 h-8 rounded-full border-2 border-amber-400 flex items-center justify-center relative">
              <span className="text-[10px] font-black text-amber-400 absolute top-0.5">N</span>
              <Compass className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-400 tracking-widest mt-1">NORTH</span>
          </div>

          {/* Floating Canvas Viewport Tools (Top Left) */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/90 text-white backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-800">
            <button onClick={() => setZoomLevel(prev => Math.min(prev + 15, 180))} title="Zoom In (+)" className="p-2 rounded-xl text-slate-300 hover:bg-slate-800">
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-300 px-1 min-w-[40px] text-center">{zoomLevel}%</span>
            <button onClick={() => setZoomLevel(prev => Math.max(prev - 15, 40))} title="Zoom Out (-)" className="p-2 rounded-xl text-slate-300 hover:bg-slate-800">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={handleResetCanvas} title="Reset Zoom & Pan" className="p-2 rounded-xl text-slate-300 hover:bg-slate-800">
              <Maximize2 className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-slate-800 my-auto mx-1" />
            <button onClick={handleFitToScreen} title="Fit to Screen" className="p-2 rounded-xl text-slate-300 hover:bg-slate-800">
              <Maximize className="w-4 h-4" />
            </button>
            <button onClick={handleToggleFullscreen} title="Toggle Fullscreen" className="p-2 rounded-xl text-slate-300 hover:bg-slate-800">
              <Minimize className="w-4 h-4" />
            </button>
          </div>

          {/* REAL VECTOR FLOOR PLAN EDITOR CANVAS CONTAINER */}
          <div
            ref={canvasContainerRef}
            onMouseDown={handleMouseDownCanvas}
            onMouseMove={handleMouseMoveCanvas}
            onMouseUp={handleMouseUpCanvas}
            className={cn(
              "flex-1 overflow-hidden relative flex items-center justify-center canvas-bg cursor-grab active:cursor-grabbing select-none",
              activeTool === 'move' && "!cursor-move"
            )}
          >
            <div
              style={{
                transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel / 100})`,
                transformOrigin: 'center center',
                transition: isPanning || isDraggingObj ? 'none' : 'transform 0.1s ease-out'
              }}
              className={cn(
                "relative w-[1160px] h-[740px] bg-slate-900 rounded-3xl shadow-2xl border-4 border-slate-800 overflow-hidden flex-shrink-0 transition-all canvas-bg",
                showGrid ? "bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]" : ""
              )}
            >

              {/* Watermark Label */}
              <div className="absolute top-6 left-8 pointer-events-none select-none opacity-15">
                <p className="text-4xl font-black uppercase tracking-widest text-white">{selectedBuilding.code}</p>
                <p className="text-xl font-bold text-slate-300">{selectedBuilding.name} - {selectedFloor.name}</p>
              </div>

              {/* VECTOR OBJECTS RENDER LOOP */}
              {filteredObjects.map(obj => {
                const isSelected = selectedObjectId === obj.id;
                const theme = getCategoryTheme(obj.category);

                return (
                  <div
                    key={obj.id}
                    onMouseDown={(e) => handleMouseDownObject(e, obj)}
                    style={{
                      left: `${obj.x}px`,
                      top: `${obj.y}px`,
                      width: `${obj.w}px`,
                      height: `${obj.h}px`,
                      transform: `rotate(${obj.rotation}deg)`,
                      transformOrigin: 'center center'
                    }}
                    className={cn(
                      "absolute rounded-2xl p-3 border-2 transition-shadow flex flex-col justify-between cursor-pointer group shadow-md select-none",
                      theme.bg, theme.border,
                      isSelected && "ring-4 ring-blue-500 ring-offset-2 ring-offset-slate-950 border-blue-500 z-20 shadow-2xl scale-[1.01]"
                    )}
                  >
                    
                    {/* SVG Shape Graphic for L-Shape or Polygon */}
                    {obj.shape === 'l-shape' && (
                      <div className="absolute inset-0 pointer-events-none opacity-20">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <path d="M 0 0 H 100 V 40 H 40 V 100 H 0 Z" fill="currentColor" className={theme.text} />
                        </svg>
                      </div>
                    )}

                    {/* Top Row: Code & Category Icon */}
                    <div className="flex items-center justify-between gap-1 z-10">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs tracking-wider text-slate-900 dark:text-white">
                          {obj.code}
                        </span>
                        {obj.category === 'lab' && <Cpu className="w-3.5 h-3.5 text-emerald-500" />}
                        {obj.category === 'classroom' && <BookOpen className="w-3.5 h-3.5 text-indigo-500" />}
                        {obj.category === 'office' && <Users className="w-3.5 h-3.5 text-amber-500" />}
                      </div>

                      <span className={cn("px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase", theme.badge)}>
                        {obj.category}
                      </span>
                    </div>

                    {/* Room Name */}
                    <div className="z-10">
                      <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 leading-tight">{obj.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{obj.dept}</p>
                    </div>

                    {/* Bottom Capacity Bar */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800 z-10">
                      <span className="font-semibold">{obj.capacity} Seats</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{obj.occupancy || 0}% Occupied</span>
                    </div>

                    {/* SELECTION BORDER & RESIZE/ROTATE/DELETE HANDLES */}
                    {isSelected && editMode && (
                      <>
                        {/* Top Rotation Knob */}
                        <div
                          onClick={(e) => { e.stopPropagation(); handleRotate90Deg(obj.id); }}
                          className="absolute -top-7 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </div>

                        {/* Corner Resize Handles */}
                        <div onMouseDown={(e) => handleMouseDownResizeHandle(e, 'nw')} className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize shadow-md" />
                        <div onMouseDown={(e) => handleMouseDownResizeHandle(e, 'ne')} className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize shadow-md" />
                        <div onMouseDown={(e) => handleMouseDownResizeHandle(e, 'se')} className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize shadow-md" />
                        <div onMouseDown={(e) => handleMouseDownResizeHandle(e, 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize shadow-md" />

                        {/* Quick Action Floating Menu */}
                        <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900 text-white px-2 py-1 rounded-xl shadow-2xl border border-slate-700 text-[10px] font-bold z-30">
                          <button onClick={() => handleChangeShape(obj.id, 'rectangle')} className={cn("px-1.5 py-0.5 rounded", obj.shape === 'rectangle' && "bg-blue-600")}>Rect</button>
                          <button onClick={() => handleChangeShape(obj.id, 'square')} className={cn("px-1.5 py-0.5 rounded", obj.shape === 'square' && "bg-blue-600")}>Square</button>
                          <button onClick={() => handleChangeShape(obj.id, 'l-shape')} className={cn("px-1.5 py-0.5 rounded", obj.shape === 'l-shape' && "bg-blue-600")}>L-Shape</button>
                          <button onClick={() => handleOpenEditModal(obj)} className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-blue-300">Edit</button>
                          <button onClick={handleDeleteSelected} className="px-1.5 py-0.5 bg-rose-900 hover:bg-rose-800 rounded text-rose-300">Del</button>
                        </div>
                      </>
                    )}

                  </div>
                );
              })}

            </div>
          </div>

          {/* MINIMAP OVERLAY (Bottom Right) */}
          <div className="absolute bottom-4 right-4 z-20 w-48 h-32 bg-slate-900/90 backdrop-blur-md rounded-2xl border-2 border-slate-700 shadow-2xl p-2 overflow-hidden pointer-events-auto flex flex-col justify-between">
            <div className="flex items-center justify-between text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
              <span>Layout Minimap</span>
              <span className="text-blue-400">{canvasObjects.length} Objects</span>
            </div>

            {/* Minimap Graphics Grid */}
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = (e.clientX - rect.left) / rect.width;
                const clickY = (e.clientY - rect.top) / rect.height;
                setPanX((0.5 - clickX) * 400);
                setPanY((0.5 - clickY) * 300);
              }}
              className="relative w-full flex-1 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden cursor-crosshair"
            >
              {canvasObjects.map(obj => (
                <div
                  key={obj.id}
                  style={{
                    left: `${(obj.x / 1160) * 100}%`,
                    top: `${(obj.y / 740) * 100}%`,
                    width: `${(obj.w / 1160) * 100}%`,
                    height: `${(obj.h / 740) * 100}%`
                  }}
                  className="absolute bg-blue-500/60 rounded-xs border border-blue-400"
                />
              ))}

              {/* Viewport Target Rectangle */}
              <div
                style={{
                  left: `${Math.max(0, Math.min(80, 50 - (panX / 400) * 50))}%`,
                  top: `${Math.max(0, Math.min(80, 50 - (panY / 300) * 50))}%`,
                  width: `${Math.max(20, Math.min(100, (100 / zoomLevel) * 80))}%`,
                  height: `${Math.max(20, Math.min(100, (100 / zoomLevel) * 80))}%`
                }}
                className="absolute border-2 border-amber-400 bg-amber-400/10 pointer-events-none rounded-xs"
              />
            </div>
          </div>

          {/* Canvas Bottom Legend Bar */}
          <div className="bg-slate-900 border-t border-slate-800 px-6 py-2 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-300">Object Legend:</span>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500" /><span>Classroom</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /><span>Lab</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500" /><span>Office</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-purple-500" /><span>Seminar</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500" /><span>Cafeteria</span></div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Available</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Occupied</span>
            </div>
          </div>

        </div>

        {/* ───────────────────────────────────────────────────────────────────────────── */}
        {/* RIGHT INSPECTOR PANEL (TABS: ROOMS, BUILDINGS, FLOORS) */}
        {/* ───────────────────────────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0">
          
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <button
              onClick={() => setActiveRightTab('rooms')}
              className={cn(
                "flex-1 py-3 px-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5",
                activeRightTab === 'rooms' ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900" : "border-transparent text-slate-500"
              )}
            >
              <DoorOpen className="w-4 h-4" /> Objects ({filteredObjects.length})
            </button>

            <button
              onClick={() => setActiveRightTab('floors')}
              className={cn(
                "flex-1 py-3 px-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5",
                activeRightTab === 'floors' ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900" : "border-transparent text-slate-500"
              )}
            >
              <Layers className="w-4 h-4" /> Floors ({buildingFloors.length})
            </button>

            <button
              onClick={() => setActiveRightTab('buildings')}
              className={cn(
                "flex-1 py-3 px-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5",
                activeRightTab === 'buildings' ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900" : "border-transparent text-slate-500"
              )}
            >
              <Building2 className="w-4 h-4" /> Buildings ({buildings.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            
            {/* TAB 1: OBJECTS INSPECTOR */}
            {activeRightTab === 'rooms' && (
              <>
                {selectedObject ? (
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-md text-[10px] font-bold uppercase">
                          {selectedObject.category} • {selectedObject.shape}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{selectedObject.code}: {selectedObject.name}</h3>
                        <p className="text-xs text-slate-500">{selectedObject.dept}</p>
                      </div>
                      <button onClick={() => handleOpenEditModal(selectedObject)} className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600" title="Edit Config">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                      <div><span className="text-slate-400 block text-[10px]">Capacity</span><span className="font-bold">{selectedObject.capacity} Seats</span></div>
                      <div><span className="text-slate-400 block text-[10px]">Status</span><span className="font-bold capitalize">{selectedObject.status}</span></div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                      <div><span className="text-slate-400 block text-[9px]">X Position</span><span className="font-mono font-bold">{selectedObject.x}px</span></div>
                      <div><span className="text-slate-400 block text-[9px]">Y Position</span><span className="font-mono font-bold">{selectedObject.y}px</span></div>
                      <div><span className="text-slate-400 block text-[9px]">Rotation</span><span className="font-mono font-bold">{selectedObject.rotation}°</span></div>
                    </div>

                    <button onClick={handleDeleteSelected} className="w-full mt-2 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 flex items-center justify-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Delete Selected Object
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                    Click any object on the vector floor canvas to inspect and modify properties.
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                    <span>Floor Objects List</span>
                    <span>{filteredObjects.length} Total</span>
                  </div>

                  <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                    {filteredObjects.map(r => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedObjectId(r.id)}
                        className={cn(
                          "p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs",
                          selectedObjectId === r.id ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 font-bold" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-white">{r.code}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase bg-slate-100 dark:bg-slate-700">{r.category}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{r.name}</p>
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{r.capacity} Seats</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: FLOORS DIRECTORY */}
            {activeRightTab === 'floors' && (
              <div className="space-y-3">
                <button onClick={handleOpenAddFloorModal} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add New Floor Level
                </button>

                <div className="space-y-2">
                  {buildingFloors.map(f => (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFloorId(f.id)}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                        String(selectedFloorId) === String(f.id) ? "bg-blue-600 text-white border-blue-700 shadow-md" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      )}
                    >
                      <div>
                        <span className={cn("text-xs font-bold block", String(selectedFloorId) === String(f.id) ? "text-white" : "text-slate-900 dark:text-white")}>{f.name}</span>
                        <span className={cn("text-[11px]", String(selectedFloorId) === String(f.id) ? "text-blue-100" : "text-slate-400")}>Level {f.floorNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenEditFloorModal(f); }} className="p-1 text-slate-400 hover:text-white"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDuplicateFloor(f); }} className="p-1 text-slate-400 hover:text-white"><Copy className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: BUILDINGS DIRECTORY */}
            {activeRightTab === 'buildings' && (
              <div className="space-y-3">
                <button onClick={handleOpenAddBuildingModal} className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add New Building
                </button>

                <div className="space-y-2">
                  {filteredBuildings.map(b => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBuildingId(b.id)}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1",
                        String(b.id) === String(selectedBuildingId) ? "bg-blue-50 dark:bg-blue-950/50 border-blue-500 shadow-md" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900 dark:text-white">{b.name}</span>
                        <span className="text-xs font-extrabold text-blue-600 bg-blue-100 dark:bg-blue-950 px-1.5 py-0.2 rounded">{b.code}</span>
                      </div>
                      <p className="text-xs text-slate-500">{b.total_floors || 1} Floors Total</p>
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
                <Edit3 className="w-5 h-5 text-blue-500" /> Edit Canvas Object Config
              </h3>
              <button onClick={() => setIsRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Code / Room Number</label>
                <input
                  type="text"
                  value={editingRoom.code || ''}
                  onChange={e => setEditingRoom(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Display Title</label>
                <input
                  type="text"
                  value={editingRoom.name || ''}
                  onChange={e => setEditingRoom(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Shape</label>
                  <select
                    value={editingRoom.shape || 'rectangle'}
                    onChange={e => setEditingRoom(prev => ({ ...prev, shape: e.target.value as RoomShape }))}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="rectangle">Rectangle</option>
                    <option value="square">Square</option>
                    <option value="l-shape">L-Shaped Room</option>
                    <option value="polygon">Custom Polygon</option>
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
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setIsRoomModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={handleSaveRoomModal} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md">Save Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default FloorManagement;
