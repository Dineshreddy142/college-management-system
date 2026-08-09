import { BarChart3, Download, TrendingUp } from "lucide-react";
import { Card, Badge, Btn } from "../App";

export function ResultsModule() {
  const currentSem = [
    { sub: "Data Structures", internal: 38, external: 54, total: 92, grade: "O" },
    { sub: "Mathematics III", internal: 35, external: 51, total: 86, grade: "A+" },
    { sub: "Digital Circuits", internal: 32, external: 48, total: 80, grade: "A" },
    { sub: "Eng. Physics", internal: 29, external: 45, total: 74, grade: "B+" },
    { sub: "OS Lab", internal: 48, external: 0, total: 48, grade: "O" }, // out of 50
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Academic Results</h2>
          <p className="text-sm text-slate-500">View marks and download marksheets.</p>
        </div>
        <Btn variant="primary" icon={<Download size={14} />}>Official Marksheet</Btn>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 mb-3">
            <BarChart3 size={24} />
          </div>
          <p className="text-xs text-slate-500">Current CGPA</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">9.2</p>
        </Card>
        <Card className="p-5 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 mb-3">
            <TrendingUp size={24} />
          </div>
          <p className="text-xs text-slate-500">Total Credits Earned</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">124 / 160</p>
        </Card>
        <Card className="p-5 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-full flex items-center justify-center text-purple-600 mb-3">
            <Award size={24} />
          </div>
          <p className="text-xs text-slate-500">Class Rank</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">5th</p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">Semester 5 Results (Last Semester)</h3>
          <Badge variant="success">Pass</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium text-center">Internal (40)</th>
                <th className="px-4 py-3 font-medium text-center">External (60)</th>
                <th className="px-4 py-3 font-medium text-center">Total (100)</th>
                <th className="px-4 py-3 font-medium text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentSem.map((s, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.sub}</td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{s.internal}</td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{s.external}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white">{s.total}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={s.grade === 'O' || s.grade === 'A+' ? 'success' : s.grade === 'A' ? 'info' : 'warning'}>{s.grade}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
// Temporary import fix for Award used above
import { Award } from "lucide-react";
