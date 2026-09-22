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

      <Card className="p-8 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <Badge variant="warning">No Timetable Published</Badge>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No active timetable schedules found</h3>
          <p className="text-xs text-slate-500">The weekly class timetable has not been published for this section yet. Please check back later or contact your department admin.</p>
        </div>
      </Card>
    </div>
  );
}
