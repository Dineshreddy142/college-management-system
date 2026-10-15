import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  BookOpen,
  UserCheck,
  Building,
  Clock,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Save,
  Layers,
  ArrowRight,
  RefreshCw,
  Trash2
} from "lucide-react";
import { Card, Btn, Badge, cn } from "../../App";
import client from "../../../api/client";

interface CreateSemesterTimetableProps {
  onCreated?: () => void;
}

interface PredefinedSubject {
  id: number;
  code: string;
  name: string;
  credits: number;
  type: string;
  semester?: number;
}

interface FacultyMember {
  id: number;
  name: string;
  designation?: string;
  email?: string;
}

interface Classroom {
  id: number;
  room_number: string;
  building: string;
  capacity?: number;
}

interface TimeSlot {
  id: number;
  period_number: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
  title: string;
}

interface CellEntry {
  day_of_week: string;
  time_slot_id: number;
  subject_id: number | "";
  faculty_id: number | "";
  room_id: number | "";
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function CreateSemesterTimetable({ onCreated }: CreateSemesterTimetableProps) {
  // Dropdown options
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  // Selected filters
  const [departmentId, setDepartmentId] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");
  const [semesterId, setSemesterId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");

  // Loaded metadata
  const [predefinedSubjects, setPredefinedSubjects] = useState<PredefinedSubject[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Schedule matrix state: map of `${day}_${slotId}` -> CellEntry
  const [matrix, setMatrix] = useState<Record<string, CellEntry>>({});

  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Initial load of master dropdown options
  useEffect(() => {
    const loadAcademicOptions = async () => {
      try {
        const [deptRes, crsRes, semRes, secRes] = await Promise.all([
          client.get("/academic/departments").catch(() => client.get("/v1/academic/departments")).catch(() => ({ data: [] })),
          client.get("/academic/courses").catch(() => client.get("/v1/academic/courses")).catch(() => ({ data: [] })),
          client.get("/academic/semesters").catch(() => client.get("/v1/academic/semesters")).catch(() => ({ data: [] })),
          client.get("/academic/sections").catch(() => ({ data: [] }))
        ]);

        const rawDepts = Array.isArray(deptRes.data) ? deptRes.data : (deptRes.data?.data || []);
        const rawCrs = Array.isArray(crsRes.data) ? crsRes.data : (crsRes.data?.data || []);
        const rawSems = Array.isArray(semRes.data) ? semRes.data : (semRes.data?.data || []);
        const rawSecs = Array.isArray(secRes.data) ? secRes.data : (secRes.data?.data || []);

        setDepartments(rawDepts);
        setCourses(rawCrs);
        setSemesters(rawSems);
        setSections(rawSecs);

        if (rawDepts.length > 0) setDepartmentId(String(rawDepts[0].id));
        if (rawCrs.length > 0) setCourseId(String(rawCrs[0].id));
        if (rawSems.length > 0) setSemesterId(String(rawSems[0].id));
        if (rawSecs.length > 0) setSectionId(String(rawSecs[0].id));
      } catch (err) {
        console.warn("Failed loading academic options:", err);
      }
    };

    loadAcademicOptions();
  }, []);

  // Fetch predefined subjects, department faculty, rooms, and slots
  const fetchPredefinedData = useCallback(async () => {
    if (!departmentId || !semesterId) return;
    setIsLoadingMeta(true);
    try {
      const res = await client.get("/timetable/predefined-subjects", {
        params: {
          department_id: departmentId,
          course_id: courseId,
          semester_id: semesterId
        }
      });

      if (res.data?.success) {
        const subs = res.data.subjects || [];
        const facs = res.data.faculty || [];
        const rms = res.data.classrooms || [];
        const slots = res.data.timeSlots || [];

        setPredefinedSubjects(subs);
        setFacultyList(facs);
        setClassrooms(rms);
        setTimeSlots(slots.filter((s: TimeSlot) => !s.is_break));
      }
    } catch (err) {
      console.warn("Failed to load predefined semester data:", err);
    } finally {
      setIsLoadingMeta(false);
    }
  }, [departmentId, courseId, semesterId]);

  useEffect(() => {
    fetchPredefinedData();
  }, [fetchPredefinedData]);

  // Update a single matrix cell
  const handleCellChange = (day: string, slotId: number, field: "subject_id" | "faculty_id" | "room_id", value: any) => {
    const key = `${day}_${slotId}`;
    setMatrix(prev => {
      const existing = prev[key] || {
        day_of_week: day,
        time_slot_id: slotId,
        subject_id: "",
        faculty_id: "",
        room_id: ""
      };

      const updated = {
        ...existing,
        [field]: value ? Number(value) : ""
      };

      return {
        ...prev,
        [key]: updated
      };
    });
  };

  // Clear a single cell
  const handleClearCell = (day: string, slotId: number) => {
    const key = `${day}_${slotId}`;
    setMatrix(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // 1-Click Auto-Fill helper: Distributes predefined subjects and faculty across available slots
  const handleAutoFill = () => {
    if (predefinedSubjects.length === 0 || timeSlots.length === 0) {
      setNotification({ type: "error", text: "No predefined subjects or slots available to auto-fill." });
      return;
    }

    const newMatrix: Record<string, CellEntry> = {};
    let subIdx = 0;
    const defaultRoomId = classrooms.length > 0 ? classrooms[0].id : 1;

    DAYS.forEach(day => {
      timeSlots.forEach(slot => {
        const sub = predefinedSubjects[subIdx % predefinedSubjects.length];
        const assignedFac = facultyList.length > 0 ? facultyList[subIdx % facultyList.length].id : "";
        const key = `${day}_${slot.id}`;

        newMatrix[key] = {
          day_of_week: day,
          time_slot_id: slot.id,
          subject_id: sub.id,
          faculty_id: assignedFac,
          room_id: defaultRoomId
        };

        subIdx++;
      });
    });

    setMatrix(newMatrix);
    setNotification({ type: "success", text: "Predefined subjects, department faculty, and classrooms auto-populated across the weekly matrix." });
  };

  // Save & Publish Timetable
  const handleSaveAndPublish = async () => {
    const entries = Object.values(matrix).filter(e => e.subject_id !== "");
    if (entries.length === 0) {
      setNotification({ type: "error", text: "Please assign at least one subject slot in the weekly schedule before saving." });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        department_id: Number(departmentId),
        course_id: Number(courseId),
        semester_id: Number(semesterId),
        section_id: Number(sectionId),
        entries,
        autoPublish: true
      };

      const res = await client.post("/timetable/create-semester", payload);
      if (res.data?.success) {
        setNotification({
          type: "success",
          text: `Timetable published successfully! ${res.data.entriesCreated} timetable slots and ${res.data.allocationsSynced} faculty subject assignments activated.`
        });
        if (onCreated) {
          setTimeout(onCreated, 1200);
        }
      }
    } catch (err: any) {
      console.error("Error creating timetable:", err);
      setNotification({
        type: "error",
        text: err.response?.data?.message || "Failed to save semester timetable."
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Count assigned cells
  const assignedCount = Object.values(matrix).filter(e => e.subject_id !== "").length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {notification && (
        <div
          className={cn(
            "p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300",
            notification.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
              : "bg-red-950/90 text-red-200 border-red-500/40"
          )}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs opacity-75 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Selector Card */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Calendar size={18} />
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Create New Semester Timetable & Allocate Faculty
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select department and semester to load predefined curriculum subjects, allocate faculty to each time slot, and publish simultaneously across student and faculty portals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Btn
              variant="outline"
              size="sm"
              icon={<Sparkles size={14} className="text-amber-500" />}
              onClick={handleAutoFill}
              disabled={isLoadingMeta || predefinedSubjects.length === 0}
            >
              Auto-Fill Schedule
            </Btn>
            <Btn
              variant="primary"
              size="sm"
              icon={isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              onClick={handleSaveAndPublish}
              disabled={isSaving || assignedCount === 0}
            >
              Save & Publish ({assignedCount} Slots)
            </Btn>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Department
            </label>
            <select
              value={departmentId}
              onChange={e => setDepartmentId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code || "DEPT"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Program / Course
            </label>
            <select
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Semester
            </label>
            <select
              value={semesterId}
              onChange={e => setSemesterId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {semesters.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name || `Semester ${s.semester_number || s.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Section
            </label>
            <select
              value={sectionId}
              onChange={e => setSectionId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sections.map(s => (
                <option key={s.id} value={s.id}>
                  Section {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Predefined Semester Subjects Pill Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BookOpen size={14} className="text-blue-500" />
              Predefined Semester Subjects ({predefinedSubjects.length})
            </span>
            <span className="text-[11px] text-slate-400">
              {facultyList.length} Faculty Members Available in Department
            </span>
          </div>

          {isLoadingMeta ? (
            <div className="py-3 flex items-center gap-2 text-xs text-slate-400">
              <RefreshCw size={13} className="animate-spin" /> Loading predefined subjects & faculty...
            </div>
          ) : predefinedSubjects.length === 0 ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs text-slate-500 italic">
              No subjects registered for this semester yet. You can still assign subjects from the system directory.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {predefinedSubjects.map(sub => (
                <div
                  key={sub.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs font-semibold text-blue-900 dark:text-blue-200"
                >
                  <span className="font-mono text-[10px] bg-blue-200 dark:bg-blue-900 px-1.5 py-0.5 rounded text-blue-950 dark:text-blue-100">
                    {sub.code}
                  </span>
                  <span>{sub.name}</span>
                  <span className="text-[10px] text-blue-500 font-bold">{sub.credits}C</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Weekly Matrix Schedule Builder */}
      <Card className="p-5 overflow-hidden">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock size={16} className="text-indigo-500" />
            Weekly Time Slot & Faculty Allocation Matrix
          </h3>
          <Badge variant={assignedCount > 0 ? "success" : "default"} size="sm">
            {assignedCount} Periods Scheduled
          </Badge>
        </div>

        {timeSlots.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No time slots configured. Standard academic periods will be created automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3 w-32">Day / Time Slot</th>
                  {timeSlots.map(slot => (
                    <th key={slot.id} className="py-3 px-2 text-center">
                      <div>Period {slot.period_number}</div>
                      <div className="text-[10px] font-normal text-slate-400 lowercase">
                        {String(slot.start_time).substring(0, 5)} - {String(slot.end_time).substring(0, 5)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {DAYS.map(day => (
                  <tr key={day} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30">
                    <td className="py-3 px-3 font-bold text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap bg-slate-50/50 dark:bg-slate-900/20">
                      {day}
                    </td>
                    {timeSlots.map(slot => {
                      const key = `${day}_${slot.id}`;
                      const cell = matrix[key] || {
                        day_of_week: day,
                        time_slot_id: slot.id,
                        subject_id: "",
                        faculty_id: "",
                        room_id: ""
                      };

                      const isConfigured = Boolean(cell.subject_id);

                      return (
                        <td key={slot.id} className="p-1.5 align-top">
                          <div
                            className={cn(
                              "p-2 rounded-xl border transition-all flex flex-col gap-1.5 min-h-[135px]",
                              isConfigured
                                ? "bg-white dark:bg-slate-800/90 border-blue-200 dark:border-blue-800/80 shadow-xs"
                                : "bg-slate-50/60 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-700/60"
                            )}
                          >
                            {/* Subject Picker */}
                            <div>
                              <select
                                value={cell.subject_id}
                                onChange={e => handleCellChange(day, slot.id, "subject_id", e.target.value)}
                                className={cn(
                                  "w-full text-[11px] rounded-lg px-1.5 py-1 font-bold border focus:outline-none",
                                  isConfigured
                                    ? "bg-blue-50/80 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 border-blue-300 dark:border-blue-700"
                                    : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700"
                                )}
                              >
                                <option value="">Select Subject...</option>
                                {predefinedSubjects.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.code} - {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Faculty Allocation Picker */}
                            <div>
                              <select
                                value={cell.faculty_id}
                                onChange={e => handleCellChange(day, slot.id, "faculty_id", e.target.value)}
                                disabled={!cell.subject_id}
                                className="w-full text-[10px] rounded-lg px-1.5 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none disabled:opacity-40"
                              >
                                <option value="">Assign Faculty...</option>
                                {facultyList.map(f => (
                                  <option key={f.id} value={f.id}>
                                    {f.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Room Picker */}
                            <div>
                              <select
                                value={cell.room_id}
                                onChange={e => handleCellChange(day, slot.id, "room_id", e.target.value)}
                                disabled={!cell.subject_id}
                                className="w-full text-[10px] rounded-lg px-1.5 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none disabled:opacity-40"
                              >
                                <option value="">Select Classroom...</option>
                                {classrooms.map(r => (
                                  <option key={r.id} value={r.id}>
                                    {r.room_number} ({r.building || "Academic Block"})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Clear cell button if filled */}
                            {isConfigured && (
                              <button
                                type="button"
                                onClick={() => handleClearCell(day, slot.id)}
                                className="mt-auto self-end text-[9px] text-red-500 hover:text-red-700 flex items-center gap-0.5 pt-0.5"
                                title="Clear slot"
                              >
                                <Trash2 size={10} /> Clear
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
