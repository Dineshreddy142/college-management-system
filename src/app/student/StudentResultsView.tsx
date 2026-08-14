import React, { useState, useEffect, useCallback } from 'react';
import { Award, Download, TrendingUp, BarChart3, AlertCircle, RefreshCw, FileText, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import client from '../../api/client';

export const StudentResultsView: React.FC = () => {
  const [resultsData, setResultsData] = useState<any | null>(null);
  const [officialMarksheet, setOfficialMarksheet] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Marksheet Modal
  const [isMarksheetModalOpen, setIsMarksheetModalOpen] = useState(false);
  const [isLoadingMarksheet, setIsLoadingMarksheet] = useState(false);

  // Revaluation Modal
  const [isRevaluationModalOpen, setIsRevaluationModalOpen] = useState(false);
  const [selectedMarkId, setSelectedMarkId] = useState<number | null>(null);
  const [revaluationReason, setRevaluationReason] = useState('');
  const [isSubmittingReval, setIsSubmittingReval] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchStudentResults = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await client.get('/student/my-results');
      if (res.data) {
        setResultsData(res.data);
      }
    } catch (err) {
      console.error('Error fetching student results:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentResults();
  }, [fetchStudentResults]);

  const handleOpenOfficialMarksheet = async () => {
    setIsMarksheetModalOpen(true);
    setIsLoadingMarksheet(true);
    try {
      const res = await client.get('/student/official-marksheet');
      if (res.data) {
        setOfficialMarksheet(res.data);
      }
    } catch (err) {
      console.error('Error fetching official marksheet:', err);
      showToast('Failed to load official transcript data.', 'error');
    } finally {
      setIsLoadingMarksheet(false);
    }
  };

  const handleOpenRevaluationModal = (markId: number) => {
    setSelectedMarkId(markId);
    setRevaluationReason('');
    setIsRevaluationModalOpen(true);
  };

  const handleSubmitRevaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMarkId || !revaluationReason.trim()) {
      showToast('Please specify a valid reason for revaluation.', 'error');
      return;
    }

    setIsSubmittingReval(true);
    try {
      const res = await client.post('/revaluation', {
        mark_id: selectedMarkId,
        reason: revaluationReason.trim()
      });

      if (res.data && res.data.success) {
        showToast(res.data.message || 'Revaluation request submitted successfully!');
        setIsRevaluationModalOpen(false);
        setRevaluationReason('');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit revaluation request.', 'error');
    } finally {
      setIsSubmittingReval(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-12 text-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading your published academic results...</p>
      </div>
    );
  }

  const cgpa = resultsData?.cgpa || 0.00;
  const sgpa = resultsData?.latest_sgpa || 0.00;
  const totalCredits = resultsData?.total_credits_earned || 0;
  const backlogsCount = resultsData?.backlogs_count || 0;
  const marks = resultsData?.marks || [];
  const backlogs = resultsData?.backlogs || [];

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
              Academic Results & Transcripts
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Verified end-semester grades, SGPA, CGPA calculations, and official marksheet generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenOfficialMarksheet}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20"
          >
            <FileText className="w-4 h-4" />
            <span>View Official Marksheet</span>
          </button>
        </div>
      </div>

      {/* Academic Performance KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* CGPA */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cumulative CGPA</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{cgpa}</p>
          </div>
        </div>

        {/* SGPA */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Latest SGPA</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{sgpa}</p>
          </div>
        </div>

        {/* Total Credits */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Credits Earned</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{totalCredits}</p>
          </div>
        </div>

        {/* Backlogs */}
        <div className={`rounded-2xl border p-5 shadow-xs flex items-center gap-4 ${
          backlogsCount > 0 ? 'bg-red-50/50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40' : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40'
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            backlogsCount > 0 ? 'bg-red-100 dark:bg-red-900/40 text-red-600' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
          }`}>
            {backlogsCount > 0 ? <AlertCircle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Backlogs</p>
            <p className={`text-2xl font-extrabold mt-0.5 ${backlogsCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {backlogsCount}
            </p>
          </div>
        </div>

      </div>

      {/* Published Subject Grades Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-500" /> Subject-wise Published Grades
        </h3>

        <div className="overflow-x-auto">
          {marks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No published examination results found for your profile.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3 text-center">Credits</th>
                  <th className="px-4 py-3 text-center">Internal (40)</th>
                  <th className="px-4 py-3 text-center">External (60)</th>
                  <th className="px-4 py-3 text-center">Total (100)</th>
                  <th className="px-4 py-3 text-center">Grade</th>
                  <th className="px-4 py-3 text-center">Result</th>
                  <th className="px-4 py-3 text-right">Revaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {marks.map((m: any) => {
                  const isPass = m.result_status === 'PASS';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-white">{m.subject_name}</p>
                        <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">
                          {m.subject_code}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {m.credits || 3}
                      </td>

                      <td className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">
                        {m.internal_marks}
                      </td>

                      <td className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">
                        {m.external_marks}
                      </td>

                      <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white">
                        {m.total_marks}
                      </td>

                      <td className="px-4 py-3 text-center font-extrabold text-purple-600 dark:text-purple-400">
                        {m.grade} ({m.grade_point})
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isPass ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                        }`}>
                          {m.result_status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenRevaluationModal(m.id)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 text-slate-700"
                        >
                          Request Reval
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Official Marksheet Modal */}
      {isMarksheetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Official Academic Marksheet Transcript</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Print Marksheet
                </button>
                <button onClick={() => setIsMarksheetModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
              </div>
            </div>

            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              {isLoadingMarksheet ? (
                <div className="p-12 text-center text-xs text-slate-400">Generating official transcript...</div>
              ) : officialMarksheet ? (
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/30">
                  
                  {/* Marksheet Institutional Header */}
                  <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">College Management ERP Institution</h2>
                    <p className="text-xs text-slate-500 uppercase mt-0.5 font-bold">Official Grade Card & Academic Marksheet</p>
                  </div>

                  {/* Student Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Student Name</span>
                      <p className="font-bold text-slate-900 dark:text-white">{officialMarksheet.student?.first_name} {officialMarksheet.student?.last_name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Roll / Reg Number</span>
                      <p className="font-bold font-mono text-purple-600">{officialMarksheet.student?.roll_number || officialMarksheet.student?.admission_number}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Department</span>
                      <p className="font-bold text-slate-900 dark:text-white">{officialMarksheet.student?.department_name || 'CSE'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Section</span>
                      <p className="font-bold text-slate-900 dark:text-white">Section {officialMarksheet.student?.section_name || 'A'}</p>
                    </div>
                  </div>

                  {/* Marksheet Table */}
                  <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-700">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 font-bold uppercase">
                      <tr>
                        <th className="p-2.5 border-b">Code</th>
                        <th className="p-2.5 border-b">Subject Name</th>
                        <th className="p-2.5 border-b text-center">Credits</th>
                        <th className="p-2.5 border-b text-center">Marks</th>
                        <th className="p-2.5 border-b text-center">Grade</th>
                        <th className="p-2.5 border-b text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-medium">
                      {(officialMarksheet.marks || []).map((m: any) => (
                        <tr key={m.id}>
                          <td className="p-2.5 font-mono font-bold text-purple-600">{m.subject_code}</td>
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{m.subject_name}</td>
                          <td className="p-2.5 text-center">{m.credits}</td>
                          <td className="p-2.5 text-center font-bold">{m.total_marks}</td>
                          <td className="p-2.5 text-center font-bold text-purple-600">{m.grade}</td>
                          <td className="p-2.5 text-center font-bold">{m.result_status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Summary Bar */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-500">Cumulative CGPA: </span>
                      <span className="font-extrabold text-purple-600 text-base">{officialMarksheet.results_summary?.cgpa || cgpa}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">Overall Result: </span>
                      <span className="font-extrabold text-emerald-600 text-base">{officialMarksheet.results_summary?.overall_status || 'PASS'}</span>
                    </div>
                  </div>

                </div>
              ) : null}
            </div>

          </div>
        </div>
      )}

      {/* Revaluation Modal */}
      {isRevaluationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Submit Revaluation Request</h3>
              <button onClick={() => setIsRevaluationModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <form onSubmit={handleSubmitRevaluation} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason for Answer Sheet Revaluation *</label>
                <textarea
                  rows={4}
                  value={revaluationReason}
                  onChange={(e) => setRevaluationReason(e.target.value)}
                  placeholder="Explain why you are requesting revaluation for this subject answer script..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRevaluationModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReval}
                  className="px-4 py-2 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
