import { useState } from "react";
import { Users, AlertTriangle, FileText, BarChart3, Clock, CheckCircle, Plus, LayoutDashboard, UserCircle, MessageCircle } from "lucide-react";
import { Card, StatCard, Badge, Avatar, Btn } from "../../App";
import { MenteeList } from "./MenteeList";
import { CounselingModule } from "./CounselingModule";
import { ParentMeetings } from "./ParentMeetings";
import { MenteeDetails } from "./MenteeDetails";
import { cn } from "../../App";

export function MentorDashboardModule() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  if (selectedStudentId !== null) {
    return <MenteeDetails onBack={() => setSelectedStudentId(null)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "mentees": return <MenteeList onSelect={setSelectedStudentId} />;
      case "counseling": return <CounselingModule />;
      case "meetings": return <ParentMeetings />;
      default: return <Overview />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {[
          { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
          { id: "mentees", label: "Mentee Directory", icon: <Users size={16} /> },
          { id: "counseling", label: "Counseling", icon: <UserCircle size={16} /> },
          { id: "meetings", label: "Parent Meetings", icon: <MessageCircle size={16} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === t.id ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  );
}

function Overview() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Mentor Dashboard</h2>
          <p className="text-sm text-slate-500">Overview of your assigned mentees across all years.</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm" icon={<FileText size={16} />}>Generate Report</Btn>
          <Btn variant="primary" size="sm" icon={<Plus size={16} />}>New Session</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Mentees" value="0" subtitle="Across 4 years" icon={<Users size={19} />} color="blue" />
        <StatCard title="Risk Alerts" value="0" subtitle="Low attendance / grades" icon={<AlertTriangle size={19} />} color="red" />
        <StatCard title="Meetings Pending" value="0" subtitle="Parent / Student" icon={<Clock size={19} />} color="amber" />
        <StatCard title="Avg. CGPA" value="0.0" subtitle="Mentee Performance" icon={<BarChart3 size={19} />} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Year-wise Distribution</h3>
          <div className="flex flex-wrap gap-4">
            {[1, 2, 3, 4].map((year) => (
              <div key={year} className="flex-1 min-w-[120px] bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Year {year}</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">0</span>
                  <Badge variant="default" size="sm">Inactive</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Urgent Actions</h3>
          <div className="space-y-3">
            <p className="text-xs text-slate-400">No urgent alerts recorded.</p>
          </div>
        </Card>
      </div>
      
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Recent Counseling Sessions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500">
              <tr>
                <th className="px-4 py-3 rounded-l-xl font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Topic</th>
                <th className="px-4 py-3 font-medium">Action Plan</th>
                <th className="px-4 py-3 rounded-r-xl font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { name: "Priya Patel", date: "Oct 12, 2023", topic: "Low Attendance in OS", action: "Submit medical cert.", status: "Pending" },
                { name: "Arjun Sharma", date: "Oct 10, 2023", topic: "Placement Guidance", action: "Prepare for Infosys", status: "Completed" },
              ].map((s, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Avatar name={s.name} size="sm" /> {s.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.date}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.topic}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.action}</td>
                  <td className="px-4 py-3">
                    <Badge variant={s.status === 'Completed' ? 'success' : 'warning'} size="sm">{s.status}</Badge>
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
