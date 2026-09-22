import { useState } from "react";
import { Filter, Download, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { Card, Btn, Badge } from "../../App";

export function TimetableGrid() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const slots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
  
  type ClassInfo = { sub: string; room: string; faculty: string; color: string } | null;
  const schedule: Record<string, Record<string, ClassInfo>> = {
    Monday: { "09:00": null, "10:00": null, "11:00": null, "12:00": null, "13:00": null, "14:00": null, "15:00": null, "16:00": null },
    Tuesday: { "09:00": null, "10:00": null, "11:00": null, "12:00": null, "13:00": null, "14:00": null, "15:00": null, "16:00": null },
    Wednesday: { "09:00": null, "10:00": null, "11:00": null, "12:00": null, "13:00": null, "14:00": null, "15:00": null, "16:00": null },
    Thursday: { "09:00": null, "10:00": null, "11:00": null, "12:00": null, "13:00": null, "14:00": null, "15:00": null, "16:00": null },
    Friday: { "09:00": null, "10:00": null, "11:00": null, "12:00": null, "13:00": null, "14:00": null, "15:00": null, "16:00": null },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-4 items-center">
          <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-medium">
            <option value="">Select Section</option>
            <option value="cs-6a">CS Dept - Sem 6 - Sec A</option>
          </select>
          <Badge variant="warning" size="sm">No Timetable Published</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="outline" size="sm" icon={<Filter size={16} />}>Filter</Btn>
          <Btn variant="outline" size="sm" icon={<Printer size={16} />}>Print</Btn>
          <Btn variant="primary" size="sm" icon={<Download size={16} />}>Export PDF</Btn>
        </div>
      </div>
      
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-24">Time</th>
                {days.map(d => <th key={d} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-3 w-48">{d}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {slots.map((slot) => (
                <tr key={slot} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-xs font-medium text-slate-500 whitespace-nowrap bg-slate-50/30 dark:bg-slate-900/20">{slot}</td>
                  {days.map(d => {
                    const cls = schedule[d][slot];
                    return (
                      <td key={`${d}-${slot}`} className="px-2 py-2">
                        {cls ? (
                          <div className={`p-2.5 rounded-lg border flex flex-col gap-1 shadow-sm ${cls.color}`}>
                            <span className="text-xs font-bold truncate block">{cls.sub}</span>
                            <div className="flex justify-between items-center text-[10px] opacity-80">
                              <span>{cls.room}</span>
                              <span className="font-medium">{cls.faculty}</span>
                            </div>
                          </div>
                        ) : slot === "12:00" ? (
                          <div className="p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-900/50">
                            <span className="text-[10px] font-medium uppercase tracking-wider">Lunch Break</span>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg border border-dashed border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-700 min-h-[60px] transition-colors cursor-pointer group">
                            <span className="text-[10px] hidden group-hover:block font-medium">Free Slot</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
