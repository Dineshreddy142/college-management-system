import { TrendingUp, BarChart, Activity, Download } from "lucide-react";
import { Card, Btn, PBar } from "../App";

export function AnalyticsModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Performance Analytics</h2>
          <p className="text-sm text-slate-500">Insights into your academic progress and trends.</p>
        </div>
        <Btn variant="outline" icon={<Download size={14} />}>Export Report</Btn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-blue-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">CGPA Trend</h3>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 border-b border-l border-slate-200 dark:border-slate-700 pb-2 pl-2 relative">
            {[8.5, 8.8, 9.0, 8.9, 9.2].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-md relative flex items-end justify-center hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors" style={{ height: `${(val / 10) * 100}%` }}>
                  <div className="w-full bg-blue-500 dark:bg-blue-600 rounded-t-md transition-all duration-500 group-hover:bg-blue-600 dark:group-hover:bg-blue-500" style={{ height: '100%' }}></div>
                  <span className="absolute -top-6 text-xs font-bold text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">{val}</span>
                </div>
                <span className="text-xs text-slate-500">Sem {i + 1}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={18} className="text-emerald-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Attendance Trend</h3>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 border-b border-l border-slate-200 dark:border-slate-700 pb-2 pl-2 relative">
            {[95, 92, 88, 90, 85, 88].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-t-md relative flex items-end justify-center hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors" style={{ height: `${val}%` }}>
                  <div className={`w-full rounded-t-md transition-all duration-500 ${val < 75 ? 'bg-red-500' : 'bg-emerald-500'} group-hover:opacity-80`} style={{ height: '100%' }}></div>
                  <span className="absolute -top-6 text-xs font-bold text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">{val}%</span>
                </div>
                <span className="text-xs text-slate-500">M{i + 1}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart size={18} className="text-purple-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Skill Progress</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Programming</span>
                <span className="text-sm text-slate-500">85%</span>
              </div>
              <PBar value={85} color="blue" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Problem Solving</span>
                <span className="text-sm text-slate-500">92%</span>
              </div>
              <PBar value={92} color="emerald" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Communication</span>
                <span className="text-sm text-slate-500">78%</span>
              </div>
              <PBar value={78} color="amber" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Aptitude</span>
                <span className="text-sm text-slate-500">88%</span>
              </div>
              <PBar value={88} color="purple" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
