import React, { useState, useEffect, useCallback } from 'react';
import { HelpCircle, Clock, CheckCircle2, AlertTriangle, PlayCircle, Award, Sparkles, X, ChevronRight, BookOpen } from 'lucide-react';
import client from '../../api/client';

export const StudentDailyMcqModule: React.FC = () => {
  const [pendingQuizzes, setPendingQuizzes] = useState<any[]>([]);
  const [historyQuizzes, setHistoryQuizzes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active quiz session modal state
  const [activeAssignment, setActiveAssignment] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: string }>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quiz result modal state
  const [quizResult, setQuizResult] = useState<any | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchMcqData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pendingRes, historyRes] = await Promise.all([
        client.get('/mcq/daily/pending'),
        client.get('/mcq/daily/history')
      ]);

      if (pendingRes.data && pendingRes.data.data) {
        setPendingQuizzes(pendingRes.data.data);
      }
      if (historyRes.data && historyRes.data.data) {
        setHistoryQuizzes(historyRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching MCQ data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMcqData();
  }, [fetchMcqData]);

  const handleStartQuiz = async (assignment: any) => {
    setActiveAssignment(assignment);
    setIsLoadingQuestions(true);
    setUserAnswers({});
    setQuizResult(null);

    try {
      const res = await client.get(`/mcq/daily/assignment/${assignment.id}`);
      if (res.data && res.data.questions) {
        setQuestions(res.data.questions);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load quiz questions.', 'error');
      setActiveAssignment(null);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleSelectOption = (questionId: number, option: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeAssignment) return;

    // Check if all 10 questions have been answered
    const unansweredCount = questions.length - Object.keys(userAnswers).length;
    if (unansweredCount > 0) {
      showToast(`Please select answers for all ${questions.length} questions before submitting (${unansweredCount} remaining).`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const answersPayload = Object.entries(userAnswers).map(([qId, opt]) => ({
        question_id: Number(qId),
        selected_option: opt
      }));

      const res = await client.post('/mcq/daily/submit', {
        assignment_id: activeAssignment.id,
        answers: answersPayload
      });

      if (res.data && res.data.success) {
        setQuizResult(res.data.data);
        showToast('Quiz submitted! Attendance marked PRESENT ✅');
        fetchMcqData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit quiz.', 'error');
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
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
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
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Daily Topic 10-MCQ Quiz Portal
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete your faculty-assigned topic quiz before 11:59 PM to confirm your attendance status as <strong className="text-emerald-600 dark:text-emerald-400">PRESENT</strong>.
          </p>
        </div>
      </div>

      {/* Pending Daily Quizzes Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-500" /> Pending Attendance Quizzes (Must complete before 11:59 PM)
        </h3>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Checking pending daily quizzes...</div>
        ) : pendingQuizzes.length === 0 ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">All Daily Quizzes Completed!</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">You have no pending 10-MCQ topic quizzes for today. All marked attendances are verified.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingQuizzes.map((q) => (
              <div
                key={q.id}
                className="bg-gradient-to-br from-purple-900/10 via-white to-slate-50 dark:from-purple-950/40 dark:via-slate-800 dark:to-slate-900 border border-purple-300 dark:border-purple-700/60 rounded-3xl p-5 shadow-lg relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                    {q.subject_code}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Expires 11:59 PM
                  </span>
                </div>

                <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug">
                  {q.subject_name}
                </h4>

                <div className="mt-2 text-xs space-y-1">
                  <p className="text-purple-700 dark:text-purple-300 font-bold flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> Topic: {q.topic_covered}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Faculty: Prof. {q.faculty_first_name} {q.faculty_last_name}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    10 Questions • Single Choice
                  </span>
                  <button
                    onClick={() => handleStartQuiz(q)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center gap-1.5"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Start 10 MCQ Quiz</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz History Section */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-500" /> Past Quiz & Attendance Logs
        </h3>

        {historyQuizzes.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            No past topic quiz records found.
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Topic Covered</th>
                    <th className="px-4 py-3 text-center">Score</th>
                    <th className="px-4 py-3 text-center">Quiz Status</th>
                    <th className="px-4 py-3 text-center">Final Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historyQuizzes.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                        {new Date(h.assigned_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {h.subject_code} - {h.subject_name}
                      </td>
                      <td className="px-4 py-3 text-purple-700 dark:text-purple-300 font-semibold">
                        {h.topic_covered}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {h.status === 'COMPLETED' ? `${h.score} / ${h.total_questions} (${h.percentage}%)` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          h.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                          h.status === 'EXPIRED' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          h.status === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {h.status === 'COMPLETED' ? 'PRESENT ✅' : 'ABSENT (EXPIRED) ❌'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Interactive 10-MCQ Quiz Modal */}
      {activeAssignment && !quizResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-purple-900/10 shrink-0">
              <div>
                <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                  {activeAssignment.subject_code} — {activeAssignment.subject_name}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                  Topic: {activeAssignment.topic_covered}
                </h3>
              </div>
              <button onClick={() => setActiveAssignment(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {isLoadingQuestions ? (
                <div className="p-12 text-center text-xs text-slate-400">Generating and fetching 10 topic questions...</div>
              ) : questions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No questions found for this topic quiz.</div>
              ) : (
                questions.map((q, idx) => {
                  const selectedOpt = userAnswers[q.id];

                  return (
                    <div key={q.id} className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-relaxed">
                          {q.question_text}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-8">
                        {['A', 'B', 'C', 'D'].map((optKey) => {
                          const optionText = q[`option_${optKey.toLowerCase()}`];
                          const isSelected = selectedOpt === optKey;

                          return (
                            <button
                              key={optKey}
                              type="button"
                              onClick={() => handleSelectOption(q.id, optKey)}
                              className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center gap-2.5 ${
                                isSelected
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold border ${
                                isSelected ? 'bg-white text-purple-600 border-white' : 'border-slate-300 dark:border-slate-600 text-slate-500'
                              }`}>
                                {optKey}
                              </span>
                              <span>{optionText}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 shrink-0">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                {Object.keys(userAnswers).length} of {questions.length} Answered
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveAssignment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Quiz & Confirm Attendance</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Quiz Instant Result & Explanation Modal */}
      {quizResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto text-2xl font-extrabold">
                ✅
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Attendance Confirmed: PRESENT!
              </h3>
              <p className="text-xs text-slate-500">
                Score: <strong className="text-purple-600">{quizResult.score} / {quizResult.total_questions}</strong> ({quizResult.percentage}%)
              </p>
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Question Answer Review & AI Explanations</h4>
              {quizResult.results.map((r: any, idx: number) => (
                <div key={idx} className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                  r.is_correct ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40' : 'bg-red-50/50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40'
                }`}>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                    <span>Q{idx + 1}: {r.question_text}</span>
                    <span>{r.is_correct ? '✅ Correct' : '❌ Incorrect'}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Your Choice: <strong className="font-mono">{r.selected_option}</strong> | Correct: <strong className="font-mono text-emerald-600">{r.correct_option}</strong>
                  </p>
                  {r.explanation && (
                    <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      💡 {r.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => { setQuizResult(null); setActiveAssignment(null); }}
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20"
            >
              Close & Return to Portal
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
