import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ShieldAlert, ShieldCheck, Users, AlertTriangle, Clock,
  RefreshCw, Send, CheckCircle2, XCircle, Search, Filter,
  Eye, LogOut, ArrowLeft, Radio, AlertOctagon, UserX, UserCheck
} from 'lucide-react';
import client from '../../api/client';

export const ProctorLiveConsole: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [exam, setExam] = useState<any | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [recentViolations, setRecentViolations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'SUBMITTED' | 'TERMINATED' | 'HIGH_RISK'>('ALL');

  // Candidate Action Modal
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'WARN' | 'TERMINATE' | 'RESET' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  const fetchLiveFeed = useCallback(async () => {
    if (!examId) return;
    try {
      const res = await client.get(`/online-exams/${examId}/proctor/live-feed`);
      if (res.data?.success) {
        setExam(res.data.exam);
        setCandidates(res.data.candidates || []);
        setRecentViolations(res.data.recentViolations || []);
      }
    } catch (err: any) {
      console.error('[PROCTOR FEED ERROR]:', err);
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchLiveFeed();
    const interval = setInterval(fetchLiveFeed, 5000); // 5-second live polling
    return () => clearInterval(interval);
  }, [fetchLiveFeed]);

  const handleExecuteAction = async () => {
    if (!selectedCandidate || !actionType) return;
    setIsExecutingAction(true);

    try {
      let apiAction = 'WARN';
      if (actionType === 'TERMINATE') apiAction = 'TERMINATE';
      if (actionType === 'RESET') apiAction = 'RESET_VIOLATIONS';

      await client.post(`/online-exams/proctor/sessions/${selectedCandidate.session_id}/action`, {
        action: apiAction,
        message: actionReason
      });

      setSelectedCandidate(null);
      setActionType(null);
      setActionReason('');
      fetchLiveFeed();
    } catch (e: any) {
      console.error('Failed to execute proctor action:', e);
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Filter candidates
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.roll_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.username || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'IN_PROGRESS') return c.status === 'IN_PROGRESS';
    if (statusFilter === 'SUBMITTED') return c.status === 'SUBMITTED';
    if (statusFilter === 'TERMINATED') return c.status === 'TERMINATED' || c.status === 'DISQUALIFIED';
    if (statusFilter === 'HIGH_RISK') return c.violation_count > 0;
    return true;
  });

  const totalEnrolled = candidates.length;
  const inProgressCount = candidates.filter((c) => c.status === 'IN_PROGRESS').length;
  const submittedCount = candidates.filter((c) => c.status === 'SUBMITTED').length;
  const terminatedCount = candidates.filter((c) => c.status === 'TERMINATED' || c.status === 'DISQUALIFIED').length;
  const highRiskCount = candidates.filter((c) => c.violation_count >= 2).length;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Top Invigilator Command Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/exam-portal/admin')}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              PROCTOR RADAR & COMMAND HUB
              <span className="text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                Live Monitoring
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Exam: <strong className="text-slate-200">{exam?.title || 'Loading...'}</strong> ({exam?.exam_code})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 font-mono">
            Auto-refreshing every 5s
          </div>
          <button
            onClick={() => fetchLiveFeed()}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* METRICS STRIP */}
      <div className="grid grid-cols-5 gap-4 px-6 py-4 bg-slate-950/60 border-b border-slate-800">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400">Total Examinees</div>
          <div className="text-xl font-bold text-white mt-1">{totalEnrolled}</div>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Active in Exam
          </div>
          <div className="text-xl font-bold text-emerald-300 mt-1">{inProgressCount}</div>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs text-sky-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Submitted
          </div>
          <div className="text-xl font-bold text-sky-300 mt-1">{submittedCount}</div>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs text-rose-400 flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5" />
            Terminated / Disqualified
          </div>
          <div className="text-xl font-bold text-rose-300 mt-1">{terminatedCount}</div>
        </div>
        <div className="p-3 bg-slate-900 border border-rose-500/30 bg-rose-950/20 rounded-xl">
          <div className="text-xs text-amber-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            High-Risk Violations
          </div>
          <div className="text-xl font-bold text-amber-300 mt-1">{highRiskCount}</div>
        </div>
      </div>

      {/* MAIN DUAL VIEW: CANDIDATE GRID ON LEFT, RECENT VIOLATIONS ON RIGHT */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left: Active Candidate Grid */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          {/* Controls & Filter Bar */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search examinee by name or roll number..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {(['ALL', 'IN_PROGRESS', 'SUBMITTED', 'HIGH_RISK', 'TERMINATED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    statusFilter === filter
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-1">
            {filteredCandidates.map((cand) => {
              const isTerminated = cand.status === 'TERMINATED' || cand.status === 'DISQUALIFIED';
              const isDone = cand.status === 'SUBMITTED';

              return (
                <div
                  key={cand.session_id}
                  className={`bg-slate-950/80 border rounded-xl p-4 flex flex-col justify-between transition-all ${
                    cand.violation_count >= 2
                      ? 'border-rose-500/60 shadow-lg shadow-rose-500/10'
                      : cand.violation_count === 1
                      ? 'border-amber-500/50'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Candidate Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-slate-800 overflow-hidden border border-slate-700 flex-shrink-0 flex items-center justify-center">
                          {cand.entry_snapshot_url ? (
                            <img src={cand.entry_snapshot_url} alt="Snap" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-slate-300">
                              {(cand.full_name || cand.username).slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white truncate max-w-[140px]">
                            {cand.full_name || cand.username}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400">{cand.roll_number || 'N/A'}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isTerminated
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                            : isDone
                            ? 'bg-sky-950 text-sky-300 border border-sky-500/40'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {cand.status}
                      </span>
                    </div>

                    {/* Progress & Violation Telemetry */}
                    <div className="space-y-1.5 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg mb-3">
                      <div className="flex justify-between">
                        <span>Answered:</span>
                        <strong className="text-slate-200">
                          {cand.answered_count} / {exam?.total_questions || 6} Questions
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Violations Recorded:</span>
                        <strong
                          className={cand.violation_count > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}
                        >
                          {cand.violation_count} Incident(s)
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Face Match Score:</span>
                        <strong className="text-emerald-400">
                          {cand.face_match_confidence ? `${(cand.face_match_confidence * 100).toFixed(0)}%` : 'Verified'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Remote Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setSelectedCandidate(cand);
                        setActionType('WARN');
                      }}
                      disabled={isTerminated || isDone}
                      className="flex-1 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition-all disabled:opacity-40 cursor-pointer"
                    >
                      Warn
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCandidate(cand);
                        setActionType('TERMINATE');
                      }}
                      disabled={isTerminated || isDone}
                      className="flex-1 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-medium transition-all disabled:opacity-40 cursor-pointer"
                    >
                      Terminate
                    </button>
                    {cand.violation_count > 0 && !isTerminated && (
                      <button
                        onClick={() => {
                          setSelectedCandidate(cand);
                          setActionType('RESET');
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] transition-all cursor-pointer"
                        title="Reset Violations"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Chronological Violation Stream */}
        <div className="w-96 flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl p-4 overflow-hidden">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-3 mb-3 border-b border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Live Security Violation Stream
            </span>
            <span className="text-[10px] font-mono text-slate-400">{recentViolations.length} Events</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {recentViolations.map((v) => (
              <div
                key={v.id}
                className="p-3 bg-slate-950/80 border border-rose-500/30 rounded-xl text-xs space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-300 text-[11px] uppercase tracking-wide">
                    {v.violation_type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(v.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-slate-300 font-medium">
                  {v.full_name || v.username} <span className="text-slate-500">({v.roll_number || 'N/A'})</span>
                </div>
                <p className="text-[11px] text-slate-400 bg-slate-900/80 p-1.5 rounded">
                  {v.details}
                </p>
              </div>
            ))}

            {recentViolations.length === 0 && (
              <div className="text-center text-slate-500 text-xs py-10">
                Zero security violations detected. All candidates operating within lockdown parameters.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACTION CONFIRMATION MODAL */}
      {selectedCandidate && actionType && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              Confirm Proctor Action: {actionType}
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Target Candidate: <strong className="text-white">{selectedCandidate.full_name || selectedCandidate.username}</strong> ({selectedCandidate.roll_number})
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Reason / Invigilator Note:
              </label>
              <textarea
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter justification or message to candidate..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedCandidate(null);
                  setActionType(null);
                }}
                className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={isExecutingAction}
                className={`w-1/2 font-bold py-2 rounded-xl text-xs text-white transition-all ${
                  actionType === 'TERMINATE' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {isExecutingAction ? 'Executing...' : `Confirm ${actionType}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
