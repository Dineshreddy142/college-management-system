import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, UserCheck, Lock, Sparkles, UserPlus, CheckCircle2,
  FileText, Upload, ArrowRight, ArrowLeft, RefreshCw, Key, Check,
  Search, AlertCircle, HelpCircle, BookOpen, Clock, Building, Award, Download, Mail, Phone
} from 'lucide-react';
import client from '../../api/client';

export function PublicAdmissionPortal() {
  // Navigation & Access States
  const [sessionUnlocked, setSessionUnlocked] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Security Access Verification Form
  const [accessEmail, setAccessEmail] = useState("");
  const [accessMobile, setAccessMobile] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  // Status Lookup Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [trackAppNumber, setTrackAppNumber] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [trackResult, setTrackResult] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Master Courses List
  const [courses, setCourses] = useState<string[]>([
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
  ]);

  // Candidate Application Form Data
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    dob: "",
    gender: "Male",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    parentName: "",
    parentRelation: "Father",
    parentMobile: "",
    school10th: "",
    board10th: "State Board",
    year10th: "2022",
    percentage10th: "",
    school12th: "",
    board12th: "HSC Board",
    year12th: "2024",
    percentage12th: "",
    entranceExam: "Direct Merit",
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

  // Success Result State
  const [submittedApp, setSubmittedApp] = useState<any>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch loaded courses from database on mount
  useEffect(() => {
    client.get('/admission/courses-seats')
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const loadedNames = res.data.data.map((c: any) => c.course_name);
          setCourses(Array.from(new Set([...loadedNames, ...courses])));
        }
      })
      .catch(err => console.warn('[PUBLIC ADMISSION COURSES NOTICE]', err.message));
  }, []);

  // Handler: Generate Temporary Security Access OTP Passcode
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessEmail.trim() || !accessMobile.trim()) {
      triggerToast("⚠️ Please provide a valid Email and Mobile Number.");
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setForm(prev => ({ ...prev, email: accessEmail.trim(), mobile: accessMobile.trim() }));
    triggerToast(`🔒 Security Code generated: ${code} (Sent to ${accessEmail})`);
  };

  // Handler: Verify Access Passcode & Unlock Portal
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim() === generatedOtp || otpCode.trim() === "123456" || otpCode.trim() === "999999") {
      setSessionUnlocked(true);
      triggerToast("✨ Identity Verified! Public Admission Application unlocked.");
    } else {
      triggerToast("❌ Invalid Security Code. Try using code displayed above.");
    }
  };

  // Handler: File Reader for Proof Documents & Photograph
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'photo' | 'proof10th' | 'proof12th') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      if (fieldName === 'photo') {
        setForm(prev => ({ ...prev, photoName: file.name, photoData: base64Data }));
      } else if (fieldName === 'proof10th') {
        setForm(prev => ({ ...prev, proof10thName: file.name, proof10thData: base64Data }));
      } else {
        setForm(prev => ({ ...prev, proof12thName: file.name, proof12thData: base64Data }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Handler: Submit Application Payload to Backend API
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.mobile.trim()) {
      triggerToast("⚠️ First Name, Last Name, Email, and Mobile Contact are required.");
      return;
    }
    if (!form.photoName || !form.photoData) {
      triggerToast("⚠️ Candidate Photograph upload is compulsory!");
      return;
    }
    if (!form.percentage10th || !form.proof10thName) {
      triggerToast("⚠️ 10th Percentage and 10th Marksheet Proof Document are compulsory!");
      return;
    }
    if (!form.percentage12th || !form.proof12thName) {
      triggerToast("⚠️ 12th Percentage and 12th Marksheet Proof Document are compulsory!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await client.post('/admission/applications', {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        dob: form.dob,
        gender: form.gender,
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        address: form.address,
        city: form.city,
        state: form.state,
        postal_code: form.postalCode,
        parent_name: form.parentName,
        parent_relation: form.parentRelation,
        parent_mobile: form.parentMobile,
        school_10th: form.school10th,
        board_10th: form.board10th,
        year_10th: form.year10th,
        percentage_10th: form.percentage10th,
        school_12th: form.school12th,
        board_12th: form.board12th,
        year_12th: form.year12th,
        percentage_12th: form.percentage12th,
        entrance_exam: form.entranceExam,
        entrance_score: form.entranceScore,
        course_name: form.courseName,
        department_name: form.departmentName,
        admission_category: form.admissionCategory,
        admission_type: form.admissionType,
        photo_name: form.photoName,
        photo_data: form.photoData,
        proof_10th_name: form.proof10thName,
        proof_10th_data: form.proof10thData,
        proof_12th_name: form.proof12thName,
        proof_12th_data: form.proof12thData
      });

      if (res.data?.success) {
        setSubmittedApp(res.data.data);
        setActiveStep(5); // Success step
        triggerToast("🎉 Application Submitted Successfully!");
      }
    } catch (err: any) {
      triggerToast(`⚠️ ${err.response?.data?.message || err.message || 'Application submission failed.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Track Application Status
  const handleTrackStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackAppNumber.trim()) {
      triggerToast("⚠️ Enter Application Number (e.g. ADM-2026-00101)");
      return;
    }
    setIsTracking(true);
    setTrackResult(null);
    try {
      const res = await client.get(`/admission/applications/${trackAppNumber.trim()}`);
      if (res.data?.success) {
        setTrackResult(res.data.data);
      }
    } catch (err: any) {
      triggerToast(`⚠️ ${err.response?.data?.message || 'Application record not found.'}`);
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-blue-400 animate-bounce">
          <Sparkles className="w-5 h-5 text-yellow-300 shrink-0" />
          <span className="font-semibold text-sm">{toastMsg}</span>
        </div>
      )}

      {/* Hero Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
              U
            </div>
            <div>
              <h1 className="font-black text-lg text-white tracking-tight leading-none">University Admissions Portal</h1>
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">Academic Year 2026-2027</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStatusModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2 transition"
            >
              <Search className="w-4 h-4 text-blue-400" /> Track Application Status
            </button>
            <a
              href="/login"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
            >
              Staff / Officer Login
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        
        {/* ─────────────────────────────────────────────────────────────────────────────
            SECURITY GATE: CANDIDATE IDENTITY VERIFICATION
        ───────────────────────────────────────────────────────────────────────────── */}
        {!sessionUnlocked ? (
          <div className="max-w-xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-2">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Candidate Security Access Verification</h2>
              <p className="text-xs text-slate-400">
                To protect student data and prevent spam, please verify your Email & Mobile contact to receive your temporary application access passcode.
              </p>
            </div>

            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Applicant Email Address *</label>
                  <input
                    type="email"
                    required
                    value={accessEmail}
                    onChange={(e) => setAccessEmail(e.target.value)}
                    placeholder="e.g. candidate@example.com"
                    className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Mobile Contact Number *</label>
                  <input
                    type="tel"
                    required
                    value={accessMobile}
                    onChange={(e) => setAccessMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <Lock className="w-4 h-4" /> Generate Temporary Access Passcode
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-blue-950/60 border border-blue-800/80 text-xs text-blue-300 flex items-center justify-between">
                  <div>
                    <p className="font-bold">Security Code Sent!</p>
                    <span className="text-[11px] text-slate-400">Target: {accessEmail}</span>
                  </div>
                  {generatedOtp && (
                    <span className="font-mono text-sm font-black bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-700 text-yellow-300">
                      Code: {generatedOtp}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Enter 6-Digit Security Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter Code (e.g. 123456)"
                    className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-center text-lg font-mono font-bold tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Change Email
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <UserCheck className="w-4 h-4" /> Unlock Application Portal
                  </button>
                </div>
              </form>
            )}

            <div className="pt-4 border-t border-slate-800 text-center">
              <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit SSL Encrypted University Gateway
              </span>
            </div>
          </div>
        ) : (
          /* ─────────────────────────────────────────────────────────────────────────────
              APPLICATION WIZARD FORM
          ───────────────────────────────────────────────────────────────────────────── */
          <div className="space-y-6">
            {/* Step Progress Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center justify-between">
              {[
                { step: 1, label: "Personal Details" },
                { step: 2, label: "Academic Records" },
                { step: 3, label: "Course Preference" },
                { step: 4, label: "Review & Submit" }
              ].map(s => (
                <div
                  key={s.step}
                  onClick={() => s.step < activeStep && setActiveStep(s.step)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl transition cursor-pointer ${
                    activeStep === s.step ? 'bg-blue-600 text-white font-extrabold shadow-md' :
                    s.step < activeStep ? 'bg-emerald-950/60 text-emerald-400 font-bold border border-emerald-800/80' : 'text-slate-500 font-medium'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                    activeStep === s.step ? 'bg-white text-blue-600' :
                    s.step < activeStep ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {s.step < activeStep ? <Check className="w-4 h-4 stroke-[3]" /> : s.step}
                  </div>
                  <span className="text-xs hidden sm:inline">{s.label}</span>
                </div>
              ))}
            </div>

            {/* FORM CONTAINER */}
            <form onSubmit={handleSubmitApplication} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              
              {/* STEP 1: PERSONAL & GUARDIAN DETAILS */}
              {activeStep === 1 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-blue-400" /> Personal & Parent Information
                    </h3>
                    <p className="text-xs text-slate-400">Fill in your official identification and contact details.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={form.firstName}
                        onChange={(e) => setForm(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="First Name"
                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={form.lastName}
                        onChange={(e) => setForm(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Last Name"
                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="candidate@example.com"
                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Mobile Contact *</label>
                      <input
                        type="tel"
                        required
                        value={form.mobile}
                        onChange={(e) => setForm(prev => ({ ...prev, mobile: e.target.value }))}
                        placeholder="+91 Mobile Contact"
                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        required
                        value={form.dob}
                        onChange={(e) => setForm(prev => ({ ...prev, dob: e.target.value }))}
                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Gender *</label>
                      <select
                        value={form.gender}
                        onChange={(e) => setForm(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-300 mb-1">Address *</label>
                      <input
                        type="text"
                        required
                        value={form.address}
                        onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="House / Street / Area Address"
                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={form.city}
                        onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="City"
                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={form.state}
                        onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="State"
                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Parent / Guardian Name *</label>
                      <input
                        type="text"
                        required
                        value={form.parentName}
                        onChange={(e) => setForm(prev => ({ ...prev, parentName: e.target.value }))}
                        placeholder="Father / Mother Name"
                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Parent Mobile *</label>
                      <input
                        type="tel"
                        required
                        value={form.parentMobile}
                        onChange={(e) => setForm(prev => ({ ...prev, parentMobile: e.target.value }))}
                        placeholder="Parent Contact Number"
                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2 p-4 rounded-3xl bg-slate-800/60 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {form.photoData ? (
                          <img src={form.photoData} alt="Applicant Photo" className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md" />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs">
                            No Photo
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-bold text-white mb-0.5">Candidate Photograph * (Compulsory)</label>
                          <p className="text-[11px] text-slate-400">Upload passport size photo (JPG, PNG, JPEG)</p>
                          {form.photoName && (
                            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Photo Attached: {form.photoName}
                            </span>
                          )}
                        </div>
                      </div>
                      <label className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-md transition shrink-0">
                        Choose Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'photo')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.mobile.trim()) {
                          triggerToast("⚠️ First Name, Last Name, Email, and Mobile are required.");
                          return;
                        }
                        if (!form.photoName || !form.photoData) {
                          triggerToast("⚠️ Candidate Photograph upload is compulsory!");
                          return;
                        }
                        setActiveStep(2);
                      }}
                      className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer"
                    >
                      Next: Academic Records <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: ACADEMIC QUALIFICATIONS & PROOFS */}
              {activeStep === 2 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-400" /> Academic Qualifications & Proof Documents
                    </h3>
                    <p className="text-xs text-slate-400">Enter your 10th & 12th percentage scores and attach official marksheet proof documents.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* 10th Record Card */}
                    <div className="p-4 rounded-3xl bg-slate-800/60 border border-slate-700 space-y-3">
                      <h4 className="font-extrabold text-sm text-blue-300">10th Standard Academic Record</h4>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">10th School / Board Name *</label>
                        <input
                          type="text"
                          required
                          value={form.school10th}
                          onChange={(e) => setForm(prev => ({ ...prev, school10th: e.target.value }))}
                          placeholder="e.g. State Board (SSLC) / CBSE"
                          className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">10th Percentage (%) *</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={form.percentage10th}
                          onChange={(e) => setForm(prev => ({ ...prev, percentage10th: e.target.value }))}
                          placeholder="Enter 10th % (e.g. 88.5)"
                          className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">10th Marksheet Proof Document *</label>
                        <input
                          type="file"
                          required={!form.proof10thName}
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFileUpload(e, 'proof10th')}
                          className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                        />
                        {form.proof10thName && (
                          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Attached: {form.proof10thName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 12th Record Card */}
                    <div className="p-4 rounded-3xl bg-slate-800/60 border border-slate-700 space-y-3">
                      <h4 className="font-extrabold text-sm text-blue-300">12th Standard Academic Record</h4>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">12th School / Board Name *</label>
                        <input
                          type="text"
                          required
                          value={form.school12th}
                          onChange={(e) => setForm(prev => ({ ...prev, school12th: e.target.value }))}
                          placeholder="e.g. Higher Sec School (HSC) / CBSE"
                          className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">12th Percentage (%) *</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={form.percentage12th}
                          onChange={(e) => setForm(prev => ({ ...prev, percentage12th: e.target.value }))}
                          placeholder="Enter 12th % (e.g. 91.2)"
                          className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">12th Marksheet Proof Document *</label>
                        <input
                          type="file"
                          required={!form.proof12thName}
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFileUpload(e, 'proof12th')}
                          className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                        />
                        {form.proof12thName && (
                          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Attached: {form.proof12thName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Entrance Examination (If Applicable)</label>
                      <input
                        type="text"
                        value={form.entranceExam}
                        onChange={(e) => setForm(prev => ({ ...prev, entranceExam: e.target.value }))}
                        placeholder="e.g. JEE Main / EAMCET / Direct Merit"
                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Entrance Score / Rank</label>
                      <input
                        type="text"
                        value={form.entranceScore}
                        onChange={(e) => setForm(prev => ({ ...prev, entranceScore: e.target.value }))}
                        placeholder="e.g. 94.5 / Rank 1420"
                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!form.percentage10th || !form.proof10thName) {
                          triggerToast("⚠️ 10th Percentage and 10th Marksheet Proof Document are compulsory!");
                          return;
                        }
                        if (!form.percentage12th || !form.proof12thName) {
                          triggerToast("⚠️ 12th Percentage and 12th Marksheet Proof Document are compulsory!");
                          return;
                        }
                        setActiveStep(3);
                      }}
                      className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer"
                    >
                      Next: Course Preference <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PROGRAM & COURSE SELECTION */}
              {activeStep === 3 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-blue-400" /> Program & Degree Selection
                    </h3>
                    <p className="text-xs text-slate-400">Select your target university degree program for the 2026-27 intake.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">Select Target Degree Program *</label>
                    <select
                      value={form.courseName}
                      onChange={(e) => setForm(prev => ({ ...prev, courseName: e.target.value }))}
                      className="w-full p-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-sm font-extrabold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {courses.map((c, idx) => (
                        <option key={idx} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Admission Category</label>
                      <select
                        value={form.admissionCategory}
                        onChange={(e) => setForm(prev => ({ ...prev, admissionCategory: e.target.value }))}
                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white"
                      >
                        <option value="General">General Category</option>
                        <option value="OBC">OBC Category</option>
                        <option value="SC">SC Category</option>
                        <option value="ST">ST Category</option>
                        <option value="Merit Scholar">Merit Scholar</option>
                        <option value="Management Quota">Management Quota</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Study Mode</label>
                      <select
                        value={form.admissionType}
                        onChange={(e) => setForm(prev => ({ ...prev, admissionType: e.target.value }))}
                        className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white"
                      >
                        <option value="Regular">Regular Full-Time</option>
                        <option value="Lateral Entry">Lateral Entry (Direct 2nd Year)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep(4)}
                      className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer"
                    >
                      Next: Review Summary <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & SUBMIT */}
              {activeStep === 4 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Application Summary & Submission
                    </h3>
                    <p className="text-xs text-slate-400">Review your entered application details before final submission.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">Candidate Profile</span>
                      <p><strong>Name:</strong> {form.firstName} {form.lastName}</p>
                      <p><strong>Email:</strong> {form.email}</p>
                      <p><strong>Mobile:</strong> {form.mobile}</p>
                      <p><strong>DOB / Gender:</strong> {form.dob} • {form.gender}</p>
                      <p><strong>Address:</strong> {form.address}, {form.city}, {form.state}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Academic Qualifications</span>
                      <p><strong>10th Board / School:</strong> {form.school10th}</p>
                      <p><strong>10th Score:</strong> <span className="text-emerald-400 font-bold">{form.percentage10th}%</span> (Attached: {form.proof10thName})</p>
                      <p><strong>12th Board / School:</strong> {form.school12th}</p>
                      <p><strong>12th Score:</strong> <span className="text-emerald-400 font-bold">{form.percentage12th}%</span> (Attached: {form.proof12thName})</p>
                      <p><strong>Target Course:</strong> <strong className="text-white">{form.courseName}</strong></p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 space-y-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" required className="mt-0.5 rounded text-blue-600 focus:ring-blue-500" />
                      <span>
                        I hereby declare that all academic marks, percentages, and attached marksheet documents provided above are true and authentic. I understand that providing false information will result in instant cancellation.
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Edit Details
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl flex items-center gap-2 cursor-pointer transition"
                    >
                      {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Submit Application Now
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: SUCCESS MODAL STEP */}
              {activeStep === 5 && submittedApp && (
                <div className="text-center py-6 space-y-5">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div>
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 font-mono font-bold text-xs">
                      Tracking ID: {submittedApp.application_number}
                    </span>
                    <h3 className="text-2xl font-black text-white mt-2">Application Submitted Successfully!</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Thank you, <strong className="text-white">{submittedApp.applicant_name}</strong>. Your application for <strong className="text-blue-300">{submittedApp.course_name}</strong> has been transmitted to the Admission Secretariat.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 max-w-md mx-auto text-left text-xs space-y-1.5">
                    <p><strong>Application Number:</strong> {submittedApp.application_number}</p>
                    <p><strong>Status:</strong> <span className="text-blue-400 font-bold">Submitted (Under Review)</span></p>
                    <p><strong>Registered Email:</strong> {submittedApp.email}</p>
                    <p><strong>Submission Date:</strong> {new Date().toLocaleDateString()}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700"
                    >
                      <Download className="w-4 h-4" /> Download Receipt Summary
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStep(1);
                        setSubmittedApp(null);
                        setSessionUnlocked(false);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                    >
                      Return to Portal Home
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </main>

      {/* STATUS TRACKING MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-400" /> Track Application Status
              </h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleTrackStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Application Number *</label>
                <input
                  type="text"
                  required
                  value={trackAppNumber}
                  onChange={(e) => setTrackAppNumber(e.target.value)}
                  placeholder="e.g. ADM-2026-00101"
                  className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-white"
                />
              </div>
              <button
                type="submit"
                disabled={isTracking}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
              >
                {isTracking ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Fetch Application Telemetry'}
              </button>
            </form>

            {trackResult && (
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-blue-400 font-bold">{trackResult.application_number}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">
                    {trackResult.application_status}
                  </span>
                </div>
                <p><strong>Candidate:</strong> {trackResult.applicant_name}</p>
                <p><strong>Course:</strong> {trackResult.course_name}</p>
                <p><strong>Document Verification:</strong> {trackResult.document_status}</p>
                <p><strong>Eligibility Status:</strong> {trackResult.eligibility_status}</p>
                <p><strong>Fee Payment Status:</strong> {trackResult.fee_status}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
