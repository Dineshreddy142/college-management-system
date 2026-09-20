import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Bot,
  User,
  BarChart2,
  PieChart as PieIcon,
  TrendingUp,
  AlertTriangle,
  Users,
  Download,
  CheckCircle,
  HelpCircle,
  Zap,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

interface CommandLog {
  id: string;
  sender: 'user' | 'ai';
  query: string;
  timestamp: string;
  type?: 'chart_attendance' | 'chart_fee' | 'risk_alert' | 'text_response';
  chartData?: any[];
  summaryMetrics?: { label: string; value: string; change: string; positive: boolean }[];
  actionRequired?: string;
}

const PRESET_QUERIES = [
  '📊 Show CSE Department attendance trends for last 4 weeks',
  '💰 Generate fee collection summary & pending deficit report',
  '🚨 Identify academic risk students needing immediate counseling',
  '📢 Broadcast urgent notice to Hostel Block B residents'
];

const ATTENDANCE_CHART_DATA = [
  { week: 'Week 1', CSE: 88, ECE: 84, ME: 79, CIVIL: 82 },
  { week: 'Week 2', CSE: 91, ECE: 86, ME: 81, CIVIL: 80 },
  { week: 'Week 3', CSE: 87, ECE: 82, ME: 76, CIVIL: 78 },
  { week: 'Week 4', CSE: 94, ECE: 89, ME: 83, CIVIL: 85 }
];

const FEE_CHART_DATA = [
  { name: 'Collected', value: 8450000, color: '#10b981' },
  { name: 'Pending Installments', value: 1250000, color: '#f59e0b' },
  { name: 'Overdue Defaults', value: 420000, color: '#ef4444' }
];

const RISK_TREND_DATA = [
  { month: 'Jun', highRisk: 42, mediumRisk: 85 },
  { month: 'Jul', highRisk: 38, mediumRisk: 78 },
  { month: 'Aug', highRisk: 31, mediumRisk: 64 },
  { month: 'Sep', highRisk: 24, mediumRisk: 52 }
];

export const AICommandCenter: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [logs, setLogs] = useState<CommandLog[]>([
    {
      id: 'log-1',
      sender: 'ai',
      query: 'Welcome to the Executive AI Command Center, Principal / Dean. I am synced with real-time campus ERP telemetry. Try asking any natural language or voice query below!',
      timestamp: '12:00 PM',
      type: 'text_response'
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleVoiceToggle = () => {
    if (!isListening) {
      setIsListening(true);
      triggerToast('🎙️ Voice Listener Active... Speak your command now!');
      // Simulate voice capture
      setTimeout(() => {
        setIsListening(false);
        const sampleQuery = 'Show CSE Department attendance trends for last 4 weeks';
        setInputQuery(sampleQuery);
        executeCommand(sampleQuery);
      }, 3000);
    } else {
      setIsListening(false);
    }
  };

  const executeCommand = (queryToRun: string) => {
    const q = queryToRun.trim();
    if (!q) return;

    const userLog: CommandLog = {
      id: `user-${Date.now()}`,
      sender: 'user',
      query: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setLogs(prev => [...prev, userLog]);
    setInputQuery('');
    setIsProcessing(true);

    setTimeout(() => {
      let aiResponse: CommandLog;
      const lowerQ = q.toLowerCase();

      if (lowerQ.includes('attendance') || lowerQ.includes('cse')) {
        aiResponse = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          query: 'Analysis complete for CSE Department attendance. Overall attendance increased to 94% in Week 4, outperforming college average by +7.2%.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'chart_attendance',
          chartData: ATTENDANCE_CHART_DATA,
          summaryMetrics: [
            { label: 'Avg Attendance', value: '94.2%', change: '+5.4%', positive: true },
            { label: 'Top Batch', value: 'CSE-3A', change: '98.1%', positive: true },
            { label: 'Low Alert Batch', value: 'ME-2B', change: '76.4%', positive: false }
          ]
        };
      } else if (lowerQ.includes('fee') || lowerQ.includes('collection') || lowerQ.includes('deficit')) {
        aiResponse = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          query: 'Fee telemetry summary retrieved: 84.5% of Q3 semester fees collected. Total overdue defaults stand at ₹4.2 Lakhs across 38 students.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'chart_fee',
          chartData: FEE_CHART_DATA,
          summaryMetrics: [
            { label: 'Total Collected', value: '₹84.5 Lakhs', change: '84.5%', positive: true },
            { label: 'Pending Balance', value: '₹12.5 Lakhs', change: '12.5%', positive: false },
            { label: 'Overdue Default', value: '₹4.2 Lakhs', change: '3.0%', positive: false }
          ],
          actionRequired: 'Send Automated Fee Due Reminder SMS to 38 accounts?'
        };
      } else if (lowerQ.includes('risk') || lowerQ.includes('counseling') || lowerQ.includes('dropout')) {
        aiResponse = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          query: 'Academic Risk Radar scan executed: Identified 24 high-risk students with combined attendance < 65% and GPA < 5.5. Risk mitigation protocol recommended.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'risk_alert',
          chartData: RISK_TREND_DATA,
          summaryMetrics: [
            { label: 'High Risk Count', value: '24 Students', change: '-22% MoM', positive: true },
            { label: 'Assigned Mentors', value: '18 HODs', change: '100% active', positive: true }
          ],
          actionRequired: 'Schedule automated HOD parent counseling sessions?'
        };
      } else {
        aiResponse = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          query: `I processed your request: "${q}". Telemetry parameters evaluated cleanly across database nodes. Operational status is normal.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text_response'
        };
      }

      setLogs(prev => [...prev, aiResponse]);
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-cyan-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-cyan-400 animate-pulse">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-950 via-indigo-950 to-slate-900 p-8 mb-8 border border-indigo-700/50 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Innovation Module 4
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Executive AI Voice & NL Command Center
            </h1>
            <p className="text-slate-300 mt-2 max-w-2xl text-sm leading-relaxed">
              Zero-click executive intelligence interface. Ask natural language or speech queries to instantaneously generate multi-dimensional campus analytics and initiate institution-wide protocols.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => triggerToast('📊 Executive Summary PDF Generated & Downloaded')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Main Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Preset Voice Commands & Quick Triggers */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" /> Executive Quick Queries
            </h2>
            <div className="space-y-3">
              {PRESET_QUERIES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => executeCommand(preset)}
                  className="w-full text-left p-3.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 text-xs text-slate-300 transition duration-150 flex items-center justify-between group"
                >
                  <span className="pr-2">{preset}</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition" />
                </button>
              ))}
            </div>
          </div>

          {/* Voice Input Visualizer Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/60 rounded-2xl p-6 shadow-2xl text-center">
            <div className="relative inline-block mb-4">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isListening
                    ? 'bg-red-500 shadow-2xl shadow-red-500/80 animate-ping'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-950'
                }`}
              >
                <button onClick={handleVoiceToggle} className="text-white">
                  {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
              </div>
            </div>
            <h3 className="font-bold text-white text-base">
              {isListening ? 'Listening to Executive Command...' : 'Click Mic for Voice Recognition'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports English voice commands with instant speech-to-intent analysis.
            </p>
          </div>
        </div>

        {/* Right Column: Dynamic Feed & Recharts Output */}
        <div className="lg:col-span-8 flex flex-col h-[650px] bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
          {/* Scrollable Conversation Thread */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {logs.map(log => (
              <div
                key={log.id}
                className={`flex gap-4 ${log.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {log.sender === 'ai' && (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-5 ${
                    log.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg'
                      : 'bg-slate-900 border border-slate-700/80 text-slate-200 rounded-tl-none shadow-xl'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2 pb-1 border-b border-white/10">
                    <span className="text-xs font-bold text-cyan-300">
                      {log.sender === 'user' ? 'Executive User' : 'Campus Executive AI'}
                    </span>
                    <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                  </div>

                  <p className="text-sm leading-relaxed">{log.query}</p>

                  {/* Summary Metric Cards */}
                  {log.summaryMetrics && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {log.summaryMetrics.map((m, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-800/90 border border-slate-700">
                          <p className="text-[10px] text-slate-400 font-semibold">{m.label}</p>
                          <p className="text-base font-extrabold text-white mt-0.5">{m.value}</p>
                          <span
                            className={`text-[10px] font-bold ${
                              m.positive ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {m.change}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Chart Rendering Section */}
                  {log.type === 'chart_attendance' && log.chartData && (
                    <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                        <BarChart2 className="w-4 h-4 text-cyan-400" /> Attendance Comparison by Branch (%)
                      </h4>
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={log.chartData}>
                            <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                            <YAxis stroke="#64748b" fontSize={11} domain={[60, 100]} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                            <Bar dataKey="CSE" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="ECE" fill="#818cf8" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="ME" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {log.type === 'chart_fee' && log.chartData && (
                    <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                        <PieIcon className="w-4 h-4 text-emerald-400" /> Fee Deficit & Breakdown (₹)
                      </h4>
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={log.chartData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                              {log.chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {log.type === 'risk_alert' && log.chartData && (
                    <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-amber-400" /> Academic Risk Trajectory
                      </h4>
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={log.chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                            <YAxis stroke="#64748b" fontSize={11} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                            <Line type="monotone" dataKey="highRisk" stroke="#ef4444" strokeWidth={3} />
                            <Line type="monotone" dataKey="mediumRisk" stroke="#f59e0b" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Interactive Protocol Confirmation Trigger */}
                  {log.actionRequired && (
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> {log.actionRequired}
                      </span>
                      <button
                        onClick={() => triggerToast('✅ Executive Protocol Initiated Successfully!')}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                      >
                        Confirm Action
                      </button>
                    </div>
                  )}
                </div>

                {log.sender === 'user' && (
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-4 items-center text-slate-400 text-xs">
                <Bot className="w-5 h-5 text-cyan-400 animate-spin" /> Executing telemetry queries...
              </div>
            )}
          </div>

          {/* Fixed Command Input Console */}
          <div className="p-4 bg-slate-900 border-t border-slate-700/80 flex items-center gap-3">
            <input
              type="text"
              placeholder="Ask AI command center (e.g., 'Show attendance for CSE', 'Generate fee report')..."
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && executeCommand(inputQuery)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />

            <button
              onClick={handleVoiceToggle}
              className={`p-3 rounded-xl border transition ${
                isListening
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>

            <button
              onClick={() => executeCommand(inputQuery)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
