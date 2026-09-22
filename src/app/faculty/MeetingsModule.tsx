import { Phone, Video, Plus } from "lucide-react";
import { Card, Badge, Btn, Avatar } from "../App";

export function MeetingsModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Meetings</h2>
          <p className="text-sm text-slate-500">Schedule meetings with students or parents.</p>
        </div>
        <Btn variant="primary" icon={<Plus size={14} />}>Schedule Meeting</Btn>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Upcoming Meetings</h3>
        <div className="p-8 text-center text-slate-400 text-sm">
          No upcoming meetings scheduled.
        </div>
      </Card>
    </div>
  );
}
