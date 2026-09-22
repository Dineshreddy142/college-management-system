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
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Semester End Term Exams</h3>
        <div className="p-8 text-center text-slate-400 text-sm">
          No active examination schedule published.
        </div>
      </Card>
    </div>
  );
}
