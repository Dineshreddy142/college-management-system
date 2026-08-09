import { Award, Download, TrendingUp } from "lucide-react";
import { Card, Badge, Btn, StatCard } from "../App";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";

export function AcademicPerformanceModule() {
  const currentSemester = "Semester 6";
  const cgpa = 9.2;

  const marks = [
    { subject: "Data Structures", code: "CS301", internal: 28, external: 64, total: 92, grade: "A+" },
    { subject: "Mathematics III", code: "MA301", internal: 25, external: 58, total: 83, grade: "A" },
    { subject: "Operating Systems", code: "CS302", internal: 29, external: 59, total: 88, grade: "A" },
    { subject: "Digital Circuits", code: "EC305", internal: 22, external: 52, total: 74, grade: "B+" },
    { subject: "Engineering Physics", code: "PH201", internal: 26, external: 49, total: 75, grade: "B+" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Academic Performance</h2>
          <p className="text-sm text-slate-500">Track Arjun's grades, marks, and CGPA trends.</p>
        </div>
        <Btn variant="outline" icon={<Download size={15} />}>Download Marksheet</Btn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-5">
          <StatCard title="Current CGPA" value={`${cgpa} / 10`} change="Top 5% of class" changeType="up" icon={<Award size={19} />} color="blue" />
          
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" /> Performance Trend
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={[
                { sem: "S1", cgpa: 8.6 }, { sem: "S2", cgpa: 8.9 }, { sem: "S3", cgpa: 9.0 },
                { sem: "S4", cgpa: 9.1 }, { sem: "S5", cgpa: 9.2 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="sem" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[8, 10]} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                <Line type="monotone" dataKey="cgpa" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} name="CGPA" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card className="p-0 overflow-hidden lg:col-span-2 flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Results: {currentSemester}</h3>
            <Badge variant="success">Published</Badge>
          </div>
          <div className="overflow-x-auto flex-1">
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
          </div>
        </Card>
      </div>
    </div>
  );
}
