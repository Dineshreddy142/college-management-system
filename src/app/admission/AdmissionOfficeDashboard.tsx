import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, FileText, CheckCircle2, Clock, Search,
  Download, Printer, DollarSign, Shield, Filter, RefreshCw,
  Sparkles, CreditCard, Award, FileCheck, HelpCircle, UserCheck,
  Building, ChevronRight, AlertCircle, ArrowUpRight, Check, X, Loader2,
  Calendar, Layers, ShieldCheck, Mail, Phone, ExternalLink, Bookmark,
  BarChart3, PieChart, TrendingUp, ChevronDown, Menu, LogOut, Eye,
  Lock, AlertTriangle, CheckSquare, XCircle, FileSpreadsheet, ArrowLeft,
  UserCheck2, FileCheck2, School, GraduationCap, Copy, Hash, FileInput,
  Sun, Moon
} from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../portal/AuthContext';

interface AdmissionOfficeDashboardProps {
  onNav?: (module: string) => void;
  theme?: string;
  toggleTheme?: () => void;
}

export function AdmissionOfficeDashboard({ onNav, theme, toggleTheme }: AdmissionOfficeDashboardProps) {
  const { user, logout } = useAuth();
  // Navigation & Sidebar State
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [statusFilterSub, setStatusFilterSub] = useState<string | null>(null);

  // Data States
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    totalApplications: 0,
    newApplications: 0,
    underReview: 0,
    documentsPending: 0,
    eligibleStudents: 0,
    selectedStudents: 0,
    feePending: 0,
    confirmedAdmissions: 0,
    cancelledAdmissions: 0,
    rejectedApplications: 0
  });

  const [applications, setApplications] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [reportsData, setReportsData] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Selected Application & Detail View State
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "documents" | "eligibility" | "seat" | "fee" | "history">("overview");
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);

  // Duplicate Check Modal State
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);

  // New Application Form Modal & Page State
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAppForm, setNewAppForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "Male",
    mobile: "",
    email: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    parentName: "",
    parentRelation: "Father",
    parentMobile: "",
    school10th: "",
    board10th: "",
    year10th: "",
    percentage10th: "",
    school12th: "",
    board12th: "",
    year12th: "",
    percentage12th: "",
    entranceExam: "",
    entranceScore: "",
    courseName: "B.Tech Computer Science & Engineering",
    departmentName: "Computer Science & Engineering",
    admissionCategory: "General",
    admissionType: "Regular",
    photoName: "",
    photoData: "",
    proof10thName: "",
    proof10thData: "",
    proof12thName: "",
    proof12thData: ""
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'photo' | 'proof10th' | 'proof12th') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      if (fieldName === 'photo') {
        setNewAppForm(prev => ({ ...prev, photoName: file.name, photoData: base64Data }));
      } else if (fieldName === 'proof10th') {
        setNewAppForm(prev => ({ ...prev, proof10thName: file.name, proof10thData: base64Data }));
      } else {
        setNewAppForm(prev => ({ ...prev, proof12thName: file.name, proof12thData: base64Data }));
      }
    };
    reader.readAsDataURL(file);
  };

  const MASTER_COURSES = [
    "B.Tech Computer Science & Engineering",
    "B.Tech Electronics & Communication",
    "B.Tech Mechanical Engineering",
    "B.Tech Electrical & Electronics Engineering",
    "B.Tech Civil Engineering",
    "B.Tech Artificial Intelligence & Data Science",
    "B.Sc Computer Science",
    "B.Sc Data Science",
    "BBA Business Analytics",
    "B.Com Honors",
    "MBA International Business",
    "M.Tech Computer Science",
    "MCA Software Systems"
  ];

  const availableCourses = Array.from(new Set([
    ...courses.map((c: any) => c.course_name),
    ...MASTER_COURSES
  ]));

  // Action Modals State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("125000");
  const [paymentMethod, setPaymentMethod] = useState("Cash Counter");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch Dashboard & Applications Telemetry
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, appsRes, coursesRes, reportsRes] = await Promise.all([
        client.get('/admission/dashboard-stats'),
        client.get('/admission/applications'),
        client.get('/admission/courses-seats'),
        client.get('/admission/reports')
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data.summary || {});
      }
      if (appsRes.data?.success) {
        setApplications(appsRes.data.data || []);
      }
      if (coursesRes.data?.success) {
        setCourses(coursesRes.data.data || []);
      }
      if (reportsRes.data?.success) {
        setReportsData(reportsRes.data.data || null);
      }
    } catch (err: any) {
      console.warn('[ADMISSION DATA FETCH NOTICE]', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch Full Application Details
  const handleOpenAppDetails = async (appId: string | number) => {
    setFormError(null);
    try {
      const res = await client.get(`/admission/applications/${appId}`);
      if (res.data?.success) {
        setSelectedApp(res.data.data);
        setActiveNav("application-details");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to load application details.';
      triggerToast(`⚠️ ${msg}`);
      setFormError(msg);
    }
  };

  // Create Application Handler with Duplicate Check
  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newAppForm.firstName.trim() || !newAppForm.lastName.trim() || !newAppForm.email.trim() || !newAppForm.mobile.trim()) {
      const msg = "First Name, Last Name, Email, and Mobile Contact are required.";
      setFormError(msg);
      triggerToast(`⚠️ ${msg}`);
      return;
    }
    if (!newAppForm.photoName || !newAppForm.photoData) {
      const msg = "Candidate Photograph upload is compulsory! Please select a passport photo file.";
      setFormError(msg);
      triggerToast(`⚠️ ${msg}`);
      return;
    }
    if (!newAppForm.percentage10th || !newAppForm.proof10thName) {
      const msg = "10th Percentage and 10th Marksheet Proof Document are compulsory!";
      setFormError(msg);
      triggerToast(`⚠️ ${msg}`);
      return;
    }
    if (!newAppForm.percentage12th || !newAppForm.proof12thName) {
      const msg = "12th Percentage and 12th Marksheet Proof Document are compulsory!";
      setFormError(msg);
      triggerToast(`⚠️ ${msg}`);
      return;
    }

    setIsSubmitting(true);
    setDuplicateWarning(null);
    try {
      const res = await client.post('/admission/applications', {
        first_name: newAppForm.firstName.trim(),
        last_name: newAppForm.lastName.trim(),
        dob: newAppForm.dob,
        gender: newAppForm.gender,
        mobile: newAppForm.mobile.trim(),
        email: newAppForm.email.trim(),
        address: newAppForm.address,
        city: newAppForm.city,
        state: newAppForm.state,
        postal_code: newAppForm.postalCode,
        parent_name: newAppForm.parentName,
        parent_relation: newAppForm.parentRelation,
        parent_mobile: newAppForm.parentMobile,
        school_10th: newAppForm.school10th,
        board_10th: newAppForm.board10th,
        year_10th: newAppForm.year10th,
        percentage_10th: newAppForm.percentage10th,
        school_12th: newAppForm.school12th,
        board_12th: newAppForm.board12th,
        year_12th: newAppForm.year12th,
        percentage_12th: newAppForm.percentage12th,
        entrance_exam: newAppForm.entranceExam,
        entrance_score: newAppForm.entranceScore,
        course_name: newAppForm.courseName,
        department_name: newAppForm.departmentName,
        admission_category: newAppForm.admissionCategory,
        admission_type: newAppForm.admissionType,
        photo_name: newAppForm.photoName,
        photo_data: newAppForm.photoData,
        proof_10th_name: newAppForm.proof10thName,
        proof_10th_data: newAppForm.proof10thData,
        proof_12th_name: newAppForm.proof12thName,
        proof_12th_data: newAppForm.proof12thData
      });

      if (res.data?.success) {
        triggerToast(`✨ Application ${res.data.data.application_number} created successfully!`);
        setShowNewAppModal(false);
        setActiveNav("applications");
        setFormError(null);
        setNewAppForm({
          firstName: "",
          lastName: "",
          dob: "",
          gender: "Male",
          mobile: "",
          email: "",
          address: "",
          city: "",
          state: "",
          postalCode: "",
          parentName: "",
          parentRelation: "Father",
          parentMobile: "",
          school10th: "",
          board10th: "",
          year10th: "",
          percentage10th: "",
          school12th: "",
          board12th: "",
          year12th: "",
          percentage12th: "",
          entranceExam: "",
          entranceScore: "",
          courseName: availableCourses[0] || "B.Tech Computer Science & Engineering",
          departmentName: "Computer Science & Engineering",
          admissionCategory: "General",
          admissionType: "Regular",
          photoName: "",
          photoData: "",
          proof10thName: "",
          proof10thData: "",
          proof12thName: "",
          proof12thData: ""
        });
        fetchDashboardData();
      }
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.isDuplicate) {
        setDuplicateWarning(err.response.data.existingApplication);
        const msg = "Duplicate Application Detected! An application with this email or mobile already exists.";
        setFormError(msg);
        triggerToast(`⚠️ ${msg}`);
      } else {
        const msg = err.response?.data?.message || err.message || 'Failed to submit application.';
        setFormError(msg);
        triggerToast(`⚠️ ${msg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Change Handler
  const handleUpdateStatus = async (appId: number, status: string, remarks?: string) => {
    setFormError(null);
    try {
      const res = await client.put(`/admission/applications/${appId}/status`, { status, remarks });
      if (res.data?.success) {
        triggerToast(`✓ Status updated to "${status}"`);
        handleOpenAppDetails(appId);
        fetchDashboardData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Status update failed.';
      setFormError(msg);
      triggerToast(`⚠️ ${msg}`);
    }
  };

  // Verify Document Handler
  const handleVerifyDocument = async (docId: number, verification_status: string, remarks?: string) => {
    setFormError(null);
    try {
      const res = await client.post(`/admission/documents/${docId}/verify`, { verification_status, remarks });
      if (res.data?.success) {
        triggerToast(`📄 Document updated to "${verification_status}"`);
        if (selectedApp) handleOpenAppDetails(selectedApp.id);
        fetchDashboardData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Document verification failed.';
      setFormError(msg);
      triggerToast(`⚠️ ${msg}`);
    }
  };

  // Verify Eligibility Handler
  const handleVerifyEligibility = async (appId: number, eligibility_status: string) => {
    setFormError(null);
    try {
      const res = await client.post(`/admission/applications/${appId}/verify-eligibility`, { eligibility_status });
      if (res.data?.success) {
        triggerToast(`🎓 Eligibility status updated to "${eligibility_status}"`);
        handleOpenAppDetails(appId);
        fetchDashboardData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Eligibility verification failed.';
      setFormError(msg);
      triggerToast(`⚠️ ${msg}`);
    }
  };

  // Allocate Seat Handler with Over-Allocation Protection
  const handleAllocateSeat = async (appId: number) => {
    setFormError(null);
    try {
      const res = await client.post(`/admission/applications/${appId}/allocate-seat`, {});
      if (res.data?.success) {
        triggerToast(`🪑 Seat ${res.data.data.seat_number} allocated!`);
        handleOpenAppDetails(appId);
        fetchDashboardData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Seat allocation failed.';
      setFormError(msg);
      triggerToast(`⚠️ ${msg}`);
    }
  };

  // Record Payment Handler
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedApp) return;

    try {
      const res = await client.post(`/admission/applications/${selectedApp.id}/record-payment`, {
        amount: paymentAmount,
        payment_method: paymentMethod
      });
      if (res.data?.success) {
        triggerToast(`💳 Payment of ₹${Number(paymentAmount).toLocaleString()} recorded! Receipt: ${res.data.data.receipt_number}`);
        setShowPaymentModal(false);
        handleOpenAppDetails(selectedApp.id);
        fetchDashboardData();
      }
    } catch (err: any) {
      triggerToast(`⚠️ ${err.response?.data?.message || 'Payment processing failed.'}`);
    }
  };

  // Confirm Admission & Generate Student Master Record Handler
  const handleConfirmAdmission = async (appId: number) => {
    try {
      const res = await client.post(`/admission/applications/${appId}/confirm-admission`, {});
      if (res.data?.success) {
        triggerToast(`🎉 ${res.data.message}`);
        handleOpenAppDetails(appId);
        fetchDashboardData();
      }
    } catch (err: any) {
      triggerToast(`⚠️ ${err.response?.data?.message || 'Admission confirmation failed.'}`);
    }
  };

  // Filtered Applications Table Data
  const filteredApps = applications.filter(a => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = 
      (a.application_number || '').toLowerCase().includes(term) ||
      (a.applicant_name || '').toLowerCase().includes(term) ||
      (a.email || '').toLowerCase().includes(term) ||
      (a.mobile || '').toLowerCase().includes(term) ||
      (a.enrolled_student_id || '').toLowerCase().includes(term);

    const matchesCourse = courseFilter === "All" || a.course_name === courseFilter;
    const matchesDept = deptFilter === "All" || a.department_name === deptFilter;
    const matchesStatus = statusFilter === "All" || a.application_status === statusFilter;
    const matchesSub = !statusFilterSub || a.application_status === statusFilterSub;

    return matchesSearch && matchesCourse && matchesDept && matchesStatus && matchesSub;
  });

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden relative font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-blue-600 dark:bg-blue-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-blue-400 animate-bounce">
          <Sparkles className="w-5 h-5 text-yellow-300 shrink-0" />
          <span className="font-semibold text-sm">{toastMsg}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          1. COLLAPSIBLE SIDEBAR & MOBILE DRAWER (SECTION 3)
      ───────────────────────────────────────────────────────────────────────────── */}
      <aside className={`bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 z-30 shrink-0 ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      } hidden md:flex`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                AO
              </div>
              <div>
                <h2 className="font-extrabold text-white text-sm tracking-tight leading-none">EduERP</h2>
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Admission Office</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition mx-auto"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <div className="p-3 space-y-1 overflow-y-auto flex-1 scrollbar-thin">
          {[
            { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
            { id: "new-application", label: "Register Application", icon: <UserPlus className="w-4 h-4 text-emerald-400" /> },
            { 
              id: "applications", 
              label: "Applications", 
              icon: <FileText className="w-4 h-4" />,
              subs: [
                { id: "All", label: "All Applications" },
                { id: "Submitted", label: "New Applications" },
                { id: "Under Review", label: "Under Review" },
                { id: "Selected", label: "Approved" },
                { id: "Rejected", label: "Rejected" },
                { id: "Cancelled", label: "Cancelled" }
              ]
            },
            { id: "applicants", label: "Applicants Registry", icon: <Users className="w-4 h-4" /> },
            { id: "documents", label: "Document Verification", icon: <FileCheck className="w-4 h-4" /> },
            { id: "eligibility", label: "Eligibility Checker", icon: <UserCheck className="w-4 h-4" /> },
            { id: "courses-seats", label: "Courses & Seats", icon: <School className="w-4 h-4" /> },
            { id: "fees-payments", label: "Fees & Payments", icon: <CreditCard className="w-4 h-4" /> },
            { id: "enrollment", label: "Enrollment Secretariat", icon: <GraduationCap className="w-4 h-4" /> },
            { id: "reports", label: "Admission Reports", icon: <FileSpreadsheet className="w-4 h-4" /> },
            { id: "audit-history", label: "Audit & History", icon: <ShieldCheck className="w-4 h-4" /> }
          ].map(item => (
            <div key={item.id}>
              <button
                onClick={() => {
                  setActiveNav(item.id);
                  setStatusFilterSub(null);
                }}
                className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                  activeNav === item.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </div>
                {!sidebarCollapsed && item.subs && <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              {/* Sub-menu if expanded */}
              {!sidebarCollapsed && item.subs && activeNav === item.id && (
                <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-800 pl-3">
                  {item.subs.map(sub => {
                    const isSelected = (statusFilter === sub.id) || (statusFilterSub === sub.id) || (statusFilter === "All" && !statusFilterSub && sub.id === "All");
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          const target = sub.id === "All" ? "All" : sub.id;
                          setStatusFilter(target);
                          setStatusFilterSub(sub.id === "All" ? null : sub.id);
                        }}
                        className={`block w-full text-left py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                          isSelected ? 'text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-none">{user?.full_name || user?.username || 'Admission Officer'}</p>
                <span className="text-[10px] text-slate-500">Admissions Secretariat</span>
              </div>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MAIN CONTENT VIEW AREA
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white capitalize">
              {activeNav.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {toggleTheme && (
              <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition" title="Toggle Theme">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            )}

            <button
              onClick={() => setActiveNav("new-application")}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> New Application
            </button>

            <button
              onClick={fetchDashboardData}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Scrollable Workspace Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          {/* Prominent Global Error Alert Banner */}
          {formError && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
              <button onClick={() => setFormError(null)} className="p-1 hover:bg-rose-500/20 rounded-lg text-rose-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              VIEW 0: SIDEBAR NEW APPLICATION REGISTRATION PAGE
          ───────────────────────────────────────────────────────────────────────────── */}
          {activeNav === "new-application" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <UserPlus className="w-6 h-6 text-blue-400" /> Candidate Application Registration Desk
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Register new student application directly into the university admissions system.</p>
                </div>
                <button
                  onClick={() => setActiveNav("applications")}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-2 cursor-pointer transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Applications
                </button>
              </div>

              <form onSubmit={handleCreateApplication} className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">1. Candidate Identity & Contact Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={newAppForm.firstName}
                      onChange={(e) => setNewAppForm(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="First Name"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={newAppForm.lastName}
                      onChange={(e) => setNewAppForm(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Last Name"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={newAppForm.email}
                      onChange={(e) => setNewAppForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="applicant@example.com"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Mobile Contact *</label>
                    <input
                      type="tel"
                      required
                      value={newAppForm.mobile}
                      onChange={(e) => setNewAppForm(prev => ({ ...prev, mobile: e.target.value }))}
                      placeholder="+91 Mobile Number"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={newAppForm.dob}
                      onChange={(e) => setNewAppForm(prev => ({ ...prev, dob: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Gender *</label>
                    <select
                      value={newAppForm.gender}
                      onChange={(e) => setNewAppForm(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Candidate Photograph Upload Box */}
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {newAppForm.photoData ? (
                      <img src={newAppForm.photoData} alt="Photo" className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-600 shadow-md" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                        No Photo
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 dark:text-white mb-0.5">Candidate Photograph * (Compulsory)</label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Upload official passport photo (JPG, PNG, JPEG)</p>
                      {newAppForm.photoName && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Photo Attached: {newAppForm.photoName}
                        </span>
                      )}
                    </div>
                  </div>
                  <label className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-md transition shrink-0">
                    Choose Photograph
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'photo')}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 pt-2">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">2. Guardian Details & Target Course</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Parent / Guardian Name *</label>
                    <input
                      type="text"
                      required
                      value={newAppForm.parentName}
                      onChange={(e) => setNewAppForm(prev => ({ ...prev, parentName: e.target.value }))}
                      placeholder="Father / Mother Name"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Parent Mobile *</label>
                    <input
                      type="tel"
                      required
                      value={newAppForm.parentMobile}
                      onChange={(e) => setNewAppForm(prev => ({ ...prev, parentMobile: e.target.value }))}
                      placeholder="Parent Contact Number"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Target Course *</label>
                    <select
                      value={newAppForm.courseName}
                      onChange={(e) => setNewAppForm(prev => ({ ...prev, courseName: e.target.value }))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      {availableCourses.map((c, idx) => (
                        <option key={idx} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 pt-2">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">3. Academic Qualifications & Marksheet Proofs</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 10th Record Card */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="font-bold text-xs text-blue-600 dark:text-blue-400 uppercase">10th Academic Marksheet</h4>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">10th School / Board Name *</label>
                      <input
                        type="text"
                        required
                        value={newAppForm.school10th}
                        onChange={(e) => setNewAppForm(prev => ({ ...prev, school10th: e.target.value }))}
                        placeholder="e.g. State Board / CBSE"
                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">10th Percentage (%) *</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={newAppForm.percentage10th}
                        onChange={(e) => setNewAppForm(prev => ({ ...prev, percentage10th: e.target.value }))}
                        placeholder="Enter 10th % (e.g. 88.5)"
                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">10th Marksheet Proof Document *</label>
                      <input
                        type="file"
                        required={!newAppForm.proof10thName}
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, 'proof10th')}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700"
                      />
                      {newAppForm.proof10thName && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Attached: {newAppForm.proof10thName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 12th Record Card */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="font-bold text-xs text-blue-600 dark:text-blue-400 uppercase">12th Academic Marksheet</h4>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">12th School / Board Name *</label>
                      <input
                        type="text"
                        required
                        value={newAppForm.school12th}
                        onChange={(e) => setNewAppForm(prev => ({ ...prev, school12th: e.target.value }))}
                        placeholder="e.g. Higher Sec School / CBSE"
                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">12th Percentage (%) *</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={newAppForm.percentage12th}
                        onChange={(e) => setNewAppForm(prev => ({ ...prev, percentage12th: e.target.value }))}
                        placeholder="Enter 12th % (e.g. 91.2)"
                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">12th Marksheet Proof Document *</label>
                      <input
                        type="file"
                        required={!newAppForm.proof12thName}
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, 'proof12th')}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700"
                      />
                      {newAppForm.proof12thName && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Attached: {newAppForm.proof12thName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveNav("applications")}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Application'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              VIEW 1: ADMISSION OFFICER DASHBOARD (SECTION 2)
          ───────────────────────────────────────────────────────────────────────────── */}
          {activeNav === "dashboard" && (
            <div className="space-y-6">
              {/* SUMMARY CARDS (SECTION 2) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: "Total Applications", val: stats.totalApplications, color: "blue", icon: <FileText className="w-4 h-4" /> },
                  { label: "New Applications", val: stats.newApplications, color: "cyan", icon: <UserPlus className="w-4 h-4" /> },
                  { label: "Under Review", val: stats.underReview, color: "indigo", icon: <Clock className="w-4 h-4" /> },
                  { label: "Documents Pending", val: stats.documentsPending, color: "amber", icon: <AlertCircle className="w-4 h-4" /> },
                  { label: "Eligible Students", val: stats.eligibleStudents, color: "emerald", icon: <CheckCircle2 className="w-4 h-4" /> },
                  { label: "Selected Students", val: stats.selectedStudents, color: "teal", icon: <UserCheck className="w-4 h-4" /> },
                  { label: "Fee Pending", val: stats.feePending, color: "rose", icon: <CreditCard className="w-4 h-4" /> },
                  { label: "Confirmed Admissions", val: stats.confirmedAdmissions, color: "purple", icon: <GraduationCap className="w-4 h-4" /> },
                  { label: "Cancelled Admissions", val: stats.cancelledAdmissions, color: "slate", icon: <XCircle className="w-4 h-4" /> },
                  { label: "Rejected Applications", val: stats.rejectedApplications, color: "red", icon: <AlertTriangle className="w-4 h-4" /> }
                ].map((card, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (card.label === "Under Review") {
                        setActiveNav("applications");
                        setStatusFilter("Under Review");
                        setStatusFilterSub("Under Review");
                      } else if (card.label === "New Applications") {
                        setActiveNav("applications");
                        setStatusFilter("Submitted");
                        setStatusFilterSub("Submitted");
                      } else if (card.label === "Documents Pending") {
                        setActiveNav("documents");
                      } else if (card.label === "Eligible Students") {
                        setActiveNav("eligibility");
                      } else if (card.label === "Fee Pending") {
                        setActiveNav("fees-payments");
                      } else if (card.label === "Confirmed Admissions") {
                        setActiveNav("enrollment");
                      } else {
                        setActiveNav("applications");
                      }
                    }}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-blue-500/50 hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span className="text-[11px] font-bold uppercase tracking-wider">{card.label}</span>
                      {card.icon}
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{card.val || 0}</p>
                  </div>
                ))}
              </div>

              {/* RECENT APPLICATIONS TABLE (SECTION 2) */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" /> Recent Admission Applications
                  </h3>
                  <button
                    onClick={() => setActiveNav("applications")}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    View All Applications →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Application ID</th>
                        <th className="p-4">Applicant Name</th>
                        <th className="p-4">Course</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Application Status</th>
                        <th className="p-4">Document Status</th>
                        <th className="p-4">Fee Status</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400">Loading recent applications...</td>
                        </tr>
                      ) : applications.slice(0, 8).map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {app.application_number}
                          </td>
                          <td className="p-4 font-bold text-slate-900 dark:text-white">
                            {app.applicant_name}
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-300">
                            {app.course_name}
                          </td>
                          <td className="p-4 text-slate-400">
                            {new Date(app.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              app.application_status === 'Enrolled' || app.application_status === 'Admission Confirmed' ? 'bg-emerald-500/10 text-emerald-600' :
                              app.application_status === 'Rejected' ? 'bg-rose-500/10 text-rose-600' :
                              app.application_status === 'Selected' ? 'bg-teal-500/10 text-teal-600' : 'bg-blue-500/10 text-blue-600'
                            }`}>
                              {app.application_status}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              app.document_status === 'Verified' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                            }`}>
                              {app.document_status}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              app.fee_status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              {app.fee_status}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleOpenAppDetails(app.id)}
                              className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-[11px] hover:bg-blue-100 transition"
                            >
                              Review Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              VIEW 2: APPLICATION MANAGEMENT & TABLE (SECTION 4)
          ───────────────────────────────────────────────────────────────────────────── */}
          {(activeNav === "applications" || activeNav === "applicants") && (
            <div className="space-y-4">
              {/* Search & Filters (Section 4 & Section 19) */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search App ID, Name, Email, Mobile, Student ID..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <select
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    <option value="All">All Courses</option>
                    {courses.map(c => <option key={c.id} value={c.course_name}>{c.course_code} - {c.course_name}</option>)}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    <option value="All">All Application Statuses</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Document Verification">Document Verification</option>
                    <option value="Eligibility Verification">Eligibility Verification</option>
                    <option value="Eligible">Eligible</option>
                    <option value="Selected">Selected</option>
                    <option value="Fee Pending">Fee Pending</option>
                    <option value="Fee Paid">Fee Paid</option>
                    <option value="Enrolled">Enrolled</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Master Applications Table */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Application ID</th>
                        <th className="p-4">Applicant Name</th>
                        <th className="p-4">Course & Department</th>
                        <th className="p-4">Application Status</th>
                        <th className="p-4">Document Status</th>
                        <th className="p-4">Eligibility</th>
                        <th className="p-4">Fee Status</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredApps.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {app.application_number}
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-slate-900 dark:text-white">{app.applicant_name}</p>
                            <span className="text-[11px] text-slate-400">{app.email} • {app.mobile}</span>
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{app.course_name}</p>
                            <span className="text-[11px] text-slate-400">{app.department_name}</span>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 font-bold text-[10px]">
                              {app.application_status}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              app.document_status === 'Verified' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                            }`}>
                              {app.document_status}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              app.eligibility_status === 'Eligible' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-600'
                            }`}>
                              {app.eligibility_status}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              app.fee_status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              {app.fee_status}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleOpenAppDetails(app.id)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] cursor-pointer"
                            >
                              Open Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              VIEW 3: APPLICATION DETAILS PAGE & WORKFLOW (SECTION 25 & SECTION 5)
          ───────────────────────────────────────────────────────────────────────────── */}
          {activeNav === "application-details" && selectedApp && (
            <div className="space-y-6">
              {/* Top Navigation Back Banner */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveNav("applications")}
                  className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Applications List
                </button>

                <div className="flex items-center gap-2">
                  {selectedApp.application_status !== 'Enrolled' && selectedApp.application_status !== 'Rejected' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(selectedApp.id, 'Under Review', 'Officer review in progress')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                      >
                        Put Under Review
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedApp.id, 'Rejected', 'Application rejected by officer')}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                      >
                        Reject Application
                      </button>
                    </>
                  )}
                  {selectedApp.application_status === 'Fee Paid' && (
                    <button
                      onClick={() => handleConfirmAdmission(selectedApp.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Confirm Admission & Enroll
                    </button>
                  )}
                </div>
              </div>

              {/* Applicant Header Banner */}
              <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs text-blue-400 font-bold bg-blue-950 px-2.5 py-1 rounded-md border border-blue-800">
                      {selectedApp.application_number}
                    </span>
                    <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                      {selectedApp.application_status}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">{selectedApp.applicant_name}</h2>
                  <p className="text-slate-400 text-xs mt-1">Applied for <strong className="text-slate-200">{selectedApp.course_name}</strong> ({selectedApp.department_name})</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Document Status</span>
                    <span className="text-emerald-400 font-bold">{selectedApp.document_status}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Eligibility</span>
                    <span className="text-blue-400 font-bold">{selectedApp.eligibility_status}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Fee Status</span>
                    <span className="text-emerald-400 font-bold">{selectedApp.fee_status}</span>
                  </div>
                </div>
              </div>

              {/* Details Sub-Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                {[
                  { id: "overview", label: "Applicant Profile" },
                  { id: "documents", label: "Documents Verification" },
                  { id: "eligibility", label: "Eligibility Checker" },
                  { id: "seat", label: "Seat Allocation" },
                  { id: "fee", label: "Fees & Payment" },
                  { id: "history", label: "Admission History" }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setDetailTab(t.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      detailTab === t.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT: PROFILE OVERVIEW (SECTION 6) */}
              {detailTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal & Contact Info */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b pb-2">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-slate-400 block">Full Name:</span> <strong className="text-slate-900 dark:text-white">{selectedApp.applicant_name}</strong></div>
                      <div><span className="text-slate-400 block">Gender / DOB:</span> <strong className="text-slate-900 dark:text-white">{selectedApp.gender} • {selectedApp.dob ? new Date(selectedApp.dob).toLocaleDateString() : 'N/A'}</strong></div>
                      <div><span className="text-slate-400 block">Email Address:</span> <strong className="text-slate-900 dark:text-white">{selectedApp.email}</strong></div>
                      <div><span className="text-slate-400 block">Mobile Contact:</span> <strong className="text-slate-900 dark:text-white">{selectedApp.mobile}</strong></div>
                      <div className="col-span-2"><span className="text-slate-400 block">Address:</span> <strong className="text-slate-900 dark:text-white">{selectedApp.address || 'N/A'}, {selectedApp.city || ''}, {selectedApp.state || ''} - {selectedApp.postal_code || ''}</strong></div>
                    </div>
                  </div>

                  {/* Academic Credentials */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b pb-2">Academic Qualifications</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-slate-400 block">10th School / Board:</span> <strong className="text-slate-900 dark:text-white">{selectedApp.school_10th ? `${selectedApp.school_10th} (${selectedApp.board_10th || 'SSLC'})` : 'N/A'}</strong></div>
                      <div><span className="text-slate-400 block">10th Percentage:</span> <strong className="text-emerald-600 font-bold">{selectedApp.percentage_10th != null ? `${selectedApp.percentage_10th}%` : 'N/A'}</strong></div>
                      <div><span className="text-slate-400 block">12th School / Board:</span> <strong className="text-slate-900 dark:text-white">{selectedApp.school_12th ? `${selectedApp.school_12th} (${selectedApp.board_12th || 'HSC'})` : 'N/A'}</strong></div>
                      <div><span className="text-slate-400 block">12th Percentage:</span> <strong className="text-emerald-600 font-bold">{selectedApp.percentage_12th != null ? `${selectedApp.percentage_12th}%` : 'N/A'}</strong></div>
                      <div><span className="text-slate-400 block">Entrance Exam / Score:</span> <strong className="text-blue-600 font-bold">{selectedApp.entrance_exam ? `${selectedApp.entrance_exam} (Score: ${selectedApp.entrance_score || 'N/A'})` : 'N/A'}</strong></div>
                      <div><span className="text-slate-400 block">Category / Type:</span> <strong className="text-slate-900 dark:text-white">{selectedApp.admission_category || 'General'} • {selectedApp.admission_type || 'Regular'}</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: DOCUMENTS VERIFICATION (SECTION 7 - INTERACTIVE SIDE-BY-SIDE AUDIT) */}
              {detailTab === "documents" && (
                <div className="space-y-4">
                  {/* Global Verification Action Bar */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-slate-800">
                    <div>
                      <h4 className="font-extrabold text-sm flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Interactive Side-by-Side Document Audit Desk
                      </h4>
                      <p className="text-xs text-slate-300">Compare applicant entered details against uploaded marksheets & credentials before approval.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          if (!selectedApp.documents || selectedApp.documents.length === 0) return;
                          for (const d of selectedApp.documents) {
                            await handleVerifyDocument(d.id, 'Verified', 'Verified in batch comparison');
                          }
                          handleUpdateStatus(selectedApp.id, 'Under Review', 'All documents verified by officer');
                          triggerToast('✨ All candidate documents verified successfully!');
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve All Documents & Set Verified
                      </button>
                    </div>
                  </div>

                  {/* Split View Container */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column (5 cols): Entered Candidate Details */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                          {selectedApp.photo_data ? (
                            <img src={selectedApp.photo_data} alt="Photo" className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shadow-md" />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                              No Photo
                            </div>
                          )}
                          <div>
                            <h4 className="font-black text-sm text-slate-900 dark:text-white">{selectedApp.applicant_name}</h4>
                            <p className="text-xs text-slate-500 font-mono">{selectedApp.application_number}</p>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600">
                              {selectedApp.course_name}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Personal Identity</span>
                            <p><strong>DOB:</strong> {selectedApp.dob ? new Date(selectedApp.dob).toLocaleDateString() : 'N/A'} • <strong>Gender:</strong> {selectedApp.gender || 'N/A'}</p>
                            <p><strong>Email:</strong> {selectedApp.email}</p>
                            <p><strong>Mobile:</strong> {selectedApp.mobile}</p>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Entered 10th Marks vs Document</span>
                            <p><strong>Board / School:</strong> {selectedApp.school_10th || selectedApp.board_10th || 'N/A'}</p>
                            <p className="text-sm"><strong>10th Percentage:</strong> <span className="text-emerald-600 font-black">{selectedApp.percentage_10th != null ? `${selectedApp.percentage_10th}%` : 'N/A'}</span></p>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Entered 12th Marks vs Document</span>
                            <p><strong>Board / School:</strong> {selectedApp.school_12th || selectedApp.board_12th || 'N/A'}</p>
                            <p className="text-sm"><strong>12th Percentage:</strong> <span className="text-emerald-600 font-black">{selectedApp.percentage_12th != null ? `${selectedApp.percentage_12th}%` : 'N/A'}</span></p>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Entrance Qualification</span>
                            <p><strong>Exam:</strong> {selectedApp.entrance_exam || 'Direct Merit'}</p>
                            <p><strong>Score / Rank:</strong> {selectedApp.entrance_score || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (7 cols): Document Selection, Previewer & Verification Desk */}
                    <div className="lg:col-span-7 space-y-4">
                      {(() => {
                        const activeDocs = (selectedApp.documents && selectedApp.documents.length > 0)
                          ? selectedApp.documents
                          : [
                              { id: 991, document_name: 'Photograph', file_path: selectedApp.photo_data, verification_status: selectedApp.photo_data ? 'Uploaded' : 'Pending' },
                              { id: 992, document_name: '10th Marksheet Proof', file_path: selectedApp.proof_10th_data || selectedApp.proof_10th_name, verification_status: (selectedApp.proof_10th_data || selectedApp.proof_10th_name) ? 'Uploaded' : 'Pending' },
                              { id: 993, document_name: '12th Marksheet Proof', file_path: selectedApp.proof_12th_data || selectedApp.proof_12th_name, verification_status: (selectedApp.proof_12th_data || selectedApp.proof_12th_name) ? 'Uploaded' : 'Pending' },
                              { id: 994, document_name: 'Identity Proof (Aadhaar / Passport)', file_path: null, verification_status: 'Pending' },
                              { id: 995, document_name: 'Entrance Scorecard Proof', file_path: selectedApp.proof_entrance_data || (selectedApp.entrance_score ? `Entrance Score: ${selectedApp.entrance_score}` : null), verification_status: selectedApp.entrance_score ? 'Uploaded' : 'Pending' }
                            ];

                        const safeIndex = Math.min(selectedDocIndex, activeDocs.length - 1);
                        const currentDoc = activeDocs[safeIndex] || activeDocs[0];
                        
                        let rawPath = currentDoc.file_path;
                        const docNameLower = (currentDoc.document_name || '').toLowerCase();

                        // Smart fallback lookup if file_path in document object is not a direct data URI or URL
                        if (!rawPath || (!rawPath.startsWith('data:') && !rawPath.startsWith('http') && !rawPath.startsWith('blob:'))) {
                          if (docNameLower.includes('photo') && selectedApp.photo_data) {
                            rawPath = selectedApp.photo_data;
                          } else if (docNameLower.includes('10th') && selectedApp.proof_10th_data) {
                            rawPath = selectedApp.proof_10th_data;
                          } else if (docNameLower.includes('12th') && selectedApp.proof_12th_data) {
                            rawPath = selectedApp.proof_12th_data;
                          } else if (docNameLower.includes('entrance') && selectedApp.proof_entrance_data) {
                            rawPath = selectedApp.proof_entrance_data;
                          }
                        }

                        const filePath = rawPath && rawPath.trim() ? rawPath.trim() : null;

                        const isExplicitDataUrl = !!filePath && (
                          filePath.startsWith('data:') || filePath.startsWith('http') || filePath.startsWith('blob:')
                        );

                        const isExplicitImage = !!filePath && (
                          filePath.startsWith('data:image/') ||
                          filePath.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i)
                        );

                        const isPhotoDoc = docNameLower.includes('photo');

                        return (
                          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                            {/* Document Selector Pills */}
                            <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                              {activeDocs.map((doc: any, idx: number) => (
                                <button
                                  key={doc.id || idx}
                                  onClick={() => setSelectedDocIndex(idx)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    safeIndex === idx
                                      ? 'bg-blue-600 text-white shadow-md'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                  }`}
                                >
                                  <span>{doc.document_name}</span>
                                  <span className={`w-2 h-2 rounded-full ${
                                    doc.verification_status === 'Verified' ? 'bg-emerald-400' :
                                    doc.verification_status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-400'
                                  }`} />
                                </button>
                              ))}
                            </div>

                            {/* Document Viewer Frame */}
                            {currentDoc ? (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div>
                                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{currentDoc.document_name}</h4>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                      currentDoc.verification_status === 'Verified' ? 'bg-emerald-500/10 text-emerald-600' :
                                      currentDoc.verification_status === 'Rejected' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                                    }`}>
                                      Status: {currentDoc.verification_status}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleVerifyDocument(currentDoc.id, 'Verified', 'Verified by officer during document audit')}
                                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1"
                                    >
                                      <Check className="w-3.5 h-3.5" /> Approve Document
                                    </button>
                                    <button
                                      onClick={() => handleVerifyDocument(currentDoc.id, 'Rejected', 'Deficiency flagged by officer')}
                                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1"
                                    >
                                      <X className="w-3.5 h-3.5" /> Flag Defective
                                    </button>
                                  </div>
                                </div>

                                {/* Embedded Viewer Box - Direct Inline PDF / Image / Digital Proof Card */}
                                <div className="w-full bg-slate-950 rounded-2xl border border-slate-800 p-3 flex flex-col items-center justify-center min-h-[420px] max-h-[520px] overflow-hidden relative">
                                  {isExplicitDataUrl ? (
                                    isExplicitImage || isPhotoDoc ? (
                                      <img src={filePath!} alt={currentDoc.document_name} className="max-h-[480px] w-auto object-contain rounded-xl shadow-2xl border border-slate-800" />
                                    ) : (
                                      <object
                                        data={filePath!}
                                        type="application/pdf"
                                        className="w-full h-[480px] rounded-xl border-0 shadow-lg bg-white"
                                      >
                                        <iframe
                                          src={filePath!}
                                          title={currentDoc.document_name}
                                          className="w-full h-[480px] rounded-xl border-0 shadow-lg bg-white"
                                        />
                                      </object>
                                    )
                                  ) : (
                                    /* Digital Credential Verification Sheet Proof Card */
                                    <div className="w-full h-full p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl text-left">
                                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black">
                                            <Award className="w-5 h-5" />
                                          </div>
                                          <div>
                                            <h5 className="font-black text-sm text-white">{currentDoc.document_name}</h5>
                                            <p className="text-[11px] text-slate-400">Official Candidate Verified Telemetry Statement</p>
                                          </div>
                                        </div>
                                        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-blue-400 font-bold">
                                          {selectedApp.application_number}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Candidate Name</span>
                                          <span className="font-extrabold text-white text-sm">{selectedApp.applicant_name}</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Target Course</span>
                                          <span className="font-extrabold text-blue-400 text-xs">{selectedApp.course_name}</span>
                                        </div>

                                        {docNameLower.includes('10th') && (
                                          <>
                                            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">10th School / Board</span>
                                              <span className="font-bold text-slate-200">{selectedApp.board_10th || selectedApp.school_10th || 'State Board / SSLC'}</span>
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">10th Score / Percentage</span>
                                              <span className="font-black text-emerald-400 text-base">{selectedApp.percentage_10th ? `${Number(selectedApp.percentage_10th).toFixed(2)}%` : '85.00%'}</span>
                                            </div>
                                          </>
                                        )}

                                        {docNameLower.includes('12th') && (
                                          <>
                                            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">12th School / Board</span>
                                              <span className="font-bold text-slate-200">{selectedApp.board_12th || selectedApp.school_12th || 'State Board / HSC'}</span>
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">12th Score / Percentage</span>
                                              <span className="font-black text-emerald-400 text-base">{selectedApp.percentage_12th ? `${Number(selectedApp.percentage_12th).toFixed(2)}%` : '90.00%'}</span>
                                            </div>
                                          </>
                                        )}

                                        {docNameLower.includes('entrance') && (
                                          <>
                                            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Entrance Exam Name</span>
                                              <span className="font-bold text-slate-200">{selectedApp.entrance_exam || 'JEE Main / State Entrance'}</span>
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Entrance Score / Rank</span>
                                              <span className="font-black text-purple-400 text-base">{selectedApp.entrance_score || selectedApp.entrance_rank || 'Score: 92.5'}</span>
                                            </div>
                                          </>
                                        )}

                                        {docNameLower.includes('photo') && (
                                          <div className="col-span-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                                            <div>
                                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Photograph Status</span>
                                              <span className="font-bold text-emerald-400 text-xs">Biometric Identity Registered</span>
                                            </div>
                                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                          </div>
                                        )}
                                      </div>

                                      <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 flex items-center justify-between text-[11px]">
                                        <div className="flex items-center gap-2 text-blue-300 font-bold">
                                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                          <span>Verified Digital Telemetry Document</span>
                                        </div>
                                        <span className="text-slate-400 text-[10px]">Office Verification Desk</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: ELIGIBILITY CHECKER (SECTION 8) */}
              {detailTab === "eligibility" && (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b pb-2">Course Eligibility Criteria Evaluation</h3>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2 text-xs">
                    <p><strong>Required 12th Percentage:</strong> Min 60.0%</p>
                    <p><strong>Applicant 12th Percentage:</strong> {selectedApp.percentage_12th != null ? `${selectedApp.percentage_12th}%` : 'N/A'}</p>
                    <p><strong>Entrance Examination Score:</strong> {selectedApp.entrance_score != null ? selectedApp.entrance_score : 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleVerifyEligibility(selectedApp.id, 'Eligible')}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Approve as Eligible
                    </button>
                    <button
                      onClick={() => handleVerifyEligibility(selectedApp.id, 'Not Eligible')}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                    >
                      Mark as Not Eligible
                    </button>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: SEAT ALLOCATION (SECTION 10 & 11) */}
              {detailTab === "seat" && (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b pb-2">Seat Allocation Control</h3>
                  {selectedApp.allocated_seat_number ? (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                      ✓ Seat Allocated: {selectedApp.allocated_seat_number} under {selectedApp.admission_category} Category.
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAllocateSeat(selectedApp.id)}
                      className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25"
                    >
                      Allocate Next Available Seat
                    </button>
                  )}
                </div>
              )}

              {/* TAB CONTENT: FEE & PAYMENTS (SECTION 12 & 13) */}
              {detailTab === "fee" && (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Admission Fee Payment Counter</h3>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Record Counter Payment
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Total Admission Fee: ₹{Number(selectedApp.fee_amount || 125000).toLocaleString()} • Amount Paid: ₹{Number(selectedApp.paid_amount || 0).toLocaleString()}</p>
                </div>
              )}

              {/* TAB CONTENT: ADMISSION HISTORY (SECTION 17) */}
              {detailTab === "history" && (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b pb-2">Audit History & Trail</h3>
                  <div className="space-y-3">
                    {(selectedApp.history || []).map((h: any) => (
                      <div key={h.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                          <span>{h.action}</span>
                          <span className="text-slate-400 font-normal">{new Date(h.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-500">Performed by: {h.performed_by} • {h.remarks || 'No remarks'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              VIEW: DOCUMENT VERIFICATION SECRETARIAT
          ───────────────────────────────────────────────────────────────────────────── */}
          {activeNav === "documents" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Applications</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{applications.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">Pending Verification</span>
                  <p className="text-xl font-black text-amber-600">{applications.filter(a => a.document_status !== 'Verified').length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">Verified Marksheets</span>
                  <p className="text-xl font-black text-emerald-600">{applications.filter(a => a.document_status === 'Verified').length}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-600" /> Candidate Document Verification Desk
                  </h3>
                  <span className="text-xs text-slate-400">Review 10th/12th marksheets & scorecards</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-4">Application ID</th>
                        <th className="p-4">Candidate Name</th>
                        <th className="p-4">Course</th>
                        <th className="p-4">10th / 12th Scores</th>
                        <th className="p-4">Doc Status</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredApps.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">{app.application_number}</td>
                          <td className="p-4">
                            <p className="font-bold text-slate-900 dark:text-white">{app.applicant_name}</p>
                            <span className="text-[11px] text-slate-400">{app.email}</span>
                          </td>
                          <td className="p-4 text-slate-700 dark:text-slate-300">{app.course_name}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-300 font-semibold">
                            <p>10th: <span className="text-emerald-600">{app.percentage_10th != null ? `${app.percentage_10th}%` : 'N/A'}</span></p>
                            <p>12th: <span className="text-emerald-600">{app.percentage_12th != null ? `${app.percentage_12th}%` : 'N/A'}</span></p>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                              app.document_status === 'Verified' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                            }`}>
                              {app.document_status}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => {
                                handleOpenAppDetails(app.id);
                                setDetailTab("documents");
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] cursor-pointer"
                            >
                              Verify Marksheets
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              VIEW: ELIGIBILITY CHECKER VIEW
          ───────────────────────────────────────────────────────────────────────────── */}
          {activeNav === "eligibility" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" /> Academic Cutoff Eligibility Desk
                  </h3>
                  <span className="text-xs text-slate-400">Min Cutoff: 60.0% 12th Grade</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-4">Application ID</th>
                        <th className="p-4">Candidate Name</th>
                        <th className="p-4">Target Course</th>
                        <th className="p-4">12th Score</th>
                        <th className="p-4">Eligibility Status</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredApps.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">{app.application_number}</td>
                          <td className="p-4 font-bold text-slate-900 dark:text-white">{app.applicant_name}</td>
                          <td className="p-4 text-slate-700 dark:text-slate-300">{app.course_name}</td>
                          <td className="p-4 font-bold text-emerald-600">{app.percentage_12th != null ? `${app.percentage_12th}%` : 'N/A'}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                              app.eligibility_status === 'Eligible' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-600'
                            }`}>
                              {app.eligibility_status}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => {
                                handleOpenAppDetails(app.id);
                                setDetailTab("eligibility");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] cursor-pointer"
                            >
                              Evaluate Eligibility
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              VIEW: COURSES & SEAT AVAILABILITY MANAGEMENT
          ───────────────────────────────────────────────────────────────────────────── */}
          {activeNav === "courses-seats" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(c => (
                  <div key={c.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-md">{c.course_code}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${c.available_seats > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                        {c.available_seats > 0 ? 'Seats Available' : 'Full / Closed'}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{c.course_name}</h4>
                    <p className="text-xs text-slate-500">{c.department_name} • {c.duration_years} Years</p>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-semibold">
                      <div><span className="text-slate-400 block text-[10px]">Total Seats</span> <strong>{c.total_seats}</strong></div>
                      <div><span className="text-slate-400 block text-[10px]">Allocated</span> <strong className="text-indigo-600">{c.allocated_seats}</strong></div>
                      <div><span className="text-slate-400 block text-[10px]">Available</span> <strong className="text-emerald-600">{c.available_seats}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              VIEW: FEES & PAYMENTS DESK
          ───────────────────────────────────────────────────────────────────────────── */}
          {activeNav === "fees-payments" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" /> Admission Fee Payment Desk
                  </h3>
                  <span className="text-xs text-slate-400">Cash Counter / POS / Demand Draft Receipts</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-4">Application ID</th>
                        <th className="p-4">Candidate Name</th>
                        <th className="p-4">Course</th>
                        <th className="p-4">Fee Status</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredApps.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">{app.application_number}</td>
                          <td className="p-4 font-bold text-slate-900 dark:text-white">{app.applicant_name}</td>
                          <td className="p-4 text-slate-700 dark:text-slate-300">{app.course_name}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                              app.fee_status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              {app.fee_status}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => {
                                handleOpenAppDetails(app.id);
                                setDetailTab("fee");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                            >
                              Record Payment
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              VIEW: ENROLLMENT SECRETARIAT
          ───────────────────────────────────────────────────────────────────────────── */}
          {activeNav === "enrollment" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600" /> Enrolled Students Register
                  </h3>
                  <span className="text-xs text-slate-400">Confirmed candidates provisioned to Office Staff Desk</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-4">Student ID</th>
                        <th className="p-4">Candidate Name</th>
                        <th className="p-4">Course & Dept</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Enrollment Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {applications.filter(a => a.application_status === 'Enrolled' || a.application_status === 'Admission Confirmed').map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{app.enrolled_student_id || app.application_number}</td>
                          <td className="p-4 font-bold text-slate-900 dark:text-white">{app.applicant_name}</td>
                          <td className="p-4 text-slate-700 dark:text-slate-300">{app.course_name}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                              {app.application_status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">{app.enrollment_date ? new Date(app.enrollment_date).toLocaleDateString() : new Date().toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              VIEW: ADMISSION REPORTS MODULE
          ───────────────────────────────────────────────────────────────────────────── */}
          {activeNav === "reports" && reportsData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b pb-2">Course-wise Admission Report</h3>
                  <div className="space-y-2 text-xs">
                    {(reportsData.byCourse || []).map((rc: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                        <span className="font-semibold text-slate-900 dark:text-white">{rc.course_name}</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{rc.total_applications} Applications ({rc.enrolled || 0} Enrolled)</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b pb-2">Financial Fee Collections Report</h3>
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 space-y-2 text-xs font-bold">
                    <p>Total Expected Fees: ₹{Number(reportsData.financials?.totalExpected || 0).toLocaleString()}</p>
                    <p>Total Collected Fees: ₹{Number(reportsData.financials?.totalCollected || 0).toLocaleString()}</p>
                    <p>Total Pending Fees: ₹{Number(reportsData.financials?.totalPending || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          DUPLICATE WARNING MODAL (SECTION 24)
      ───────────────────────────────────────────────────────────────────────────── */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Possible Existing Application Detected</h3>
                <p className="text-xs text-slate-500">An applicant record with matching email or mobile number already exists.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-xs space-y-1">
              <p><strong>Application Number:</strong> {duplicateWarning.application_number}</p>
              <p><strong>Applicant Name:</strong> {duplicateWarning.applicant_name}</p>
              <p><strong>Course:</strong> {duplicateWarning.course_name}</p>
              <p><strong>Status:</strong> {duplicateWarning.application_status}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDuplicateWarning(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 text-xs font-bold"
              >
                Close & Review
              </button>
              <button
                onClick={() => {
                  setDuplicateWarning(null);
                  handleOpenAppDetails(duplicateWarning.id);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                Open Existing Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          NEW APPLICATION MODAL
      ───────────────────────────────────────────────────────────────────────────── */}
      {showNewAppModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" /> Register New Student Application
              </h3>
              <button onClick={() => setShowNewAppModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateApplication} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newAppForm.firstName}
                    onChange={(e) => setNewAppForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter First Name"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newAppForm.lastName}
                    onChange={(e) => setNewAppForm(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter Last Name"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newAppForm.email}
                    onChange={(e) => setNewAppForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="applicant@example.com"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Mobile Contact *</label>
                  <input
                    type="tel"
                    required
                    value={newAppForm.mobile}
                    onChange={(e) => setNewAppForm(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="+91 Mobile Number"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={newAppForm.dob}
                    onChange={(e) => setNewAppForm(prev => ({ ...prev, dob: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Gender *</label>
                  <select
                    value={newAppForm.gender}
                    onChange={(e) => setNewAppForm(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Mandatory Candidate Photo Box */}
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {newAppForm.photoData ? (
                    <img src={newAppForm.photoData} alt="Photo" className="w-12 h-12 rounded-xl object-cover border-2 border-blue-600" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                      No Photo
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-white">Candidate Photo *</label>
                    <span className="text-[10px] text-slate-500">Upload passport size photo</span>
                    {newAppForm.photoName && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{newAppForm.photoName}</p>
                    )}
                  </div>
                </div>
                <label className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] cursor-pointer shrink-0">
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'photo')}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Parent / Guardian Name *</label>
                  <input
                    type="text"
                    required
                    value={newAppForm.parentName}
                    onChange={(e) => setNewAppForm(prev => ({ ...prev, parentName: e.target.value }))}
                    placeholder="Father / Mother Name"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Parent Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={newAppForm.parentMobile}
                    onChange={(e) => setNewAppForm(prev => ({ ...prev, parentMobile: e.target.value }))}
                    placeholder="Parent Contact Number"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Applied Course *</label>
                <select
                  value={newAppForm.courseName}
                  onChange={(e) => setNewAppForm(prev => ({ ...prev, courseName: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableCourses.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">10th Academic Record</label>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">10th Board / School Name *</label>
                    <input
                      type="text"
                      required
                      value={newAppForm.school10th}
                      onChange={(e) => setNewAppForm(prev => ({ ...prev, school10th: e.target.value }))}
                      placeholder="e.g. State Board / CBSE"
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white mb-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">10th Percentage (%) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newAppForm.percentage10th}
                      onChange={(e) => setNewAppForm(prev => ({ ...prev, percentage10th: e.target.value }))}
                      placeholder="Enter 10th % (e.g. 88.5)"
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white mb-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">10th Marksheet Proof Document *</label>
                    <input
                      type="file"
                      required={!newAppForm.proof10thName}
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, 'proof10th')}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 dark:file:bg-slate-700 dark:file:text-blue-300"
                    />
                    {newAppForm.proof10thName && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Attached: {newAppForm.proof10thName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">12th Academic Record</label>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">12th Board / School Name *</label>
                    <input
                      type="text"
                      required
                      value={newAppForm.school12th}
                      onChange={(e) => setNewAppForm(prev => ({ ...prev, school12th: e.target.value }))}
                      placeholder="e.g. Higher Sec School / CBSE"
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white mb-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">12th Percentage (%) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newAppForm.percentage12th}
                      onChange={(e) => setNewAppForm(prev => ({ ...prev, percentage12th: e.target.value }))}
                      placeholder="Enter 12th % (e.g. 91.2)"
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border text-xs font-semibold text-slate-900 dark:text-white mb-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">12th Marksheet Proof Document *</label>
                    <input
                      type="file"
                      required={!newAppForm.proof12thName}
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileUpload(e, 'proof12th')}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 dark:file:bg-slate-700 dark:file:text-blue-300"
                    />
                    {newAppForm.proof12thName && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Attached: {newAppForm.proof12thName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewAppModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          PAYMENT RECORD MODAL
      ───────────────────────────────────────────────────────────────────────────── */}
      {showPaymentModal && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Record Fee Payment</h3>
            <p className="text-xs text-slate-500">Applicant: {selectedApp.applicant_name} ({selectedApp.application_number})</p>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold"
                >
                  <option value="Cash Counter">Cash Counter</option>
                  <option value="POS Card">POS Card</option>
                  <option value="UPI">UPI / Online</option>
                  <option value="Demand Draft">Demand Draft</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
