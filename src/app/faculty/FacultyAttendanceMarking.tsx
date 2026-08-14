import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MapPin, Users, CheckCircle2, XCircle, AlertCircle, RefreshCw, Save, ShieldCheck, UserCheck } from 'lucide-react';
import client from '../../api/client';

export const FacultyAttendanceMarking: React.FC = () => {
  const [todaysClasses, setTodaysClasses] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  // Selected session for marking
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [rosterStudents, setRosterStudents] = useState<any[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchTodaysClasses = useCallback(async () => {
    setIsLoadingClasses(true);
    try {
      const res = await client.get('/attendance/faculty/todays-classes');
      if (res.data && res.data.data) {
        setTodaysClasses(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching today\'s classes:', err);
      showToast('Failed to load today\'s class schedule.', 'error');
    } finally {
      setIsLoadingClasses(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaysClasses();
  }, [fetchTodaysClasses]);

  const handleOpenRosterModal = async (classItem: any) => {
    setActiveSession(classItem);
    setIsLoadingRoster(true);
    try {
      const res = await client.get(`/attendance/session/${classItem.session_id}/roster`);
      if (res.data && res.data.data) {
        setRosterStudents(res.data.data);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load class roster.', 'error');
      setActiveSession(null);
    } finally {
      setIsLoadingRoster(false);
    }
  };

  const handleMarkAllPresent = () => {
    setRosterStudents(prev => prev.map(s => ({ ...s, current_status: 'PRESENT' })));
    showToast('All registered students marked PRESENT.');
  };

  const handleStatusChange = (studentId: number, newStatus: string) => {
    setRosterStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, current_status: newStatus } : s));
  };

  const handleSubmitAttendance = async () => {
    if (!activeSession) return;

    setIsSubmitting(true);
    try {
      const recordsPayload = rosterStudents.map(s => ({
        student_id: s.student_id,
        status: s.current_status
      }));

      const res = await client.post(`/attendance/session/${activeSession.session_id}/submit`, {
        records: recordsPayload
      });

      if (res.data && res.data.success) {
        showToast(res.data.message || 'Attendance submitted successfully!');
        setActiveSession(null);
        fetchTodaysClasses();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit attendance.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Summary counters for active roster
  const presentCount = rosterStudents.filter(s => s.current_status === 'PRESENT').length;
  const absentCount = rosterStudents.filter(s => s.current_status === 'ABSENT').length;
  const lateCount = rosterStudents.filter(s => s.current_status === 'LATE').length;
  const excusedCount = rosterStudents.filter(s => s.current_status === 'EXCUSED').length;

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${
          toastMessage.type === 'success' ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40' : 'bg-red-950/90 text-red-200 border-red-500/40'
        }`}>
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs opacity-70">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-purple-500/20">
              <UserCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Faculty Class Attendance Portal
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Subject & period-wise attendance generated automatically from your Phase 5 timetable entries.
          </p>
        </div>

        <button
          onClick={fetchTodaysClasses}
          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Today's Schedule</span>
        </button>
      </div>

      {/* Today's Classes Schedule Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-500" /> Today's Scheduled Teaching Classes
        </h3>

        {isLoadingClasses ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading today's class schedule...</div>
        ) : todaysClasses.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 text-center">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Classes Scheduled for Today</h4>
            <p className="text-xs text-slate-500 mt-1">You have no active timetable entries for today's date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaysClasses.map((item) => {
              const isSubmitted = item.session_status === 'SUBMITTED';

              return (
                <div
                  key={item.timetable_entry_id}
                  className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                        {item.subject_code}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isSubmitted ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}>
                        {isSubmitted ? 'SUBMITTED' : 'OPEN FOR MARKING'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                      {item.subject_name}
                    </h4>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <p className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        <Users className="w-3.5 h-3.5 text-purple-500" /> Section {item.section_name}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {item.start_time || '10:00'} - {item.end_time || '11:00'} ({item.slot_title || 'Period 1'})
                      </p>
                      {item.room_number && (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> Room {item.room_number} ({item.building_name || 'Main Block'})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => handleOpenRosterModal(item)}
                      className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                        isSubmitted
                          ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-none'
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{isSubmitted ? 'Edit Attendance Roster' : 'Mark Attendance'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attendance Roster Modal */}
      {activeSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                    {activeSession.subject_code}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Section {activeSession.section_name}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {activeSession.subject_name} — Class Attendance Roster
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-bold flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark All Present</span>
                </button>
                <button onClick={() => setActiveSession(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600">
                  &times;
                </button>
              </div>
            </div>

            {/* Roster Live Stats Bar */}
            <div className="px-6 py-2.5 bg-purple-50/50 dark:bg-purple-950/30 border-b border-purple-100 dark:border-purple-900/40 grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{presentCount}</span>
                <p className="text-[10px] text-slate-500">Present</p>
              </div>
              <div>
                <span className="font-bold text-red-600 dark:text-red-400">{absentCount}</span>
                <p className="text-[10px] text-slate-500">Absent</p>
              </div>
              <div>
                <span className="font-bold text-amber-600 dark:text-amber-400">{lateCount}</span>
                <p className="text-[10px] text-slate-500">Late</p>
              </div>
              <div>
                <span className="font-bold text-blue-600 dark:text-blue-400">{excusedCount}</span>
                <p className="text-[10px] text-slate-500">Excused</p>
              </div>
            </div>

            {/* Roster Table */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {isLoadingRoster ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading registered student roster...</div>
              ) : rosterStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No Phase 4 registered students found for this subject and section.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-2.5">Roll Number</th>
                      <th className="px-4 py-2.5">Student Name</th>
                      <th className="px-4 py-2.5 text-center">Attendance Status Selection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rosterStudents.map((st) => (
                      <tr key={st.student_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                        <td className="px-4 py-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                          {st.roll_number || st.admission_number || 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {st.first_name} {st.last_name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 gap-1">
                            {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((stVal) => {
                              const isSelected = st.current_status === stVal;

                              return (
                                <button
                                  key={stVal}
                                  type="button"
                                  onClick={() => handleStatusChange(st.student_id, stVal)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-colors ${
                                    isSelected
                                      ? stVal === 'PRESENT' ? 'bg-emerald-600 text-white shadow-xs'
                                      : stVal === 'ABSENT' ? 'bg-red-600 text-white shadow-xs'
                                      : stVal === 'LATE' ? 'bg-amber-500 text-white shadow-xs'
                                      : 'bg-blue-600 text-white shadow-xs'
                                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                  }`}
                                >
                                  {stVal}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/40">
              <button
                type="button"
                onClick={() => setActiveSession(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitAttendance}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Submit Attendance</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
