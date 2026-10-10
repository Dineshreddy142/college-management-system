import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, CheckCircle2, AlertCircle, RefreshCw, Award, AlertTriangle, Sparkles } from 'lucide-react';
import client from '../../api/client';

export const StudentSemesterRegistration: FC = () => {
  const [eligibilityData, setEligibilityData] = useState<any>(null);
  const [selectedOfferingIds, setSelectedOfferingIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const fetchEligibility = useCallback(async () => {
    setIsLoading(true);
    try {
      const offeringIdsParam = selectedOfferingIds.join(',');
      const res = await client.get('/academic/registration/eligibility', {
        params: { offeringIds: offeringIdsParam }
      });
      if (res.data && res.data.data) {
        setEligibilityData(res.data.data);
        
        if (selectedOfferingIds.length === 0 && Array.isArray(res.data.data.allSubjectEvaluations)) {
          const eligibleIds = res.data.data.allSubjectEvaluations
            .filter((item: any) => item.eligible && !item.isElective)
            .map((item: any) => item.offeringId);
          setSelectedOfferingIds(eligibleIds);
        }
      }
    } catch (err: any) {
      console.error('Error fetching registration eligibility:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedOfferingIds]);

  useEffect(() => {
    fetchEligibility();
  }, [fetchEligibility]);

  const toggleOfferingSelection = (offeringId: number, isEligible: boolean) => {
    if (!isEligible) return;
    setSelectedOfferingIds(prev =>
      prev.includes(offeringId) ? prev.filter(id => id !== offeringId) : [...prev, offeringId]
    );
  };

  const handleSubmitRegistration = async () => {
    if (selectedOfferingIds.length === 0) {
      showToast('Please select at least one subject offering to register.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await client.post('/academic/semester-registrations', {
        academicYearId: 1,
        semesterId: eligibilityData?.studentContext?.current_semester_id || 1,
        offeringIds: selectedOfferingIds
      });

      if (res.data && res.data.success) {
        showToast('Semester registration submitted successfully for HOD approval!');
        fetchEligibility();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Registration submission failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !eligibilityData) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500">Evaluating Registration Eligibility Pipeline...</p>
      </div>
    );
  }

  const student = eligibilityData?.studentContext || {};
  const evaluations = Array.isArray(eligibilityData?.allSubjectEvaluations) ? eligibilityData.allSubjectEvaluations : [];

  const currentSubjects = evaluations.filter((e: any) => !e.isBacklog);
  const backlogSubjects = evaluations.filter((e: any) => e.isBacklog);

  const credits = eligibilityData?.creditsSummary || { totalCredits: 0, minAllowed: 16, maxAllowed: 28 };
  const isCreditValid = credits.totalCredits >= credits.minAllowed && credits.totalCredits <= credits.maxAllowed;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

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

      {/* Registration Status Banner if exists */}
      {eligibilityData?.registrationHeader && (
        <div className={`p-4 rounded-3xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md ${
          eligibilityData.registrationHeader.status === 'APPROVED' || eligibilityData.registrationHeader.status === 'LOCKED'
            ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/40'
            : eligibilityData.registrationHeader.status === 'REJECTED'
            ? 'bg-red-950/80 text-red-200 border-red-500/40'
            : 'bg-indigo-950/80 text-indigo-200 border-indigo-500/40'
        }`}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <p className="font-extrabold text-sm">
                Semester Registration Status: {eligibilityData.registrationHeader.status}
              </p>
              <p className="text-xs opacity-80 mt-0.5">
                Total Credits Registered: {eligibilityData.registrationHeader.total_credits} • Submitted: {new Date(eligibilityData.registrationHeader.submitted_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 border border-white/20">
            {eligibilityData.registrationHeader.status}
          </span>
        </div>
      )}

      {/* Header Profile Summary */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              <span>Standard Academic Semester Course Registration</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {student.name || 'Student Portal'} ({student.roll_number || 'STU-ID'})
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              <span>Department: <strong className="text-slate-200">{student.department_name || 'CSE'}</strong></span>
              <span>•</span>
              <span>Regulation: <strong className="text-slate-200">{student.regulation_name || 'R23'}</strong></span>
              <span>•</span>
              <span>CGPA: <strong className="text-emerald-400">{student.cgpa || '8.50'}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Enrolled Semester Credits</p>
              <p className={`text-xl font-black ${isCreditValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                {credits.totalCredits} / {credits.maxAllowed} Credits
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* STANDARD SUBJECT REGISTRATION */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>Current Semester Mandatory Core Offerings</span>
            </h2>

            <button
              onClick={handleSubmitRegistration}
              disabled={isSubmitting || selectedOfferingIds.length === 0}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Submit Semester Registration</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentSubjects.map((item: any) => {
              const checked = selectedOfferingIds.includes(item.offeringId);
              return (
                <div
                  key={item.offeringId}
                  onClick={() => toggleOfferingSelection(item.offeringId, item.eligible)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    checked
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-500/50 shadow-md ring-2 ring-indigo-500/30'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-indigo-300'
                  } ${!item.eligible ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                        {item.subjectCode}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs mt-1.5">{item.subjectName}</h3>
                    </div>

                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!item.eligible}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-1 cursor-pointer"
                    />
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                    <p className="flex items-center justify-between">
                      <span>Credits: <strong className="text-slate-700 dark:text-slate-200">{item.credits}</strong></span>
                      <span>Type: <strong className="text-slate-700 dark:text-slate-200">{item.offeringType}</strong></span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Faculty: <strong className="text-slate-700 dark:text-slate-200">{item.facultyName}</strong></span>
                      <span>Capacity: <strong className="text-slate-700 dark:text-slate-200">{item.currentStudents}/{item.maxStudents}</strong></span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BACKLOGS */}
        {backlogSubjects.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Open Backlog Subject Reattempts</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {backlogSubjects.map((item: any) => {
                const checked = selectedOfferingIds.includes(item.offeringId);
                return (
                  <div
                    key={item.offeringId}
                    onClick={() => toggleOfferingSelection(item.offeringId, item.eligible)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      checked
                        ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-500/50 shadow-md ring-2 ring-amber-500/30'
                        : 'bg-white dark:bg-slate-800/80 border-amber-200 dark:border-amber-900/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 uppercase">
                          BACKLOG • {item.subjectCode}
                        </span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs mt-1.5">{item.subjectName}</h3>
                      </div>

                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 mt-1 cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

