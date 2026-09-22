import { useState } from "react";
import { Download, Search, Filter, BookOpen, Clock, Users } from "lucide-react";
import { Card, StatCard, Badge, Avatar, Btn, PBar } from "../../App";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function WorkloadReport() {
  const [searchTerm, setSearchTerm] = useState("");

  const data: any[] = [];
  const facultyList: any[] = [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Faculty Workload Report</h2>
          <p className="text-sm text-slate-500">Monitor and balance faculty teaching hours across departments.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="outline" size="sm" icon={<Download size={16} />}>Export PDF</Btn>
          <Btn variant="primary" size="sm" icon={<Download size={16} />}>Export Excel</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Avg Weekly Workload" value="0.0 hrs" subtitle="Across all faculty" icon={<Clock size={19} />} color="blue" />
        <StatCard title="Total Subjects Taught" value="0" subtitle="Active this semester" icon={<BookOpen size={19} />} color="indigo" />
        <StatCard title="Overloaded Faculty" value="0" subtitle="Exceeding 18 hrs" icon={<Users size={19} />} color="emerald" />
        <StatCard title="Underutilized Faculty" value="0" subtitle="Below 10 hrs" icon={<Users size={19} />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Workload Distribution (Theory vs Lab)</h3>
          {data.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No workload distribution data available.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="faculty" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.1)" }} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="theory" name="Theory Hours" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="lab" name="Lab Hours" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-0 overflow-hidden lg:col-span-1">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Department Summary</h3>
          </div>
          <div className="p-4 space-y-5 text-xs text-slate-400 text-center py-10">
            No department workload summary calculated.
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-900/20">
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search faculty..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Departments</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {facultyList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No faculty workload records found.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
                <tr>
                  <th className="px-5 py-4">Faculty</th>
                  <th className="px-5 py-4 text-center">Subjects</th>
                  <th className="px-5 py-4 text-center">Sections</th>
                  <th className="px-5 py-4 text-center">Students</th>
                  <th className="px-5 py-4 text-center">Theory Hrs</th>
                  <th className="px-5 py-4 text-center">Lab Hrs</th>
                  <th className="px-5 py-4">Total Load</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {facultyList.map((f) => {
                  const loadPercent = Math.round((f.total / f.limit) * 100);
                  return (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={f.name} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{f.name}</p>
                          <p className="text-xs text-slate-500">{f.dept}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center font-medium text-slate-700 dark:text-slate-300">{f.subjects}</td>
                    <td className="px-5 py-4 text-center font-medium text-slate-700 dark:text-slate-300">{f.sections}</td>
                    <td className="px-5 py-4 text-center font-medium text-slate-700 dark:text-slate-300">{f.students}</td>
                    <td className="px-5 py-4 text-center text-blue-600 dark:text-blue-400 font-medium">{f.theory}</td>
                    <td className="px-5 py-4 text-center text-purple-600 dark:text-purple-400 font-medium">{f.lab}</td>
                    <td className="px-5 py-4">
                      <div className="w-full max-w-[120px]">
                        <div className="flex justify-between text-xs mb-1 font-medium">
                          <span className="text-slate-900 dark:text-white">{f.total} hrs</span>
                          <span className="text-slate-500">Max {f.limit}</span>
                        </div>
                        <PBar value={f.total} max={f.limit} color={loadPercent >= 100 ? 'red' : loadPercent > 85 ? 'amber' : 'emerald'} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={loadPercent >= 100 ? 'error' : loadPercent > 85 ? 'warning' : 'success'} size="sm">
                        {loadPercent >= 100 ? 'Overloaded' : loadPercent > 85 ? 'Optimal' : 'Balanced'}
                      </Badge>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
