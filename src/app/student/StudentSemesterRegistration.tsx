import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, CheckCircle2, AlertCircle, Clock, Lock, Sparkles, RefreshCw, Layers, UserCheck, ShieldAlert, Award, AlertTriangle, ListOrdered, Send } from 'lucide-react';
import client from '../../api/client';

export const StudentSemesterRegistration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STANDARD' | 'CBCS_CHOICES'>('STANDARD');
  const [eligibilityData, setEligibilityData] = useState<any>(null);
  const [selectedOfferingIds, setSelectedOfferingIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // CBCS States
  const [cbcsWindow, setCbcsWindow] = useState<any>(null);
  const [cbcsOfferings, setCbcsOfferings] = useState<any[]>([]);
  const [cbcsPreferences, setCbcsPreferences] = useState<{ [group: string]: { pref1: number; pref2: number; pref3: number } }>({
    'PE-1': { pref1: 0, pref2: 0, pref3: 0 }
  });
  const [existingCbcsPrefs, setExistingCbcsPrefs] = useState<any[]>([]);

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

  const fetchStudentCBCSWindow = useCallback(async () => {
    try {
      const res = await client.get('/cbcs/student/active-window');
      if (res.data && res.data.data) {
        setCbcsWindow(res.data.data.activeWindow);
        setCbcsOfferings(res.data.data.offerings || []);
        setExistingCbcsPrefs(res.data.data.existingPreferences || []);
      }
    } catch (err) {
      console.warn('CBCS student window notice:', err);
    }
  }, []);

  useEffect(() => {
    fetchEligibility();
    fetchStudentCBCSWindow();
  }, [fetchEligibility, fetchStudentCBCSWindow]);

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

  const handleSubmitCBCSPreferences = async () => {
    if (!cbcsWindow) {
      showToast('No active CBCS Choice Window available.', 'error');
      return;
    }

    const payload: any[] = [];
    Object.keys(cbcsPreferences).forEach(group => {
      const p = cbcsPreferences[group];
      if (p.pref1) payload.push({ offeringId: p.pref1, electiveGroup: group, preferenceRank: 1 });
      if (p.pref2) payload.push({ offeringId: p.pref2, electiveGroup: group, preferenceRank: 2 });
      if (p.pref3) payload.push({ offeringId: p.pref3, electiveGroup: group, preferenceRank: 3 });
    });

    if (payload.length === 0) {
      showToast('Please select at least Preference #1 for your elective group.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await client.post('/cbcs/student/submit-preferences', {
        windowId: cbcsWindow.id,
        preferences: payload
      });

      if (res.data && res.data.success) {
        showToast('CBCS Elective Preferences submitted successfully!');
        fetchStudentCBCSWindow();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit CBCS choices.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !eligibilityData) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500">Evaluating 14-Point Registration Eligibility Pipeline...</p>
      </div>
    );
  }

  const student = eligibilityData?.studentContext || {};
  const evaluations = Array.isArray(eligibilityData?.allSubjectEvaluations) ? eligibilityData.allSubjectEvaluations : [];

  const currentSubjects = evaluations.filter((e: any) => !e.isBacklog && !e.isElective);
  const backlogSubjects = evaluations.filter((e: any) => e.isBacklog);
  const disabledSubjects = evaluations.filter((e: any) => !e.eligible);

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

      {/* Header Profile Summary */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              <span>Choice-Based Credit System (CBCS) Student Portal</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {student.name || 'Student Portal'} ({student.roll_number || 'STU-ID'})
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              <span>Department: <strong className="text-slate-200">{student.department_name || 'CSE'}</strong></span>
              <span>•</span>
              <span>Regulation: <strong className="text-slate-200">{student.regulation_name || 'R25'}</strong></span>
              <span>•</span>
              <span>CGPA: <strong className="text-emerald-400">{student.cgpa || '8.50'}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Selected Credits</p>
              <p className={`text-xl font-black ${isCreditValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                {credits.totalCredits} / {credits.maxAllowed} Credits
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('STANDARD')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'STANDARD'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Mandatory & Backlog Subjects
        </button>

        <button
          onClick={() => setActiveTab('CBCS_CHOICES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'CBCS_CHOICES'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>CBCS Elective Choice-Filling</span>
          {cbcsWindow && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-400 text-slate-900 text-[10px] font-extrabold">Active</span>
          )}
        </button>
      </div>

      {/* TAB 1: STANDARD SUBJECT REGISTRATION */}
      {activeTab === 'STANDARD' && (
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
      )}

      {/* TAB 2: CBCS ELECTIVE CHOICE-FILLING */}
      {activeTab === 'CBCS_CHOICES' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-6">
          {!cbcsWindow ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No active CBCS Choice Window</p>
              <p className="text-xs">Elective choice-filling for your semester is currently closed or not opened yet by the university registrar.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Window Banner */}
              <div className="p-5 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 uppercase">
                    CBCS Window Open
                  </span>
                  <h3 className="text-lg font-bold text-purple-950 dark:text-purple-200 mt-1">{cbcsWindow.title}</h3>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                    Select your ranked preferences for Professional & Open Electives. The automated CGPA Merit engine will process seats in merit order.
                  </p>
                </div>

                <button
                  onClick={handleSubmitCBCSPreferences}
                  disabled={isSubmitting}
                  className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Ranked Preferences</span>
                </button>
              </div>

              {/* Submitted Existing Preferences Status */}
              {existingCbcsPrefs.length > 0 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Your Submitted Choice Preferences & Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {existingCbcsPrefs.map((pref: any) => (
                      <div key={pref.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            Pref #{pref.preference_rank}: {pref.subject_name} ({pref.subject_code})
                          </p>
                          <p className="text-[10px] text-slate-400">{pref.elective_group}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          pref.status === 'ALLOCATED' ? 'bg-emerald-100 text-emerald-800' :
                          pref.status === 'REJECTED_FULL' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {pref.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preference Selection Form */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Select Elective Choices for Group: PE-1</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Preference 1 */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-purple-700 dark:text-purple-400">Preference #1 (First Priority)</label>
                    <select
                      value={cbcsPreferences['PE-1']?.pref1 || 0}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setCbcsPreferences(prev => ({
                          ...prev,
                          'PE-1': { ...prev['PE-1'], pref1: val }
                        }));
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-xl font-bold text-xs"
                    >
                      <option value={0}>Select First Choice...</option>
                      {cbcsOfferings.map((off: any) => (
                        <option key={off.offering_id} value={off.offering_id}>
                          {off.subject_code} — {off.subject_name} ({off.credits} Cr)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preference 2 */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400">Preference #2 (Second Priority)</label>
                    <select
                      value={cbcsPreferences['PE-1']?.pref2 || 0}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setCbcsPreferences(prev => ({
                          ...prev,
                          'PE-1': { ...prev['PE-1'], pref2: val }
                        }));
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs"
                    >
                      <option value={0}>Select Second Choice...</option>
                      {cbcsOfferings.map((off: any) => (
                        <option key={off.offering_id} value={off.offering_id}>
                          {off.subject_code} — {off.subject_name} ({off.credits} Cr)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preference 3 */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Preference #3 (Third Priority)</label>
                    <select
                      value={cbcsPreferences['PE-1']?.pref3 || 0}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setCbcsPreferences(prev => ({
                          ...prev,
                          'PE-1': { ...prev['PE-1'], pref3: val }
                        }));
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs"
                    >
                      <option value={0}>Select Third Choice...</option>
                      {cbcsOfferings.map((off: any) => (
                        <option key={off.offering_id} value={off.offering_id}>
                          {off.subject_code} — {off.subject_name} ({off.credits} Cr)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
