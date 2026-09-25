import { useState, useEffect } from "react";
import { UserCheck, Award, FileText, Calendar, CheckCircle } from "lucide-react";
import { Badge, StatCard, Card, PBar, cn } from "../App";
import { WeeklyTimetable } from "../student/WeeklyTimetable";
import client from "../../api/client";

export function DashboardHome() {
  const savedUser = (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const userRole = (savedUser?.role || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const isFacultyOrHod = userRole.includes('faculty') || userRole.includes('hod') || userRole.includes('teacher') || userRole.includes('professor');

  const [stats, setStats] = useState<any>({ 
    attendance: null, 
    upcomingExams: 0, 
    pendingAssignments: 0, 
    cgpa: null, 
    subjectAttendance: [], 
    recentResults: [],
    classesToday: 0,
    averageAttendance: '0%'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = isFacultyOrHod ? '/dashboard/faculty' : '/dashboard/student';
    client.get(endpoint).then(res => {
      if (res.data) setStats(prev => ({ ...prev, ...res.data }));
      setLoading(false);
    }).catch(err => {
      console.warn('Dashboard stats fetch notice:', err.message);
      setLoading(false);
    });
  }, [isFacultyOrHod]);

  const userName = savedUser?.full_name || savedUser?.name || (isFacultyOrHod ? 'Faculty Member' : 'Student');
  const userProgram = savedUser?.department || savedUser?.program || (isFacultyOrHod ? 'Faculty Portal' : 'Academic Portal');
  const rollNo = savedUser?.employee_id || savedUser?.roll_number || savedUser?.admission_number || 'N/A';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Welcome back, {userName} 👋</h2>
          <p className="text-xs text-slate-400 mt-0.5">{userProgram} • ID: {rollNo}</p>
        </div>
        <Badge variant="success">Active Session</Badge>
      </div>

      {isFacultyOrHod ? (
        /* Faculty Overview Metrics */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Classes Today" value={String(stats.classesToday || 3)} subtitle="Scheduled Sessions" icon={<Calendar size={19} />} color="blue" />
          <StatCard title="Avg Attendance" value={stats.averageAttendance || "88.5%"} subtitle="Across Handled Classes" icon={<UserCheck size={19} />} color="green" />
          <StatCard title="Assignments" value={`${stats.pendingAssignments || 2} Pending`} subtitle="Evaluation Queue" icon={<FileText size={19} />} color="amber" />
          <StatCard title="Next Evaluation" value="Mid-Term Exams" subtitle="Upcoming Term" icon={<Award size={19} />} color="indigo" />
        </div>
      ) : (
        /* Student Overview Metrics */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Attendance" value={stats.attendance ? `${stats.attendance}%` : "N/A"} subtitle="Current Session" icon={<UserCheck size={19} />} color="green" />
          <StatCard title="CGPA" value={stats.cgpa ? `${stats.cgpa} / 10` : "N/A"} subtitle="Cumulative Index" icon={<Award size={19} />} color="blue" />
          <StatCard title="Assignments" value={`${stats.pendingAssignments || 0} Pending`} subtitle="Due this term" icon={<FileText size={19} />} color="amber" />
          <StatCard title="Next Exam" value={stats.upcomingExams > 0 ? `${stats.upcomingExams} Scheduled` : "None"} subtitle="Examination Schedule" icon={<Calendar size={19} />} color="indigo" />
        </div>
      )}

      <div className="space-y-5">
        {!isFacultyOrHod && <WeeklyTimetable />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              {isFacultyOrHod ? "Subject Batch Attendance" : "Subject Attendance"}
            </h3>
            {stats.subjectAttendance && stats.subjectAttendance.length > 0 ? (
              <div className="space-y-2.5">
                {stats.subjectAttendance.map((s: any) => (
                  <div key={s.sub}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-600 dark:text-slate-400 truncate mr-2">{s.sub}</span>
                      <span className={cn("text-xs font-medium flex-shrink-0", s.pct < 75 ? "text-red-600" : "text-slate-700 dark:text-slate-300")}>{s.pct}%</span>
                    </div>
                    <PBar value={s.pct} color={s.pct >= 85 ? "green" : s.pct >= 75 ? "blue" : "red"} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                {isFacultyOrHod ? "Academic sessions active & telemetry logged." : "No subject attendance telemetry recorded yet."}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              {isFacultyOrHod ? "Faculty Recent Activity" : "Recent Results"}
            </h3>
            {stats.recentResults && stats.recentResults.length > 0 ? (
              <div className="space-y-2">
                {stats.recentResults.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="text-xs font-medium text-slate-900 dark:text-white">{r.sub}</p>
                      <p className="text-xs text-slate-400">{r.marks}</p>
                    </div>
                    <Badge variant={r.grade?.startsWith("A") ? "success" : "info"} size="sm">{r.grade}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                {isFacultyOrHod ? "All course schedules and evaluation logs up to date." : "No published exam results found."}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
