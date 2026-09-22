import { CalendarDays, MapPin, Search } from "lucide-react";
import { Card, Badge, Btn } from "../App";

export function EventsModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Events & Hackathons</h2>
          <p className="text-sm text-slate-500">Register for campus events and workshops.</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search events..." className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm w-full sm:w-64" />
        </div>
      </div>

      <Card className="p-8 text-center text-slate-400 text-sm">
        No upcoming events or hackathons scheduled.
      </Card>
    </div>
  );
}
