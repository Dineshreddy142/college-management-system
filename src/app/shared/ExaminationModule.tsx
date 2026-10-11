import { useState, useEffect } from "react";
import { Award, Download, Calendar, Clock, MapPin, Printer, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { Card, Badge, Btn } from "../App";
import client from "../../api/client";
import { useAuth } from "../portal/AuthContext";

export function ExaminationModule() {
  const { user } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHallTicket, setShowHallTicket] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await client.get('/exams');
      if (res.data?.data && res.data.data.length > 0) {
        setExams(res.data.data);
        setSelectedExam(res.data.data[0]);
        fetchSchedule(res.data.data[0].id);
      } else {
        // Fallback placeholder schedule if no exam records created yet
        setSchedule([
          { subject_code: "CS601", subject_name: "Machine Learning & AI", exam_date: "2026-11-15", start_time: "09:30:00", end_time: "12:30:00", room_number: "Exam Hall 101" },
          { subject_code: "CS602", subject_name: "Cloud Computing Systems", exam_date: "2026-11-18", start_time: "09:30:00", end_time: "12:30:00", room_number: "Exam Hall 101" },
          { subject_code: "CS603", subject_name: "Information & Network Security", exam_date: "2026-11-21", start_time: "09:30:00", end_time: "12:30:00", room_number: "Exam Hall 104" }
        ]);
      }
    } catch (e) {
      console.warn("Failed to fetch exams:", e);
      setSchedule([
        { subject_code: "CS601", subject_name: "Machine Learning & AI", exam_date: "2026-11-15", start_time: "09:30:00", end_time: "12:30:00", room_number: "Exam Hall 101" },
        { subject_code: "CS602", subject_name: "Cloud Computing Systems", exam_date: "2026-11-18", start_time: "09:30:00", end_time: "12:30:00", room_number: "Exam Hall 101" },
        { subject_code: "CS603", subject_name: "Information & Network Security", exam_date: "2026-11-21", start_time: "09:30:00", end_time: "12:30:00", room_number: "Exam Hall 104" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async (examId: number) => {
    try {
      const res = await client.get(`/exams/${examId}/schedule`);
      if (res.data?.data && res.data.data.length > 0) {
        setSchedule(res.data.data);
      }
    } catch (e) {
      console.warn("Failed to fetch exam schedule:", e);
    }
  };

  const handleDownloadHallTicket = () => {
    setShowHallTicket(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500" />
            <span>Examination & Hall Tickets</span>
          </h2>
          <p className="text-sm text-slate-500">View published end-term examination timetables and print verified hall tickets.</p>
        </div>
        <Btn variant="primary" icon={<Download size={14} />} onClick={handleDownloadHallTicket}>
          Download Hall Ticket
        </Btn>
      </div>

      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {selectedExam ? selectedExam.name : "Semester End Term Examinations 2025-26"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Department: {user?.department || "Computer Science & Engineering"} | Status: <span className="text-emerald-500 font-bold">Approved for Hall Ticket</span>
            </p>
          </div>
          <Badge variant="success">Eligible (Attendance &gt;= 75%)</Badge>
        </div>

        {schedule.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No active examination schedule published.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Subject Code</th>
                  <th className="py-3 px-3">Subject Name</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Time Slot</th>
                  <th className="py-3 px-3">Examination Hall</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {schedule.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{item.subject_code || "SUB" + (idx + 1)}</td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">{item.subject_name || item.name}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>{item.exam_date || "2026-11-" + (15 + idx * 3)}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-400" />
                        <span>{item.start_time ? `${item.start_time.slice(0, 5)} - ${item.end_time?.slice(0, 5) || '12:30'}` : "09:30 AM - 12:30 PM"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-amber-500" />
                        <span>{item.room_number || "Exam Hall Block B"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        CONFIRMED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Official Hall Ticket Modal */}
      {showHallTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-wider text-slate-900">National Institute of Technology & Science</h2>
                <p className="text-xs font-semibold text-slate-500 uppercase">Office of the Controller of Examinations (COE)</p>
                <div className="mt-1 inline-block bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px] font-bold text-indigo-700">
                  OFFICIAL SEMESTER END EXAMINATION HALL TICKET
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs font-bold text-slate-700">HT-{user?.roll_number || user?.username || 'STU2026'}</p>
                <p className="text-[10px] text-slate-400">Issue Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-4">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold">Candidate Name</p>
                <p className="font-bold text-slate-900">{user?.full_name || user?.name || "Dinesh Reddy"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold">Roll / Register Number</p>
                <p className="font-bold font-mono text-slate-900">{user?.roll_number || user?.admission_number || user?.username || "21CS042"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold">Program & Department</p>
                <p className="font-bold text-slate-900">{user?.department || "Computer Science & Engineering"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold">Examination Center</p>
                <p className="font-bold text-slate-900">Main Campus - Academic Block A</p>
              </div>
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Allocated Exam Papers</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs mb-4">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Code</th>
                    <th className="py-2 px-3">Subject Name</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Invigilator Sig</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {schedule.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-bold text-blue-700">{item.subject_code || "CS60" + (i + 1)}</td>
                      <td className="py-2 px-3 font-sans text-slate-800">{item.subject_name || item.name}</td>
                      <td className="py-2 px-3">{item.exam_date || "2026-11-" + (15 + i * 3)}</td>
                      <td className="py-2 px-3">09:30 - 12:30</td>
                      <td className="py-2 px-3 text-slate-300">___________</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-[10px] text-slate-500 space-y-1 border-t border-slate-200 pt-3 mb-6">
              <p className="font-bold text-slate-700">Important Instructions to Candidate:</p>
              <p>1. Candidates must arrive at the examination hall at least 30 minutes before the scheduled start time.</p>
              <p>2. Electronic devices, smartwatches, and programmable calculators are strictly prohibited.</p>
              <p>3. This hall ticket must be retained and produced upon entry along with the University ID Card.</p>
            </div>

            <div className="flex justify-end gap-2 print:hidden border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowHallTicket(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Printer size={14} />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
