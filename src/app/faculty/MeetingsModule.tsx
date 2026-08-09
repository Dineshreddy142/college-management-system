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
        <div className="space-y-3">
          {[
            { title: "Parent-Teacher Meeting", with: "Mr. Rajesh (Arjun's Parent)", time: "Tomorrow, 2:00 PM", type: "Online" },
          ].map((m, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-4">
                <Avatar name={m.with} />
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">{m.title}</h4>
                  <p className="text-sm text-slate-500">{m.with} • {m.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={m.type === 'Online' ? 'info' : 'default'}>{m.type}</Badge>
                {m.type === 'Online' && <Btn variant="primary" size="sm" icon={<Video size={14} />}>Join</Btn>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
