import { useState, useEffect } from "react";
import { UserCheck, Award, FileText, Calendar, CheckCircle } from "lucide-react";
import { Badge, StatCard, Card, PBar, cn } from "../App";
import { WeeklyTimetable } from "../student/WeeklyTimetable";
import client from "../../api/client";

export function DashboardHome() {
  const [stats, setStats] = useState({ attendance: '88.4%', upcomingExams: 1, pendingAssignments: 3 });

  useEffect(() => {
    client.get('/dashboard/student').then(res => {
      setStats(prev => ({ ...prev, ...res.data }));
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Welcome back, Arjun 👋</h2>
          <p className="text-xs text-slate-400 mt-0.5">CS Department • Semester 6 • Roll: CS2021001</p>
        </div>
        <Badge variant="success">Active</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Attendance" value={stats.attendance} change="+2.1% this month" changeType="up" icon={<UserCheck size={19} />} color="green" />
        <StatCard title="CGPA" value="9.2 / 10" subtitle="Top 5% of class" icon={<Award size={19} />} color="blue" />
        <StatCard title="Assignments" value={`${stats.pendingAssignments} Pending`} subtitle="Due this week" icon={<FileText size={19} />} color="amber" />
        <StatCard title="Next Exam" value={stats.upcomingExams > 0 ? "May 15" : "None"} subtitle="Data Structures" icon={<Calendar size={19} />} color="indigo" />
      </div>

      <div className="space-y-5">
        <WeeklyTimetable />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Subject Attendance</h3>
            <div className="space-y-2.5">
              {[
                { sub: "Data Structures", pct: 92 }, { sub: "Mathematics III", pct: 88 },
                { sub: "Digital Circuits", pct: 84 }, { sub: "Eng. Physics", pct: 79 },
              ].map(s => (
                <div key={s.sub}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate mr-2">{s.sub}</span>
                    <span className={cn("text-xs font-medium flex-shrink-0", s.pct < 75 ? "text-red-600" : "text-slate-700 dark:text-slate-300")}>{s.pct}%</span>
                  </div>
                  <PBar value={s.pct} color={s.pct >= 85 ? "green" : s.pct >= 75 ? "blue" : "red"} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Recent Results</h3>
            <div className="space-y-2">
              {[
                { sub: "Operating Systems", marks: "88/100", grade: "A+" },
                { sub: "Control Systems", marks: "74/100", grade: "B+" },
                { sub: "DBMS", marks: "92/100", grade: "A+" },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-white">{r.sub}</p>
                    <p className="text-xs text-slate-400">{r.marks}</p>
                  </div>
                  <Badge variant={r.grade.startsWith("A") ? "success" : "info"} size="sm">{r.grade}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
