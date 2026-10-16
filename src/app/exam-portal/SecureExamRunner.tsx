import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import {
  ShieldAlert, Clock, AlertTriangle, CheckCircle2, Flag,
  ChevronLeft, ChevronRight, Send, Camera, User, RefreshCw,
  LogOut, Eye, Award, Maximize2, Shield, Lock, FileText
} from 'lucide-react';
import client from '../../api/client';

export const SecureExamRunner: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenFromUrl = searchParams.get('token');
  const sessionToken = tokenFromUrl || (examId ? localStorage.getItem(`exam_session_${examId}`) : null);

  // Core Exam State
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [exam, setExam] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Candidate Answer State: Map<questionId, { selectedOptionId, selectedOptionsJson, textAnswer, isFlagged }>
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);

  // Timer & Heartbeat State
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3600);
  const [serverPingTime, setServerPingTime] = useState<number>(0);

  // Security & Violation State
  const [violationCount, setViolationCount] = useState(0);
  const [maxViolations, setMaxViolations] = useState(3);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [lastViolationMsg, setLastViolationMsg] = useState('');
  const [violationCountdown, setViolationCountdown] = useState(10);
  const [isDisqualified, setIsDisqualified] = useState(false);

  // Submission State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  // Floating Proctor Camera
  const miniVideoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Dynamic Watermark Coordinates
  const [watermarkPos, setWatermarkPos] = useState({ x: 20, y: 30 });

  // Filter for Question Palette
  const [paletteFilter, setPaletteFilter] = useState<'ALL' | 'ANSWERED' | 'UNANSWERED' | 'MARKED'>('ALL');

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Load Session & Sanitized Questions
  // ─────────────────────────────────────────────────────────────────────────
  const fetchSessionData = useCallback(async () => {
    if (!sessionToken || !examId) {
      setLoadError('No active exam session token found. Please authenticate through the gatekeeper.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await client.get(`/online-exams/${examId}/session`, {
        headers: { 'x-exam-session-token': sessionToken }
      });

      if (res.data?.success) {
        setExam(res.data.exam);
        setSession(res.data.session);
        setQuestions(res.data.questions || []);
        setRemainingSeconds(res.data.session.remaining_seconds || res.data.exam.duration_minutes * 60);
        setViolationCount(res.data.session.violation_count || 0);
        setMaxViolations(res.data.exam.max_violations_allowed || 3);

        // Prepopulate saved answers
        const ansMap: Record<number, any> = {};
        if (res.data.savedAnswers && Array.isArray(res.data.savedAnswers)) {
          res.data.savedAnswers.forEach((a: any) => {
            ansMap[a.question_id] = {
              selectedOptionId: a.selected_option_id,
              selectedOptionsJson: a.selected_options_json ? (typeof a.selected_options_json === 'string' ? JSON.parse(a.selected_options_json) : a.selected_options_json) : [],
              textAnswer: a.text_answer || '',
              isFlagged: !!a.is_flagged_for_review
            };
          });
        }
        setAnswers(ansMap);
      } else {
        setLoadError(res.data?.message || 'Failed to load exam session');
      }
    } catch (err: any) {
      if (err.response?.data?.code === 'SESSION_CLOSED') {
        setIsDisqualified(true);
        setLoadError(err.response.data.message);
      } else {
        setLoadError(err.response?.data?.message || 'Error connecting to exam server');
      }
    } finally {
      setIsLoading(false);
    }
  }, [examId, sessionToken]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Initialize Proctor Webcam Preview
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let stream: MediaStream | null = null;
    const initCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false
        });
        if (miniVideoRef.current) {
          miniVideoRef.current.srcObject = stream;
          miniVideoRef.current.play();
          setCameraActive(true);
        }
      } catch (e) {
        console.warn('Mini proctor camera access unavailable:', e);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Countdown Timer & Server Heartbeat
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (examSubmitted || isDisqualified || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          handleAutoSubmit('Time expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examSubmitted, isDisqualified, remainingSeconds]);

  // Heartbeat every 15 seconds
  useEffect(() => {
    if (examSubmitted || isDisqualified || !sessionToken) return;

    const heartbeat = setInterval(async () => {
      try {
        const start = Date.now();
        const res = await client.post('/online-exams/session/heartbeat', {}, {
          headers: { 'x-exam-session-token': sessionToken }
        });
        setServerPingTime(Date.now() - start);

        if (res.data?.success) {
          if (res.data.status === 'TERMINATED' || res.data.status === 'DISQUALIFIED') {
            setIsDisqualified(true);
            setLoadError('Examination was terminated due to policy breaches or proctor intervention.');
          }
          if (res.data.remaining_seconds !== undefined) {
            // Re-sync with server timer drift
            setRemainingSeconds(res.data.remaining_seconds);
          }
        }
      } catch (err) {
        console.warn('Heartbeat synchronization blip:', err);
      }
    }, 15000);

    return () => clearInterval(heartbeat);
  }, [examSubmitted, isDisqualified, sessionToken]);

  // Drift Watermark coordinates every 10 seconds
  useEffect(() => {
    const wmInterval = setInterval(() => {
      setWatermarkPos({
        x: Math.floor(Math.random() * 60) + 10,
        y: Math.floor(Math.random() * 70) + 10
      });
    }, 10000);
    return () => clearInterval(wmInterval);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 4. SECURITY & ANTI-CHEATING LOCKDOWN PROTOCOLS
  // ─────────────────────────────────────────────────────────────────────────
  const triggerViolation = useCallback(async (type: string, details: string) => {
    if (examSubmitted || isDisqualified || !sessionToken) return;

    setLastViolationMsg(details);
    setShowViolationModal(true);
    setViolationCountdown(10);

    try {
      const res = await client.post('/online-exams/session/report-violation', {
        violation_type: type,
        details
      }, {
        headers: { 'x-exam-session-token': sessionToken }
      });

      if (res.data?.success) {
        setViolationCount(res.data.violation_count);
        if (res.data.is_terminated) {
          setIsDisqualified(true);
          setShowViolationModal(false);
          setLoadError('Maximum violation limit breached (3/3). Exam automatically terminated.');
        }
      }
    } catch (e) {
      console.warn('Failed to report violation to server:', e);
    }
  }, [examSubmitted, isDisqualified, sessionToken]);

  // Window Focus / Blur & Visibility Change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('TAB_SWITCH', 'Candidate switched browser tab or minimized window.');
      }
    };

    const handleWindowBlur = () => {
      triggerViolation('WINDOW_BLUR', 'Window focus lost. Multitasking or overlay detected.');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerViolation('FULLSCREEN_EXIT', 'Candidate exited hardware fullscreen mode.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [triggerViolation]);

  // Keystroke & DevTools Restriction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        triggerViolation('DEVTOOLS_ATTEMPT', 'Developer Tools inspection attempted (F12).');
        return false;
      }

      // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        e.preventDefault();
        triggerViolation('DEVTOOLS_ATTEMPT', 'Developer Tools keyboard combination blocked.');
        return false;
      }

      // Block Ctrl+U (View Source)
      if (e.ctrlKey && e.key.toUpperCase() === 'U') {
        e.preventDefault();
        triggerViolation('RESTRICTED_KEY', 'View page source blocked (Ctrl+U).');
        return false;
      }

      // Block Ctrl+S, Ctrl+P
      if (e.ctrlKey && ['S', 'P'].includes(e.key.toUpperCase())) {
        e.preventDefault();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerViolation('RESTRICTED_KEY', 'Clipboard copy/paste blocked in exam environment.');
      return false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopyPaste);
    window.addEventListener('paste', handleCopyPaste);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopyPaste);
      window.removeEventListener('paste', handleCopyPaste);
    };
  }, [triggerViolation]);

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Answer Autosave & Navigation
  // ─────────────────────────────────────────────────────────────────────────
  const saveAnswer = async (qId: number, answerData: any) => {
    // Update local state immediately
    setAnswers(prev => ({
      ...prev,
      [qId]: { ...(prev[qId] || {}), ...answerData }
    }));

    if (!sessionToken) return;

    try {
      setIsSavingAnswer(true);
      await client.post('/online-exams/session/save-answer', {
        question_id: qId,
        selected_option_id: answerData.selectedOptionId !== undefined ? answerData.selectedOptionId : (answers[qId]?.selectedOptionId || null),
        selected_options_json: answerData.selectedOptionsJson !== undefined ? answerData.selectedOptionsJson : (answers[qId]?.selectedOptionsJson || null),
        text_answer: answerData.textAnswer !== undefined ? answerData.textAnswer : (answers[qId]?.textAnswer || null),
        is_flagged_for_review: answerData.isFlagged !== undefined ? answerData.isFlagged : (answers[qId]?.isFlagged || false)
      }, {
        headers: { 'x-exam-session-token': sessionToken }
      });
    } catch (e) {
      console.warn('Auto-save network error:', e);
    } finally {
      setIsSavingAnswer(false);
    }
  };

  const handleSelectOption = (qId: number, optId: number) => {
    saveAnswer(qId, { selectedOptionId: optId });
  };

  const handleToggleMultiOption = (qId: number, optId: number) => {
    const currentList: number[] = answers[qId]?.selectedOptionsJson || [];
    const updated = currentList.includes(optId)
      ? currentList.filter(id => id !== optId)
      : [...currentList, optId];
    saveAnswer(qId, { selectedOptionsJson: updated });
  };

  const handleTextAnswerChange = (qId: number, text: string) => {
    saveAnswer(qId, { textAnswer: text });
  };

  const handleToggleFlag = (qId: number) => {
    const currentFlag = answers[qId]?.isFlagged || false;
    saveAnswer(qId, { isFlagged: !currentFlag });
  };

  const handleClearResponse = (qId: number) => {
    saveAnswer(qId, { selectedOptionId: null, selectedOptionsJson: [], textAnswer: '' });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Examination Submission
  // ─────────────────────────────────────────────────────────────────────────
  const handleAutoSubmit = async (reason: string) => {
    if (examSubmitted || !sessionToken) return;
    setIsSubmitting(true);

    try {
      const res = await client.post('/online-exams/session/submit', {}, {
        headers: { 'x-exam-session-token': sessionToken }
      });
      if (res.data?.success) {
        setExamSubmitted(true);
        setSubmissionResult(res.data.result);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch (err: any) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = () => {
    setShowSubmitModal(true);
  };

  const confirmSubmit = () => {
    setShowSubmitModal(false);
    handleAutoSubmit('Candidate voluntary submit');
  };

  // Format Timer HH:MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Current Question
  const currentQ = questions[currentIndex];

  // Helper question status
  const getQuestionStatus = (qId: number) => {
    const ans = answers[qId];
    if (!ans) return 'UNVISITED';
    const isAnswered = ans.selectedOptionId || (ans.selectedOptionsJson && ans.selectedOptionsJson.length > 0) || (ans.textAnswer && ans.textAnswer.trim().length > 0);
    if (isAnswered && ans.isFlagged) return 'ANSWERED_FLAGGED';
    if (isAnswered) return 'ANSWERED';
    if (ans.isFlagged) return 'FLAGGED';
    return 'UNANSWERED';
  };

  // Counts
  const totalQuestions = questions.length;
  const answeredCount = questions.filter(q => {
    const s = getQuestionStatus(q.id);
    return s === 'ANSWERED' || s === 'ANSWERED_FLAGGED';
  }).length;
  const flaggedCount = questions.filter(q => {
    const s = getQuestionStatus(q.id);
    return s === 'FLAGGED' || s === 'ANSWERED_FLAGGED';
  }).length;
  const unansweredCount = totalQuestions - answeredCount;

  // ─────────────────────────────────────────────────────────────────────────
  // Loading & Error States
  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
        <h2 className="text-lg font-bold">Initializing Lockdown Exam Session...</h2>
        <p className="text-xs text-slate-400 mt-1">Establishing encrypted communication channels & question payloads.</p>
      </div>
    );
  }

  if (loadError || isDisqualified) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 text-center shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied / Session Terminated</h2>
          <p className="text-xs text-slate-300 mb-6">{loadError}</p>
          <button
            onClick={() => navigate('/exam-portal')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl text-xs transition-colors"
          >
            Return to Exam Portal
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Post-Submission Result Certificate View
  // ─────────────────────────────────────────────────────────────────────────
  if (examSubmitted) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-lg w-full bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-indigo-500" />
          <Award className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-black text-white">Examination Completed!</h2>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Your responses have been securely encrypted and submitted to the institutional exam repository.
          </p>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs space-y-2 mb-6 text-left">
            <div className="flex justify-between">
              <span className="text-slate-400">Candidate Name:</span>
              <strong className="text-white">{session?.candidate_name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Roll Number:</span>
              <strong className="text-white">{session?.roll_number}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Subject:</span>
              <strong className="text-white">{exam?.title}</strong>
            </div>
            {submissionResult?.totalScore !== undefined && (
              <div className="flex justify-between pt-2 border-t border-slate-800 text-sm">
                <span className="text-emerald-300 font-bold">Auto-Graded Score:</span>
                <strong className="text-emerald-400 text-base">{submissionResult.totalScore} / {exam?.total_marks} Marks</strong>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Result Status:</span>
              <span className={`font-bold uppercase ${submissionResult?.resultStatus === 'PASS' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {submissionResult?.resultStatus || 'UNDER REVIEW'}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl shadow-lg transition-all text-xs"
          >
            Exit Exam Environment & Return to ERP
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Active Test Runner Interface
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white select-none relative overflow-hidden font-sans">
      {/* Dynamic Watermark Overlay */}
      <div
        className="fixed pointer-events-none text-slate-500/15 font-mono font-bold tracking-widest text-sm z-50 transition-all duration-1000 rotate-[-15deg] whitespace-nowrap"
        style={{ left: `${watermarkPos.x}%`, top: `${watermarkPos.y}%` }}
      >
        {session?.candidate_name} • {session?.roll_number} • IP: 10.0.4.12 • {new Date().toLocaleTimeString()}
      </div>

      {/* TOP STATUS BAR */}
      <header className="border-b border-slate-800/90 bg-slate-900/80 backdrop-blur-md px-6 py-3 flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide truncate max-w-md">
              {exam?.title} ({exam?.exam_code})
            </h1>
            <p className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Candidate: <strong className="text-slate-200">{session?.candidate_name}</strong></span>
              <span>•</span>
              <span>Roll No: <strong className="text-slate-200">{session?.roll_number}</strong></span>
            </p>
          </div>
        </div>

        {/* Center Countdown Clock */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-mono font-bold shadow-inner ${
              remainingSeconds < 300
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse'
                : remainingSeconds < 900
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                : 'bg-slate-950/70 border-slate-700/60 text-indigo-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Time Remaining: {formatTime(remainingSeconds)}</span>
          </div>

          {/* Security Violation Badge */}
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${
              violationCount > 0
                ? 'bg-rose-950/70 border-rose-500/60 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Violations: {violationCount} / {maxViolations}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {isSavingAnswer && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
              <span>Autosaving...</span>
            </span>
          )}

          <button
            onClick={handleManualSubmit}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Exam</span>
          </button>
        </div>
      </header>

      {/* MAIN EXAM BODY (Canvas on Left, Palette on Right) */}
      <div className="flex-1 flex overflow-hidden z-20">
        {/* Left: Question Canvas */}
        <main className="flex-1 overflow-y-auto p-8 flex flex-col justify-between">
          {currentQ ? (
            <div className="max-w-3xl mx-auto w-full">
              {/* Question Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                    Question {currentIndex + 1} of {totalQuestions}
                  </span>
                  <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
                    {currentQ.question_type.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-3">
                  <span>Marks: <strong className="text-emerald-400">+{currentQ.marks}</strong></span>
                  {currentQ.negative_marks > 0 && (
                    <span>Negative: <strong className="text-rose-400">-{currentQ.negative_marks}</strong></span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-base text-slate-100 font-medium leading-relaxed mb-6 whitespace-pre-wrap">
                {currentQ.question_text}
              </div>

              {/* Question Options / Inputs based on Type */}
              <div className="space-y-3 mb-8">
                {/* 1. MCQ SINGLE & TRUE/FALSE */}
                {(currentQ.question_type === 'MCQ_SINGLE' || currentQ.question_type === 'TRUE_FALSE') && (
                  <div className="space-y-2.5">
                    {currentQ.options.map((opt: any) => {
                      const isSelected = answers[currentQ.id]?.selectedOptionId === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleSelectOption(currentQ.id, opt.id)}
                          className={`p-4 rounded-xl border text-sm font-medium cursor-pointer transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10 ring-1 ring-indigo-500/40'
                              : 'bg-slate-900/60 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              isSelected ? 'border-indigo-400 bg-indigo-600' : 'border-slate-600 bg-slate-950'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span>{opt.option_text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. MCQ MULTIPLE CHOICE */}
                {currentQ.question_type === 'MCQ_MULTIPLE' && (
                  <div className="space-y-2.5">
                    {currentQ.options.map((opt: any) => {
                      const selectedIds: number[] = answers[currentQ.id]?.selectedOptionsJson || [];
                      const isChecked = selectedIds.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleToggleMultiOption(currentQ.id, opt.id)}
                          className={`p-4 rounded-xl border text-sm font-medium cursor-pointer transition-all flex items-center gap-3 ${
                            isChecked
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10 ring-1 ring-indigo-500/40'
                              : 'bg-slate-900/60 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              isChecked ? 'border-indigo-400 bg-indigo-600' : 'border-slate-600 bg-slate-950'
                            }`}
                          >
                            {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span>{opt.option_text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. SHORT ANSWER / ESSAY / CODE */}
                {(currentQ.question_type === 'SHORT_ANSWER' || currentQ.question_type === 'ESSAY' || currentQ.question_type === 'CODE') && (
                  <div>
                    <textarea
                      rows={currentQ.question_type === 'SHORT_ANSWER' ? 4 : 8}
                      value={answers[currentQ.id]?.textAnswer || ''}
                      onChange={(e) => handleTextAnswerChange(currentQ.id, e.target.value)}
                      placeholder={
                        currentQ.question_type === 'CODE'
                          ? '// Enter your code implementation here...'
                          : 'Type your comprehensive answer here...'
                      }
                      className={`w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all ${
                        currentQ.question_type === 'CODE' ? 'font-mono' : ''
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 my-auto">No questions available.</div>
          )}

          {/* Bottom Action Controls */}
          {currentQ && (
            <div className="max-w-3xl mx-auto w-full pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleFlag(currentQ.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                    answers[currentQ.id]?.isFlagged
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{answers[currentQ.id]?.isFlagged ? 'Flagged for Review' : 'Mark for Review'}</span>
                </button>

                <button
                  onClick={() => handleClearResponse(currentQ.id)}
                  className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                >
                  Clear Response
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentIndex < totalQuestions - 1 ? (
                  <button
                    onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>Save & Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleManualSubmit}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>Review & Submit</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Right: Question Navigation Palette */}
        <aside className="w-80 border-l border-slate-800/90 bg-slate-900/60 backdrop-blur-md p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
              <span>Question Palette</span>
              <span className="text-[11px] font-mono text-indigo-400 font-normal">
                {answeredCount} / {totalQuestions} Done
              </span>
            </h3>

            {/* Filter Pills */}
            <div className="grid grid-cols-2 gap-1.5 mb-4 text-[11px]">
              <button
                onClick={() => setPaletteFilter('ALL')}
                className={`py-1 px-2 rounded-md transition-all ${paletteFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                All ({totalQuestions})
              </button>
              <button
                onClick={() => setPaletteFilter('ANSWERED')}
                className={`py-1 px-2 rounded-md transition-all ${paletteFilter === 'ANSWERED' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                Answered ({answeredCount})
              </button>
              <button
                onClick={() => setPaletteFilter('UNANSWERED')}
                className={`py-1 px-2 rounded-md transition-all ${paletteFilter === 'UNANSWERED' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                Unanswered ({unansweredCount})
              </button>
              <button
                onClick={() => setPaletteFilter('MARKED')}
                className={`py-1 px-2 rounded-md transition-all ${paletteFilter === 'MARKED' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                Marked ({flaggedCount})
              </button>
            </div>

            {/* 1..N Question Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const status = getQuestionStatus(q.id);
                const isCurrent = idx === currentIndex;

                // Apply palette filter
                if (paletteFilter === 'ANSWERED' && !(status === 'ANSWERED' || status === 'ANSWERED_FLAGGED')) return null;
                if (paletteFilter === 'UNANSWERED' && (status === 'ANSWERED' || status === 'ANSWERED_FLAGGED')) return null;
                if (paletteFilter === 'MARKED' && !(status === 'FLAGGED' || status === 'ANSWERED_FLAGGED')) return null;

                let colorClasses = 'bg-slate-800 border-slate-700 text-slate-300';
                if (status === 'ANSWERED') colorClasses = 'bg-emerald-600 border-emerald-500 text-white';
                if (status === 'FLAGGED') colorClasses = 'bg-amber-500 border-amber-400 text-black font-bold';
                if (status === 'ANSWERED_FLAGGED') colorClasses = 'bg-sky-600 border-sky-400 text-white';

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${colorClasses} ${
                      isCurrent ? 'ring-2 ring-indigo-400 scale-105 shadow-md shadow-indigo-500/20' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Palette Legend */}
            <div className="mt-5 pt-4 border-t border-slate-800 space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-amber-500 inline-block" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-sky-600 inline-block" />
                <span>Answered & Marked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-800 border border-slate-700 inline-block" />
                <span>Unanswered</span>
              </div>
            </div>
          </div>

          {/* Floating Live Proctor Camera Box */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-700 bg-black shadow-lg">
              <video
                ref={miniVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>AI Proctor Active</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ────────────────────────────────────────────────────────────── */}
      {/* SECURITY VIOLATION ALERT MODAL                                 */}
      {/* ────────────────────────────────────────────────────────────── */}
      {showViolationModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border-2 border-rose-500 rounded-2xl p-6 shadow-2xl text-center">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3 animate-bounce" />
            <h2 className="text-xl font-bold text-white mb-1">SECURITY VIOLATION DETECTED!</h2>
            <p className="text-xs text-rose-300 font-semibold mb-3">
              Violation {violationCount} of {maxViolations} Allowed
            </p>
            <p className="text-xs text-slate-300 mb-6 bg-rose-950/40 p-3 rounded-xl border border-rose-500/30">
              {lastViolationMsg || 'Exiting fullscreen or switching windows is strictly forbidden.'}
            </p>
            <button
              onClick={() => {
                if (document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
                setShowViolationModal(false);
              }}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
            >
              Resume Fullscreen Lockdown
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* FINAL SUBMISSION CONFIRMATION MODAL                            */}
      {/* ────────────────────────────────────────────────────────────── */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="text-center mb-4">
              <FileText className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-white">Confirm Exam Submission</h3>
              <p className="text-xs text-slate-400">Are you sure you want to finish and submit your answers?</p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-6">
              <div className="bg-emerald-950/50 border border-emerald-500/30 p-2.5 rounded-xl">
                <div className="text-emerald-400 font-bold text-base">{answeredCount}</div>
                <div className="text-slate-400 text-[10px]">Answered</div>
              </div>
              <div className="bg-rose-950/50 border border-rose-500/30 p-2.5 rounded-xl">
                <div className="text-rose-400 font-bold text-base">{unansweredCount}</div>
                <div className="text-slate-400 text-[10px]">Unanswered</div>
              </div>
              <div className="bg-amber-950/50 border border-amber-500/30 p-2.5 rounded-xl">
                <div className="text-amber-400 font-bold text-base">{flaggedCount}</div>
                <div className="text-slate-400 text-[10px]">Marked</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                Back to Exam
              </button>
              <button
                onClick={confirmSubmit}
                disabled={isSubmitting}
                className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Yes, Submit Now</span>
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
