import React, { useState } from 'react';
import {
  AlertTriangle, CheckCircle2, AlertCircle, ShieldAlert, Users, TrendingDown,
  Search, Filter, BookOpen, Calendar, PhoneCall, UserCheck, MessageSquare,
  Sparkles, RefreshCw, FileText, ChevronRight, Award, Zap, Brain
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

export interface StudentRiskProfile {
  id: string;
  rollNo: string;
  name: string;
  department: string;
  year: string;
  healthIndex: number; // 0-100
  attendancePct: number;
  avgMarksPct: number;
  assignmentRate: number;
  libraryCheckIns: number;
  riskCategory: 'CRITICAL' | 'MODERATE' | 'HEALTHY';
  primaryRiskFactors: string[];
  lastIntervention?: string;
  mentorName: string;
  avatarBg: string;
}

const INITIAL_STUDENTS: StudentRiskProfile[] = [
  {
    id: 'st_1',
    rollNo: '21CSE042',
    name: 'Rahul Sharma',
    department: 'CSE',
    year: '3rd Year',
    healthIndex: 42,
    attendancePct: 58,
    avgMarksPct: 48,
    assignmentRate: 40,
    libraryCheckIns: 2,
    riskCategory: 'CRITICAL',
    primaryRiskFactors: ['Attendance drop below 60%', 'Failed 2 Mid-term tests', 'Zero assignment submissions in 3 weeks'],
    lastIntervention: 'Parent notified on Sept 12th',
    mentorName: 'Dr. K. V. Rao',
    avatarBg: 'bg-rose-600'
  },
  {
    id: 'st_2',
    rollNo: '21ECE088',
    name: 'Priya Verma',
    department: 'ECE',
    year: '3rd Year',
    healthIndex: 47,
    attendancePct: 62,
    avgMarksPct: 51,
    assignmentRate: 50,
    libraryCheckIns: 4,
    riskCategory: 'CRITICAL',
    primaryRiskFactors: ['Signals & Systems test failure', '3 consecutive absent days'],
    mentorName: 'Prof. S. Mehra',
    avatarBg: 'bg-rose-600'
  },
  {
    id: 'st_3',
    rollNo: '22MECH015',
    name: 'Aniket Gupta',
    department: 'MECH',
    year: '2nd Year',
    healthIndex: 64,
    attendancePct: 71,
    avgMarksPct: 63,
    assignmentRate: 75,
    libraryCheckIns: 8,
    riskCategory: 'MODERATE',
    primaryRiskFactors: ['Thermodynamics assignment overdue', 'Lab attendance declining'],
    mentorName: 'Dr. R. P. Singh',
    avatarBg: 'bg-amber-600'
  },
  {
    id: 'st_4',
    rollNo: '21CSE104',
    name: 'Sneha Reddy',
    department: 'CSE',
    year: '3rd Year',
    healthIndex: 91,
    attendancePct: 94,
    avgMarksPct: 88,
    assignmentRate: 98,
    libraryCheckIns: 26,
    riskCategory: 'HEALTHY',
    primaryRiskFactors: [],
    mentorName: 'Dr. K. V. Rao',
    avatarBg: 'bg-emerald-600'
  },
  {
    id: 'st_5',
    rollNo: '23CIVIL029',
    name: 'Vikram Joshi',
    department: 'CIVIL',
    year: '1st Year',
    healthIndex: 56,
    attendancePct: 68,
    avgMarksPct: 59,
    assignmentRate: 65,
    libraryCheckIns: 5,
    riskCategory: 'MODERATE',
    primaryRiskFactors: ['Structural Analysis quiz score < 50%'],
    mentorName: 'Prof. N. Swamy',
    avatarBg: 'bg-amber-600'
  },
  {
    id: 'st_6',
    rollNo: '22CSE077',
    name: 'Divya Nair',
    department: 'CSE',
    year: '2nd Year',
    healthIndex: 38,
    attendancePct: 52,
    avgMarksPct: 44,
    assignmentRate: 30,
    libraryCheckIns: 1,
    riskCategory: 'CRITICAL',
    primaryRiskFactors: ['Data Structures backlogs', 'Attendance warning issued'],
    mentorName: 'Dr. K. V. Rao',
    avatarBg: 'bg-rose-600'
  }
];

const DEPT_CHART_DATA = [
  { name: 'CSE', critical: 12, moderate: 24, healthy: 180 },
  { name: 'ECE', critical: 9, moderate: 18, healthy: 140 },
  { name: 'MECH', critical: 14, moderate: 30, healthy: 110 },
  { name: 'CIVIL', critical: 8, moderate: 15, healthy: 95 }
];

const RISK_PIE_DATA = [
  { name: 'Critical Risk (<50)', value: 43, color: '#EF4444' },
  { name: 'Moderate Risk (50-70)', value: 87, color: '#F59E0B' },
  { name: 'Healthy (>70)', value: 525, color: '#10B981' }
];

export const AcademicRiskRadar: React.FC = () => {
  const [students, setStudents] = useState<StudentRiskProfile[]>(INITIAL_STUDENTS);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRiskProfile | null>(null);
  const [interventionNote, setInterventionNote] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredStudents = students.filter(s => {
    if (selectedDept !== 'ALL' && s.department !== selectedDept) return false;
    if (selectedRisk !== 'ALL' && s.riskCategory !== selectedRisk) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q);
    }
    return true;
  });

  const handleLogIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !interventionNote.trim()) return;

    setStudents(prev => prev.map(s => s.id === selectedStudent.id ? {
      ...s,
      lastIntervention: `Counseling Log: ${interventionNote} (${new Date().toLocaleDateString()})`
    } : s));

    showToast(`Logged counseling intervention for ${selectedStudent.name}`);
    setSelectedStudent(null);
    setInterventionNote('');
  };

  const criticalCount = students.filter(s => s.riskCategory === 'CRITICAL').length;
  const moderateCount = students.filter(s => s.riskCategory === 'MODERATE').length;
  const healthyCount = students.filter(s => s.riskCategory === 'HEALTHY').length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 select-none">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-6 rounded-3xl border border-rose-900/40 shadow-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-widest">
            <Brain className="w-4 h-4 animate-pulse" />
            <span>AI Predictive Intelligence Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span>Student Academic Risk & Dropout Radar</span>
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Predicts academic failure & dropout risk 4–6 weeks ahead using real-time attendance velocity, mid-term grade trajectories, and assignment submission frequency.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 flex-wrap sm:flex-nowrap">
          <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-rose-500/30 text-center flex-1 min-w-[100px]">
            <span className="block text-[10px] text-rose-400 font-bold uppercase">Critical Risk</span>
            <span className="text-xl font-black text-rose-400">{criticalCount}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-amber-500/30 text-center flex-1 min-w-[100px]">
            <span className="block text-[10px] text-amber-400 font-bold uppercase">Moderate Risk</span>
            <span className="text-xl font-black text-amber-400">{moderateCount}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-emerald-500/30 text-center flex-1 min-w-[100px]">
            <span className="block text-[10px] text-emerald-400 font-bold uppercase">Healthy</span>
            <span className="text-xl font-black text-emerald-400">{healthyCount}</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Breakdown Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart className="w-4 h-4 text-rose-500" />
            <span>Risk Distribution by Department</span>
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEPT_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                <Bar dataKey="critical" name="Critical Risk" fill="#EF4444" radius={[6, 6, 0, 0]} />
                <Bar dataKey="moderate" name="Moderate Risk" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                <Bar dataKey="healthy" name="Healthy" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overall Campus Health Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-500" />
            <span>Campus Health Overview</span>
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={RISK_PIE_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={5}>
                  {RISK_PIE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Critical Risk</span>
              <span className="font-bold text-rose-500">6.5%</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Moderate Risk</span>
              <span className="font-bold text-amber-500">13.3%</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Healthy</span>
              <span className="font-bold text-emerald-500">80.2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name or roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="ALL">All Departments</option>
            <option value="CSE">CSE Dept</option>
            <option value="ECE">ECE Dept</option>
            <option value="MECH">Mechanical</option>
            <option value="CIVIL">Civil Eng</option>
          </select>

          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">🔴 Critical Risk Only</option>
            <option value="MODERATE">🟡 Moderate Risk</option>
            <option value="HEALTHY">🟢 Healthy</option>
          </select>
        </div>
      </div>

      {/* Student Risk Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStudents.map((st) => {
          const isCritical = st.riskCategory === 'CRITICAL';
          const isModerate = st.riskCategory === 'MODERATE';

          return (
            <div
              key={st.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl border ${isCritical ? 'border-rose-500/50 shadow-rose-500/10' : isModerate ? 'border-amber-500/50' : 'border-slate-200 dark:border-slate-800'} p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all hover:scale-[1.01]`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl ${st.avatarBg} text-white flex items-center justify-center font-black text-sm shadow-md`}>
                      {st.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{st.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">{st.rollNo} • {st.department} ({st.year})</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${isCritical ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : isModerate ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'}`}>
                    {st.riskCategory}
                  </span>
                </div>

                {/* Health Meter Progress Bar */}
                <div className="space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400">Academic Health Score</span>
                    <span className={isCritical ? 'text-rose-500 font-mono text-sm font-black' : isModerate ? 'text-amber-500 font-mono text-sm font-black' : 'text-emerald-500 font-mono text-sm font-black'}>
                      {st.healthIndex} / 100
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-rose-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${st.healthIndex}%` }}
                    />
                  </div>
                </div>

                {/* Performance Metrics breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Attendance</span>
                    <span className={`font-bold ${st.attendancePct < 65 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>{st.attendancePct}%</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Avg Test</span>
                    <span className={`font-bold ${st.avgMarksPct < 50 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>{st.avgMarksPct}%</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Assignment</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{st.assignmentRate}%</span>
                  </div>
                </div>

                {/* Identified Risk Factors */}
                {st.primaryRiskFactors.length > 0 && (
                  <div className="space-y-1 text-[11px]">
                    <span className="font-bold text-rose-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Key AI Risk Flags:
                    </span>
                    <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 space-y-0.5 pl-1">
                      {st.primaryRiskFactors.map((rf, idx) => (
                        <li key={idx} className="truncate">{rf}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {st.lastIntervention && (
                  <div className="p-2 bg-blue-950/40 border border-blue-800/40 rounded-xl text-[10px] text-blue-300 font-medium truncate">
                    💬 {st.lastIntervention}
                  </div>
                )}
              </div>

              {/* Action */}
              <button
                onClick={() => setSelectedStudent(st)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                <span>Log Faculty Intervention</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Faculty Intervention Counseling Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md text-slate-100 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Early Counseling Logger</span>
              <h3 className="text-base font-black text-white">Log Action for {selectedStudent.name}</h3>
              <p className="text-xs text-slate-400">{selectedStudent.rollNo} • Mentor: {selectedStudent.mentorName}</p>
            </div>

            <form onSubmit={handleLogIntervention} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Intervention Action / Notes</label>
                <textarea
                  required
                  rows={4}
                  value={interventionNote}
                  onChange={(e) => setInterventionNote(e.target.value)}
                  placeholder="E.g., Met student one-on-one; scheduled doubt clearing class in Signals & Systems; called parents..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  <UserCheck className="w-4 h-4" /> Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicRiskRadar;
