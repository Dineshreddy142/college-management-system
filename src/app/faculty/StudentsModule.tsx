import { Users, Search, Download } from "lucide-react";
import { Card, Badge, Btn, Avatar } from "../App";

export function StudentsModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Student Management</h2>
          <p className="text-sm text-slate-500">View profiles and progress of assigned students.</p>
        </div>
        <Btn variant="primary" icon={<Download size={14} />}>Export List</Btn>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="p-8 text-center text-slate-400 text-sm">
          No assigned students found.
        </div>
        </div>
      </Card>
    </div>
  );
}
