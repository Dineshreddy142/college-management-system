import { useState } from "react";
import { Card, Btn, Badge } from "../../App";
import { Plus, Edit2, Trash2, Copy } from "lucide-react";

export default function FloorManagement() {
  const [floors, setFloors] = useState([
    { id: 1, name: "Ground Floor", level: 0, status: "Published" },
    { id: 2, name: "First Floor", level: 1, status: "Draft" },
    { id: 3, name: "Second Floor", level: 2, status: "Draft" },
    { id: 4, name: "Third Floor", level: 3, status: "Published" },
  ]);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Floor Management</h2>
          <p className="text-sm text-slate-500">Manage all floors in the current block.</p>
        </div>
        <Btn icon={<Plus size={16} />}>Add Floor</Btn>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 rounded-l-xl">Level</th>
              <th className="px-4 py-3">Floor Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right rounded-r-xl">Actions</th>
            </tr>
          </thead>
          <tbody>
            {floors.map((floor) => (
              <tr key={floor.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                <td className="px-4 py-4 font-medium">{floor.level}</td>
                <td className="px-4 py-4">{floor.name}</td>
                <td className="px-4 py-4">
                  <Badge variant={floor.status === "Published" ? "success" : "warning"}>{floor.status}</Badge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="Edit"><Edit2 size={16} /></button>
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="Duplicate"><Copy size={16} /></button>
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
