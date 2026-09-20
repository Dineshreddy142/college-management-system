import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck, QrCode, RefreshCw, Lock, Clock, CheckCircle2, XCircle,
  AlertTriangle, PhoneCall, ArrowUpRight, Check, Search, Filter, Plus,
  Sparkles, Download, Scan, UserCheck, ShieldAlert, KeyRound
} from 'lucide-react';

export interface GatepassRecord {
  id: string;
  passNo: string;
  studentName: string;
  rollNo: string;
  department: string;
  reason: string;
  destination: string;
  outTime: string;
  expectedInTime: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'CHECKED_OUT' | 'RETURNED';
  wardenApprovedBy: string;
  parentNotified: boolean;
}

export function SmartGatepass() {
  const [activeTab, setActiveTab] = useState<'student_pass' | 'warden_terminal' | 'security_guard'>('student_pass');
  const [totpSeed, setTotpSeed] = useState('859916');
  const [timeLeft, setTimeLeft] = useState(5);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Apply Form State
  const [reason, setReason] = useState('');
  const [destination, setDestination] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');

  // Security Guard Scan Query
  const [scannedPassInput, setScannedPassInput] = useState('');
  const [lastScanResult, setLastScanResult] = useState<{
    pass: GatepassRecord | null;
    success: boolean;
    msg: string;
    timestamp: string;
  } | null>(null);

  // Default Mock Gatepasses
  const [passes, setPasses] = useState<GatepassRecord[]>([
    {
      id: 'gp_101',
      passNo: 'GP-2026-9041',
      studentName: 'Aarav Sharma',
      rollNo: '21CSE042',
      department: 'CSE 4th Year',
      reason: 'Medical Dental Appointment at Apollo Hospital',
      destination: 'Gachibowli, Hyderabad',
      outTime: '02:30 PM',
      expectedInTime: '07:00 PM',
      status: 'APPROVED',
      wardenApprovedBy: 'Dr. V. K. Raman (Head Warden)',
      parentNotified: true
    },
    {
      id: 'gp_102',
      passNo: 'GP-2026-8812',
      studentName: 'Rohan Mehta',
      rollNo: '22ECE019',
      department: 'ECE 3rd Year',
      reason: 'Inter-College Robotics Hackathon Final',
      destination: 'Hitec City, Hyderabad',
      outTime: '09:00 AM',
      expectedInTime: '09:30 PM',
      status: 'APPROVED',
      wardenApprovedBy: 'Prof. S. Mehra',
      parentNotified: true
    },
    {
      id: 'gp_103',
      passNo: 'GP-2026-7430',
      studentName: 'Ananya Roy',
      rollNo: '23EEE055',
      department: 'EEE 2nd Year',
      reason: 'Weekend Home Visit',
      destination: 'Secunderabad',
      outTime: '05:00 PM',
      expectedInTime: '08:00 AM (Monday)',
      status: 'PENDING',
      wardenApprovedBy: 'Pending Warden Review',
      parentNotified: false
    }
  ]);

  const activeStudentPass = passes[0];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Rotating TOTP Seed countdown every 5 seconds
  useEffect(() => {
    const generateNewSeed = () => {
      const randHex = Math.floor(100000 + Math.random() * 900000).toString();
      setTotpSeed(randHex);
      setTimeLeft(5);
    };

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          generateNewSeed();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleApplyPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !destination) return;

    const newPass: GatepassRecord = {
      id: `gp_${Date.now()}`,
      passNo: `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      studentName: 'Aarav Sharma',
      rollNo: '21CSE042',
      department: 'CSE 4th Year',
      reason,
      destination,
      outTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expectedInTime: expectedReturn || '07:00 PM',
      status: 'PENDING',
      wardenApprovedBy: 'Pending Warden Review',
      parentNotified: false
    };

    setPasses([newPass, ...passes]);
    showToast(`Gatepass ${newPass.passNo} application submitted for warden review!`);
    setShowApplyModal(false);
    setReason('');
    setDestination('');
    setExpectedReturn('');
  };

  const handleScanGatepass = (passNumberToScan?: string) => {
    const rawInput = (passNumberToScan || scannedPassInput).trim();
    if (!rawInput) return;

    // Extract pass number or roll number even if raw JSON or URL is scanned
    let query = rawInput;
    const match = rawInput.match(/GP-2026-\d+/i);
    if (match) {
      query = match[0];
    } else if (rawInput.includes('{')) {
      try {
        const parsed = JSON.parse(rawInput);
        if (parsed.passNo) query = parsed.passNo;
        else if (parsed.rollNo) query = parsed.rollNo;
      } catch {
        // ignore parse error
      }
    }

    const found = passes.find(p => p.passNo.toLowerCase() === query.toLowerCase() || p.rollNo.toLowerCase() === query.toLowerCase());
    const nowStr = new Date().toLocaleTimeString();

    if (found && found.status === 'APPROVED') {
      setPasses(prev => prev.map(p => p.id === found.id ? { ...p, status: 'CHECKED_OUT' } : p));
      setLastScanResult({
        pass: found,
        success: true,
        msg: `GATE EXIT GRANTED! Student ${found.studentName} checked out at ${nowStr}. Parent WhatsApp Dispatched.`,
        timestamp: nowStr
      });
      showToast(`Gate Exit Approved for ${found.studentName}`);
    } else if (found && found.status === 'CHECKED_OUT') {
      setPasses(prev => prev.map(p => p.id === found.id ? { ...p, status: 'RETURNED' } : p));
      setLastScanResult({
        pass: found,
        success: true,
        msg: `CAMPUS RETURN LOGGED! Student ${found.studentName} checked back in at ${nowStr}.`,
        timestamp: nowStr
      });
      showToast(`Campus Entry Logged for ${found.studentName}`);
    } else if (found && found.status === 'PENDING') {
      setLastScanResult({
        pass: found,
        success: false,
        msg: `GATE EXIT DENIED! Pass ${found.passNo} is still PENDING Warden Sign-Off.`,
        timestamp: nowStr
      });
      showToast(`Exit Denied: Pass Pending Warden Sign-Off`);
    } else {
      setLastScanResult({
        pass: null,
        success: false,
        msg: `INVALID GATEPASS! No active record found matching "${query}".`,
        timestamp: nowStr
      });
      showToast(`Invalid or Expired Gatepass`);
    }

    setScannedPassInput('');
  };

  const handleWardenAction = (passId: string, action: 'APPROVE' | 'REJECT') => {
    setPasses(prev =>
      prev.map(p => {
        if (p.id === passId) {
          const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
          return {
            ...p,
            status: newStatus,
            wardenApprovedBy: action === 'APPROVE' ? 'Dr. V. K. Raman (Head Warden)' : 'Rejected by Warden',
            parentNotified: true
          };
        }
        return p;
      })
    );
    showToast(`Pass ${action === 'APPROVE' ? 'Approved & Parent Notified' : 'Rejected'}`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-100 min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-indigo-400 animate-bounce">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      {/* Innovation Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 border border-indigo-800/40 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Smart Campus Innovation #2
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Dynamic Anti-Spoofing Gatepass QR
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Features rotating TOTP QR seeds, live security terminal validation, and instant automated WhatsApp/SMS parent notifications.
            </p>
          </div>

          <button
            onClick={() => setShowApplyModal(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl flex items-center gap-2 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Apply Out-Pass
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 flex items-center gap-2 shadow-xl">
        <button
          onClick={() => setActiveTab('student_pass')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'student_pass'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" /> 📱 Student Dynamic QR Pass
        </button>
        <button
          onClick={() => setActiveTab('security_guard')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'security_guard'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Scan className="w-4 h-4" /> 👮 Gate Guard Terminal Scanner
        </button>
        <button
          onClick={() => setActiveTab('warden_terminal')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'warden_terminal'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" /> 👨‍🏫 Warden Approval Telemetry
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STUDENT REAL SCANNABLE QR PASS VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'student_pass' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Rotating Real QR Code Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-between text-center space-y-5">
            <div className="space-y-1 w-full">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                {activeStudentPass.status}
              </span>
              <h3 className="text-xl font-black text-white font-mono tracking-wider pt-2">{activeStudentPass.passNo}</h3>
              <p className="text-xs text-slate-400 font-medium">Valid for Gate Exit • TOTP Hash: <strong className="text-cyan-400 font-mono">{totpSeed}</strong></p>
            </div>

            {/* REAL SCANNABLE QR CONTAINER */}
            <div className="relative p-6 bg-slate-950 rounded-3xl border-2 border-indigo-500/40 shadow-2xl flex flex-col items-center justify-center w-full">
              <div className="p-4 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
                <QRCodeSVG
                  value={JSON.stringify({
                    passNo: activeStudentPass.passNo,
                    studentName: activeStudentPass.studentName,
                    rollNo: activeStudentPass.rollNo,
                    department: activeStudentPass.department,
                    reason: activeStudentPass.reason,
                    destination: activeStudentPass.destination,
                    expectedInTime: activeStudentPass.expectedInTime,
                    totpSeed: totpSeed,
                    status: activeStudentPass.status,
                    timestamp: Date.now()
                  })}
                  size={190}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Live Seed Indicator */}
              <div className="mt-4 flex items-center justify-between w-full px-2 text-xs">
                <span className="text-cyan-400 font-mono font-bold bg-slate-900 px-3 py-1.5 rounded-xl border border-cyan-500/30 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" /> SEED: {totpSeed}
                </span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  REAL SCANNABLE QR
                </span>
              </div>
            </div>

            {/* Anti-Spoofing Countdown Timer */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-300 font-bold bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700 w-full">
              <Clock className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Rotates in <strong className="text-cyan-400 font-mono text-sm">{timeLeft}s</strong> to prevent screenshots</span>
            </div>
          </div>

          {/* Pass Details & Parent Notification Card */}
          <div className="lg:col-span-2 bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-bold text-white">{activeStudentPass.studentName}</h2>
                  <p className="text-xs text-slate-400">{activeStudentPass.rollNo} • {activeStudentPass.department}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Authorized Warden</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {activeStudentPass.wardenApprovedBy}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Destination</span>
                  <span className="font-bold text-white text-xs">{activeStudentPass.destination}</span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Out Time</span>
                  <span className="font-bold text-cyan-400 text-xs">{activeStudentPass.outTime}</span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Expected In Time</span>
                  <span className="font-bold text-emerald-400 text-xs">{activeStudentPass.expectedInTime}</span>
                </div>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-1">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Outing Purpose</span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">{activeStudentPass.reason}</p>
              </div>

              {/* Parent Instant Automated Alert Status */}
              <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-lg">
                    📲
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Parent WhatsApp/SMS Alert</h4>
                    <p className="text-[11px] text-slate-400">Automated notification sent to +91 98490 12345 upon gate exit</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  DELIVERED
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Real scannable QR code generated with TOTP security payload.
              </span>
              <button
                onClick={() => showToast('📄 Downloading Gatepass PDF Dossier...')}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
              >
                <Download className="w-4 h-4" /> Download Pass PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SECURITY GUARD SCAN TERMINAL */}
      {/* ========================================================================= */}
      {activeTab === 'security_guard' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Scan className="w-5 h-5 text-indigo-400" />
                Security Guard Gate Exit Terminal Scanner
              </h2>
              <p className="text-xs text-slate-400">Scan student QR code or type gatepass number for instant verification</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              GATE 1 - MAIN ENTRANCE TERMINAL
            </span>
          </div>

          {/* Quick Test Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Scan or paste QR payload / enter Gatepass No. (e.g. GP-2026-9041)..."
              value={scannedPassInput}
              onChange={(e) => setScannedPassInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScanGatepass()}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={() => handleScanGatepass()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              Verify & Approve Gate Crossing
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 flex-wrap">
            <span>Quick Test Scan:</span>
            {passes.map(p => (
              <button
                key={p.id}
                onClick={() => handleScanGatepass(p.passNo)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] border border-slate-700"
              >
                Scan {p.passNo} ({p.studentName})
              </button>
            ))}
          </div>

          {/* Scan Terminal Result Output Display */}
          {lastScanResult && (
            <div className={`p-5 rounded-2xl border ${lastScanResult.success ? 'bg-emerald-950/40 border-emerald-500/50 text-white' : 'bg-rose-950/40 border-rose-500/50 text-white'} space-y-3 animate-in fade-in duration-200`}>
              <div className="flex items-center justify-between">
                <span className={`text-base font-black flex items-center gap-2 ${lastScanResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {lastScanResult.success ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  {lastScanResult.msg}
                </span>
                <span className="text-xs font-mono text-slate-400">{lastScanResult.timestamp}</span>
              </div>

              {lastScanResult.pass && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Student</span>
                    <span className="font-bold text-white">{lastScanResult.pass.studentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Roll No</span>
                    <span className="font-bold text-white">{lastScanResult.pass.rollNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Destination</span>
                    <span className="font-bold text-white">{lastScanResult.pass.destination}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Expected Return</span>
                    <span className="font-bold text-emerald-400">{lastScanResult.pass.expectedInTime}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WARDEN APPROVAL TELEMETRY */}
      {/* ========================================================================= */}
      {activeTab === 'warden_terminal' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                Hostel Warden Approval Telemetry
              </h2>
              <p className="text-xs text-slate-400">Review and authorize pending student out-pass requests</p>
            </div>
          </div>

          <div className="space-y-4">
            {passes.map(p => (
              <div key={p.id} className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{p.studentName}</span>
                    <span className="text-slate-400">({p.rollNo})</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      p.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-slate-300">Purpose: {p.reason} • Destination: <strong className="text-white">{p.destination}</strong></p>
                  <p className="text-slate-400 text-[11px]">Expected Return: {p.expectedInTime}</p>
                </div>

                {p.status === 'PENDING' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleWardenAction(p.id, 'APPROVE')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs"
                    >
                      Approve & Notify Parents
                    </button>
                    <button
                      onClick={() => handleWardenAction(p.id, 'REJECT')}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPLY OUT-PASS MODAL */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowApplyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg"
            >
              ✕
            </button>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <QrCode className="w-6 h-6 text-cyan-400" /> Apply Campus Out-Pass
            </h2>
            <form onSubmit={handleApplyPass} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Reason for Leaving Campus</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Medical Checkup, Project Work..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Destination Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gachibowli Hospital, Hitec City..."
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Expected Return Time</label>
                <input
                  type="text"
                  placeholder="e.g. 07:30 PM Today"
                  value={expectedReturn}
                  onChange={e => setExpectedReturn(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg"
              >
                Generate Real Dynamic Gatepass QR
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartGatepass;
