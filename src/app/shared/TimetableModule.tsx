import { Clock, Printer } from "lucide-react";
import { Card, Btn, Badge } from "../App";

export function TimetableModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Class Timetable</h2>
          <p className="text-sm text-slate-500">Your weekly schedule for Semester 6 Section A.</p>
        </div>
        <Btn variant="outline" icon={<Printer size={14} />}>Print</Btn>
      </div>

      <Card className="p-5">
        <div className="space-y-4">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, i) => (
            <div key={i}>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2">{day}</h3>
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                {[
                  { time: "9:00 - 10:00 AM", sub: "Data Structures", room: "CS-101", type: "Core" },
                  { time: "10:00 - 11:00 AM", sub: "Mathematics III", room: "LH-201", type: "Core" },
                  { time: "11:00 - 12:00 PM", sub: "Digital Circuits", room: "EC-105", type: "Core" },
                  { time: "2:00 - 4:00 PM", sub: "OS Lab", room: "CS-Lab1", type: "Lab" },
                ].map((c, j) => (
                  <div key={j} className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl relative overflow-hidden group">
                    <div className={`absolute top-0 left-0 w-1 h-full ${c.type === 'Lab' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">{c.time}</p>
                    <p className="text-sm text-slate-900 dark:text-white font-medium truncate">{c.sub}</p>
                    <p className="text-xs text-slate-500">{c.room}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
