import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, QrCode, RefreshCw, Lock, Clock, CheckCircle2, XCircle,
  Smartphone, UserCheck, Bell, Building, Check, AlertTriangle, ChevronRight, Scan
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
  status: 'APPROVED' | 'PENDING' | 'CHECKED_OUT' | 'RETURNED' | 'DENIED';
  wardenApprovedBy: string;
  parentNotified: boolean;
}

const INITIAL_PASSES: GatepassRecord[] = [
  {
    id: 'gp_1',
    passNo: 'GP-2026-9041',
    studentName: 'Sneha Reddy',
    rollNo: '21CSE104',
    department: 'CSE 3rd Year',
    reason: 'Medical appointment at City Hospital',
    destination: 'Apollo Hospital, Main City',
    outTime: '11:30 AM',
    expectedInTime: '04:00 PM',
    status: 'APPROVED',
    wardenApprovedBy: 'Warden Dr. S. Rao',
    parentNotified: true
  },
  {
    id: 'gp_2',
    passNo: 'GP-2026-8812',
    studentName: 'Aniket Gupta',
    rollNo: '22MECH015',
    department: 'MECH 2nd Year',
    reason: 'Weekend Home Visit',
    destination: 'Hyderabad Residence',
    outTime: '05:00 PM',
    expectedInTime: 'Monday 08:00 AM',
    status: 'CHECKED_OUT',
    wardenApprovedBy: 'Warden Prof. M. Verma',
    parentNotified: true
  },
  {
    id: 'gp_3',
    passNo: 'GP-2026-7640',
    studentName: 'Rahul Sharma',
    rollNo: '21CSE042',
    department: 'CSE 3rd Year',
    reason: 'Personal Emergency',
    destination: 'Secunderabad',
    outTime: '12:00 PM',
    expectedInTime: '06:00 PM',
    status: 'PENDING',
    wardenApprovedBy: 'Pending Review',
    parentNotified: false
  }
];

export const SmartGatepass: React.FC = () => {
  const [passes, setPasses] = useState<GatepassRecord[]>(INITIAL_PASSES);
  const [activeTab, setActiveTab] = useState<'STUDENT_PASS' | 'SECURITY_SCANNER' | 'PASS_LOGS'>('STUDENT_PASS');

  // TOTP Rotating Seed & Timer
  const [totpSeed, setTotpSeed] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(5);
  const [toast, setToast] = useState<string | null>(null);

  // Security Scanner State
  const [scannedPassInput, setScannedPassInput] = useState<string>('');
  const [lastScanResult, setLastScanResult] = useState<{
    pass: GatepassRecord | null;
    success: boolean;
    msg: string;
    timestamp: string;
  } | null>(null);

  // New Pass Form
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [reason, setReason] = useState('');
  const [destination, setDestination] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');

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

    generateNewSeed();

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
      studentName: 'Sneha Reddy',
      rollNo: '21CSE104',
      department: 'CSE 3rd Year',
      reason,
      destination,
      outTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expectedInTime: expectedReturn || '06:00 PM',
      status: 'APPROVED', // Auto-approved demo
      wardenApprovedBy: 'Auto-Verified Warden AI',
      parentNotified: true
    };

    setPasses([newPass, ...passes]);
    showToast(`Gatepass ${newPass.passNo} created & sent to parents via SMS!`);
    setShowApplyModal(false);
    setReason('');
    setDestination('');
  };

  const handleScanGatepass = (passNumberToScan?: string) => {
    const query = (passNumberToScan || scannedPassInput).trim();
    if (!query) return;

    const found = passes.find(p => p.passNo.toLowerCase() === query.toLowerCase() || p.rollNo.toLowerCase() === query.toLowerCase());
    const nowStr = new Date().toLocaleTimeString();

    if (found && found.status === 'APPROVED') {
      setPasses(prev => prev.map(p => p.id === found.id ? { ...p, status: 'CHECKED_OUT' } : p));
      setLastScanResult({
        pass: found,
        success: true,
        msg: `GATE EXIT GRANTED! Student ${found.studentName} checked out at ${nowStr}. Parent SMS Dispatched.`,
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
      showToast(`Exit Denied: Pass Pending Warden Sign-Off`, 'error');
    } else {
      setLastScanResult({
        pass: null,
        success: false,
        msg: `INVALID OR EXPIRED GATEPASS! No active record found for "${query}".`,
        timestamp: nowStr
      });
    }

    setScannedPassInput('');
  };

  const activeStudentPass = passes.find(p => p.rollNo === '21CSE104') || passes[0];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 select-none">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-indigo-900/40 shadow-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Biometric Anti-Spoofing Gate Security</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Smart Dynamic Campus Gatepass</h1>
          <p className="text-xs text-slate-300">
            Features rotating TOTP QR seeds, live security terminal validation, and instant automated WhatsApp/SMS parent notifications.
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
        >
          <QrCode className="w-4 h-4" />
          <span>+ Apply New Gatepass</span>
        </button>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex bg-slate-200 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-300 dark:border-slate-800 text-xs font-bold max-w-md">
        <button
          onClick={() => setActiveTab('STUDENT_PASS')}
          className={`flex-1 py-2 rounded-xl transition-all ${activeTab === 'STUDENT_PASS' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-white'}`}
        >
          📱 Student QR Pass
        </button>
        <button
          onClick={() => setActiveTab('SECURITY_SCANNER')}
          className={`flex-1 py-2 rounded-xl transition-all ${activeTab === 'SECURITY_SCANNER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-white'}`}
        >
          🔍 Security Gate Terminal
        </button>
        <button
          onClick={() => setActiveTab('PASS_LOGS')}
          className={`flex-1 py-2 rounded-xl transition-all ${activeTab === 'PASS_LOGS' ? 'bg-slate-800 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-white'}`}
        >
          📋 Gate Pass Logs
        </button>
      </div>

      {/* TAB 1: STUDENT QR PASS VIEW */}
      {activeTab === 'STUDENT_PASS' && activeStudentPass && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Rotating QR Code Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-5 flex flex-col items-center text-center relative overflow-hidden">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black tracking-widest uppercase">
                {activeStudentPass.status}
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">{activeStudentPass.passNo}</h3>
              <p className="text-xs text-slate-400">Valid for Gate Exit • TOTP Hash: <span className="font-mono text-blue-400 font-bold">{totpSeed}</span></p>
            </div>

            {/* Rotating SVG Anti-Spoofing QR Container */}
            <div className="relative p-6 bg-slate-950 rounded-3xl border-2 border-indigo-500/40 shadow-2xl flex items-center justify-center">
              {/* Dynamic QR Grid Visualizer */}
              <div className="w-48 h-48 bg-slate-900 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between">
                  <div className="w-10 h-10 border-4 border-blue-500 bg-slate-950 rounded-lg p-1">
                    <div className="w-full h-full bg-blue-500 rounded-sm" />
                  </div>
                  <div className="w-10 h-10 border-4 border-blue-500 bg-slate-950 rounded-lg p-1">
                    <div className="w-full h-full bg-blue-500 rounded-sm" />
                  </div>
                </div>

                {/* Animated TOTP Scan Line */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-lg top-1/2" />

                {/* Simulated QR Code Blocks */}
                <div className="grid grid-cols-5 gap-1.5 opacity-80 my-auto">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-4 rounded ${((i + Number(totpSeed)) % 3 === 0) ? 'bg-indigo-400' : 'bg-slate-800'}`}
                    />
                  ))}
                </div>

                <div className="flex justify-between items-end">
                  <div className="w-10 h-10 border-4 border-blue-500 bg-slate-950 rounded-lg p-1">
                    <div className="w-full h-full bg-blue-500 rounded-sm" />
                  </div>
                  <div className="text-[10px] font-mono font-bold text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-cyan-500/30">
                    SEED-{totpSeed}
                  </div>
                </div>
              </div>
            </div>

            {/* Anti-Spoofing Countdown Ring Timer */}
            <div className="flex items-center gap-2 text-xs text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl">
              <Clock className="w-4 h-4 text-blue-500 animate-spin" />
              <span>Rotates in <strong className="text-blue-500 font-mono text-sm">{timeLeft}s</strong> to prevent screenshots</span>
            </div>
          </div>

          {/* Pass Details & Parent Notification Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{activeStudentPass.studentName}</h2>
                  <p className="text-xs text-slate-400">{activeStudentPass.rollNo} • {activeStudentPass.department}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Authorized Warden</span>
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {activeStudentPass.wardenApprovedBy}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">Purpose / Reason</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activeStudentPass.reason}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">Destination</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activeStudentPass.destination}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">Expected Return</span>
                  <span className="font-bold text-blue-500">{activeStudentPass.expectedInTime}</span>
                </div>
              </div>

              {/* Automated Parent Notification Broadcaster Log */}
              <div className="bg-emerald-950/30 border border-emerald-800/40 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-emerald-400 font-bold text-xs">
                  <span className="flex items-center gap-2">
                    <Bell className="w-4 h-4 animate-bounce" />
                    Automated Parent SMS/WhatsApp Sync
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full">ACTIVE BROADCASTER</span>
                </div>
                <p className="text-xs text-slate-300">
                  📲 Notification sent to parent mobile (+91 98765*****): <br />
                  <em className="text-slate-400 font-mono">"EduERP Alert: Sneha Reddy (21CSE104) gatepass GP-2026-9041 approved for Medical appointment."</em>
                </p>
              </div>
            </div>

            <div className="pt-3 text-center text-xs text-slate-400">
              💡 Show this dynamic QR code at the main campus gate terminal for instant exit clearance.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY GATE TERMINAL SCANNER VIEW */}
      {activeTab === 'SECURITY_SCANNER' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Scan className="w-5 h-5 text-indigo-500" />
                Security Guard Gate Exit Terminal
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
              placeholder="Enter Gatepass No. (e.g. GP-2026-9041) or Roll No (21CSE104)..."
              value={scannedPassInput}
              onChange={(e) => setScannedPassInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScanGatepass()}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white"
            />
            <button
              onClick={() => handleScanGatepass()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              Verify & Approve Gate Crossing
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>Quick Test Scan:</span>
            {passes.map(p => (
              <button
                key={p.id}
                onClick={() => handleScanGatepass(p.passNo)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-500 text-[11px]"
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
                    <span className="text-slate-400 block text-[10px]">Expected In</span>
                    <span className="font-bold text-blue-400">{lastScanResult.pass.expectedInTime}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PASS LOGS */}
      {activeTab === 'PASS_LOGS' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Campus Gate Pass Ledger</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-2">Pass No</th>
                  <th className="py-3 px-2">Student</th>
                  <th className="py-3 px-2">Reason</th>
                  <th className="py-3 px-2">Out Time</th>
                  <th className="py-3 px-2">Return Time</th>
                  <th className="py-3 px-2">Parent Notified</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {passes.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-2 font-mono font-bold text-blue-500">{p.passNo}</td>
                    <td className="py-3 px-2">
                      <span className="font-bold block text-slate-900 dark:text-white">{p.studentName}</span>
                      <span className="text-[10px] text-slate-400">{p.rollNo}</span>
                    </td>
                    <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{p.reason}</td>
                    <td className="py-3 px-2 font-mono">{p.outTime}</td>
                    <td className="py-3 px-2 font-mono">{p.expectedInTime}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        ✓ SMS Sent
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${p.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : p.status === 'CHECKED_OUT' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Gatepass Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md text-slate-100 space-y-4 shadow-2xl relative">
            <button onClick={() => setShowApplyModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Apply Out-Pass</h3>
              <p className="text-xs text-slate-400">Request Warden approval for campus exit</p>
            </div>

            <form onSubmit={handleApplyPass} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-slate-300 mb-1">Reason for Leaving</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="E.g., Doctor appointment, Family function..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Destination Address</label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="City hospital, Home address..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Expected Return Time</label>
                <input
                  type="text"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(e.target.value)}
                  placeholder="E.g., 06:00 PM"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button type="button" onClick={() => setShowApplyModal(false)} className="w-1/2 py-2.5 bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl">Submit Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartGatepass;
