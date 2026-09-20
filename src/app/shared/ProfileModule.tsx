import React, { useState, useEffect } from "react";
import {
  Save, Download, Phone, MapPin, HeartPulse, Shield, Smartphone,
  Activity, ScanFace, CheckCircle2, AlertCircle, Trash2, Camera,
  Mail, Edit2, Lock, KeyRound, X, Loader2, ShieldCheck, User, Plus, Fingerprint,
  GraduationCap, BookOpen, Award, FileText, Calendar, DollarSign, Briefcase,
  Library as LibraryIcon, Home, Check, Eye, Star, TrendingUp, Layers, Building,
  Zap, HelpCircle, FileSpreadsheet, Sparkles, ExternalLink, Globe, UserCheck
} from "lucide-react";
import { Card, Avatar, Badge, Btn } from "../App";
import client from "../../api/client";
import { FaceAuthModal } from "../../components/FaceAuthModal";
import { PasskeyAuthModal } from "../../components/PasskeyAuthModal";

export function ProfileModule() {
  const savedUser = (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const [profile, setProfile] = useState<any>(savedUser || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile Tab State (17 Tabs)
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'personal'
    | 'contact'
    | 'parent'
    | 'academic'
    | 'university_ids'
    | 'prev_education'
    | 'performance'
    | 'sem_history'
    | 'subjects'
    | 'attendance'
    | 'exams'
    | 'backlogs'
    | 'mentor'
    | 'placement'
    | 'hostel_lib_fees'
    | 'documents_projects'
  >('overview');

  // Editable Contact State
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactData, setContactData] = useState({
    phone: '',
    altPhone: '+91 94401 23456',
    email: '',
    address: '',
    permanentAddress: '',
    emergencyContactName: 'Rajeshwar Reddy',
    emergencyContactRelation: 'Father',
    emergencyContactPhone: '+91 98490 12345'
  });

  // Face & WebAuthn Biometrics state
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [faceRegisteredAt, setFaceRegisteredAt] = useState<string | null>(null);
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [showFaceModal, setShowFaceModal] = useState(false);

  // Email Update Modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    fetchProfile();
    fetchFaceStatus();
    fetchPasskeys();
  }, []);

  const fetchProfile = () => {
    client.get('/profile').then(res => {
      const data = res.data?.data || res.data || {};
      setProfile(data);
      setContactData({
        phone: data.phone || '+91 98765 43210',
        altPhone: data.alt_phone || '+91 94401 23456',
        email: data.email || savedUser?.email || 'dinesh.reddy@campus.edu',
        address: data.address || 'H.No 4-12, Tech Campus Road, Gachibowli, Hyderabad, TS, 500032',
        permanentAddress: data.permanent_address || 'Flat 302, Royal Enclave, MG Road, Vijayawada, AP, 520010',
        emergencyContactName: 'Rajeshwar Reddy',
        emergencyContactRelation: 'Father',
        emergencyContactPhone: '+91 98490 12345'
      });
      setLoading(false);
    }).catch(error => {
      console.error('Failed to fetch profile:', error);
      if (savedUser) setProfile(savedUser);
      setLoading(false);
    });
  };

  const fetchFaceStatus = () => {
    client.get('/auth/face-status').then(res => {
      if (res.data?.success) {
        setFaceRegistered(res.data.data.registered);
        setFaceRegisteredAt(res.data.data.registered_at);
      }
    }).catch(() => {});
  };

  const fetchPasskeys = async () => {
    try {
      const res = await client.get('/webauthn/credentials');
      if (res.data?.success) setPasskeys(res.data.data || []);
    } catch (err) {}
  };

  const handleSaveContact = async () => {
    setSaving(true);
    try {
      await client.put('/profile', {
        phone: contactData.phone,
        address: contactData.address
      });
      setIsEditingContact(false);
      triggerToast('✨ Personal contact information updated successfully!');
    } catch (err) {
      triggerToast('⚠️ Failed to save profile edits.');
    }
    setSaving(false);
  };

  const displayName = profile?.name || profile?.full_name || savedUser?.name || 'Dinesh Reddy';
  const studentId = profile?.student_id || profile?.admission_number || 'VTU25498';
  const rollNumber = profile?.roll_number || '21CSE042';
  const regNumber = profile?.registration_number || 'VTU2023CS8842';
  const program = profile?.program || 'B.Tech Computer Science & Engineering';
  const department = profile?.department || 'Computer Science & Engineering';
  const currentSemester = profile?.current_semester || 7;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-100 min-h-screen">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-indigo-400 animate-bounce">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. STUDENT PROFILE HEADER */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 border border-indigo-800/40 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar with Status badge */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-1 shadow-2xl">
              <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center overflow-hidden">
                <Avatar name={displayName} size="lg" className="w-full h-full text-3xl font-black" />
              </div>
            </div>
            <span className="absolute -bottom-2 right-2 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-lg border border-emerald-300">
              {profile?.status || 'Active'}
            </span>
          </div>

          {/* Profile Basic Telemetry */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-bold uppercase tracking-wider">
                Official Student Record
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold">
                ID: {studentId}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">{displayName}</h1>
            <p className="text-slate-300 font-medium text-sm sm:text-base">{program}</p>

            {/* Quick Metadata Chips */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                <GraduationCap className="w-4 h-4 text-cyan-400" /> 4th Year • {currentSemester}th Semester (Sec A)
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                <Calendar className="w-4 h-4 text-emerald-400" /> Batch: 2023–2027
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                <Award className="w-4 h-4 text-amber-400" /> Reg No: {regNumber}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <button
              onClick={() => triggerToast('📄 Downloading Official Student Information Dossier (PDF)...')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4" /> Download Profile PDF
            </button>
            <button
              onClick={() => setIsEditingContact(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <Edit2 className="w-4 h-4" /> Edit Contact Info
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 30. STUDENT PROFILE TABS (17 Tabs Horizontal Scroll bar) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 shadow-xl">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin pb-1">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'personal', label: '👤 Personal' },
            { id: 'contact', label: '📞 Contact & Address' },
            { id: 'parent', label: '👨‍👩‍👦 Parent & Guardian' },
            { id: 'academic', label: '🎓 Academic Details' },
            { id: 'university_ids', label: '🆔 University IDs' },
            { id: 'prev_education', label: '🏫 Previous Education' },
            { id: 'performance', label: '📈 Performance & SGPA' },
            { id: 'sem_history', label: '📜 Semester History' },
            { id: 'subjects', label: '📚 Registered Subjects' },
            { id: 'attendance', label: '⏱️ Attendance Log' },
            { id: 'exams', label: '📝 Exams & Results' },
            { id: 'backlogs', label: '⚠️ Backlogs & Arrears' },
            { id: 'mentor', label: '👨‍🏫 Mentor & HOD' },
            { id: 'placement', label: '💼 Placement & Internships' },
            { id: 'hostel_lib_fees', label: '🏠 Hostel, Library & Fees' },
            { id: 'documents_projects', label: '📁 Documents & Projects' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
                activeTab === t.id
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-indigo-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-xl">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Current CGPA</span>
              <p className="text-2xl sm:text-3xl font-black text-cyan-400 mt-1">8.92</p>
              <span className="text-[10px] text-emerald-400 font-semibold">★ First Class Distinction</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-xl">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Last SGPA (Sem 6)</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">9.10</p>
              <span className="text-[10px] text-slate-400">Top 5% in CSE</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-xl">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Overall Attendance</span>
              <p className="text-2xl sm:text-3xl font-black text-indigo-400 mt-1">88.5%</p>
              <span className="text-[10px] text-emerald-400 font-semibold">✓ Above 75% Limit</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-xl">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Credits Earned</span>
              <p className="text-2xl sm:text-3xl font-black text-purple-400 mt-1">142 <span className="text-xs text-slate-400 font-normal">/ 160</span></p>
              <span className="text-[10px] text-slate-400">18 Credits Remaining</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-xl">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Active Backlogs</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">0</p>
              <span className="text-[10px] text-emerald-400 font-semibold">✨ Clean Record</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-xl">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Placement Status</span>
              <p className="text-lg font-black text-amber-400 mt-1">PLACED</p>
              <span className="text-[10px] text-slate-300">Google Inc. (₹28.5 LPA)</span>
            </div>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Academic Advisor Card */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 shadow-xl space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" /> Assigned Academic Mentor
              </h3>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs space-y-1">
                <p className="font-bold text-slate-100 text-sm">Dr. K. V. Rao</p>
                <p className="text-slate-400">Professor & Senior Advisor (CSE)</p>
                <p className="text-cyan-400">kv.rao@campus.edu • +91 98480 11223</p>
                <p className="text-slate-400 text-[11px] pt-1">Office: Block A, Room 304</p>
              </div>
            </div>

            {/* Hostel & Mess Card */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 shadow-xl space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-400" /> Campus Accommodation
              </h3>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs space-y-1">
                <p className="font-bold text-slate-100">Visweswaraya Hostel (Block B)</p>
                <p className="text-slate-400">Room 304 • Bed #2</p>
                <p className="text-emerald-400 font-semibold">Mess Plan: Special South Indian Veg/Non-Veg</p>
                <p className="text-slate-400 text-[11px] pt-1">Hostel Status: Active Resident</p>
              </div>
            </div>

            {/* Fee Overview Card */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 shadow-xl space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-400" /> Financial Clearance
              </h3>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Academic Year Fee</span>
                  <span className="font-bold text-white">₹1,20,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Paid</span>
                  <span className="font-bold text-emerald-400">₹1,20,000</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1">
                  <span className="text-slate-400 font-semibold">Pending Dues</span>
                  <span className="font-extrabold text-emerald-400">₹0 (CLEARED)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PERSONAL INFORMATION */}
      {/* ========================================================================= */}
      {activeTab === 'personal' && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" /> Personal Identity Records
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700">
              <span className="text-slate-400 block mb-1">Full Legal Name</span>
              <span className="font-bold text-white text-sm">{displayName}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700">
              <span className="text-slate-400 block mb-1">First Name</span>
              <span className="font-bold text-white text-sm">{profile?.first_name || 'Dinesh'}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700">
              <span className="text-slate-400 block mb-1">Last Name</span>
              <span className="font-bold text-white text-sm">{profile?.last_name || 'Reddy'}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700">
              <span className="text-slate-400 block mb-1">Date of Birth</span>
              <span className="font-bold text-white text-sm">{profile?.dob || '18 May 2003'}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700">
              <span className="text-slate-400 block mb-1">Gender</span>
              <span className="font-bold text-white text-sm">{profile?.gender || 'Male'}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700">
              <span className="text-slate-400 block mb-1">Blood Group</span>
              <span className="font-bold text-rose-400 text-sm">{profile?.blood_group || 'O+'}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700">
              <span className="text-slate-400 block mb-1">Nationality</span>
              <span className="font-bold text-white text-sm">{profile?.nationality || 'Indian'}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700">
              <span className="text-slate-400 block mb-1">Marital Status</span>
              <span className="font-bold text-white text-sm">{profile?.marital_status || 'Single'}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700">
              <span className="text-slate-400 block mb-1">Official Student ID</span>
              <span className="font-bold text-cyan-400 font-mono text-sm">{studentId}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CONTACT & ADDRESS INFORMATION */}
      {/* ========================================================================= */}
      {activeTab === 'contact' && (
        <div className="space-y-6">
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-cyan-400" /> Contact Details & Communication Addresses
              </h2>
              {!isEditingContact ? (
                <button
                  onClick={() => setIsEditingContact(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Edit2 className="w-4 h-4" /> Edit Contact Information
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingContact(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveContact}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 space-y-1">
                <span className="text-slate-400 block font-semibold">Institutional College Email</span>
                <span className="font-mono text-cyan-400 text-sm block">{contactData.email}</span>
                <span className="text-[10px] text-slate-400">Official university communication handle (Primary)</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 space-y-1">
                <span className="text-slate-400 block font-semibold">Student Mobile Phone</span>
                {isEditingContact ? (
                  <input
                    type="text"
                    value={contactData.phone}
                    onChange={e => setContactData({ ...contactData, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                ) : (
                  <span className="font-bold text-white text-sm block">{contactData.phone}</span>
                )}
                <span className="text-[10px] text-slate-400">SMS notification & OTP recipient</span>
              </div>

              {/* Addresses */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 space-y-2">
                <span className="text-cyan-400 font-bold block uppercase tracking-wider text-[11px]">Current Address</span>
                {isEditingContact ? (
                  <textarea
                    rows={2}
                    value={contactData.address}
                    onChange={e => setContactData({ ...contactData, address: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                ) : (
                  <p className="text-slate-200 leading-relaxed">{contactData.address}</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 space-y-2">
                <span className="text-emerald-400 font-bold block uppercase tracking-wider text-[11px]">Permanent Home Address</span>
                {isEditingContact ? (
                  <textarea
                    rows={2}
                    value={contactData.permanentAddress}
                    onChange={e => setContactData({ ...contactData, permanentAddress: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                ) : (
                  <p className="text-slate-200 leading-relaxed">{contactData.permanentAddress}</p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-rose-950/30 border border-rose-800/40 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-rose-300 text-sm mb-3 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-400" /> Emergency Contact Hotline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Contact Name</span>
                <span className="font-bold text-white text-sm">{contactData.emergencyContactName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Relationship</span>
                <span className="font-bold text-white text-sm">{contactData.emergencyContactRelation}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Emergency Phone</span>
                <span className="font-bold text-rose-400 text-sm font-mono">{contactData.emergencyContactPhone}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PARENT / GUARDIAN INFORMATION */}
      {/* ========================================================================= */}
      {activeTab === 'parent' && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" /> Parent & Legal Guardian Telemetry
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Father Details */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-700 space-y-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">Father's Information</span>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Name</span>
                  <span className="font-bold text-white text-sm">Rajeshwar Reddy</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Occupation</span>
                  <span className="text-slate-200">Senior Civil Engineer (State Govt.)</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone</span>
                  <span className="font-mono text-cyan-300 font-bold">+91 98490 12345</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email</span>
                  <span className="font-mono text-slate-300">rajeshwar.reddy@gmail.com</span>
                </div>
              </div>
            </div>

            {/* Mother Details */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-700 space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Mother's Information</span>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Name</span>
                  <span className="font-bold text-white text-sm">Sunitha Reddy</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Occupation</span>
                  <span className="text-slate-200">School Principal</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone</span>
                  <span className="font-mono text-emerald-300 font-bold">+91 98491 54321</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email</span>
                  <span className="font-mono text-slate-300">sunitha.reddy@gmail.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ACADEMIC DETAILS */}
      {/* ========================================================================= */}
      {activeTab === 'academic' && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-cyan-400" /> Institutional Academic Enrollment
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700">
              <span className="text-slate-400 block mb-1">Degree Program</span>
              <span className="font-bold text-white text-sm">{program}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700">
              <span className="text-slate-400 block mb-1">Department</span>
              <span className="font-bold text-white text-sm">{department}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700">
              <span className="text-slate-400 block mb-1">Specialization</span>
              <span className="font-bold text-cyan-400 text-sm">Artificial Intelligence & Machine Learning</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700">
              <span className="text-slate-400 block mb-1">Admission Type</span>
              <span className="font-bold text-emerald-400 text-sm">Regular (EAMCET Counseling Merit)</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700">
              <span className="text-slate-400 block mb-1">Admission Date</span>
              <span className="font-bold text-white text-sm">14 Aug 2023</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700">
              <span className="text-slate-400 block mb-1">Batch / Academic Session</span>
              <span className="font-bold text-white text-sm">2023 – 2027</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: UNIVERSITY IDENTIFIERS */}
      {/* ========================================================================= */}
      {activeTab === 'university_ids' && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" /> Official University Identifiers (Admin Protected)
            </h2>
            <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              🔒 Read Only for Students
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 font-mono">
              <span className="text-slate-400 block mb-1">Student ID</span>
              <span className="font-black text-cyan-400 text-base">{studentId}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 font-mono">
              <span className="text-slate-400 block mb-1">Roll Number</span>
              <span className="font-black text-emerald-400 text-base">{rollNumber}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 font-mono">
              <span className="text-slate-400 block mb-1">University Reg Number</span>
              <span className="font-black text-indigo-400 text-base">{regNumber}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 font-mono">
              <span className="text-slate-400 block mb-1">Library Card ID</span>
              <span className="font-black text-amber-400 text-base">LIB-2023-884</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 font-mono">
              <span className="text-slate-400 block mb-1">Hostel Allocation ID</span>
              <span className="font-black text-purple-400 text-base">HST-BLK-B-304</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PREVIOUS EDUCATION */}
      {/* ========================================================================= */}
      {activeTab === 'prev_education' && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" /> Prior Academic Qualifications
          </h2>

          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-700 flex justify-between items-center text-xs">
              <div>
                <h3 className="font-bold text-white text-sm">Class 12th / Senior Secondary (MPC)</h3>
                <p className="text-slate-400">Narayana Junior College • TSBIE Board</p>
                <p className="text-slate-500 mt-1">Passing Year: 2021</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400">96.5%</span>
                <span className="block text-[10px] text-slate-400 uppercase">Grade: Distinction</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-700 flex justify-between items-center text-xs">
              <div>
                <h3 className="font-bold text-white text-sm">Class 10th / Secondary School (SSC)</h3>
                <p className="text-slate-400">Silver Oaks High School • CBSE Board</p>
                <p className="text-slate-500 mt-1">Passing Year: 2019</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-cyan-400">94.2%</span>
                <span className="block text-[10px] text-slate-400 uppercase">Grade: 10 / 10 CGPA</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: ACADEMIC PERFORMANCE & CGPA */}
      {/* ========================================================================= */}
      {activeTab === 'performance' && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Calculated Performance & Credit Index
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-slate-900 border border-cyan-500/40 text-center">
              <span className="text-xs text-slate-400 font-bold uppercase">Cumulative CGPA</span>
              <p className="text-4xl font-black text-cyan-400 my-2">8.92</p>
              <p className="text-xs text-slate-300">Out of 10.0 Scale</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-900 border border-emerald-500/40 text-center">
              <span className="text-xs text-slate-400 font-bold uppercase">Degree Completion</span>
              <p className="text-4xl font-black text-emerald-400 my-2">88.7%</p>
              <p className="text-xs text-slate-300">142 of 160 Credits</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-900 border border-purple-500/40 text-center">
              <span className="text-xs text-slate-400 font-bold uppercase">Overall Marks %</span>
              <p className="text-4xl font-black text-purple-400 my-2">84.6%</p>
              <p className="text-xs text-slate-300">Aggregated Across 42 Subjects</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: SEMESTER HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'sem_history' && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" /> Semester-by-Semester Transcript History
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Academic Session</th>
                  <th className="py-3 px-4">SGPA</th>
                  <th className="py-3 px-4">CGPA</th>
                  <th className="py-3 px-4">Credits Earned</th>
                  <th className="py-3 px-4">Result Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {[
                  { sem: 'Semester 1', session: '2023-24 (Fall)', sgpa: '8.75', cgpa: '8.75', credits: '22 / 22', status: 'PASSED' },
                  { sem: 'Semester 2', session: '2023-24 (Spring)', sgpa: '8.90', cgpa: '8.82', credits: '24 / 24', status: 'PASSED' },
                  { sem: 'Semester 3', session: '2024-25 (Fall)', sgpa: '8.80', cgpa: '8.81', credits: '22 / 22', status: 'PASSED' },
                  { sem: 'Semester 4', session: '2024-25 (Spring)', sgpa: '9.05', cgpa: '8.87', credits: '24 / 24', status: 'PASSED' },
                  { sem: 'Semester 5', session: '2025-26 (Fall)', sgpa: '8.95', cgpa: '8.89', credits: '24 / 24', status: 'PASSED' },
                  { sem: 'Semester 6', session: '2025-26 (Spring)', sgpa: '9.10', cgpa: '8.92', credits: '22 / 22', status: 'PASSED' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/80 transition">
                    <td className="py-3.5 px-4 font-bold text-white">{row.sem}</td>
                    <td className="py-3.5 px-4 text-slate-300">{row.session}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">{row.sgpa}</td>
                    <td className="py-3.5 px-4 font-bold text-cyan-400">{row.cgpa}</td>
                    <td className="py-3.5 px-4 text-slate-200">{row.credits}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: REGISTERED SUBJECTS */}
      {/* ========================================================================= */}
      {activeTab === 'subjects' && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" /> Current Semester Course Registrations (Sem {currentSemester})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { code: 'CS701', name: 'Cloud Computing & Distributed Systems', type: 'Core', credits: '4.0', faculty: 'Dr. K. V. Rao' },
              { code: 'CS702', name: 'Machine Learning & Neural Networks', type: 'Core', credits: '4.0', faculty: 'Prof. S. Mehra' },
              { code: 'CS703', name: 'System Design & Architecture', type: 'Core', credits: '3.0', faculty: 'Dr. P. N. Swamy' },
              { code: 'CS704E', name: 'Natural Language Processing', type: 'Elective', credits: '3.0', faculty: 'Dr. M. Sinha' },
              { code: 'CS705L', name: 'Cloud & AI Innovation Lab', type: 'Lab', credits: '2.0', faculty: 'Prof. R. Sharma' },
              { code: 'CS706P', name: 'Major Project Phase 1', type: 'Project', credits: '4.0', faculty: 'Dr. K. V. Rao' }
            ].map((sub, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 flex justify-between items-center text-xs">
                <div>
                  <span className="font-mono text-cyan-400 font-bold text-xs">{sub.code}</span>
                  <h3 className="font-bold text-white text-sm mt-0.5">{sub.name}</h3>
                  <p className="text-slate-400 text-[11px] mt-1">Instructor: {sub.faculty}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 font-bold border border-indigo-800 text-[10px]">
                    {sub.type}
                  </span>
                  <span className="block font-black text-emerald-400 text-sm mt-1">{sub.credits} Credits</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 11: ATTENDANCE LOG */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" /> Attendance Telemetry & Subject Breakdown
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-center">
              <span className="text-slate-400 uppercase font-bold">Overall Attendance</span>
              <p className="text-3xl font-black text-indigo-400 my-1">88.5%</p>
              <span className="text-emerald-400 font-bold">Eligible for Exams</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-center">
              <span className="text-slate-400 uppercase font-bold">Theory Attendance</span>
              <p className="text-3xl font-black text-cyan-400 my-1">90.2%</p>
              <span className="text-slate-300">110 / 122 Classes</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-center">
              <span className="text-slate-400 uppercase font-bold">Lab Attendance</span>
              <p className="text-3xl font-black text-emerald-400 my-1">85.0%</p>
              <span className="text-slate-300">34 / 40 Sessions</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 12: EXAMS & RESULTS */}
      {/* ========================================================================= */}
      {activeTab === 'exams' && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" /> Examination Evaluation & Internal Test Scores
          </h2>

          <div className="space-y-4">
            {[
              { code: 'CS701', name: 'Cloud Computing', mid1: '23/25', mid2: '24/25', endSem: '88/100', grade: 'O (Outstanding)', point: '10' },
              { code: 'CS702', name: 'Machine Learning', mid1: '22/25', mid2: '23/25', endSem: '84/100', grade: 'A+ (Excellent)', point: '9' },
              { code: 'CS703', name: 'System Design', mid1: '21/25', mid2: '22/25', endSem: '80/100', grade: 'A (Very Good)', point: '8' }
            ].map((ex, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 flex justify-between items-center text-xs">
                <div>
                  <span className="font-mono text-cyan-400 font-bold">{ex.code}</span>
                  <h3 className="font-bold text-white text-sm">{ex.name}</h3>
                  <p className="text-slate-400 text-[11px] mt-1">Mid-1: {ex.mid1} • Mid-2: {ex.mid2} • End-Sem: {ex.endSem}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-400 text-sm block">{ex.grade}</span>
                  <span className="text-slate-400 text-[11px]">Grade Point: {ex.point}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 13: BACKLOGS & ARREARS */}
      {/* ========================================================================= */}
      {activeTab === 'backlogs' && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-emerald-400" /> Active Backlogs & Standing Arrears
          </h2>

          <div className="p-8 text-center bg-slate-900/80 border border-emerald-500/40 rounded-2xl space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-xl">
              ✓
            </div>
            <h3 className="text-xl font-extrabold text-white">No Active Backlogs / Arrears</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Student has cleared all 42 registered course subjects across Semesters 1 through 6 with zero standing backlogs.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 14: MENTOR & HOD */}
      {/* ========================================================================= */}
      {activeTab === 'mentor' && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" /> Faculty Mentorship & Leadership Telemetry
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-700 space-y-2">
              <span className="text-cyan-400 font-bold uppercase text-[11px]">Faculty Mentor</span>
              <h3 className="font-bold text-white text-sm">Dr. K. V. Rao</h3>
              <p className="text-slate-400">Professor, Computer Science</p>
              <p className="text-slate-300 font-mono">kv.rao@campus.edu</p>
              <p className="text-slate-400">Office: Block A, Room 304</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-700 space-y-2">
              <span className="text-emerald-400 font-bold uppercase text-[11px]">Class Advisor</span>
              <h3 className="font-bold text-white text-sm">Prof. S. Mehra</h3>
              <p className="text-slate-400">Associate Professor, CSE</p>
              <p className="text-slate-300 font-mono">s.mehra@campus.edu</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-700 space-y-2">
              <span className="text-purple-400 font-bold uppercase text-[11px]">Head of Department</span>
              <h3 className="font-bold text-white text-sm">Dr. A. P. J. Sharma</h3>
              <p className="text-slate-400">HOD, Dept of CSE</p>
              <p className="text-slate-300 font-mono">hod.cse@campus.edu</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 15: PLACEMENT & INTERNSHIPS */}
      {/* ========================================================================= */}
      {activeTab === 'placement' && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-400" /> Institutional Placement & Internship History
          </h2>

          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/50 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase">
                  🎉 Official Placement Offer
                </span>
                <h3 className="text-2xl font-black text-white mt-2">Google Inc.</h3>
                <p className="text-sm text-cyan-300 font-semibold">Associate Software Engineer (L3)</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400">₹28.5 LPA</span>
                <span className="block text-xs text-slate-400">Location: Bengaluru (Hybrid)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 16: HOSTEL, LIBRARY & FEES */}
      {/* ========================================================================= */}
      {activeTab === 'hostel_lib_fees' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Home className="w-4 h-4 text-emerald-400" /> Hostel Residency
            </h3>
            <p className="text-xs text-slate-300">Block B, Room 304 (Bed #2)</p>
            <p className="text-xs text-slate-400">Status: Active Resident</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <LibraryIcon className="w-4 h-4 text-cyan-400" /> Library Account
            </h3>
            <p className="text-xs text-slate-300">Books Issued: 3 Active Books</p>
            <p className="text-xs text-emerald-400">Overdue Fines: ₹0</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-400" /> Fee Accounts
            </h3>
            <p className="text-xs text-slate-300">Semester 7 Tuition Fee: Cleared</p>
            <p className="text-xs text-emerald-400 font-bold">Outstanding Balance: ₹0</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 17: DOCUMENTS & PROJECTS */}
      {/* ========================================================================= */}
      {activeTab === 'documents_projects' && (
        <div className="space-y-6">
          {/* Documents */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" /> Verified Student Documents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { name: 'Official Student Identity Card (ID)', date: '14 Aug 2023' },
                { name: 'University Admission Confirmation Letter', date: '14 Aug 2023' },
                { name: 'Class 10th Marks Memo & Certificate', date: '10 Aug 2023' },
                { name: 'Class 12th Marks Memo & Certificate', date: '10 Aug 2023' },
              ].map((doc, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white">{doc.name}</p>
                    <p className="text-slate-400 text-[10px]">Uploaded: {doc.date}</p>
                  </div>
                  <button
                    onClick={() => triggerToast(`Viewing ${doc.name}`)}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-[11px]"
                  >
                    View Document
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
