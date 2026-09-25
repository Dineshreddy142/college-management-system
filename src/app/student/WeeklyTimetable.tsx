import { useState, useEffect } from "react";
import { Download, Printer, Search, Calendar, ChevronDown, CheckCircle } from "lucide-react";
import { Card, Badge, Btn, cn } from "../App";
import client from "../../api/client";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Period {
  period: number;
  time: string;
  type: string;
  subject: string;
  faculty: string;
  room: string;
  code: string;
}

interface DaySchedule {
  day: string;
  periods: Period[];
}

interface TimetableData {
  department: string;
  semester: string;
  section: string;
  batch: string;
  schedule: DaySchedule[];
}

const PERIODS = [
  { p: 1, name: 'Period 1', time: '08:45 AM - 09:45 AM', type: 'class' },
  { p: 2, name: 'Period 2', time: '09:45 AM - 10:45 AM', type: 'class' },
  { p: -1, name: 'Tea Break', time: '10:45 AM - 11:00 AM', type: 'break' },
  { p: 3, name: 'Period 3', time: '11:00 AM - 12:00 PM', type: 'class' },
  { p: 4, name: 'Period 4', time: '12:00 PM - 01:00 PM', type: 'class' },
  { p: -2, name: 'Lunch Break', time: '01:00 PM - 02:00 PM', type: 'break' },
  { p: 5, name: 'Period 5', time: '02:00 PM - 03:00 PM', type: 'class' },
  { p: 6, name: 'Period 6', time: '03:00 PM - 04:00 PM', type: 'class' },
  { p: -3, name: 'Short Break', time: '04:00 PM - 04:15 PM', type: 'break' },
  { p: 7, name: 'Period 7', time: '04:15 PM - 05:15 PM', type: 'class' },
  { p: -4, name: 'Activity / Tutorial', time: '05:15 PM - 05:35 PM', type: 'break' },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function WeeklyTimetable() {
  const [data, setData] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState('All');

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    client.get('/student/timetable')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handlePrint = () => window.print();
  const handleDownload = async (type: string) => {
    if (type === 'PDF') {
      const element = document.getElementById('timetable-content');
      if (!element) return;

      try {
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
        pdf.save('Weekly_Timetable.pdf');
      } catch (err) {
        console.error('Error generating PDF', err);
        alert('Failed to generate PDF. Please try printing instead.');
      }
    }
  };

  const currentDayString = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const timeInMinutes = currentHour * 60 + currentMinute;

  // Helper to parse "08:45 AM" into minutes since midnight
  const parseTime = (timeStr: string) => {
    const match = timeStr.match(/(\d+):(\d+) (AM|PM)/);
    if (!match) return 0;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const ampm = match[3];
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const getStatus = (day: string, timeRange: string) => {
    if (day !== currentDayString) {
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayIdx = daysOfWeek.indexOf(day);
      const currentIdx = daysOfWeek.indexOf(currentDayString);
      if (dayIdx < currentIdx) return 'completed';
      return 'upcoming';
    }

    const [start, end] = timeRange.split(' - ');
    const startMins = parseTime(start);
    const endMins = parseTime(end);

    if (timeInMinutes >= startMins && timeInMinutes < endMins) return 'live';
    if (timeInMinutes >= endMins) return 'completed';
    return 'upcoming';
  };

  const getColorClass = (type: string) => {
    switch (type.toLowerCase()) {
      case 'theory': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300';
      case 'lab': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300';
      case 'elective': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300';
      case 'tutorial': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300';
      case 'free': return 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-400';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-12 text-center">
        <Calendar size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No timetable has been published yet.</h3>
        <p className="text-sm text-slate-500 mt-2">Check back later or contact your department.</p>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden flex flex-col">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Weekly Class Timetable</h2>
          <p className="text-sm text-slate-500 mt-0.5">Current Week Schedule • {data.department} • Sem {data.semester} {data.section}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search subject..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-40 sm:w-auto"
            />
          </div>
          <select
            value={selectedDay}
            onChange={e => setSelectedDay(e.target.value)}
            className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
          >
            <option value="All">All Days</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="flex gap-2">
            <Btn variant="outline" onClick={handlePrint} icon={<Printer size={14} />}>Print</Btn>
            <Btn variant="outline" onClick={() => handleDownload('PDF')} icon={<Download size={14} />}>PDF</Btn>
          </div>
        </div>
      </div>

      <div id="timetable-content" className="overflow-x-auto print:overflow-visible bg-white dark:bg-slate-900">
        <div className="min-w-[900px] p-5">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700 w-32">Time</th>
                {DAYS.map(day => (
                  <th key={day} className={cn(
                    "p-3 text-center text-xs font-semibold uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700",
                    day === currentDayString ? "text-blue-600 dark:text-blue-400 border-blue-500 dark:border-blue-500" : "text-slate-500"
                  )}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period, idx) => {
                if (period.type === 'break') {
                  return (
                    <tr key={idx} className="bg-slate-50/50 dark:bg-slate-800/20">
                      <td className="p-3 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap text-xs font-medium text-slate-500">{period.time}</td>
                      <td colSpan={6} className="p-2 border-b border-slate-100 dark:border-slate-800 text-center text-xs font-medium text-slate-400 uppercase tracking-widest bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjZjFmMjYiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PHBhdGggZD0iTTAgNDBsNDAtNDBIMiBsLTQwIDQwaC0yeiIvPjwvZz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjMWUzYThhIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDQwbDQwLTQwSDIwbC00MCA0MGgtMnoiLz48L2c+PC9zdmc+')] opacity-60">
                        {period.name}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={idx}>
                    <td className="p-3 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap align-top">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{period.name}</div>
                      <div className="text-xs text-slate-500">{period.time}</div>
                    </td>
                    {DAYS.map(day => {
                      const daySchedule = data.schedule.find(d => d.day === day);
                      const classDetails = daySchedule?.periods.find(p => p.period === period.p);

                      if (!classDetails || classDetails.type === 'Free') {
                        return <td key={day} className="p-2 border-b border-slate-100 dark:border-slate-800 align-top"><div className="h-full min-h-[100px] rounded-lg border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30" /></td>;
                      }

                      // If searching and this cell doesn't match, dim it significantly
                      const matchesSearch = search === '' ||
                        classDetails.subject.toLowerCase().includes(search.toLowerCase()) ||
                        classDetails.faculty.toLowerCase().includes(search.toLowerCase()) ||
                        classDetails.code.toLowerCase().includes(search.toLowerCase());

                      const status = getStatus(day, period.time);
                      const isLive = status === 'live';
                      const isCompleted = status === 'completed';

                      return (
                        <td key={day} className={cn(
                          "p-2 border-b border-slate-100 dark:border-slate-800 align-top transition-all",
                          selectedDay !== 'All' && selectedDay !== day && "opacity-20 pointer-events-none"
                        )}>
                          <div className={cn(
                            "relative h-full min-h-[110px] p-3 rounded-xl border flex flex-col transition-all hover:-translate-y-1 hover:shadow-md cursor-default",
                            getColorClass(classDetails.type),
                            !matchesSearch && "opacity-20 grayscale",
                            isCompleted && !isLive && "opacity-60",
                            isLive && "ring-2 ring-blue-500 shadow-lg shadow-blue-500/20 scale-105 z-10 bg-white dark:bg-slate-900"
                          )}>
                            {isLive && (
                              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1 uppercase tracking-wide z-20 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                Live Now
                              </div>
                            )}

                            <div className="flex justify-between items-start gap-1 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{classDetails.type}</span>
                              <span className="text-[10px] font-mono bg-white/50 dark:bg-black/20 px-1.5 rounded">{classDetails.code}</span>
                            </div>

                            <h4 className="text-sm font-bold leading-tight mb-2 flex-grow">{classDetails.subject}</h4>

                            <div className="mt-auto space-y-1">
                              <p className="text-xs flex items-center justify-between opacity-90 font-medium truncate">
                                <span>{classDetails.faculty}</span>
                              </p>
                              <p className="text-[11px] flex items-center gap-1 opacity-75">
                                <span>{classDetails.room}</span>
                              </p>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-center text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div> Theory</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div> Lab</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-purple-100 border border-purple-200"></div> Elective</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div> Tutorial</div>
      </div>
    </Card>
  );
}
