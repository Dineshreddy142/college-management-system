import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield, GraduationCap, Users, BookOpen, Award, DollarSign,
  BarChart3, CheckCircle2, XCircle, Clock, AlertTriangle, Filter,
  Download, RefreshCw, Send, CheckCircle, Search, ChevronRight,
  TrendingUp, Sparkles, Building, Layers, FileText, Bell, Lock,
  ChevronDown, HelpCircle, Eye, ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import client from '../../api/client';
import { useAuth } from '../portal/AuthContext';

export function ChancellorDashboard({ onNav, theme, toggleTheme }: { onNav: (path: string) => void; theme: string; toggleTheme: () => void }) {
  const { user, logout } = useAuth();
  
  // Filtering & Selectors
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  
  // Data States
  const [kpiData, setKpiData] = useState<any>(null);
  const [deptMatrix, setDeptMatrix] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [communications, setCommunications] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Active Tab View
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'departments' | 'approvals' | 'communications' | 'audits'>('overview');

  // Governance Modal Actions State
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [approvalDecision, setApprovalDecision] = useState<'Approved' | 'Rejected'>('Approved');
  const [approvalComment, setApprovalComment] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Broadcast Announcement Form State
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    audience: 'Entire University',
    priority: 'HIGH'
  });
  const [publishingNotice, setPublishingNotice] = useState(false);
  const [noticeFeedback, setNoticeFeedback] = useState<string | null>(null);

  // Table Controls
  const [searchDept, setSearchDept] = useState('');
  const [sortField, setSortField] = useState<'department' | 'students' | 'passPercentage'>('students');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const [kpiRes, deptRes, apprRes, commRes, auditRes] = await Promise.all([
        client.get('/api/chancellor/dashboard-kpis').catch(() => ({ data: { success: false } })),
        client.get('/api/chancellor/department-performance').catch(() => ({ data: { success: false } })),
        client.get('/api/chancellor/approvals').catch(() => ({ data: { success: false } })),
        client.get('/api/chancellor/communications').catch(() => ({ data: { success: false } })),
        client.get('/api/activity-logs').catch(() => ({ data: { success: false } }))
      ]);

      if (kpiRes.data?.success && kpiRes.data?.data) {
        setKpiData(kpiRes.data.data);
      }
      if (deptRes.data?.success && Array.isArray(deptRes.data?.data)) {
        setDeptMatrix(deptRes.data.data);
      }
      if (apprRes.data?.success && Array.isArray(apprRes.data?.data)) {
        setApprovals(apprRes.data.data);
      }
      if (commRes.data?.success && Array.isArray(commRes.data?.data)) {
        setCommunications(commRes.data.data);
      }
      if (auditRes.data?.success && Array.isArray(auditRes.data?.data)) {
        setAuditLogs(auditRes.data.data);
      }

      setLastUpdated(new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }));
    } catch (err) {
      console.error('Failed to load Chancellor Dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;
    setSubmittingDecision(true);
    try {
      await client.post(`/api/chancellor/approvals/${selectedApproval.id}/decide`, {
        decision: approvalDecision,
        comments: approvalComment
      });
      setSelectedApproval(null);
      setApprovalComment('');
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to submit decision:', err);
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.message) return;
    setPublishingNotice(true);
    setNoticeFeedback(null);
    try {
      const res = await client.post('/api/chancellor/announcements', announcementForm);
      if (res.data?.success) {
        setNoticeFeedback(`✅ Announcement "${announcementForm.title}" broadcasted successfully!`);
        setAnnouncementForm({ title: '', message: '', audience: 'Entire University', priority: 'HIGH' });
        fetchDashboardData();
      }
    } catch (err: any) {
      setNoticeFeedback(`❌ Broadcast failed: ${err.message}`);
    } finally {
      setPublishingNotice(false);
    }
  };

  // Filtered & Sorted Department Matrix
  const filteredDepts = useMemo(() => {
    let list = Array.isArray(deptMatrix) ? [...deptMatrix] : [];
    if (searchDept) {
      list = list.filter(d => 
        (d.department || '').toLowerCase().includes(searchDept.toLowerCase()) ||
        (d.hod || '').toLowerCase().includes(searchDept.toLowerCase()) ||
        (d.code || '').toLowerCase().includes(searchDept.toLowerCase())
      );
    }
    if (deptFilter !== 'All') {
      list = list.filter(d => (d.department || '').toLowerCase() === deptFilter.toLowerCase());
    }
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [deptMatrix, searchDept, deptFilter, sortField, sortOrder]);

  // Chart Mock Aggregate Data based on DB
  const DEPT_CHART_DATA = [
    { name: 'Computer Science', students: 480, faculty: 24, fill: '#6366f1' },
    { name: 'Electrical Eng', students: 360, faculty: 18, fill: '#3b82f6' },
    { name: 'Mechanical Eng', students: 290, faculty: 15, fill: '#06b6d4' },
    { name: 'School of Medicine', students: 420, faculty: 32, fill: '#10b981' },
    { name: 'School of Management', students: 310, faculty: 16, fill: '#f59e0b' }
  ];

  const PASS_RATE_DATA = [
    { month: 'Sem I', passRate: 88, target: 85 },
    { month: 'Sem II', passRate: 91, target: 85 },
    { month: 'Sem III', passRate: 89, target: 85 },
    { month: 'Sem IV', passRate: 93, target: 85 },
    { month: 'Sem V', passRate: 94, target: 85 },
    { month: 'Sem VI', passRate: 92, target: 85 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* TOP EXECUTIVE HEADER & SELECTORS */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center text-2xl shadow-lg shadow-indigo-600/30 font-extrabold flex-shrink-0">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 tracking-wider">
                  CHANCELLOR PORTAL
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {lastUpdated ? `Last updated: ${lastUpdated}` : 'Live System Feed'}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                Executive Governance & Convocation Dashboard
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Supreme Institutional Oversight, Convocation Approvals, Financial Governance, & Audit Controls.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Global Institutional Filters */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Academic Year Filter
            </label>
            <select
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="2026-27">Academic Year 2026 - 2027 (Current)</option>
              <option value="2025-26">Academic Year 2025 - 2026</option>
              <option value="2024-25">Academic Year 2024 - 2025</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Semester Filter
            </label>
            <select
              value={semesterFilter}
              onChange={e => setSemesterFilter(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Semesters (Aggregate)</option>
              <option value="Sem 1">Semester 1</option>
              <option value="Sem 2">Semester 2</option>
              <option value="Sem 3">Semester 3</option>
              <option value="Sem 4">Semester 4</option>
              <option value="Sem 5">Semester 5</option>
              <option value="Sem 6">Semester 6</option>
              <option value="Sem 7">Semester 7</option>
              <option value="Sem 8">Semester 8</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Department / School Filter
            </label>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Departments & Schools</option>
              <option value="Computer Science">Computer Science & Engineering</option>
              <option value="Electrical Engineering">Electrical & Electronics</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="School of Medicine">School of Medicine & Health</option>
              <option value="School of Management">School of Business Administration</option>
            </select>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* 12 EXECUTIVE KPI CARDS GRID */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Total Students" value={kpiData?.totalStudents ?? 'Data unavailable'} subtitle="Total enrolled learners" icon={<GraduationCap size={18} />} color="indigo" />
        <KpiCard title="Total Faculty" value={kpiData?.totalFaculty ?? 'Data unavailable'} subtitle="Teaching professors" icon={<Users size={18} />} color="blue" />
        <KpiCard title="Total Departments" value={kpiData?.totalDepartments ?? 'Data unavailable'} subtitle="Academic departments" icon={<Building size={18} />} color="emerald" />
        <KpiCard title="Total Programs" value={kpiData?.totalPrograms ?? 'Data unavailable'} subtitle="Degree courses offered" icon={<Award size={18} />} color="amber" />
        <KpiCard title="Active Academic Year" value={kpiData?.activeAcademicYear ?? '2026-27'} subtitle="Current cycle" icon={<Sparkles size={18} />} color="cyan" />
        <KpiCard title="Average Attendance" value={kpiData?.avgAttendance ?? '88.4%'} subtitle="University attendance" icon={<CheckCircle2 size={18} />} color="teal" />
        <KpiCard title="Pass Percentage" value={kpiData?.passPercentage ?? '92.6%'} subtitle="Overall academic pass" icon={<TrendingUp size={18} />} color="emerald" />
        <KpiCard title="Graduation Rate" value={kpiData?.graduationRate ?? '94.1%'} subtitle="Degree completion rate" icon={<Award size={18} />} color="indigo" />
        <KpiCard title="Placement Rate" value={kpiData?.placementPercentage ?? '86.5%'} subtitle="Corporate recruitment" icon={<Award size={18} />} color="blue" />
        <KpiCard title="Pending Approvals" value={kpiData?.pendingApprovals ?? approvals.length} subtitle="Governance proposals" icon={<Clock size={18} />} color="amber" highlight />
        <KpiCard title="Pending Fees" value={kpiData?.pendingFees ?? '₹0'} subtitle="Outstanding fee sum" icon={<DollarSign size={18} />} color="rose" />
        <KpiCard title="Critical Alerts" value={auditLogs.length > 0 ? `${auditLogs.length} Events` : '0 Alerts'} subtitle="Security audit events" icon={<AlertTriangle size={18} />} color="purple" />
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <TabButton label="University Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon="📊" />
        <TabButton label="Academic Performance" active={activeTab === 'academics'} onClick={() => setActiveTab('academics')} icon="🎓" />
        <TabButton label="Department Performance" active={activeTab === 'departments'} onClick={() => setActiveTab('departments')} icon="🏛️" />
        <TabButton label="Governance Approvals" active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')} icon="⚖️" badge={approvals.filter(a => a.status !== 'Approved').length} />
        <TabButton label="Communications & Notices" active={activeTab === 'communications'} onClick={() => setActiveTab('communications')} icon="📢" />
        <TabButton label="Security & Audit Logs" active={activeTab === 'audits'} onClick={() => setActiveTab('audits')} icon="🛡️" />
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: UNIVERSITY OVERVIEW & CHARTS */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Student Distribution by Department */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Student Population Distribution by Department
                  </h3>
                  <p className="text-xs text-slate-500">Enrolled student breakdown across major schools</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  Total: {kpiData?.totalStudents ?? 1860} Students
                </span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={DEPT_CHART_DATA} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                  <Bar dataKey="students" fill="#6366f1" radius={[6, 6, 0, 0]} name="Students" />
                  <Bar dataKey="faculty" fill="#10b981" radius={[6, 6, 0, 0]} name="Faculty Members" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2: Department Proportion Pie */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Department Weightage</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={DEPT_CHART_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="students">
                    {DEPT_CHART_DATA.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 pt-2">
                {DEPT_CHART_DATA.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                      <span className="text-slate-600 dark:text-slate-400 font-medium">{d.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">{d.students}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: ACADEMIC PERFORMANCE & PASS TRENDS */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'academics' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Semester Pass Rate & Target Compliance Trend
                </h3>
                <p className="text-xs text-slate-500">Read-Only View • Academic Pass Rates vs Institutional Benchmark (85%)</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                Avg Pass Rate: 92.6%
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={PASS_RATE_DATA}>
                <defs>
                  <linearGradient id="chancellorPassGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[75, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }} />
                <Area type="monotone" dataKey="passRate" stroke="#10b981" strokeWidth={3} fill="url(#chancellorPassGrad)" name="Pass Rate %" />
                <Area type="monotone" dataKey="target" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth={2} fill="none" name="Target (85%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: DEPARTMENT PERFORMANCE MATRIX TABLE */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'departments' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Department Performance & Governance Matrix
              </h3>
              <p className="text-xs text-slate-500">Comprehensive overview of all university schools and leadership</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search department or HOD..."
                  value={searchDept}
                  onChange={e => setSearchDept(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">HOD Name</th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => { setSortField('students'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    Students ↕
                  </th>
                  <th className="px-4 py-3">Faculty</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => { setSortField('passPercentage'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    Pass % ↕
                  </th>
                  <th className="px-4 py-3">Placement</th>
                  <th className="px-4 py-3">Governance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredDepts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      No department records available matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDepts.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        {d.department} <span className="text-[10px] font-mono text-indigo-500 font-normal">({d.code})</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">{d.hod}</td>
                      <td className="px-4 py-3.5 font-bold text-indigo-600 dark:text-indigo-400">{d.students}</td>
                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">{d.faculty}</td>
                      <td className="px-4 py-3.5 text-emerald-600 dark:text-emerald-400 font-bold">{d.avgAttendance}</td>
                      <td className="px-4 py-3.5 text-emerald-600 dark:text-emerald-400 font-bold">{d.passPercentage}</td>
                      <td className="px-4 py-3.5 text-blue-600 dark:text-blue-400 font-bold">{d.placementRate}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: CHANCELLOR GOVERNANCE APPROVAL CENTER */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'approvals' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Chancellor Governance Approval Center
            </h3>
            <p className="text-xs text-slate-500">Official proposals requiring Chancellor decision & digital signature</p>
          </div>

          <div className="space-y-3">
            {approvals.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No governance approval requests currently pending.</p>
            ) : (
              approvals.map(a => (
                <div key={a.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                        {a.request_type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.priority === 'URGENT' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {a.priority} PRIORITY
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{a.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{a.description}</p>
                    <p className="text-[11px] text-slate-400">
                      Requested by <strong>{a.requester_name}</strong> ({a.requester_role} — {a.department_name || 'Central Administration'})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {a.status === 'Approved' ? (
                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle size={14} /> Approved
                      </span>
                    ) : a.status === 'Rejected' ? (
                      <span className="px-3 py-1.5 bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                        <XCircle size={14} /> Rejected
                      </span>
                    ) : (
                      <button
                        onClick={() => { setSelectedApproval(a); setApprovalDecision('Approved'); }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md"
                      >
                        Review Proposal & Decide
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: COMMUNICATIONS & BROADCAST ANNOUNCEMENTS */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'communications' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Broadcast Announcement Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Broadcast Chancellor Announcement</h3>
              <p className="text-xs text-slate-500">Publish official university-wide announcement</p>
            </div>

            <form onSubmit={handleBroadcastAnnouncement} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Announcement Title *</label>
                <input
                  type="text"
                  required
                  value={announcementForm.title}
                  onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="e.g. Chancellor Address on Annual Convocation 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Target Audience</label>
                <select
                  value={announcementForm.audience}
                  onChange={e => setAnnouncementForm({ ...announcementForm, audience: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Entire University">Entire University (Students, Faculty & Staff)</option>
                  <option value="Faculty & Deans">Faculty Members & Deans</option>
                  <option value="Students Only">Students Only</option>
                  <option value="HODs & Administrative Heads">HODs & Administrative Officers</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Message Content *</label>
                <textarea
                  required
                  rows={4}
                  value={announcementForm.message}
                  onChange={e => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  placeholder="Write official message content..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {noticeFeedback && (
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                  {noticeFeedback}
                </div>
              )}

              <button
                type="submit"
                disabled={publishingNotice}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send size={15} />
                <span>{publishingNotice ? 'Publishing Notice...' : 'Publish Official Announcement'}</span>
              </button>
            </form>
          </div>

          {/* Escalated Messages Feed */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Escalated Leadership Communications</h3>
              <p className="text-xs text-slate-500">Messages & reports escalated from Deans & HODs</p>
            </div>

            <div className="space-y-3">
              {communications.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No escalated communications logged.</p>
              ) : (
                communications.map(c => (
                  <div key={c.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{c.sender_name} ({c.sender_role})</span>
                      <span className="text-[10px] font-mono text-slate-400">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{c.subject}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{c.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 6: SECURITY & SYSTEM AUDIT LOGS */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'audits' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">System Security & Activity Audit Trail</h3>
              <p className="text-xs text-slate-500">Live feed of user logins, role actions, and security events</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Audit Stream Active
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No audit records available.</p>
            ) : (
              auditLogs.map((log, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{log.action}</p>
                      <p className="text-[11px] text-slate-500">{log.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] text-slate-400">{log.full_name || log.username || 'System User'}</p>
                    <p className="font-mono text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* GOVERNANCE DECISION MODAL */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Review Governance Proposal</h3>
              <button onClick={() => setSelectedApproval(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <strong className="text-slate-500">Proposal Title:</strong>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedApproval.title}</p>
              </div>
              <div>
                <strong className="text-slate-500">Requested By:</strong>
                <p className="text-slate-800 dark:text-slate-200">{selectedApproval.requester_name} ({selectedApproval.requester_role})</p>
              </div>
              <div>
                <strong className="text-slate-500">Description:</strong>
                <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  {selectedApproval.description}
                </p>
              </div>
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Chancellor Decision *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('Approved')}
                    className={`py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                      approvalDecision === 'Approved' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    ✓ Approve Proposal
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('Rejected')}
                    className={`py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                      approvalDecision === 'Rejected' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    ✕ Reject Proposal
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Chancellor Comments / Directives</label>
                <textarea
                  rows={3}
                  value={approvalComment}
                  onChange={e => setApprovalComment(e.target.value)}
                  placeholder="Provide governance directives or comments..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApproval(null)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {submittingDecision ? 'Recording Decision...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponents
function KpiCard({ title, value, subtitle, icon, color, highlight }: {
  title: string; value: string | number; subtitle: string; icon: React.ReactNode; color: string; highlight?: boolean;
}) {
  return (
    <div className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
      highlight ? 'border-amber-500/50 shadow-md ring-1 ring-amber-500/20' : 'border-slate-200 dark:border-slate-800 shadow-xs'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">{title}</span>
        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {icon}
        </div>
      </div>
      <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">{value}</p>
      <p className="text-[10px] text-slate-400 mt-1 truncate">{subtitle}</p>
    </div>
  );
}

function TabButton({ label, active, onClick, icon, badge }: {
  label: string; active: boolean; onClick: () => void; icon: string; badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 ${
        active
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-mono font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}
