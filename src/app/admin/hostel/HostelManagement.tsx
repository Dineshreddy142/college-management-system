import { useState } from "react";
import { Home, Users, Building, Plus, Search, ShieldCheck, DoorOpen, Bed, Key } from "lucide-react";
import { Card, Badge, Btn } from "../../App";

interface HostelBlock {
  id: number;
  name: string;
  type: "Boys" | "Girls";
  warden: string;
  totalRooms: number;
  occupiedBeds: number;
  totalBeds: number;
}

export function HostelManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const [blocks] = useState<HostelBlock[]>([
    { id: 1, name: "Block A - Ramanujan Hall", type: "Boys", warden: "Dr. K. V. Sharma", totalRooms: 80, occupiedBeds: 210, totalBeds: 240 },
    { id: 2, name: "Block B - Visvesvaraya Hall", type: "Boys", warden: "Prof. Rajesh Kumar", totalRooms: 100, occupiedBeds: 285, totalBeds: 300 },
    { id: 3, name: "Block C - Kalpana Chawla Hall", type: "Girls", warden: "Dr. Ananya Roy", totalRooms: 90, occupiedBeds: 250, totalBeds: 270 },
    { id: 4, name: "Block D - Sarojini Naidu Hall", type: "Girls", warden: "Mrs. Meenakshi S.", totalRooms: 75, occupiedBeds: 200, totalBeds: 225 },
  ]);

  const filteredBlocks = blocks.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.warden.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "ALL" || b.type.toUpperCase() === selectedType.toUpperCase();
    return matchesSearch && matchesType;
  });

  const totalBeds = blocks.reduce((acc, b) => acc + b.totalBeds, 0);
  const occupiedBeds = blocks.reduce((acc, b) => acc + b.occupiedBeds, 0);
  const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl border border-purple-900/40">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400">
            <Home size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Hostel & Accommodation Governance</h2>
            <p className="text-xs text-slate-300 mt-0.5">Manage hostel blocks, warden assignments, room allocations, and student occupancy.</p>
          </div>
        </div>
        <Btn variant="primary" icon={<Plus size={14} />}>
          New Hostel Block
        </Btn>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Hostel Blocks</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{blocks.length}</p>
          </div>
          <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
            <Building size={20} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Bed Capacity</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{totalBeds}</p>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <Bed size={20} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Occupied Beds</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{occupiedBeds}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Users size={20} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Occupancy Rate</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{occupancyRate}%</p>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <ShieldCheck size={20} />
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by block name or warden..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Category:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none"
            >
              <option value="ALL">All Hostels</option>
              <option value="BOYS">Boys Hostel</option>
              <option value="GIRLS">Girls Hostel</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Hostel Blocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredBlocks.map((b) => {
          const blockRate = ((b.occupiedBeds / b.totalBeds) * 100).toFixed(0);
          return (
            <Card key={b.id} className="p-5 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{b.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Warden: {b.warden}</p>
                </div>
                <Badge variant={b.type === "Boys" ? "indigo" : "purple"}>{b.type} Hostel</Badge>
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Bed Occupancy:</span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {b.occupiedBeds} / {b.totalBeds} ({blockRate}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      Number(blockRate) > 90 ? "bg-amber-500" : "bg-purple-600"
                    }`}
                    style={{ width: `${blockRate}%` }}
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <DoorOpen size={14} className="text-slate-400" /> {b.totalRooms} Rooms
                  </span>
                  <span className="flex items-center gap-1">
                    <Key size={14} className="text-slate-400" /> {b.totalBeds - b.occupiedBeds} Vacant Beds
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
