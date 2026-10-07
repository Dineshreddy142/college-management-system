import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
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
  DollarSign,
  Award as RankingIcon,
  ListFilter,
  PieChart,
  Mail,
  Upload,
  FileSpreadsheet,
  PhoneCall,
  UserPlus,
  Zap,
  Timer,
  Megaphone,
  History,
  Download,
  Printer,
  Copy
} from 'lucide-react';

interface AdmissionOfficeDashboardProps {
  onNav?: (module: string) => void;
  theme?: string;
  toggleTheme?: () => void;
}

type TabType = 
  | 'dashboard'
  | 'enquiries'
  | 'counselling'
  | 'applications'
  | 'applicants'
  | 'documents'
  | 'eligibility'
  | 'merit'
  | 'shortlist'
  | 'interviews'
  | 'seat_intake'
  | 'admissions'
  | 'enrollment'
  | 'communications'
  | 'offer_letters'
  | 'bulk_import'
  | 'campaigns'
  | 'analytics'
  | 'sla'
  | 'audit';

export function AdmissionOfficeDashboard({ onNav, theme = 'light', toggleTheme }: AdmissionOfficeDashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Collections State
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
  const [meritRankings, setMeritRankings] = useState<any[]>([]);
  const [shortlist, setShortlist] = useState<any[]>([]);
  const [seatQuotas, setSeatQuotas] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [communications, setCommunications] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [counselling, setCounselling] = useState<any[]>([]);
  const [slaData, setSLAData] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Application Sub-Filter Toggle
  const [appSubFilter, setAppSubFilter] = useState<'ALL' | 'NEW' | 'REVIEW'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Selected Application & Conversion Drawer State
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [applicationDetailsModal, setApplicationDetailsModal] = useState<boolean>(false);
  const [showConversionModal, setShowConversionModal] = useState<boolean>(false);
  const [conversionConfirmed, setConversionConfirmed] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionSuccess, setConversionSuccess] = useState<{ studentId: number; rollNumber: string } | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Merit Weights State
  const [academicWeight, setAcademicWeight] = useState<string>('60');
  const [entranceWeight, setEntranceWeight] = useState<string>('30');
  const [interviewWeight, setInterviewWeight] = useState<string>('10');
  const [rankingGenerating, setRankingGenerating] = useState<boolean>(false);

  // Shortlisting Auto Modal
  const [shortlistCount, setShortlistCount] = useState<string>('50');

  // Offer Letter State
  const [offerLetterAppId, setOfferLetterAppId] = useState<string>('');
  const [offerLetterData, setOfferLetterData] = useState<any | null>(null);

  // Bulk Import CSV Raw State
  const [bulkImportText, setBulkImportText] = useState<string>('');
  const [bulkImportParsed, setBulkImportParsed] = useState<any[]>([]);
  const [bulkImporting, setBulkImporting] = useState<boolean>(false);

  // Communication Dispatch State
  const [commRecipient, setCommRecipient] = useState<string>('');
  const [commSubject, setCommSubject] = useState<string>('');
  const [commBody, setCommBody] = useState<string>('');
  const [commChannel, setCommChannel] = useState<'EMAIL' | 'SMS' | 'SYSTEM_NOTIFICATION'>('EMAIL');

  // CRM Enquiry Modal
  const [showEnquiryModal, setShowEnquiryModal] = useState<boolean>(false);
  const [newEnquiryData, setNewEnquiryData] = useState({ candidate_name: '', email: '', mobile: '', source: 'Website', remarks: '' });

  // Counselling Modal
  const [showCounsellingModal, setShowCounsellingModal] = useState<boolean>(false);
  const [newCounsellingData, setNewCounsellingData] = useState({ enquiry_id: '', scheduled_at: '', remarks: '' });

  // Campaign Modal
  const [showCampaignModal, setShowCampaignModal] = useState<boolean>(false);
  const [newCampaignData, setNewCampaignData] = useState({ campaign_name: '', admission_type: 'Undergraduate', target_applications: '500', budget: '50000' });

  // Document Verification Modal
  const [showDocModal, setShowDocModal] = useState<boolean>(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [docVerifyStatus, setDocVerifyStatus] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Fetch all telemetric data safely
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        statsRes, cyclesRes, progsRes, appsRes, docsRes, intsRes, decsRes, paysRes,
        meritRes, shortlistRes, quotasRes, dupesRes, auditRes, analyticsRes,
        commsRes, enqRes, counselRes, slaRes, campRes, usersRes
      ] = await Promise.all([
        client.get('/admission/dashboard-stats').catch(() => ({ data: { data: {} } })),
        client.get('/admission/cycles').catch(() => ({ data: { data: [] } })),
        client.get('/admission/programs').catch(() => ({ data: { data: [] } })),
        client.get('/admission/applications').catch(() => ({ data: { data: [] } })),
        client.get('/admission/documents').catch(() => ({ data: { data: [] } })),
        client.get('/admission/interviews').catch(() => ({ data: { data: [] } })),
        client.get('/admission/decisions').catch(() => ({ data: { data: [] } })),
        client.get('/admission/fee-payments').catch(() => ({ data: { data: [] } })),
        client.get('/admission/merit/rankings').catch(() => ({ data: { data: [] } })),
        client.get('/admission/shortlist').catch(() => ({ data: { data: [] } })),
        client.get('/admission/seat-quotas').catch(() => ({ data: { data: [] } })),
        client.get('/admission/applicants/duplicates/detect').catch(() => ({ data: { data: [] } })),
        client.get('/admission/audit-logs').catch(() => ({ data: { data: [] } })),
        client.get('/admission/analytics').catch(() => ({ data: { data: null } })),
        client.get('/admission/communications').catch(() => ({ data: { data: [] } })),
        client.get('/admission/enquiries').catch(() => ({ data: { data: [] } })),
        client.get('/admission/counselling').catch(() => ({ data: { data: [] } })),
        client.get('/admission/sla-monitoring').catch(() => ({ data: { data: null } })),
        client.get('/admission/campaigns').catch(() => ({ data: { data: [] } })),
        client.get('/users').catch(() => ({ data: { data: [] } }))
      ]);

      setStats(statsRes.data?.data || {});
      setCycles(Array.isArray(cyclesRes.data?.data) ? cyclesRes.data.data : []);
      setPrograms(Array.isArray(progsRes.data?.data) ? progsRes.data.data : []);
      setApplications(Array.isArray(appsRes.data?.data) ? appsRes.data.data : []);
      setDocuments(Array.isArray(docsRes.data?.data) ? docsRes.data.data : []);
      setInterviews(Array.isArray(intsRes.data?.data) ? intsRes.data.data : []);
      setDecisions(Array.isArray(decsRes.data?.data) ? decsRes.data.data : []);
      setPayments(Array.isArray(paysRes.data?.data) ? paysRes.data.data : []);
      setMeritRankings(Array.isArray(meritRes.data?.data) ? meritRes.data.data : []);
      setShortlist(Array.isArray(shortlistRes.data?.data) ? shortlistRes.data.data : []);
      setSeatQuotas(Array.isArray(quotasRes.data?.data) ? quotasRes.data.data : []);
      setDuplicates(Array.isArray(dupesRes.data?.data) ? dupesRes.data.data : []);
      setAuditLogs(Array.isArray(auditRes.data?.data) ? auditRes.data.data : []);
      setAnalytics(analyticsRes.data?.data || null);
      setCommunications(Array.isArray(commsRes.data?.data) ? commsRes.data.data : []);
      setEnquiries(Array.isArray(enqRes.data?.data) ? enqRes.data.data : []);
      setCounselling(Array.isArray(counselRes.data?.data) ? counselRes.data.data : []);
      setSLAData(slaRes.data?.data || null);
      setCampaigns(Array.isArray(campRes.data?.data) ? campRes.data.data : []);
      setUsersList(Array.isArray(usersRes.data?.data) ? usersRes.data.data : Array.isArray(usersRes.data) ? usersRes.data : []);

    } catch (err: any) {
      console.error("Failed to load admission telemetry", err);
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

  // Inspect Application Details
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

  // Generate Merit Ranks
  const handleGenerateMeritRanks = async () => {
    try {
      setRankingGenerating(true);
      await client.post('/admission/merit-weights', {
        academic_weight: academicWeight,
        entrance_weight: entranceWeight,
        interview_weight: interviewWeight
      });

      const res = await client.post('/admission/merit/generate-ranks', {});
      alert(res.data?.message || 'Merit ranks generated successfully.');
      loadData();
    } catch (err: any) {
      alert("Error generating merit ranks: " + (err.response?.data?.message || err.message));
    } finally {
      setRankingGenerating(false);
    }
  };

  // Auto Shortlist Candidates
  const handleAutoShortlist = async () => {
    try {
      const res = await client.post('/admission/shortlist/auto', {
        top_count: Number(shortlistCount)
      });
      alert(res.data?.message || 'Shortlist generated.');
      loadData();
    } catch (err: any) {
      alert("Error generating shortlist: " + (err.response?.data?.message || err.message));
    }
  };

  // Publish Shortlist
  const handlePublishShortlist = async () => {
    try {
      await client.post('/admission/shortlist/publish', {});
      alert("Shortlist published successfully.");
      loadData();
    } catch (err: any) {
      alert("Error publishing shortlist: " + (err.response?.data?.message || err.message));
    }
  };

  // Audit Document Metadata
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

  // Send Communication
  const handleSendCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/admission/communications/send', {
        recipient: commRecipient,
        subject: commSubject,
        message_body: commBody,
        channel: commChannel
      });
      setCommRecipient('');
      setCommSubject('');
      setCommBody('');
      alert("Communication dispatched successfully.");
      loadData();
    } catch (err: any) {
      alert("Error dispatching message: " + (err.response?.data?.message || err.message));
    }
  };

  // Handle Bulk Import File Upload (XLSX, XLS, CSV)
  const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExt || '')) {
      alert("Unsupported file format. Please select a .csv, .xlsx, or .xls file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const parsed = rows.map((r: any) => ({
          first_name: r.FirstName || r.first_name || r.Name?.split(' ')[0] || 'Applicant',
          last_name: r.LastName || r.last_name || r.Name?.split(' ')[1] || '',
          email: r.Email || r.email || '',
          mobile: String(r.Mobile || r.mobile || r.Phone || ''),
          gender: r.Gender || r.gender || 'MALE',
          percentage_12th: r.Percentage12th || r.percentage_12th || 75,
          entrance_score: r.EntranceScore || r.entrance_score || 80
        })).filter(r => r.email && r.mobile);

        setBulkImportParsed(parsed);
      } catch (err: any) {
        alert("Failed to parse spreadsheet file: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Download Server-Generated PDF Offer Letter
  const handleDownloadPDFOfferLetter = () => {
    if (!offerLetterAppId) return;
    const token = localStorage.getItem('token');
    window.open(`/api/admission/applications/${offerLetterAppId}/offer-letter?format=pdf&token=${token}`, '_blank');
  };

  // Preview Offer Letter Data (JSON)
  const handleGenerateOfferLetter = async () => {
    if (!offerLetterAppId) return;
    try {
      const res = await client.get(`/admission/applications/${offerLetterAppId}/offer-letter`);
      setOfferLetterData(res.data?.data || null);
    } catch (err: any) {
      alert("Failed to load offer letter: " + (err.response?.data?.message || err.message));
    }
  };

  // Confirm Bulk Import
  const handleExecuteBulkImport = async () => {
    if (bulkImportParsed.length === 0) return;
    try {
      setBulkImporting(true);
      const res = await client.post('/admission/bulk-import/confirm', {
        records: bulkImportParsed
      });
      alert(res.data?.message || 'Bulk import completed.');
      setBulkImportParsed([]);
      setBulkImportText('');
      loadData();
    } catch (err: any) {
      alert("Bulk import failed: " + (err.response?.data?.message || err.message));
    } finally {
      setBulkImporting(false);
    }
  };

  // Create CRM Enquiry
  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/admission/enquiries', newEnquiryData);
      setShowEnquiryModal(false);
      setNewEnquiryData({ candidate_name: '', email: '', mobile: '', source: 'Website', remarks: '' });
      loadData();
    } catch (err: any) {
      alert("Error creating enquiry: " + (err.response?.data?.message || err.message));
    }
  };

  // Process Waitlist Promotion
  const handleProcessWaitlist = async (programId: number) => {
    try {
      const res = await client.post('/admission/waitlist/process-next', { program_id: programId });
      alert(res.data?.message || 'Waitlist processed.');
      loadData();
    } catch (err: any) {
      alert("Waitlist processing error: " + (err.response?.data?.message || err.message));
    }
  };

  // Create Campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/admission/campaigns', newCampaignData);
      setShowCampaignModal(false);
      setNewCampaignData({ campaign_name: '', admission_type: 'Undergraduate', target_applications: '500', budget: '50000' });
      loadData();
    } catch (err: any) {
      alert("Error creating campaign: " + (err.response?.data?.message || err.message));
    }
  };

  // Filtered Applications Roster
  const filteredApplications = applications.filter((app) => {
    const matchesSearch = 
      (app.application_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.applicant_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.program_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    let matchesSub = true;
    if (appSubFilter === 'NEW') matchesSub = app.application_status === 'SUBMITTED';
    if (appSubFilter === 'REVIEW') matchesSub = app.application_status === 'UNDER_REVIEW';

    const matchesStatus = !filterStatus || app.application_status === filterStatus;
    return matchesSearch && matchesSub && matchesStatus;
  });

  // Status Badges Formatters
  const renderAppStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      DRAFT: { bg: 'bg-slate-800 text-slate-400', text: 'DRAFT' },
      SUBMITTED: { bg: 'bg-blue-900/40 text-blue-300 border border-blue-700/50', text: 'SUBMITTED' },
      UNDER_REVIEW: { bg: 'bg-amber-900/40 text-amber-300 border border-amber-700/50', text: 'UNDER REVIEW' },
      SELECTED: { bg: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50', text: 'SELECTED' },
      WAITLISTED: { bg: 'bg-orange-900/40 text-orange-300 border border-orange-700/50', text: 'WAITLISTED' },
      REJECTED: { bg: 'bg-red-900/40 text-red-300 border border-red-700/50', text: 'REJECTED' },
      OFFER_SENT: { bg: 'bg-indigo-900/40 text-indigo-300 border border-indigo-700/50', text: 'OFFER SENT' },
      ADMISSION_CONFIRMED: { bg: 'bg-teal-900/40 text-teal-300 border border-teal-700/50', text: 'CONFIRMED' },
      CONVERTED_TO_STUDENT: { bg: 'bg-purple-900/40 text-purple-300 border border-purple-700/50', text: 'ENROLLED' },
    };
    const c = config[status] || config.DRAFT;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${c.bg}`}>
        {c.text}
      </span>
    );
  };

  const renderFeeStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      FEE_PENDING: { bg: 'bg-red-950/60 text-red-400 border border-red-800/50', text: 'FEE PENDING' },
      PARTIALLY_PAID: { bg: 'bg-amber-950/60 text-amber-400 border border-amber-800/50', text: 'PARTIALLY PAID' },
      PAID: { bg: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50', text: 'PAID' },
    };
    const c = config[status] || config.FEE_PENDING;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${c.bg}`}>
        {c.text}
      </span>
    );
  };

  // Full Admission Navigation Tree
  const tabsNav: { id: TabType; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'enquiries', label: 'Enquiries / CRM', icon: PhoneCall, badge: enquiries.length },
    { id: 'counselling', label: 'Counselling Management', icon: UserPlus },
    { id: 'applications', label: 'Application Registry', icon: FileText, badge: stats.newApplications },
    { id: 'applicants', label: 'Candidate Profiles', icon: Users },
    { id: 'documents', label: 'Document Verification', icon: FileCheck, badge: stats.pendingDocuments },
    { id: 'eligibility', label: 'Cutoff Eligibility', icon: Filter },
    { id: 'merit', label: 'Merit & Ranking Engine', icon: RankingIcon },
    { id: 'shortlist', label: 'Shortlisting Center', icon: ListFilter, badge: shortlist.length },
    { id: 'interviews', label: 'Interview Scheduler', icon: CalendarDays, badge: stats.scheduledInterviews },
    { id: 'seat_intake', label: 'Seat & Quotas', icon: GraduationCap },
    { id: 'admissions', label: 'Selection & Decisions', icon: CheckCircle2 },
    { id: 'enrollment', label: 'Student Conversion', icon: UserCheck, badge: stats.confirmedAdmissions },
    { id: 'communications', label: 'Communication Center', icon: Mail },
    { id: 'offer_letters', label: 'Offer Letter Generator', icon: Award },
    { id: 'bulk_import', label: 'Bulk Admission Import', icon: FileSpreadsheet },
    { id: 'campaigns', label: 'Campaign Tracker', icon: Megaphone },
    { id: 'analytics', label: 'Reports & Analytics', icon: PieChart },
    { id: 'sla', label: 'SLA Workload Monitor', icon: Timer, badge: slaData?.overdueApplicationsCount },
    { id: 'audit', label: 'Admission Audit Logs', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Executive Header Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Admission Control Office</h1>
              <p className="text-[11px] text-slate-400">University Management & Governance ERP</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 text-xs font-medium flex items-center space-x-1.5 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Refresh Telemetry</span>
          </button>

          {toggleTheme && (
            <button onClick={toggleTheme} className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          )}

          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">{user?.full_name || user?.username || 'Admission Officer'}</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold">OFFICER</span>
          </div>
        </div>
      </header>

      {/* Main Control Room Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 overflow-y-auto p-3 z-20`}>
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
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${isActive ? 'bg-white text-indigo-700' : 'bg-indigo-500/20 text-indigo-300'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950">
          {error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-800/60 rounded-2xl flex items-start space-x-3 text-red-300">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-red-200">Telemetry Alert</p>
                <p className="mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200"><X className="w-4 h-4" /></button>
            </div>
          )}

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-medium">Fetching admission telemetry...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD OVERVIEW */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                      <span className="text-xs text-slate-400 block mb-1">Total Applications</span>
                      <p className="text-2xl font-bold text-white">{stats.totalApplications || 0}</p>
                      <span className="text-[11px] text-emerald-400 mt-1 block">{stats.newApplications || 0} submitted new</span>
                    </div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                      <span className="text-xs text-slate-400 block mb-1">Pending Documents</span>
                      <p className="text-2xl font-bold text-amber-400">{stats.pendingDocuments || 0}</p>
                      <span className="text-[11px] text-slate-400 mt-1 block">Metadata verification</span>
                    </div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                      <span className="text-xs text-slate-400 block mb-1">Confirmed Admissions</span>
                      <p className="text-2xl font-bold text-emerald-400">{stats.confirmedAdmissions || 0}</p>
                      <span className="text-[11px] text-slate-400 mt-1 block">{stats.convertedStudents || 0} converted to students</span>
                    </div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                      <span className="text-xs text-slate-400 block mb-1">Total Fees Collected</span>
                      <p className="text-2xl font-bold text-teal-400">₹{Number(stats.totalFeesCollected || 0).toLocaleString()}</p>
                      <span className="text-[11px] text-slate-400 mt-1 block">Receipts verified</span>
                    </div>
                  </div>

                  {stats.totalApplications === 0 && (
                    <div className="p-6 bg-indigo-950/30 border border-indigo-800/40 rounded-2xl text-center space-y-2">
                      <p className="text-sm font-bold text-indigo-200">Zero Admission Records</p>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">Database contains 0 applications. Start by creating an admission cycle, intake seats, and candidate profiles.</p>
                    </div>
                  )}

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recent Application Stream</h3>
                    {applications.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">No applications registered.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-800/80 text-slate-400">
                            <tr>
                              <th className="p-2.5">App #</th>
                              <th className="p-2.5">Candidate Name</th>
                              <th className="p-2.5">Program</th>
                              <th className="p-2.5">App Status</th>
                              <th className="p-2.5">Fee Status</th>
                              <th className="p-2.5 text-right">Action</th>
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
                                  <button onClick={() => openApplicationDetails(app.id)} className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded text-[11px]">Inspect</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: ENQUIRIES / CRM */}
              {activeTab === 'enquiries' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white">Admission Enquiry / CRM Pipeline</h2>
                      <p className="text-xs text-slate-400">Track candidate leads from initial inquiry to application</p>
                    </div>
                    <button onClick={() => setShowEnquiryModal(true)} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center space-x-1.5">
                      <Plus className="w-4 h-4" /><span>Log Enquiry</span>
                    </button>
                  </div>

                  {enquiries.length === 0 ? (
                    <div className="py-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">No CRM enquiries logged yet.</div>
                  ) : (
                    <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/80 text-slate-400">
                          <tr>
                            <th className="p-3">Candidate</th>
                            <th className="p-3">Email / Mobile</th>
                            <th className="p-3">Source</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {enquiries.map((e) => (
                            <tr key={e.id} className="hover:bg-slate-800/40">
                              <td className="p-3 font-medium text-white">{e.candidate_name}</td>
                              <td className="p-3 font-mono text-slate-400">{e.email} | {e.mobile}</td>
                              <td className="p-3"><span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">{e.source}</span></td>
                              <td className="p-3"><span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-bold text-[10px]">{e.status}</span></td>
                              <td className="p-3 text-slate-400">{e.remarks || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: COUNSELLING */}
              {activeTab === 'counselling' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white">Counselling Management</h2>
                      <p className="text-xs text-slate-400">Schedule guidance sessions & follow-ups</p>
                    </div>
                    <button onClick={() => setShowCounsellingModal(true)} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center space-x-1.5">
                      <Plus className="w-4 h-4" /><span>Schedule Counselling</span>
                    </button>
                  </div>

                  {counselling.length === 0 ? (
                    <div className="py-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">No counselling sessions scheduled.</div>
                  ) : (
                    <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/80 text-slate-400">
                          <tr>
                            <th className="p-3">Session ID</th>
                            <th className="p-3">Scheduled At</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {counselling.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-800/40">
                              <td className="p-3 font-mono text-indigo-300">#{c.id}</td>
                              <td className="p-3 text-white">{c.scheduled_at}</td>
                              <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">{c.status}</span></td>
                              <td className="p-3 text-slate-400">{c.remarks || 'No remarks'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: APPLICATIONS REGISTRY */}
              {activeTab === 'applications' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-3 justify-between items-center">
                    <div className="flex space-x-2">
                      <button onClick={() => setAppSubFilter('ALL')} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${appSubFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>All Applications</button>
                      <button onClick={() => setAppSubFilter('NEW')} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${appSubFilter === 'NEW' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>New Submitted ({stats.newApplications || 0})</button>
                      <button onClick={() => setAppSubFilter('REVIEW')} className={`px-3 py-1.5 rounded-xl text-xs font-medium ${appSubFilter === 'REVIEW' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Under Review ({stats.underReview || 0})</button>
                    </div>

                    <div className="relative w-full md:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search App # or Candidate..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  {filteredApplications.length === 0 ? (
                    <div className="py-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">No applications found matching criteria.</div>
                  ) : (
                    <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/80 text-slate-400">
                          <tr>
                            <th className="p-3">Application #</th>
                            <th className="p-3">Candidate</th>
                            <th className="p-3">App Status</th>
                            <th className="p-3">Fee Status</th>
                            <th className="p-3">Merit Rank</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {filteredApplications.map((app) => (
                            <tr key={app.id} className="hover:bg-slate-800/40">
                              <td className="p-3 font-mono text-indigo-300">{app.application_number}</td>
                              <td className="p-3 font-medium text-white">{app.applicant_name}</td>
                              <td className="p-3">{renderAppStatusBadge(app.application_status)}</td>
                              <td className="p-3">{renderFeeStatusBadge(app.fee_status)}</td>
                              <td className="p-3 font-mono font-bold text-amber-400">#{app.merit_rank || '-'}</td>
                              <td className="p-3 text-right">
                                <button onClick={() => openApplicationDetails(app.id)} className="px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded border border-indigo-500/30 text-xs font-medium">Inspect Details</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: MERIT & RANKING ENGINE */}
              {activeTab === 'merit' && (
                <div className="space-y-6">
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                    <h2 className="text-sm font-bold text-white flex items-center space-x-2"><RankingIcon className="w-4 h-4 text-indigo-400" /><span>Merit Scoring & Automatic Rank Generator</span></h2>
                    <p className="text-xs text-slate-400">Configure weighting parameters to execute server-side rank calculations across all candidates.</p>

                    <div className="grid grid-cols-3 gap-4 max-w-xl text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1">Academic Score %</label>
                        <input type="number" value={academicWeight} onChange={(e) => setAcademicWeight(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold" />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Entrance Exam %</label>
                        <input type="number" value={entranceWeight} onChange={(e) => setEntranceWeight(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold" />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Interview Score %</label>
                        <input type="number" value={interviewWeight} onChange={(e) => setInterviewWeight(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold" />
                      </div>
                    </div>

                    <button onClick={handleGenerateMeritRanks} disabled={rankingGenerating} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5">
                      {rankingGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      <span>Execute Server Rank Generation</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/80 text-slate-400">
                        <tr>
                          <th className="p-3">Rank #</th>
                          <th className="p-3">App Number</th>
                          <th className="p-3">Candidate</th>
                          <th className="p-3">Academic %</th>
                          <th className="p-3">Entrance Score</th>
                          <th className="p-3">Interview</th>
                          <th className="p-3">Final Calculated Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {meritRankings.length === 0 ? (
                          <tr><td colSpan={7} className="p-6 text-center text-slate-500">No merit rankings generated yet. Click 'Execute Server Rank Generation' above.</td></tr>
                        ) : (
                          meritRankings.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-800/40">
                              <td className="p-3 font-mono font-bold text-amber-400">#{r.overall_rank}</td>
                              <td className="p-3 font-mono text-indigo-300">{r.application_number}</td>
                              <td className="p-3 font-medium text-white">{r.first_name} {r.last_name}</td>
                              <td className="p-3 font-mono">{r.academic_score}%</td>
                              <td className="p-3 font-mono">{r.entrance_score}</td>
                              <td className="p-3 font-mono">{r.interview_score}</td>
                              <td className="p-3 font-mono font-bold text-emerald-400">{r.final_score} / 100</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 9: SHORTLISTING CENTER */}
              {activeTab === 'shortlist' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white">Shortlisting & Capacity Locking</h2>
                      <p className="text-xs text-slate-400">Auto-shortlist top merit candidates respecting program seat targets</p>
                    </div>

                    <div className="flex space-x-3 items-center">
                      <input type="number" value={shortlistCount} onChange={(e) => setShortlistCount(e.target.value)} className="w-20 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white" />
                      <button onClick={handleAutoShortlist} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold">Auto Shortlist Top N</button>
                      <button onClick={handlePublishShortlist} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold">Publish Shortlist</button>
                    </div>
                  </div>

                  <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/80 text-slate-400">
                        <tr>
                          <th className="p-3">Rank</th>
                          <th className="p-3">App #</th>
                          <th className="p-3">Candidate</th>
                          <th className="p-3">Shortlist Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {shortlist.length === 0 ? (
                          <tr><td colSpan={4} className="p-6 text-center text-slate-500">No candidates shortlisted currently.</td></tr>
                        ) : (
                          shortlist.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-800/40">
                              <td className="p-3 font-mono font-bold text-amber-400">#{s.merit_rank}</td>
                              <td className="p-3 font-mono text-indigo-300">{s.application_number}</td>
                              <td className="p-3 font-medium text-white">{s.first_name} {s.last_name}</td>
                              <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">{s.shortlist_status}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 11: SEAT & QUOTAS */}
              {activeTab === 'seat_intake' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-sm font-bold text-white">Program Seat & Quota Distribution</h2>
                  </div>
                  <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/80 text-slate-400">
                        <tr>
                          <th className="p-3">Program Code</th>
                          <th className="p-3">Program Name</th>
                          <th className="p-3">Total Capacity</th>
                          <th className="p-3">Allocated Seats</th>
                          <th className="p-3">Available Seats</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {programs.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-800/40">
                            <td className="p-3 font-mono text-indigo-300">{p.program_code}</td>
                            <td className="p-3 font-medium text-white">{p.program_name}</td>
                            <td className="p-3 font-bold text-white">{p.total_seats}</td>
                            <td className="p-3 font-bold text-emerald-400">{p.allocated_seats || 0}</td>
                            <td className="p-3 font-bold text-amber-400">{Math.max(0, p.total_seats - (p.allocated_seats || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 14: COMMUNICATIONS */}
              {activeTab === 'communications' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <form onSubmit={handleSendCommunication} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                      <h2 className="text-sm font-bold text-white flex items-center space-x-2"><Mail className="w-4 h-4 text-indigo-400" /><span>Dispatch Candidate Notification</span></h2>
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="text-slate-400 block mb-1">Channel</label>
                          <select value={commChannel} onChange={(e) => setCommChannel(e.target.value as any)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white">
                            <option value="EMAIL">EMAIL</option>
                            <option value="SMS">SMS</option>
                            <option value="SYSTEM_NOTIFICATION">SYSTEM_NOTIFICATION</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Recipient Email / Mobile</label>
                          <input type="text" required placeholder="candidate@example.com" value={commRecipient} onChange={(e) => setCommRecipient(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white" />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Subject</label>
                          <input type="text" required placeholder="Admission Update" value={commSubject} onChange={(e) => setCommSubject(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white" />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Message Body</label>
                          <textarea required value={commBody} onChange={(e) => setCommBody(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white h-24" placeholder="Dear Candidate..." />
                        </div>
                      </div>
                      <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold">Dispatch Message</button>
                    </form>

                    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Communication Logs & Delivery Status</h3>
                      {communications.length === 0 ? (
                        <p className="text-xs text-slate-500 py-6 text-center">No communications dispatched yet.</p>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                          {communications.map((c) => (
                            <div key={c.id} className="p-3 bg-slate-800/60 rounded-xl text-xs space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-white">{c.recipient}</span>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                  c.delivery_status === 'SENT' || c.delivery_status === 'DELIVERED'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : c.delivery_status === 'NOT_CONFIGURED'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-red-500/20 text-red-300'
                                }`}>
                                  {c.delivery_status}
                                </span>
                              </div>
                              <p className="text-slate-300 text-[11px] font-medium">{c.subject}</p>
                              <span className="text-[10px] text-slate-500 block">{c.sent_at}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 15: OFFER LETTERS */}
              {activeTab === 'offer_letters' && (
                <div className="space-y-6">
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 max-w-md">
                    <h2 className="text-sm font-bold text-white flex items-center space-x-2"><Award className="w-4 h-4 text-amber-400" /><span>Admission Offer Letter Generator</span></h2>
                    <div className="space-y-2 text-xs">
                      <label className="text-slate-400 block">Select Application</label>
                      <select value={offerLetterAppId} onChange={(e) => setOfferLetterAppId(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white">
                        <option value="">-- Choose Candidate --</option>
                        {applications.map((app) => <option key={app.id} value={app.id}>{app.application_number} - {app.applicant_name}</option>)}
                      </select>
                      <div className="flex space-x-2 pt-1">
                        <button onClick={handleGenerateOfferLetter} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold">Preview Document</button>
                        <button onClick={handleDownloadPDFOfferLetter} className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"><Download className="w-3.5 h-3.5" /><span>Download PDF</span></button>
                      </div>
                    </div>
                  </div>

                  {offerLetterData && (
                    <div className="p-8 bg-white text-slate-900 rounded-2xl max-w-2xl border border-slate-200 shadow-2xl space-y-6">
                      <div className="flex justify-between items-center border-b pb-4">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">{offerLetterData.university_name}</h2>
                          <p className="text-xs text-slate-600">Office of Admissions & Governance</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-500">Date: {offerLetterData.issue_date}</span>
                      </div>
                      <div className="space-y-3 text-xs">
                        <p className="font-bold">PROVISIONAL OFFER OF ADMISSION</p>
                        <p>Dear <span className="font-bold">{offerLetterData.applicant_name}</span>,</p>
                        <p>We are pleased to inform you that based on your academic performance and entrance exam merit, you have been selected for admission to <span className="font-bold">{offerLetterData.program_name}</span> for the upcoming academic session.</p>
                        <div className="p-3 bg-slate-100 rounded-lg space-y-1">
                          <p>Application Number: <span className="font-mono font-bold">{offerLetterData.application_number}</span></p>
                          <p>Merit Rank: <span className="font-bold">#{offerLetterData.merit_rank}</span></p>
                          <p>Annual Tuition Fee: <span className="font-mono font-bold">₹{Number(offerLetterData.tuition_fee).toLocaleString()}</span></p>
                          <p>Reporting Deadline: <span className="font-bold text-red-600">{offerLetterData.reporting_deadline}</span></p>
                        </div>
                        <p className="text-[11px] text-slate-500 italic">{offerLetterData.terms_and_conditions}</p>
                      </div>
                      <div className="pt-6 border-t flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>Registrar (Admissions)</span>
                        <div className="flex space-x-2">
                          <button onClick={handleDownloadPDFOfferLetter} className="px-3 py-1.5 bg-amber-600 text-white rounded text-xs flex items-center space-x-1"><Download className="w-3.5 h-3.5" /><span>Download PDF</span></button>
                          <button onClick={() => window.print()} className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs flex items-center space-x-1"><Printer className="w-3.5 h-3.5" /><span>Print</span></button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 16: BULK IMPORT (CSV + XLSX SUPPORT) */}
              {activeTab === 'bulk_import' && (
                <div className="space-y-6">
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 max-w-xl">
                    <h2 className="text-sm font-bold text-white flex items-center space-x-2"><FileSpreadsheet className="w-4 h-4 text-emerald-400" /><span>Bulk Candidate Import (.xlsx, .xls, .csv)</span></h2>
                    <p className="text-xs text-slate-400">Select an Excel workbook (<code>.xlsx</code> / <code>.xls</code>) or CSV file with candidate columns: <code>FirstName, LastName, Email, Mobile, Gender, Academic12thScore, EntranceScore</code></p>
                    
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1.5">Upload Spreadsheet File</label>
                      <input
                        type="file"
                        accept=".csv, .xlsx, .xls"
                        onChange={handleBulkFileUpload}
                        className="w-full text-xs text-slate-300 bg-slate-800 border border-slate-700 rounded-xl p-2 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {bulkImportParsed.length > 0 && (
                    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-emerald-400 font-bold">Parsed {bulkImportParsed.length} candidate rows ready for transactional import.</span>
                        <button onClick={handleExecuteBulkImport} disabled={bulkImporting} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all">{bulkImporting ? 'Importing...' : 'Execute Import'}</button>
                      </div>

                      <div className="overflow-x-auto max-h-64">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-800/80 text-slate-400">
                            <tr>
                              <th className="p-2">Name</th>
                              <th className="p-2">Email</th>
                              <th className="p-2">Mobile</th>
                              <th className="p-2">12th %</th>
                              <th className="p-2">Entrance Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-slate-300">
                            {bulkImportParsed.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/40">
                                <td className="p-2 font-medium text-white">{row.first_name} {row.last_name}</td>
                                <td className="p-2 font-mono text-indigo-300">{row.email}</td>
                                <td className="p-2 font-mono text-slate-400">{row.mobile}</td>
                                <td className="p-2 font-mono">{row.percentage_12th}%</td>
                                <td className="p-2 font-mono">{row.entrance_score}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 18: REPORTS & ANALYTICS */}
              {activeTab === 'analytics' && analytics && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl"><span className="text-xs text-slate-400 block mb-1">Total Conversion Rate</span><p className="text-2xl font-bold text-emerald-400">{analytics.funnel.conversionRate}</p></div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl"><span className="text-xs text-slate-400 block mb-1">Total Eligible</span><p className="text-2xl font-bold text-blue-400">{analytics.funnel.eligible}</p></div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl"><span className="text-xs text-slate-400 block mb-1">Total Shortlisted</span><p className="text-2xl font-bold text-amber-400">{analytics.funnel.shortlisted}</p></div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl"><span className="text-xs text-slate-400 block mb-1">Enrolled Students</span><p className="text-2xl font-bold text-purple-400">{analytics.funnel.enrolled}</p></div>
                  </div>
                </div>
              )}

              {/* TAB 19: SLA MONITORING */}
              {activeTab === 'sla' && slaData && (
                <div className="space-y-4">
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                    <h2 className="text-sm font-bold text-white flex items-center space-x-2"><Timer className="w-4 h-4 text-amber-400" /><span>Workload SLA Compliance Monitor</span></h2>
                    <p className="text-xs text-slate-400">Applications pending &gt; 24h: <span className="font-mono font-bold text-amber-300">{slaData.overdueApplicationsCount || 0}</span> | Documents pending &gt; 48h: <span className="font-mono font-bold text-amber-300">{slaData.overdueDocumentsCount || 0}</span></p>
                  </div>
                </div>
              )}

              {/* TAB 20: AUDIT LOGS */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-white">System Admission Audit History</h2>
                  <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/80 text-slate-400">
                        <tr>
                          <th className="p-3">Timestamp</th>
                          <th className="p-3">App #</th>
                          <th className="p-3">Action</th>
                          <th className="p-3">User</th>
                          <th className="p-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {auditLogs.length === 0 ? (
                          <tr><td colSpan={5} className="p-6 text-center text-slate-500">No audit log records captured.</td></tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-800/40">
                              <td className="p-3 font-mono text-slate-400 text-[11px]">{log.created_at}</td>
                              <td className="p-3 font-mono text-indigo-300">{log.application_number || `#${log.application_id}`}</td>
                              <td className="p-3 font-bold text-white">{log.action}</td>
                              <td className="p-3 text-slate-400">{log.performed_by_user_name || `User #${log.performed_by_user_id}`}</td>
                              <td className="p-3 text-slate-400">{log.remarks || 'N/A'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* MODAL: APPLICATION DETAILS & STUDENT CONVERSION */}
      {applicationDetailsModal && selectedApplication && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-indigo-400">{selectedApplication.application.application_number}</span>
                <h2 className="text-lg font-bold text-white">{selectedApplication.application.applicant_name}</h2>
              </div>
              <button onClick={() => setApplicationDetailsModal(false)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/60 rounded-2xl text-xs">
              <div><span className="text-slate-400 block mb-1">Application Status</span>{renderAppStatusBadge(selectedApplication.application.application_status)}</div>
              <div><span className="text-slate-400 block mb-1">Fee Payment Status</span>{renderFeeStatusBadge(selectedApplication.application.fee_status)}</div>
              <div><span className="text-slate-400 block mb-1">Tuition Agreed</span><span className="font-mono text-white font-bold">₹{Number(selectedApplication.application.agreed_tuition_fee || 0).toLocaleString()}</span></div>
              <div><span className="text-slate-400 block mb-1">Total Paid</span><span className="font-mono text-emerald-400 font-bold">₹{Number(selectedApplication.application.paid_amount || 0).toLocaleString()}</span></div>
            </div>

            {selectedApplication.application.application_status === 'ADMISSION_CONFIRMED' && !conversionSuccess && (
              <div className="p-5 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400"><Award className="w-5 h-5" /><h3 className="text-sm font-bold text-white">Convert Application to Enrolled Student</h3></div>
                <button onClick={() => { setShowConversionModal(true); setConversionConfirmed(false); setConversionError(null); }} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center space-x-2">
                  <UserCheck className="w-4 h-4" /><span>Initiate Student Conversion</span>
                </button>
              </div>
            )}

            {conversionSuccess && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-700/60 rounded-2xl space-y-1 text-emerald-200 text-xs">
                <p className="font-bold text-emerald-300">Student Converted Successfully!</p>
                <p>Student ID: <span className="font-mono font-bold text-white">#{conversionSuccess.studentId}</span></p>
                <p>Roll Number: <span className="font-mono font-bold text-amber-300 text-sm">{conversionSuccess.rollNumber}</span></p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRM CONVERSION DIALOG */}
      {showConversionModal && selectedApplication && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Confirm Enrolled Student Conversion</h3>
            <p className="text-xs text-slate-300">Convert candidate <span className="font-bold text-white">{selectedApplication.application.applicant_name}</span> into an active ERP student.</p>
            {conversionError && <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">{conversionError}</div>}
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer pt-2">
              <input type="checkbox" checked={conversionConfirmed} onChange={(e) => setConversionConfirmed(e.target.checked)} className="w-4 h-4 rounded border-slate-700 text-indigo-600" />
              <span>I confirm all credentials and fee payments are verified.</span>
            </label>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button onClick={() => setShowConversionModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs">Cancel</button>
              <button onClick={handleExecuteConversion} disabled={!conversionConfirmed || isConverting} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5">
                {isConverting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}<span>Execute Conversion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT VERIFICATION MODAL */}
      {showDocModal && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleVerifyDocument} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Audit Document Metadata</h3>
            <div className="p-3 bg-slate-800 rounded-xl text-xs space-y-1 text-slate-300">
              <p>Document Type: <span className="font-bold text-white">{selectedDoc.document_type}</span></p>
              <p>Filename: <span className="font-mono text-indigo-300">{selectedDoc.original_filename}</span></p>
            </div>
            <div className="space-y-3 text-xs">
              <select value={docVerifyStatus} onChange={(e) => setDocVerifyStatus(e.target.value as any)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white">
                <option value="VERIFIED">Approve Metadata (VERIFIED)</option>
                <option value="REJECTED">Reject Document (REJECTED)</option>
              </select>
              {docVerifyStatus === 'REJECTED' && (
                <textarea required value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs h-20" placeholder="Rejection reason..." />
              )}
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setShowDocModal(false)} className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs">Cancel</button>
              <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">Update Document</button>
            </div>
          </form>
        </div>
      )}

      {/* CRM ENQUIRY MODAL */}
      {showEnquiryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateEnquiry} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Log CRM Enquiry</h3>
            <div className="space-y-3 text-xs">
              <input type="text" required placeholder="Candidate Full Name" value={newEnquiryData.candidate_name} onChange={(e) => setNewEnquiryData({ ...newEnquiryData, candidate_name: e.target.value })} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white" />
              <input type="email" required placeholder="Email Address" value={newEnquiryData.email} onChange={(e) => setNewEnquiryData({ ...newEnquiryData, email: e.target.value })} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white" />
              <input type="text" required placeholder="Mobile Phone" value={newEnquiryData.mobile} onChange={(e) => setNewEnquiryData({ ...newEnquiryData, mobile: e.target.value })} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white" />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setShowEnquiryModal(false)} className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs">Cancel</button>
              <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">Save Enquiry</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdmissionOfficeDashboard;
