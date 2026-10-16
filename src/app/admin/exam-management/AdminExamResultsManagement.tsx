import React, { useState, useEffect, useCallback } from 'react';
import { 
  Award, Plus, Calendar, CheckCircle2, AlertTriangle, RefreshCw, Send, ShieldCheck, 
  UserCheck, Edit3, QrCode, Barcode, Printer, Download, Eye, X, Search, FileCheck, 
  Lock, Unlock, Hash, Users, Filter, Check, Shield 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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

  // COE Extension 1: Hall Ticket Auto-Generator Modal
  const [isHallTicketModalOpen, setIsHallTicketModalOpen] = useState(false);
  const [hallTickets, setHallTickets] = useState<any[]>([]);
  const [isLoadingHallTickets, setIsLoadingHallTickets] = useState(false);
  const [isGeneratingHallTickets, setIsGeneratingHallTickets] = useState(false);
  const [hallTicketFilter, setHallTicketFilter] = useState<'ALL' | 'ELIGIBLE' | 'CONDITIONAL' | 'DETAINED'>('ALL');
  const [hallTicketSearch, setHallTicketSearch] = useState('');
  const [previewHallTicket, setPreviewHallTicket] = useState<any | null>(null);

  // COE Extension 2: Barcoded / Anonymized Answer Sheet Evaluator Hub Modal
  const [isEvaluatorHubModalOpen, setIsEvaluatorHubModalOpen] = useState(false);
  const [evaluatorSubjects, setEvaluatorSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [anonymizedSheets, setAnonymizedSheets] = useState<any[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [isGeneratingTokens, setIsGeneratingTokens] = useState(false);
  const [isSavingBlindMarks, setIsSavingBlindMarks] = useState(false);
  const [isDecodingTokens, setIsDecodingTokens] = useState(false);
  const [sheetSearch, setSheetSearch] = useState('');

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

  // Hall Ticket Handlers
  const handleOpenHallTicketModal = async (exam: any) => {
    setActiveExam(exam);
    setIsHallTicketModalOpen(true);
    setIsLoadingHallTickets(true);
    setHallTicketSearch('');
    setHallTicketFilter('ALL');
    setPreviewHallTicket(null);
    try {
      const res = await client.get(`/exams/${exam.id}/hall-tickets`);
      if (res.data?.data) {
        setHallTickets(res.data.data);
      }
    } catch (err) {
      setHallTickets([]);
    } finally {
      setIsLoadingHallTickets(false);
    }
  };

  const handleGenerateHallTickets = async () => {
    if (!activeExam) return;
    setIsGeneratingHallTickets(true);
    try {
      const res = await client.post(`/exams/${activeExam.id}/hall-tickets/generate`);
      if (res.data?.success) {
        showToast(res.data.message || 'Hall tickets generated successfully!');
        const listRes = await client.get(`/exams/${activeExam.id}/hall-tickets`);
        if (listRes.data?.data) {
          setHallTickets(listRes.data.data);
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to generate hall tickets.', 'error');
    } finally {
      setIsGeneratingHallTickets(false);
    }
  };

  // Evaluator Hub Handlers
  const handleOpenEvaluatorHubModal = async (exam: any) => {
    setActiveExam(exam);
    setIsEvaluatorHubModalOpen(true);
    setAnonymizedSheets([]);
    setSheetSearch('');
    try {
      const res = await client.get(`/exams/${exam.id}/schedule`);
      if (res.data?.data && res.data.data.length > 0) {
        setEvaluatorSubjects(res.data.data);
        const firstSubId = String(res.data.data[0].subject_id);
        setSelectedSubjectId(firstSubId);
        fetchAnonymizedSheets(exam.id, firstSubId);
      } else {
        setEvaluatorSubjects([]);
        setSelectedSubjectId('');
      }
    } catch (err) {
      showToast('Failed to load examination subjects.', 'error');
    }
  };

  const fetchAnonymizedSheets = async (examId: number, subjectId: string) => {
    if (!examId || !subjectId) return;
    setIsLoadingSheets(true);
    try {
      const res = await client.get(`/exams/${examId}/anonymized-evaluations?subject_id=${subjectId}`);
      if (res.data?.data) {
        setAnonymizedSheets(res.data.data);
      }
    } catch (err) {
      setAnonymizedSheets([]);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const handleSubjectSelectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    if (activeExam) {
      fetchAnonymizedSheets(activeExam.id, subjectId);
    }
  };

  const handleGenerateBlindTokens = async () => {
    if (!activeExam || !selectedSubjectId) {
      showToast('Please select a subject first.', 'error');
      return;
    }
    setIsGeneratingTokens(true);
    try {
      const res = await client.post(`/exams/${activeExam.id}/anonymized-evaluations/generate`, {
        subject_id: Number(selectedSubjectId)
      });
      if (res.data?.success) {
        showToast(res.data.message || 'Blind tokens generated!');
        fetchAnonymizedSheets(activeExam.id, selectedSubjectId);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to generate blind tokens.', 'error');
    } finally {
      setIsGeneratingTokens(false);
    }
  };

  const handleSheetMarkChange = (dummyBarcode: string, marksVal: string) => {
    setAnonymizedSheets(prev => prev.map(sheet => {
      if (sheet.dummy_barcode === dummyBarcode) {
        return { ...sheet, marks_obtained: marksVal };
      }
      return sheet;
    }));
  };

  const handleSheetRemarksChange = (dummyBarcode: string, remarksVal: string) => {
    setAnonymizedSheets(prev => prev.map(sheet => {
      if (sheet.dummy_barcode === dummyBarcode) {
        return { ...sheet, evaluator_remarks: remarksVal };
      }
      return sheet;
    }));
  };

  const handleSaveBlindMarks = async () => {
    if (!anonymizedSheets.length) return;
    setIsSavingBlindMarks(true);
    try {
      const items = anonymizedSheets.map(s => ({
        dummy_barcode: s.dummy_barcode,
        marks_obtained: s.marks_obtained,
        evaluator_remarks: s.evaluator_remarks
      }));
      const res = await client.post('/exams/anonymized-evaluations/submit', { items });
      if (res.data?.success) {
        showToast(res.data.message || 'Blind marks saved successfully!');
        if (activeExam && selectedSubjectId) {
          fetchAnonymizedSheets(activeExam.id, selectedSubjectId);
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save blind marks.', 'error');
    } finally {
      setIsSavingBlindMarks(false);
    }
  };

  const handleDecodeBlindTokens = async () => {
    if (!activeExam || !selectedSubjectId) return;
    const confirmDecode = window.confirm(
      'Are you sure you want to unblind and decode these answer sheets? Once decoded, external marks will be merged into official student grade cards and candidate identities will be revealed.'
    );
    if (!confirmDecode) return;

    setIsDecodingTokens(true);
    try {
      const res = await client.post(`/exams/${activeExam.id}/anonymized-evaluations/decode`, {
        subject_id: Number(selectedSubjectId)
      });
      if (res.data?.success) {
        showToast(res.data.message || 'Answer sheets successfully decoded and merged!');
        fetchAnonymizedSheets(activeExam.id, selectedSubjectId);
        fetchExamsAndMetadata();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Decoding failed.', 'error');
    } finally {
      setIsDecodingTokens(false);
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

        <div className="flex items-center gap-2">
          <a
            href="/exam-portal/admin"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Online CBT Studio</span>
          </a>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Examination</span>
          </button>
        </div>
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

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenScheduleModal(ex)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-200"
                    >
                      <Calendar className="w-3.5 h-3.5 text-purple-600" /> Schedule
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEligibilityModal(ex)}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-200"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Eligibility
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenHallTicketModal(ex)}
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-1 hover:bg-indigo-200 shadow-xs border border-indigo-200/50 dark:border-indigo-800/50"
                    >
                      <QrCode className="w-3.5 h-3.5 text-indigo-600" /> Hall Tickets
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEvaluatorHubModal(ex)}
                      className="px-2.5 py-1.5 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 text-xs font-bold flex items-center justify-center gap-1 hover:bg-violet-200 shadow-xs border border-violet-200/50 dark:border-violet-800/50"
                    >
                      <Barcode className="w-3.5 h-3.5 text-violet-600" /> Blind Evaluator
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCalculateResults(ex.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-1 hover:bg-amber-200"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-600" /> Compute SGPA
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePublishResults(ex.id)}
                      disabled={isPublished}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${
                        isPublished ? 'bg-slate-100 text-slate-400 shadow-none' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-500/20'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" /> {isPublished ? 'Published' : 'Publish'}
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
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
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

      {/* COE Extension 1: Hall Ticket Auto-Generator Hub Modal */}
      {isHallTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Hall Ticket & Admit Card Auto-Generator</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-extrabold">COE Engine</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {activeExam?.name} • Automated Seating Allocation & Clearance Checks (Attendance &gt;= 75%, Fee Status)
                  </p>
                </div>
              </div>
              <button onClick={() => setIsHallTicketModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {/* Telemetry Stats Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Total Registered</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{hallTickets.length}</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                  <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Eligible (Cleared)</p>
                  <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {hallTickets.filter(t => t.eligibility_status === 'ELIGIBLE').length}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
                  <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Conditional (Fee Due)</p>
                  <p className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5">
                    {hallTickets.filter(t => t.eligibility_status === 'CONDITIONAL').length}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40">
                  <p className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400">Detained (Attendance)</p>
                  <p className="text-lg font-black text-red-700 dark:text-red-300 mt-0.5">
                    {hallTickets.filter(t => t.eligibility_status === 'DETAINED').length}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={hallTicketSearch}
                      onChange={(e) => setHallTicketSearch(e.target.value)}
                      placeholder="Search Roll No or Student..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <select
                    value={hallTicketFilter}
                    onChange={(e: any) => setHallTicketFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ELIGIBLE">Eligible Only</option>
                    <option value="CONDITIONAL">Conditional Only</option>
                    <option value="DETAINED">Detained Only</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateHallTickets}
                  disabled={isGeneratingHallTickets}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingHallTickets ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingHallTickets ? 'Processing Seating & Clearance...' : 'Batch Auto-Generate Hall Tickets'}</span>
                </button>
              </div>

              {/* Hall Tickets Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                {isLoadingHallTickets ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading hall tickets roster...</div>
                ) : hallTickets.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                    <FileCheck className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No Hall Tickets Generated Yet</p>
                    <p className="text-[11px]">Click "Batch Auto-Generate Hall Tickets" above to check attendance, fee dues, allocate exam halls, and generate official barcoded admit cards.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Admit Card #</th>
                          <th className="px-4 py-3">Roll Number</th>
                          <th className="px-4 py-3">Candidate Name</th>
                          <th className="px-4 py-3 text-center">Attendance</th>
                          <th className="px-4 py-3 text-center">Fee Due</th>
                          <th className="px-4 py-3">Venue / Desk</th>
                          <th className="px-4 py-3 text-center">Clearance Status</th>
                          <th className="px-4 py-3 text-right">Admit Card</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {hallTickets
                          .filter(t => {
                            if (hallTicketFilter !== 'ALL' && t.eligibility_status !== hallTicketFilter) return false;
                            if (!hallTicketSearch.trim()) return true;
                            const query = hallTicketSearch.toLowerCase();
                            const roll = (t.roll_number || '').toLowerCase();
                            const name = `${t.first_name || ''} ${t.last_name || ''}`.toLowerCase();
                            const num = (t.ticket_number || '').toLowerCase();
                            return roll.includes(query) || name.includes(query) || num.includes(query);
                          })
                          .map((ht) => {
                            const isEligible = ht.eligibility_status === 'ELIGIBLE';
                            const isConditional = ht.eligibility_status === 'CONDITIONAL';

                            return (
                              <tr key={ht.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                                  {ht.ticket_number}
                                </td>
                                <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                                  {ht.roll_number}
                                </td>
                                <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-semibold">
                                  {ht.first_name} {ht.last_name}
                                </td>
                                <td className="px-4 py-3 text-center font-bold">
                                  <span className={Number(ht.attendance_percentage) < 75 ? 'text-red-500' : 'text-emerald-500'}>
                                    {ht.attendance_percentage}%
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center font-mono text-[11px]">
                                  {Number(ht.fee_due_amount) > 0 ? (
                                    <span className="text-amber-500 font-bold">₹{Number(ht.fee_due_amount).toLocaleString('en-IN')}</span>
                                  ) : (
                                    <span className="text-emerald-500 font-bold">Cleared</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-[11px]">
                                  <span className="font-semibold">{ht.room_number || 'Main Hall'}</span> • {ht.seat_number || 'Desk #1'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    isEligible 
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                                      : isConditional 
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' 
                                      : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                                  }`}>
                                    {ht.eligibility_status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewHallTicket(ht)}
                                    className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold inline-flex items-center gap-1 border border-indigo-200/60 dark:border-indigo-800/50"
                                  >
                                    <Eye className="w-3 h-3" /> Preview
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40 text-xs text-slate-500">
              <span>Security Note: Tamper-evident hash and QR payload are digitally validated by COE.</span>
              <button
                type="button"
                onClick={() => setIsHallTicketModalOpen(false)}
                className="px-4 py-1.5 rounded-xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Hall Ticket Print/Preview Sub-Modal */}
      {previewHallTicket && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Printable Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">National Institute of Technology & Science</h2>
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Office of the Controller of Examinations (COE Exam Engine)</p>
                <div className="mt-2 inline-block bg-indigo-50 border border-indigo-300 px-2.5 py-0.5 rounded text-[11px] font-extrabold text-indigo-900">
                  OFFICIAL SEMESTER END EXAMINATION ADMIT CARD
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="bg-white p-1 border border-slate-300 rounded-lg shadow-2xs">
                  <QRCodeSVG
                    value={JSON.stringify({
                      ticket: previewHallTicket.ticket_number,
                      roll: previewHallTicket.roll_number,
                      status: previewHallTicket.eligibility_status,
                      barcode: previewHallTicket.barcode_hash
                    })}
                    size={64}
                  />
                </div>
                <p className="font-mono text-[10px] font-extrabold text-slate-800 mt-1">{previewHallTicket.ticket_number}</p>
              </div>
            </div>

            {/* Candidate Identity Card */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs mb-5">
              <div className="col-span-2 space-y-1.5">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Candidate Name</span>
                  <span className="text-sm font-black text-slate-900">{previewHallTicket.first_name} {previewHallTicket.last_name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Roll / Register No</span>
                    <span className="font-mono font-bold text-slate-900">{previewHallTicket.roll_number}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Department / Sem</span>
                    <span className="font-bold text-slate-800">{previewHallTicket.department_name || 'Engineering'} • Sem {previewHallTicket.semester || 'VI'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Assigned Examination Hall</span>
                    <span className="font-bold text-indigo-700">{previewHallTicket.room_number || 'Exam Hall Alpha'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Allocated Desk</span>
                    <span className="font-bold text-indigo-700 font-mono">{previewHallTicket.seat_number || 'Desk #1'}</span>
                  </div>
                </div>
              </div>

              {/* Photo Box & Clearance Seal */}
              <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-200">
                <div className="w-20 h-24 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-center p-1">
                  <UserCheck className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-[9px] font-bold">DIGITAL PHOTO VERIFIED</span>
                </div>
                <span className={`mt-2 px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                  previewHallTicket.eligibility_status === 'ELIGIBLE' 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {previewHallTicket.eligibility_status}
                </span>
              </div>
            </div>

            {/* Barcode Visualizer */}
            <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between mb-5 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Barcode className="w-8 h-8 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Security Barcode Hash</p>
                  <p className="font-mono text-xs text-indigo-300 font-bold">{previewHallTicket.barcode_hash}</p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300">
                Tamper-Evident Hash Sealed
              </span>
            </div>

            {/* Instructions & Signatures */}
            <div className="text-[10px] text-slate-600 space-y-1 border-t border-slate-200 pt-3 mb-6">
              <p className="font-bold text-slate-900">Mandatory Examination Rules:</p>
              <p>1. The candidate must present this Admit Card along with their official University Smart ID Card at the examination entrance.</p>
              <p>2. Report to the allocated hall 30 minutes prior to paper commencement. Entry will be barred 15 minutes post bell.</p>
              <p>3. Electronic wearables, mobile communication devices, and unapproved computational materials are strictly forbidden.</p>
            </div>

            <div className="flex justify-between items-end border-t border-slate-200 pt-6 mb-4">
              <div className="text-center">
                <div className="w-32 border-b border-slate-400 mb-1"></div>
                <p className="text-[10px] font-bold text-slate-600 uppercase">Candidate Signature</p>
              </div>

              <div className="text-center flex flex-col items-center">
                <div className="w-24 h-10 border border-indigo-200 rounded bg-indigo-50/50 flex items-center justify-center text-[10px] font-black text-indigo-800 rotate-[-4deg] mb-1">
                  COE OFFICIAL SEAL
                </div>
                <p className="text-[10px] font-bold text-slate-900 uppercase">Controller of Examinations</p>
                <p className="text-[9px] text-slate-400">Prof. M. Venkatesh</p>
              </div>
            </div>

            {/* Sub-Modal Footer Buttons */}
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 print:hidden">
              <button
                type="button"
                onClick={() => setPreviewHallTicket(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Admit Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COE Extension 2: Barcoded / Anonymized Answer Sheet Evaluator Hub Modal */}
      {isEvaluatorHubModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                  <Barcode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Barcoded & Anonymized Answer Sheet Evaluator Hub</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 font-extrabold">Blind Valuation Engine</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {activeExam?.name} • Cryptographically blinded tokens eliminate evaluator bias during external marking.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsEvaluatorHubModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {/* Security Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-950/40 to-indigo-950/30 border border-violet-500/30 flex items-start gap-3 text-xs text-violet-200">
                <ShieldCheck className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Objective Blind Evaluation Active</p>
                  <p className="text-[11px] text-violet-300 mt-0.5 leading-relaxed">
                    Student names and register numbers are masked into randomized dummy barcodes. Evaluators enter external marks strictly against the barcode token. COE can unblind and decode marks into official transcripts once valuation is finalized.
                  </p>
                </div>
              </div>

              {/* Subject Selector & Actions Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">Examination Subject:</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => handleSubjectSelectChange(e.target.value)}
                    className="w-full sm:w-80 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {evaluatorSubjects.length === 0 && <option value="">No subjects scheduled</option>}
                    {evaluatorSubjects.map(sub => (
                      <option key={sub.subject_id} value={sub.subject_id}>
                        {sub.subject_code} — {sub.subject_name} (Max Ext: {sub.max_external_marks || 60})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleGenerateBlindTokens}
                    disabled={isGeneratingTokens || !selectedSubjectId}
                    className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-violet-600/20"
                  >
                    <Barcode className="w-3.5 h-3.5" />
                    <span>{isGeneratingTokens ? 'Generating...' : 'Generate Blind Barcodes'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveBlindMarks}
                    disabled={isSavingBlindMarks || anonymizedSheets.length === 0}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-blue-600/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSavingBlindMarks ? 'Saving...' : 'Save Evaluator Marks'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDecodeBlindTokens}
                    disabled={isDecodingTokens || anonymizedSheets.length === 0}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-600/20"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{isDecodingTokens ? 'Decoding...' : 'Decode & Merge Marks'}</span>
                  </button>
                </div>
              </div>

              {/* Status Overview Metric Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Total Barcoded Sheets</span>
                  <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{anonymizedSheets.length}</p>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                  <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Blinded (Pending)</span>
                  <p className="text-base font-black text-amber-700 dark:text-amber-300 mt-0.5">
                    {anonymizedSheets.filter(s => s.status === 'BLINDED').length}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40">
                  <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Evaluated by Faculty</span>
                  <p className="text-base font-black text-blue-700 dark:text-blue-300 mt-0.5">
                    {anonymizedSheets.filter(s => s.status === 'EVALUATED').length}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Decoded & Published</span>
                  <p className="text-base font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {anonymizedSheets.filter(s => s.status === 'DECODED').length}
                  </p>
                </div>
              </div>

              {/* Answer Sheets Grid Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                {isLoadingSheets ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading barcoded answer sheets...</div>
                ) : anonymizedSheets.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                    <Barcode className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No Barcode Tokens Generated for this Subject</p>
                    <p className="text-[11px]">Click "Generate Blind Barcodes" to create anonymized valuation tokens for all enrolled candidates.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Dummy Barcode Token</th>
                          <th className="px-4 py-3">Candidate Identity</th>
                          <th className="px-4 py-3 text-center">Max Marks</th>
                          <th className="px-4 py-3 text-center">External Marks Awarded</th>
                          <th className="px-4 py-3">Evaluator Remarks</th>
                          <th className="px-4 py-3 text-center">Grading Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {anonymizedSheets.map((sheet) => {
                          const isDecoded = sheet.status === 'DECODED';
                          const isEvaluated = sheet.status === 'EVALUATED';

                          return (
                            <tr key={sheet.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                              <td className="px-4 py-3 font-mono font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                                <Barcode className="w-4 h-4 text-violet-400" />
                                <span>{sheet.dummy_barcode}</span>
                              </td>
                              <td className="px-4 py-3 text-slate-800 dark:text-slate-200 font-semibold">
                                {isDecoded ? (
                                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                    <Unlock className="w-3.5 h-3.5" />
                                    <span>{sheet.roll_number} ({sheet.student_name})</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="font-mono text-[11px]">***IDENTITY BLINDED***</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-300">
                                {sheet.max_marks || 60.00}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max={sheet.max_marks || 60}
                                  value={sheet.marks_obtained !== null && sheet.marks_obtained !== undefined ? sheet.marks_obtained : ''}
                                  onChange={(e) => handleSheetMarkChange(sheet.dummy_barcode, e.target.value)}
                                  disabled={isDecoded}
                                  placeholder="0.0"
                                  className="w-20 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-center font-mono font-bold text-xs text-slate-900 dark:text-white disabled:opacity-50"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={sheet.evaluator_remarks || ''}
                                  onChange={(e) => handleSheetRemarksChange(sheet.dummy_barcode, e.target.value)}
                                  disabled={isDecoded}
                                  placeholder="e.g. Good derivation"
                                  className="w-full px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white disabled:opacity-50"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  isDecoded 
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                                    : isEvaluated 
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' 
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                }`}>
                                  {sheet.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40 text-xs text-slate-500">
              <span>Security Guarantee: Anonymized tokens are irreversibly audited in tamper-resistant database logs.</span>
              <button
                type="button"
                onClick={() => setIsEvaluatorHubModalOpen(false)}
                className="px-4 py-1.5 rounded-xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300"
              >
                Close Hub
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
