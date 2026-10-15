import React, { useState, useEffect, useCallback, FC } from 'react';
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
        <RefreshCw className="w-6 h-6 animate-spin text-[#2563EB]" />
        <p className="text-xs font-medium text-[#64748B]">Evaluating Registration Eligibility Pipeline...</p>
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
    <div className="space-y-5">

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-3.5 rounded-lg border text-xs font-semibold flex items-center justify-between shadow-sm ${
          toastMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs text-slate-500 hover:text-slate-700">Dismiss</button>
        </div>
      )}

      {/* Registration Status Banner if exists */}
      {eligibilityData?.registrationHeader && (
        <div className={`p-4 rounded-lg border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm ${
          eligibilityData.registrationHeader.status === 'APPROVED' || eligibilityData.registrationHeader.status === 'LOCKED'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : eligibilityData.registrationHeader.status === 'REJECTED'
            ? 'bg-red-50 text-red-900 border-red-200'
            : 'bg-blue-50 text-blue-900 border-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">
                Semester Registration Status: {eligibilityData.registrationHeader.status}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Total Credits Registered: {eligibilityData.registrationHeader.total_credits} • Submitted: {new Date(eligibilityData.registrationHeader.submitted_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-white border border-slate-200 text-slate-700">
            {eligibilityData.registrationHeader.status}
          </span>
        </div>
      )}

      {/* Header Profile Summary */}
      <div className="bg-[#1E3A5F] text-white p-5 rounded-lg border border-white/10 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-300 font-semibold text-xs uppercase tracking-wider mb-1">
              <Award className="w-3.5 h-3.5" />
              <span>Standard Academic Semester Course Registration</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {student.name || 'Student Portal'} ({student.roll_number || 'STU-ID'})
            </h1>
            <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3">
              <span>Department: <strong className="text-white">{student.department_name || 'CSE'}</strong></span>
              <span>•</span>
              <span>Regulation: <strong className="text-white">{student.regulation_name || 'R23'}</strong></span>
              <span>•</span>
              <span>CGPA: <strong className="text-emerald-300">{student.cgpa || '8.50'}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-md bg-[#13263E] border border-white/10 text-right">
              <p className="text-[10px] text-slate-300 uppercase font-semibold">Enrolled Credits</p>
              <p className={`text-lg font-bold ${isCreditValid ? 'text-emerald-300' : 'text-amber-300'}`}>
                {credits.totalCredits} / {credits.maxAllowed}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* STANDARD SUBJECT REGISTRATION */}
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[#0F172A] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#2563EB]" />
              <span>Current Semester Mandatory Core Offerings</span>
            </h2>

            <button
              onClick={handleSubmitRegistration}
              disabled={isSubmitting || selectedOfferingIds.length === 0}
              className="px-4 py-2 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer transition-colors"
            >
              {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Submit Registration</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {currentSubjects.map((item: any) => {
              const checked = selectedOfferingIds.includes(item.offeringId);
              return (
                <div
                  key={item.offeringId}
                  onClick={() => toggleOfferingSelection(item.offeringId, item.eligible)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    checked
                      ? 'bg-blue-50/60 dark:bg-blue-950/20 border-2 border-[#2563EB] shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-[#E2E8F0] dark:border-slate-700 hover:border-blue-400'
                  } ${!item.eligible ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {item.subjectCode}
                      </span>
                      <h3 className="font-semibold text-[#0F172A] dark:text-white text-xs mt-1.5">{item.subjectName}</h3>
                    </div>

                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!item.eligible}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] mt-1 cursor-pointer border-slate-300"
                    />
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] dark:border-slate-700 text-[11px] text-[#64748B] dark:text-slate-400 space-y-1">
                    <p className="flex items-center justify-between">
                      <span>Credits: <strong className="text-[#0F172A] dark:text-slate-200">{item.credits}</strong></span>
                      <span>Type: <strong className="text-[#0F172A] dark:text-slate-200">{item.offeringType}</strong></span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Faculty: <strong className="text-[#0F172A] dark:text-slate-200">{item.facultyName}</strong></span>
                      <span>Capacity: <strong className="text-[#0F172A] dark:text-slate-200">{item.currentStudents}/{item.maxStudents}</strong></span>
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
            <h2 className="text-xs font-semibold text-[#0F172A] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#B45309]" />
              <span>Open Backlog Subject Reattempts</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {backlogSubjects.map((item: any) => {
                const checked = selectedOfferingIds.includes(item.offeringId);
                return (
                  <div
                    key={item.offeringId}
                    onClick={() => toggleOfferingSelection(item.offeringId, item.eligible)}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      checked
                        ? 'bg-amber-50/70 dark:bg-amber-950/20 border-2 border-amber-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-900/50 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 uppercase">
                          BACKLOG • {item.subjectCode}
                        </span>
                        <h3 className="font-semibold text-[#0F172A] dark:text-white text-xs mt-1.5">{item.subjectName}</h3>
                      </div>

                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 mt-1 cursor-pointer border-slate-300"
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

