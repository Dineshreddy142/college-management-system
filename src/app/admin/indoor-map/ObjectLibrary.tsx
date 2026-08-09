import { Card, Btn, Badge } from "../../App";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function ObjectLibrary() {
  const objects = [
    { id: 1, name: "Student Desk", type: "Furniture", width: 60, height: 40 },
    { id: 2, name: "Teacher Table", type: "Furniture", width: 120, height: 60 },
    { id: 3, name: "Whiteboard", type: "Equipment", width: 200, height: 5 },
    { id: 4, name: "Projector", type: "Equipment", width: 30, height: 30 },
    { id: 5, name: "Fire Extinguisher", type: "Emergency", width: 20, height: 20 },
  ];

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Object Library</h2>
          <p className="text-sm text-slate-500">Reusable furniture and equipment for the canvas editor.</p>
        </div>
        <Btn icon={<Plus size={16} />}>Add Object</Btn>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {objects.map((obj) => (
          <div key={obj.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col hover:border-indigo-500 transition-colors cursor-pointer group">
            <div className="h-24 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
              {/* Placeholder for SVG icon */}
              <div className="w-12 h-8 bg-slate-300 dark:bg-slate-600 rounded"></div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                 <button className="p-1 bg-white dark:bg-slate-700 rounded shadow-sm text-blue-600"><Edit2 size={12} /></button>
                 <button className="p-1 bg-white dark:bg-slate-700 rounded shadow-sm text-red-600"><Trash2 size={12} /></button>
              </div>
            </div>
            <h4 className="font-semibold text-sm">{obj.name}</h4>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-slate-500">{obj.width}x{obj.height} cm</span>
              <Badge variant="default" size="sm">{obj.type}</Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
