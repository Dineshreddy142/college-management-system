import React, { useState, useEffect, useCallback } from 'react';
import { Award, Save, RefreshCw, AlertCircle, CheckCircle2, Search, BookOpen } from 'lucide-react';
import client from '../../api/client';

export const FacultyMarksEntry: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const [markConfig, setMarkConfig] = useState<any | null>(null);
  const [studentsRoster, setStudentsRoster] = useState<any[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchExamsAndSubjects = useCallback(async () => {
    try {
      const [eRes, sRes] = await Promise.allSettled([
        client.get('/exams'),
        client.get('/faculty/classes')
      ]);

      if (eRes.status === 'fulfilled' && eRes.value.data?.data) {
        const activeExams = eRes.value.data.data;
        setExams(activeExams);
        if (activeExams.length > 0) {
          setSelectedExamId(String(activeExams[0].id));
        }
      }

      if (sRes.status === 'fulfilled' && sRes.value.data) {
        const activeSubs = Array.isArray(sRes.value.data) ? sRes.value.data : [];
        setSubjects(activeSubs);
        if (activeSubs.length > 0) {
          setSelectedSubjectId(String(activeSubs[0].allocation_id || activeSubs[0].id));
        }
      }
    } catch (err) {
      console.error('Error fetching exams & assigned subjects:', err);
    }
  }, []);

  useEffect(() => {
    fetchExamsAndSubjects();
  }, [fetchExamsAndSubjects]);

  const fetchMarksRoster = useCallback(async () => {
    if (!selectedExamId || !selectedSubjectId) return;

    setIsLoadingRoster(true);
    try {
      const res = await client.get('/faculty/marks-entry', {
        params: {
          examination_id: selectedExamId,
          subject_id: selectedSubjectId
        }
      });

      if (res.data) {
        setMarkConfig(res.data.config);
        setStudentsRoster(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching marks roster:', err);
      showToast(err.response?.data?.message || 'Failed to load evaluation roster.', 'error');
    } finally {
      setIsLoadingRoster(false);
    }
  }, [selectedExamId, selectedSubjectId]);

  useEffect(() => {
    if (selectedExamId && selectedSubjectId) {
      fetchMarksRoster();
    }
  }, [selectedExamId, selectedSubjectId, fetchMarksRoster]);

  const handleMarkChange = (studentId: number, field: 'internal_marks' | 'external_marks', val: string) => {
    const numVal = parseFloat(val) || 0;
    setStudentsRoster(prev => prev.map(s => {
      if (s.student_id === studentId) {
        const intVal = field === 'internal_marks' ? numVal : (parseFloat(s.internal_marks) || 0);
        const extVal = field === 'external_marks' ? numVal : (parseFloat(s.external_marks) || 0);
        const totVal = intVal + extVal;
        return {
          ...s,
          [field]: val,
          total_marks: totVal.toFixed(2)
        };
      }
      return s;
    }));
  };

  const handleSubmitMarks = async () => {
    if (!selectedExamId || !selectedSubjectId) return;

    const maxInt = parseFloat(markConfig?.max_internal_marks) || 40.0;
    const maxExt = parseFloat(markConfig?.max_external_marks) || 60.0;

    // Validate marks before sending
    for (const st of studentsRoster) {
      const intVal = parseFloat(st.internal_marks) || 0;
      const extVal = parseFloat(st.external_marks) || 0;

      if (intVal < 0 || intVal > maxInt) {
        showToast(`Validation Error: Internal marks (${intVal}) for student ${st.first_name} exceed max limit (${maxInt}).`, 'error');
        return;
      }
      if (extVal < 0 || extVal > maxExt) {
        showToast(`Validation Error: External marks (${extVal}) for student ${st.first_name} exceed max limit (${maxExt}).`, 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const marksPayload = studentsRoster.map(s => ({
        student_id: s.student_id,
        internal_marks: parseFloat(s.internal_marks) || 0,
        external_marks: parseFloat(s.external_marks) || 0
      }));

      const res = await client.post('/faculty/marks/submit', {
        examination_id: Number(selectedExamId),
        subject_id: Number(selectedSubjectId),
        marks: marksPayload
      });

      if (res.data && res.data.success) {
        showToast(res.data.message || 'Marks submitted successfully!');
        fetchMarksRoster();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit marks.', 'error');
    } finally {
      setIsSubmitting(false);
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
              <Award className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Faculty Examination Marks Entry Portal
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Internal & external marks evaluation for assigned teaching subjects with automated validation.
          </p>
        </div>

        <button
          onClick={fetchMarksRoster}
          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Evaluation Grid</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-xs">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Active Examination *</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold"
          >
            {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.exam_type_name || 'Exam'})</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Assigned Subject *</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold"
          >
            {subjects.map(s => <option key={s.allocation_id || s.id} value={s.subject_id || s.id}>{s.subject_code || 'SUB'} - {s.subject_name || s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Marks Spreadsheet Card */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
              Max Internal: {markConfig?.max_internal_marks || 40} | Max External: {markConfig?.max_external_marks || 60} | Passing: {markConfig?.passing_marks || 40}
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              {markConfig?.subject_name || 'Subject Marks Roster'}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleSubmitMarks}
            disabled={isSubmitting || studentsRoster.length === 0}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/20 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Submit Marks</span>
              </>
            )}
          </button>
        </div>

        <div className="overflow-x-auto">
          {isLoadingRoster ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading student marks roster...</div>
          ) : studentsRoster.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No registered students found for this examination and subject.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3 text-center w-36">Internal Marks (Max 40)</th>
                  <th className="px-4 py-3 text-center w-36">External Marks (Max 60)</th>
                  <th className="px-4 py-3 text-center">Total (Max 100)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentsRoster.map((st) => (
                  <tr key={st.student_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                      {st.roll_number || st.admission_number || 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {st.first_name} {st.last_name}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max={markConfig?.max_internal_marks || 40}
                        value={st.internal_marks}
                        onChange={(e) => handleMarkChange(st.student_id, 'internal_marks', e.target.value)}
                        className="w-24 px-2.5 py-1.5 rounded-xl text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                      />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max={markConfig?.max_external_marks || 60}
                        value={st.external_marks}
                        onChange={(e) => handleMarkChange(st.student_id, 'external_marks', e.target.value)}
                        className="w-24 px-2.5 py-1.5 rounded-xl text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                      />
                    </td>

                    <td className="px-4 py-3 text-center font-extrabold text-slate-900 dark:text-white">
                      {st.total_marks || '0.00'}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        st.mark_status === 'SUBMITTED' || st.mark_status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}>
                        {st.mark_status || 'DRAFT'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
};
