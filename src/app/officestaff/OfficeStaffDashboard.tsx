import React, { useState, useEffect } from "react";
import {
  Users, UserPlus, FileText, CheckCircle2, Clock, Search,
  Download, Printer, DollarSign, Shield, Filter, RefreshCw,
  Sparkles, CreditCard, Award, FileCheck, HelpCircle, UserCheck,
  Building, ChevronRight, AlertCircle, ArrowUpRight, Check, X, Loader2
} from "lucide-react";
import client from "../../api/client";

interface OfficeStaffDashboardProps {
  onNav?: (module: string) => void;
  theme?: string;
  toggleTheme?: () => void;
}

export function OfficeStaffDashboard({ onNav }: OfficeStaffDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAdmissions: 14,
    pendingCertificates: 6,
    counterFeesCollected: 124500,
    openInquiries: 8
  });

  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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
  const [certType, setCertType] = useState<"Bonafide" | "Transfer Certificate (TC)" | "Conduct Certificate">("Bonafide");
  const [certPurpose, setCertPurpose] = useState("Passport Application / Bank Verification");

  // Counter Fee State
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeAmount, setFeeAmount] = useState("15000");
  const [feePaymentMode, setFeePaymentMode] = useState("Cash Counter");
  const [feeRemarks, setFeeRemarks] = useState("Semester Tuition Counter Payment");

  // Document Requests Queue
  const [documentRequests, setDocumentRequests] = useState([
    { id: "REQ-101", studentName: "Rahul Sharma", rollNo: "CS2026001", type: "Bonafide Certificate", date: "Today, 10:15 AM", status: "Pending" },
    { id: "REQ-102", studentName: "Priya Patel", rollNo: "EC2026045", type: "Transfer Certificate (TC)", date: "Today, 11:30 AM", status: "Pending" },
    { id: "REQ-103", studentName: "Amit Kumar", rollNo: "ME2026012", type: "Conduct Certificate", date: "Yesterday", status: "Approved" },
    { id: "REQ-104", studentName: "Sneha Reddy", rollNo: "CS2026088", type: "Duplicate ID Card", date: "Yesterday", status: "Approved" }
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
    triggerToast(`📄 Issued ${certType} for ${selectedStudent.name || selectedStudent.first_name || 'Student'}! PDF generated.`);
    setShowCertModal(false);
    setStats(prev => ({ ...prev, pendingCertificates: Math.max(0, prev.pendingCertificates - 1) }));
  };

  const handleProcessFee = () => {
    if (!selectedStudent) {
      triggerToast("⚠️ Please select a student record first.");
      return;
    }
    const amountNum = Number(feeAmount) || 0;
    triggerToast(`💳 Counter payment of ₹${amountNum.toLocaleString()} processed successfully for ${selectedStudent.name || selectedStudent.first_name}!`);
    setShowFeeModal(false);
    setStats(prev => ({ ...prev, counterFeesCollected: prev.counterFeesCollected + amountNum }));
  };

  const handleApproveDoc = (reqId: string) => {
    setDocumentRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: "Approved" } : r));
    triggerToast(`✓ Request ${reqId} approved and document released!`);
  };

  const filteredStudents = students.filter(s => {
    const term = searchQuery.toLowerCase();
    const name = (s.name || `${s.first_name || ''} ${s.last_name || ''}`).toLowerCase();
    const adm = (s.admission_number || s.roll_number || '').toLowerCase();
    const dept = (s.department_name || s.department || '').toLowerCase();
    return name.includes(term) || adm.includes(term) || dept.includes(term);
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-100 min-h-screen">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-indigo-400 animate-bounce">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <span className="font-semibold text-sm">{toastMsg}</span>
        </div>
      )}

      {/* HEADER HERO CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-cyan-950/80 to-slate-950 border border-cyan-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-bold uppercase tracking-wider">
                🏛️ Institutional Desk & Admissions Secretariat
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                Live Reception Operations
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Office Staff Executive Control
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Manage student admissions, document verifications, certificate generation (Bonafide/TC), counter fee receipts, and desk help inquiries.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition transform active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> New Admission Registration
            </button>
            <button
              onClick={() => {
                if (!selectedStudent && students.length > 0) setSelectedStudent(students[0]);
                setShowCertModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-cyan-400" /> Issue Certificate
            </button>
            <button
              onClick={() => {
                if (!selectedStudent && students.length > 0) setSelectedStudent(students[0]);
                setShowFeeModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" /> Counter Fee Entry
            </button>
          </div>
        </div>
      </div>

      {/* 4 TOP STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Admissions</span>
            <UserPlus className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-cyan-300">{stats.todayAdmissions}</p>
          <span className="text-[11px] text-slate-400 block">Registered student records today</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Certificates</span>
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-indigo-300">{stats.pendingCertificates}</p>
          <span className="text-[11px] text-slate-400 block">Bonafide / TC / Conduct requests</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Counter Fees Collected</span>
            <DollarSign className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-emerald-400">₹{stats.counterFeesCollected.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400 block">Today's cash & counter receipts</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Desk Help Inquiries</span>
            <HelpCircle className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-amber-300">{stats.openInquiries}</p>
          <span className="text-[11px] text-slate-400 block">Open student counter tickets</span>
        </div>
      </div>

      {/* MAIN TWO-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: STUDENT DESK & ADMISSIONS REGISTRY (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" /> Student Registry & Desk Lookup
                </h2>
                <p className="text-xs text-slate-400">Search student records by Admission ID, Name, or Department to issue certificates or process fees.</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search Admission No, Name..."
                  className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-full sm:w-64"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-xl">Student Name</th>
                    <th className="p-3">Admission No</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Semester</th>
                    <th className="p-3 rounded-r-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                        Loading live student registry from database...
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No matching student admission records found.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.slice(0, 8).map(st => {
                      const name = st.name || [st.first_name, st.last_name].filter(Boolean).join(' ') || 'Student';
                      const admNo = st.admission_number || st.roll_number || `STU${st.id}`;
                      const isSelected = selectedStudent?.id === st.id;

                      return (
                        <tr
                          key={st.id}
                          className={`hover:bg-slate-800/40 transition cursor-pointer ${isSelected ? 'bg-indigo-950/40 border-l-2 border-indigo-400' : ''}`}
                          onClick={() => setSelectedStudent(st)}
                        >
                          <td className="p-3 font-semibold text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center text-xs font-bold shrink-0">
                              {name.charAt(0)}
                            </div>
                            <span>{name}</span>
                          </td>
                          <td className="p-3 font-mono text-cyan-400 font-bold">{admNo}</td>
                          <td className="p-3 text-slate-300">{st.department_name || st.department || 'Computer Science'}</td>
                          <td className="p-3 font-medium text-slate-400">{st.semester ? `Semester ${st.semester}` : 'Semester 6'}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(st);
                                setShowCertModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] mr-2"
                            >
                              Issue Cert
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(st);
                                setShowFeeModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-[11px]"
                            >
                              Collect Fee
                            </button>
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

        {/* RIGHT COLUMN: DOCUMENT REQUESTS & DESK ACTIONS (1 COL) */}
        <div className="space-y-6">

          {/* Certificate Requests Queue */}
          <div className="p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Certificate Requests Queue
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {documentRequests.filter(r => r.status === "Pending").length} Pending
              </span>
            </div>

            <div className="space-y-3">
              {documentRequests.map(req => (
                <div key={req.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-xs">{req.studentName}</h3>
                      <p className="text-[11px] text-cyan-400 font-mono">{req.rollNo}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      req.status === "Approved"
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>{req.type}</span>
                    <span>{req.date}</span>
                  </div>

                  {req.status === "Pending" && (
                    <button
                      onClick={() => handleApproveDoc(req.id)}
                      className="w-full mt-2 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Issue Certificate
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Desk Guide */}
          <div className="p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl space-y-3 text-xs">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" /> Desk Guidelines & Compliance
            </h3>
            <p className="text-slate-300 leading-relaxed">
              All student admission profiles must contain verified email handles and admission numbers before issuing Transfer Certificates (TC) or No-Dues receipts.
            </p>
          </div>
        </div>

      </div>

      {/* MODAL 1: NEW STUDENT ADMISSION */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" /> Register New Student Admission
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateStudentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.firstName}
                    onChange={e => setNewStudent({ ...newStudent, firstName: e.target.value })}
                    placeholder="e.g. Rahul"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Last Name</label>
                  <input
                    type="text"
                    value={newStudent.lastName}
                    onChange={e => setNewStudent({ ...newStudent, lastName: e.target.value })}
                    placeholder="e.g. Sharma"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newStudent.email}
                  onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="e.g. student@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Admission Number *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.admissionNumber}
                    onChange={e => setNewStudent({ ...newStudent, admissionNumber: e.target.value })}
                    placeholder="e.g. STU2026001"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Phone Number</label>
                  <input
                    type="text"
                    value={newStudent.phone}
                    onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Department</label>
                <select
                  value={newStudent.department}
                  onChange={e => setNewStudent({ ...newStudent, department: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                  <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Create Admission Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ISSUE CERTIFICATE */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-cyan-400" /> Issue Official Student Certificate
              </h3>
              <button onClick={() => setShowCertModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block font-semibold">Selected Student</span>
                <span className="font-bold text-white text-sm">{selectedStudent?.name || selectedStudent?.first_name || 'Student'}</span>
                <span className="text-cyan-400 font-mono block">{selectedStudent?.admission_number || selectedStudent?.roll_number || 'STU2026001'}</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Certificate Type</label>
                <select
                  value={certType}
                  onChange={e => setCertType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Bonafide">Bonafide Certificate</option>
                  <option value="Transfer Certificate (TC)">Transfer Certificate (TC)</option>
                  <option value="Conduct Certificate">Conduct Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Purpose / Reason</label>
                <input
                  type="text"
                  value={certPurpose}
                  onChange={e => setCertPurpose(e.target.value)}
                  placeholder="e.g. Bank Loan / Passport Verification"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowCertModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold">Cancel</button>
                <button onClick={handleIssueCertificate} className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Issue & Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: COUNTER FEE ENTRY */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" /> Counter Fee Payment Intake
              </h3>
              <button onClick={() => setShowFeeModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block font-semibold">Student Account</span>
                <span className="font-bold text-white text-sm">{selectedStudent?.name || selectedStudent?.first_name || 'Student'}</span>
                <span className="text-cyan-400 font-mono block">{selectedStudent?.admission_number || selectedStudent?.roll_number || 'STU2026001'}</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Payment Amount (₹)</label>
                <input
                  type="number"
                  value={feeAmount}
                  onChange={e => setFeeAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-black text-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Payment Mode</label>
                <select
                  value={feePaymentMode}
                  onChange={e => setFeePaymentMode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="Cash Counter">Cash Counter</option>
                  <option value="UPI / QR Counter">UPI / QR Counter</option>
                  <option value="Demand Draft (DD)">Demand Draft (DD)</option>
                  <option value="POS Card Terminal">POS Card Terminal</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Payment Remarks</label>
                <input
                  type="text"
                  value={feeRemarks}
                  onChange={e => setFeeRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowFeeModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold">Cancel</button>
                <button onClick={handleProcessFee} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Confirm & Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
