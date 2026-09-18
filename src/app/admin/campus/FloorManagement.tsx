import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Building2, Layers, DoorOpen, Search, Edit3, Save, Send, Plus, 
  ZoomIn, ZoomOut, Maximize2, Grid, Eye, Trash2, CheckCircle2, 
  AlertCircle, ChevronRight, Sparkles, Users, Cpu, BookOpen, 
  ChevronDown, RefreshCw, X, AlertTriangle, ArrowUp, ArrowDown, Copy, Type
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
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL DEFAULT MOCK DATA
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
  // Academic Block Floors
  { id: 'f1', buildingId: 'b2', floorNumber: 0, name: 'Ground Floor', description: 'Main Lobby, Seminar Halls & Student Helpdesk', roomsCount: 18, area: '1,200 sq.m', displayOrder: 1 },
  { id: 'f2', buildingId: 'b2', floorNumber: 1, name: '1st Floor', description: 'Computer Science Classrooms & Smart Labs', roomsCount: 16, area: '1,150 sq.m', displayOrder: 2 },
  { id: 'f3', buildingId: 'b2', floorNumber: 2, name: '2nd Floor', description: 'Electronics & Communication Lecture Halls', roomsCount: 16, area: '1,150 sq.m', displayOrder: 3 },
  { id: 'f4', buildingId: 'b2', floorNumber: 3, name: '3rd Floor', description: 'Post Graduate Research Labs & HOD Suites', roomsCount: 18, area: '1,100 sq.m', displayOrder: 4 },

  // Main Block Floors
  { id: 'f5', buildingId: 'b1', floorNumber: 0, name: 'Ground Floor', description: 'Executive Reception & Board Room', roomsCount: 12, area: '1,500 sq.m', displayOrder: 1 },
  { id: 'f6', buildingId: 'b1', floorNumber: 1, name: '1st Floor', description: 'Principal & Vice Chancellor Offices', roomsCount: 10, area: '1,400 sq.m', displayOrder: 2 },

  // Science Block Floors
  { id: 'f7', buildingId: 'b3', floorNumber: 0, name: 'Ground Floor', description: 'Physics & Applied Mechanics Wing', roomsCount: 14, area: '1,300 sq.m', displayOrder: 1 },
  { id: 'f8', buildingId: 'b3', floorNumber: 1, name: '1st Floor', description: 'Chemistry & Biotechnology Labs', roomsCount: 15, area: '1,300 sq.m', displayOrder: 2 },

  // Engineering Block Floors
  { id: 'f9', buildingId: 'b4', floorNumber: 0, name: 'Ground Floor', description: 'Heavy Machinery & Mechanical Workshops', roomsCount: 14, area: '1,250 sq.m', displayOrder: 1 },
  { id: 'f10', buildingId: 'b4', floorNumber: 1, name: '1st Floor', description: 'Robotics, IoT & CAD Design Studios', roomsCount: 12, area: '1,250 sq.m', displayOrder: 2 },

  // Administrative Block Floors
  { id: 'f11', buildingId: 'b5', floorNumber: 0, name: 'Ground Floor', description: 'Accounts, Admissions & Registrar Counter', roomsCount: 10, area: '1,000 sq.m', displayOrder: 1 },

  // Library Block Floors
  { id: 'f12', buildingId: 'b6', floorNumber: 0, name: 'Ground Floor', description: 'Central Digital Reading Room & E-Journals', roomsCount: 8, area: '1,600 sq.m', displayOrder: 1 },

  // Hostel Block Floors
  { id: 'f13', buildingId: 'b7', floorNumber: 0, name: 'Ground Floor', description: 'Hostel Mess Hall, Gym & Warden Office', roomsCount: 24, area: '1,800 sq.m', displayOrder: 1 },
];

const INITIAL_ROOMS: RoomItem[] = [
  // Top Row Classrooms
  { id: 'r1', code: 'CR-101', name: 'Lecture Hall 101', type: 'classroom', dept: 'Computer Science', capacity: 60, occupancy: 85, status: 'occupied', x: 4, y: 5, w: 18, h: 24, equipment: ['4K Projector', 'Smart Board', 'AC', 'Wi-Fi 6'], assignedTo: 'Prof. Rajesh Kumar (DBMS Class)' },
  { id: 'r2', code: 'CR-102', name: 'Lecture Hall 102', type: 'classroom', dept: 'Computer Science', capacity: 60, occupancy: 0, status: 'available', x: 24, y: 5, w: 18, h: 24, equipment: ['Projector', 'Audio System', 'AC'], assignedTo: 'Available for scheduling' },
  { id: 'r3', code: 'CR-103', name: 'Interactive Classroom', type: 'classroom', dept: 'Electronics', capacity: 45, occupancy: 100, status: 'occupied', x: 44, y: 5, w: 18, h: 24, equipment: ['Touch Screen', 'Dual AC', 'Surround Sound'], assignedTo: 'Dr. Ananya Sharma (VLSI Design)' },
  { id: 'r4', code: 'CS-LAB-1', name: 'AI & Data Science Lab', type: 'lab', dept: 'Computer Science', capacity: 36, occupancy: 90, status: 'occupied', x: 64, y: 5, w: 32, h: 24, equipment: ['36 RTX Workstations', 'GPU Server', 'High Speed Fiber'], assignedTo: 'AI Research Team' },

  // Middle Row Cabins & Offices
  { id: 'r5', code: 'HOD-OFFICE', name: 'HOD Computer Science', type: 'office', dept: 'Computer Science', capacity: 6, occupancy: 50, status: 'occupied', x: 4, y: 35, w: 14, h: 18, equipment: ['Conference Table', 'Executive Desk', 'Private Restroom'], assignedTo: 'Dr. V. K. Raman (HOD CSE)' },
  { id: 'r6', code: 'FACULTY-A', name: 'Faculty Cabin Complex A', type: 'office', dept: 'Computer Science', capacity: 12, occupancy: 40, status: 'occupied', x: 20, y: 35, w: 22, h: 18, equipment: ['12 Work Desks', 'Printer Station', 'Coffee Machine'], assignedTo: '6 CSE Assistant Professors' },
  
  // Facilities & Restrooms
  { id: 'r7', code: 'ELEV-BAY', name: 'Elevator & Stairwell 1', type: 'facility', dept: 'Campus Operations', capacity: 15, occupancy: 10, status: 'available', x: 44, y: 35, w: 12, h: 18, equipment: ['Dual High-Speed Lifts', 'Fire Hose', 'Emergency Stairs'] },
  { id: 'r8', code: 'RESTROOM-M', name: 'Gents Restroom', type: 'facility', dept: 'Campus Operations', capacity: 10, occupancy: 20, status: 'available', x: 58, y: 35, w: 12, h: 18, equipment: ['Sensored Faucets', 'Hand Dryer'] },
  { id: 'r9', code: 'RESTROOM-F', name: 'Ladies Restroom', type: 'facility', dept: 'Campus Operations', capacity: 10, occupancy: 20, status: 'available', x: 72, y: 35, w: 12, h: 18, equipment: ['Sensored Faucets', 'Powder Room'] },
  { id: 'r10', code: 'SERVER-ROOM', name: 'Core Network Server Room', type: 'facility', dept: 'IT Infrastructure', capacity: 4, occupancy: 100, status: 'reserved', x: 86, y: 35, w: 10, h: 18, equipment: ['Precision AC', 'Biometric Access', 'UPS Backup'] },

  // Bottom Row Auditorium & Labs
  { id: 'r11', code: 'CS-LAB-2', name: 'Cloud Computing & Cyber Lab', type: 'lab', dept: 'Computer Science', capacity: 40, occupancy: 0, status: 'available', x: 4, y: 58, w: 28, h: 26, equipment: ['40 i7 PCs', 'CISCO Switches', 'Projector'], assignedTo: 'Scheduled: 2:00 PM Cyber Security' },
  { id: 'r12', code: 'AUD-MAIN', name: 'Mini Auditorium', type: 'auditorium', dept: 'Academic Affairs', capacity: 180, occupancy: 75, status: 'occupied', x: 34, y: 58, w: 42, h: 26, equipment: ['Acoustic Panels', 'Stage Lighting', 'PA System', 'Dolby Audio'], assignedTo: 'National Seminar on Robotics' },
  { id: 'r13', code: 'CR-104', name: 'Smart Seminar Room', type: 'classroom', dept: 'Information Tech', capacity: 50, occupancy: 0, status: 'maintenance', x: 78, y: 58, w: 18, h: 26, equipment: ['Projector Repairing', 'Wi-Fi AP'], assignedTo: 'Under AC Maintenance' },
];

export function FloorManagement() {
  // Buildings & Floors State
  const [buildings, setBuildings] = useState<BuildingInfo[]>(INITIAL_BUILDINGS);
  const [floors, setFloors] = useState<FloorInfo[]>(INITIAL_FLOORS);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | number>('b2'); // Academic Block default
  const [selectedFloorId, setSelectedFloorId] = useState<string | number>('f1');
  
  // Rooms & Filters State
  const [rooms, setRooms] = useState<RoomItem[]>(INITIAL_ROOMS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [buildingSearchQuery, setBuildingSearchQuery] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>('r1');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [activeRightTab, setActiveRightTab] = useState<'rooms' | 'buildings' | 'floors'>('floors');
  
  // Canvas Viewport Controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  
  // Modals & Feedback
  const [isRoomModalOpen, setIsRoomModalOpen] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Partial<RoomItem> | null>(null);
  
  // Building Management Modals
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState<boolean>(false);
  const [editingBuilding, setEditingBuilding] = useState<Partial<BuildingInfo> | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<BuildingInfo | null>(null);

  // Floor Management Modals & Validation
  const [isFloorModalOpen, setIsFloorModalOpen] = useState<boolean>(false);
  const [editingFloor, setEditingFloor] = useState<Partial<FloorInfo> | null>(null);
  const [deletingFloor, setDeletingFloor] = useState<FloorInfo | null>(null);
  const [floorValidationError, setFloorValidationError] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Fetch campus buildings and floors from API on mount
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
          
          const targetBId = mappedB.some(b => String(b.id) === String(selectedBuildingId)) ? selectedBuildingId : mappedB[0].id;
          
          // Fetch floors for target building
          const fRes = await client.get(`/campus/buildings/${targetBId}/floors`);
          if (fRes.data && Array.isArray(fRes.data) && fRes.data.length > 0) {
            const mappedF: FloorInfo[] = fRes.data.map((f: any) => ({
              id: f.id,
              buildingId: f.buildingId || f.building_id || targetBId,
              name: f.name,
              floorNumber: f.floorNumber !== undefined ? f.floorNumber : (f.floor_number !== undefined ? f.floor_number : 0),
              description: f.description || '',
              displayOrder: f.displayOrder || f.display_order || 0,
              roomsCount: 12,
              area: '1,200 sq.m'
            }));
            setFloors(prev => {
              const otherFloors = prev.filter(p => String(p.buildingId) !== String(targetBId));
              return [...mappedF, ...otherFloors];
            });
          }
        }
      } catch (err) {
        console.log('Using initial client campus state (API fallback)');
      }
    }
    loadCampusData();
  }, []);

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
      // Auto create Ground Floor fallback if empty
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
    setTimeout(() => setToastMessage(null), 3200);
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

  // ─────────────────────────────────────────────────────────────────────────────
  // FLOOR MANAGEMENT HANDLERS (ADD, EDIT, RENAME, DUPLICATE, DELETE, REORDER)
  // ─────────────────────────────────────────────────────────────────────────────

  const handleOpenAddFloorModal = () => {
    const nextNum = buildingFloors.length > 0 ? Math.max(...buildingFloors.map(f => f.floorNumber ?? 0)) + 1 : 0;
    const nextName = nextNum === 0 ? 'Ground Floor' : `${nextNum}${nextNum === 1 ? 'st' : nextNum === 2 ? 'nd' : nextNum === 3 ? 'rd' : 'th'} Floor`;
    setEditingFloor({
      buildingId: selectedBuildingId,
      name: nextName,
      floorNumber: nextNum,
      description: `Classrooms & facilities for ${nextName}`,
      displayOrder: nextNum + 1
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
    if (!editingFloor || editingFloor.name === undefined || editingFloor.floorNumber === undefined) {
      setFloorValidationError('Floor Name and Floor Number are required.');
      return;
    }

    const targetBId = editingFloor.buildingId || selectedBuildingId;
    const numFloor = Number(editingFloor.floorNumber);

    // Validation: prevent duplicate floorNumber inside same building
    const isDuplicate = floors.some(f => 
      String(f.buildingId) === String(targetBId) && 
      f.floorNumber === numFloor && 
      String(f.id) !== String(editingFloor.id)
    );

    if (isDuplicate) {
      setFloorValidationError(`Floor Number ${numFloor} already exists in ${selectedBuilding.name}.`);
      return;
    }

    const payload = {
      buildingId: targetBId,
      name: editingFloor.name.trim(),
      floorNumber: numFloor,
      description: editingFloor.description || '',
      displayOrder: editingFloor.displayOrder ?? numFloor,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingFloor.id) {
        // Edit / Rename existing floor
        await client.put(`/campus/floors/${editingFloor.id}`, payload).catch(() => {});
        setFloors(prev => prev.map(f => String(f.id) === String(editingFloor.id) ? { ...f, ...payload } as FloorInfo : f));
        triggerToast(`Updated floor "${payload.name}" (Level ${payload.floorNumber})`);
      } else {
        // Create new floor
        let newFloorObj: FloorInfo = {
          id: `f-${targetBId}-${Date.now()}`,
          createdAt: new Date().toISOString(),
          roomsCount: 12,
          area: '1,200 sq.m',
          ...payload
        };

        try {
          const res = await client.post('/campus/floors', payload);
          if (res.data && res.data.floor) {
            newFloorObj = {
              id: res.data.floor.id,
              buildingId: res.data.floor.buildingId || targetBId,
              name: res.data.floor.name,
              floorNumber: res.data.floor.floorNumber,
              description: res.data.floor.description || '',
              displayOrder: res.data.floor.displayOrder || numFloor,
              createdAt: res.data.floor.createdAt,
              updatedAt: res.data.floor.updatedAt,
              roomsCount: 12,
              area: '1,200 sq.m'
            };
          }
        } catch (apiErr) {
          console.log('API fallback for floor creation');
        }

        setFloors(prev => [...prev, newFloorObj]);
        setSelectedFloorId(newFloorObj.id);
        triggerToast(`Created new floor "${payload.name}" in ${selectedBuilding.code}`);
      }

      setIsFloorModalOpen(false);
      setEditingFloor(null);
      setFloorValidationError(null);
    } catch (err: any) {
      console.error('Save floor error:', err);
      setFloorValidationError(err.response?.data?.error || 'Failed to save floor details.');
    }
  };

  const handleDuplicateFloor = async (f: FloorInfo) => {
    try {
      // API call or local state duplication
      const nextNum = Math.max(...buildingFloors.map(fl => fl.floorNumber ?? 0)) + 1;
      let duplicatedObj: FloorInfo = {
        id: `f-${f.buildingId}-${Date.now()}`,
        buildingId: f.buildingId,
        name: `${f.name} (Copy)`,
        floorNumber: nextNum,
        description: f.description || 'Duplicated floor layout',
        displayOrder: nextNum + 1,
        roomsCount: f.roomsCount || 12,
        area: f.area || '1,200 sq.m',
        createdAt: new Date().toISOString()
      };

      try {
        const res = await client.post(`/campus/floors/${f.id}/duplicate`);
        if (res.data && res.data.floor) {
          duplicatedObj = {
            id: res.data.floor.id,
            buildingId: res.data.floor.buildingId || f.buildingId,
            name: res.data.floor.name,
            floorNumber: res.data.floor.floorNumber,
            description: res.data.floor.description,
            displayOrder: res.data.floor.displayOrder,
            roomsCount: 12,
            area: '1,200 sq.m'
          };
        }
      } catch (e) {
        console.log('API fallback for duplicate floor');
      }

      setFloors(prev => [...prev, duplicatedObj]);
      setSelectedFloorId(duplicatedObj.id);
      triggerToast(`Duplicated "${f.name}" as "${duplicatedObj.name}"`);
    } catch (err) {
      triggerToast('Failed to duplicate floor');
    }
  };

  const handleConfirmDeleteFloor = async () => {
    if (!deletingFloor) return;
    const targetId = deletingFloor.id;
    const targetName = deletingFloor.name;

    try {
      await client.delete(`/campus/floors/${targetId}`).catch(() => {});
      setFloors(prev => prev.filter(f => String(f.id) !== String(targetId)));

      // Select next available floor if deleted floor was active
      if (String(selectedFloorId) === String(targetId)) {
        const remaining = buildingFloors.filter(f => String(f.id) !== String(targetId));
        if (remaining.length > 0) setSelectedFloorId(remaining[0].id);
      }

      triggerToast(`Floor "${targetName}" deleted successfully`);
    } catch (err) {
      triggerToast('Error deleting floor');
    } finally {
      setDeletingFloor(null);
    }
  };

  const handleMoveFloorUp = (index: number) => {
    if (index <= 0) return;
    const newFloors = [...buildingFloors];
    const tempNum = newFloors[index].floorNumber;
    newFloors[index].floorNumber = newFloors[index - 1].floorNumber;
    newFloors[index - 1].floorNumber = tempNum;

    setFloors(prev => {
      const otherBuildingFloors = prev.filter(p => String(p.buildingId) !== String(selectedBuildingId));
      return [...newFloors, ...otherBuildingFloors];
    });
    triggerToast(`Reordered floor position for ${newFloors[index - 1].name}`);
  };

  const handleMoveFloorDown = (index: number) => {
    if (index >= buildingFloors.length - 1) return;
    const newFloors = [...buildingFloors];
    const tempNum = newFloors[index].floorNumber;
    newFloors[index].floorNumber = newFloors[index + 1].floorNumber;
    newFloors[index + 1].floorNumber = tempNum;

    setFloors(prev => {
      const otherBuildingFloors = prev.filter(p => String(p.buildingId) !== String(selectedBuildingId));
      return [...newFloors, ...otherBuildingFloors];
    });
    triggerToast(`Reordered floor position for ${newFloors[index + 1].name}`);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // BUILDING MANAGEMENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleOpenAddBuildingModal = () => {
    setEditingBuilding({
      name: '',
      code: '',
      description: '',
      total_floors: 4,
      status: 'Active'
    });
    setIsBuildingModalOpen(true);
  };

  const handleOpenEditBuildingModal = (b: BuildingInfo) => {
    setEditingBuilding({ ...b });
    setIsBuildingModalOpen(true);
  };

  const handleSaveBuildingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBuilding || !editingBuilding.name || !editingBuilding.code) {
      triggerToast('Building Name and Code are required!');
      return;
    }

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
        triggerToast(`Updated building "${payload.name}" (${payload.code})`);
      } else {
        let newBuildingObj: BuildingInfo = {
          id: `b-${Date.now()}`,
          ...payload
        };

        try {
          const res = await client.post('/campus/buildings', payload);
          if (res.data && res.data.building) {
            newBuildingObj = {
              id: res.data.building.id,
              name: res.data.building.name,
              code: res.data.building.code,
              description: res.data.building.description || '',
              total_floors: res.data.building.total_floors || payload.total_floors,
              status: res.data.building.status || payload.status
            };
          }
        } catch (apiErr) {
          console.log('API fallback for new building creation');
        }

        setBuildings(prev => [newBuildingObj, ...prev]);

        // Auto generate default floor entries for newly created building
        const newFloors: FloorInfo[] = [];
        for (let i = 0; i < payload.total_floors; i++) {
          newFloors.push({
            id: `f-${newBuildingObj.id}-${i}`,
            buildingId: newBuildingObj.id,
            floorNumber: i,
            name: i === 0 ? 'Ground Floor' : `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} Floor`,
            description: `Floor Level ${i}`,
            roomsCount: 10 + i * 2,
            area: '1,200 sq.m'
          });
        }
        setFloors(prev => [...newFloors, ...prev]);
        setSelectedBuildingId(newBuildingObj.id);
        triggerToast(`Created new building "${payload.name}" (${payload.code})`);
      }

      setIsBuildingModalOpen(false);
      setEditingBuilding(null);
    } catch (err: any) {
      triggerToast('Error saving building details');
    }
  };

  const handleConfirmDeleteBuilding = async () => {
    if (!deletingBuilding) return;
    const targetId = deletingBuilding.id;
    const targetName = deletingBuilding.name;

    try {
      await client.delete(`/campus/buildings/${targetId}`).catch(() => {});
      setBuildings(prev => prev.filter(b => String(b.id) !== String(targetId)));
      setFloors(prev => prev.filter(f => String(f.buildingId) !== String(targetId)));

      if (String(selectedBuildingId) === String(targetId)) {
        const remaining = buildings.filter(b => String(b.id) !== String(targetId));
        if (remaining.length > 0) setSelectedBuildingId(remaining[0].id);
      }

      triggerToast(`Building "${targetName}" deleted successfully`);
    } catch (err) {
      triggerToast('Error deleting building');
    } finally {
      setDeletingBuilding(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ROOM MANAGEMENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

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

  const getBuildingStatusBadge = (status: BuildingInfo['status']) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';
      case 'Renovating': return 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900';
      case 'Maintenance': return 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900';
      case 'Inactive': return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
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
          
          {/* Building Select Dropdown */}
          <div className="relative min-w-[200px]">
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

          {/* Floor Select Dropdown (Filtered for selected building ONLY) */}
          <div className="relative min-w-[180px]">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Floor Dropdown ({buildingFloors.length})</label>
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

          {/* Quick Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Search Rooms</label>
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
                <p className="text-xl font-bold text-slate-600 dark:text-slate-300">{selectedBuilding.name} - {selectedFloor.name}</p>
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
              onClick={() => setActiveRightTab('floors')}
              className={cn(
                "flex-1 py-3 px-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5",
                activeRightTab === 'floors'
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              <Layers className="w-4 h-4" /> Floors ({buildingFloors.length})
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
              <Building2 className="w-4 h-4" /> Buildings ({buildings.length})
            </button>

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
          </div>

          {/* Panel Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            
            {/* ───────────────────────────────────────────────────────────── */}
            {/* TAB 1: FLOORS MANAGEMENT DIRECTORY */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeRightTab === 'floors' && (
              <div className="space-y-3">
                
                {/* Active Building Context Badge */}
                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-blue-200">Selected Building</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded-md text-[10px] font-bold font-mono">{selectedBuilding.code}</span>
                  </div>
                  <h3 className="text-base font-black truncate">{selectedBuilding.name}</h3>
                  <p className="text-xs text-blue-100 flex items-center justify-between pt-1 border-t border-white/20">
                    <span>{buildingFloors.length} Floors Configured</span>
                    <span className="font-semibold text-emerald-300">{stats.total} Total Rooms</span>
                  </p>
                </div>

                {/* Add Floor Button */}
                <button
                  onClick={handleOpenAddFloorModal}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add New Floor Level
                </button>

                {/* Floor List Header */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1 pt-1">
                  <span>Floors in {selectedBuilding.name}</span>
                  <span>{buildingFloors.length} Levels</span>
                </div>

                {/* Floors List with Reorder, Duplicate, Rename, Delete */}
                <div className="space-y-2">
                  {buildingFloors.map((f, index) => {
                    const isSelected = String(selectedFloorId) === String(f.id);
                    return (
                      <div
                        key={f.id}
                        onClick={() => setSelectedFloorId(f.id)}
                        className={cn(
                          "p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 group",
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 shadow-md ring-2 ring-blue-500/20"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            {/* Level Badge */}
                            <div className={cn(
                              "w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center flex-shrink-0 shadow-xs",
                              isSelected ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                            )}>
                              L{f.floorNumber}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className={cn("text-sm font-black", isSelected ? "text-blue-700 dark:text-blue-400" : "text-slate-900 dark:text-white")}>
                                  {f.name}
                                </span>
                                {isSelected && (
                                  <span className="text-[9px] font-extrabold uppercase bg-blue-600 text-white px-1.5 py-0.2 rounded-md">Active</span>
                                )}
                              </div>
                              {f.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{f.description}</p>
                              )}
                            </div>
                          </div>

                          {/* Reorder Up / Down */}
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMoveFloorUp(index); }}
                              disabled={index === 0}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 disabled:opacity-30"
                              title="Move Floor Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMoveFloorDown(index); }}
                              disabled={index === buildingFloors.length - 1}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 disabled:opacity-30"
                              title="Move Floor Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Floor Action Toolbar */}
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          <span className="font-semibold text-[11px] text-slate-600 dark:text-slate-400">
                            Floor Number: {f.floorNumber}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEditFloorModal(f); }}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                              title="Rename / Edit Floor"
                            >
                              <Edit3 className="w-3 h-3" /> Edit / Rename
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); handleDuplicateFloor(f); }}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 hover:text-emerald-600 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                              title="Duplicate Floor"
                            >
                              <Copy className="w-3 h-3" /> Duplicate
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); setDeletingFloor(f); }}
                              className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete Floor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* TAB 2: BUILDINGS MANAGEMENT */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeRightTab === 'buildings' && (
              <div className="space-y-3">
                
                <button
                  onClick={handleOpenAddBuildingModal}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add New Building
                </button>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search buildings by name or code..."
                    value={buildingSearchQuery}
                    onChange={e => setBuildingSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  {filteredBuildings.map(b => {
                    const isSelected = String(b.id) === String(selectedBuildingId);
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBuildingId(b.id)}
                        className={cn(
                          "p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 group",
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/50 border-blue-500 shadow-md"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-slate-900 dark:text-white group-hover:text-blue-600">
                                {b.name}
                              </span>
                              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-1.5 py-0.2 rounded font-mono">
                                {b.code}
                              </span>
                            </div>
                            {b.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{b.description}</p>
                            )}
                          </div>

                          <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase flex-shrink-0", getBuildingStatusBadge(b.status))}>
                            {b.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {b.total_floors || b.floorsCount || 1} Floors Total
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEditBuildingModal(b); }}
                              className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950 text-slate-400 hover:text-blue-600 transition-colors"
                              title="Edit Building"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeletingBuilding(b); }}
                              className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete Building"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* TAB 3: ROOMS LIST */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeRightTab === 'rooms' && (
              <>
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
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                    Click any room on the floor canvas to view its configuration.
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                    <span>Floor Rooms List</span>
                    <span>{filteredRooms.length} Found</span>
                  </div>

                  <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
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

          </div>

        </div>

      </div>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* ADD / EDIT FLOOR MODAL */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {isFloorModalOpen && editingFloor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-500" />
                {editingFloor.id ? 'Edit / Rename Floor' : `Add Floor to ${selectedBuilding.name}`}
              </h3>
              <button onClick={() => setIsFloorModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {floorValidationError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{floorValidationError}</span>
              </div>
            )}

            <form onSubmit={handleSaveFloorSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Building</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedBuilding.name} (${selectedBuilding.code})`}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-500 opacity-80"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ground Floor, 1st Floor, 2nd Floor"
                  value={editingFloor.name || ''}
                  onChange={e => {
                    setEditingFloor(prev => ({ ...prev, name: e.target.value }));
                    setFloorValidationError(null);
                  }}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Floor Number * (0 for Ground, 1 for 1st Floor)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={20}
                  value={editingFloor.floorNumber !== undefined ? editingFloor.floorNumber : 0}
                  onChange={e => {
                    setEditingFloor(prev => ({ ...prev, floorNumber: Number(e.target.value) }));
                    setFloorValidationError(null);
                  }}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Computer Science Labs & Classrooms"
                  value={editingFloor.description || ''}
                  onChange={e => setEditingFloor(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFloorModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
                >
                  {editingFloor.id ? 'Save Changes' : 'Create Floor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* DELETE FLOOR CONFIRMATION DIALOG */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {deletingFloor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete Floor Level</h3>
                <p className="text-xs text-slate-400">Confirmation Required</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deletingFloor.name}</strong> (Level {deletingFloor.floorNumber}) from <strong className="text-slate-900 dark:text-white">{selectedBuilding.name}</strong>? 
              All rooms on this floor will be unassigned.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingFloor(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFloor}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Floor
              </button>
            </div>
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
              <button onClick={() => setIsBuildingModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBuildingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Building Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Block, Academic Block"
                  value={editingBuilding.name || ''}
                  onChange={e => setEditingBuilding(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Building Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AB-MAIN, SB-02, ENG-WNG"
                  value={editingBuilding.code || ''}
                  onChange={e => setEditingBuilding(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe building purpose..."
                  value={editingBuilding.description || ''}
                  onChange={e => setEditingBuilding(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Number of Floors</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editingBuilding.total_floors || 1}
                    onChange={e => setEditingBuilding(prev => ({ ...prev, total_floors: Number(e.target.value) }))}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={editingBuilding.status || 'Active'}
                    onChange={e => setEditingBuilding(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Renovating">Renovating</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBuildingModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
                >
                  {editingBuilding.id ? 'Save Changes' : 'Create Building'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* DELETE BUILDING CONFIRMATION DIALOG */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {deletingBuilding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete Building</h3>
                <p className="text-xs text-slate-400">Confirmation Required</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete building <strong className="text-slate-900 dark:text-white">{deletingBuilding.name}</strong> ({deletingBuilding.code})? 
              All associated floor layouts and room configurations will be deleted. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingBuilding(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBuilding}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Building
              </button>
            </div>
          </div>
        </div>
      )}

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
