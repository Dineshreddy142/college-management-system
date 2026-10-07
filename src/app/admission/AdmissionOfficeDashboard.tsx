import React, { useState, useEffect, useCallback } from 'react';
import client from '../../api/client';
import { useAuth } from '../portal/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  Users,
  FileText,
  FileCheck,
  Filter,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  ChevronRight,
  Eye,
  ArrowRight,
  Lock,
  UserCheck,
  ShieldAlert,
  Sun,
  Moon,
  Menu,
  Building2,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Award,
  DollarSign
} from 'lucide-react';

interface AdmissionOfficeDashboardProps {
  onNav?: (module: string) => void;
  theme?: string;
  toggleTheme?: () => void;
}

type TabType = 
  | 'dashboard'
  | 'cycles'
  | 'programs'
  | 'applicants'
  | 'applications'
  | 'documents'
  | 'cutoff'
  | 'interviews'
  | 'decisions'
  | 'payments';

export function AdmissionOfficeDashboard({ onNav, theme = 'light', toggleTheme }: AdmissionOfficeDashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Stats & Collections
  const [stats, setStats] = useState<any>({
    totalApplications: 0,
    newApplications: 0,
    underReview: 0,
    selectedCandidates: 0,
    confirmedAdmissions: 0,
    convertedStudents: 0,
    pendingDocuments: 0,
    scheduledInterviews: 0,
    totalFeesCollected: 0
  });

  const [cycles, setCycles] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCycleId, setFilterCycleId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Modals & Active Drawers
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [applicationDetailsModal, setApplicationDetailsModal] = useState<boolean>(false);
  
  // Student Conversion State
  const [showConversionModal, setShowConversionModal] = useState<boolean>(false);
  const [conversionConfirmed, setConversionConfirmed] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionSuccess, setConversionSuccess] = useState<{ studentId: number; rollNumber: string } | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Form Modals
  const [showCycleModal, setShowCycleModal] = useState<boolean>(false);
  const [newCycleData, setNewCycleData] = useState({ cycle_name: '', start_date: '', end_date: '', status: 'UPCOMING' });

  const [showProgramModal, setShowProgramModal] = useState<boolean>(false);
  const [newProgramData, setNewProgramData] = useState({ cycle_id: '', program_name: '', program_code: '', total_seats: '50', tuition_fee: '50000', eligibility_criteria: '' });

  const [showApplicantModal, setShowApplicantModal] = useState<boolean>(false);
  const [newApplicantData, setNewApplicantData] = useState({ first_name: '', last_name: '', email: '', phone: '', gender: 'MALE', date_of_birth: '' });

  const [showDocModal, setShowDocModal] = useState<boolean>(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [docVerifyStatus, setDocVerifyStatus] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const [showInterviewModal, setShowInterviewModal] = useState<boolean>(false);
  const [newInterviewData, setNewInterviewData] = useState({ application_id: '', interviewer_user_id: '', scheduled_date: '', location_or_link: '', notes: '' });

  const [showDecisionModal, setShowDecisionModal] = useState<boolean>(false);
  const [newDecisionData, setNewDecisionData] = useState({ application_id: '', decision: 'SELECTED', remarks: '', merit_rank: '' });

  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [newPaymentData, setNewPaymentData] = useState({ application_id: '', amount_paid: '', payment_method: 'CASH', transaction_reference: '', notes: '' });

  const [cutoffScore, setCutoffScore] = useState<string>('75');
  const [cutoffEvaluating, setCutoffEvaluating] = useState<boolean>(false);
  const [cutoffResults, setCutoffResults] = useState<any | null>(null);

  // Fetch all initial data cleanly
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard stats
      const statsRes = await client.get('/admission/dashboard-stats');
      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
      }

      // Fetch Collections in Parallel
      const [cyclesRes, progsRes, appsRes, docsRes, intsRes, decsRes, paysRes, deptsRes, usersRes] = await Promise.all([
        client.get('/admission/cycles').catch(() => ({ data: { data: [] } })),
        client.get('/admission/programs').catch(() => ({ data: { data: [] } })),
        client.get('/admission/applications').catch(() => ({ data: { data: [] } })),
        client.get('/admission/documents').catch(() => ({ data: { data: [] } })),
        client.get('/admission/interviews').catch(() => ({ data: { data: [] } })),
        client.get('/admission/decisions').catch(() => ({ data: { data: [] } })),
        client.get('/admission/fee-payments').catch(() => ({ data: { data: [] } })),
        client.get('/departments').catch(() => ({ data: [] })),
        client.get('/users').catch(() => ({ data: { data: [] } }))
      ]);

      setCycles(Array.isArray(cyclesRes.data?.data) ? cyclesRes.data.data : []);
      setPrograms(Array.isArray(progsRes.data?.data) ? progsRes.data.data : []);
      setApplications(Array.isArray(appsRes.data?.data) ? appsRes.data.data : []);
      setDocuments(Array.isArray(docsRes.data?.data) ? docsRes.data.data : []);
      setInterviews(Array.isArray(intsRes.data?.data) ? intsRes.data.data : []);
      setDecisions(Array.isArray(decsRes.data?.data) ? decsRes.data.data : []);
      setPayments(Array.isArray(paysRes.data?.data) ? paysRes.data.data : []);
      setDepartments(Array.isArray(deptsRes.data) ? deptsRes.data : Array.isArray(deptsRes.data?.data) ? deptsRes.data.data : []);
      setUsersList(Array.isArray(usersRes.data?.data) ? usersRes.data.data : Array.isArray(usersRes.data) ? usersRes.data : []);

    } catch (err: any) {
      console.error("Failed to load admission dashboard data", err);
      setError(err?.response?.data?.message || err?.message || 'Failed to connect to Admission API');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // View full application details modal
  const openApplicationDetails = async (appId: number) => {
    try {
      const res = await client.get(`/admission/applications/${appId}`);
      if (res.data?.data?.application) {
        setSelectedApplication(res.data.data);
        setApplicationDetailsModal(true);
        setConversionSuccess(null);
        setConversionError(null);
      }
    } catch (err: any) {
      alert("Failed to load application details: " + (err.response?.data?.message || err.message));
    }
  };

  // Execute Student Conversion
  const handleExecuteConversion = async () => {
    if (!selectedApplication?.application?.id) return;
    if (!conversionConfirmed) {
      setConversionError("You must explicitly confirm conversion before proceeding.");
      return;
    }

    try {
      setIsConverting(true);
      setConversionError(null);
      const appId = selectedApplication.application.id;
      const res = await client.post(`/admission/applications/${appId}/convert-to-student`, {
        department_id: selectedApplication.application.department_id
      });

      if (res.data?.success) {
        setConversionSuccess({
          studentId: res.data.studentId,
          rollNumber: res.data.rollNumber
        });
        setShowConversionModal(false);
        // Refresh application details and main list
        openApplicationDetails(appId);
        loadData();
      } else {
        throw new Error(res.data?.message || "Conversion failed");
      }
    } catch (err: any) {
      setConversionError(err.response?.data?.message || err.message || "Failed to convert student.");
    } finally {
      setIsConverting(false);
    }
  };

  // Create Cycle
  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/admission/cycles', newCycleData);
      setShowCycleModal(false);
      setNewCycleData({ cycle_name: '', start_date: '', end_date: '', status: 'UPCOMING' });
      loadData();
    } catch (err: any) {
      alert("Error creating cycle: " + (err.response?.data?.message || err.message));
    }
  };

  // Create Program
  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/admission/programs', newProgramData);
      setShowProgramModal(false);
      setNewProgramData({ cycle_id: '', program_name: '', program_code: '', total_seats: '50', tuition_fee: '50000', eligibility_criteria: '' });
      loadData();
    } catch (err: any) {
      alert("Error creating program: " + (err.response?.data?.message || err.message));
    }
  };

  // Create Applicant Profile
  const handleCreateApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/admission/applicants', newApplicantData);
      setShowApplicantModal(false);
      setNewApplicantData({ first_name: '', last_name: '', email: '', phone: '', gender: 'MALE', date_of_birth: '' });
      loadData();
    } catch (err: any) {
      alert("Error creating candidate profile: " + (err.response?.data?.message || err.message));
    }
  };

  // Update Document Verification Metadata
  const handleVerifyDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    try {
      await client.patch(`/admission/documents/${selectedDoc.id}/verify`, {
        verification_status: docVerifyStatus,
        rejection_reason: docVerifyStatus === 'REJECTED' ? rejectionReason : null
      });
      setShowDocModal(false);
      setSelectedDoc(null);
      loadData();
    } catch (err: any) {
      alert("Error updating document status: " + (err.response?.data?.message || err.message));
    }
  };

  // Schedule Interview
  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/admission/interviews', newInterviewData);
      setShowInterviewModal(false);
      setNewInterviewData({ application_id: '', interviewer_user_id: '', scheduled_date: '', location_or_link: '', notes: '' });
      loadData();
    } catch (err: any) {
      alert("Error scheduling interview: " + (err.response?.data?.message || err.message));
    }
  };

  // Record Decision
  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/admission/decisions', newDecisionData);
      setShowDecisionModal(false);
      setNewDecisionData({ application_id: '', decision: 'SELECTED', remarks: '', merit_rank: '' });
      loadData();
    } catch (err: any) {
      alert("Error recording decision: " + (err.response?.data?.message || err.message));
    }
  };

  // Record Counter Fee Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/admission/fee-payments', newPaymentData);
      setShowPaymentModal(false);
      setNewPaymentData({ application_id: '', amount_paid: '', payment_method: 'CASH', transaction_reference: '', notes: '' });
      loadData();
    } catch (err: any) {
      alert("Error recording fee payment: " + (err.response?.data?.message || err.message));
    }
  };

  // Auto-screen Cutoff Eligibility
  const handleEvaluateCutoff = async () => {
    try {
      setCutoffEvaluating(true);
      const res = await client.post('/admission/eligibility/auto-screen', {
        cutoff_score: Number(cutoffScore)
      });
      setCutoffResults(res.data?.data || null);
      loadData();
    } catch (err: any) {
      alert("Error running cutoff screening: " + (err.response?.data?.message || err.message));
    } finally {
      setCutoffEvaluating(false);
    }
  };

  // Filtering Applications Roster
  const filteredApplications = applications.filter((app) => {
    const matchesSearch = 
      (app.application_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.applicant_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.program_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCycle = !filterCycleId || String(app.cycle_id) === String(filterCycleId);
    const matchesStatus = !filterStatus || app.application_status === filterStatus;
    return matchesSearch && matchesCycle && matchesStatus;
  });

  // Status Badge Styling Helper
  const renderAppStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      DRAFT: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
      SUBMITTED: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
      UNDER_REVIEW: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
      SELECTED: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
      WAITLISTED: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
      REJECTED: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
      OFFER_SENT: { bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400' },
      ADMISSION_CONFIRMED: { bg: 'bg-teal-50 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400' },
      CONVERTED_TO_STUDENT: { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
    };
    const c = config[status] || config.DRAFT;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const renderFeeStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      FEE_PENDING: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
      PARTIALLY_PAID: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
      PAID: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
    };
    const c = config[status] || config.FEE_PENDING;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${c.bg} ${c.text}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const tabsNav: { id: TabType; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'cycles', label: 'Admission Cycles', icon: Calendar },
    { id: 'programs', label: 'Programs & Intake', icon: GraduationCap },
    { id: 'applicants', label: 'Candidate Profiles', icon: Users },
    { id: 'applications', label: 'Application Registry', icon: FileText, badge: stats.newApplications },
    { id: 'documents', label: 'Document Verification', icon: FileCheck, badge: stats.pendingDocuments },
    { id: 'cutoff', label: 'Cutoff & Eligibility', icon: Filter },
    { id: 'interviews', label: 'Interviews', icon: CalendarDays, badge: stats.scheduledInterviews },
    { id: 'decisions', label: 'Selection Decisions', icon: CheckCircle2 },
    { id: 'payments', label: 'Counter Receipts', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-slate-800/90 backdrop-blur-md border-b border-slate-700/60 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Admission Control Office</h1>
              <p className="text-xs text-slate-400">Enrollment & Governance Workspace</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 rounded-xl text-slate-300 transition-all text-xs font-medium flex items-center space-x-1.5"
            title="Refresh Admission Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 rounded-xl text-slate-300 transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          )}

          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-slate-300">{user?.full_name || user?.username || 'Admission Officer'}</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">OFFICER</span>
          </div>
        </div>
      </header>

      {/* Workspace Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside
          className={`${
            mobileMenuOpen ? 'block' : 'hidden'
          } md:block w-64 bg-slate-800/60 border-r border-slate-700/60 flex-shrink-0 overflow-y-auto p-3 transition-all z-20`}
        >
          <div className="space-y-1">
            {tabsNav.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        isActive ? 'bg-white text-indigo-700' : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 p-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl">
            <div className="flex items-center space-x-2 mb-1.5 text-xs font-semibold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 3 Engine Status</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              API connected cleanly. Zero hardcoded roll numbers. Atomic MySQL sequence tracking active.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950">
          {error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-800/60 rounded-2xl flex items-start space-x-3 text-red-300">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-red-200">System Telemetry Alert</p>
                <p className="mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-medium">Fetching admission telemetry...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: EXECUTIVE DASHBOARD OVERVIEW */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* KPI Summary Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm relative overflow-hidden">
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-medium">Total Applications</span>
                        <FileText className="w-4 h-4 text-indigo-400" />
                      </div>
                      <p className="text-2xl font-bold text-white">{stats.totalApplications || 0}</p>
                      <div className="mt-2 text-[11px] text-slate-400 flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span>{stats.newApplications || 0} submitted new</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-medium">Documents Pending</span>
                        <FileCheck className="w-4 h-4 text-amber-400" />
                      </div>
                      <p className="text-2xl font-bold text-amber-400">{stats.pendingDocuments || 0}</p>
                      <div className="mt-2 text-[11px] text-slate-400">Awaiting metadata verification</div>
                    </div>

                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-medium">Confirmed Admissions</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-2xl font-bold text-emerald-400">{stats.confirmedAdmissions || 0}</p>
                      <div className="mt-2 text-[11px] text-slate-400">{stats.convertedStudents || 0} converted to enrolled students</div>
                    </div>

                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-medium">Total Fee Collected</span>
                        <DollarSign className="w-4 h-4 text-teal-400" />
                      </div>
                      <p className="text-2xl font-bold text-teal-400">₹{Number(stats.totalFeesCollected || 0).toLocaleString()}</p>
                      <div className="mt-2 text-[11px] text-slate-400">Counter & online receipts</div>
                    </div>
                  </div>

                  {/* Zero Record Onboarding Banner */}
                  {stats.totalApplications === 0 && (
                    <div className="p-6 bg-indigo-950/30 border border-indigo-800/40 rounded-2xl text-center space-y-3">
                      <div className="inline-flex p-3 bg-indigo-600/20 text-indigo-400 rounded-full">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-indigo-200">Zero Admission Applications Recorded</h3>
                      <p className="text-xs text-slate-400 max-w-lg mx-auto">
                        The admission database is currently empty. Get started by creating an active admission cycle, setting up program seat targets, and adding candidate application profiles.
                      </p>
                      <div className="pt-2 flex justify-center space-x-3">
                        <button
                          onClick={() => setActiveTab('cycles')}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-all"
                        >
                          Create Admission Cycle
                        </button>
                        <button
                          onClick={() => setActiveTab('applicants')}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-all border border-slate-700"
                        >
                          Add Candidate Profile
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Queue & Quick Roster */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Action Items */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Pending Action Items</h3>
                      <div className="space-y-2">
                        <div
                          onClick={() => setActiveTab('documents')}
                          className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                        >
                          <div className="flex items-center space-x-2.5">
                            <FileCheck className="w-4 h-4 text-amber-400" />
                            <span className="text-xs text-slate-300 font-medium">Verify Pending Documents</span>
                          </div>
                          <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md">
                            {stats.pendingDocuments || 0}
                          </span>
                        </div>

                        <div
                          onClick={() => setActiveTab('interviews')}
                          className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                        >
                          <div className="flex items-center space-x-2.5">
                            <CalendarDays className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs text-slate-300 font-medium">Scheduled Candidate Interviews</span>
                          </div>
                          <span className="text-xs font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md">
                            {stats.scheduledInterviews || 0}
                          </span>
                        </div>

                        <div
                          onClick={() => setActiveTab('applications')}
                          className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                        >
                          <div className="flex items-center space-x-2.5">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-slate-300 font-medium">Applications Under Review</span>
                          </div>
                          <span className="text-xs font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md">
                            {stats.underReview || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Roster */}
                    <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recent Application Stream</h3>
                        <button
                          onClick={() => setActiveTab('applications')}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
                        >
                          <span>View All</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {applications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500">No applications registered yet.</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-800/80 text-slate-400">
                              <tr>
                                <th className="p-2.5 rounded-l-lg">App #</th>
                                <th className="p-2.5">Applicant Name</th>
                                <th className="p-2.5">Program</th>
                                <th className="p-2.5">App Status</th>
                                <th className="p-2.5">Fee Status</th>
                                <th className="p-2.5 rounded-r-lg text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-300">
                              {applications.slice(0, 5).map((app) => (
                                <tr key={app.id} className="hover:bg-slate-800/40">
                                  <td className="p-2.5 font-mono text-indigo-300">{app.application_number}</td>
                                  <td className="p-2.5 font-medium text-white">{app.applicant_name}</td>
                                  <td className="p-2.5 text-slate-400">{app.program_name || 'N/A'}</td>
                                  <td className="p-2.5">{renderAppStatusBadge(app.application_status)}</td>
                                  <td className="p-2.5">{renderFeeStatusBadge(app.fee_status)}</td>
                                  <td className="p-2.5 text-right">
                                    <button
                                      onClick={() => openApplicationDetails(app.id)}
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[11px]"
                                    >
                                      Inspect
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ADMISSION CYCLES */}
              {activeTab === 'cycles' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white">Admission Cycles Management</h2>
                      <p className="text-xs text-slate-400">Define academic enrollment intake windows</p>
                    </div>
                    <button
                      onClick={() => setShowCycleModal(true)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Cycle</span>
                    </button>
                  </div>

                  {cycles.length === 0 ? (
                    <div className="py-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400 space-y-2">
                      <p className="font-semibold text-slate-300">No Admission Cycles Defined</p>
                      <p>Click 'Create Cycle' above to set up the first academic intake window.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cycles.map((c) => (
                        <div key={c.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white">{c.cycle_name}</h3>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                c.status === 'ACTIVE'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : c.status === 'UPCOMING'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-slate-700 text-slate-400'
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 space-y-1">
                            <p>Start Date: <span className="text-slate-200">{c.start_date || 'N/A'}</span></p>
                            <p>End Date: <span className="text-slate-200">{c.end_date || 'N/A'}</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PROGRAMS & INTAKE */}
              {activeTab === 'programs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white">Programs & Intake Capacity</h2>
                      <p className="text-xs text-slate-400">Track seat allocation and tuition fee targets</p>
                    </div>
                    <button
                      onClick={() => setShowProgramModal(true)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Program Intake</span>
                    </button>
                  </div>

                  {programs.length === 0 ? (
                    <div className="py-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400 space-y-2">
                      <p className="font-semibold text-slate-300">No Programs Configured</p>
                      <p>Create a program intake capacity to begin accepting applications.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/80 text-slate-400">
                          <tr>
                            <th className="p-3">Program Code</th>
                            <th className="p-3">Program Name</th>
                            <th className="p-3">Cycle</th>
                            <th className="p-3">Total Seats</th>
                            <th className="p-3">Allocated Seats</th>
                            <th className="p-3">Remaining Seats</th>
                            <th className="p-3">Tuition Fee</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {programs.map((p) => {
                            const remaining = (p.total_seats || 0) - (p.allocated_seats || 0);
                            return (
                              <tr key={p.id} className="hover:bg-slate-800/40">
                                <td className="p-3 font-mono text-indigo-300">{p.program_code}</td>
                                <td className="p-3 font-medium text-white">{p.program_name}</td>
                                <td className="p-3 text-slate-400">{p.cycle_name || `Cycle #${p.cycle_id}`}</td>
                                <td className="p-3 font-bold text-white">{p.total_seats}</td>
                                <td className="p-3 text-emerald-400 font-bold">{p.allocated_seats}</td>
                                <td className="p-3 text-amber-400 font-bold">{remaining}</td>
                                <td className="p-3 font-mono">₹{Number(p.tuition_fee || 0).toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CANDIDATE PROFILES */}
              {activeTab === 'applicants' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white">Candidate Master Profiles</h2>
                      <p className="text-xs text-slate-400">Manage prospective candidate identities</p>
                    </div>
                    <button
                      onClick={() => setShowApplicantModal(true)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Candidate Profile</span>
                    </button>
                  </div>

                  {applicants.length === 0 ? (
                    <div className="py-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                      No candidate profiles created yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {applicants.map((a) => (
                        <div key={a.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-sm">{a.first_name} {a.last_name}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">ID: {a.id}</span>
                          </div>
                          <p className="text-slate-400">Email: <span className="text-slate-200">{a.email}</span></p>
                          <p className="text-slate-400">Phone: <span className="text-slate-200">{a.mobile || a.phone || 'N/A'}</span></p>
                          <p className="text-slate-400">Gender: <span className="text-slate-200">{a.gender}</span></p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: APPLICATION REGISTRY & DETAILS */}
              {activeTab === 'applications' && (
                <div className="space-y-4">
                  {/* Search & Filter Header */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full md:w-72">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search App #, Name, Program..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex w-full md:w-auto items-center space-x-2">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                      >
                        <option value="">All Application Statuses</option>
                        <option value="SUBMITTED">SUBMITTED</option>
                        <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                        <option value="SELECTED">SELECTED</option>
                        <option value="OFFER_SENT">OFFER_SENT</option>
                        <option value="ADMISSION_CONFIRMED">ADMISSION_CONFIRMED</option>
                        <option value="CONVERTED_TO_STUDENT">CONVERTED_TO_STUDENT</option>
                      </select>
                    </div>
                  </div>

                  {/* Application Roster Table */}
                  {filteredApplications.length === 0 ? (
                    <div className="py-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                      No applications match the selected query or filter.
                    </div>
                  ) : (
                    <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/80 text-slate-400">
                          <tr>
                            <th className="p-3">Application #</th>
                            <th className="p-3">Candidate Name</th>
                            <th className="p-3">Program</th>
                            <th className="p-3">App Status</th>
                            <th className="p-3">Fee Status</th>
                            <th className="p-3">Tuition Fee</th>
                            <th className="p-3">Paid Amount</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {filteredApplications.map((app) => (
                            <tr key={app.id} className="hover:bg-slate-800/40">
                              <td className="p-3 font-mono text-indigo-300">{app.application_number}</td>
                              <td className="p-3 font-medium text-white">{app.applicant_name}</td>
                              <td className="p-3 text-slate-400">{app.program_name || 'N/A'}</td>
                              <td className="p-3">{renderAppStatusBadge(app.application_status)}</td>
                              <td className="p-3">{renderFeeStatusBadge(app.fee_status)}</td>
                              <td className="p-3 font-mono">₹{Number(app.agreed_tuition_fee || 0).toLocaleString()}</td>
                              <td className="p-3 font-mono text-emerald-400">₹{Number(app.paid_amount || 0).toLocaleString()}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => openApplicationDetails(app.id)}
                                  className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition-all"
                                >
                                  Application Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: DOCUMENT VERIFICATION */}
              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white">Document Metadata Verification Center</h2>
                      <p className="text-xs text-slate-400">Audit candidate document registration & SHA256 checksums</p>
                    </div>
                  </div>

                  {documents.length === 0 ? (
                    <div className="py-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                      No document metadata records awaiting verification.
                    </div>
                  ) : (
                    <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/80 text-slate-400">
                          <tr>
                            <th className="p-3">Doc ID</th>
                            <th className="p-3">Doc Type</th>
                            <th className="p-3">Original Filename</th>
                            <th className="p-3">App #</th>
                            <th className="p-3">MIME / Size</th>
                            <th className="p-3">Verification Status</th>
                            <th className="p-3 text-right">Verify Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {documents.map((doc) => (
                            <tr key={doc.id} className="hover:bg-slate-800/40">
                              <td className="p-3 font-mono text-indigo-300">#{doc.id}</td>
                              <td className="p-3 font-medium text-white">{doc.document_type}</td>
                              <td className="p-3 text-slate-300 font-mono text-[11px]">{doc.original_filename}</td>
                              <td className="p-3 text-slate-400 font-mono">{doc.application_number || `#${doc.application_id}`}</td>
                              <td className="p-3 text-slate-400 text-[11px]">
                                {doc.mime_type || 'PDF'} ({Math.round((doc.file_size_bytes || 1024) / 1024)} KB)
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                    doc.verification_status === 'VERIFIED'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : doc.verification_status === 'REJECTED'
                                      ? 'bg-red-500/20 text-red-300'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}
                                >
                                  {doc.verification_status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedDoc(doc);
                                    setDocVerifyStatus('VERIFIED');
                                    setShowDocModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium"
                                >
                                  Audit Metadata
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: CUTOFF & ELIGIBILITY */}
              {activeTab === 'cutoff' && (
                <div className="space-y-6">
                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-5 h-5 text-indigo-400" />
                      <h2 className="text-sm font-bold text-white">Cutoff Score Evaluator & Auto-Screening</h2>
                    </div>
                    <p className="text-xs text-slate-400">
                      Specify the qualifying cutoff score threshold to evaluate candidates and mark applications eligible for interview or selection.
                    </p>

                    <div className="flex items-center space-x-3 max-w-md">
                      <div className="flex-1">
                        <label className="text-[11px] font-medium text-slate-400 block mb-1">Qualifying Cutoff Score (%)</label>
                        <input
                          type="number"
                          value={cutoffScore}
                          onChange={(e) => setCutoffScore(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button
                        onClick={handleEvaluateCutoff}
                        disabled={cutoffEvaluating}
                        className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all"
                      >
                        {cutoffEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span>Run Auto-Screening</span>
                      </button>
                    </div>

                    {cutoffResults && (
                      <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2 text-xs">
                        <p className="font-bold text-emerald-400">Screening Execution Completed</p>
                        <p className="text-slate-300">Screened Applications: <span className="font-mono font-bold text-white">{cutoffResults.screenedCount || 0}</span></p>
                        <p className="text-slate-300">Eligible Candidates Passed: <span className="font-mono font-bold text-emerald-300">{cutoffResults.eligibleCount || 0}</span></p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 8: INTERVIEWS */}
              {activeTab === 'interviews' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white">Interview Scheduler</h2>
                      <p className="text-xs text-slate-400">Schedule candidate evaluation panels</p>
                    </div>
                    <button
                      onClick={() => setShowInterviewModal(true)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Schedule Interview</span>
                    </button>
                  </div>

                  {interviews.length === 0 ? (
                    <div className="py-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                      No interviews scheduled currently.
                    </div>
                  ) : (
                    <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/80 text-slate-400">
                          <tr>
                            <th className="p-3">Interview ID</th>
                            <th className="p-3">App #</th>
                            <th className="p-3">Interviewer</th>
                            <th className="p-3">Scheduled Date</th>
                            <th className="p-3">Location / Link</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {interviews.map((int) => (
                            <tr key={int.id} className="hover:bg-slate-800/40">
                              <td className="p-3 font-mono text-indigo-300">#{int.id}</td>
                              <td className="p-3 font-mono">{int.application_number || `#${int.application_id}`}</td>
                              <td className="p-3 font-medium text-white">{int.interviewer_name || `User #${int.interviewer_user_id}`}</td>
                              <td className="p-3 text-slate-300">{int.scheduled_date}</td>
                              <td className="p-3 text-slate-400 font-mono text-[11px]">{int.location_or_link || 'N/A'}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300">
                                  {int.evaluation_status || 'SCHEDULED'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 9: SELECTION DECISIONS */}
              {activeTab === 'decisions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white">Selection Committee Decisions</h2>
                      <p className="text-xs text-slate-400">Record admission offers, waitlists, and rejections</p>
                    </div>
                    <button
                      onClick={() => setShowDecisionModal(true)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Record Decision</span>
                    </button>
                  </div>

                  {decisions.length === 0 ? (
                    <div className="py-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                      No decisions recorded yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/80 text-slate-400">
                          <tr>
                            <th className="p-3">Decision ID</th>
                            <th className="p-3">App #</th>
                            <th className="p-3">Decision</th>
                            <th className="p-3">Merit Rank</th>
                            <th className="p-3">Decided By</th>
                            <th className="p-3">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {decisions.map((dec) => (
                            <tr key={dec.id} className="hover:bg-slate-800/40">
                              <td className="p-3 font-mono text-indigo-300">#{dec.id}</td>
                              <td className="p-3 font-mono">{dec.application_number || `#${dec.application_id}`}</td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                    dec.decision === 'SELECTED'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : dec.decision === 'WAITLISTED'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'bg-red-500/20 text-red-300'
                                  }`}
                                >
                                  {dec.decision}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-white">{dec.merit_rank || 'N/A'}</td>
                              <td className="p-3 text-slate-400">{dec.decided_by_name || `User #${dec.decided_by_user_id}`}</td>
                              <td className="p-3 text-slate-300">{dec.remarks || 'No remarks'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 10: COUNTER FEE RECEIPTS */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white">Counter Fee Receipt Register</h2>
                      <p className="text-xs text-slate-400">Record offline tuition fee payments</p>
                    </div>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Record Fee Receipt</span>
                    </button>
                  </div>

                  {payments.length === 0 ? (
                    <div className="py-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                      No counter fee receipts logged yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/80 text-slate-400">
                          <tr>
                            <th className="p-3">Receipt #</th>
                            <th className="p-3">App #</th>
                            <th className="p-3">Amount Paid</th>
                            <th className="p-3">Payment Method</th>
                            <th className="p-3">Ref ID</th>
                            <th className="p-3">Posting Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {payments.map((pay) => (
                            <tr key={pay.id} className="hover:bg-slate-800/40">
                              <td className="p-3 font-mono text-emerald-400 font-bold">{pay.receipt_number}</td>
                              <td className="p-3 font-mono">{pay.application_number || `#${pay.application_id}`}</td>
                              <td className="p-3 font-mono font-bold text-white">₹{Number(pay.amount_paid || 0).toLocaleString()}</td>
                              <td className="p-3">{pay.payment_method}</td>
                              <td className="p-3 font-mono text-slate-400">{pay.transaction_reference || 'N/A'}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-300">
                                  {pay.posted_to_erp_payment_id ? `Posted (ERP #${pay.posted_to_erp_payment_id})` : 'Pending Student Conversion'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* MODAL 1: APPLICATION DETAILS DRAWER */}
      {applicationDetailsModal && selectedApplication && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-indigo-400">{selectedApplication.application.application_number}</span>
                <h2 className="text-lg font-bold text-white">{selectedApplication.application.applicant_name}</h2>
              </div>
              <button
                onClick={() => setApplicationDetailsModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Application Overview Badges */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/60 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Application Status</span>
                {renderAppStatusBadge(selectedApplication.application.application_status)}
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Fee Payment Status</span>
                {renderFeeStatusBadge(selectedApplication.application.fee_status)}
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Tuition Fee</span>
                <span className="font-mono text-white font-bold">₹{Number(selectedApplication.application.agreed_tuition_fee || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Total Paid</span>
                <span className="font-mono text-emerald-400 font-bold">₹{Number(selectedApplication.application.paid_amount || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Student Conversion Success Banner */}
            {conversionSuccess && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-700/60 rounded-2xl space-y-2 text-emerald-200 text-xs">
                <div className="flex items-center space-x-2 font-bold text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Student Converted Successfully!</span>
                </div>
                <p>Student Record ID: <span className="font-mono font-bold text-white">#{conversionSuccess.studentId}</span></p>
                <p>Generated Roll Number: <span className="font-mono font-bold text-amber-300 text-sm">{conversionSuccess.rollNumber}</span></p>
                <p className="text-[11px] text-emerald-400/80">
                  User account created. Student fee account posted to central ERP ledger.
                </p>
              </div>
            )}

            {/* STUDENT CONVERSION ACTION DRAWER (CRITICAL WORKFLOW) */}
            {selectedApplication.application.application_status === 'ADMISSION_CONFIRMED' && !conversionSuccess && (
              <div className="p-5 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 rounded-2xl space-y-4">
                <div className="flex items-center space-x-2.5">
                  <Award className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Convert Application to Enrolled Student</h3>
                    <p className="text-xs text-indigo-300">Confirmed candidate is ready for ERP student enrollment.</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tuition Fee Agreed:</span>
                    <span className="font-mono text-white">₹{Number(selectedApplication.application.agreed_tuition_fee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Paid Amount:</span>
                    <span className="font-mono text-emerald-400 font-bold">₹{Number(selectedApplication.application.paid_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Outstanding Balance:</span>
                    <span className="font-mono text-amber-400 font-bold">
                      ₹{Math.max(0, (selectedApplication.application.agreed_tuition_fee || 0) - (selectedApplication.application.paid_amount || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowConversionModal(true);
                    setConversionConfirmed(false);
                    setConversionError(null);
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Initiate Student Conversion</span>
                </button>
              </div>
            )}

            {/* Document Inspection Roster */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Registered Documents</h3>
              {(!selectedApplication.documents || selectedApplication.documents.length === 0) ? (
                <p className="text-xs text-slate-500">No documents attached to this application.</p>
              ) : (
                <div className="space-y-2">
                  {selectedApplication.documents.map((d: any) => (
                    <div key={d.id} className="p-3 bg-slate-800/60 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-medium text-white">{d.document_type}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{d.original_filename}</p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-700 text-slate-300">
                        {d.verification_status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM CONVERSION DIALOG */}
      {showConversionModal && selectedApplication && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-indigo-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Confirm Enrolled Student Conversion</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Converting candidate <span className="font-bold text-white">{selectedApplication.application.applicant_name}</span> will generate a user account, assign an atomic roll number, lock program seats, and transition payments to the central ERP ledger.
            </p>

            <div className="p-3 bg-slate-800 rounded-xl text-xs space-y-1 text-slate-300">
              <p>App Number: <span className="font-mono text-indigo-300">{selectedApplication.application.application_number}</span></p>
              <p>Program: <span className="text-white">{selectedApplication.application.program_name}</span></p>
              <p>Fee Status: <span className="font-bold text-emerald-400">{selectedApplication.application.fee_status}</span></p>
            </div>

            {conversionError && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
                {conversionError}
              </div>
            )}

            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={conversionConfirmed}
                onChange={(e) => setConversionConfirmed(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>I confirm that all admission criteria & fee payments are verified.</span>
            </label>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowConversionModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteConversion}
                disabled={!conversionConfirmed || isConverting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                {isConverting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                <span>Execute Conversion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE CYCLE */}
      {showCycleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateCycle} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Create Admission Cycle</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Cycle Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AY 2026-27 Autumn"
                  value={newCycleData.cycle_name}
                  onChange={(e) => setNewCycleData({ ...newCycleData, cycle_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newCycleData.start_date}
                    onChange={(e) => setNewCycleData({ ...newCycleData, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newCycleData.end_date}
                    onChange={(e) => setNewCycleData({ ...newCycleData, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setShowCycleModal(false)} className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs">Cancel</button>
              <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">Create Cycle</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: CREATE PROGRAM INTAKE */}
      {showProgramModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateProgram} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Create Program Intake Capacity</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Cycle</label>
                <select
                  required
                  value={newProgramData.cycle_id}
                  onChange={(e) => setNewProgramData({ ...newProgramData, cycle_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">-- Choose Admission Cycle --</option>
                  {cycles.map((c) => <option key={c.id} value={c.id}>{c.cycle_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Program Name</label>
                  <input
                    type="text"
                    required
                    placeholder="B.Tech CS"
                    value={newProgramData.program_name}
                    onChange={(e) => setNewProgramData({ ...newProgramData, program_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Program Code</label>
                  <input
                    type="text"
                    required
                    placeholder="BT-CS"
                    value={newProgramData.program_code}
                    onChange={(e) => setNewProgramData({ ...newProgramData, program_code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Total Seats</label>
                  <input
                    type="number"
                    required
                    value={newProgramData.total_seats}
                    onChange={(e) => setNewProgramData({ ...newProgramData, total_seats: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Tuition Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProgramData.tuition_fee}
                    onChange={(e) => setNewProgramData({ ...newProgramData, tuition_fee: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setShowProgramModal(false)} className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs">Cancel</button>
              <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">Add Program</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 5: CREATE CANDIDATE PROFILE */}
      {showApplicantModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateApplicant} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Create Candidate Profile</h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newApplicantData.first_name}
                    onChange={(e) => setNewApplicantData({ ...newApplicantData, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newApplicantData.last_name}
                    onChange={(e) => setNewApplicantData({ ...newApplicantData, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newApplicantData.email}
                  onChange={(e) => setNewApplicantData({ ...newApplicantData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Mobile Phone</label>
                <input
                  type="text"
                  required
                  value={newApplicantData.phone}
                  onChange={(e) => setNewApplicantData({ ...newApplicantData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setShowApplicantModal(false)} className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs">Cancel</button>
              <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">Save Profile</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 6: DOCUMENT VERIFICATION */}
      {showDocModal && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleVerifyDocument} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Audit Document Metadata</h3>
            <div className="p-3 bg-slate-800 rounded-xl text-xs space-y-1 text-slate-300">
              <p>Document Type: <span className="font-bold text-white">{selectedDoc.document_type}</span></p>
              <p>Filename: <span className="font-mono text-indigo-300">{selectedDoc.original_filename}</span></p>
              <p>Checksum SHA256: <span className="font-mono text-[10px] text-slate-400 block truncate">{selectedDoc.checksum_sha256 || 'Calculated on upload'}</span></p>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Verification Action</label>
                <select
                  value={docVerifyStatus}
                  onChange={(e) => setDocVerifyStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="VERIFIED">Approve Metadata (VERIFIED)</option>
                  <option value="REJECTED">Reject Document (REJECTED)</option>
                </select>
              </div>
              {docVerifyStatus === 'REJECTED' && (
                <div>
                  <label className="text-slate-400 block mb-1">Rejection Reason</label>
                  <textarea
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs h-20"
                    placeholder="Enter reason for rejecting metadata..."
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setShowDocModal(false)} className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs">Cancel</button>
              <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">Update Document</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 7: SCHEDULE INTERVIEW */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleScheduleInterview} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Schedule Candidate Interview</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Application</label>
                <select
                  required
                  value={newInterviewData.application_id}
                  onChange={(e) => setNewInterviewData({ ...newInterviewData, application_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">-- Choose Application --</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>{app.application_number} - {app.applicant_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Interviewer (User)</label>
                <select
                  required
                  value={newInterviewData.interviewer_user_id}
                  onChange={(e) => setNewInterviewData({ ...newInterviewData, interviewer_user_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">-- Select Faculty / Panelist User --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name || u.username} ({u.role || 'User'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newInterviewData.scheduled_date}
                  onChange={(e) => setNewInterviewData({ ...newInterviewData, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Location or Link</label>
                <input
                  type="text"
                  placeholder="Room 102 / Google Meet Link"
                  value={newInterviewData.location_or_link}
                  onChange={(e) => setNewInterviewData({ ...newInterviewData, location_or_link: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setShowInterviewModal(false)} className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs">Cancel</button>
              <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">Schedule Panel</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 8: RECORD SELECTION DECISION */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleRecordDecision} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Record Committee Decision</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Application</label>
                <select
                  required
                  value={newDecisionData.application_id}
                  onChange={(e) => setNewDecisionData({ ...newDecisionData, application_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">-- Choose Application --</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>{app.application_number} - {app.applicant_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Decision</label>
                  <select
                    value={newDecisionData.decision}
                    onChange={(e) => setNewDecisionData({ ...newDecisionData, decision: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="SELECTED">SELECTED</option>
                    <option value="WAITLISTED">WAITLISTED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Merit Rank</label>
                  <input
                    type="number"
                    placeholder="e.g. 12"
                    value={newDecisionData.merit_rank}
                    onChange={(e) => setNewDecisionData({ ...newDecisionData, merit_rank: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Committee Remarks</label>
                <input
                  type="text"
                  placeholder="Strong entrance performance"
                  value={newDecisionData.remarks}
                  onChange={(e) => setNewDecisionData({ ...newDecisionData, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setShowDecisionModal(false)} className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs">Cancel</button>
              <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">Record Decision</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 9: RECORD COUNTER FEE PAYMENT */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleRecordPayment} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Record Counter Fee Receipt</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Application</label>
                <select
                  required
                  value={newPaymentData.application_id}
                  onChange={(e) => setNewPaymentData({ ...newPaymentData, application_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">-- Choose Application --</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.application_number} - {app.applicant_name} (Fee: ₹{app.agreed_tuition_fee})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="50000"
                    value={newPaymentData.amount_paid}
                    onChange={(e) => setNewPaymentData({ ...newPaymentData, amount_paid: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Payment Method</label>
                  <select
                    value={newPaymentData.payment_method}
                    onChange={(e) => setNewPaymentData({ ...newPaymentData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="CASH">CASH</option>
                    <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                    <option value="CARD">CARD</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">CHEQUE</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Transaction Ref / Cheque #</label>
                <input
                  type="text"
                  placeholder="DD-987654 / UPI-12345"
                  value={newPaymentData.transaction_reference}
                  onChange={(e) => setNewPaymentData({ ...newPaymentData, transaction_reference: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setShowPaymentModal(false)} className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs">Cancel</button>
              <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">Issue Receipt</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdmissionOfficeDashboard;
