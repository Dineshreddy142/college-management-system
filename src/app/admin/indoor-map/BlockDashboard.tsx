import { useState, useEffect } from "react";
import { Card, StatCard, Btn } from "../../App";
import { Building, Layers, Map, Grid } from "lucide-react";
import client from "../../../api/client";

export default function BlockDashboard() {
  const [stats, setStats] = useState({ blocks: 0, floors: 0, rooms: 0 });

  useEffect(() => {
    // In a real app we'd fetch actual stats. Mocking for now.
    setStats({ blocks: 1, floors: 4, rooms: 45 });
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Blocks" value={stats.blocks} icon={<Building size={20} />} color="indigo" />
        <StatCard title="Total Floors" value={stats.floors} icon={<Layers size={20} />} color="blue" />
        <StatCard title="Total Rooms" value={stats.rooms} icon={<Map size={20} />} color="amber" />
        <StatCard title="Mapped Objects" value="150+" icon={<Grid size={20} />} color="green" />
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Active Block: Block A</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">Main academic block housing Computer Science and IT departments.</p>
        
        <h4 className="font-semibold mb-3">Floors Overview</h4>
        <div className="space-y-3">
          {["Ground Floor", "First Floor", "Second Floor", "Third Floor"].map((floor, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                  <Layers size={18} />
                </div>
                <div>
                  <p className="font-medium">{floor}</p>
                  <p className="text-xs text-slate-500">{10 + i * 2} Rooms • 100% Mapped</p>
                </div>
              </div>
              <Btn variant="outline" size="sm">Manage Floor</Btn>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
