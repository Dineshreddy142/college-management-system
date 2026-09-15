import { CampusCategory, CampusLocation, CategoryMetadata, ShuttleRoute } from "./types";

export const CAMPUS_CENTER: [number, number] = [12.8235, 80.0445];
export const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [12.8150, 80.0350],
  [12.8320, 80.0540],
];

export const CATEGORIES_CONFIG: CategoryMetadata[] = [
  {
    id: "Academic Buildings",
    label: "Academic Buildings",
    iconName: "GraduationCap",
    emoji: "📚",
    color: "#2563EB",
    markerBg: "bg-blue-600",
    description: "Lecture halls, faculty departments, auditoriums & seminar halls",
  },
  {
    id: "Hostels / Residence Halls",
    label: "Hostels & Residences",
    iconName: "Home",
    emoji: "🏠",
    color: "#7C3AED",
    markerBg: "bg-purple-600",
    description: "Student hostels, scholar flats, warden offices & common rooms",
  },
  {
    id: "Dining & Cafeteria",
    label: "Dining & Cafeteria",
    iconName: "Utensils",
    emoji: "🍴",
    color: "#EA580C",
    markerBg: "bg-orange-600",
    description: "Main dining halls, food courts, student messes & quick bites",
  },
  {
    id: "Sports & Recreation",
    label: "Sports & Recreation",
    iconName: "Trophy",
    emoji: "🏋",
    color: "#059669",
    markerBg: "bg-emerald-600",
    description: "Stadium, athletic tracks, indoor gymnasium & swimming complex",
  },
  {
    id: "Parking",
    label: "Parking Lots",
    iconName: "Car",
    emoji: "🚗",
    color: "#4B5563",
    markerBg: "bg-gray-600",
    description: "Visitor parking, faculty lots, two-wheeler zones & EV chargers",
  },
  {
    id: "Health & Medical",
    label: "Health & Medical",
    iconName: "HeartPulse",
    emoji: "🏥",
    color: "#DC2626",
    markerBg: "bg-red-600",
    description: "Campus health centre, emergency triage, ambulance & pharmacy",
  },
  {
    id: "Administration",
    label: "Administration",
    iconName: "Building2",
    emoji: "🏢",
    color: "#0891B2",
    markerBg: "bg-cyan-600",
    description: "VC Secretariat, Registrar, Admissions, Finance & Examination division",
  },
  {
    id: "Computer Labs",
    label: "Computer Labs",
    iconName: "Laptop",
    emoji: "💻",
    color: "#4F46E5",
    markerBg: "bg-indigo-600",
    description: "HPC clusters, cloud compute labs, software engineering studios",
  },
  {
    id: "Laboratories",
    label: "Laboratories & Research",
    iconName: "FlaskConical",
    emoji: "🔬",
    color: "#D97706",
    markerBg: "bg-amber-600",
    description: "Robotics, IoT, biotechnology, physics & chemistry research centers",
  },
  {
    id: "Library",
    label: "Knowledge Hub & Library",
    iconName: "BookOpen",
    emoji: "📚",
    color: "#0D9488",
    markerBg: "bg-teal-600",
    description: "Central 24/7 library, silent research floor, e-resource portals",
  },
  {
    id: "Transportation",
    label: "Transportation & Shuttle",
    iconName: "Bus",
    emoji: "🚌",
    color: "#0284C7",
    markerBg: "bg-sky-600",
    description: "Shuttle bus terminals, campus buggies, bicycle docks & taxi stands",
  },
  {
    id: "Emergency Services",
    label: "Emergency & Safety",
    iconName: "ShieldAlert",
    emoji: "🚨",
    color: "#E11D48",
    markerBg: "bg-rose-600",
    description: "Security control room, emergency exits, fire hydrants & AED spots",
  },
  {
    id: "Cafes",
    label: "Cafes & Lounges",
    iconName: "Coffee",
    emoji: "☕",
    color: "#B45309",
    markerBg: "bg-amber-700",
    description: "Coffee shops, tea stalls, student chill zones & open-air kiosks",
  },
  {
    id: "Shops",
    label: "Campus Stores",
    iconName: "ShoppingBag",
    emoji: "🛍",
    color: "#9333EA",
    markerBg: "bg-purple-600",
    description: "Academic bookstore, stationery, uniform store & utility marts",
  },
  {
    id: "Open Spaces",
    label: "Open Spaces & Gardens",
    iconName: "Trees",
    emoji: "🌳",
    color: "#16A34A",
    markerBg: "bg-green-600",
    description: "University amphitheater, central quadrangle, eco lake & gazebos",
  },
  {
    id: "ATMs",
    label: "Banking & ATMs",
    iconName: "CreditCard",
    emoji: "🏧",
    color: "#1E40AF",
    markerBg: "bg-blue-800",
    description: "National bank branches, 24/7 cash dispensing kiosks & passbook kiosks",
  },
  {
    id: "Restrooms",
    label: "Accessible Restrooms",
    iconName: "Bath",
    emoji: "🚻",
    color: "#64748B",
    markerBg: "bg-slate-500",
    description: "Gender-neutral, ADA compliant restrooms & washrooms across campus",
  },
];

export const INITIAL_LOCATIONS: CampusLocation[] = [
  {
    id: "academic-building-01",
    name: "Main Academic Block (Vivekananda Bhavan)",
    category: "Academic Buildings",
    buildingCode: "AB-01",
    latitude: 12.8242,
    longitude: 80.0435,
    description: "Central 6-story flagship academic complex housing undergraduate auditorium, 30 smart lecture halls, and engineering faculty departments.",
    address: "North Academic Avenue, Central Campus",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=800&q=80"
    ],
    openingHours: "7:30 AM – 7:30 PM (Mon-Sat)",
    isOpenNow: true,
    contactPhone: "+91 (044) 2741-7100",
    contactEmail: "academic.dean@techuniv.edu",
    website: "https://techuniv.edu/academics/ab01",
    departments: [
      "Computer Science & Engineering",
      "Information Technology",
      "Data Science & AI",
      "Applied Mathematics"
    ],
    facilities: [
      "350-Seat Multi-tiered Auditorium",
      "High-speed 10Gbps Wi-Fi",
      "Smart Interactive Podiums",
      "Faculty Conference Lounge",
      "Student Project Collab Space",
      "Central Air Conditioning",
      "Automated Attendance Scanners"
    ],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: true,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: true,
      rampAccess: true,
    },
    floors: [
      {
        level: 0,
        name: "Ground Floor",
        rooms: [
          { roomNumber: "AB-G01", name: "Sir C.V. Raman Grand Auditorium", type: "Seminar Hall", description: "350-seater symposium and university keynote venue" },
          { roomNumber: "AB-G04", name: "Dean of Academic Affairs Secretariat", type: "Administrative", description: "Office of the Dean and Academic Board" },
          { roomNumber: "AB-G08", name: "Student Counselling & Grievance Desk", type: "Faculty Office" },
          { roomNumber: "AB-G12", name: "Main Entrance Atrium & Helpdesk", type: "Administrative" },
          { roomNumber: "AB-G-WC", name: "Accessible Restrooms (M/F/Unisex)", type: "Restroom" }
        ]
      },
      {
        level: 1,
        name: "First Floor",
        rooms: [
          { roomNumber: "AB-101", name: "Lecture Hall Alpha - CSE Foundation", type: "Classroom", description: "Capacity: 90 students with hybrid dual-streaming cameras" },
          { roomNumber: "AB-102", name: "Lecture Hall Beta - Data Structures", type: "Classroom", description: "Capacity: 90 students" },
          { roomNumber: "AB-108", name: "Department of CSE Faculty Workstations", type: "Faculty Office", description: "Offices of Senior Professors & Mentors" },
          { roomNumber: "AB-115", name: "Software Architecture & Design Lab", type: "Lab", description: "64 High-spec Workstations with Linux & Docker" }
        ]
      },
      {
        level: 2,
        name: "Second Floor",
        rooms: [
          { roomNumber: "AB-201", name: "Artificial Intelligence Research Wing", type: "Lab", description: "GPU cluster terminal room and research sandbox" },
          { roomNumber: "AB-204", name: "Seminar Room Gamma", type: "Seminar Hall", description: "Interactive round-table seating for 60 scholars" },
          { roomNumber: "AB-210", name: "Cybersecurity Threat Simulation Center", type: "Lab" }
        ]
      }
    ],
    emergencyInfo: {
      nearestAED: "Ground Floor Atrium adjacent to Security Post 1",
      nearestExit: "East & West Wing Emergency Fire Staircases",
      assemblyPoint: "Central Quadrangle Lawn Area A",
      emergencyHotline: "+91 (044) 2741-9999"
    },
    virtualTour: {
      enabled: true,
      title: "Main Academic Block Atrium 360°",
      sceneImage: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80",
      description: "Explore the atrium, auditorium foyer, and modern glass breezeways of Vivekananda Bhavan.",
      spots: [
        { id: "s1", title: "Auditorium Entrance", pitch: 2, yaw: 45, info: "Direct access to the 350-seat Raman Hall." },
        { id: "s2", title: "Smart Escalator & Elevator Bay", pitch: -5, yaw: 180, info: "High-speed lifts with braille buttons to floors 1-6." },
        { id: "s3", title: "Dean's Reception", pitch: 0, yaw: 270, info: "Student academic advisory and transcripts counter." }
      ]
    }
  },
  {
    id: "academic-building-02",
    name: "Aryabhata Engineering Complex",
    category: "Academic Buildings",
    buildingCode: "EH-02",
    latitude: 12.8255,
    longitude: 80.0425,
    description: "Heavy engineering block featuring modern mechanical fabrication, aerospace fluid wind tunnels, and civil materials testing arenas.",
    address: "West Tech Corridor, Campus Circle",
    image: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80",
    openingHours: "8:00 AM – 6:00 PM (Mon-Fri)",
    isOpenNow: true,
    contactPhone: "+91 (044) 2741-7120",
    contactEmail: "engineering@techuniv.edu",
    departments: ["Mechanical Engineering", "Civil Engineering", "Aerospace Engineering"],
    facilities: ["CAD/CAM Simulation Arena", "CNC Machining Center", "Materials Testing Rig", "Aerodynamics Wind Tunnel"],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: true,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: true,
      rampAccess: true,
    },
    floors: [
      {
        level: 0,
        name: "Ground Floor",
        rooms: [
          { roomNumber: "EH-G01", name: "Heavy Machinery & Lathe Workshop", type: "Lab" },
          { roomNumber: "EH-G05", name: "Materials Testing Lab (Universal Testing Machine)", type: "Lab" },
          { roomNumber: "EH-G10", name: "Workshop Superintendent Office", type: "Faculty Office" }
        ]
      },
      {
        level: 1,
        name: "First Floor",
        rooms: [
          { roomNumber: "EH-102", name: "Thermal Engineering & Fluid Mechanics Lab", type: "Lab" },
          { roomNumber: "EH-106", name: "Department of Mechanical Engineering HOD", type: "Administrative" },
          { roomNumber: "EH-112", name: "Engineering Design Studio", type: "Classroom" }
        ]
      }
    ],
    emergencyInfo: {
      nearestAED: "Ground Floor Corridor near safety eyewash station",
      nearestExit: "South Industrial Rolling Doors & Stairwell",
      assemblyPoint: "West Ground Assembly Zone C",
      emergencyHotline: "+91 (044) 2741-9999"
    }
  },
  {
    id: "academic-building-03",
    name: "Ramanujan Science & Research Tower",
    category: "Academic Buildings",
    buildingCode: "SC-03",
    latitude: 12.8248,
    longitude: 80.0460,
    description: "Multidisciplinary scientific research building with biosafety containment suites, laser spectroscopy, and cleanrooms.",
    address: "East Science Quad, Innovation Drive",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
    openingHours: "8:00 AM – 8:00 PM (Research Scholars 24/7)",
    isOpenNow: true,
    contactPhone: "+91 (044) 2741-7140",
    contactEmail: "sciences@techuniv.edu",
    departments: ["Physics & Optics", "Chemistry & Material Science", "Biotechnology", "Bioinformatics"],
    facilities: ["Class-1000 Cleanroom", "Atomic Force Microscopy Lab", "Bio-safety Level 2 Suites", "Chemical Cold Storage"],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: true,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: true,
      rampAccess: true,
    }
  },
  {
    id: "library-01",
    name: "Dr. APJ Abdul Kalam Central Knowledge Resource Centre",
    category: "Library",
    buildingCode: "LIB-01",
    latitude: 12.8225,
    longitude: 80.0448,
    description: "Five-story glass architectural landmark holding over 250,000 physical volumes, 50,000 digital IEEE/ACM subscriptions, 24/7 night reading suites, and private research carrels.",
    address: "Central University Mall, Promenade",
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507842229451-79b1be8838d0?auto=format&fit=crop&w=800&q=80"
    ],
    openingHours: "Open 24 Hours (Digital Commons) | Stacks: 8:00 AM – 11:00 PM",
    isOpenNow: true,
    contactPhone: "+91 (044) 2741-7200",
    contactEmail: "library@techuniv.edu",
    website: "https://library.techuniv.edu",
    departments: ["University Library System", "Archives & Rare Manuscripts", "Digital Commons Repository"],
    facilities: [
      "24/7 Air-Conditioned Silent Reading Commons",
      "RFID Automated Self-Checkout Desks",
      "Soundproof Group Study Rooms (Reservable)",
      "High-speed e-Catalogue Terminals",
      "Special Braille & Screen-Reader Stations",
      "Cafe Bar & Terrace Garden",
      "Thesis Archival Vault"
    ],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: true,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: true,
      rampAccess: true,
    },
    floors: [
      {
        level: 0,
        name: "Ground Floor",
        rooms: [
          { roomNumber: "LIB-G01", name: "Circulation & Book Issue Counter", type: "Administrative" },
          { roomNumber: "LIB-G02", name: "24-Hour Express Reading Pods", type: "Study Zone" },
          { roomNumber: "LIB-G05", name: "New Arrivals & Periodicals Display", type: "Study Zone" }
        ]
      },
      {
        level: 1,
        name: "First Floor - Engineering & Sciences",
        rooms: [
          { roomNumber: "LIB-101", name: "Computer Science & Electrical Reference Stacks", type: "Study Zone" },
          { roomNumber: "LIB-108", name: "Digital Media Sandbox & Audio/Visual Pods", type: "Lab" }
        ]
      },
      {
        level: 2,
        name: "Second Floor - Research Scholars & Silent Zone",
        rooms: [
          { roomNumber: "LIB-201", name: "Absolute Silence Thesis Wing", type: "Study Zone" },
          { roomNumber: "LIB-205", name: "Faculty Research Carrels 1-12", type: "Faculty Office" }
        ]
      }
    ],
    emergencyInfo: {
      nearestAED: "Ground Floor Information Desk",
      nearestExit: "South Glass Staircase & Rear Fire Escape",
      assemblyPoint: "Central Quadrangle Lawn",
      emergencyHotline: "+91 (044) 2741-9999"
    },
    virtualTour: {
      enabled: true,
      title: "Central Library Grand Reading Atrium 360°",
      sceneImage: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=80",
      description: "Experience the monumental curved reading floor, natural daylight canopy, and digital checkout pods.",
      spots: [
        { id: "l1", title: "Information & Helpdesk", pitch: 0, yaw: 10, info: "Student ID card activation & book reservations." },
        { id: "l2", title: "Acoustic Pods", pitch: -4, yaw: 120, info: "Collaborative study rooms equipped with 4K interactive whiteboards." }
      ]
    }
  },
  {
    id: "admin-building-01",
    name: "Vice-Chancellor Administrative Secretariat",
    category: "Administration",
    buildingCode: "ADM-01",
    latitude: 12.8218,
    longitude: 80.0430,
    description: "The administrative governance nucleus of the university. Houses Chancellor suite, Registrar office, Controller of Examinations, Student Accounts, and Admissions Counseling.",
    address: "Chancellor Gate Square",
    image: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80",
    openingHours: "9:00 AM – 5:30 PM (Mon-Fri)",
    isOpenNow: true,
    contactPhone: "+91 (044) 2741-7001",
    contactEmail: "registrar@techuniv.edu",
    departments: ["Office of the Vice-Chancellor", "Office of the Registrar", "Controller of Examinations", "Finance & Accounts", "Student Welfare"],
    facilities: ["Visitor Reception Lounge", "Official University Boardroom", "Single-Window Student Service Counters", "Fee Payment Windows"],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: true,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: true,
      rampAccess: true,
    }
  },
  {
    id: "hostel-men-01",
    name: "Kaveri Men's Residence Hall",
    category: "Hostels / Residence Halls",
    buildingCode: "HST-M01",
    latitude: 12.8268,
    longitude: 80.0485,
    description: "Premium undergraduate men's residential community with attached mess, gymnasium, recreation lounge, high-speed fiber internet, and 24/7 security.",
    address: "North Residential Sector, Lakeview Path",
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80",
    openingHours: "Residents: 24/7 | Visitor Hours: 4:00 PM – 7:00 PM",
    isOpenNow: true,
    contactPhone: "+91 (044) 2741-7301",
    contactEmail: "hostel.kaveri@techuniv.edu",
    facilities: [
      "Furnished Single & Double AC/Non-AC Rooms",
      "Hygienic Dining Mess (North & South Indian)",
      "High-speed Wi-Fi 6 Coverage",
      "Badminton Court & Table Tennis",
      "Laundromat with Automatic Washers",
      "Biometric Turnstile Entry Gate"
    ],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: true,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: true,
      rampAccess: true,
    },
    hostelDetails: {
      gender: "Men",
      residenceType: "Undergraduate",
      capacity: 850,
      wardenName: "Dr. K. Seshadri (Assoc. Prof)",
      wardenContact: "+91 98401 23456",
      messType: "Veg & Non-Veg Multi-cuisine Mess",
      curfew: "10:00 PM (Biometric In-time)"
    }
  },
  {
    id: "hostel-women-01",
    name: "Ganga Women's Residence Hall",
    category: "Hostels / Residence Halls",
    buildingCode: "HST-W01",
    latitude: 12.8262,
    longitude: 80.0400,
    description: "Modern, secure multi-story residential enclave for women students with indoor sports, boutique juice bar, study reading room, and medical nurse station.",
    address: "West Residential Enclave, Garden Way",
    image: "https://images.unsplash.com/photo-1595846519845-68e298c2edd8?auto=format&fit=crop&w=1200&q=80",
    openingHours: "Residents: 24/7 | Visitor Hours: 4:00 PM – 7:00 PM",
    isOpenNow: true,
    contactPhone: "+91 (044) 2741-7310",
    contactEmail: "hostel.ganga@techuniv.edu",
    facilities: [
      "Spacious Single & Twin Sharing Suites",
      "Dedicated On-site Dining Hall",
      "Resident Lady Doctor & 24/7 Nurse",
      "Fitness & Yoga Studio",
      "Study Library with Solar Back-up",
      "CCTV Surveillance & Female Security Guard Patrol"
    ],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: true,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: true,
      rampAccess: true,
    },
    hostelDetails: {
      gender: "Women",
      residenceType: "Undergraduate",
      capacity: 920,
      wardenName: "Dr. Malathi Sundaram (Prof)",
      wardenContact: "+91 98402 34567",
      messType: "Organic Vegetarian & Balanced Non-Veg",
      curfew: "9:30 PM (Biometric In-time)"
    }
  },
  {
    id: "hostel-intl-01",
    name: "Nilgiri International Scholars & PG Residence",
    category: "Hostels / Residence Halls",
    buildingCode: "HST-INT01",
    latitude: 12.8275,
    longitude: 80.0440,
    description: "Studio apartments and suites for international exchange students, master's candidates, and PhD research fellows.",
    address: "Global Village Road, North Ridge",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
    openingHours: "24 Hours Accessible",
    isOpenNow: true,
    contactPhone: "+91 (044) 2741-7350",
    contactEmail: "intl.housing@techuniv.edu",
    facilities: ["Self-cooking Kitchenettes", "Continental & Pan-Asian Buffet", "Single Studio Bedrooms", "Quiet Study Terrace"],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: true,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: true,
      rampAccess: true,
    },
    hostelDetails: {
      gender: "Co-ed",
      residenceType: "International",
      capacity: 320,
      wardenName: "Prof. Arthur Vance",
      wardenContact: "+91 98403 45678",
      messType: "Multi-Continental Global Cuisine",
      curfew: "No Curfew (Authorized Digital Keycard)"
    }
  },
  {
    id: "dining-food-court-01",
    name: "Central Student Food Court & Plaza",
    category: "Dining & Cafeteria",
    buildingCode: "FC-01",
    latitude: 12.8238,
    longitude: 80.0452,
    description: "Vibrant two-story campus culinary hub seating 1,200 diners with diverse branded counters, healthy salad bars, bakery, and open-air patio seating.",
    address: "Central Campus Mall Plaza",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    openingHours: "7:00 AM – 11:30 PM (Daily)",
    isOpenNow: true,
    contactPhone: "+91 (044) 2741-7400",
    contactEmail: "foodcourt@techuniv.edu",
    facilities: [
      "12 Multi-Cuisine Food Counters",
      "Subway, Pizza Corner & Dosa Hub",
      "Air-Conditioned Indoor Hall",
      "Open Pergola Garden Seating",
      "Digital Order Kiosks & UPI QR Payments",
      "Hand Sanitization Stations"
    ],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: true,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: true,
      rampAccess: true,
    }
  },
  {
    id: "cafe-bistro-01",
    name: "Silicon Roast Artisan Cafe & Bakery",
    category: "Cafes",
    buildingCode: "CF-01",
    latitude: 12.8245,
    longitude: 80.0442,
    description: "Popular cozy coffee lounge serving freshly roasted espresso, artisanal pastries, cold brews, and study snacks.",
    address: "Boulevard Lane, Near Knowledge Hub",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
    openingHours: "8:00 AM – 10:00 PM (Daily)",
    isOpenNow: true,
    contactPhone: "+91 98404 55112",
    facilities: ["Specialty Pour-over Coffee", "Laptop Charging Sockets at Every Table", "Outdoor Wooden Benches", "Free Wi-Fi"],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: false,
      brailleSignage: false,
      accessibleRestrooms: true,
      accessibleParking: false,
      rampAccess: true,
    }
  },
  {
    id: "sports-complex-01",
    name: "Major Dhyan Chand Olympic Sports Arena & Stadium",
    category: "Sports & Recreation",
    buildingCode: "SC-01",
    latitude: 12.8210,
    longitude: 80.0475,
    description: "State-of-the-art sports complex featuring a 400m synthetic running track, full floodlit football turf, Olympic 50m swimming pool, indoor wooden badminton courts, and squash arenas.",
    address: "East Sports Enclave",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
    openingHours: "5:30 AM – 9:30 AM & 4:30 PM – 9:00 PM",
    isOpenNow: false,
    contactPhone: "+91 (044) 2741-7500",
    contactEmail: "sports@techuniv.edu",
    facilities: [
      "8-Lane All-Weather Synthetic Athletic Track",
      "FIFA-Standard Natural Grass Football Stadium (5,000 Capacity)",
      "Olympic 50-meter Heated Swimming Pool",
      "Indoor Wooden Flooring Basketball & Badminton Courts",
      "Strength Training Gym with Certified Coaches",
      "Player Locker Rooms & Sauna"
    ],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: true,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: true,
      rampAccess: true,
    }
  },
  {
    id: "health-center-01",
    name: "University Health Centre & 24/7 Emergency Triage",
    category: "Health & Medical",
    buildingCode: "HC-01",
    latitude: 12.8228,
    longitude: 80.0415,
    description: "Round-the-clock medical clinic staffed by resident physicians, pediatricians, certified nurses, digital X-ray, observation beds, and emergency ALS ambulance service.",
    address: "Hospital Lane, West Gate Approach",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80",
    openingHours: "24 Hours / 7 Days a Week (Emergency)",
    isOpenNow: true,
    contactPhone: "+91 (044) 2741-7911",
    contactEmail: "healthcentre@techuniv.edu",
    departments: ["General Outpatient (OPD)", "Emergency Trauma Care", "Pharmacy & Diagnostics", "Mental Health & Counseling"],
    facilities: [
      "24/7 Emergency Ambulance on Standby",
      "Fully Stocked Subsidized Campus Pharmacy",
      "10-Bed Observation & Daycare Ward",
      "Digital Pathology & Blood Testing Unit",
      "Free Student Medical Consultation",
      "Automated External Defibrillator (AED)"
    ],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: true,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: true,
      rampAccess: true,
    },
    emergencyInfo: {
      nearestAED: "Front Triage Desk (Emergency Entrance)",
      nearestExit: "Main Sliding Automatic Ambulatory Exit",
      assemblyPoint: "West Lawn Clear Zone",
      emergencyHotline: "+91 (044) 2741-7911"
    }
  },
  {
    id: "comp-lab-01",
    name: "Alan Turing High Performance Computing & AI Center",
    category: "Computer Labs",
    buildingCode: "CS-04",
    latitude: 12.8240,
    longitude: 80.0420,
    description: "Specialized computing hub housing 400 advanced graphics workstations, NVIDIA DGX Supercomputing Cluster access, and AR/VR development labs.",
    address: "Tech Quad West",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    openingHours: "8:00 AM – 10:00 PM (Scholars 24/7)",
    isOpenNow: true,
    contactPhone: "+91 (044) 2741-7155",
    contactEmail: "computing@techuniv.edu",
    facilities: [
      "NVIDIA RTX 4090 Workstation Pods",
      "Meta Quest 3 & Apple Vision Pro VR Testing Arena",
      "High-speed Gigabit Fiber to each terminal",
      "Dual Redundant UPS & Precision Climate Control"
    ],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: true,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: true,
      rampAccess: true,
    }
  },
  {
    id: "lab-robotics-01",
    name: "Center for Robotics, Mechatronics & Autonomous Systems",
    category: "Laboratories",
    buildingCode: "ROB-01",
    latitude: 12.8250,
    longitude: 80.0410,
    description: "Cutting-edge robotics facility with test arenas for quadruped robots, drone flight cages, industrial robotic arms, and rapid 3D printing farm.",
    address: "Innovation Alley, North-West Campus",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
    openingHours: "8:30 AM – 7:30 PM",
    isOpenNow: true,
    contactPhone: "+91 (044) 2741-7188",
    facilities: ["Drone Testing Enclosure", "KUKA 6-Axis Industrial Robots", "UltiMaker 3D Printing Lab", "Laser Cutting Studio"],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: true,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: true,
      rampAccess: true,
    }
  },
  {
    id: "transit-terminal-01",
    name: "Main Campus Transit Terminal & Bus Depot",
    category: "Transportation",
    buildingCode: "TR-01",
    latitude: 12.8202,
    longitude: 80.0440,
    description: "Central multimodal interchange connecting city express buses, metro feeder shuttles, intra-campus electric buggies, and smart rental cycles.",
    address: "Main Campus South Boulevard Gate",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
    openingHours: "5:00 AM – Midnight (Daily)",
    isOpenNow: true,
    contactPhone: "+91 (044) 2741-7600",
    facilities: [
      "Electric Campus Buggy Charging Terminal",
      "City Bus Line Departure Bays 1 to 8",
      "Smart App Bicycle Rental Dock (200 Cycles)",
      "Sheltered Passenger Waiting Lounge with Real-Time Display",
      "Prepaid Taxi & Auto Stand"
    ],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: false,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: true,
      rampAccess: true,
    }
  },
  {
    id: "parking-visitor-01",
    name: "North Campus Visitor & Faculty Parking",
    category: "Parking",
    buildingCode: "PKG-N01",
    latitude: 12.8270,
    longitude: 80.0465,
    description: "Covered solar-canopy parking facility with 400 car spaces, 600 two-wheeler slots, and 24 high-power DC EV charging plugs.",
    address: "North Gate Ring Road",
    image: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80",
    openingHours: "Open 24 Hours",
    isOpenNow: true,
    facilities: ["Solar Canopy Roof", "Fast EV Charging Stations (Type-2 & CCS2)", "Automated Fastag Boom Barriers", "Security Patrol & Cameras"],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: false,
      brailleSignage: false,
      accessibleRestrooms: true,
      accessibleParking: true,
      rampAccess: true,
    }
  },
  {
    id: "parking-student-02",
    name: "South Student Two-Wheeler & Car Park",
    category: "Parking",
    buildingCode: "PKG-S02",
    latitude: 12.8208,
    longitude: 80.0425,
    description: "Dedicated parking zone for day-scholar students and campus commuters near South Gate.",
    address: "South Gate Entry, Service Road",
    image: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80",
    openingHours: "6:00 AM – 10:30 PM",
    isOpenNow: true,
    facilities: ["Covered Two-Wheeler Sheds", "Helmet Storage Lockers", "Tyre Air Pressure Kiosk"],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: false,
      brailleSignage: false,
      accessibleRestrooms: false,
      accessibleParking: true,
      rampAccess: true,
    }
  },
  {
    id: "emergency-security-01",
    name: "Campus Security Command & Emergency Operations",
    category: "Emergency Services",
    buildingCode: "SEC-01",
    latitude: 12.8212,
    longitude: 80.0438,
    description: "24/7 central security monitoring headquarters handling CCTV feed analysis, campus emergency hotline, lost & found, and emergency rapid response team dispatch.",
    address: "South Main Gate complex",
    image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=1200&q=80",
    openingHours: "24 Hours / 365 Days",
    isOpenNow: true,
    contactPhone: "+91 (044) 2741-9999",
    contactEmail: "security.chief@techuniv.edu",
    facilities: [
      "24/7 Emergency Dispatch Desk",
      "University CCTV Surveillance Wall",
      "Lost and Found Property Registry",
      "Visitor Gate Pass Authorization Desk",
      "Rapid Response Motorcycle Patrol Unit"
    ],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: false,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: true,
      rampAccess: true,
    },
    emergencyInfo: {
      nearestAED: "Main Desk Counter",
      nearestExit: "Direct South Gate Exits",
      assemblyPoint: "Main Gate Parade Plaza",
      emergencyHotline: "+91 (044) 2741-9999"
    }
  },
  {
    id: "emergency-assembly-01",
    name: "Primary Campus Emergency Assembly Area Alpha",
    category: "Emergency Services",
    buildingCode: "ASM-01",
    latitude: 12.8234,
    longitude: 80.0441,
    description: "Designated open-air safety muster point in event of fire, earthquake, or campus evacuation with emergency first-aid kit and loudspeaker system.",
    address: "Central Quadrangle Green Field",
    image: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80",
    openingHours: "Always Open 24/7",
    isOpenNow: true,
    facilities: ["High-decibel Public Address Siren", "Emergency Solar Floodlights", "First-Aid Cache Pod", "Clear Helicopter Evacuation Landing Zone"],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: false,
      brailleSignage: true,
      accessibleRestrooms: false,
      accessibleParking: false,
      rampAccess: true,
    }
  },
  {
    id: "open-space-amphi-01",
    name: "University Open-Air Amphitheatre & Cultural Arena",
    category: "Open Spaces",
    buildingCode: "OAA-01",
    latitude: 12.8222,
    longitude: 80.0462,
    description: "Greek-style tiered stone amphitheater seating 2,000 spectators for annual cultural fests, theatre plays, musical concerts, and evening gatherings.",
    address: "East Lake Garden, Campus Walk",
    image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80",
    openingHours: "Open Daily 6:00 AM – 10:00 PM",
    isOpenNow: true,
    facilities: ["2,000 Tiered Stone Seats", "Stage Acoustic Shell", "Ambient Night LED Uplighting", "Surrounding Tree Canopy"],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: false,
      brailleSignage: false,
      accessibleRestrooms: true,
      accessibleParking: false,
      rampAccess: true,
    }
  },
  {
    id: "open-space-green-02",
    name: "Central Quadrangle & Eco Botanical Lawn",
    category: "Open Spaces",
    buildingCode: "GRN-01",
    latitude: 12.8233,
    longitude: 80.0438,
    description: "Lush green heritage lawn with manicured gardens, shady rain trees, solar benches, and outdoor chess tables.",
    address: "Heart of University Campus",
    image: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80",
    openingHours: "Open Daily 5:00 AM – 10:00 PM",
    isOpenNow: true,
    facilities: ["Solar Powered Device Charging Benches", "High-speed Wi-Fi Zone", "Sculptural Water Fountain"],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: false,
      brailleSignage: false,
      accessibleRestrooms: false,
      accessibleParking: false,
      rampAccess: true,
    }
  },
  {
    id: "shop-bookstore-01",
    name: "University Bookstore, Merchandise & Stationery Hub",
    category: "Shops",
    buildingCode: "SHP-01",
    latitude: 12.8241,
    longitude: 80.0449,
    description: "Official university merchandise store providing textbooks, lab coats, drawing instruments, university hoodies, laptops, and print services.",
    address: "Central Mall Ground Level",
    image: "https://images.unsplash.com/photo-1526721940322-10fb6e3ae94a?auto=format&fit=crop&w=1200&q=80",
    openingHours: "8:30 AM – 8:00 PM (Mon-Sat)",
    isOpenNow: true,
    contactPhone: "+91 (044) 2741-7820",
    facilities: ["Prescribed Course Textbooks", "High-Speed Colour Printing & Spiral Binding", "Official University Hoodies & Merchandise", "Student Discounts"],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: false,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: false,
      rampAccess: true,
    }
  },
  {
    id: "atm-bank-01",
    name: "State Bank of India & 24/7 ATM Kiosk Center",
    category: "ATMs",
    buildingCode: "BNK-01",
    latitude: 12.8220,
    longitude: 80.0428,
    description: "Full-service national bank branch providing education loan counseling, fee deposit windows, cash deposit machine, and three 24/7 ATMs.",
    address: "Admin Square East Wing",
    image: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=1200&q=80",
    openingHours: "Branch: 9:30 AM – 4:00 PM | ATMs: 24/7",
    isOpenNow: true,
    contactPhone: "+91 (044) 2741-7890",
    facilities: ["3 Automated Cash Withdrawal ATMs", "1 Instant Cash Deposit Machine (CDM)", "Passbook Self-Printing Kiosk", "Forex Card & Student Loan Desk"],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: false,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: true,
      rampAccess: true,
    }
  },
  {
    id: "restrooms-central-01",
    name: "Central Promenade Accessible Restrooms",
    category: "Restrooms",
    buildingCode: "WC-01",
    latitude: 12.8236,
    longitude: 80.0447,
    description: "Clean, barrier-free, touchless accessible sanitary facilities equipped with baby care stations, sanitary pad dispensers, and wheelchair assist rails.",
    address: "Between Library & Food Court",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
    openingHours: "Open 24 Hours",
    isOpenNow: true,
    facilities: ["Wheelchair Roll-in Cubicles", "Baby Diaper Changing Station", "Automatic Sensor Taps & Soap Dispensers", "Emergency Pull-Cord Alarm"],
    accessibility: {
      wheelchairAccessible: true,
      elevatorAvailable: false,
      brailleSignage: true,
      accessibleRestrooms: true,
      accessibleParking: false,
      rampAccess: true,
    }
  }
];

export const SHUTTLE_ROUTES: ShuttleRoute[] = [
  {
    id: "blue-express",
    name: "Blue Line: North-South Campus Express",
    color: "#2563EB",
    activeHours: "6:30 AM – 10:30 PM",
    frequency: "Every 8 mins",
    nextArrivalMinutes: 3,
    path: [
      [12.8202, 80.0440], // Transit Terminal
      [12.8218, 80.0430], // Admin
      [12.8235, 80.0435], // Main Academic
      [12.8248, 80.0430], // Tech Quad
      [12.8265, 80.0440], // North Hostels
      [12.8275, 80.0465]  // North Parking
    ],
    stops: [
      {
        id: "stop-s1",
        name: "Main Transit Terminal",
        latitude: 12.8202,
        longitude: 80.0440,
        routes: ["Blue Line", "Green Line"],
        operatingHours: "6:30 AM – 10:30 PM",
        nextArrival: "In 3 mins"
      },
      {
        id: "stop-s2",
        name: "Administration & Bank Stop",
        latitude: 12.8218,
        longitude: 80.0430,
        routes: ["Blue Line"],
        operatingHours: "6:30 AM – 10:30 PM",
        nextArrival: "In 5 mins"
      },
      {
        id: "stop-s3",
        name: "Academic Block & Library Junction",
        latitude: 12.8235,
        longitude: 80.0435,
        routes: ["Blue Line", "Green Line"],
        operatingHours: "6:30 AM – 10:30 PM",
        nextArrival: "In 8 mins"
      },
      {
        id: "stop-s4",
        name: "North Hostel Enclave Stop",
        latitude: 12.8265,
        longitude: 80.0440,
        routes: ["Blue Line", "Green Line"],
        operatingHours: "6:30 AM – 10:30 PM",
        nextArrival: "In 11 mins"
      }
    ]
  },
  {
    id: "green-loop",
    name: "Green Line: Sports & Residence Ring",
    color: "#16A34A",
    activeHours: "6:00 AM – 11:00 PM",
    frequency: "Every 12 mins",
    nextArrivalMinutes: 6,
    path: [
      [12.8202, 80.0440], // Transit
      [12.8210, 80.0475], // Sports Stadium
      [12.8225, 80.0470], // Amphitheatre
      [12.8238, 80.0452], // Food Court
      [12.8268, 80.0485], // Men's Residence
      [12.8275, 80.0440], // Intl Residence
      [12.8262, 80.0400], // Women's Residence
      [12.8228, 80.0415], // Health Centre
      [12.8202, 80.0440]  // Back to Transit
    ],
    stops: [
      {
        id: "stop-g1",
        name: "Olympic Sports Complex Gate",
        latitude: 12.8210,
        longitude: 80.0475,
        routes: ["Green Line"],
        operatingHours: "6:00 AM – 11:00 PM",
        nextArrival: "In 6 mins"
      },
      {
        id: "stop-g2",
        name: "Central Food Court East",
        latitude: 12.8238,
        longitude: 80.0452,
        routes: ["Green Line"],
        operatingHours: "6:00 AM – 11:00 PM",
        nextArrival: "In 9 mins"
      },
      {
        id: "stop-g3",
        name: "Kaveri Men's Residence Gate",
        latitude: 12.8268,
        longitude: 80.0485,
        routes: ["Green Line"],
        operatingHours: "6:00 AM – 11:00 PM",
        nextArrival: "In 12 mins"
      },
      {
        id: "stop-g4",
        name: "Ganga Women's Residence Circle",
        latitude: 12.8262,
        longitude: 80.0400,
        routes: ["Green Line"],
        operatingHours: "6:00 AM – 11:00 PM",
        nextArrival: "In 16 mins"
      },
      {
        id: "stop-g5",
        name: "Campus Health Centre",
        latitude: 12.8228,
        longitude: 80.0415,
        routes: ["Green Line"],
        operatingHours: "6:00 AM – 11:00 PM",
        nextArrival: "In 18 mins"
      }
    ]
  }
];

// Helper to calculate realistic walking/driving distance and path between two coordinates
export function calculateCampusRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  travelMode: "walking" | "driving" = "walking"
): {
  distanceMeters: number;
  durationMinutes: number;
  path: [number, number][];
  steps: { instruction: string; distance: string; icon: string }[];
} {
  // Direct Euclidean approximation in meters for small lat/long deltas
  const dLat = (toLat - fromLat) * 111320;
  const dLng = (toLng - fromLng) * 111320 * Math.cos(((fromLat + toLat) / 2) * (Math.PI / 180));
  const euclidean = Math.sqrt(dLat * dLat + dLng * dLng);

  // Road/path winding factor (walking paths on campus are ~1.2x straight line)
  const windingFactor = travelMode === "walking" ? 1.25 : 1.4;
  const distanceMeters = Math.max(30, Math.round(euclidean * windingFactor));

  // Walking pace ~ 4.8 km/h = 80 m/min. Driving on campus ~ 20 km/h = 333 m/min
  const speedMetersPerMin = travelMode === "walking" ? 80 : 330;
  const durationMinutes = Math.max(1, Math.round(distanceMeters / speedMetersPerMin));

  // Generate realistic intermediate pedestrian waypoints
  const midLat = (fromLat + toLat) / 2;
  const midLng = (fromLng + toLng) / 2;

  // Jitter slightly to simulate pedestrian avenues and walkway turns
  const waypoint1: [number, number] = [
    fromLat + (midLat - fromLat) * 0.5 + (toLng - fromLng) * 0.05,
    fromLng + (midLng - fromLng) * 0.5 - (toLat - fromLat) * 0.05,
  ];
  const waypoint2: [number, number] = [
    midLat,
    midLng,
  ];
  const waypoint3: [number, number] = [
    midLat + (toLat - midLat) * 0.5 - (toLng - fromLng) * 0.04,
    midLng + (toLng - midLng) * 0.5 + (toLat - fromLat) * 0.04,
  ];

  const path: [number, number][] = [
    [fromLat, fromLng],
    waypoint1,
    waypoint2,
    waypoint3,
    [toLat, toLng]
  ];

  const steps = [
    {
      instruction: `Head out towards the pedestrian pathway towards your destination`,
      distance: `${Math.round(distanceMeters * 0.25)} m`,
      icon: "compass"
    },
    {
      instruction: travelMode === "walking" 
        ? `Continue along the tree-lined Central Campus Walkway past the quadrangle` 
        : `Drive along the designated Campus Ring Road (Speed limit: 20 km/h)`,
      distance: `${Math.round(distanceMeters * 0.5)} m`,
      icon: "arrow-up"
    },
    {
      instruction: `Turn toward the entrance plaza and approach the main entrance`,
      distance: `${Math.round(distanceMeters * 0.25)} m`,
      icon: "map-pin"
    },
    {
      instruction: `Arrive at your campus destination`,
      distance: `0 m`,
      icon: "check-circle"
    }
  ];

  return {
    distanceMeters,
    durationMinutes,
    path,
    steps
  };
}
