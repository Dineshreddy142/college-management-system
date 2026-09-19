import client from './client';

export interface Point {
  x: number;
  y: number;
}

export type GeometryType =
  | 'RECTANGLE'
  | 'SQUARE'
  | 'CIRCLE'
  | 'ELLIPSE'
  | 'ROUNDED_RECTANGLE'
  | 'POLYGON'
  | 'POLYLINE'
  | 'FREEFORM'
  | 'CUSTOM';

export type BuildingType = 'Academic' | 'Administrative' | 'Laboratory' | 'Library' | 'Hostel' | 'Sports' | 'Other';
export type BuildingStatus = 'Active' | 'Inactive' | 'Under Construction' | 'Maintenance';

export interface BuildingRecord {
  id: number;
  code: string;
  name: string;
  description?: string;
  building_type: BuildingType;
  department: string;
  status: BuildingStatus;
  total_floors: number;
  geometry_type: GeometryType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  boundary_points?: Point[];
  metadata?: Record<string, any>;
  floors_count?: number;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FloorRecord {
  id: number;
  building_id: number;
  floor_number: number;
  name: string;
  code?: string;
  description?: string;
  status: 'Active' | 'Inactive' | 'Draft' | 'Maintenance';
  width: number;
  height: number;
  boundary_points?: Point[];
  building_name?: string;
  building_code?: string;
  building_geometry_type?: GeometryType;
  building_width?: number;
  building_height?: number;
  building_boundary_points?: Point[];
  current_version_id?: number | null;
  published_version_id?: number | null;
  publish_status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FloorLayerRecord {
  id: number;
  floor_id: number;
  layer_key: string;
  name: string;
  z_index: number;
  visible: boolean;
  locked: boolean;
}

export interface FloorObjectRecord {
  id: string | number;
  floor_id: number;
  layer_id?: number | null;
  object_type: string;
  geometry_type: GeometryType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  points?: Point[];
  label?: string;
  z_index?: number;
  locked?: boolean;
  visible?: boolean;
  fill_color?: string;
  stroke_color?: string;
  stroke_width?: number;
  properties?: Record<string, any>;
  version_status?: 'DRAFT' | 'PUBLISHED';
  created_by?: string;
  updated_by?: string;
}

export interface FloorVersionRecord {
  id: number;
  floor_id: number;
  version_number: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  published_at?: string | null;
  created_by?: string;
  created_at?: string;
  snapshot_data?: {
    layers: FloorLayerRecord[];
    objects: FloorObjectRecord[];
  };
}

export const blockService = {
  // Buildings
  getBuildings: async (params?: { search?: string; type?: string; department?: string; status?: string }) => {
    const res = await client.get<BuildingRecord[]>('/block/buildings', { params });
    return res.data;
  },

  getBuildingDetail: async (id: number | string) => {
    const res = await client.get<BuildingRecord & { floors: FloorRecord[] }>(`/block/buildings/${id}`);
    return res.data;
  },

  createBuilding: async (data: Partial<BuildingRecord>) => {
    const res = await client.post<{ message: string; building: BuildingRecord }>('/block/buildings', data);
    return res.data;
  },

  updateBuilding: async (id: number | string, data: Partial<BuildingRecord>) => {
    const res = await client.put<{ message: string; building: BuildingRecord }>(`/block/buildings/${id}`, data);
    return res.data;
  },

  deleteBuilding: async (id: number | string) => {
    const res = await client.delete<{ message: string; id: number }>(`/block/buildings/${id}`);
    return res.data;
  },

  duplicateBuilding: async (id: number | string) => {
    const res = await client.post<{ message: string; building: BuildingRecord }>(`/block/buildings/${id}/duplicate`);
    return res.data;
  },

  // Floors
  getFloors: async (buildingId: number | string) => {
    const res = await client.get<FloorRecord[]>(`/block/buildings/${buildingId}/floors`);
    return res.data;
  },

  getFloorDetail: async (id: number | string) => {
    const res = await client.get<FloorRecord>(`/block/floors/${id}`);
    return res.data;
  },

  createFloor: async (buildingId: number | string, data: Partial<FloorRecord>) => {
    const res = await client.post<{ message: string; floor: FloorRecord }>(`/block/buildings/${buildingId}/floors`, data);
    return res.data;
  },

  updateFloor: async (id: number | string, data: Partial<FloorRecord>) => {
    const res = await client.put<{ message: string; floor: FloorRecord }>(`/block/floors/${id}`, data);
    return res.data;
  },

  deleteFloor: async (id: number | string) => {
    const res = await client.delete<{ message: string; id: number }>(`/block/floors/${id}`);
    return res.data;
  },

  // Floor Objects & Layout CAD Editor
  getFloorObjects: async (floorId: number | string) => {
    const res = await client.get<{ layers: FloorLayerRecord[]; objects: FloorObjectRecord[] }>(`/block/floors/${floorId}/objects`);
    return res.data;
  },

  saveFloorObjectsBatch: async (floorId: number | string, data: { objects: FloorObjectRecord[]; layers?: FloorLayerRecord[] }) => {
    const res = await client.post<{ message: string; savedCount: number }>(`/block/floors/${floorId}/objects`, data);
    return res.data;
  },

  // Rooms aggregate inventory
  getRoomsInventory: async (params?: { buildingId?: string; floorId?: string; type?: string; department?: string; status?: string; search?: string }) => {
    const res = await client.get<(FloorObjectRecord & { building_name: string; building_code: string; floor_name: string; floor_number: number })[]>('/block/rooms', { params });
    return res.data;
  },

  // Version Control
  getVersions: async (floorId: number | string) => {
    const res = await client.get<FloorVersionRecord[]>(`/block/floors/${floorId}/versions`);
    return res.data;
  },

  getVersionDetail: async (versionId: number | string) => {
    const res = await client.get<FloorVersionRecord>(`/block/floor-versions/${versionId}`);
    return res.data;
  },

  createVersionSnapshot: async (floorId: number | string, description?: string) => {
    const res = await client.post<{ message: string; versionId: number; versionNumber: string }>(`/block/floors/${floorId}/versions`, { description });
    return res.data;
  },

  publishVersion: async (versionId: number | string) => {
    const res = await client.post<{ message: string }>(`/block/floor-versions/${versionId}/publish`);
    return res.data;
  },

  restoreVersion: async (versionId: number | string) => {
    const res = await client.post<{ message: string }>(`/block/floor-versions/${versionId}/restore`);
    return res.data;
  },

  // Import / Export
  exportFloorJson: async (floorId: number | string) => {
    const res = await client.get(`/block/floors/${floorId}/export/json`);
    return res.data;
  },

  importFloorJson: async (floorId: number | string, data: any) => {
    const res = await client.post<{ message: string }>(`/block/floors/${floorId}/import`, data);
    return res.data;
  }
};
