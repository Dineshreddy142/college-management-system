import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
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

  // Streamlined Tabs State
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'personal'
    | 'contact'
    | 'parent'
    | 'academic'
    | 'university_ids'
    | 'prev_education'
    | 'performance'
    | 'backlogs'
    | 'mentor'
  >('overview');

  // Editable Contact State
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactData, setContactData] = useState({
    phone: '',
    altPhone: '+91 94401 23456',
    email: '',
    address: '',
    permanentAddress: '',
    emergencyContactName: 'Rajeshwar Sharma',
    emergencyContactRelation: 'Father',
    emergencyContactPhone: '+91 98490 12345'
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    client.get('/profile').then(res => {
      const data = res.data?.data || res.data || {};
      setProfile(data);
      setContactData({
        phone: data.phone || '+91 98765 43210',
        altPhone: data.alt_phone || '+91 94401 23456',
        email: data.email || savedUser?.email || 'aarav.sharma@campus.edu',
        address: data.address || 'H.No 4-12, Tech Campus Road, Gachibowli, Hyderabad, TS, 500032',
        permanentAddress: data.permanent_address || 'Flat 302, Royal Enclave, MG Road, Vijayawada, AP, 520010',
        emergencyContactName: 'Rajeshwar Sharma',
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

  const displayName = profile?.name || profile?.full_name || savedUser?.name || 'Aarav Sharma';
  const nameParts = displayName.trim().split(/\s+/);
  const firstName = profile?.first_name || nameParts[0] || 'Aarav';
  const lastName = profile?.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Sharma');

  const studentId = profile?.student_id || profile?.admission_number || 'VTU25498';
  const rollNumber = profile?.roll_number || '21CSE042';
  const regNumber = profile?.registration_number || 'VTU2023CS8842';
  const program = profile?.program || 'B.Tech Computer Science & Engineering';
  const department = profile?.department || 'Computer Science & Engineering';
  const currentSemester = profile?.current_semester || 7;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-100 min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-indigo-400 animate-bounce">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UNIFIED SINGLE STUDENT CARD CONTAINER */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/95 border border-indigo-500/20 shadow-2xl backdrop-blur-xl">
        
        {/* Decorative ambient background glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ----------------------------------------------------------------------- */}
        {/* CARD HEADER SECTION */}
        {/* ----------------------------------------------------------------------- */}
        <div className="relative z-10 bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-950 p-6 sm:p-8 border-b border-indigo-500/20">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            
            {/* Avatar with status badge */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-1 shadow-2xl">
                <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center overflow-hidden">
                  <Avatar name={displayName} size="lg" />
                </div>
              </div>
              <span className="absolute -bottom-2 right-2 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-lg border border-emerald-300">
                {profile?.status || 'Active'}
              </span>
            </div>

            {/* Profile Information & Metadata */}
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

              {/* Quick Info Chips */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2 text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
                  <GraduationCap className="w-4 h-4 text-cyan-400" /> 4th Year • {currentSemester}th Semester (Sec A)
                </span>
                <span className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
                  <Calendar className="w-4 h-4 text-emerald-400" /> Batch: 2023–2027
                </span>
                <span className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
                  <Award className="w-4 h-4 text-amber-400" /> Reg No: {regNumber}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
              <button
                onClick={() => triggerToast('📄 Downloading Official Student Information Dossier (PDF)...')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95"
              >
                <Download className="w-4 h-4" /> Download Profile PDF
              </button>
              <button
                onClick={() => {
                  setActiveTab('contact');
                  setIsEditingContact(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <Edit2 className="w-4 h-4" /> Edit Contact Info
              </button>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* INTEGRATED TAB NAVIGATION (Scrollbar Hidden cleanly) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="relative z-10 bg-slate-950/90 border-b border-slate-800/80 px-3 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1 px-1">
            {[
              { id: 'overview', label: '📊 Overview' },
              { id: 'personal', label: '👤 Personal' },
              { id: 'contact', label: '📞 Contact & Address' },
              { id: 'parent', label: '👨‍👩‍👦 Parent & Guardian' },
              { id: 'academic', label: '🎓 Academic Details' },
              { id: 'university_ids', label: '🆔 University IDs' },
              { id: 'prev_education', label: '🏫 Previous Education' },
              { id: 'performance', label: '📈 Academic Performance' },
              { id: 'backlogs', label: '⚠️ Backlogs & Arrears' },
              { id: 'mentor', label: '👨‍🏫 Class Advisor & HOD' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  activeTab === t.id
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-indigo-950 border border-cyan-400/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CARD CONTENT BODY */}
        {/* ----------------------------------------------------------------------- */}
        <div className="relative z-10 p-6 sm:p-8 min-h-[420px]">

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" /> Academic & Performance Summary
                </h2>
                <span className="text-xs text-slate-400 font-medium">Updated for Semester 7</span>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/80 shadow-xl space-y-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Current CGPA</span>
                  <p className="text-3xl font-black text-cyan-400">8.92</p>
                  <span className="text-xs text-emerald-400 font-semibold block pt-1">★ First Class Distinction</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/80 shadow-xl space-y-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Last SGPA (Sem 6)</span>
                  <p className="text-3xl font-black text-emerald-400">9.10</p>
                  <span className="text-xs text-slate-400 block pt-1">Top 5% in CSE Department</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/80 shadow-xl space-y-1">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Backlogs</span>
                  <p className="text-3xl font-black text-emerald-400">0</p>
                  <span className="text-xs text-emerald-400 font-semibold block pt-1">✨ Clean Academic Record</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" /> Personal Identity Records
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-slate-400 block mb-1">Full Legal Name</span>
                  <span className="font-bold text-white text-sm">{displayName}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-slate-400 block mb-1">First Name</span>
                  <span className="font-bold text-white text-sm">{firstName}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-slate-400 block mb-1">Last Name</span>
                  <span className="font-bold text-white text-sm">{lastName}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-slate-400 block mb-1">Date of Birth</span>
                  <span className="font-bold text-white text-sm">{profile?.dob || '18 May 2003'}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-slate-400 block mb-1">Gender</span>
                  <span className="font-bold text-white text-sm">{profile?.gender || 'Male'}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-slate-400 block mb-1">Blood Group</span>
                  <span className="font-bold text-rose-400 text-sm">{profile?.blood_group || 'O+'}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-slate-400 block mb-1">Nationality</span>
                  <span className="font-bold text-white text-sm">{profile?.nationality || 'Indian'}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-slate-400 block mb-1">Marital Status</span>
                  <span className="font-bold text-white text-sm">{profile?.marital_status || 'Single'}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-slate-400 block mb-1">Official Student ID</span>
                  <span className="font-bold text-cyan-400 font-mono text-sm">{studentId}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT & ADDRESS INFORMATION */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-cyan-400" /> Contact Details & Communication Addresses
                </h2>
                {!isEditingContact ? (
                  <button
                    onClick={() => setIsEditingContact(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Contact Info
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <span className="text-slate-400 block font-semibold">Institutional College Email</span>
                  <span className="font-mono text-cyan-400 text-sm block">{contactData.email}</span>
                  <span className="text-[10px] text-slate-400">Official university communication handle (Primary)</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <span className="text-slate-400 block font-semibold">Student Mobile Phone</span>
                  {isEditingContact ? (
                    <input
                      type="text"
                      value={contactData.phone}
                      onChange={e => setContactData({ ...contactData, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-400"
                    />
                  ) : (
                    <span className="font-bold text-white text-sm block">{contactData.phone}</span>
                  )}
                  <span className="text-[10px] text-slate-400">SMS notification & OTP recipient</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <span className="text-cyan-400 font-bold block uppercase tracking-wider text-[11px]">Current Address</span>
                  {isEditingContact ? (
                    <textarea
                      rows={2}
                      value={contactData.address}
                      onChange={e => setContactData({ ...contactData, address: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                    />
                  ) : (
                    <p className="text-slate-200 leading-relaxed">{contactData.address}</p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <span className="text-emerald-400 font-bold block uppercase tracking-wider text-[11px]">Permanent Home Address</span>
                  {isEditingContact ? (
                    <textarea
                      rows={2}
                      value={contactData.permanentAddress}
                      onChange={e => setContactData({ ...contactData, permanentAddress: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                    />
                  ) : (
                    <p className="text-slate-200 leading-relaxed">{contactData.permanentAddress}</p>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-rose-950/30 border border-rose-800/40 rounded-2xl p-5 shadow-xl">
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

          {/* TAB 4: PARENT / GUARDIAN INFORMATION */}
          {activeTab === 'parent' && (
            <div className="space-y-6">
              <div className="pb-2 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-cyan-400" /> Parent & Legal Guardian Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">Father's Information</span>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block">Name</span>
                      <span className="font-bold text-white text-sm">Rajeshwar Sharma</span>
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
                      <span className="font-mono text-slate-300">rajeshwar.sharma@gmail.com</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Mother's Information</span>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block">Name</span>
                      <span className="font-bold text-white text-sm">Sunitha Sharma</span>
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
                      <span className="font-mono text-slate-300">sunitha.sharma@gmail.com</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ACADEMIC DETAILS */}
          {activeTab === 'academic' && (
            <div className="space-y-6">
              <div className="pb-2 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-cyan-400" /> Institutional Academic Enrollment
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-slate-400 block mb-1">Degree Program</span>
                  <span className="font-bold text-white text-sm">{program}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-slate-400 block mb-1">Department</span>
                  <span className="font-bold text-white text-sm">{department}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-slate-400 block mb-1">Specialization</span>
                  <span className="font-bold text-cyan-400 text-sm">Artificial Intelligence & Machine Learning</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-slate-400 block mb-1">Admission Type</span>
                  <span className="font-bold text-emerald-400 text-sm">Regular (EAMCET Counseling Merit)</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-slate-400 block mb-1">Admission Date</span>
                  <span className="font-bold text-white text-sm">14 Aug 2023</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-slate-400 block mb-1">Batch / Academic Session</span>
                  <span className="font-bold text-white text-sm">2023 – 2027</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: UNIVERSITY IDENTIFIERS */}
          {activeTab === 'university_ids' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-400" /> Official University Identifiers (Admin Protected)
                </h2>
                <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  🔒 Read Only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 font-mono">
                  <span className="text-slate-400 block mb-1">Student ID</span>
                  <span className="font-black text-cyan-400 text-base">{studentId}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 font-mono">
                  <span className="text-slate-400 block mb-1">Roll Number</span>
                  <span className="font-black text-emerald-400 text-base">{rollNumber}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 font-mono">
                  <span className="text-slate-400 block mb-1">University Reg Number</span>
                  <span className="font-black text-indigo-400 text-base">{regNumber}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 font-mono">
                  <span className="text-slate-400 block mb-1">Library Card ID</span>
                  <span className="font-black text-amber-400 text-base">LIB-2023-884</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 font-mono">
                  <span className="text-slate-400 block mb-1">Hostel Allocation ID</span>
                  <span className="font-black text-purple-400 text-base">HST-BLK-B-304</span>
                </div>
              </div>

              {/* REAL SCANNABLE STUDENT DIGITAL ID QR CARD */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/60 to-slate-950 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                <div className="space-y-2 text-center md:text-left">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold uppercase tracking-wider">
                    Official Student Identity Code
                  </span>
                  <h3 className="text-xl font-extrabold text-white">{displayName}</h3>
                  <p className="text-xs text-slate-300">{program} • Reg: {regNumber}</p>
                  <p className="text-[11px] text-slate-400 max-w-md pt-1">
                    Scan with any smartphone camera or campus library/gate reader to verify official university registration telemetry.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-2xl shadow-2xl shrink-0 flex items-center justify-center">
                  <QRCodeSVG
                    value={JSON.stringify({
                      studentId: studentId,
                      name: displayName,
                      regNo: regNumber,
                      rollNo: rollNumber,
                      program: program,
                      status: profile?.status || 'Active',
                      institutionalEmail: contactData.email
                    })}
                    size={130}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PREVIOUS EDUCATION */}
          {activeTab === 'prev_education' && (
            <div className="space-y-6">
              <div className="pb-2 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400" /> Prior Academic Qualifications
                </h2>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex justify-between items-center text-xs">
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

                <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex justify-between items-center text-xs">
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

          {/* TAB 8: ACADEMIC PERFORMANCE & CGPA */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="pb-2 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" /> Calculated Performance & Credit Index
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-5 rounded-xl bg-slate-800/80 border border-cyan-500/40 text-center">
                  <span className="text-xs text-slate-400 font-bold uppercase">Cumulative CGPA</span>
                  <p className="text-4xl font-black text-cyan-400 my-2">8.92</p>
                  <p className="text-xs text-slate-300">Out of 10.0 Scale</p>
                </div>
                <div className="p-5 rounded-xl bg-slate-800/80 border border-emerald-500/40 text-center">
                  <span className="text-xs text-slate-400 font-bold uppercase">Degree Completion</span>
                  <p className="text-4xl font-black text-emerald-400 my-2">88.7%</p>
                  <p className="text-xs text-slate-300">142 of 160 Credits</p>
                </div>
                <div className="p-5 rounded-xl bg-slate-800/80 border border-purple-500/40 text-center">
                  <span className="text-xs text-slate-400 font-bold uppercase">Overall Marks %</span>
                  <p className="text-4xl font-black text-purple-400 my-2">84.6%</p>
                  <p className="text-xs text-slate-300">Aggregated Across 42 Subjects</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: BACKLOGS & ARREARS */}
          {activeTab === 'backlogs' && (
            <div className="space-y-6">
              <div className="pb-2 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-emerald-400" /> Active Backlogs & Standing Arrears
                </h2>
              </div>

              <div className="p-8 text-center bg-slate-800/80 border border-emerald-500/40 rounded-2xl space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-xl">
                  ✓
                </div>
                <h3 className="text-xl font-extrabold text-white">No Active Backlogs / Arrears</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Student has cleared all registered course subjects across Semesters 1 through 6 with zero standing backlogs.
                </p>
              </div>
            </div>
          )}

          {/* TAB 10: MENTOR & HOD */}
          {activeTab === 'mentor' && (
            <div className="space-y-6">
              <div className="pb-2 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-cyan-400" /> Class Advisor & HOD Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <span className="text-emerald-400 font-bold uppercase text-[11px]">Class Advisor</span>
                  <h3 className="font-bold text-white text-sm">Prof. S. Mehra</h3>
                  <p className="text-slate-400">Associate Professor, CSE</p>
                  <p className="text-slate-300 font-mono">s.mehra@campus.edu</p>
                </div>

                <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <span className="text-purple-400 font-bold uppercase text-[11px]">Head of Department</span>
                  <h3 className="font-bold text-white text-sm">Dr. A. P. J. Sharma</h3>
                  <p className="text-slate-400">HOD, Dept of CSE</p>
                  <p className="text-slate-300 font-mono">hod.cse@campus.edu</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
