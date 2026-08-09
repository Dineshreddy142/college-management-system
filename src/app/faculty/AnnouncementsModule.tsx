import { Bell, Plus, Send } from "lucide-react";
import { Card, Badge, Btn } from "../App";

export function AnnouncementsModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Announcements</h2>
          <p className="text-sm text-slate-500">Send announcements to classes and students.</p>
        </div>
        <Btn variant="primary" icon={<Plus size={14} />}>New Announcement</Btn>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Recent Announcements</h3>
        <div className="space-y-3">
          {[
            { title: "Extra Class for Data Structures", target: "CS301-A", date: "Today", content: "We will have an extra class tomorrow at 4 PM in Room 101." },
            { title: "Assignment Deadline Extended", target: "All Classes", date: "Yesterday", content: "The deadline for the first assignment has been extended to Friday." }
          ].map((a, i) => (
            <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-slate-900 dark:text-white">{a.title}</h4>
                <Badge variant="info">{a.target}</Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{a.content}</p>
              <p className="text-xs text-slate-400 mt-2">{a.date}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
