import React, { useState, useEffect } from "react";
import {
  Users, UserPlus, FileText, CheckCircle2, Clock, Search,
  Download, Printer, DollarSign, Shield, Filter, RefreshCw,
  Sparkles, CreditCard, Award, FileCheck, HelpCircle, UserCheck,
  Building, ChevronRight, AlertCircle, ArrowUpRight, Check, X, Loader2,
  Calendar, Layers, ShieldCheck, Mail, Phone, ExternalLink, Bookmark
} from "lucide-react";
import client from "../../api/client";

interface OfficeStaffDashboardProps {
  onNav?: (module: string) => void;
  theme?: string;
  toggleTheme?: () => void;
}

export function OfficeStaffDashboard({ onNav }: OfficeStaffDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"registry" | "certificates" | "fees" | "queue">("registry");
  
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

  const handleProcessFee = () => {
    if (!selectedStudent) {
      triggerToast("⚠️ Please select a student record first.");
      return;
    }
    const amountNum = Number(feeAmount) || 0;
    triggerToast(`💳 Counter payment of ₹${amountNum.toLocaleString()} (${feeCategory}) recorded for ${selectedStudent.name || selectedStudent.first_name}!`);
    setShowFeeModal(false);
    setStats(prev => ({ ...prev, counterFeesCollected: prev.counterFeesCollected + amountNum }));
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
    <div className="w-full space-y-6 text-slate-800 dark:text-slate-100 pb-10">
      {/* Toast Floating Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-indigo-600 dark:bg-indigo-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-400 animate-bounce">
          <Sparkles className="w-5 h-5 text-yellow-300 shrink-0" />
          <span className="font-semibold text-sm">{toastMsg}</span>
        </div>
      )}

      {/* HERO BANNER - INSTITUTIONAL DESK CONTROL */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" /> Institutional Operations & Desk Secretariat
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Counter Operations Live
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Office Staff Executive Control
            </h1>
            <p className="text-blue-100/80 text-sm max-w-2xl leading-relaxed">
              Manage student admissions, document verifications, certificate generation (Bonafide/TC/Conduct), counter fee receipts, and desk help inquiries.
            </p>
          </div>

          {/* Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 transition transform active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> New Admission Registration
            </button>
            <button
              onClick={() => {
                if (!selectedStudent && students.length > 0) setSelectedStudent(students[0]);
                setShowCertModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs flex items-center gap-2 backdrop-blur-md transition cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-cyan-300" /> Issue Certificate
            </button>
            <button
              onClick={() => {
                if (!selectedStudent && students.length > 0) setSelectedStudent(students[0]);
                setShowFeeModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs flex items-center gap-2 backdrop-blur-md transition cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-emerald-300" /> Counter Fee Entry
            </button>
          </div>
        </div>
      </div>

      {/* TOP 4 EXECUTIVE STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-blue-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Today's Admissions</span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <UserPlus className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.todayAdmissions}</p>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12%
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Registered student entries today</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-indigo-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pending Certificates</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.pendingCertificates}</p>
            <span className="text-xs font-medium text-amber-500 dark:text-amber-400">Action Required</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Bonafide / TC / Conduct requests</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Counter Fees Collected</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 dark:text-white">₹{stats.counterFeesCollected.toLocaleString()}</p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Today's cash & counter receipts</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-purple-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Help Desk Inquiries</span>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.openInquiries}</p>
            <span className="text-xs font-medium text-slate-400">Open Tickets</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Student desk queries pending</span>
        </div>
      </div>

      {/* OPERATIONS MODULE NAVIGATION TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: "registry", label: "Student Registry & Lookup", icon: <Users className="w-4 h-4" /> },
            { id: "certificates", label: "Certificate Issuance", icon: <FileCheck className="w-4 h-4" /> },
            { id: "fees", label: "Counter Fee Processor", icon: <CreditCard className="w-4 h-4" /> },
            { id: "queue", label: "Requests Queue", badge: documentRequests.filter(r => r.status === "Pending").length, icon: <Clock className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStudents}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Refresh Registry Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* TAB CONTENT: TAB 1 - STUDENT REGISTRY */}
      {activeTab === "registry" && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS BAR */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Admission No, Student Name, Roll No..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold shrink-0">Department:</span>
              </div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="All">All Departments</option>
                <option value="Computer Science">Computer Science & Eng (CSE)</option>
                <option value="Electronics">Electronics & Comm (ECE)</option>
                <option value="Mechanical">Mechanical Eng (ME)</option>
                <option value="Civil">Civil Eng (CE)</option>
                <option value="Information Technology">Information Tech (IT)</option>
              </select>
            </div>
          </div>

          {/* STUDENT REGISTRY TABLE */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Student Profile</th>
                    <th className="p-4">Admission / Roll No</th>
                    <th className="p-4">Department & Academic</th>
                    <th className="p-4">Contact Telemetry</th>
                    <th className="p-4">Desk Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                          <span>Loading student registry records from database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-500" />
                        <p className="font-semibold text-sm">No matching student admission records found.</p>
                        <p className="text-xs text-slate-500 mt-1">Try refining your search keyword or add a new student entry.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => {
                      const studentName = s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student';
                      const admNo = s.admission_number || s.roll_number || s.student_id || `ADM-2026-${s.id || idx+1}`;
                      const dept = s.department_name || s.department || 'Computer Science & Eng';

                      return (
                        <tr
                          key={s.id || idx}
                          onClick={() => setSelectedStudent(s)}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer ${
                            selectedStudent?.id === s.id ? 'bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-l-blue-600' : ''
                          }`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow">
                                {studentName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white text-sm">{studentName}</p>
                                <span className="text-[11px] text-slate-400 block font-mono">ID: #{s.id || idx + 1}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                            {admNo}
                          </td>

                          <td className="p-4 space-y-1">
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] inline-block">
                              {dept}
                            </span>
                            <p className="text-[11px] text-slate-400">Batch 2024-2028 • Semester 3</p>
                          </td>

                          <td className="p-4 text-slate-600 dark:text-slate-300 space-y-1">
                            <p className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {s.email || 'N/A'}
                            </p>
                            <p className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {s.phone || s.mobile || '+91 98765 01234'}
                            </p>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setSelectedStudent(s);
                                  setShowCertModal(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                              >
                                <FileCheck className="w-3.5 h-3.5" /> Issue Cert
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStudent(s);
                                  setShowFeeModal(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5" /> Fee Entry
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CERTIFICATE ISSUANCE DESK */}
      {activeTab === "certificates" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Certificate Release Console */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-500" /> Certificate Release Secretariat
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Generate official verified institutional certificates with digital seal and QR validation</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  1. Target Student Record
                </label>
                {selectedStudent ? (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-blue-900 dark:text-blue-200">{selectedStudent.name || selectedStudent.first_name || 'Student'}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                        {selectedStudent.admission_number || selectedStudent.roll_number || 'CS2026001'} • {selectedStudent.department_name || 'CSE'}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("registry")}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      Change Student
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveTab("registry")}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center text-xs font-semibold text-slate-500 hover:border-blue-500 transition"
                  >
                    Click to select a student from the registry table
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  2. Select Certificate Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { type: "Bonafide Certificate", desc: "For passport, bank loan, bus pass, or official verification" },
                    { type: "Transfer Certificate (TC)", desc: "Relieving document upon graduation or course migration" },
                    { type: "Conduct Certificate", desc: "Character and discipline verification record" },
                    { type: "Study Certificate", desc: "Course enrollment and attendance proof" }
                  ].map((c) => (
                    <div
                      key={c.type}
                      onClick={() => setCertType(c.type as any)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        certType === c.type
                          ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <p className="font-bold text-xs">{c.type}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{c.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  3. Purpose / Remarks
                </label>
                <input
                  type="text"
                  value={certPurpose}
                  onChange={(e) => setCertPurpose(e.target.value)}
                  placeholder="e.g. Higher Studies / Education Loan / Employment"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={handleIssueCertificate}
                  disabled={!selectedStudent}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer transition"
                >
                  <Printer className="w-4 h-4" /> Issue & Print Certificate
                </button>
              </div>
            </div>
          </div>

          {/* Certificate Release Preview Card */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <h4 className="font-bold text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Official Seal Preview
            </h4>

            <div className="p-5 rounded-xl bg-white text-slate-900 space-y-3 font-serif shadow-2xl border border-amber-300 relative">
              <div className="text-center border-b pb-2">
                <h5 className="font-bold text-sm tracking-tight uppercase text-blue-900">EduERP Technical University</h5>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-sans font-semibold">Office of the Registrar & Controller of Examinations</p>
              </div>
              <div className="text-center py-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 border-b border-amber-400 pb-0.5">
                  {certType}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-700 font-sans">
                This is to certify that <strong className="text-slate-900">{selectedStudent ? (selectedStudent.name || selectedStudent.first_name) : 'Student Name'}</strong> (Admission No: <span className="font-mono">{selectedStudent?.admission_number || 'CS2026001'}</span>) is a bona fide student of this Institution.
              </p>
              <div className="pt-4 flex items-center justify-between text-[10px] text-slate-500 font-sans border-t">
                <div>
                  <p className="font-bold">Date: {new Date().toLocaleDateString()}</p>
                  <p className="text-[9px]">QR Code: VERIFIED-OFFICE-2026</p>
                </div>
                <div className="text-right">
                  <span className="font-bold block text-blue-900">Registrar Seal</span>
                  <span className="text-[9px] text-emerald-700 font-mono">Digitally Signed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COUNTER FEE PROCESSOR */}
      {activeTab === "fees" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-500" /> Counter Fee Processing Desk
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Record cash, UPI, or card fee collections and issue immediate receipts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Select Student
                </label>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                  {selectedStudent ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedStudent.name || selectedStudent.first_name}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">{selectedStudent.admission_number || 'CS2026001'}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                        Active Student
                      </span>
                    </div>
                  ) : (
                    <p className="text-slate-400">No student selected. Select from registry tab first.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Fee Category
                </label>
                <select
                  value={feeCategory}
                  onChange={(e) => setFeeCategory(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="Tuition Fee">Tuition Fee</option>
                  <option value="Hostel & Mess Charge">Hostel & Mess Charge</option>
                  <option value="Examination Fee">Examination Fee</option>
                  <option value="Transport Counter Payment">Transport Counter Payment</option>
                  <option value="Certificate / Fine Fee">Certificate / Fine Fee</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Cash Counter", "POS Card", "UPI / Online"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setFeePaymentMode(mode)}
                      className={`p-3 rounded-xl border text-xs font-bold transition ${
                        feePaymentMode === mode
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Remarks / Receipt Note
                </label>
                <textarea
                  rows={3}
                  value={feeRemarks}
                  onChange={(e) => setFeeRemarks(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <button
                onClick={handleProcessFee}
                disabled={!selectedStudent}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <CreditCard className="w-4 h-4" /> Record Counter Receipt Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REQUESTS QUEUE */}
      {activeTab === "queue" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" /> Student Document Request Queue
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Incoming requests for certificates and duplicate credentials</p>
            </div>
          </div>

          <div className="space-y-3">
            {documentRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{req.studentName}</p>
                      <span className="font-mono text-xs text-blue-600 dark:text-blue-400">({req.rollNo})</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{req.type} • Requested {req.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {req.status === "Approved" ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApproveDoc(req.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve & Release
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADMISSION REGISTRATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" /> New Student Admission Registration
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudentSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.firstName}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="e.g. Ramesh"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newStudent.lastName}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="e.g. Rao"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Institutional Email *</label>
                <input
                  type="email"
                  required
                  value={newStudent.email}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. ramesh.rao@techuniv.edu.in"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Admission Number *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.admissionNumber}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, admissionNumber: e.target.value }))}
                    placeholder="e.g. CS2026101"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-blue-600 dark:text-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Mobile Contact</label>
                  <input
                    type="tel"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Department</label>
                <select
                  value={newStudent.department}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Save Admission Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
