import { useState, useEffect } from "react";
import { BookOpen, Users, Search, Filter, Calendar, Clock, MapPin, CheckCircle } from "lucide-react";
import { Card, Badge, Btn, cn } from "../App";
import client from "../../api/client";

export function ClassesModule() {
  const [activeTab, setActiveTab] = useState<"classes" | "timetable">("classes");
  const [classes, setClasses] = useState<any[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const TIME_SLOTS = ["09:00", "10:00", "11:15", "13:00", "14:00", "15:00", "16:00"];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clsRes, ttRes] = await Promise.all([
          client.get('/faculty/classes').catch(() => ({ data: [] })),
          client.get('/timetable/faculty').catch(() => ({ data: { schedule: [] } }))
        ]);

        const rawClasses = Array.isArray(clsRes.data) ? clsRes.data : (clsRes.data?.data || []);
        const rawSchedule = Array.isArray(ttRes.data?.schedule) ? ttRes.data.schedule : (Array.isArray(ttRes.data) ? ttRes.data : []);

        setClasses(rawClasses);
        setTimetableEntries(rawSchedule);
      } catch (err: any) {
        console.error('Failed to fetch faculty classes or timetable:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredClasses = classes.filter(c =>
    !searchTerm ||
    (c.subject_name && c.subject_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.subject_code && c.subject_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.section_name && c.section_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      {/* Header and Tab Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {activeTab === "classes" ? "My Assigned Classes & Courses" : "My Weekly Teaching Timetable"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized directly from published semester academic timetables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab("classes")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                activeTab === "classes"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <BookOpen size={13} />
              <span>Classes ({classes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("timetable")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                activeTab === "timetable"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <Calendar size={13} />
              <span>Weekly Schedule ({timetableEntries.length} Slots)</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activeTab === "classes" ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search classes or sections..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>
          </div>

          {filteredClasses.length === 0 ? (
            <Card className="p-8 text-center text-xs text-slate-400">
              No classes currently allocated for this semester.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredClasses.map((c, i) => (
                <Card key={i} className="p-5" hover>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <BookOpen size={20} />
                    </div>
                    <Badge variant="info">{c.course_name || 'B.Tech'}</Badge>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{c.subject_name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{c.subject_code} • Section {c.section_name}</p>

                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Users size={14} /> Enrolled Students</span>
                      <span className="font-medium text-slate-900 dark:text-white">{c.student_count || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Semester</span>
                      <span className="font-medium text-slate-900 dark:text-white">{c.semester_name || 'Semester 1'}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Weekly Timetable Schedule Matrix */
        <Card className="p-5 overflow-hidden">
          {timetableEntries.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No weekly timetable periods published yet for your profile.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3 w-28">Day</th>
                    {TIME_SLOTS.map(t => (
                      <th key={t} className="py-3 px-2 text-center">
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {DAYS.map(day => {
                    const dayEntries = timetableEntries.filter(e => e.day_of_week === day);

                    return (
                      <tr key={day} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30">
                        <td className="py-3 px-3 font-bold text-xs text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-900/20 whitespace-nowrap">
                          {day}
                        </td>
                        {TIME_SLOTS.map(slotTime => {
                          const matched = dayEntries.find(e => {
                            const st = e.start_time ? String(e.start_time).substring(0, 5) : "";
                            return st && st.startsWith(slotTime.substring(0, 2));
                          });

                          return (
                            <td key={slotTime} className="p-1.5 align-top">
                              {matched ? (
                                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-mono text-[9px] font-bold bg-blue-200 dark:bg-blue-900 px-1 py-0.5 rounded text-blue-950 dark:text-blue-100">
                                      {matched.subject_code}
                                    </span>
                                    <span className="text-[9px] text-blue-500 font-bold">Sec {matched.section_name}</span>
                                  </div>
                                  <p className="font-bold text-slate-900 dark:text-white text-[11px] leading-tight line-clamp-1">
                                    {matched.subject_name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                    <MapPin size={10} /> {matched.room_number || "Room 101"}
                                  </p>
                                </div>
                              ) : (
                                <div className="h-16 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/40 bg-slate-50/30 dark:bg-slate-900/10" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

