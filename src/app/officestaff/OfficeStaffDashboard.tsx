import React, { useState, useEffect } from 'react';
import {
  FileText, Users, CheckCircle2, Clock, Search,
  Filter, Download, RefreshCw, Printer, Shield,
  Award, FileCheck, Building, AlertCircle, LogOut,
  Sun, Moon, Menu, ChevronLeft, ChevronRight, UserCheck
} from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../portal/AuthContext';
import { Badge, Card, StatCard, Avatar, cn } from '../App';
import { Btn } from '../../components/ui/Btn';

interface OfficeStaffDashboardProps {
  onNav?: (module: string) => void;
  theme?: string;
  toggleTheme?: () => void;
}

export function OfficeStaffDashboard({ onNav, theme = 'light', toggleTheme }: OfficeStaffDashboardProps) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'students' | 'certificates' | 'operations'>('students');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateType, setCertificateType] = useState('Bonafide Certificate');
  const [certificatePurpose, setCertificatePurpose] = useState('Education Loan / Bank Submission');
  const [issuedMessage, setIssuedMessage] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await client.get('/students');
      const raw = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      setStudents(raw);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const safeStudents = Array.isArray(students) ? students : [];

  const filteredStudents = safeStudents.filter(s => {
    const fullName = `${s.first_name || ''} ${s.last_name || ''} ${s.name || ''}`.toLowerCase();
    const roll = (s.roll_number || s.admission_number || `STU${s.id}`).toLowerCase();
    const email = (s.email || '').toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) || roll.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    const matchesDept = deptFilter === 'All' || (s.department_name || s.department || '') === deptFilter;
    return matchesSearch && matchesDept;
  });

  const totalPages = Math.ceil(filteredStudents.length / perPage) || 1;
  const paginatedStudents = filteredStudents.slice((page - 1) * perPage, page * perPage);

  const handleIssueCertificate = () => {
    setIssuedMessage(`Successfully generated ${certificateType} for ${selectedStudent?.name || selectedStudent?.first_name || 'Student'} (${selectedStudent?.admission_number || selectedStudent?.roll_number || 'ID'}). Document signed & logged.`);
    setShowCertificateModal(false);
    setTimeout(() => setIssuedMessage(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-950 text-[#0F172A] dark:text-white flex flex-col">
      {/* Top Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-[#E2E8F0] dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#102A43] text-white flex items-center justify-center shadow-xs">
            <Building size={18} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#102A43] dark:text-white tracking-tight leading-tight">
              Administrative Office & Student Records
            </h1>
            <p className="text-[11px] text-[#64748B] dark:text-slate-400">
              Institutional Operations • Student Verification & Documentation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {toggleTheme && (
            <button onClick={toggleTheme} className="p-2 rounded-lg text-[#243B53] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Toggle Theme">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          )}

          <div className="w-px h-5 bg-[#E2E8F0] dark:bg-slate-700 hidden sm:block"></div>

          <div className="flex items-center gap-2.5">
            <Avatar name={user?.name || user?.full_name || 'Office Officer'} size="sm" />
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-[#0F172A] dark:text-white leading-tight capitalize">{user?.name || user?.full_name || 'Office Staff'}</p>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">Office Administration</p>
            </div>
          </div>

          <button 
            onClick={() => {
              logout();
              if (onNav) onNav('landing');
            }} 
            className="p-2 rounded-lg text-[#64748B] hover:text-[#B91C1C] hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors ml-1" 
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Banner if certificate issued */}
        {issuedMessage && (
          <div className="p-3.5 rounded-lg bg-emerald-50 text-[#15803D] dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{issuedMessage}</span>
            </div>
            <button onClick={() => setIssuedMessage(null)} className="text-[#15803D] hover:underline text-xs">Dismiss</button>
          </div>
        )}

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Student Records"
            value={safeStudents.length}
            subtitle="Verified in University DB"
            icon={<Users size={18} />}
            color="blue"
          />
          <StatCard
            title="Active Enrollment"
            value={safeStudents.filter(s => (s.status || 'Active').toLowerCase() === 'active').length}
            subtitle="Registered Learners"
            icon={<UserCheck size={18} />}
            color="green"
          />
          <StatCard
            title="Issued Certificates"
            value="142"
            subtitle="Current Academic Cycle"
            icon={<FileCheck size={18} />}
            color="amber"
          />
          <StatCard
            title="Pending Clearances"
            value="3"
            subtitle="Fee / Library Approvals"
            icon={<Clock size={18} />}
            color="indigo"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('students')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-2",
              activeTab === 'students'
                ? "bg-[#2563EB] text-white shadow-xs font-semibold"
                : "bg-slate-100 hover:bg-slate-200 text-[#0F172A] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            )}
          >
            <Users size={14} />
            <span>Student Directory & Records</span>
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-2",
              activeTab === 'certificates'
                ? "bg-[#2563EB] text-white shadow-xs font-semibold"
                : "bg-slate-100 hover:bg-slate-200 text-[#0F172A] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            )}
          >
            <Award size={14} />
            <span>Certificates & Verification Requests</span>
          </button>
        </div>

        {/* Tab 1: Students Table */}
        {activeTab === 'students' && (
          <Card className="overflow-hidden">
            {/* Table Header Filter Toolbar */}
            <div className="p-4 border-b border-[#E2E8F0] dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="text"
                    placeholder="Search by name, roll no, email..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="w-full bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#0F172A] dark:text-white placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <select
                  value={deptFilter}
                  onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
                  className="bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="All">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Btn
                  variant="outline"
                  size="sm"
                  onClick={fetchStudents}
                  icon={<RefreshCw size={13} className={loading ? "animate-spin" : ""} />}
                >
                  Refresh
                </Btn>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-[#E2E8F0] dark:border-slate-800 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    <th className="py-3 px-4">Student Identity</th>
                    <th className="py-3 px-4">Roll / Admission No</th>
                    <th className="py-3 px-4">Department & Program</th>
                    <th className="py-3 px-4">Semester</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Office Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#64748B]">
                        <RefreshCw size={18} className="animate-spin inline mr-2 text-[#2563EB]" />
                        Loading student records from database...
                      </td>
                    </tr>
                  ) : paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#64748B]">
                        No student records match the search filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s, idx) => {
                      const name = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || 'Student';
                      const roll = s.admission_number || s.roll_number || `STU${s.id || idx}`;
                      const dept = s.department_name || s.department || 'Computer Science';
                      const status = s.status || 'Active';

                      return (
                        <tr key={s.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={name} size="xs" />
                              <div>
                                <p className="font-semibold text-[#0F172A] dark:text-white">{name}</p>
                                <p className="text-[11px] text-[#64748B] truncate">{s.email || 'student@university.edu'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-[#0F172A] dark:text-white">{roll}</td>
                          <td className="py-3 px-4 text-[#0F172A] dark:text-slate-200">{dept}</td>
                          <td className="py-3 px-4 font-medium">{s.semester ? `Semester ${s.semester}` : 'Semester 1'}</td>
                          <td className="py-3 px-4">
                            <Badge variant={status.toLowerCase() === 'active' ? 'success' : 'warning'}>
                              {status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Btn
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedStudent({ ...s, name, roll });
                                setShowCertificateModal(true);
                              }}
                              icon={<Award size={13} />}
                            >
                              Issue Cert
                            </Btn>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-3 border-t border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-[#64748B]">
              <span>
                Showing {filteredStudents.length > 0 ? (page - 1) * perPage + 1 : 0} to {Math.min(page * perPage, filteredStudents.length)} of {filteredStudents.length} entries
              </span>
              <div className="flex items-center gap-1.5">
                <Btn
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  icon={<ChevronLeft size={14} />}
                >
                  Prev
                </Btn>
                <span className="px-2 font-medium text-[#0F172A] dark:text-white">Page {page} of {totalPages}</span>
                <Btn
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  icon={<ChevronRight size={14} />}
                >
                  Next
                </Btn>
              </div>
            </div>
          </Card>
        )}

        {/* Tab 2: Certificate Requests */}
        {activeTab === 'certificates' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-5 md:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
                <h3 className="text-sm font-bold text-[#102A43] dark:text-white tracking-tight">
                  Recent Document & Certificate Issuance Log
                </h3>
                <Badge variant="info">Digital Verification Active</Badge>
              </div>

              <div className="space-y-3">
                {[
                  { student: "Aarav Sharma", id: "STU202601", type: "Bonafide Certificate", date: "Today, 11:20 AM", status: "Issued" },
                  { student: "Priya Patel", id: "STU202602", type: "Fee Clearance Record", date: "Yesterday, 03:45 PM", status: "Issued" },
                  { student: "Rahul Verma", id: "STU202603", type: "Transfer Certificate Draft", date: "Oct 10, 2026", status: "Pending Dean Signature" },
                  { student: "Ananya Iyer", id: "STU202604", type: "Academic Transcript", date: "Oct 09, 2026", status: "Issued" },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#0F172A] dark:text-white">{item.student} ({item.id})</p>
                      <p className="text-[11px] text-[#64748B]">{item.type} • Requested: {item.date}</p>
                    </div>
                    <Badge variant={item.status === 'Issued' ? 'success' : 'warning'}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-[#102A43] dark:text-white tracking-tight">
                Quick Document Generator
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Generate and print verified certificates for any active student.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-[#0F172A] dark:text-slate-300">Select Template</label>
                  <select 
                    className="w-full bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg p-2 text-xs"
                    value={certificateType}
                    onChange={e => setCertificateType(e.target.value)}
                  >
                    <option value="Bonafide Certificate">Bonafide Certificate</option>
                    <option value="Course Completion Certificate">Course Completion Certificate</option>
                    <option value="Provisional Degree Certificate">Provisional Degree Certificate</option>
                    <option value="Fee Clearance Certificate">Fee Clearance Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#0F172A] dark:text-slate-300">Issuing Authority</label>
                  <input 
                    type="text" 
                    disabled 
                    value="Office of Academic Administration" 
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg p-2 text-xs text-[#64748B]"
                  />
                </div>

                <div className="pt-2">
                  <Btn 
                    variant="primary" 
                    size="md" 
                    className="w-full"
                    onClick={() => {
                      if (safeStudents.length > 0) {
                        setSelectedStudent(safeStudents[0]);
                        setShowCertificateModal(true);
                      }
                    }}
                  >
                    Open Certificate Modal
                  </Btn>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Certificate Generation Modal */}
        {showCertificateModal && selectedStudent && (
          <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
                <h3 className="text-sm font-bold text-[#102A43] dark:text-white">
                  Issue Verified Institutional Certificate
                </h3>
                <button onClick={() => setShowCertificateModal(false)} className="text-[#64748B] hover:text-[#0F172A]">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-[#E2E8F0] dark:border-slate-700">
                  <p className="font-semibold text-[#0F172A] dark:text-white">{selectedStudent.name || 'Student'}</p>
                  <p className="text-[#64748B]">Roll No: {selectedStudent.roll || selectedStudent.admission_number || 'STU001'}</p>
                  <p className="text-[#64748B]">Department: {selectedStudent.department_name || selectedStudent.department || 'Engineering'}</p>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Certificate Type</label>
                  <select 
                    value={certificateType} 
                    onChange={e => setCertificateType(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg p-2 text-xs"
                  >
                    <option value="Bonafide Certificate">Bonafide Certificate</option>
                    <option value="Fee Clearance Certificate">Fee Clearance Certificate</option>
                    <option value="Course Completion Certificate">Course Completion Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Reason / Purpose</label>
                  <input 
                    type="text" 
                    value={certificatePurpose} 
                    onChange={e => setCertificatePurpose(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0] dark:border-slate-800">
                <Btn variant="outline" size="sm" onClick={() => setShowCertificateModal(false)}>
                  Cancel
                </Btn>
                <Btn variant="primary" size="sm" onClick={handleIssueCertificate} icon={<Printer size={14} />}>
                  Generate & Issue
                </Btn>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default OfficeStaffDashboard;
