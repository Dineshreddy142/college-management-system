import { useState, useEffect, useCallback } from "react";
import { Home, Users, Building, Plus, Search, ShieldCheck, DoorOpen, Bed, Key, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, Badge, Btn } from "../../App";
import client from "../../../api/client";

interface HostelBlock {
  id: number;
  name: string;
  type: "Boys" | "Girls";
  warden_name: string;
  warden_phone?: string;
  total_rooms: number;
  occupied_beds: number;
  total_beds: number;
}

export function HostelManagement() {
  const [blocks, setBlocks] = useState<HostelBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // New Block form state
  const [blockName, setBlockName] = useState("");
  const [blockType, setBlockType] = useState<"Boys" | "Girls">("Boys");
  const [wardenName, setWardenName] = useState("");
  const [wardenPhone, setWardenPhone] = useState("");
  const [totalRooms, setTotalRooms] = useState(80);
  const [totalBeds, setTotalBeds] = useState(240);

  const fetchHostels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get('/hostels/blocks');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setBlocks(res.data.data);
      }
    } catch (err: any) {
      console.error("Failed to load hostel blocks:", err);
      setErrorMsg("Failed to retrieve hostel blocks from database");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHostels();
  }, [fetchHostels]);

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockName.trim() || !wardenName.trim()) {
      setErrorMsg("Block name and warden name are required");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      const res = await client.post('/hostels/blocks', {
        name: blockName.trim(),
        type: blockType,
        warden_name: wardenName.trim(),
        warden_phone: wardenPhone.trim(),
        total_rooms: Number(totalRooms),
        total_beds: Number(totalBeds)
      });

      if (res.data?.success) {
        setSuccessMsg(`Hostel block "${blockName}" successfully added to university registry!`);
        setShowModal(false);
        setBlockName("");
        setWardenName("");
        setWardenPhone("");
        await fetchHostels();
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to create hostel block");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBlocks = blocks.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (b.warden_name && b.warden_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === "ALL" || b.type.toUpperCase() === selectedType.toUpperCase();
    return matchesSearch && matchesType;
  });

  const totalBedsCount = blocks.reduce((acc, b) => acc + (b.total_beds || 0), 0);
  const occupiedBedsCount = blocks.reduce((acc, b) => acc + (b.occupied_beds || 0), 0);
  const occupancyRate = totalBedsCount > 0 ? ((occupiedBedsCount / totalBedsCount) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#2563EB]">
            <Home size={20} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">Hostel & Accommodation Governance</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage hostel blocks, warden assignments, room allocations, and student occupancy.</p>
          </div>
        </div>
        <Btn variant="primary" icon={<Plus size={14} />} onClick={() => { setErrorMsg(""); setShowModal(true); }}>
          New Hostel Block
        </Btn>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-md text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle size={15} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Hostel Blocks</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{blocks.length}</p>
          </div>
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-[#1E3A5F] dark:text-slate-300 rounded-md">
            <Building size={20} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Bed Capacity</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{totalBedsCount}</p>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] dark:text-blue-400 rounded-md">
            <Bed size={20} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Occupied Beds</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{occupiedBedsCount}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-[#15803D] dark:text-emerald-400 rounded-md">
            <Users size={20} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Campus Occupancy Rate</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{occupancyRate}%</p>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-[#B45309] dark:text-amber-400 rounded-md">
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
      {loading ? (
        <Card className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={18} />
          <span>Loading hostel blocks from database...</span>
        </Card>
      ) : filteredBlocks.length === 0 ? (
        <Card className="p-8 text-center text-slate-400 text-sm">
          No hostel blocks found. Click "New Hostel Block" to register one.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredBlocks.map((b) => {
            const blockRate = b.total_beds > 0 ? ((b.occupied_beds / b.total_beds) * 100).toFixed(0) : "0";
            return (
              <Card key={b.id} className="p-5 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{b.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Warden: {b.warden_name} {b.warden_phone ? `(${b.warden_phone})` : ''}</p>
                  </div>
                  <Badge variant={b.type === "Boys" ? "indigo" : "purple"}>{b.type} Hostel</Badge>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Bed Occupancy:</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {b.occupied_beds} / {b.total_beds} ({blockRate}%)
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
                      <DoorOpen size={14} className="text-slate-400" /> {b.total_rooms} Rooms
                    </span>
                    <span className="flex items-center gap-1">
                      <Key size={14} className="text-slate-400" /> {Math.max(0, b.total_beds - b.occupied_beds)} Vacant Beds
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Hostel Block Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Add Hostel Block</h3>
            <p className="text-xs text-slate-500 mb-4">Register a new residential hall and warden assignment.</p>

            <form onSubmit={handleCreateBlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Block Name</label>
                <input 
                  type="text" 
                  value={blockName} 
                  onChange={(e) => setBlockName(e.target.value)}
                  placeholder="e.g. Block E - Aryabhata Hall"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hostel Category</label>
                <select 
                  value={blockType} 
                  onChange={(e: any) => setBlockType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Boys">Boys Hostel</option>
                  <option value="Girls">Girls Hostel</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Warden Name</label>
                  <input 
                    type="text" 
                    value={wardenName} 
                    onChange={(e) => setWardenName(e.target.value)}
                    placeholder="Prof. / Dr."
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Warden Phone</label>
                  <input 
                    type="text" 
                    value={wardenPhone} 
                    onChange={(e) => setWardenPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Rooms</label>
                  <input 
                    type="number" 
                    value={totalRooms} 
                    onChange={(e) => setTotalRooms(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Bed Capacity</label>
                  <input 
                    type="number" 
                    value={totalBeds} 
                    onChange={(e) => setTotalBeds(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Btn variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Btn>
                <Btn variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Creating Block...' : 'Save Hostel Block'}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
