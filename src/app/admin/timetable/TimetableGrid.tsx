import { useState, useEffect, useCallback } from "react";
import { Filter, Download, Printer, RefreshCw } from "lucide-react";
import { Card, Btn, Badge } from "../../App";
import client from "../../../api/client";

export function TimetableGrid() {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const slots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [timetableData, setTimetableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);

  type ClassInfo = { sub: string; room: string; faculty: string; color: string } | null;

  const fetchSections = useCallback(async () => {
    try {
      const res = await client.get('/academic/sections');
      const raw = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      setSections(raw);
      if (raw.length > 0 && !selectedSectionId) {
        setSelectedSectionId(String(raw[0].id));
      }
    } catch (err) {
      console.warn('Failed to fetch sections:', err);
    }
  }, [selectedSectionId]);

  const fetchTimetableData = useCallback(async (sectionId: string) => {
    if (!sectionId) return;
    setIsLoading(true);
    try {
      const res = await client.get('/timetable/master', { params: { sectionId } });
      const raw = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      setTimetableData(raw);
      setIsPublished(raw.length > 0);
    } catch (err) {
      console.warn('Failed to fetch timetable master:', err);
      setTimetableData([]);
      setIsPublished(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  useEffect(() => {
    if (selectedSectionId) {
      fetchTimetableData(selectedSectionId);
    }
  }, [selectedSectionId, fetchTimetableData]);

  // Map API response to grid matrix
  const buildScheduleMap = (): Record<string, Record<string, ClassInfo>> => {
    const map: Record<string, Record<string, ClassInfo>> = {};
    days.forEach(d => {
      map[d] = {};
      slots.forEach(s => {
        map[d][s] = null;
      });
    });

    timetableData.forEach((entry: any) => {
      const day = entry.day_of_week || entry.day;
      const slotTime = entry.start_time || entry.time_slot;
      if (map[day] && slotTime) {
        const matchingSlot = slots.find(s => s.startsWith(slotTime.substring(0, 2)));
        if (matchingSlot) {
          map[day][matchingSlot] = {
            sub: entry.subject_code || entry.subject_name || 'Subject',
            room: entry.room_name || entry.classroom || 'Room 101',
            faculty: entry.faculty_name || entry.faculty || 'Faculty',
            color: 'bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-200'
          };
        }
      }
    });

    return map;
  };

  const scheduleMap = buildScheduleMap();

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    alert("Timetable PDF Export initiated for Section " + (sections.find(s => String(s.id) === selectedSectionId)?.name || selectedSectionId));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={selectedSectionId}
            onChange={e => setSelectedSectionId(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-medium"
          >
            <option value="">Select Section...</option>
            {sections.map(s => (
              <option key={s.id} value={s.id}>
                {s.department_code || 'Dept'} - Sem {s.semester_number || s.semester_id || '1'} - Sec {s.name}
              </option>
            ))}
          </select>

          {isPublished ? (
            <Badge variant="success" size="sm">Timetable Published</Badge>
          ) : (
            <Badge variant="warning" size="sm">No Timetable Published</Badge>
          )}

          <button
            onClick={() => fetchTimetableData(selectedSectionId)}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
            title="Refresh Timetable"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Btn variant="outline" size="sm" icon={<Printer size={16} />} onClick={handlePrint}>Print</Btn>
          <Btn variant="primary" size="sm" icon={<Download size={16} />} onClick={handleExportPDF}>Export PDF</Btn>
        </div>
      </div>
      
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-24">Time</th>
                {days.map(d => <th key={d} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-3 w-48">{d}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {slots.map((slot) => (
                <tr key={slot} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-xs font-medium text-slate-500 whitespace-nowrap bg-slate-50/30 dark:bg-slate-900/20">{slot}</td>
                  {days.map(d => {
                    const cls = scheduleMap[d][slot];
                    return (
                      <td key={`${d}-${slot}`} className="px-2 py-2">
                        {cls ? (
                          <div className={`p-2.5 rounded-lg border flex flex-col gap-1 shadow-sm ${cls.color}`}>
                            <span className="text-xs font-bold truncate block">{cls.sub}</span>
                            <div className="flex justify-between items-center text-[10px] opacity-80">
                              <span>{cls.room}</span>
                              <span className="font-medium">{cls.faculty}</span>
                            </div>
                          </div>
                        ) : slot === "12:00" ? (
                          <div className="p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-900/50">
                            <span className="text-[10px] font-medium uppercase tracking-wider">Lunch Break</span>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-lg border border-dashed border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-700 min-h-[60px] transition-colors cursor-pointer group">
                            <span className="text-[10px] hidden group-hover:block font-medium">Free Slot</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
