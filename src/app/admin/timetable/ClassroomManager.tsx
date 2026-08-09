import { useState } from "react";
import { Plus, Search, Filter, Edit, Trash2 } from "lucide-react";
import { Card, Badge, Btn } from "../../App";

export function ClassroomManager() {
  const [rooms] = useState([
    { id: 1, room_number: "CS-101", building: "Computer Science Block", floor: "Ground Floor", capacity: 60, type: "Lecture Hall", status: "Active" },
    { id: 2, room_number: "CS-Lab1", building: "Computer Science Block", floor: "First Floor", capacity: 30, type: "Computer Lab", status: "Active" },
    { id: 3, room_number: "SH-201", building: "Main Block", floor: "Second Floor", capacity: 120, type: "Seminar Hall", status: "Maintenance" },
    { id: 4, room_number: "ME-102", building: "Mechanical Block", floor: "Ground Floor", capacity: 60, type: "Lecture Hall", status: "Active" },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Classrooms</h2>
          <p className="text-sm text-slate-500">Manage campus infrastructure and room capacities for timetables.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="primary" size="sm" icon={<Plus size={16} />}>Add Room</Btn>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search rooms..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm">
              <option>All Buildings</option>
              <option>Computer Science Block</option>
              <option>Main Block</option>
            </select>
            <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm">
              <option>All Types</option>
              <option>Lecture Hall</option>
              <option>Computer Lab</option>
            </select>
            <Btn variant="outline" size="sm" icon={<Filter size={16} />}>Filter</Btn>
          </div>
        </div>
        
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
            <tr>
              <th className="px-5 py-4">Room Number</th>
              <th className="px-5 py-4">Location</th>
              <th className="px-5 py-4">Room Type</th>
              <th className="px-5 py-4 text-center">Capacity</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rooms.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{r.room_number}</td>
                <td className="px-5 py-4">
                  <div className="font-medium text-slate-900 dark:text-white">{r.building}</div>
                  <div className="text-xs text-slate-500">{r.floor}</div>
                </td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{r.type}</td>
                <td className="px-5 py-4 text-center font-medium">{r.capacity}</td>
                <td className="px-5 py-4">
                  <Badge variant={r.status === 'Active' ? 'success' : 'warning'} size="sm">{r.status}</Badge>
                </td>
                <td className="px-5 py-4 text-right flex justify-end gap-2">
                  <button className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg"><Edit size={16} /></button>
                  <button className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
