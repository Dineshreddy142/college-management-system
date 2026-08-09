import { Award, Download, MapPin } from "lucide-react";
import { Card, Badge, Btn } from "../App";

export function ExaminationModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Examination</h2>
          <p className="text-sm text-slate-500">View exam schedule and download hall tickets.</p>
        </div>
        <Btn variant="primary" icon={<Download size={14} />}>Download Hall Ticket</Btn>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Semester 6 End Term Exams</h3>
        <div className="space-y-4">
          {[
            { date: "May 15, 2024", time: "10:00 AM - 1:00 PM", sub: "Data Structures", code: "CS301", room: "Block A - Room 204" },
            { date: "May 18, 2024", time: "10:00 AM - 1:00 PM", sub: "Mathematics III", code: "MA301", room: "Block A - Room 204" },
            { date: "May 21, 2024", time: "10:00 AM - 1:00 PM", sub: "Digital Circuits", code: "EC301", room: "Block B - Room 102" },
          ].map((e, i) => (
            <div key={i} className="flex flex-col md:flex-row justify-between md:items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">{e.sub} ({e.code})</h4>
                  <p className="text-sm text-slate-500 mt-1">{e.date} • {e.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 md:text-right bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <MapPin size={16} className="text-slate-400" />
                <span>{e.room}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
