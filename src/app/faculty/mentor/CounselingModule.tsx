import { useState, useEffect } from "react";
import { Plus, User, FileText, CheckCircle, Clock, Calendar } from "lucide-react";
import { Card, Badge, Btn, Avatar } from "../../App";
import client from "../../../api/client";

interface StudentOption {
  id: number;
  name: string;
  roll: string;
}

interface CounselingSession {
  id: string;
  studentName: string;
  studentRoll: string;
  date: string;
  discussion: string;
  actionPlan: string;
  createdAt: string;
}

export function CounselingModule() {
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [sessions, setSessions] = useState<CounselingSession[]>(() => {
    try {
      const saved = localStorage.getItem("cms_counseling_sessions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [sessionDate, setSessionDate] = useState<string>("");
  const [discussion, setDiscussion] = useState<string>("");
  const [actionPlan, setActionPlan] = useState<string>("");
  const [error, setError] = useState<string>("");

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
        console.error("Failed to load students for counseling", err);
      });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cms_counseling_sessions", JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to persist counseling sessions", e);
    }
  }, [sessions]);

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !sessionDate || !discussion.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    const studentObj = students.find(s => s.id.toString() === selectedStudentId);
    const newSession: CounselingSession = {
      id: "CS-" + Date.now().toString().slice(-6),
      studentName: studentObj ? studentObj.name : "Assigned Student",
      studentRoll: studentObj ? studentObj.roll : "N/A",
      date: sessionDate,
      discussion: discussion.trim(),
      actionPlan: actionPlan.trim(),
      createdAt: new Date().toISOString().split("T")[0]
    };

    setSessions(prev => [newSession, ...prev]);
    setShowForm(false);
    setDiscussion("");
    setActionPlan("");
    setSessionDate("");
    setError("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Counseling Sessions</h2>
          <p className="text-sm text-slate-500">Record and track 1-on-1 student counseling history.</p>
        </div>
        <Btn variant="primary" icon={<Plus size={16} />} onClick={() => { setError(""); setShowForm(!showForm); }}>
          {showForm ? "Cancel" : "New Session"}
        </Btn>
      </div>

      {showForm && (
        <Card className="p-5 border-2 border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-900/10">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Record New Session</h3>
          <p className="text-xs text-slate-500 mb-4">Document mentorship discussions and student action items.</p>

          {error && (
            <div className="mb-4 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSaveSession} className="space-y-4">
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
                    <option value="">No students enrolled</option>
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Session Date</label>
                <input 
                  type="date" 
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Discussion Details</label>
                <textarea 
                  rows={3} 
                  value={discussion}
                  onChange={(e) => setDiscussion(e.target.value)}
                  placeholder="Key concerns, academic blockers, or career counseling topics discussed..."
                  required
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Action Plan</label>
                <textarea 
                  rows={2} 
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  placeholder="Next steps, deadlines, and agreed goals for the student..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Btn>
              <Btn variant="primary" type="submit">Save Session</Btn>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xs text-slate-400">No counseling session records available. Click "New Session" to record a session.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.map(s => (
              <div key={s.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                <div className="flex items-start gap-3">
                  <Avatar name={s.studentName} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{s.studentName}</h4>
                      <Badge variant="info" size="sm">{s.studentRoll}</Badge>
                      <Badge variant="default" size="sm">{s.date}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">{s.discussion}</p>
                    {s.actionPlan && (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1 font-medium">
                        <CheckCircle size={12} /> Action Plan: {s.actionPlan}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-mono self-end md:self-center">
                  {s.id}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
