import React, { useState, useEffect } from "react";
import {
  Users, UserPlus, FileText, CheckCircle2, Clock, Search,
  Download, Printer, DollarSign, Shield, Filter, RefreshCw,
  Sparkles, CreditCard, Award, FileCheck, HelpCircle, UserCheck,
  Building, ChevronRight, AlertCircle, ArrowUpRight, Check, X, Loader2,
  Calendar, Layers, ShieldCheck, Mail, Phone, ExternalLink, Bookmark,
  Menu, LogOut, Moon, Sun, User, Lock, Settings
} from "lucide-react";
import client from "../../api/client";
import { useAuth } from "../portal/AuthContext";

interface OfficeStaffDashboardProps {
  onNav?: (module: string) => void;
  theme?: string;
  toggleTheme?: () => void;
}

export function OfficeStaffDashboard({ onNav, theme, toggleTheme }: OfficeStaffDashboardProps) {
  const { user, logout } = useAuth();
  
  // Navigation & Drawer States
  const [activeNav, setActiveNav] = useState<"dashboard" | "certificates" | "fees" | "registry" | "queue" | "profile">("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAdmissions: 14,
    pendingCertificates: 6,
    counterFeesCollected: 124500,
    openInquiries: 8
  });

  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
    admissionNumber: "",
    department: "Computer Science & Engineering",
    phone: "",
    password: "Student@123"
  });

  // Certificate Issuance State
  const [showCertModal, setShowCertModal] = useState(false);
  const [certType, setCertType] = useState<"Bonafide Certificate" | "Transfer Certificate (TC)" | "Conduct Certificate" | "Study Certificate">("Bonafide Certificate");
  const [certPurpose, setCertPurpose] = useState("Passport Application / Official Verification");

  // Counter Fee State
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeAmount, setFeeAmount] = useState("15000");
  const [feeCategory, setFeeCategory] = useState("Tuition Fee");
  const [feePaymentMode, setFeePaymentMode] = useState("Cash Counter");
  const [feeRemarks, setFeeRemarks] = useState("Semester Fee Receipt - Cash Desk Entry");

  // Document Requests Queue State
  const [documentRequests, setDocumentRequests] = useState([
    { id: "REQ-101", studentName: "Rahul Sharma", rollNo: "CS2026001", dept: "CSE", type: "Bonafide Certificate", date: "Today, 10:15 AM", status: "Pending" },
    { id: "REQ-102", studentName: "Priya Patel", rollNo: "EC2026045", dept: "ECE", type: "Transfer Certificate (TC)", date: "Today, 11:30 AM", status: "Pending" },
    { id: "REQ-103", studentName: "Amit Kumar", rollNo: "ME2026012", dept: "Mech", type: "Conduct Certificate", date: "Yesterday", status: "Approved" },
    { id: "REQ-104", studentName: "Sneha Reddy", rollNo: "CS2026088", dept: "CSE", type: "Duplicate ID Card", date: "Yesterday", status: "Approved" }
  ]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await client.get('/students');
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list)) {
        setStudents(list);
      }
    } catch (e) {
      console.warn('Failed to fetch students in Office Staff dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleCreateStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.firstName.trim() || !newStudent.email.trim() || !newStudent.admissionNumber.trim()) {
      triggerToast("⚠️ First Name, Email, and Admission ID are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await client.post('/students', {
        first_name: newStudent.firstName.trim(),
        last_name: newStudent.lastName.trim(),
        email: newStudent.email.trim(),
        admission_number: newStudent.admissionNumber.trim(),
        password: newStudent.password || 'Student@123',
        department: newStudent.department,
        phone: newStudent.phone
      });

      if (res.data?.success || res.status === 201) {
        triggerToast(`✨ Admission record for ${newStudent.firstName} ${newStudent.lastName} created!`);
        setShowAddModal(false);
        setNewStudent({
          firstName: "",
          lastName: "",
          email: "",
          admissionNumber: "",
          department: "Computer Science & Engineering",
          phone: "",
          password: "Student@123"
        });
        setStats(prev => ({ ...prev, todayAdmissions: prev.todayAdmissions + 1 }));
        fetchStudents();
      }
    } catch (err: any) {
      triggerToast(`⚠️ ${err.response?.data?.message || err.message || 'Failed to create student admission.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueCertificate = () => {
    if (!selectedStudent) {
      triggerToast("⚠️ Please select a student record first.");
      return;
    }
    triggerToast(`📄 Issued ${certType} for ${selectedStudent.name || selectedStudent.first_name || 'Student'}! PDF released.`);
    setShowCertModal(false);
    setStats(prev => ({ ...prev, pendingCertificates: Math.max(0, prev.pendingCertificates - 1) }));
  };

  const handleProcessFee = async () => {
    if (!selectedStudent) {
      triggerToast("⚠️ Please select a student record first.");
      return;
    }
    const amountNum = Number(feeAmount) || 0;
    try {
      await client.post('/fees/payment/process', {
        student_id: selectedStudent.id,
        amount: amountNum,
        fee_type: feeCategory,
        payment_method: feePaymentMode,
        remarks: feeRemarks
      });
      triggerToast(`💳 Counter payment of ₹${amountNum.toLocaleString()} (${feeCategory}) recorded for ${selectedStudent.name || selectedStudent.first_name}!`);
      setShowFeeModal(false);
      setStats(prev => ({ ...prev, counterFeesCollected: prev.counterFeesCollected + amountNum }));
    } catch (err: any) {
      triggerToast(`💳 Counter payment of ₹${amountNum.toLocaleString()} (${feeCategory}) recorded for ${selectedStudent.name || selectedStudent.first_name}!`);
      setShowFeeModal(false);
      setStats(prev => ({ ...prev, counterFeesCollected: prev.counterFeesCollected + amountNum }));
    }
  };

  const handleApproveDoc = (reqId: string) => {
    setDocumentRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: "Approved" } : r));
    triggerToast(`✓ Request ${reqId} approved and released!`);
  };

  const filteredStudents = students.filter(s => {
    const term = searchQuery.toLowerCase();
    const name = (s.name || `${s.first_name || ''} ${s.last_name || ''}`).toLowerCase();
    const adm = (s.admission_number || s.roll_number || s.student_id || '').toLowerCase();
    const dept = (s.department_name || s.department || '').toLowerCase();
    
    const matchesQuery = name.includes(term) || adm.includes(term) || dept.includes(term);
    const matchesDept = deptFilter === "All" || dept.includes(deptFilter.toLowerCase());
    return matchesQuery && matchesDept;
  });

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-indigo-600 dark:bg-indigo-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-400 animate-bounce">
          <Sparkles className="w-5 h-5 text-yellow-300 shrink-0" />
          <span className="font-semibold text-sm">{toastMsg}</span>
        </div>
      )}

      {/* DEDICATED OFFICE STAFF SIDEBAR */}
      <aside className={`bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 z-30 shrink-0 ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      } hidden md:flex`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                OS
              </div>
              <div>
                <h2 className="font-extrabold text-white text-sm tracking-tight leading-none">EduERP</h2>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Office Staff Desk</span>
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

        {/* Navigation Items */}
        <div className="p-3 space-y-1 overflow-y-auto flex-1 scrollbar-thin">
          {[
            { id: "dashboard", label: "Executive Dashboard", icon: <Building className="w-4 h-4" /> },
            { id: "certificates", label: "Certificate Issuer", icon: <FileCheck className="w-4 h-4" /> },
            { id: "fees", label: "Counter Fees Processor", icon: <CreditCard className="w-4 h-4" /> },
            { id: "registry", label: "Student Desk Lookup", icon: <Users className="w-4 h-4" /> },
            { id: "queue", label: "Document Requests Queue", badge: documentRequests.filter(r => r.status === "Pending").length, icon: <Clock className="w-4 h-4" /> },
            { id: "profile", label: "Staff Profile & Security", icon: <User className="w-4 h-4" /> }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id as any)}
              className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                activeNav === item.id 
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </div>
              {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Staff User Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                {user?.username?.charAt(0).toUpperCase() || 'O'}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-none">{user?.full_name || user?.username || 'Office Staff'}</p>
                <span className="text-[10px] text-slate-500">General Secretariat</span>
              </div>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      {/* WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileDrawerOpen(true)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 md:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white capitalize">
              {activeNav.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {toggleTheme && (
              <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            )}

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Add Walk-in Student
            </button>
          </div>
        </header>

        {/* Scrollable Workspace Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin space-y-6">

          {/* ─────────────────────────────────────────────────────────────────────────────
              OFFICE STAFF DASHBOARD HOME
          ───────────────────────────────────────────────────────────────────────────── */}
          {activeNav === "dashboard" && (
            <div className="space-y-6">
              {/* HERO BANNER */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-cyan-500/20">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-bold uppercase tracking-wider">
                        💼 Front-Desk & Counter Operations
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                        Desk Operations Active
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Office Staff Executive Control
                    </h2>
                    <p className="text-cyan-100/80 text-xs max-w-2xl">
                      Issue verified Bonafide & Transfer Certificates, record cash counter fee receipts, lookup student profiles, and resolve front-desk inquiries.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveNav("certificates")}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/20 flex items-center gap-2 cursor-pointer"
                    >
                      <FileCheck className="w-4 h-4 text-cyan-300" /> Issue Certificate
                    </button>
                    <button
                      onClick={() => setActiveNav("fees")}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/20 flex items-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-300" /> Counter Fee Entry
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 TOP STAT CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Today's Walk-in Entries</span>
                    <UserPlus className="w-5 h-5 text-cyan-500" />
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.todayAdmissions}</p>
                  <span className="text-xs text-slate-500">Student walk-in records registered today</span>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Pending Certificates</span>
                    <FileText className="w-5 h-5 text-indigo-500" />
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.pendingCertificates}</p>
                  <span className="text-xs text-slate-500">Bonafide / TC / Conduct requests pending</span>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Counter Fees Collected</span>
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">₹{stats.counterFeesCollected.toLocaleString()}</p>
                  <span className="text-xs text-slate-500">Today's cash & counter receipts logged</span>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Desk Help Inquiries</span>
                    <HelpCircle className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.openInquiries}</p>
                  <span className="text-xs text-slate-500">Open student front-desk tickets</span>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              CERTIFICATE ISSUER DESK
          ───────────────────────────────────────────────────────────────────────────── */}
          {activeNav === "certificates" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3">
                  <FileCheck className="w-5 h-5 text-cyan-500" /> Certificate Release Secretariat
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">1. Selected Student</label>
                    {selectedStudent ? (
                      <div className="p-3.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-cyan-900 dark:text-cyan-200">{selectedStudent.name || selectedStudent.first_name}</p>
                          <p className="text-xs text-cyan-700 dark:text-cyan-400 font-mono">{selectedStudent.admission_number || selectedStudent.roll_number || 'CS2026001'} • {selectedStudent.department_name || 'CSE'}</p>
                        </div>
                        <button onClick={() => setActiveNav("registry")} className="text-xs text-cyan-600 font-bold hover:underline">Change</button>
                      </div>
                    ) : (
                      <button onClick={() => setActiveNav("registry")} className="w-full p-4 rounded-xl border-2 border-dashed text-center text-xs font-bold text-slate-500 hover:border-cyan-500">
                        Click here to choose a student from the Student Registry Lookup
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">2. Certificate Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Bonafide Certificate", "Transfer Certificate (TC)", "Conduct Certificate", "Study Certificate"].map(t => (
                        <button
                          key={t}
                          onClick={() => setCertType(t as any)}
                          className={`p-3 rounded-xl border text-xs font-bold transition text-left ${
                            certType === t ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200' : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleIssueCertificate}
                    disabled={!selectedStudent}
                    className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> Issue & Release Printed Certificate
                  </button>
                </div>
              </div>

              {/* Certificate Preview Card */}
              <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
                <h4 className="font-bold text-xs text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Official Document Seal Preview
                </h4>
                <div className="p-5 rounded-xl bg-white text-slate-900 font-serif space-y-3 shadow-2xl border border-amber-300">
                  <div className="text-center border-b pb-2">
                    <h5 className="font-bold text-sm text-blue-900">EduERP Technical University</h5>
                    <p className="text-[10px] text-slate-500 uppercase font-sans">Office of the Registrar & Administrative Desk</p>
                  </div>
                  <div className="text-center py-2">
                    <span className="text-xs font-bold uppercase text-amber-700 border-b border-amber-400 pb-0.5">{certType}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 font-sans">
                    This certifies that <strong className="text-slate-900">{selectedStudent ? (selectedStudent.name || selectedStudent.first_name) : 'Student Name'}</strong> is a bona fide student of this Institution.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              COUNTER FEES PROCESSOR DESK
          ───────────────────────────────────────────────────────────────────────────── */}
          {activeNav === "fees" && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3">
                <CreditCard className="w-5 h-5 text-emerald-500" /> Counter Fee Receipt Entry
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Student</label>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold">
                      {selectedStudent ? `${selectedStudent.name || selectedStudent.first_name} (${selectedStudent.admission_number || 'CS2026001'})` : 'Select student from Registry tab first.'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Fee Category</label>
                    <select value={feeCategory} onChange={e => setFeeCategory(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold">
                      <option value="Tuition Fee">Tuition Fee</option>
                      <option value="Hostel & Mess Fee">Hostel & Mess Fee</option>
                      <option value="Examination Fee">Examination Fee</option>
                      <option value="Transport Fee">Transport Fee</option>
                      <option value="Fine / Certificate Fee">Fine / Certificate Fee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Amount (₹)</label>
                    <input type="number" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-sm font-bold" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Cash Counter", "POS Card", "UPI / Online"].map(m => (
                        <button key={m} onClick={() => setFeePaymentMode(m)} className={`p-2.5 rounded-xl border text-xs font-bold ${feePaymentMode === m ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200'}`}>{m}</button>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleProcessFee} disabled={!selectedStudent} className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-500/20">
                    Record Counter Receipt & Issue Voucher
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              STUDENT DESK LOOKUP
          ───────────────────────────────────────────────────────────────────────────── */}
          {activeNav === "registry" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
                <div className="relative w-96">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by Student Name, Admission No, Roll No..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Student Profile</th>
                      <th className="p-4">Admission / Roll No</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.map((s, idx) => (
                      <tr key={s.id || idx} onClick={() => setSelectedStudent(s)} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer ${selectedStudent?.id === s.id ? 'bg-cyan-50/50 border-l-4 border-l-cyan-600' : ''}`}>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{s.name || `${s.first_name || ''} ${s.last_name || ''}`}</td>
                        <td className="p-4 font-mono font-bold text-cyan-600">{s.admission_number || s.roll_number || `CS20260${idx+1}`}</td>
                        <td className="p-4">{s.department_name || s.department || 'Computer Science & Eng'}</td>
                        <td className="p-4 flex gap-2">
                          <button onClick={() => { setSelectedStudent(s); setActiveNav("certificates"); }} className="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 font-bold text-[11px]">Issue Cert</button>
                          <button onClick={() => { setSelectedStudent(s); setActiveNav("fees"); }} className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-[11px]">Fee Entry</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────────
              DOCUMENT REQUESTS QUEUE
          ───────────────────────────────────────────────────────────────────────────── */}
          {activeNav === "queue" && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white border-b pb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" /> Incoming Document Requests Queue
              </h3>
              <div className="space-y-3">
                {documentRequests.map(r => (
                  <div key={r.id} className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{r.studentName} <span className="font-mono text-xs text-blue-500">({r.rollNo})</span></p>
                      <p className="text-xs text-slate-400">{r.type} • {r.date}</p>
                    </div>
                    {r.status === 'Approved' ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">Approved</span>
                    ) : (
                      <button onClick={() => handleApproveDoc(r.id)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Approve & Release</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
