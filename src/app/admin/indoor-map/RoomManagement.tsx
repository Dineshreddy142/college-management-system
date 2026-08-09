import { useState } from "react";
import { Card, Btn, Badge } from "../../App";
import { Plus, Edit2, Trash2, Search } from "lucide-react";

export default function RoomManagement() {
  const [rooms, setRooms] = useState([
    { id: 1, floor: "Ground Floor", number: "G-01", name: "CS First Year", type: "Classroom", dept: "Computer Science" },
    { id: 2, floor: "Ground Floor", number: "LAB-1", name: "Programming Lab", type: "Computer Lab", dept: "Computer Science" },
    { id: 3, floor: "First Floor", number: "1-01", name: "HOD Office", type: "Office", dept: "Computer Science" },
    { id: 4, floor: "First Floor", number: "1-02", name: "Library", type: "Library", dept: "Common" },
  ]);

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Room Management</h2>
          <p className="text-sm text-slate-500">Edit metadata, capacity, and allocations for rooms.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search rooms..." className="pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-64" />
          </div>
          <Btn icon={<Plus size={16} />}>Add Room</Btn>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 rounded-l-xl">Room No.</th>
              <th className="px-4 py-3">Room Name</th>
              <th className="px-4 py-3">Floor</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3 text-right rounded-r-xl">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                <td className="px-4 py-4 font-medium">{room.number}</td>
                <td className="px-4 py-4">{room.name}</td>
                <td className="px-4 py-4 text-slate-500">{room.floor}</td>
                <td className="px-4 py-4"><Badge variant="indigo">{room.type}</Badge></td>
                <td className="px-4 py-4">{room.dept}</td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="Edit"><Edit2 size={16} /></button>
                    <button className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
