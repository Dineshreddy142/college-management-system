import React, { useState, useEffect, useCallback } from 'react';
import { Award, Plus, Calendar, CheckCircle2, AlertTriangle, RefreshCw, Send, ShieldCheck, UserCheck, Edit3 } from 'lucide-react';
import client from '../../../api/client';

export const AdminExamResultsManagement: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<any | null>(null);

  // New Exam Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamTypeId, setNewExamTypeId] = useState('');
  const [newDepartmentId, setNewDepartmentId] = useState('');
  const [newSemesterId, setNewSemesterId] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [examSchedules, setExamSchedules] = useState<any[]>([]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Eligibility Modal
  const [isEligibilityModalOpen, setIsEligibilityModalOpen] = useState(false);
  const [eligibilityList, setEligibilityList] = useState<any[]>([]);
  const [isLoadingEligibility, setIsLoadingEligibility] = useState(false);

  // Override Modal
  const [overrideStudentId, setOverrideStudentId] = useState<number | null>(null);
  const [overrideSubjectId, setOverrideSubjectId] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchExamsAndMetadata = useCallback(async () => {
    setIsLoading(true);
    try {
      const [eRes, tRes, dRes, semRes, roomRes] = await Promise.allSettled([
        client.get('/exams'),
        client.get('/exams/types'),
        client.get('/v1/academic/departments'),
        client.get('/v1/academic/semesters'),
        client.get('/academic/classrooms')
      ]);

      if (eRes.status === 'fulfilled' && eRes.value.data?.data) {
        setExams(eRes.value.data.data);
      }
      if (tRes.status === 'fulfilled' && tRes.value.data?.data) {
        setExamTypes(tRes.value.data.data);
        if (tRes.value.data.data.length > 0) {
          setNewExamTypeId(String(tRes.value.data.data[0].id));
        }
      }
      if (dRes.status === 'fulfilled' && dRes.value.data) {
        setDepartments(Array.isArray(dRes.value.data) ? dRes.value.data : dRes.value.data.data || []);
      }
      if (semRes.status === 'fulfilled' && semRes.value.data) {
        setSemesters(Array.isArray(semRes.value.data) ? semRes.value.data : semRes.value.data.data || []);
      }
      if (roomRes.status === 'fulfilled' && roomRes.value.data) {
        setClassrooms(Array.isArray(roomRes.value.data) ? roomRes.value.data : roomRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching exam metadata:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExamsAndMetadata();
  }, [fetchExamsAndMetadata]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamName.trim() || !newExamTypeId) {
      showToast('Exam name and Exam Type are required.', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const res = await client.post('/exams', {
        name: newExamName.trim(),
        exam_type_id: Number(newExamTypeId),
        department_id: newDepartmentId ? Number(newDepartmentId) : null,
        semester_id: newSemesterId ? Number(newSemesterId) : null,
        start_date: newStartDate || null,
        end_date: newEndDate || null
      });

      if (res.data && res.data.success) {
        showToast(res.data.message || 'Exam created successfully!');
        setIsCreateModalOpen(false);
        setNewExamName('');
        fetchExamsAndMetadata();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create exam.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenScheduleModal = async (exam: any) => {
    setActiveExam(exam);
    setIsScheduleModalOpen(true);
    try {
      const res = await client.get(`/exams/${exam.id}/schedule`);
      if (res.data && res.data.data) {
        setExamSchedules(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load exam schedule subjects.', 'error');
    }
  };

  const handleScheduleChange = (subId: number, field: string, val: any) => {
    setExamSchedules(prev => prev.map(s => s.subject_id === subId ? { ...s, [field]: val } : s));
  };

  const handleSaveSchedule = async () => {
    if (!activeExam) return;

    setIsSavingSchedule(true);
    try {
      const res = await client.post(`/exams/${activeExam.id}/schedule`, {
        schedules: examSchedules
      });

      if (res.data && res.data.success) {
        showToast(res.data.message || 'Exam schedule saved!');
        setIsScheduleModalOpen(false);
        fetchExamsAndMetadata();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Schedule conflict error.', 'error');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleOpenEligibilityModal = async (exam: any) => {
    setActiveExam(exam);
    setIsEligibilityModalOpen(true);
    setIsLoadingEligibility(true);
    try {
      const res = await client.get(`/exams/${exam.id}/eligibility`);
      if (res.data && res.data.data) {
        setEligibilityList(res.data.data);
      }
    } catch (err) {
      showToast('Failed to calculate eligibility.', 'error');
    } finally {
      setIsLoadingEligibility(false);
    }
  };

  const handleSaveEligibilityOverride = async () => {
    if (!activeExam || !overrideStudentId || !overrideSubjectId || !overrideReason.trim()) {
      showToast('Mandatory Audit Reason required for eligibility override.', 'error');
      return;
    }

    setIsSubmittingOverride(true);
    try {
      const res = await client.post(`/exams/${activeExam.id}/eligibility/override`, {
        student_id: overrideStudentId,
        subject_id: overrideSubjectId,
        is_eligible: 1,
        reason: overrideReason.trim()
      });

      if (res.data && res.data.success) {
        showToast(res.data.message || 'Eligibility override approved.');
        setOverrideStudentId(null);
        setOverrideReason('');
        handleOpenEligibilityModal(activeExam);
      }
    } catch (err: any) {
      showToast('Override execution failed.', 'error');
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  const handleCalculateResults = async (examId: number) => {
    try {
      const res = await client.post(`/exams/${examId}/calculate-results`);
      if (res.data && res.data.success) {
        showToast(res.data.message || 'SGPA, CGPA, and Backlogs calculated successfully!');
        fetchExamsAndMetadata();
      }
    } catch (err: any) {
      showToast('Results calculation failed.', 'error');
    }
  };

  const handlePublishResults = async (examId: number) => {
    try {
      const res = await client.post(`/exams/${examId}/publish`);
      if (res.data && res.data.success) {
        showToast(res.data.message || 'Exam results published! Students can now view their marksheets.');
        fetchExamsAndMetadata();
      }
    } catch (err: any) {
      showToast('Publishing results failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${
          toastMessage.type === 'success' ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40' : 'bg-red-950/90 text-red-200 border-red-500/40'
        }`}>
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs opacity-70">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Examination & Results Management Control
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Schedule examinations, calculate attendance-based eligibility, compute SGPA/CGPA/Backlogs, and publish official grade cards.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Examination</span>
        </button>
      </div>

      {/* Examination Roster Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading examinations roster...</div>
        ) : exams.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 text-center">
            <Award className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Examinations Configured</h4>
            <p className="text-xs text-slate-500 mt-1">Click "Create New Examination" to set up an upcoming exam.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((ex) => {
              const isPublished = ex.status === 'PUBLISHED';

              return (
                <div key={ex.id} className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                        {ex.exam_type_name || 'EXAM'}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isPublished ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}>
                        {ex.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                      {ex.name}
                    </h4>

                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      <p>{ex.department_name || 'All Departments'} • Semester {ex.semester_name || ex.semester_id || 'All'}</p>
                      <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Start: {ex.start_date || 'TBD'} — End: {ex.end_date || 'TBD'}</p>
                      <p className="font-semibold text-purple-600">{ex.subjects_count || 0} Subjects Included</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenScheduleModal(ex)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Schedule Rooms
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEligibilityModal(ex)}
                      className="px-3 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Attendance Eligibility
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCalculateResults(ex.id)}
                      className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Award className="w-3.5 h-3.5" /> Compute SGPA/CGPA
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePublishResults(ex.id)}
                      disabled={isPublished}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${
                        isPublished ? 'bg-slate-100 text-slate-400 shadow-none' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-500/20'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" /> {isPublished ? 'Published' : 'Publish Results'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Exam Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Examination</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <form onSubmit={handleCreateExam} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Examination Title *</label>
                <input
                  type="text"
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value)}
                  placeholder="e.g. End Semester Examination Dec 2026"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Exam Type *</label>
                <select
                  value={newExamTypeId}
                  onChange={(e) => setNewExamTypeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                >
                  {examTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <select
                    value={newDepartmentId}
                    onChange={(e) => setNewDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
                  <select
                    value={newSemesterId}
                    onChange={(e) => setNewSemesterId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">All Semesters</option>
                    {semesters.map(s => <option key={s.id} value={s.id}>Semester {s.name || s.id}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={isCreating} className="px-4 py-2 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md">Create Examination</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Builder Modal */}
      {isScheduleModalOpen && activeExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Exam Schedule & Room Assignment — {activeExam.name}</h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {examSchedules.map((item) => (
                <div key={item.subject_id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-purple-600 font-mono">{item.subject_code} — {item.subject_name}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{item.credits || 3} Credits</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Exam Date</label>
                      <input
                        type="date"
                        value={item.exam_date ? item.exam_date.slice(0, 10) : ''}
                        onChange={(e) => handleScheduleChange(item.subject_id, 'exam_date', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Start Time</label>
                      <input
                        type="time"
                        value={item.start_time || ''}
                        onChange={(e) => handleScheduleChange(item.subject_id, 'start_time', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">End Time</label>
                      <input
                        type="time"
                        value={item.end_time || ''}
                        onChange={(e) => handleScheduleChange(item.subject_id, 'end_time', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Assigned Room</label>
                      <select
                        value={item.room_id || ''}
                        onChange={(e) => handleScheduleChange(item.subject_id, 'room_id', e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                      >
                        <option value="">Select Room</option>
                        {classrooms.map(rm => <option key={rm.id} value={rm.id}>Room {rm.room_number} ({rm.building_name || 'Main'})</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/40">
              <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="button" onClick={handleSaveSchedule} disabled={isSavingSchedule} className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md">Save Exam Schedule</button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Eligibility Modal */}
      {isEligibilityModalOpen && activeExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attendance Exam Eligibility Roster (Min 75%) — {activeExam.name}</h3>
              <button onClick={() => setIsEligibilityModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {isLoadingEligibility ? (
                <div className="p-8 text-center text-xs text-slate-400">Computing student eligibility...</div>
              ) : eligibilityList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No registered students found for eligibility check.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-2.5">Roll Number</th>
                      <th className="px-4 py-2.5">Student Name</th>
                      <th className="px-4 py-2.5 text-center">Attendance %</th>
                      <th className="px-4 py-2.5 text-center">Eligibility Status</th>
                      <th className="px-4 py-2.5 text-right">Audit Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {eligibilityList.map((st, idx) => {
                      const isEligible = st.is_eligible === 1;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                          <td className="px-4 py-3 font-mono font-bold text-purple-600">{st.roll_number || 'N/A'}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{st.first_name} {st.last_name}</td>
                          <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">{st.attendance_percentage}%</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isEligible ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                            }`}>
                              {isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!isEligible && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOverrideStudentId(st.student_id);
                                  setOverrideSubjectId(st.subject_id);
                                }}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              >
                                Override
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Override Audit Section */}
            {overrideStudentId && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-900/40 space-y-2 text-xs">
                <p className="font-bold text-amber-900 dark:text-amber-200">Approve Administrative Eligibility Override</p>
                <input
                  type="text"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Enter mandatory audit reason (e.g. Medical Exemption Approved)..."
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setOverrideStudentId(null)} className="px-3 py-1 text-slate-500">Cancel</button>
                  <button type="button" onClick={handleSaveEligibilityOverride} disabled={isSubmittingOverride} className="px-3 py-1 rounded-lg bg-amber-600 text-white font-bold">Confirm Override</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
