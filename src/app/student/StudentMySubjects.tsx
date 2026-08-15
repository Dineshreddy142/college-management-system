import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, CheckCircle2, Lock, Sparkles, RefreshCw, AlertCircle, Info, UserCheck, ShieldCheck } from 'lucide-react';
import client from '../../api/client';
import { ElectiveSubjectDetailsModal } from './ElectiveSubjectDetailsModal';

export const StudentMySubjects: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my-subjects' | 'registration'>('my-subjects');

  const [studentContext, setStudentContext] = useState<any | null>(null);
  const [registeredSubjects, setRegisteredSubjects] = useState<any[]>([]);
  const [curriculumData, setCurriculumData] = useState<any | null>(null);

  const [selectedElectives, setSelectedElectives] = useState<number[]>([]);
  const [inspectSubject, setInspectSubject] = useState<any | null>(null);

  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Academic Context
  const fetchAcademicContext = useCallback(async () => {
    setIsLoadingContext(true);
    try {
      const res = await client.get('/student/academic-context');
      if (res.data && res.data.data) {
        setStudentContext(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching student academic context:', err);
    } finally {
      setIsLoadingContext(false);
    }
  }, []);

  // Fetch My Registered Subjects
  const fetchMySubjects = useCallback(async () => {
    try {
      const res = await client.get('/student/my-subjects');
      if (res.data && res.data.data) {
        setRegisteredSubjects(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching registered subjects:', err);
    }
  }, []);

  // Fetch Semester Curriculum & Electives
  const fetchCurriculum = useCallback(async () => {
    setIsLoadingCurriculum(true);
    try {
      const res = await client.get('/student/my-curriculum');
      if (res.data && res.data.data) {
        setCurriculumData(res.data.data);

        // Pre-select already registered electives
        const existingElectives = (res.data.data.existing_registrations || [])
          .filter((r: any) => r.registration_type === 'ELECTIVE')
          .map((r: any) => r.subject_id);
        setSelectedElectives(existingElectives);
      }
    } catch (err) {
      console.error('Error fetching curriculum subjects:', err);
    } finally {
      setIsLoadingCurriculum(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicContext();
    fetchMySubjects();
    fetchCurriculum();
  }, [fetchAcademicContext, fetchMySubjects, fetchCurriculum]);

  const isWindowClosed = studentContext?.registration_window?.status === 'CLOSED';

  // Toggle Elective selection (1 per group)
  const handleSelectElective = (subjectId: number, groupSubjects: any[]) => {
    if (isWindowClosed) return;
    const groupSubjectIds = groupSubjects.map(s => s.subject_id);

    setSelectedElectives(prev => {
      // Remove all current selections from this group
      const cleaned = prev.filter(id => !groupSubjectIds.includes(id));
      // Toggle new selection
      if (!prev.includes(subjectId)) {
        cleaned.push(subjectId);
      }
      return cleaned;
    });
  };

  const handleValidateAndOpenConfirm = async () => {
    try {
      const res = await client.post('/student/registration/validate', {
        selected_elective_subject_ids: selectedElectives
      });
      if (res.data && res.data.success) {
        setIsConfirmModalOpen(true);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Elective selection validation failed.', 'error');
    }
  };

  const handleConfirmRegistrationSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await client.post('/student/registration/confirm', {
        selected_elective_subject_ids: selectedElectives
      });

      if (res.data && res.data.success) {
        showToast(res.data.message || 'Subject registration confirmed!');
        setIsConfirmModalOpen(false);
        fetchMySubjects();
        fetchCurriculum();
        setActiveTab('my-subjects');
      } else {
        showToast(res.data?.message || 'Registration failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to confirm registration.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const mandatoryList = curriculumData?.mandatory_subjects || [];
  const labList = curriculumData?.laboratory_subjects || [];
  const electiveGroups = curriculumData?.elective_groups || [];

  const mandatoryCredits = mandatoryList.reduce((acc: number, s: any) => acc + (parseFloat(s.mapped_credits) || 0), 0);
  const labCredits = labList.reduce((acc: number, s: any) => acc + (parseFloat(s.mapped_credits) || 0), 0);

  // Selected electives credits
  let selectedElectiveCredits = 0;
  electiveGroups.forEach((group: any) => {
    group.subjects.forEach((s: any) => {
      if (selectedElectives.includes(s.subject_id)) {
        selectedElectiveCredits += (parseFloat(s.mapped_credits) || 0);
      }
    });
  });

  const totalCalculatedCredits = mandatoryCredits + labCredits + selectedElectiveCredits;

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

      {/* Academic Context Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/20">
                {studentContext?.roll_number || '24CS001'}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                isWindowClosed ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                Registration Status: {isWindowClosed ? 'CLOSED' : 'OPEN'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold mt-1">
              {studentContext?.name || 'Student My Subjects & Registration'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {studentContext?.program_name} • {studentContext?.department_name} • Regulation {studentContext?.regulation_name} • {studentContext?.semester_name} • Section {studentContext?.section_name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { fetchAcademicContext(); fetchMySubjects(); fetchCurriculum(); }}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Refresh My Subjects"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {registeredSubjects.length > 0 && (
              <div className="bg-white/10 border border-white/20 p-3 rounded-2xl text-right">
                <p className="text-[10px] text-blue-200 uppercase font-semibold">Registered Credits</p>
                <p className="text-base font-bold text-emerald-400">
                  {registeredSubjects.reduce((a, c) => a + (parseFloat(c.credits) || 0), 0)} Credits
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('my-subjects')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'my-subjects'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>My Registered Subjects ({registeredSubjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('registration')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'registration'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Elective Selection & Semester Registration</span>
        </button>
      </div>

      {/* TAB 1: Registered Subjects View */}
      {activeTab === 'my-subjects' && (
        <div className="space-y-4">
          {registeredSubjects.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">No Subjects Registered Yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                You haven't confirmed your subject registration for this semester yet. Switch to the "Elective Selection & Semester Registration" tab to select your electives and register.
              </p>
              <button
                onClick={() => setActiveTab('registration')}
                className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open Registration Form</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {registeredSubjects.map((sub) => (
                <div
                  key={sub.registration_id}
                  className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        {sub.subject_code}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sub.registration_type === 'ELECTIVE'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                          : sub.registration_type === 'LABORATORY'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                      }`}>
                        {sub.registration_type}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                      {sub.subject_name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {sub.credits} Credits • {sub.offering_type || 'Theory'}
                    </p>
                  </div>

                  {/* Assigned Phase 3 Faculty Member */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                        {sub.faculty_first_name ? sub.faculty_first_name[0] : 'F'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {sub.faculty_first_name ? `${sub.faculty_first_name} ${sub.faculty_last_name || ''}` : 'Faculty Pending'}
                        </p>
                        <p className="text-[10px] text-slate-400">Course Instructor</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setInspectSubject(sub)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                      title="Inspect Details"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Registration & Elective Selection */}
      {activeTab === 'registration' && (
        <div className="space-y-6">

          {isWindowClosed && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-amber-500" />
              <span>The subject registration period for this semester is currently CLOSED. You can view your selections but cannot submit changes.</span>
            </div>
          )}

          {/* Section 1: Mandatory Subjects */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-500" /> Mandatory Core Subjects (Automatically Enrolled)
              </h3>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full">
                {mandatoryCredits + labCredits} Mandatory Credits
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...mandatoryList, ...labList].map((sub: any) => (
                <div key={sub.subject_id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">{sub.subject_code}</span>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">{sub.subject_name}</p>
                    <p className="text-[10px] text-slate-500">{sub.mapped_credits} Credits • {sub.is_lab ? 'Laboratory' : 'Core Theory'}</p>
                  </div>
                  <span title="Automatically Required">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Elective Selection Groups */}
          {electiveGroups.map((group: any) => {
            const selectedInGroupCount = group.subjects.filter((s: any) => selectedElectives.includes(s.subject_id)).length;
            const isGroupSatisfied = selectedInGroupCount >= group.min_selection;

            return (
              <div key={group.group_name} className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-500" /> {group.group_name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Select exactly <strong>{group.min_selection}</strong> subject from the list below
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    isGroupSatisfied ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    Selected: {selectedInGroupCount} / {group.min_selection}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {group.subjects.map((sub: any) => {
                    const isSelected = selectedElectives.includes(sub.subject_id);

                    return (
                      <div
                        key={sub.subject_id}
                        onClick={() => handleSelectElective(sub.subject_id, group.subjects)}
                        className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20 scale-[1.01]'
                            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-purple-400'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                              {sub.subject_code}
                            </span>
                            <input
                              type="radio"
                              name={group.group_name}
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-purple-600"
                            />
                          </div>

                          <h4 className={`font-bold text-sm leading-tight ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {sub.subject_name}
                          </h4>
                          <p className={`text-xs mt-1 ${isSelected ? 'text-purple-100' : 'text-slate-500 dark:text-slate-400'}`}>
                            {sub.mapped_credits} Credits • {sub.offering_type || 'Theory'}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setInspectSubject(sub); }}
                            className={`text-[10px] underline font-semibold ${isSelected ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`}
                          >
                            View Course Syllabus
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Section 3: Credit Summary & Confirm Bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Total Semester Load Calculation</p>
              <p className="text-lg font-extrabold text-emerald-400 mt-0.5">
                {totalCalculatedCredits} Total Credits Selected
              </p>
              <p className="text-xs text-slate-300">
                ({mandatoryCredits + labCredits} Mandatory Credits + {selectedElectiveCredits} Elective Credits)
              </p>
            </div>

            <button
              onClick={handleValidateAndOpenConfirm}
              disabled={isWindowClosed || isSubmitting}
              className={`px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                !isWindowClosed
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm & Register Subjects</span>
            </button>
          </div>

        </div>
      )}

      {/* Elective Details Modal */}
      <ElectiveSubjectDetailsModal
        isOpen={!!inspectSubject}
        onClose={() => setInspectSubject(null)}
        subject={inspectSubject}
      />

      {/* Final Confirm Registration Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Confirm Subject Registration</h3>
              <button onClick={() => setIsConfirmModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 space-y-1.5">
                <p className="font-bold text-blue-900 dark:text-blue-200 text-sm">Registration Summary</p>
                <div className="flex justify-between">
                  <span>Mandatory Core & Labs:</span>
                  <span className="font-bold">{mandatoryCredits + labCredits} Credits</span>
                </div>
                <div className="flex justify-between">
                  <span>Elective Selections:</span>
                  <span className="font-bold">{selectedElectiveCredits} Credits</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 dark:border-blue-800 pt-1 font-extrabold text-blue-700 dark:text-blue-300 text-xs">
                  <span>Total Semester Load:</span>
                  <span>{totalCalculatedCredits} Credits</span>
                </div>
              </div>

              <p className="text-slate-500">
                Clicking confirm will register you for all mandatory core subjects and your selected electives for this semester.
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRegistrationSubmit}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Registration</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
