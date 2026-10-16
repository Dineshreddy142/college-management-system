import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  BookOpen, Plus, Key, Camera, ShieldCheck, Clock,
  CheckCircle2, AlertTriangle, ArrowRight, Radio, ExternalLink,
  Layers, Search, FileText, Settings, Award
} from 'lucide-react';
import client from '../../api/client';

export const ExamStudioHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'EXAMS' | 'BANKS' | 'NEW_EXAM' | 'NEW_QUESTION'>('EXAMS');

  const [exams, setExams] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Exam Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newPasskey, setNewPasskey] = useState('EXAM2026');
  const [newDuration, setNewDuration] = useState(60);
  const [newMarks, setNewMarks] = useState(50);
  const [newPassMarks, setNewPassMarks] = useState(20);
  const [newFaceVerification, setNewFaceVerification] = useState(true);
  const [newWebcamProctoring, setNewWebcamProctoring] = useState(true);
  const [newMaxViolations, setNewMaxViolations] = useState(3);
  const [newInstructions, setNewInstructions] = useState('Strict proctoring enforced. Fullscreen is mandatory. Tab switching will incur immediate violations.');
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [examCreateSuccess, setExamCreateSuccess] = useState('');

  // New Question Form State
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('MCQ_SINGLE');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [qMarks, setQMarks] = useState(2.0);
  const [qNegative, setQNegative] = useState(0.5);
  const [qExplanation, setQExplanation] = useState('');
  const [options, setOptions] = useState([
    { text: '', is_correct: true },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false }
  ]);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [qSuccess, setQSuccess] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [banksRes, examsRes] = await Promise.all([
        client.get('/online-exams/banks'),
        client.get('/exams')
      ]);

      if (banksRes.data?.data) {
        setBanks(banksRes.data.data);
        if (banksRes.data.data.length > 0) {
          setSelectedBankId(String(banksRes.data.data[0].id));
        }
      }

      // Fetch online exams
      const onlineExamsRes = await client.post('/online-exams/verify-login', {
        identifier: 'dineshreddy',
        password: 'Admin@123'
      }).catch(() => null);

      if (onlineExamsRes?.data?.eligibleExams) {
        setExams(onlineExamsRes.data.eligibleExams);
      }
    } catch (e) {
      console.warn('Error fetching studio data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create Online Exam Handler
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingExam(true);
    setExamCreateSuccess('');

    try {
      const res = await client.post('/online-exams/create', {
        title: newTitle,
        exam_code: newCode,
        passkey_plain: newPasskey,
        duration_minutes: Number(newDuration),
        total_marks: Number(newMarks),
        pass_marks: Number(newPassMarks),
        require_face_verification: newFaceVerification,
        enable_webcam_proctoring: newWebcamProctoring,
        max_violations_allowed: Number(newMaxViolations),
        instructions: newInstructions
      });

      if (res.data?.success) {
        setExamCreateSuccess(`Exam "${newTitle}" created successfully!`);
        fetchData();
        setActiveTab('EXAMS');
      }
    } catch (err: any) {
      console.error('Failed to create online exam:', err);
    } finally {
      setIsCreatingExam(false);
    }
  };

  // Add Question to Bank Handler
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBankId) return;
    setIsCreatingQuestion(true);
    setQSuccess('');

    try {
      const res = await client.post(`/online-exams/banks/${selectedBankId}/questions`, {
        question_text: questionText,
        question_type: questionType,
        difficulty_level: difficulty,
        marks: Number(qMarks),
        negative_marks: Number(qNegative),
        explanation: qExplanation,
        options: options.filter(o => o.text.trim().length > 0)
      });

      if (res.data?.success) {
        setQSuccess('Question saved to repository successfully!');
        setQuestionText('');
        setQExplanation('');
        fetchData();
      }
    } catch (err: any) {
      console.error('Failed to save question:', err);
    } finally {
      setIsCreatingQuestion(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white flex items-center gap-2">
              ONLINE EXAM & QUESTION STUDIO
              <span className="text-[10px] font-mono tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                COE / Faculty Suite
              </span>
            </h1>
            <p className="text-xs text-slate-400">Computer-Based Assessment Architect & Question Taxonomy Manager</p>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/exam-portal')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Candidate Portal Gateway</span>
          </button>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 transition-colors"
          >
            Back to ERP
          </button>
        </div>
      </header>

      {/* TABS NAVIGATION */}
      <div className="border-b border-slate-800 bg-slate-950/60 px-6 flex items-center gap-2">
        {[
          { key: 'EXAMS', label: 'Active Online Exams', icon: Layers },
          { key: 'BANKS', label: 'Question Repositories', icon: BookOpen },
          { key: 'NEW_EXAM', label: 'Schedule New Exam', icon: Plus },
          { key: 'NEW_QUESTION', label: 'Author Question', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB 1: ACTIVE ONLINE EXAMS LIST                             */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'EXAMS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Active Online Examinations</h2>
                <p className="text-xs text-slate-400">Live proctored tests, passkey access codes, and invigilator radars</p>
              </div>
              <button
                onClick={() => setActiveTab('NEW_EXAM')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Online Exam</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((ex) => (
                <div
                  key={ex.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono tracking-wider uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                        {ex.status}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{ex.exam_code}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-2 leading-snug">
                      {ex.title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">{ex.subject_name || 'Cybersecurity Systems'}</p>

                    <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Duration:</span>
                        <strong>{ex.duration_minutes} Mins</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Marks:</span>
                        <strong>{ex.total_marks} Marks</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Face Biometric:</span>
                        <strong className="text-emerald-400">Enforced</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Violations:</span>
                        <strong className="text-amber-400">{ex.max_violations_allowed} Incidents</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => navigate(`/exam-portal/proctor/${ex.id}`)}
                      className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Proctor Radar</span>
                    </button>
                    <button
                      onClick={() => navigate('/exam-portal')}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
                    >
                      Test Login
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB 2: QUESTION REPOSITORIES / BANKS                        */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'BANKS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Question Repositories</h2>
                <p className="text-xs text-slate-400">Categorized Bloom's taxonomy pools and subject question banks</p>
              </div>
              <button
                onClick={() => setActiveTab('NEW_QUESTION')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banks.map((b) => (
                <div
                  key={b.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-white">{b.title}</h3>
                    <span className="text-xs font-mono text-indigo-400">{b.code}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">{b.description || 'General engineering question repository.'}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
                    <span>Questions Available: <strong className="text-emerald-400">{b.question_count || 6} Questions</strong></span>
                    <button
                      onClick={() => {
                        setSelectedBankId(String(b.id));
                        setActiveTab('NEW_QUESTION');
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      + Add Questions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB 3: SCHEDULE NEW ONLINE EXAM                             */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'NEW_EXAM' && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-1">Schedule New Secure Online Exam</h2>
            <p className="text-xs text-slate-400 mb-6">Configure access codes, duration, and biometric policies</p>

            {examCreateSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{examCreateSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Exam Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. End-Term Cryptography CBT"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Exam Code</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CBT-CS-601"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Exam Passkey</label>
                  <input
                    type="text"
                    required
                    value={newPasskey}
                    onChange={(e) => setNewPasskey(e.target.value.toUpperCase())}
                    placeholder="e.g. EXAM2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 focus:outline-none focus:border-amber-500 font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max Violations</label>
                  <input
                    type="number"
                    required
                    value={newMaxViolations}
                    onChange={(e) => setNewMaxViolations(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={newMarks}
                    onChange={(e) => setNewMarks(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pass Marks</label>
                  <input
                    type="number"
                    value={newPassMarks}
                    onChange={(e) => setNewPassMarks(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Security Toggles */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Require Biometric Face Match (Factor 3)</div>
                    <div className="text-[11px] text-slate-400">Verifies live webcam vector before unlocking test</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newFaceVerification}
                    onChange={(e) => setNewFaceVerification(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Live AI Webcam Proctoring Preview</div>
                    <div className="text-[11px] text-slate-400">Continuous PIP feed and face presence check during exam</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newWebcamProctoring}
                    onChange={(e) => setNewWebcamProctoring(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Instructions for Examinees</label>
                <textarea
                  rows={2}
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCreatingExam}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {isCreatingExam ? 'Publishing Online Exam...' : 'Publish Secure Online Exam'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TAB 4: AUTHOR QUESTION INTO REPOSITORY                      */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeTab === 'NEW_QUESTION' && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-1">Author Question</h2>
            <p className="text-xs text-slate-400 mb-6">Create multiple-choice or descriptive questions with rubrics</p>

            {qSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{qSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Question Bank</label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Question Prompt</label>
                <textarea
                  rows={3}
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter the complete question text..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Type</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="MCQ_SINGLE">Single Choice (MCQ)</option>
                    <option value="MCQ_MULTIPLE">Multiple Select</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="ESSAY">Essay / Descriptive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Marks (+)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={qMarks}
                    onChange={(e) => setQMarks(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Negative (-)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={qNegative}
                    onChange={(e) => setQNegative(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              {/* Options Builder for MCQ */}
              {(questionType === 'MCQ_SINGLE' || questionType === 'MCQ_MULTIPLE') && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">Answer Options & Correct Key</label>
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type={questionType === 'MCQ_SINGLE' ? 'radio' : 'checkbox'}
                        name="correct_option"
                        checked={opt.is_correct}
                        onChange={(e) => {
                          const updated = [...options];
                          if (questionType === 'MCQ_SINGLE') {
                            updated.forEach((o, idx) => { o.is_correct = idx === i; });
                          } else {
                            updated[i].is_correct = e.target.checked;
                          }
                          setOptions(updated);
                        }}
                        className="w-4 h-4 accent-indigo-600"
                      />
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[i].text = e.target.value;
                          setOptions(updated);
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Explanation (Post-Exam Review)</label>
                <textarea
                  rows={2}
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Optional rationale and solution explanation..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingQuestion}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg transition-all cursor-pointer"
              >
                {isCreatingQuestion ? 'Saving Question...' : 'Save Question to Repository'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
