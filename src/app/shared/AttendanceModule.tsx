import React from "react";
import { Download, Calendar as CalendarIcon } from "lucide-react";
import { Card, Badge, Btn, PBar } from "../App";

export function AttendanceModule() {
  const subjects = [
    { sub: "Data Structures", code: "CS301", attended: 35, total: 38, pct: 92.1 },
    { sub: "Mathematics III", code: "MA301", attended: 38, total: 43, pct: 88.3 },
    { sub: "Digital Circuits", code: "EC301", attended: 32, total: 38, pct: 84.2 },
    { sub: "Eng. Physics", code: "PH301", attended: 27, total: 34, pct: 79.4 },
    { sub: "OS Lab", code: "CS302", attended: 12, total: 12, pct: 100 },
  ];

  return (
    <div className="space-y-5 relative">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Attendance Analytics</h2>
          <p className="text-sm text-slate-500">Track your subject-wise and overall attendance.</p>
        </div>
        <div className="flex gap-3">
          <Btn variant="outline" icon={<Download size={14} />}>Download Report</Btn>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-6 lg:col-span-1 flex flex-col justify-center items-center text-center space-y-4">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-blue-500" strokeWidth="3" strokeDasharray="88.4, 100" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">88.4%</span>
              <span className="text-xs text-slate-500">Overall</span>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Good Standing</h3>
            <p className="text-sm text-slate-500 max-w-[200px] mx-auto mt-1">You are well above the 75% minimum requirement.</p>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Subject-wise Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Attended/Total</th>
                  <th className="px-4 py-3 font-medium w-48">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subjects.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{s.sub}</p>
                      <p className="text-xs text-slate-400">{s.code}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.attended} / {s.total}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium w-8">{s.pct}%</span>
                        <div className="w-full"><PBar value={s.pct} color={s.pct >= 85 ? "green" : s.pct >= 75 ? "blue" : "red"} /></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
