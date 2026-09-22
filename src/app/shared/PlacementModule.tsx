import { Briefcase, Upload, CheckCircle, Clock, Search } from "lucide-react";
import { Card, Badge, Btn, Avatar } from "../App";

export function PlacementModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Placement Cell</h2>
          <p className="text-sm text-slate-500">Apply for campus drives and track your applications.</p>
        </div>
        <Btn variant="primary" icon={<Upload size={14} />}>Update Resume</Btn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">Upcoming Drives</h3>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search companies..." className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-8 text-center text-slate-400 text-sm">
                No active campus placement drives scheduled.
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">My Applications</h3>
            <div className="p-6 text-center text-slate-400 text-sm">
              No placement applications submitted yet.
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Eligibility Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">CGPA</span>
                <span className="text-slate-400 font-medium">N/A</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Active Backlogs</span>
                <span className="text-slate-400 font-medium">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Attendance &gt; 75%</span>
                <span className="text-slate-400 font-medium">N/A</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
