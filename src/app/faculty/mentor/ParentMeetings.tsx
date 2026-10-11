import { useState, useEffect } from "react";
import { Plus, Video, Users, MapPin, Calendar, Clock, Download, FileText, Phone } from "lucide-react";
import { Card, Badge, Btn, Avatar } from "../../App";
import client from "../../../api/client";

interface StudentOption {
  id: number;
  name: string;
  roll: string;
}

interface MeetingItem {
  id: string;
  studentName: string;
  studentRoll: string;
  dateTime: string;
  mode: string;
  agenda: string;
  status: "Scheduled" | "Completed" | "Cancelled";
}

export function ParentMeetings() {
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [meetings, setMeetings] = useState<MeetingItem[]>(() => {
    try {
      const saved = localStorage.getItem("cms_parent_meetings");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [meetingDateTime, setMeetingDateTime] = useState("");
  const [meetingMode, setMeetingMode] = useState("Online (G-Meet/Zoom)");
  const [agenda, setAgenda] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    client.get('/student')
      .then(res => {
        const raw = res.data?.data || res.data || [];
        const mapped = raw.map((s: any) => ({
          id: s.id,
          name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || s.username || 'Student',
          roll: s.admission_number || s.roll_number || `STU${s.id}`
        }));
        setStudents(mapped);
        if (mapped.length > 0 && !selectedStudentId) {
          setSelectedStudentId(mapped[0].id.toString());
        }
      })
      .catch(err => {
        console.error("Failed to load students for parent meeting", err);
      });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cms_parent_meetings", JSON.stringify(meetings));
    } catch (e) {
      console.error("Failed to persist parent meetings", e);
    }
  }, [meetings]);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !meetingDateTime || !agenda.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    const studentObj = students.find(s => s.id.toString() === selectedStudentId);
    const newMeeting: MeetingItem = {
      id: "PM-" + Date.now().toString().slice(-6),
      studentName: studentObj ? studentObj.name : "Student Parent",
      studentRoll: studentObj ? studentObj.roll : "N/A",
      dateTime: meetingDateTime,
      mode: meetingMode,
      agenda: agenda.trim(),
      status: "Scheduled"
    };

    setMeetings(prev => [newMeeting, ...prev]);
    setShowForm(false);
    setAgenda("");
    setMeetingDateTime("");
    setError("");
  };

  const handleAddToCalendar = () => {
    if (!meetingDateTime || !agenda.trim()) {
      setError("Please specify meeting date/time and agenda before creating calendar event.");
      return;
    }
    const studentObj = students.find(s => s.id.toString() === selectedStudentId);
    const title = `Parent Meeting: ${studentObj ? studentObj.name : 'Student'} (${agenda})`;
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//College Management System//Parent Meeting//EN
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:${agenda} - Mode: ${meetingMode}
DTSTART:${meetingDateTime.replace(/[-:]/g, '')}00
DURATION:PT45M
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'parent_meeting.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Parent Communication</h2>
          <p className="text-sm text-slate-500">Schedule and record meetings with parents.</p>
        </div>
        <Btn variant="primary" icon={<Plus size={16} />} onClick={() => { setError(""); setShowForm(!showForm); }}>
          {showForm ? "Cancel" : "Schedule Meeting"}
        </Btn>
      </div>

      {showForm && (
        <Card className="p-5 border-2 border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-900/10">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Schedule New Meeting</h3>
          <p className="text-xs text-slate-500 mb-4">Set up an official discussion with a student's parents or guardian.</p>

          {error && (
            <div className="mb-4 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSendInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Student</label>
                <select 
                  value={selectedStudentId} 
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {students.length === 0 ? (
                    <option value="">No students available</option>
                  ) : (
                    students.map(s => (
                      <option key={s.id} value={s.id.toString()}>
                        {s.name} ({s.roll})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Meeting Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={meetingDateTime}
                  onChange={(e) => setMeetingDateTime(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Meeting Mode</label>
                <select 
                  value={meetingMode} 
                  onChange={(e) => setMeetingMode(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Online (G-Meet/Zoom)">Online (G-Meet/Zoom)</option>
                  <option value="Offline (Campus)">Offline (Campus)</option>
                  <option value="Phone Call">Phone Call</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Agenda / Reason</label>
                <input 
                  type="text" 
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="e.g. Discuss mid-term results & attendance" 
                  required
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="outline" type="button" icon={<Calendar size={14} />} onClick={handleAddToCalendar}>
                Add to Calendar
              </Btn>
              <Btn variant="primary" type="submit">
                Send Invite
              </Btn>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meetings.length === 0 ? (
          <Card className="p-12 text-center text-slate-400 text-sm col-span-full">
            No parent meetings scheduled. Click "Schedule Meeting" to create one.
          </Card>
        ) : (
          meetings.map(m => (
            <Card key={m.id} className="p-5 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant={m.mode.includes("Online") ? "info" : m.mode.includes("Offline") ? "success" : "default"} size="sm">
                    {m.mode}
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">{m.id}</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={m.studentName} size="md" />
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{m.studentName}</h4>
                    <p className="text-xs text-slate-500 font-mono">{m.studentRoll}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  {m.agenda}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-slate-400" />
                  {new Date(m.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                <Badge variant="success" size="sm">Scheduled</Badge>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
