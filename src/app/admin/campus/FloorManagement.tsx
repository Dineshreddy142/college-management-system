import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Building2, Layers, DoorOpen, Search, Edit3, Save, Send, Plus, 
  ZoomIn, ZoomOut, Maximize2, Grid, Eye, Trash2, CheckCircle2, 
  AlertCircle, ChevronRight, Sparkles, Users, Cpu, BookOpen, 
  ChevronDown, RefreshCw, X, AlertTriangle, ArrowUp, ArrowDown, Copy,
  Compass, MousePointer, Move, RotateCw, Maximize, Minimize, Utensils,
  Coffee, LogIn, LogOut, ArrowRight, CornerDownRight, Square, SlidersHorizontal,
  Flame, LayoutGrid, Info, Calendar, FileText, Shield, Box, Droplets, UserCheck, Car
} from 'lucide-react';
import { cn } from '../../../components/ui/Btn';
import client from '../../../api/client';
import { useAuth } from '../../portal/AuthContext';

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
  publishStatus?: 'DRAFT' | 'PUBLISHED';
  lastSavedAt?: string;
  lastPublishedAt?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type RoomType = 
  | 'Classroom'
  | 'Laboratory'
  | 'Computer Lab'
  | 'Office'
  | 'Faculty Room'
  | 'Staff Room'
  | 'Library'
  | 'Seminar Hall'
  | 'Conference Room'
  | 'Store Room'
  | 'Washroom'
  | 'Cafeteria'
  | 'Other';

export type RoomShape = 'rectangle' | 'square' | 'l-shape' | 'polygon';

export interface RoomRecord {
  id: string | number;
  floorId: string | number;
  buildingId?: string | number;
  roomNumber: string;
  roomName: string;
  roomType: RoomType;
  capacity: number;
  department: string;
  description: string;
  status: 'Available' | 'Occupied' | 'Maintenance' | 'Reserved';
  x: number; // canvas position in pixels
  y: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270 degrees
  shape: RoomShape;
  createdAt?: string;
  updatedAt?: string;
}

export const ALL_ROOM_TYPES: RoomType[] = [
  'Classroom',
  'Laboratory',
  'Computer Lab',
  'Office',
  'Faculty Room',
  'Staff Room',
  'Library',
  'Seminar Hall',
  'Conference Room',
  'Store Room',
  'Washroom',
  'Cafeteria',
  'Other'
];

export type FacilityObjectType = 
  | 'Stairs'
  | 'Lift'
  | "Men's Washroom"
  | "Women's Washroom"
  | 'Accessible Washroom'
  | 'Corridor'
  | 'Lobby'
  | 'Entrance'
  | 'Emergency Exit'
  | 'Fire Exit'
  | 'Drinking Water'
  | 'Reception'
  | 'Security Desk'
  | 'Cafeteria'
  | 'Parking/Access Area'
  | 'Store Room';

export const ALL_FACILITY_TYPES: FacilityObjectType[] = [
  'Stairs',
  'Lift',
  "Men's Washroom",
  "Women's Washroom",
  'Accessible Washroom',
  'Corridor',
  'Lobby',
  'Entrance',
  'Emergency Exit',
  'Fire Exit',
  'Drinking Water',
  'Reception',
  'Security Desk',
  'Cafeteria',
  'Parking/Access Area',
  'Store Room'
];

export interface FloorPlanObjectRecord {
  id: string | number;
  floorId: string | number;
  objectType: FacilityObjectType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  shape: string;
  metadata?: {
    description?: string;
    status?: 'Active' | 'Under Maintenance' | 'Closed' | 'Restricted' | 'Available' | string;
    [key: string]: any;
  } | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchResultItem {
  id: string;
  type: 'room' | 'facility' | 'floor' | 'building';
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  buildingId: string | number;
  buildingName: string;
  floorId: string | number;
  floorName: string;
  targetId?: string | number;
  targetType?: 'room' | 'facility';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export function getFacilityBadgeColor(type: string): string {
  switch (type) {
    case 'Stairs': return 'bg-blue-900/60 text-blue-300 border-blue-700';
    case 'Lift': return 'bg-purple-900/60 text-purple-300 border-purple-700';
    case "Men's Washroom":
    case "Women's Washroom":
    case 'Accessible Washroom':
    case 'Washroom': return 'bg-sky-900/60 text-sky-300 border-sky-700';
    case 'Emergency Exit':
    case 'Fire Exit': return 'bg-rose-900/60 text-rose-300 border-rose-700';
    case 'Drinking Water': return 'bg-cyan-900/60 text-cyan-300 border-cyan-700';
    case 'Reception': return 'bg-indigo-900/60 text-indigo-300 border-indigo-700';
    case 'Security Desk': return 'bg-violet-900/60 text-violet-300 border-violet-700';
    case 'Cafeteria': return 'bg-orange-900/60 text-orange-300 border-orange-700';
    case 'Store Room': return 'bg-yellow-900/60 text-yellow-300 border-yellow-700';
    default: return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

export function getFacilityIcon(type: string) {
  switch (type) {
    case 'Stairs': return <Layers className="w-3.5 h-3.5 text-blue-400" />;
    case 'Lift': return <ArrowUp className="w-3.5 h-3.5 text-purple-400" />;
    case "Men's Washroom":
    case "Women's Washroom":
    case 'Accessible Washroom':
    case 'Washroom': return <Droplets className="w-3.5 h-3.5 text-sky-400" />;
    case 'Emergency Exit':
    case 'Fire Exit': return <Flame className="w-3.5 h-3.5 text-rose-400" />;
    case 'Drinking Water': return <Droplets className="w-3.5 h-3.5 text-cyan-400" />;
    case 'Reception': return <UserCheck className="w-3.5 h-3.5 text-indigo-400" />;
    case 'Security Desk': return <Shield className="w-3.5 h-3.5 text-violet-400" />;
    case 'Cafeteria': return <Utensils className="w-3.5 h-3.5 text-orange-400" />;
    case 'Store Room': return <Box className="w-3.5 h-3.5 text-yellow-400" />;
    default: return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
  }
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
  { id: 'f1', buildingId: 'b2', floorNumber: 0, name: 'Ground Floor', description: 'Main Lobby, Seminar Halls & Student Helpdesk', roomsCount: 18, area: '1,200 sq.m', displayOrder: 1, publishStatus: 'PUBLISHED', lastSavedAt: new Date(Date.now() - 3600000).toISOString(), lastPublishedAt: new Date(Date.now() - 1800000).toISOString(), updatedBy: 'Admin' },
  { id: 'f2', buildingId: 'b2', floorNumber: 1, name: '1st Floor', description: 'Computer Science Classrooms & Smart Labs', roomsCount: 16, area: '1,150 sq.m', displayOrder: 2, publishStatus: 'DRAFT', lastSavedAt: new Date(Date.now() - 7200000).toISOString(), updatedBy: 'Admin' },
  { id: 'f3', buildingId: 'b2', floorNumber: 2, name: '2nd Floor', description: 'Electronics & Communication Lecture Halls', roomsCount: 16, area: '1,150 sq.m', displayOrder: 3, publishStatus: 'PUBLISHED', lastSavedAt: new Date(Date.now() - 86400000).toISOString(), lastPublishedAt: new Date(Date.now() - 43200000).toISOString(), updatedBy: 'Admin' },
  { id: 'f4', buildingId: 'b2', floorNumber: 3, name: '3rd Floor', description: 'Post Graduate Research Labs & HOD Suites', roomsCount: 18, area: '1,100 sq.m', displayOrder: 4, publishStatus: 'DRAFT', updatedBy: 'Admin' },

  { id: 'f5', buildingId: 'b1', floorNumber: 0, name: 'Ground Floor', description: 'Executive Reception & Board Room', roomsCount: 12, area: '1,500 sq.m', displayOrder: 1, publishStatus: 'PUBLISHED', updatedBy: 'Admin' },
  { id: 'f6', buildingId: 'b1', floorNumber: 1, name: '1st Floor', description: 'Principal & Vice Chancellor Offices', roomsCount: 10, area: '1,400 sq.m', displayOrder: 2, publishStatus: 'DRAFT', updatedBy: 'Admin' },

  { id: 'f7', buildingId: 'b3', floorNumber: 0, name: 'Ground Floor', description: 'Physics & Applied Mechanics Wing', roomsCount: 14, area: '1,300 sq.m', displayOrder: 1, publishStatus: 'PUBLISHED', updatedBy: 'Admin' },
  { id: 'f8', buildingId: 'b3', floorNumber: 1, name: '1st Floor', description: 'Chemistry & Biotechnology Labs', roomsCount: 15, area: '1,300 sq.m', displayOrder: 2, publishStatus: 'DRAFT', updatedBy: 'Admin' },

  { id: 'f9', buildingId: 'b4', floorNumber: 0, name: 'Ground Floor', description: 'Heavy Machinery & Mechanical Workshops', roomsCount: 14, area: '1,250 sq.m', displayOrder: 1, publishStatus: 'PUBLISHED', updatedBy: 'Admin' },
  { id: 'f10', buildingId: 'b4', floorNumber: 1, name: '1st Floor', description: 'Robotics, IoT & CAD Design Studios', roomsCount: 12, area: '1,250 sq.m', displayOrder: 2, publishStatus: 'DRAFT', updatedBy: 'Admin' },

  { id: 'f11', buildingId: 'b5', floorNumber: 0, name: 'Ground Floor', description: 'Accounts, Admissions & Registrar Counter', roomsCount: 10, area: '1,000 sq.m', displayOrder: 1, publishStatus: 'PUBLISHED', updatedBy: 'Admin' },
  { id: 'f12', buildingId: 'b6', floorNumber: 0, name: 'Ground Floor', description: 'Central Digital Reading Room & E-Journals', roomsCount: 8, area: '1,600 sq.m', displayOrder: 1, publishStatus: 'PUBLISHED', updatedBy: 'Admin' },
  { id: 'f13', buildingId: 'b7', floorNumber: 0, name: 'Ground Floor', description: 'Hostel Mess Hall, Gym & Warden Office', roomsCount: 24, area: '1,800 sq.m', displayOrder: 1, publishStatus: 'PUBLISHED', updatedBy: 'Admin' },
];

const INITIAL_ROOMS: RoomRecord[] = [
  { id: 'r101', floorId: 'f1', buildingId: 'b2', roomNumber: '101', roomName: 'Computer Science Classroom', roomType: 'Classroom', capacity: 60, department: 'CSE', description: 'General classroom equipped with 4K projector and AC.', status: 'Occupied', x: 40, y: 40, width: 220, height: 160, rotation: 0, shape: 'rectangle' },
  { id: 'r102', floorId: 'f1', buildingId: 'b2', roomNumber: '102', roomName: 'Advanced Computer Lab', roomType: 'Computer Lab', capacity: 40, department: 'CSE', description: '40 RTX workstations with high-speed internet.', status: 'Available', x: 280, y: 40, width: 240, height: 160, rotation: 0, shape: 'rectangle' },
  { id: 'r103', floorId: 'f1', buildingId: 'b2', roomNumber: '103', roomName: 'Electronics Lab', roomType: 'Laboratory', capacity: 35, department: 'ECE', description: 'VLSI and CRO testing benches.', status: 'Occupied', x: 540, y: 40, width: 220, height: 160, rotation: 0, shape: 'l-shape' },
  { id: 'r104', floorId: 'f1', buildingId: 'b2', roomNumber: '104', roomName: 'CSE Faculty Room', roomType: 'Faculty Room', capacity: 12, department: 'CSE', description: 'Faculty cabins and discussion area.', status: 'Available', x: 780, y: 40, width: 220, height: 160, rotation: 0, shape: 'rectangle' },
  { id: 'r105', floorId: 'f1', buildingId: 'b2', roomNumber: '105', roomName: 'Department Seminar Hall', roomType: 'Seminar Hall', capacity: 150, department: 'Academic Affairs', description: 'Audio-visual acoustic hall.', status: 'Occupied', x: 40, y: 240, width: 440, height: 220, rotation: 0, shape: 'polygon' },
  { id: 'r106', floorId: 'f1', buildingId: 'b2', roomNumber: '106', roomName: 'Executive Conference Room', roomType: 'Conference Room', capacity: 25, department: 'Admin', description: 'Board meetings and thesis defense.', status: 'Reserved', x: 500, y: 240, width: 260, height: 220, rotation: 0, shape: 'rectangle' },
  { id: 'r107', floorId: 'f1', buildingId: 'b2', roomNumber: '107', roomName: 'Staff Washroom Complex', roomType: 'Washroom', capacity: 10, department: 'Facilities', description: 'Sensored clean restroom.', status: 'Available', x: 780, y: 240, width: 220, height: 220, rotation: 0, shape: 'square' },
];

const INITIAL_FACILITY_OBJECTS: FloorPlanObjectRecord[] = [
  {
    id: 'fo1',
    floorId: 'f1',
    objectType: 'Stairs',
    name: 'Main Central Stairs',
    x: 40,
    y: 500,
    width: 140,
    height: 120,
    rotation: 0,
    shape: 'rectangle',
    metadata: { description: 'Main staircase connecting Ground to 3rd floor', status: 'Active' }
  },
  {
    id: 'fo2',
    floorId: 'f1',
    objectType: 'Lift',
    name: 'Elevator Shaft A',
    x: 200,
    y: 500,
    width: 100,
    height: 120,
    rotation: 0,
    shape: 'square',
    metadata: { description: 'High-speed elevator, 12-person capacity', status: 'Active' }
  },
  {
    id: 'fo3',
    floorId: 'f1',
    objectType: 'Entrance',
    name: 'Main Block South Entrance',
    x: 320,
    y: 500,
    width: 180,
    height: 120,
    rotation: 0,
    shape: 'rectangle',
    metadata: { description: 'Primary glass turnstile entry door with RFID', status: 'Active' }
  },
  {
    id: 'fo4',
    floorId: 'f1',
    objectType: 'Emergency Exit',
    name: 'Fire Exit Stairwell West',
    x: 520,
    y: 500,
    width: 150,
    height: 120,
    rotation: 0,
    shape: 'rectangle',
    metadata: { description: 'Pressurized emergency fire escape door', status: 'Active' }
  },
  {
    id: 'fo5',
    floorId: 'f1',
    objectType: 'Drinking Water',
    name: 'RO Purifier Station 1',
    x: 690,
    y: 500,
    width: 120,
    height: 120,
    rotation: 0,
    shape: 'rectangle',
    metadata: { description: 'Chilled drinking water dispenser with RO filtration', status: 'Active' }
  },
  {
    id: 'fo6',
    floorId: 'f1',
    objectType: 'Reception',
    name: 'Front Information Desk',
    x: 830,
    y: 500,
    width: 170,
    height: 120,
    rotation: 0,
    shape: 'rectangle',
    metadata: { description: 'Student and visitor inquiry reception counter', status: 'Active' }
  }
];

export function FloorManagement() {
  const authContext = useAuth();
  const user = authContext?.user;
  const userRole = (user?.role || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const isAdmin = ['admin', 'administrator', 'principal', 'office', 'systemadmin'].includes(userRole);

  // Buildings & Floors State
  const [buildings, setBuildings] = useState<BuildingInfo[]>(INITIAL_BUILDINGS);
  const [floors, setFloors] = useState<FloorInfo[]>(INITIAL_FLOORS);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | number>('b2');
  const [selectedFloorId, setSelectedFloorId] = useState<string | number>('f1');
  
  // Rooms & Canvas Objects State
  const [rooms, setRooms] = useState<RoomRecord[]>(INITIAL_ROOMS);
  const [selectedRoomId, setSelectedRoomId] = useState<string | number | null>('r101');

  // Facility Objects State
  const [facilityObjects, setFacilityObjects] = useState<FloorPlanObjectRecord[]>(INITIAL_FACILITY_OBJECTS);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | number | null>(null);

  const [activeTool, setActiveTool] = useState<string>('select');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const GRID_SIZE = 20;

  const activeEditMode = isAdmin && editMode;

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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState<boolean>(false);
  const [highlightedSearchId, setHighlightedSearchId] = useState<string | null>(null);
  const [buildingSearchQuery, setBuildingSearchQuery] = useState<string>('');
  const [activeRightTab, setActiveRightTab] = useState<'rooms' | 'facilities' | 'buildings' | 'floors'>('rooms');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Modals & Feedback State
  const [isRoomModalOpen, setIsRoomModalOpen] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Partial<RoomRecord> | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<RoomRecord | null>(null);
  const [roomValidationError, setRoomValidationError] = useState<string | null>(null);

  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState<boolean>(false);
  const [editingFacility, setEditingFacility] = useState<Partial<FloorPlanObjectRecord> | null>(null);
  const [deletingFacility, setDeletingFacility] = useState<FloorPlanObjectRecord | null>(null);
  const [facilityValidationError, setFacilityValidationError] = useState<string | null>(null);
  
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState<boolean>(false);
  const [editingBuilding, setEditingBuilding] = useState<Partial<BuildingInfo> | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<BuildingInfo | null>(null);
  const [buildingValidationError, setBuildingValidationError] = useState<string | null>(null);

  const [isFloorModalOpen, setIsFloorModalOpen] = useState<boolean>(false);
  const [editingFloor, setEditingFloor] = useState<Partial<FloorInfo> | null>(null);
  const [deletingFloor, setDeletingFloor] = useState<FloorInfo | null>(null);
  const [floorValidationError, setFloorValidationError] = useState<string | null>(null);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState<boolean>(false);
  const [publishValidationError, setPublishValidationError] = useState<string | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Fetch campus buildings and floors from API on mount
  // Fetch campus buildings on mount
  useEffect(() => {
    async function loadCampusData() {
      try {
        const bRes = await client.get('/campus/buildings');
        if (bRes.data && Array.isArray(bRes.data) && bRes.data.length > 0) {
          const mappedB: BuildingInfo[] = bRes.data.map((b: any) => ({
            id: b.id,
            name: b.name,
            code: b.code,
            description: b.description || '',
            total_floors: b.total_floors || b.floorsCount || 1,
            floorsCount: b.floorsCount || b.total_floors || 1,
            status: b.status || 'Active',
            created_at: b.created_at
          }));
          setBuildings(mappedB);
          
          const existingMatch = mappedB.find(b => String(b.id) === String(selectedBuildingId)) ||
                                mappedB.find(b => b.code === 'AB-MAIN' && (selectedBuildingId === 'b2' || selectedBuildingId === '2')) ||
                                mappedB[0];
          const targetBId = existingMatch.id;
          setSelectedBuildingId(targetBId);
        }
      } catch (err) {
        console.log('Using initial campus state (fallback)');
      }
    }
    loadCampusData();
  }, []);

  // Fetch floors whenever selectedBuildingId changes
  useEffect(() => {
    async function loadBuildingFloors() {
      if (!selectedBuildingId) return;
      try {
        const fRes = await client.get(`/campus/buildings/${selectedBuildingId}/floors`);
        if (fRes.data && Array.isArray(fRes.data)) {
          const mappedF: FloorInfo[] = fRes.data.map((f: any) => ({
            id: f.id,
            buildingId: f.buildingId || f.building_id || selectedBuildingId,
            name: f.name,
            floorNumber: f.floorNumber !== undefined ? f.floorNumber : (f.floor_number !== undefined ? f.floor_number : 0),
            description: f.description || '',
            displayOrder: f.displayOrder || f.display_order || 0,
            publishStatus: f.publishStatus || f.publish_status || 'DRAFT',
            lastSavedAt: f.lastSavedAt || f.last_saved_at || undefined,
            lastPublishedAt: f.lastPublishedAt || f.last_published_at || undefined,
            updatedBy: f.updatedBy || f.updated_by || 'Admin'
          }));

          setFloors(prev => {
            const otherFloors = prev.filter(p => String(p.buildingId) !== String(selectedBuildingId));
            return [...otherFloors, ...mappedF];
          });

          if (mappedF.length > 0) {
            setSelectedFloorId(mappedF[0].id);
          }
        }
      } catch (err) {
        console.log('Error loading building floors');
      }
    }
    loadBuildingFloors();
  }, [selectedBuildingId]);

  // Fetch rooms AND facility objects whenever selectedFloorId changes
  useEffect(() => {
    async function loadFloorData() {
      if (!selectedFloorId) return;

      // Reset selection when floor changes
      setSelectedRoomId(null);
      setSelectedFacilityId(null);

      // For Non-Admins (Students & Faculty), fetch published floor plan version
      if (!isAdmin) {
        try {
          const pubRes = await client.get(`/campus/floors/${selectedFloorId}/published`);
          if (pubRes.data) {
            if (pubRes.data.rooms && Array.isArray(pubRes.data.rooms)) {
              const mappedRooms: RoomRecord[] = pubRes.data.rooms.map((r: any) => ({
                id: r.id,
                floorId: r.floorId || r.floor_id || selectedFloorId,
                buildingId: r.buildingId || r.building_id || selectedBuildingId,
                roomNumber: String(r.roomNumber || r.room_number || ''),
                roomName: r.roomName || r.room_name || 'Classroom',
                roomType: r.roomType || r.room_type || 'Classroom',
                capacity: Number(r.capacity) || 30,
                department: r.department || 'General',
                description: r.description || '',
                status: r.status || 'Available',
                x: Number(r.x) || 40,
                y: Number(r.y) || 40,
                width: Number(r.width) || 200,
                height: Number(r.height) || 150,
                rotation: Number(r.rotation) || 0,
                shape: (r.shape as RoomShape) || 'rectangle',
                createdAt: r.createdAt || r.created_at,
                updatedAt: r.updatedAt || r.updated_at
              }));
              setRooms(mappedRooms);
            } else {
              setRooms([]);
            }

            if (pubRes.data.objects && Array.isArray(pubRes.data.objects)) {
              const mappedObjs: FloorPlanObjectRecord[] = pubRes.data.objects.map((o: any) => ({
                id: o.id,
                floorId: o.floorId || o.floor_id || selectedFloorId,
                objectType: o.objectType || o.object_type || 'Stairs',
                name: o.name || 'Facility Object',
                x: Number(o.x) || 100,
                y: Number(o.y) || 100,
                width: Number(o.width) || 140,
                height: Number(o.height) || 100,
                rotation: Number(o.rotation) || 0,
                shape: o.shape || 'rectangle',
                metadata: typeof o.metadata === 'string' ? JSON.parse(o.metadata) : (o.metadata || {})
              }));
              setFacilityObjects(mappedObjs);
            } else {
              setFacilityObjects([]);
            }
          }
          return;
        } catch (err) {
          console.log('Error loading published floor plan, loading default view');
        }
      }

      // For Admin, fetch current draft layout
      try {
        // Fetch rooms
        const rRes = await client.get(`/campus/floors/${selectedFloorId}/rooms`);
        if (rRes.data && Array.isArray(rRes.data)) {
          const mappedRooms: RoomRecord[] = rRes.data.map((r: any) => ({
            id: r.id,
            floorId: r.floorId || r.floor_id || selectedFloorId,
            buildingId: r.buildingId || r.building_id || selectedBuildingId,
            roomNumber: String(r.roomNumber || r.room_number || ''),
            roomName: r.roomName || r.room_name || 'Classroom',
            roomType: r.roomType || r.room_type || 'Classroom',
            capacity: Number(r.capacity) || 30,
            department: r.department || 'General',
            description: r.description || '',
            status: r.status || 'Available',
            x: Number(r.x) || 40,
            y: Number(r.y) || 40,
            width: Number(r.width) || 200,
            height: Number(r.height) || 150,
            rotation: Number(r.rotation) || 0,
            shape: (r.shape as RoomShape) || 'rectangle',
            createdAt: r.createdAt || r.created_at,
            updatedAt: r.updatedAt || r.updated_at
          }));
          setRooms(mappedRooms);
        }
      } catch (err) {
        console.log('Using local rooms state fallback');
      }

      try {
        // Fetch facility objects
        const objRes = await client.get(`/campus/floors/${selectedFloorId}/objects`);
        if (objRes.data && Array.isArray(objRes.data)) {
          const mappedObjs: FloorPlanObjectRecord[] = objRes.data.map((o: any) => ({
            id: o.id,
            floorId: o.floorId || o.floor_id || selectedFloorId,
            objectType: o.objectType || o.object_type || 'Stairs',
            name: o.name || 'Facility Object',
            x: Number(o.x) || 100,
            y: Number(o.y) || 100,
            width: Number(o.width) || 140,
            height: Number(o.height) || 100,
            rotation: Number(o.rotation) || 0,
            shape: o.shape || 'rectangle',
            metadata: typeof o.metadata === 'string' ? JSON.parse(o.metadata) : (o.metadata || { description: '', status: 'Active' }),
            createdAt: o.createdAt || o.created_at,
            updatedAt: o.updatedAt || o.updated_at
          }));
          setFacilityObjects(mappedObjs);
        }
      } catch (err) {
        console.log('Using local facility objects state fallback');
      }
    }
    loadFloorData();
  }, [selectedFloorId]);

  // Filter floors for selected building ONLY
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
        description: 'Ground Floor level layout'
      };
      setFloors(prev => [...prev, fallback]);
      setSelectedFloorId(fallback.id);
    }
  }, [selectedBuildingId, buildingFloors]);

  // Selected Building and Floor objects
  const selectedBuilding = useMemo(() => {
    return buildings.find(b => String(b.id) === String(selectedBuildingId)) || buildings[0] || { id: 'b2', name: 'Academic Block', code: 'AB-MAIN', description: '', total_floors: 4, status: 'Active' };
  }, [buildings, selectedBuildingId]);

  const selectedFloor: FloorInfo = useMemo(() => {
    return floors.find(f => String(f.id) === String(selectedFloorId)) || buildingFloors[0] || { id: 'f1', buildingId: 'b2', name: 'Ground Floor', floorNumber: 0, publishStatus: 'DRAFT', updatedBy: 'Admin' };
  }, [floors, buildingFloors, selectedFloorId]);

  const selectedRoom = useMemo(() => {
    return rooms.find(r => String(r.id) === String(selectedRoomId)) || null;
  }, [rooms, selectedRoomId]);

  const selectedFacility = useMemo(() => {
    return facilityObjects.find(fo => String(fo.id) === String(selectedFacilityId)) || null;
  }, [facilityObjects, selectedFacilityId]);

  // Center canvas on target object
  const centerCanvasOnObject = useCallback((x: number, y: number, width: number, height: number) => {
    const containerWidth = canvasContainerRef.current?.clientWidth || 800;
    const containerHeight = canvasContainerRef.current?.clientHeight || 600;
    const objCenterX = x + width / 2;
    const objCenterY = y + height / 2;
    const newPanX = Math.round((containerWidth / 2) - (objCenterX * (zoomLevel / 100)));
    const newPanY = Math.round((containerHeight / 2) - (objCenterY * (zoomLevel / 100)));
    setPanX(newPanX);
    setPanY(newPanY);
  }, [zoomLevel]);

  // Searchable Pool Across Campus
  const allSearchableRooms = useMemo(() => {
    const map = new Map<string, RoomRecord>();
    INITIAL_ROOMS.forEach(r => map.set(String(r.id), r));
    rooms.forEach(r => map.set(String(r.id), r));
    return Array.from(map.values());
  }, [rooms]);

  const allSearchableFacilities = useMemo(() => {
    const map = new Map<string, FloorPlanObjectRecord>();
    INITIAL_FACILITY_OBJECTS.forEach(fo => map.set(String(fo.id), fo));
    facilityObjects.forEach(fo => map.set(String(fo.id), fo));
    return Array.from(map.values());
  }, [facilityObjects]);

  // Global Multi-field Search Filter
  const globalSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResultItem[] = [];

    // 1. Search Rooms (Number, Name, Dept, Type, Description)
    allSearchableRooms.forEach(room => {
      const rNum = String(room.roomNumber || '').toLowerCase();
      const rName = String(room.roomName || '').toLowerCase();
      const rDept = String(room.department || '').toLowerCase();
      const rType = String(room.roomType || '').toLowerCase();
      const rDesc = String(room.description || '').toLowerCase();

      if (
        rNum.includes(q) ||
        rName.includes(q) ||
        rDept.includes(q) ||
        rType.includes(q) ||
        rDesc.includes(q)
      ) {
        const b = buildings.find(b => String(b.id) === String(room.buildingId)) || buildings[0];
        const f = floors.find(f => String(f.id) === String(room.floorId)) || { name: 'Floor', floorNumber: 0 };
        results.push({
          id: `room-${room.id}`,
          type: 'room',
          title: `Room ${room.roomNumber}: ${room.roomName}`,
          subtitle: `${b.name} • ${f.name} • Dept: ${room.department}`,
          badge: room.roomType,
          badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900',
          icon: <DoorOpen className="w-4 h-4 text-blue-500" />,
          buildingId: room.buildingId || b.id,
          buildingName: b.name,
          floorId: room.floorId,
          floorName: f.name,
          targetId: room.id,
          targetType: 'room',
          x: room.x,
          y: room.y,
          width: room.width,
          height: room.height
        });
      }
    });

    // 2. Search Facilities (Name, Type, Description, Status)
    allSearchableFacilities.forEach(fo => {
      const foName = String(fo.name || '').toLowerCase();
      const foType = String(fo.objectType || '').toLowerCase();
      const meta = typeof fo.metadata === 'object' ? fo.metadata : {};
      const foDesc = String(meta.description || '').toLowerCase();
      const foStatus = String(meta.status || '').toLowerCase();

      if (
        foName.includes(q) ||
        foType.includes(q) ||
        foDesc.includes(q) ||
        foStatus.includes(q)
      ) {
        const f = floors.find(f => String(f.id) === String(fo.floorId)) || { buildingId: 'b2', name: 'Floor' };
        const b = buildings.find(b => String(b.id) === String(f.buildingId)) || buildings[0];
        results.push({
          id: `facility-${fo.id}`,
          type: 'facility',
          title: fo.name,
          subtitle: `${b.name} • ${f.name} • Type: ${fo.objectType}`,
          badge: fo.objectType,
          badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900',
          icon: <Sparkles className="w-4 h-4 text-amber-500" />,
          buildingId: f.buildingId || b.id,
          buildingName: b.name,
          floorId: fo.floorId,
          floorName: f.name,
          targetId: fo.id,
          targetType: 'facility',
          x: fo.x,
          y: fo.y,
          width: fo.width,
          height: fo.height
        });
      }
    });

    // 3. Search Floors (Name, Description, Number)
    floors.forEach(floor => {
      const fName = String(floor.name || '').toLowerCase();
      const fDesc = String(floor.description || '').toLowerCase();
      const fNum = `floor ${floor.floorNumber}`;
      const fNumShort = `${floor.floorNumber}th floor`;

      if (
        fName.includes(q) ||
        fDesc.includes(q) ||
        fNum.includes(q) ||
        fNumShort.includes(q) ||
        q.includes(fName)
      ) {
        const b = buildings.find(b => String(b.id) === String(floor.buildingId)) || buildings[0];
        results.push({
          id: `floor-${floor.id}`,
          type: 'floor',
          title: `${floor.name} (Level ${floor.floorNumber})`,
          subtitle: `${b.name} • ${floor.description || 'Floor plan level'}`,
          badge: 'Floor',
          badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-900',
          icon: <Layers className="w-4 h-4 text-purple-500" />,
          buildingId: floor.buildingId,
          buildingName: b.name,
          floorId: floor.id,
          floorName: floor.name
        });
      }
    });

    // 4. Search Buildings (Name, Code, Description)
    buildings.forEach(b => {
      const bName = String(b.name || '').toLowerCase();
      const bCode = String(b.code || '').toLowerCase();
      const bDesc = String(b.description || '').toLowerCase();

      if (
        bName.includes(q) ||
        bCode.includes(q) ||
        bDesc.includes(q)
      ) {
        const targetFloor = floors.find(f => String(f.buildingId) === String(b.id)) || { id: 'f1', name: 'Ground Floor' };
        results.push({
          id: `building-${b.id}`,
          type: 'building',
          title: `${b.name} (${b.code})`,
          subtitle: `${b.total_floors} Floors • ${b.description || 'Building Block'}`,
          badge: 'Building',
          badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
          icon: <Building2 className="w-4 h-4 text-emerald-500" />,
          buildingId: b.id,
          buildingName: b.name,
          floorId: targetFloor.id,
          floorName: targetFloor.name
        });
      }
    });

    return results;
  }, [searchQuery, allSearchableRooms, allSearchableFacilities, floors, buildings]);

  const handleSelectSearchResult = (item: SearchResultItem) => {
    setIsSearchDropdownOpen(false);

    // 1. Automatically open correct building
    if (item.buildingId) {
      setSelectedBuildingId(item.buildingId);
    }

    // 2. Automatically open correct floor
    if (item.floorId) {
      setSelectedFloorId(item.floorId);
    }

    if (item.targetType === 'room' && item.targetId) {
      // 3. Highlight room & open details
      setSelectedRoomId(item.targetId);
      setSelectedFacilityId(null);
      setHighlightedSearchId(String(item.targetId));
      setActiveRightTab('rooms');

      // 4. Center floor plan on selected room
      if (item.x !== undefined && item.y !== undefined) {
        centerCanvasOnObject(item.x, item.y, item.width || 200, item.height || 150);
      }

      triggerToast(`Navigated to ${item.title} on ${item.floorName}`);
    } else if (item.targetType === 'facility' && item.targetId) {
      // 3. Highlight facility & open details
      setSelectedFacilityId(item.targetId);
      setSelectedRoomId(null);
      setHighlightedSearchId(String(item.targetId));
      setActiveRightTab('facilities');

      // 4. Center floor plan on selected facility
      if (item.x !== undefined && item.y !== undefined) {
        centerCanvasOnObject(item.x, item.y, item.width || 140, item.height || 100);
      }

      triggerToast(`Navigated to Facility ${item.title} on ${item.floorName}`);
    } else if (item.type === 'floor') {
      triggerToast(`Navigated to ${item.title} (${item.buildingName})`);
    } else if (item.type === 'building') {
      triggerToast(`Navigated to Building ${item.title}`);
    }

    setTimeout(() => setHighlightedSearchId(null), 3500);
  };

  // Filtered rooms based on search & category
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = searchQuery === '' || 
        room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedTypeFilter === 'all' || room.roomType.toLowerCase() === selectedTypeFilter.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [rooms, searchQuery, selectedTypeFilter]);

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
    const total = rooms.length;
    const classrooms = rooms.filter(r => r.roomType === 'Classroom' || r.roomType === 'Computer Lab' || r.roomType === 'Laboratory').length;
    const labs = rooms.filter(r => r.roomType === 'Laboratory' || r.roomType === 'Computer Lab').length;
    const offices = rooms.filter(r => r.roomType === 'Office' || r.roomType === 'Faculty Room' || r.roomType === 'Staff Room').length;
    const facilities = rooms.filter(r => r.roomType === 'Washroom' || r.roomType === 'Cafeteria' || r.roomType === 'Store Room').length + facilityObjects.length;
    const occupied = rooms.filter(r => r.status === 'Occupied').length;
    const avgOccupancy = Math.round(rooms.reduce((acc, r) => acc + (r.status === 'Occupied' ? 100 : r.status === 'Available' ? 0 : 50), 0) / (total || 1));
    return { total, classrooms, labs, offices, facilities, occupied, avgOccupancy };
  }, [rooms, facilityObjects]);

  // Room category counts calculation (Live auto-update)
  const roomCategoryCounts = useMemo(() => {
    const counts = {
      Classroom: 0,
      Lab: 0,
      Office: 0,
      Washroom: 0,
      Library: 0,
      'Seminar Hall': 0,
      Cafeteria: 0,
      Others: 0
    };

    rooms.forEach(r => {
      if (r.roomType === 'Classroom') counts.Classroom++;
      else if (r.roomType === 'Laboratory' || r.roomType === 'Computer Lab') counts.Lab++;
      else if (r.roomType === 'Office' || r.roomType === 'Faculty Room' || r.roomType === 'Staff Room') counts.Office++;
      else if (r.roomType === 'Washroom') counts.Washroom++;
      else if (r.roomType === 'Library') counts.Library++;
      else if (r.roomType === 'Seminar Hall' || r.roomType === 'Conference Room') counts['Seminar Hall']++;
      else if (r.roomType === 'Cafeteria') counts.Cafeteria++;
      else counts.Others++;
    });

    return counts;
  }, [rooms]);

  const ROOM_CATEGORIES = [
    { key: 'Classroom', label: 'Classroom', icon: <BookOpen className="w-4 h-4 text-indigo-500" />, filterKey: 'Classroom' },
    { key: 'Lab', label: 'Lab', icon: <Cpu className="w-4 h-4 text-emerald-500" />, filterKey: 'lab' },
    { key: 'Office', label: 'Office', icon: <Users className="w-4 h-4 text-amber-500" />, filterKey: 'office' },
    { key: 'Washroom', label: 'Washroom', icon: <Sparkles className="w-4 h-4 text-sky-500" />, filterKey: 'washroom' },
    { key: 'Library', label: 'Library', icon: <BookOpen className="w-4 h-4 text-cyan-500" />, filterKey: 'library' },
    { key: 'Seminar Hall', label: 'Seminar Hall', icon: <Users className="w-4 h-4 text-purple-500" />, filterKey: 'seminar' },
    { key: 'Cafeteria', label: 'Cafeteria', icon: <Utensils className="w-4 h-4 text-rose-500" />, filterKey: 'cafeteria' },
    { key: 'Others', label: 'Others', icon: <Box className="w-4 h-4 text-slate-500" />, filterKey: 'other' }
  ];

  const handleCategoryClick = (filterKey: string) => {
    if (selectedTypeFilter.toLowerCase() === filterKey.toLowerCase()) {
      setSelectedTypeFilter('all');
      triggerToast('Showing all room categories');
    } else {
      setSelectedTypeFilter(filterKey);
      triggerToast(`Filtered floor plan by "${filterKey}"`);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save position updates & create new rooms for current floor
      for (const rm of rooms) {
        if (rm.id && !String(rm.id).startsWith('r-') && !String(rm.id).startsWith('r10')) {
          await client.put(`/campus/rooms/${rm.id}`, {
            x: rm.x,
            y: rm.y,
            width: rm.width,
            height: rm.height,
            rotation: rm.rotation,
            shape: rm.shape
          }).catch(() => {});
        } else {
          try {
            const postRes = await client.post(`/campus/floors/${selectedFloorId}/rooms`, {
              buildingId: selectedBuildingId,
              roomNumber: rm.roomNumber,
              roomName: rm.roomName,
              roomType: rm.roomType,
              capacity: rm.capacity,
              department: rm.department,
              description: rm.description,
              status: rm.status,
              x: rm.x,
              y: rm.y,
              width: rm.width,
              height: rm.height,
              rotation: rm.rotation,
              shape: rm.shape
            });
            if (postRes.data?.room?.id) {
              const realId = postRes.data.room.id;
              setRooms(prev => prev.map(r => String(r.id) === String(rm.id) ? { ...r, id: realId } : r));
            }
          } catch (e) {}
        }
      }

      // Save position updates & create new facility objects for current floor
      for (const fo of facilityObjects) {
        if (fo.id && !String(fo.id).startsWith('fo-') && !String(fo.id).startsWith('fo10')) {
          await client.put(`/campus/objects/${fo.id}`, {
            x: fo.x,
            y: fo.y,
            width: fo.width,
            height: fo.height,
            rotation: fo.rotation,
            shape: fo.shape,
            metadata: fo.metadata
          }).catch(() => {});
        } else {
          try {
            const postRes = await client.post(`/campus/floors/${selectedFloorId}/objects`, {
              objectType: fo.objectType,
              name: fo.name,
              x: fo.x,
              y: fo.y,
              width: fo.width,
              height: fo.height,
              rotation: fo.rotation,
              shape: fo.shape,
              metadata: fo.metadata
            });
            if (postRes.data?.object?.id) {
              const realId = postRes.data.object.id;
              setFacilityObjects(prev => prev.map(o => String(o.id) === String(fo.id) ? { ...o, id: realId } : o));
            }
          } catch (e) {}
        }
      }

      // Mark floor as saved draft
      const nowIso = new Date().toISOString();
      const saveRes = await client.post(`/campus/floors/${selectedFloorId}/save`, { updatedBy: 'Admin' });

      setFloors(prev => prev.map(f => {
        if (String(f.id) === String(selectedFloorId)) {
          return {
            ...f,
            publishStatus: 'DRAFT',
            lastSavedAt: saveRes?.data?.floor?.lastSavedAt || nowIso,
            updatedBy: 'Admin'
          };
        }
        return f;
      }));

      setIsSaving(false);
      triggerToast('Floor saved successfully.');
    } catch (err) {
      setIsSaving(false);
      triggerToast('Unable to save changes. Please try again.');
    }
  };

  const handleOpenPublishConfirm = () => {
    // Validate floor plan: check if floor plan has at least 1 room or facility object
    if (rooms.length === 0 && facilityObjects.length === 0) {
      triggerToast('Floor plan validation failed: Floor plan is empty. Please add at least one room or facility object before publishing.');
      return;
    }
    setPublishValidationError(null);
    setIsPublishConfirmOpen(true);
  };

  const handleConfirmPublish = async () => {
    setIsPublishing(true);
    try {
      const nowIso = new Date().toISOString();
      const pubRes = await client.post(`/campus/floors/${selectedFloorId}/publish`, { updatedBy: 'Admin' });

      setFloors(prev => prev.map(f => {
        if (String(f.id) === String(selectedFloorId)) {
          return {
            ...f,
            publishStatus: 'PUBLISHED',
            lastPublishedAt: pubRes?.data?.floor?.lastPublishedAt || nowIso,
            lastSavedAt: pubRes?.data?.floor?.lastSavedAt || nowIso,
            updatedBy: 'Admin'
          };
        }
        return f;
      }));

      setIsPublishing(false);
      setIsPublishConfirmOpen(false);
      triggerToast('Floor published successfully.');
    } catch (err: any) {
      setIsPublishing(false);
      triggerToast('Unable to save changes. Please try again.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ROOM MANAGEMENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleOpenAddRoomModal = (presetType?: RoomType) => {
    const count = rooms.length + 1;
    const defaultType: RoomType = presetType || 'Classroom';
    setRoomValidationError(null);
    setEditingRoom({
      floorId: selectedFloorId,
      buildingId: selectedBuildingId,
      roomNumber: `${100 + count}`,
      roomName: defaultType === 'Classroom' ? `Classroom ${100 + count}` : defaultType === 'Computer Lab' ? `Computer Lab ${count}` : `${defaultType} ${count}`,
      roomType: defaultType,
      capacity: defaultType === 'Classroom' ? 60 : defaultType === 'Computer Lab' ? 40 : 15,
      department: 'CSE',
      description: `Standard ${defaultType} room with air conditioning and Wi-Fi.`,
      status: 'Available',
      x: 40 + (count % 3) * 60,
      y: 40 + Math.floor(count / 3) * 60,
      width: defaultType === 'Seminar Hall' ? 360 : 220,
      height: 160,
      rotation: 0,
      shape: 'rectangle'
    });
    setIsRoomModalOpen(true);
  };

  const handleOpenEditModal = (rm: RoomRecord) => {
    setRoomValidationError(null);
    setEditingRoom({ ...rm });
    setIsRoomModalOpen(true);
  };

  const handleSaveRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoomValidationError(null);

    if (!editingRoom) return;

    const rNum = String(editingRoom.roomNumber || '').trim();
    if (!rNum) {
      setRoomValidationError('Room number cannot be empty');
      return;
    }

    if (!editingRoom.roomType) {
      setRoomValidationError('Room type must be selected');
      return;
    }

    const rawCap = editingRoom.capacity;
    if (rawCap === undefined || rawCap === null || String(rawCap).trim() === '' || isNaN(Number(rawCap)) || Number(rawCap) < 0) {
      setRoomValidationError('Capacity must be a valid number');
      return;
    }

    const isDup = rooms.some(r =>
      String(r.floorId) === String(selectedFloorId) &&
      String(r.roomNumber).trim().toLowerCase() === rNum.toLowerCase() &&
      String(r.id) !== String(editingRoom.id)
    );

    if (isDup) {
      setRoomValidationError(`Room number "${rNum}" already exists on this floor.`);
      return;
    }

    const payload = {
      buildingId: selectedBuildingId,
      roomNumber: rNum,
      roomName: String(editingRoom.roomName || rNum).trim(),
      roomType: editingRoom.roomType || 'Classroom',
      capacity: Number(editingRoom.capacity),
      department: editingRoom.department || 'General',
      description: editingRoom.description || '',
      status: editingRoom.status || 'Available',
      x: Number(editingRoom.x) || 40,
      y: Number(editingRoom.y) || 40,
      width: Number(editingRoom.width) || 220,
      height: Number(editingRoom.height) || 160,
      rotation: Number(editingRoom.rotation) || 0,
      shape: editingRoom.shape || 'rectangle'
    };

    try {
      if (editingRoom.id) {
        await client.put(`/campus/rooms/${editingRoom.id}`, payload);
        setRooms(prev => prev.map(r => String(r.id) === String(editingRoom.id) ? { ...r, ...payload } as RoomRecord : r));
        triggerToast('Room updated successfully.');
      } else {
        let newRoomObj: RoomRecord = {
          id: `r-${Date.now()}`,
          floorId: selectedFloorId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...payload
        };

        try {
          const res = await client.post(`/campus/floors/${selectedFloorId}/rooms`, payload);
          if (res.data && res.data.room) {
            newRoomObj = {
              id: res.data.room.id,
              floorId: res.data.room.floorId || selectedFloorId,
              buildingId: res.data.room.buildingId || selectedBuildingId,
              roomNumber: res.data.room.roomNumber,
              roomName: res.data.room.roomName,
              roomType: res.data.room.roomType,
              capacity: res.data.room.capacity,
              department: res.data.room.department,
              description: res.data.room.description || '',
              status: res.data.room.status || 'Available',
              x: res.data.room.x,
              y: res.data.room.y,
              width: res.data.room.width,
              height: res.data.room.height,
              rotation: res.data.room.rotation,
              shape: res.data.room.shape,
              createdAt: res.data.room.createdAt,
              updatedAt: res.data.room.updatedAt
            };
          }
        } catch (apiErr) {
          console.log('API fallback for new room creation');
        }

        setRooms(prev => [...prev, newRoomObj]);
        setSelectedRoomId(newRoomObj.id);
        setSelectedFacilityId(null);
        triggerToast('Room added successfully.');
      }

      setIsRoomModalOpen(false);
      setEditingRoom(null);
    } catch (err: any) {
      console.error('Save room error:', err);
      const errMsg = err?.response?.data?.error || 'Unable to save changes. Please try again.';
      setRoomValidationError(errMsg);
      triggerToast('Unable to save changes. Please try again.');
    }
  };

  const handleDeleteRoom = (id: string | number) => {
    const target = rooms.find(r => String(r.id) === String(id));
    if (target) setDeletingRoom(target);
  };

  const handleDeleteFacility = (id: string | number) => {
    const target = facilityObjects.find(fo => String(fo.id) === String(id));
    if (target) setDeletingFacility(target);
  };

  const handleConfirmDeleteRoom = async () => {
    if (!deletingRoom) return;
    try {
      await client.delete(`/campus/rooms/${deletingRoom.id}`).catch(() => {});
      setRooms(prev => prev.filter(r => String(r.id) !== String(deletingRoom.id)));
      if (String(selectedRoomId) === String(deletingRoom.id)) setSelectedRoomId(null);
      triggerToast(`Room deleted successfully.`);
      setDeletingRoom(null);
    } catch (err) {
      triggerToast('Unable to save changes. Please try again.');
    }
  };

  const handleRotateSelectedRoom = () => {
    if (!selectedRoomId) return;
    setRooms(prev => prev.map(r => {
      if (String(r.id) === String(selectedRoomId)) {
        const nextRotation = (r.rotation + 90) % 360;
        client.put(`/campus/rooms/${r.id}`, { rotation: nextRotation }).catch(() => {});
        return { ...r, rotation: nextRotation };
      }
      return r;
    }));
    triggerToast('Rotated selected room by 90°');
  };

  const handleChangeRoomShape = (roomId: string | number, shape: RoomShape) => {
    setRooms(prev => prev.map(r => {
      if (String(r.id) === String(roomId)) {
        client.put(`/campus/rooms/${r.id}`, { shape }).catch(() => {});
        return { ...r, shape };
      }
      return r;
    }));
    triggerToast(`Changed room shape to ${shape}`);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FACILITY OBJECT HANDLERS (STAIRS, LIFT, WASHROOMS, CORRIDORS, EXITS, ETC.)
  // ─────────────────────────────────────────────────────────────────────────────

  const handleOpenAddFacilityModal = (presetType?: FacilityObjectType) => {
    const defaultType: FacilityObjectType = presetType || 'Stairs';
    const count = facilityObjects.length + 1;
    setFacilityValidationError(null);
    setEditingFacility({
      floorId: selectedFloorId,
      objectType: defaultType,
      name: `${defaultType} ${count}`,
      x: 60 + (count % 4) * 160,
      y: 490,
      width: defaultType === 'Corridor' ? 280 : defaultType === 'Lobby' ? 220 : 140,
      height: defaultType === 'Corridor' ? 80 : 120,
      rotation: 0,
      shape: 'rectangle',
      metadata: {
        description: `Standard ${defaultType} facility on floor plan.`,
        status: 'Active'
      }
    });
    setIsFacilityModalOpen(true);
  };

  const handleOpenEditFacilityModal = (fo: FloorPlanObjectRecord) => {
    setFacilityValidationError(null);
    setEditingFacility({
      ...fo,
      metadata: typeof fo.metadata === 'object' ? { ...fo.metadata } : { description: '', status: 'Active' }
    });
    setIsFacilityModalOpen(true);
  };

  const handleSaveFacilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacilityValidationError(null);

    if (!editingFacility || !editingFacility.name?.trim()) {
      setFacilityValidationError('Facility name cannot be empty');
      return;
    }
    if (!editingFacility.objectType) {
      setFacilityValidationError('Object type must be selected');
      return;
    }

    const payload = {
      objectType: editingFacility.objectType,
      name: String(editingFacility.name).trim(),
      x: Number(editingFacility.x) || 100,
      y: Number(editingFacility.y) || 100,
      width: Number(editingFacility.width) || 140,
      height: Number(editingFacility.height) || 100,
      rotation: Number(editingFacility.rotation) || 0,
      shape: editingFacility.shape || 'rectangle',
      metadata: typeof editingFacility.metadata === 'object' ? editingFacility.metadata : { description: '', status: 'Active' }
    };

    try {
      if (editingFacility.id) {
        await client.put(`/campus/objects/${editingFacility.id}`, payload);
        setFacilityObjects(prev => prev.map(fo => String(fo.id) === String(editingFacility.id) ? { ...fo, ...payload } as FloorPlanObjectRecord : fo));
        triggerToast('Facility updated successfully.');
      } else {
        let newObj: FloorPlanObjectRecord = {
          id: `fo-${Date.now()}`,
          floorId: selectedFloorId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...payload
        };

        try {
          const res = await client.post(`/campus/floors/${selectedFloorId}/objects`, payload);
          if (res.data && res.data.object) {
            newObj = {
              id: res.data.object.id,
              floorId: res.data.object.floorId || selectedFloorId,
              objectType: res.data.object.objectType,
              name: res.data.object.name,
              x: res.data.object.x,
              y: res.data.object.y,
              width: res.data.object.width,
              height: res.data.object.height,
              rotation: res.data.object.rotation,
              shape: res.data.object.shape,
              metadata: res.data.object.metadata,
              createdAt: res.data.object.createdAt,
              updatedAt: res.data.object.updatedAt
            };
          }
        } catch (apiErr) {
          console.log('API fallback for facility object creation');
        }

        setFacilityObjects(prev => [...prev, newObj]);
        setSelectedFacilityId(newObj.id);
        setSelectedRoomId(null);
        setActiveRightTab('facilities');
        triggerToast('Facility added successfully.');
      }

      setIsFacilityModalOpen(false);
      setEditingFacility(null);
    } catch (err: any) {
      console.error('Save facility error:', err);
      triggerToast('Unable to save changes. Please try again.');
    }
  };

  const handleConfirmDeleteFacility = async () => {
    if (!deletingFacility) return;
    try {
      await client.delete(`/campus/objects/${deletingFacility.id}`).catch(() => {});
      setFacilityObjects(prev => prev.filter(fo => String(fo.id) !== String(deletingFacility.id)));
      if (String(selectedFacilityId) === String(deletingFacility.id)) setSelectedFacilityId(null);
      triggerToast(`Facility deleted successfully.`);
      setDeletingFacility(null);
    } catch (err) {
      triggerToast('Unable to save changes. Please try again.');
    }
  };

  const handleRotateSelectedFacility = () => {
    if (!selectedFacilityId) return;
    setFacilityObjects(prev => prev.map(fo => {
      if (String(fo.id) === String(selectedFacilityId)) {
        const nextRotation = (fo.rotation + 90) % 360;
        client.put(`/campus/objects/${fo.id}`, { rotation: nextRotation }).catch(() => {});
        return { ...fo, rotation: nextRotation };
      }
      return fo;
    }));
    triggerToast('Rotated selected facility object by 90°');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERACTIVE CANVAS MOUSE HANDLERS (DRAG, RESIZE, PAN FOR ROOMS AND FACILITIES)
  // ─────────────────────────────────────────────────────────────────────────────

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (activeTool === 'move' || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
    } else if ((e.target as HTMLElement).classList.contains('canvas-bg')) {
      setSelectedRoomId(null);
      setSelectedFacilityId(null);
    }
  };

  const handleMouseDownRoom = (e: React.MouseEvent, rm: RoomRecord) => {
    e.stopPropagation();
    setSelectedRoomId(rm.id);
    setSelectedFacilityId(null);
    if (!editMode) return;

    setIsDraggingObj(true);
    setDragOffset({
      x: e.clientX - rm.x,
      y: e.clientY - rm.y
    });
  };

  const handleMouseDownFacility = (e: React.MouseEvent, fo: FloorPlanObjectRecord) => {
    e.stopPropagation();
    setSelectedFacilityId(fo.id);
    setSelectedRoomId(null);
    if (!editMode) return;

    setIsDraggingObj(true);
    setDragOffset({
      x: e.clientX - fo.x,
      y: e.clientY - fo.y
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

    if (!editMode) return;

    const snap = (v: number) => snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v;

    if (selectedRoomId) {
      if (isDraggingObj) {
        const newX = snap(e.clientX - dragOffset.x);
        const newY = snap(e.clientY - dragOffset.y);
        setRooms(prev => prev.map(r => String(r.id) === String(selectedRoomId) ? { ...r, x: Math.max(0, newX), y: Math.max(0, newY) } : r));
      } else if (resizeHandle) {
        setRooms(prev => prev.map(r => {
          if (String(r.id) !== String(selectedRoomId)) return r;
          let newW = r.width;
          let newH = r.height;

          if (resizeHandle.includes('e')) newW = Math.max(60, snap(e.clientX - r.x));
          if (resizeHandle.includes('s')) newH = Math.max(60, snap(e.clientY - r.y));

          return { ...r, width: newW, height: newH };
        }));
      }
    } else if (selectedFacilityId) {
      if (isDraggingObj) {
        const newX = snap(e.clientX - dragOffset.x);
        const newY = snap(e.clientY - dragOffset.y);
        setFacilityObjects(prev => prev.map(fo => String(fo.id) === String(selectedFacilityId) ? { ...fo, x: Math.max(0, newX), y: Math.max(0, newY) } : fo));
      } else if (resizeHandle) {
        setFacilityObjects(prev => prev.map(fo => {
          if (String(fo.id) !== String(selectedFacilityId)) return fo;
          let newW = fo.width;
          let newH = fo.height;

          if (resizeHandle.includes('e')) newW = Math.max(60, snap(e.clientX - fo.x));
          if (resizeHandle.includes('s')) newH = Math.max(60, snap(e.clientY - fo.y));

          return { ...fo, width: newW, height: newH };
        }));
      }
    }
  }, [isPanning, panStart, editMode, selectedRoomId, selectedFacilityId, isDraggingObj, dragOffset, resizeHandle, snapToGrid]);

  const handleMouseUpCanvas = () => {
    setIsPanning(false);
    setIsDraggingObj(false);
    setResizeHandle(null);
  };

  // Viewport Fit & Navigation
  const handleFitToScreen = () => { setZoomLevel(90); setPanX(0); setPanY(0); triggerToast('Fit layout to screen'); };
  const handleResetCanvas = () => { setZoomLevel(100); setPanX(0); setPanY(0); triggerToast('Reset viewport'); };
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // BUILDING & FLOOR HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleOpenAddBuildingModal = () => {
    setBuildingValidationError(null);
    setEditingBuilding({ name: '', code: '', description: '', total_floors: 4, status: 'Active' });
    setIsBuildingModalOpen(true);
  };

  const handleOpenEditBuildingModal = (b: BuildingInfo) => {
    setBuildingValidationError(null);
    setEditingBuilding({ ...b });
    setIsBuildingModalOpen(true);
  };

  const handleSaveBuildingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuildingValidationError(null);

    if (!editingBuilding || !editingBuilding.name?.trim()) {
      setBuildingValidationError('Building name cannot be empty');
      return;
    }

    const payload = {
      name: editingBuilding.name.trim(),
      code: (editingBuilding.code || editingBuilding.name.trim().replace(/[^A-Za-z0-9]/g, '').slice(0, 10)).toUpperCase(),
      description: editingBuilding.description || '',
      total_floors: Number(editingBuilding.total_floors) || 1,
      status: editingBuilding.status || 'Active'
    };

    try {
      if (editingBuilding.id) {
        await client.put(`/campus/buildings/${editingBuilding.id}`, payload);
        setBuildings(prev => prev.map(b => String(b.id) === String(editingBuilding.id) ? { ...b, ...payload } as BuildingInfo : b));
        triggerToast('Building updated successfully.');
      } else {
        const res = await client.post('/campus/buildings', payload);
        const createdB = res.data?.building;
        const newB: BuildingInfo = {
          id: createdB?.id || `b-${Date.now()}`,
          name: createdB?.name || payload.name,
          code: createdB?.code || payload.code,
          description: createdB?.description || payload.description,
          total_floors: createdB?.total_floors || payload.total_floors,
          floorsCount: createdB?.total_floors || payload.total_floors,
          status: createdB?.status || payload.status
        };
        setBuildings(prev => [newB, ...prev]);
        setSelectedBuildingId(newB.id);

        // Fetch newly created building's floors
        try {
          const fRes = await client.get(`/campus/buildings/${newB.id}/floors`);
          if (fRes.data && Array.isArray(fRes.data) && fRes.data.length > 0) {
            const mappedF: FloorInfo[] = fRes.data.map((f: any) => ({
              id: f.id,
              buildingId: f.buildingId || f.building_id || newB.id,
              name: f.name,
              floorNumber: f.floorNumber !== undefined ? f.floorNumber : (f.floor_number !== undefined ? f.floor_number : 0),
              description: f.description || '',
              displayOrder: f.displayOrder || f.display_order || 0,
              publishStatus: f.publishStatus || f.publish_status || 'DRAFT'
            }));
            setFloors(prev => [...mappedF, ...prev]);
            setSelectedFloorId(mappedF[0].id);
          }
        } catch (e) {}

        triggerToast('Building added successfully.');
      }
      setIsBuildingModalOpen(false);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || 'Unable to save changes. Please try again.';
      setBuildingValidationError(errMsg);
      triggerToast('Unable to save changes. Please try again.');
    }
  };

  const handleConfirmDeleteBuilding = async () => {
    if (!deletingBuilding) return;
    try {
      await client.delete(`/campus/buildings/${deletingBuilding.id}`).catch(() => {});
      setBuildings(prev => prev.filter(b => String(b.id) !== String(deletingBuilding.id)));
      triggerToast(`Building ${deletingBuilding.name} deleted successfully.`);
      setDeletingBuilding(null);
    } catch (err) {
      triggerToast('Unable to save changes. Please try again.');
    }
  };

  const handleOpenAddFloorModal = () => {
    const nextNum = buildingFloors.length > 0 ? Math.max(...buildingFloors.map(f => f.floorNumber ?? 0)) + 1 : 0;
    setEditingFloor({
      buildingId: selectedBuilding?.id || selectedBuildingId,
      name: nextNum === 0 ? 'Ground Floor' : `${nextNum}${nextNum === 1 ? 'st' : nextNum === 2 ? 'nd' : 'th'} Floor`,
      floorNumber: nextNum,
      description: `Classrooms & facilities`
    });
    setFloorValidationError(null);
    setIsFloorModalOpen(true);
  };

  const handleOpenEditFloorModal = (f: FloorInfo) => { setEditingFloor({ ...f }); setFloorValidationError(null); setIsFloorModalOpen(true); };

  const handleSaveFloorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFloorValidationError(null);

    if (!editingFloor || !editingFloor.name?.trim()) {
      setFloorValidationError('Floor name cannot be empty');
      return;
    }

    const numFloor = Number(editingFloor.floorNumber);
    if (editingFloor.floorNumber === undefined || editingFloor.floorNumber === null || isNaN(numFloor) || numFloor < 0) {
      setFloorValidationError('Floor number must be valid');
      return;
    }

    const targetBId = selectedBuilding?.id || selectedBuildingId;
    const isDup = floors.some(f => String(f.buildingId) === String(targetBId) && f.floorNumber === numFloor && String(f.id) !== String(editingFloor.id));
    if (isDup) {
      setFloorValidationError(`Floor number ${numFloor} already exists in ${selectedBuilding.name}.`);
      return;
    }

    const payload = { buildingId: targetBId, name: editingFloor.name.trim(), floorNumber: numFloor, description: editingFloor.description || '' };

    try {
      if (editingFloor.id) {
        await client.put(`/campus/floors/${editingFloor.id}`, payload);
        setFloors(prev => prev.map(f => String(f.id) === String(editingFloor.id) ? { ...f, ...payload } as FloorInfo : f));
      } else {
        const res = await client.post('/campus/floors', payload);
        const createdF = res.data?.floor;
        const newF: FloorInfo = {
          id: createdF?.id || `f-${targetBId}-${Date.now()}`,
          buildingId: createdF?.buildingId || createdF?.building_id || targetBId,
          name: createdF?.name || payload.name,
          floorNumber: createdF?.floorNumber !== undefined ? createdF?.floorNumber : payload.floorNumber,
          description: createdF?.description || payload.description,
          displayOrder: createdF?.displayOrder || 0,
          publishStatus: createdF?.publishStatus || 'DRAFT'
        };
        setFloors(prev => [...prev, newF]);
        setSelectedFloorId(newF.id);
      }
      setIsFloorModalOpen(false);
      triggerToast('Floor saved successfully.');
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || 'Unable to save changes. Please try again.';
      setFloorValidationError(errMsg);
      triggerToast('Unable to save changes. Please try again.');
    }
  };

  const handleDuplicateFloor = (f: FloorInfo) => {
    const nextNum = Math.max(...buildingFloors.map(fl => fl.floorNumber ?? 0)) + 1;
    const newF: FloorInfo = { ...f, id: `f-${f.buildingId}-${Date.now()}`, name: `${f.name} (Copy)`, floorNumber: nextNum };
    setFloors(prev => [...prev, newF]);
    setSelectedFloorId(newF.id);
    triggerToast(`Duplicated floor level`);
  };

  const handleConfirmDeleteFloor = async () => {
    if (!deletingFloor) return;
    try {
      await client.delete(`/campus/floors/${deletingFloor.id}`).catch(() => {});
      setFloors(prev => prev.filter(f => String(f.id) !== String(deletingFloor.id)));
      triggerToast(`Floor ${deletingFloor.name} deleted successfully.`);
      setDeletingFloor(null);
    } catch (err) {
      triggerToast('Unable to save changes. Please try again.');
    }
  };

  // Category Theme Helper
  const getRoomTypeBadgeColor = (type: RoomType) => {
    switch (type) {
      case 'Classroom': return 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border-indigo-200';
      case 'Laboratory': case 'Computer Lab': return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200';
      case 'Office': case 'Faculty Room': case 'Staff Room': return 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200';
      case 'Library': return 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border-cyan-200';
      case 'Seminar Hall': case 'Conference Room': return 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border-purple-200';
      case 'Cafeteria': return 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200';
      case 'Washroom': return 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 border-sky-200';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200';
    }
  };

  const getStatusColor = (status: RoomRecord['status']) => {
    switch (status) {
      case 'Occupied': return 'bg-red-500';
      case 'Available': return 'bg-emerald-500';
      case 'Maintenance': return 'bg-amber-500';
      case 'Reserved': return 'bg-purple-500';
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
              {selectedFloor.publishStatus === 'PUBLISHED' ? (
                <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> PUBLISHED
                </span>
              ) : (
                <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 shadow-sm">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> DRAFT
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <strong className="text-slate-700 dark:text-slate-300">Status:</strong>
                <span className={selectedFloor.publishStatus === 'PUBLISHED' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>
                  {selectedFloor.publishStatus === 'PUBLISHED' ? 'Published' : 'Draft'}
                </span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1">
                <strong className="text-slate-700 dark:text-slate-300">Last Saved:</strong>
                <span className="text-slate-900 dark:text-slate-200 font-medium">
                  {selectedFloor.lastSavedAt ? new Date(selectedFloor.lastSavedAt).toLocaleString() : 'Not Saved Yet'}
                </span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1">
                <strong className="text-slate-700 dark:text-slate-300">Last Published:</strong>
                <span className="text-slate-900 dark:text-slate-200 font-medium">
                  {selectedFloor.lastPublishedAt ? new Date(selectedFloor.lastPublishedAt).toLocaleString() : 'Never Published'}
                </span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1">
                <strong className="text-slate-700 dark:text-slate-300">Updated By:</strong>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedFloor.updatedBy || 'Admin'}</span>
              </span>
            </div>
          </div>

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
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          
          <div className="relative min-w-[190px]">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Select Building</label>
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
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Select Floor Level</label>
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

          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Campus Search & Navigation</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search 101, CSE, Computer Lab, Library, 2nd Floor, Stairs..."
                value={searchQuery}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchDropdownOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Global Search Results Dropdown */}
            {isSearchDropdownOpen && searchQuery.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                {globalSearchResults.length > 0 ? (
                  <div className="py-1">
                    <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Matches ({globalSearchResults.length})</span>
                      <span>Click to Focus & Center</span>
                    </div>
                    {globalSearchResults.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSearchResult(item)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0">
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                              <span>{item.title}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0", item.badgeColor)}>
                          {item.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* NO RESULTS FOUND STATE */
                  <div className="p-6 text-center space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                      <Search className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">No results found</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                      No rooms, facilities, floors, or buildings match <span className="font-semibold text-blue-600 dark:text-blue-400">"{searchQuery}"</span>
                    </p>
                  </div>
                )}
              </div>
            )}
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
          {isAdmin ? (
            <>
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
                onClick={handleOpenPublishConfirm}
                disabled={isPublishing}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
              >
                {isPublishing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Publish</span>
              </button>
            </>
          ) : (
            <span className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-900 flex items-center gap-1.5 shadow-sm">
              <Eye className="w-3.5 h-3.5 text-blue-500" /> View Mode (Published Only)
            </span>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* EDITOR TOOLBAR & ACTION PALETTE */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {activeEditMode && (
        <div className="bg-slate-900 text-white border-b border-slate-800 px-6 py-2 flex items-center justify-between overflow-x-auto scrollbar-none z-30 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => handleOpenAddRoomModal('Classroom')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Room Form
            </button>

            <button
              onClick={() => handleOpenAddFacilityModal('Stairs')}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Facility
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            {/* Quick Add Facilities Palette */}
            <button onClick={() => handleOpenAddFacilityModal('Stairs')} className="px-2.5 py-1 hover:bg-slate-800 rounded-lg text-xs text-blue-300 font-semibold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" /> Stairs
            </button>
            <button onClick={() => handleOpenAddFacilityModal('Lift')} className="px-2.5 py-1 hover:bg-slate-800 rounded-lg text-xs text-purple-300 font-semibold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-purple-400" /> Lift
            </button>
            <button onClick={() => handleOpenAddFacilityModal("Men's Washroom")} className="px-2.5 py-1 hover:bg-slate-800 rounded-lg text-xs text-sky-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Washroom
            </button>
            <button onClick={() => handleOpenAddFacilityModal('Corridor')} className="px-2.5 py-1 hover:bg-slate-800 rounded-lg text-xs text-slate-300 font-semibold flex items-center gap-1">
              <Move className="w-3.5 h-3.5 text-slate-400" /> Corridor
            </button>
            <button onClick={() => handleOpenAddFacilityModal('Lobby')} className="px-2.5 py-1 hover:bg-slate-800 rounded-lg text-xs text-amber-300 font-semibold flex items-center gap-1">
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" /> Lobby
            </button>
            <button onClick={() => handleOpenAddFacilityModal('Entrance')} className="px-2.5 py-1 hover:bg-slate-800 rounded-lg text-xs text-emerald-300 font-semibold flex items-center gap-1">
              <LogIn className="w-3.5 h-3.5 text-emerald-400" /> Entrance
            </button>
            <button onClick={() => handleOpenAddFacilityModal('Emergency Exit')} className="px-2.5 py-1 hover:bg-slate-800 rounded-lg text-xs text-rose-300 font-semibold flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5 text-rose-400" /> Fire Exit
            </button>
            <button onClick={() => handleOpenAddFacilityModal('Drinking Water')} className="px-2.5 py-1 hover:bg-slate-800 rounded-lg text-xs text-cyan-300 font-semibold flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Water
            </button>
            <button onClick={() => handleOpenAddFacilityModal('Reception')} className="px-2.5 py-1 hover:bg-slate-800 rounded-lg text-xs text-indigo-300 font-semibold flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> Reception
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            <button
              onClick={() => selectedRoomId ? handleRotateSelectedRoom() : selectedFacilityId ? handleRotateSelectedFacility() : null}
              disabled={!selectedRoomId && !selectedFacilityId}
              className="px-2.5 py-1 hover:bg-slate-800 disabled:opacity-30 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" /> Rotate 90°
            </button>
            <button
              onClick={() => {
                if (selectedRoomId) handleDeleteRoom(selectedRoomId);
                else if (selectedFacilityId) handleDeleteFacility(selectedFacilityId);
              }}
              disabled={!selectedRoomId && !selectedFacilityId}
              className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 disabled:opacity-30 rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MAIN REAL INTERACTIVE VECTOR FLOOR CANVAS */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
          
          {/* North Compass Indicator (Top Right) */}
          <div className="absolute top-4 right-4 z-20 flex flex-col items-center bg-slate-900/90 text-white backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-slate-800 pointer-events-none select-none">
            <div className="w-8 h-8 rounded-full border-2 border-amber-400 flex items-center justify-center relative">
              <span className="text-[10px] font-black text-amber-400 absolute top-0.5">N</span>
              <Compass className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-400 tracking-widest mt-1">NORTH</span>
          </div>

          {/* Canvas Viewport Toolbar (Top Left) */}
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

          {/* REAL VECTOR FLOOR PLAN CANVAS CONTAINER */}
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
              className="relative w-[1160px] h-[740px] bg-slate-900 rounded-3xl shadow-2xl border-4 border-slate-800 overflow-hidden flex-shrink-0 transition-all canvas-bg bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]"
            >

              {/* Building Floor Label Watermark */}
              <div className="absolute top-6 left-8 pointer-events-none select-none opacity-15">
                <p className="text-4xl font-black uppercase tracking-widest text-white">{selectedBuilding.code}</p>
                <p className="text-xl font-bold text-slate-300">{selectedBuilding.name} - {selectedFloor.name}</p>
              </div>

              {/* Corridor Line */}
              <div className="absolute left-[4%] top-[31%] w-[92%] h-[3.5%] bg-slate-800/80 border-y border-dashed border-slate-700 flex items-center justify-between px-6 pointer-events-none">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Main Corridor Passage</span>
              </div>

              {/* ROOM TILES VECTOR LAYER */}
              {filteredRooms.map(rm => {
                const isSelected = String(selectedRoomId) === String(rm.id);
                const isHighlighted = String(rm.id) === String(highlightedSearchId);
                const badgeColor = getRoomTypeBadgeColor(rm.roomType);

                return (
                  <div
                    key={rm.id}
                    onMouseDown={(e) => handleMouseDownRoom(e, rm)}
                    onDoubleClick={(e) => { e.stopPropagation(); if (editMode && isAdmin) handleOpenEditModal(rm); }}
                    style={{
                      left: `${rm.x}px`,
                      top: `${rm.y}px`,
                      width: `${rm.width}px`,
                      height: `${rm.height}px`,
                      transform: `rotate(${rm.rotation}deg)`,
                      transformOrigin: 'center center'
                    }}
                    className={cn(
                      "absolute rounded-2xl p-3 border-2 transition-shadow flex flex-col justify-between cursor-pointer group shadow-md select-none bg-slate-900/90 text-white",
                      rm.roomType === 'Classroom' && "bg-indigo-950/70 border-indigo-700 hover:border-indigo-500",
                      (rm.roomType === 'Computer Lab' || rm.roomType === 'Laboratory') && "bg-emerald-950/70 border-emerald-700 hover:border-emerald-500",
                      (rm.roomType === 'Office' || rm.roomType === 'Faculty Room') && "bg-amber-950/70 border-amber-700 hover:border-amber-500",
                      rm.roomType === 'Seminar Hall' && "bg-purple-950/70 border-purple-700 hover:border-purple-500",
                      rm.roomType === 'Washroom' && "bg-sky-950/70 border-sky-700 hover:border-sky-500",
                      rm.roomType === 'Cafeteria' && "bg-rose-950/70 border-rose-700 hover:border-rose-500",
                      
                      isSelected && "ring-4 ring-blue-500 ring-offset-2 ring-offset-slate-950 border-blue-500 z-20 shadow-2xl scale-[1.01]"
                    )}
                  >
                    {isHighlighted && (
                      <div className="absolute -inset-2 border-4 border-amber-400 dark:border-amber-400 rounded-2xl animate-pulse shadow-[0_0_35px_rgba(245,158,11,0.95)] z-40 pointer-events-none flex items-center justify-center">
                        <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-xl flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> MATCHED ROOM
                        </span>
                      </div>
                    )}
                    
                    {/* Top Row: Room Number & Type Badge */}
                    <div className="flex items-center justify-between gap-1 z-10">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs tracking-wider text-white">
                          No. {rm.roomNumber}
                        </span>
                        {rm.roomType.includes('Lab') && <Cpu className="w-3.5 h-3.5 text-emerald-400" />}
                        {rm.roomType === 'Classroom' && <BookOpen className="w-3.5 h-3.5 text-indigo-400" />}
                        {rm.roomType.includes('Faculty') && <Users className="w-3.5 h-3.5 text-amber-400" />}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className={cn("px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase border", badgeColor)}>
                          {rm.roomType}
                        </span>
                        <span className={cn("w-2 h-2 rounded-full", getStatusColor(rm.status))} />
                      </div>
                    </div>

                    {/* Room Name & Dept */}
                    <div className="z-10">
                      <p className="text-xs font-bold text-white line-clamp-1 leading-tight">{rm.roomName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{rm.department || 'General'}</p>
                    </div>

                    {/* Bottom Info Bar: Capacity & Status */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800 z-10">
                      <span className="font-semibold">{rm.capacity} Seats</span>
                      <span className={cn("font-bold", rm.status === 'Occupied' ? "text-red-400" : "text-emerald-400")}>
                        {rm.status}
                      </span>
                    </div>

                    {/* SELECTION RESIZE & SHAPE CONTROL OVERLAY */}
                    {isSelected && editMode && (
                      <>
                        <div
                          onClick={(e) => { e.stopPropagation(); handleRotateSelectedRoom(); }}
                          className="absolute -top-7 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </div>

                        <div onMouseDown={(e) => handleMouseDownResizeHandle(e, 'se')} className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize shadow-md" />

                        {/* Quick Shape Selector */}
                        <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900 text-white px-2 py-1 rounded-xl shadow-2xl border border-slate-700 text-[10px] font-bold z-30">
                          <button onClick={() => handleChangeRoomShape(rm.id, 'rectangle')} className={cn("px-1.5 py-0.5 rounded", rm.shape === 'rectangle' && "bg-blue-600")}>Rect</button>
                          <button onClick={() => handleChangeRoomShape(rm.id, 'square')} className={cn("px-1.5 py-0.5 rounded", rm.shape === 'square' && "bg-blue-600")}>Square</button>
                          <button onClick={() => handleChangeRoomShape(rm.id, 'l-shape')} className={cn("px-1.5 py-0.5 rounded", rm.shape === 'l-shape' && "bg-blue-600")}>L-Shape</button>
                          <button onClick={() => handleOpenEditModal(rm)} className="px-1.5 py-0.5 bg-slate-700 text-blue-300">Edit</button>
                          <button onClick={() => handleDeleteRoom(rm.id)} className="px-1.5 py-0.5 bg-rose-900 text-rose-300">Del</button>
                        </div>
                      </>
                    )}

                  </div>
                );
              })}

              {/* FACILITY OBJECTS VECTOR LAYER (STAIRS, LIFT, WASHROOMS, EXITS, ETC.) */}
              {facilityObjects.map(fo => {
                const isSelected = String(selectedFacilityId) === String(fo.id);
                const isHighlighted = String(fo.id) === String(highlightedSearchId);
                const badgeColor = getFacilityBadgeColor(fo.objectType);
                const metaDesc = typeof fo.metadata === 'object' ? (fo.metadata.description || '') : '';
                const metaStatus = typeof fo.metadata === 'object' ? (fo.metadata.status || 'Active') : 'Active';

                return (
                  <div
                    key={fo.id}
                    onMouseDown={(e) => handleMouseDownFacility(e, fo)}
                    onDoubleClick={(e) => { e.stopPropagation(); if (editMode && isAdmin) handleOpenEditFacilityModal(fo); }}
                    style={{
                      left: `${fo.x}px`,
                      top: `${fo.y}px`,
                      width: `${fo.width}px`,
                      height: `${fo.height}px`,
                      transform: `rotate(${fo.rotation}deg)`,
                      transformOrigin: 'center center'
                    }}
                    className={cn(
                      "absolute rounded-2xl p-3 border-2 transition-shadow flex flex-col justify-between cursor-pointer group shadow-md select-none bg-slate-900/90 text-white",
                      fo.objectType === 'Stairs' && "bg-blue-950/70 border-blue-700 hover:border-blue-500",
                      fo.objectType === 'Lift' && "bg-purple-950/70 border-purple-700 hover:border-purple-500",
                      (fo.objectType.includes('Washroom')) && "bg-sky-950/70 border-sky-700 hover:border-sky-500",
                      fo.objectType === 'Corridor' && "bg-slate-950/80 border-slate-700 hover:border-slate-500 border-dashed",
                      fo.objectType === 'Lobby' && "bg-amber-950/70 border-amber-700 hover:border-amber-500",
                      fo.objectType === 'Entrance' && "bg-emerald-950/70 border-emerald-700 hover:border-emerald-500",
                      (fo.objectType.includes('Exit')) && "bg-rose-950/70 border-rose-700 hover:border-rose-500",
                      fo.objectType === 'Drinking Water' && "bg-cyan-950/70 border-cyan-700 hover:border-cyan-500",
                      fo.objectType === 'Reception' && "bg-indigo-950/70 border-indigo-700 hover:border-indigo-500",
                      fo.objectType === 'Security Desk' && "bg-violet-950/70 border-violet-700 hover:border-violet-500",
                      fo.objectType === 'Cafeteria' && "bg-orange-950/70 border-orange-700 hover:border-orange-500",
                      fo.objectType === 'Parking/Access Area' && "bg-zinc-900/80 border-zinc-700 hover:border-zinc-500",
                      fo.objectType === 'Store Room' && "bg-yellow-950/70 border-yellow-700 hover:border-yellow-500",
                      
                      isSelected && "ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-950 border-amber-400 z-20 shadow-2xl scale-[1.01]"
                    )}
                  >
                    {isHighlighted && (
                      <div className="absolute -inset-2 border-4 border-amber-400 dark:border-amber-400 rounded-2xl animate-pulse shadow-[0_0_35px_rgba(245,158,11,0.95)] z-40 pointer-events-none flex items-center justify-center">
                        <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-xl flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> MATCHED FACILITY
                        </span>
                      </div>
                    )}
                    {/* Top Row: Type & Badge */}
                    <div className="flex items-center justify-between gap-1 z-10">
                      <div className="flex items-center gap-1.5">
                        {getFacilityIcon(fo.objectType)}
                        <span className="font-extrabold text-[11px] tracking-wider text-white truncate max-w-[100px]">
                          {fo.objectType}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className={cn("px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase border", badgeColor)}>
                          {fo.objectType}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                    </div>

                    {/* Facility Name & Description */}
                    <div className="z-10">
                      <p className="text-xs font-bold text-white line-clamp-1 leading-tight">{fo.name}</p>
                      {metaDesc && <p className="text-[10px] text-slate-400 truncate">{metaDesc}</p>}
                    </div>

                    {/* Bottom Info Bar: Position & Status */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800 z-10">
                      <span className="font-mono">{fo.x},{fo.y}</span>
                      <span className="font-bold text-amber-400">{metaStatus}</span>
                    </div>

                    {/* SELECTION OVERLAY FOR FACILITY OBJECT */}
                    {isSelected && editMode && (
                      <>
                        <div
                          onClick={(e) => { e.stopPropagation(); handleRotateSelectedFacility(); }}
                          className="absolute -top-7 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </div>

                        <div onMouseDown={(e) => handleMouseDownResizeHandle(e, 'se')} className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-500 border-2 border-white rounded-full cursor-nwse-resize shadow-md" />

                        <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900 text-white px-2 py-1 rounded-xl shadow-2xl border border-slate-700 text-[10px] font-bold z-30">
                          <button onClick={() => handleOpenEditFacilityModal(fo)} className="px-1.5 py-0.5 bg-slate-700 text-amber-300">Edit</button>
                          <button onClick={() => handleDeleteFacility(fo.id)} className="px-1.5 py-0.5 bg-rose-900 text-rose-300">Del</button>
                        </div>
                      </>
                    )}

                  </div>
                );
              })}

            </div>
          </div>

          {/* Minimap Overlay */}
          <div className="absolute bottom-4 right-4 z-20 w-48 h-32 bg-slate-900/90 backdrop-blur-md rounded-2xl border-2 border-slate-700 shadow-2xl p-2 overflow-hidden pointer-events-auto flex flex-col justify-between">
            <div className="flex items-center justify-between text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
              <span>Layout Minimap</span>
              <span className="text-blue-400">{rooms.length} Rooms, {facilityObjects.length} Facilities</span>
            </div>

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
              {rooms.map(rm => (
                <div
                  key={rm.id}
                  style={{
                    left: `${(rm.x / 1160) * 100}%`,
                    top: `${(rm.y / 740) * 100}%`,
                    width: `${(rm.width / 1160) * 100}%`,
                    height: `${(rm.height / 740) * 100}%`
                  }}
                  className="absolute bg-blue-500/60 rounded-xs border border-blue-400"
                />
              ))}
              {facilityObjects.map(fo => (
                <div
                  key={fo.id}
                  style={{
                    left: `${(fo.x / 1160) * 100}%`,
                    top: `${(fo.y / 740) * 100}%`,
                    width: `${(fo.width / 1160) * 100}%`,
                    height: `${(fo.height / 740) * 100}%`
                  }}
                  className="absolute bg-amber-500/60 rounded-xs border border-amber-400"
                />
              ))}

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

          {/* Bottom Bar */}
          <div className="bg-slate-900 border-t border-slate-800 px-6 py-2 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-300">Room & Facility Types:</span>
              <span className="text-indigo-400 font-semibold">Classroom</span>
              <span className="text-emerald-400 font-semibold">Computer Lab</span>
              <span className="text-amber-400 font-semibold font-mono">Stairs/Elevators</span>
              <span className="text-purple-400 font-semibold">Seminar Hall</span>
              <span className="text-rose-400 font-semibold">Fire Exits</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Active</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Maintenance</span>
            </div>
          </div>

        </div>

        {/* ───────────────────────────────────────────────────────────────────────────── */}
        {/* RIGHT INSPECTOR PANEL (TABS: ROOMS, BUILDINGS, FLOORS) */}
        {/* ───────────────────────────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0">
          
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1.5 gap-1.5">
            <button
              onClick={() => setActiveRightTab('rooms')}
              className={cn(
                "flex-1 py-2 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 border shadow-sm",
                activeRightTab === 'rooms'
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-700 shadow-md"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
              )}
            >
              <DoorOpen className="w-3.5 h-3.5" /> ROOMS ({rooms.length})
            </button>

            <button
              onClick={() => setActiveRightTab('buildings')}
              className={cn(
                "flex-1 py-2 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 border shadow-sm",
                activeRightTab === 'buildings'
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-700 shadow-md"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
              )}
            >
              <Building2 className="w-3.5 h-3.5" /> BUILDINGS ({buildings.length})
            </button>

            <button
              onClick={() => setActiveRightTab('floors')}
              className={cn(
                "flex-1 py-2 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 border shadow-sm",
                activeRightTab === 'floors'
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-700 shadow-md"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
              )}
            >
              <Layers className="w-3.5 h-3.5" /> FLOORS ({buildingFloors.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            
            {/* ───────────────────────────────────────────────────────────────────────── */}
            {/* TAB 1: ROOMS TAB */}
            {/* ───────────────────────────────────────────────────────────────────────── */}
            {activeRightTab === 'rooms' && (
              <>
                {/* ROOM CATEGORY LIVE COUNTS BREAKDOWN CARD */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1 pb-1.5 border-b border-slate-200 dark:border-slate-700">
                    <span>Room Category</span>
                    <span>Live Count</span>
                  </div>
                  <div className="space-y-1">
                    {ROOM_CATEGORIES.map(cat => {
                      const count = roomCategoryCounts[cat.key as keyof typeof roomCategoryCounts] || 0;
                      const isActive = selectedTypeFilter.toLowerCase() === cat.filterKey.toLowerCase();
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => handleCategoryClick(cat.filterKey)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all border",
                            isActive
                              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 font-bold"
                              : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={cn("p-1.5 rounded-lg", isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300")}>
                              {cat.icon}
                            </div>
                            <span>{cat.label}</span>
                          </div>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-black border",
                            isActive ? "bg-white text-blue-700 border-transparent" : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-slate-200 dark:border-slate-600"
                          )}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleOpenAddRoomModal('Classroom')}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Room Form
                  </button>
                )}

                {/* SELECTED OBJECT DETAILS INSPECTOR */}
                {selectedRoom ? (
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider", getRoomTypeBadgeColor(selectedRoom.roomType))}>
                          {selectedRoom.roomType}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">Room {selectedRoom.roomNumber}: {selectedRoom.roomName}</h3>
                        <p className="text-xs text-slate-500">{selectedRoom.department} Department</p>
                      </div>
                      {isAdmin && (
                        <button onClick={() => handleOpenEditModal(selectedRoom)} className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600" title="Edit Config">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                      <div><span className="text-slate-400 block text-[10px]">Capacity</span><span className="font-bold text-slate-800 dark:text-slate-200">{selectedRoom.capacity} Seats</span></div>
                      <div><span className="text-slate-400 block text-[10px]">Status</span><span className="font-bold capitalize text-slate-800 dark:text-slate-200">{selectedRoom.status}</span></div>
                    </div>

                    {selectedRoom.description && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-slate-400 block text-[10px] font-semibold">Description</span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-0.5">{selectedRoom.description}</p>
                      </div>
                    )}

                    {isAdmin && (
                      <>
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                          <div><span className="text-slate-400 block text-[9px]">Position X</span><span className="font-mono font-bold">{selectedRoom.x}px</span></div>
                          <div><span className="text-slate-400 block text-[9px]">Position Y</span><span className="font-mono font-bold">{selectedRoom.y}px</span></div>
                          <div><span className="text-slate-400 block text-[9px]">Size</span><span className="font-mono font-bold">{selectedRoom.width}×{selectedRoom.height}</span></div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button onClick={() => handleOpenEditModal(selectedRoom)} className="flex-1 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-1">
                            <Edit3 className="w-3.5 h-3.5" /> Edit Details
                          </button>
                          <button onClick={() => setDeletingRoom(selectedRoom)} className="py-1.5 px-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 flex items-center justify-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : selectedFacility ? (
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-amber-200 dark:border-amber-700/60 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider", getFacilityBadgeColor(selectedFacility.objectType))}>
                          {selectedFacility.objectType}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{selectedFacility.name}</h3>
                        <p className="text-xs text-slate-500">{selectedFacility.objectType} Facility Object</p>
                      </div>
                      {isAdmin && (
                        <button onClick={() => handleOpenEditFacilityModal(selectedFacility)} className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600" title="Edit Facility">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                      <div><span className="text-slate-400 block text-[10px]">Shape</span><span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{selectedFacility.shape || 'rectangle'}</span></div>
                      <div><span className="text-slate-400 block text-[10px]">Status</span><span className="font-bold capitalize text-slate-800 dark:text-slate-200">{typeof selectedFacility.metadata === 'object' ? (selectedFacility.metadata.status || 'Active') : 'Active'}</span></div>
                    </div>

                    {typeof selectedFacility.metadata === 'object' && selectedFacility.metadata.description && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-slate-400 block text-[10px] font-semibold">Description</span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-0.5">{selectedFacility.metadata.description}</p>
                      </div>
                    )}

                    {isAdmin && (
                      <>
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                          <div><span className="text-slate-400 block text-[9px]">Position X</span><span className="font-mono font-bold">{selectedFacility.x}px</span></div>
                          <div><span className="text-slate-400 block text-[9px]">Position Y</span><span className="font-mono font-bold">{selectedFacility.y}px</span></div>
                          <div><span className="text-slate-400 block text-[9px]">Size</span><span className="font-mono font-bold">{selectedFacility.width}×{selectedFacility.height}</span></div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button onClick={() => handleOpenEditFacilityModal(selectedFacility)} className="flex-1 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 flex items-center justify-center gap-1">
                            <Edit3 className="w-3.5 h-3.5" /> Edit Details
                          </button>
                          <button onClick={() => setDeletingFacility(selectedFacility)} className="py-1.5 px-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 flex items-center justify-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                    Click any room or facility object on the vector floor plan canvas to inspect information.
                  </div>
                )}

                {/* ROOMS DIRECTORY LIST */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                    <span>Floor Rooms ({filteredRooms.length})</span>
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                    {filteredRooms.map(r => (
                      <div
                        key={r.id}
                        onClick={() => { setSelectedRoomId(r.id); setSelectedFacilityId(null); }}
                        className={cn(
                          "p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs",
                          String(selectedRoomId) === String(r.id) ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 font-bold shadow-sm" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-white">No. {r.roomNumber}</span>
                            <span className={cn("px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase border", getRoomTypeBadgeColor(r.roomType))}>{r.roomType}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{r.roomName}</p>
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{r.capacity} Seats</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ───────────────────────────────────────────────────────────────────────── */}
            {/* TAB 2: BUILDINGS TAB */}
            {/* ───────────────────────────────────────────────────────────────────────── */}
            {activeRightTab === 'buildings' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Campus Buildings ({buildings.length})</span>
                  {isAdmin && (
                    <button
                      onClick={() => { setEditingBuilding({}); setIsBuildingModalOpen(true); }}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm hover:bg-blue-700"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Building
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {buildings.map(b => {
                    const isSelected = String(selectedBuildingId) === String(b.id);
                    const bFloorsCount = b.floorsCount || b.total_floors || 1;
                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBuildingId(b.id);
                          triggerToast(`Opened Building ${b.name}`);
                        }}
                        className={cn(
                          "p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 relative group",
                          isSelected
                            ? "bg-blue-50/80 dark:bg-blue-950/60 border-blue-500 shadow-md ring-2 ring-blue-500/20"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={cn("p-2 rounded-xl", isSelected ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300")}>
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{b.name}</span>
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">({b.code})</span>
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{b.description || 'Campus Block'}</p>
                            </div>
                          </div>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-extrabold border",
                            b.status === 'Active' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-300"
                          )}>
                            {b.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{bFloorsCount} Floors</span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            Open Building <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────────────── */}
            {/* TAB 3: FLOORS TAB */}
            {/* ───────────────────────────────────────────────────────────────────────── */}
            {activeRightTab === 'floors' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Floors in {selectedBuilding.name}</span>
                    <span className="text-[10px] text-slate-400">{buildingFloors.length} Levels Available</span>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => { setEditingFloor({ buildingId: selectedBuildingId, floorNumber: buildingFloors.length }); setIsFloorModalOpen(true); }}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm hover:bg-blue-700"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Floor
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {buildingFloors.map(f => {
                    const isSelected = String(selectedFloorId) === String(f.id);
                    const floorRoomCount = rooms.filter(r => String(r.floorId) === String(f.id)).length;
                    const floorFacilityCount = facilityObjects.filter(fo => String(fo.floorId) === String(f.id)).length;

                    return (
                      <div
                        key={f.id}
                        onClick={() => {
                          setSelectedFloorId(f.id);
                          triggerToast(`Switched to ${f.name}`);
                        }}
                        className={cn(
                          "p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 relative group",
                          isSelected
                            ? "bg-blue-50/80 dark:bg-blue-950/60 border-blue-500 shadow-md ring-2 ring-blue-500/20"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={cn("p-2 rounded-xl", isSelected ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300")}>
                              <Layers className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{f.name}</span>
                                <span className="text-[10px] font-bold text-slate-400">(Level {f.floorNumber})</span>
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{f.description || 'Floor plan level'}</p>
                            </div>
                          </div>

                          {f.publishStatus === 'PUBLISHED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300">
                              Published
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-300">
                              Draft
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{floorRoomCount} Rooms &bull; {floorFacilityCount} Facilities</span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            Open Floor <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* ADD / EDIT ROOM MODAL FORM */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {isRoomModalOpen && editingRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-blue-500" />
                {editingRoom.id ? 'Edit Room Configuration' : `Add Room to ${selectedFloor.name}`}
              </h3>
              <button onClick={() => setIsRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            </div>

            {roomValidationError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{roomValidationError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRoomSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101, CS-LAB-1"
                    value={editingRoom.roomNumber || ''}
                    onChange={e => setEditingRoom(prev => ({ ...prev, roomNumber: e.target.value }))}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Room Type *</label>
                  <select
                    value={editingRoom.roomType || 'Classroom'}
                    onChange={e => setEditingRoom(prev => ({ ...prev, roomType: e.target.value as RoomType }))}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ALL_ROOM_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Room Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science Classroom"
                  value={editingRoom.roomName || ''}
                  onChange={e => setEditingRoom(prev => ({ ...prev, roomName: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    min={0}
                    value={editingRoom.capacity || 0}
                    onChange={e => setEditingRoom(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. CSE, ECE, Mech"
                    value={editingRoom.department || ''}
                    onChange={e => setEditingRoom(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={editingRoom.status || 'Available'}
                  onChange={e => setEditingRoom(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Reserved">Reserved</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="General classroom equipped with 4K projector, AC and Wi-Fi."
                  value={editingRoom.description || ''}
                  onChange={e => setEditingRoom(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
                >
                  {editingRoom.id ? 'Save Changes' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* ADD / EDIT BUILDING MODAL */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {isBuildingModalOpen && editingBuilding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                {editingBuilding.id ? 'Edit Building Details' : 'Add New Building'}
              </h3>
              <button onClick={() => setIsBuildingModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            </div>

            {buildingValidationError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{buildingValidationError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBuildingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Building Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Academic Block, Main Block"
                  value={editingBuilding.name || ''}
                  onChange={e => setEditingBuilding(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Building Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AB-MAIN, SB-02"
                  value={editingBuilding.code || ''}
                  onChange={e => setEditingBuilding(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingBuilding.description || ''}
                  onChange={e => setEditingBuilding(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsBuildingModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md">{editingBuilding.id ? 'Save Changes' : 'Create Building'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* ADD / EDIT FLOOR MODAL */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {isFloorModalOpen && editingFloor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-500" />
                {editingFloor.id ? 'Edit Floor Level' : `Add Floor to ${selectedBuilding.name}`}
              </h3>
              <button onClick={() => setIsFloorModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            </div>

            {floorValidationError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{floorValidationError}</span>
              </div>
            )}

            <form onSubmit={handleSaveFloorSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ground Floor, 1st Floor"
                  value={editingFloor.name || ''}
                  onChange={e => { setEditingFloor(prev => ({ ...prev, name: e.target.value })); setFloorValidationError(null); }}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Number * (0 for Ground, 1 for 1st Floor)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editingFloor.floorNumber !== undefined ? editingFloor.floorNumber : 0}
                  onChange={e => { setEditingFloor(prev => ({ ...prev, floorNumber: Number(e.target.value) })); setFloorValidationError(null); }}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsFloorModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md">{editingFloor.id ? 'Save Changes' : 'Create Floor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* ADD / EDIT FACILITY OBJECT MODAL */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {isFacilityModalOpen && editingFacility && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                {editingFacility.id ? 'Edit Facility Object' : `Add Facility to ${selectedFloor.name}`}
              </h3>
              <button onClick={() => setIsFacilityModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            </div>

            {facilityValidationError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{facilityValidationError}</span>
              </div>
            )}

            <form onSubmit={handleSaveFacilitySubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Object Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Elevator Shaft A, Main Stairs"
                    value={editingFacility.name || ''}
                    onChange={e => setEditingFacility(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Object Type *</label>
                  <select
                    value={editingFacility.objectType || 'Stairs'}
                    onChange={e => setEditingFacility(prev => ({ ...prev, objectType: e.target.value as FacilityObjectType }))}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {ALL_FACILITY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 12-person high-speed glass elevator connecting floors."
                  value={typeof editingFacility.metadata === 'object' ? (editingFacility.metadata.description || '') : ''}
                  onChange={e => setEditingFacility(prev => ({
                    ...prev,
                    metadata: {
                      ...(typeof prev?.metadata === 'object' ? prev.metadata : {}),
                      description: e.target.value
                    }
                  }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={typeof editingFacility.metadata === 'object' ? (editingFacility.metadata.status || 'Active') : 'Active'}
                    onChange={e => setEditingFacility(prev => ({
                      ...prev,
                      metadata: {
                        ...(typeof prev?.metadata === 'object' ? prev.metadata : {}),
                        status: e.target.value
                      }
                    }))}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Closed">Closed</option>
                    <option value="Restricted">Restricted</option>
                    <option value="Available">Available</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Shape</label>
                  <input
                    type="text"
                    value={editingFacility.shape || 'rectangle'}
                    onChange={e => setEditingFacility(prev => ({ ...prev, shape: e.target.value }))}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFacilityModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
                >
                  {editingFacility.id ? 'Save Changes' : 'Create Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* PUBLISH CONFIRMATION MODAL */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {isPublishConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Publish Floor Plan?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedFloor.name} &bull; {selectedBuilding.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPublishConfirmOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <p className="font-bold text-slate-900 dark:text-white">
                This will publish the current draft layout live to all Student and Faculty portals.
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400 text-[11px] pt-1">
                <li><strong>{rooms.length} Rooms & Labs</strong> will be published</li>
                <li><strong>{facilityObjects.length} Facility Objects</strong> will be published</li>
                <li>Students and Faculty will see this published layout</li>
                <li>You can continue making draft edits anytime after publishing</li>
              </ul>
            </div>

            {publishValidationError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{publishValidationError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsPublishConfirmOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                disabled={isPublishing}
                className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all"
              >
                {isPublishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Confirm & Publish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* DELETE ROOM CONFIRMATION MODAL */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {deletingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-2xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete Room Confirmation</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Confirm Room Deletion</p>
                </div>
              </div>
              <button onClick={() => setDeletingRoom(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Are you sure you want to delete Room {deletingRoom.roomNumber}?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingRoom(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRoom}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-500/20"
              >
                Delete Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* DELETE FACILITY CONFIRMATION MODAL */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {deletingFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-2xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete Facility Confirmation</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Confirm Facility Deletion</p>
                </div>
              </div>
              <button onClick={() => setDeletingFacility(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Are you sure you want to delete {deletingFacility.name}?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingFacility(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFacility}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-500/20"
              >
                Delete Facility
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* DELETE FLOOR CONFIRMATION MODAL */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {deletingFloor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-2xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete Floor Confirmation</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Confirm Floor Deletion</p>
                </div>
              </div>
              <button onClick={() => setDeletingFloor(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Are you sure you want to delete {deletingFloor.name}?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingFloor(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFloor}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-500/20"
              >
                Delete Floor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* DELETE BUILDING CONFIRMATION MODAL */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {deletingBuilding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-2xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete Building Confirmation</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Confirm Building Deletion</p>
                </div>
              </div>
              <button onClick={() => setDeletingBuilding(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Are you sure you want to delete Building {deletingBuilding.name}?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingBuilding(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBuilding}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-500/20"
              >
                Delete Building
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default FloorManagement;
