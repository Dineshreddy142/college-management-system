import React, { useState, useEffect } from 'react';
import {
  DoorOpen, Search, RefreshCw, Filter, Building2, Layers, CheckCircle, AlertCircle, Edit2, Shield
} from 'lucide-react';
import { blockService, BuildingRecord, FloorRecord, FloorObjectRecord } from '../../../api/blockService';

export const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadBuildings();
    loadRooms();
  }, [buildingFilter, typeFilter, deptFilter, statusFilter]);

  const loadBuildings = async () => {
    try {
      const data = await blockService.getBuildings();
      setBuildings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await blockService.getRoomsInventory({
        buildingId: buildingFilter,
        type: typeFilter,
        department: deptFilter,
        status: statusFilter,
        search: searchQuery
      });
      setRooms(data);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load rooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl font-bold text-xs flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <DoorOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Room & Space Inventory</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">View and audit all classrooms, laboratories, faculty offices, and special spaces across buildings</p>
          </div>
        </div>

        <button
          onClick={loadRooms}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors self-start sm:self-auto"
          title="Refresh Room List"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="sm:col-span-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search room name or room number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadRooms()}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-2">
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Buildings</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Room Types</option>
            <option value="CLASSROOM">Classroom</option>
            <option value="LAB">Laboratory</option>
            <option value="FACULTY_ROOM">Faculty Room</option>
            <option value="HOD_ROOM">HOD Room</option>
            <option value="OFFICE">Office</option>
            <option value="AUDITORIUM">Auditorium</option>
            <option value="SEMINAR_HALL">Seminar Hall</option>
            <option value="WASHROOM">Washroom</option>
            <option value="LIBRARY">Library</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Civil">Civil</option>
            <option value="General">General</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Reserved">Reserved</option>
          </select>
        </div>
      </div>

      {/* Room Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="text-xs font-semibold">Loading rooms inventory...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <DoorOpen className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No rooms found matching filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">Room No.</th>
                  <th className="py-3 px-4">Name / Label</th>
                  <th className="py-3 px-4">Building & Level</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rooms.map((r) => {
                  const roomNum = r.properties?.roomNumber || r.label || 'N/A';
                  const roomType = r.properties?.roomType || r.object_type || 'CLASSROOM';
                  const capacity = r.properties?.capacity || 30;
                  const dept = r.properties?.department || 'General';
                  const status = r.properties?.status || 'Available';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">{roomNum}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{r.label || 'Unnamed Room'}</td>
                      <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                        {r.building_name} ({r.floor_name})
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                          {roomType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{dept}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{capacity} Seats</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status === 'Available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-100 text-amber-700'}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default RoomManagement;
