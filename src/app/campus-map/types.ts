export type CampusCategory =
  | "Academic Buildings"
  | "Hostels / Residence Halls"
  | "Dining & Cafeteria"
  | "Sports & Recreation"
  | "Parking"
  | "Health & Medical"
  | "Administration"
  | "Computer Labs"
  | "Laboratories"
  | "Library"
  | "Transportation"
  | "Emergency Services"
  | "Cafes"
  | "Shops"
  | "Open Spaces"
  | "ATMs"
  | "Restrooms";

export interface AccessibilityInfo {
  wheelchairAccessible: boolean;
  elevatorAvailable: boolean;
  brailleSignage: boolean;
  accessibleRestrooms: boolean;
  accessibleParking: boolean;
  rampAccess: boolean;
}

export interface FloorRoom {
  roomNumber: string;
  name: string;
  type: "Classroom" | "Lab" | "Faculty Office" | "Seminar Hall" | "Restroom" | "Administrative" | "Study Zone";
  description?: string;
}

export interface FloorPlan {
  level: number;
  name: string;
  diagramSvg?: string;
  rooms: FloorRoom[];
}

export interface EmergencyInfo {
  nearestAED: string;
  nearestExit: string;
  assemblyPoint: string;
  emergencyHotline: string;
}

export interface HostelDetails {
  gender: "Men" | "Women" | "Co-ed";
  residenceType: "Undergraduate" | "Postgraduate" | "International" | "Faculty Residence";
  capacity: number;
  wardenName: string;
  wardenContact: string;
  messType: string;
  curfew: string;
}

export interface VirtualTourSpot {
  id: string;
  title: string;
  pitch: number;
  yaw: number;
  targetSpotId?: string;
  info?: string;
}

export interface VirtualTourData {
  enabled: boolean;
  title: string;
  sceneImage: string;
  description: string;
  spots: VirtualTourSpot[];
}

export interface CampusLocation {
  id: string;
  name: string;
  category: CampusCategory;
  buildingCode: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  image: string;
  gallery?: string[];
  openingHours: string;
  isOpenNow?: boolean;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  departments?: string[];
  facilities: string[];
  accessibility: AccessibilityInfo;
  floors?: FloorPlan[];
  emergencyInfo?: EmergencyInfo;
  hostelDetails?: HostelDetails;
  virtualTour?: VirtualTourData;
  polygonCoords?: [number, number][]; // optional building outline
}

export interface ShuttleStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  routes: string[];
  operatingHours: string;
  nextArrival: string;
}

export interface ShuttleRoute {
  id: string;
  name: string;
  color: string;
  activeHours: string;
  frequency: string;
  nextArrivalMinutes: number;
  path: [number, number][];
  stops: ShuttleStop[];
}

export interface DirectionsResult {
  fromName: string;
  toName: string;
  travelMode: "walking" | "driving";
  distanceMeters: number;
  estimatedMinutes: number;
  path: [number, number][];
  steps: {
    instruction: string;
    distance: string;
    icon: string;
  }[];
}

export interface CategoryMetadata {
  id: CampusCategory;
  label: string;
  iconName: string;
  emoji: string;
  color: string;
  markerBg: string;
  description: string;
}
