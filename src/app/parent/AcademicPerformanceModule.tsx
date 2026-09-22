import { Award, Download, TrendingUp } from "lucide-react";
import { Card, Badge, Btn, StatCard } from "../App";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";

export function AcademicPerformanceModule() {
  const currentSemester = "Current Semester";
  const cgpa = 0.0;
  const marks: any[] = [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Academic Performance</h2>
          <p className="text-sm text-slate-500">Track student grades, marks, and CGPA trends.</p>
        </div>
        <Btn variant="outline" icon={<Download size={15} />}>Download Marksheet</Btn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-5">
          <StatCard title="Current CGPA" value={`${cgpa} / 10`} subtitle="Cumulative CGPA" icon={<Award size={19} />} color="blue" />
          
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" /> Performance Trend
            </h3>
            <p className="text-xs text-slate-400 py-8 text-center">No performance trend recorded yet.</p>
          </Card>
        </div>

        <Card className="p-0 overflow-hidden lg:col-span-2 flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Results: {currentSemester}</h3>
            <Badge variant="default">Pending</Badge>
          </div>
          <div className="overflow-x-auto flex-1">
            {marks.length === 0 ? (
              <p className="text-xs text-slate-400 p-8 text-center">No examination results available for this semester.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                    <th className="p-4 font-medium">Subject</th>
                    <th className="p-4 font-medium text-center">Internal (30)</th>
                    <th className="p-4 font-medium text-center">External (70)</th>
                    <th className="p-4 font-medium text-center">Total (100)</th>
                    <th className="p-4 font-medium text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-50 dark:divide-slate-800/50">
                  {marks.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-slate-900 dark:text-slate-200">{m.subject}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{m.code}</p>
                      </td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-400">{m.internal}</td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-400">{m.external}</td>
                      <td className="p-4 text-center font-semibold text-slate-900 dark:text-slate-200">{m.total}</td>
                      <td className="p-4 text-center">
                        <Badge variant={m.grade.includes("A") ? "success" : m.grade.includes("B") ? "info" : "warning"} size="sm">
                          {m.grade}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
