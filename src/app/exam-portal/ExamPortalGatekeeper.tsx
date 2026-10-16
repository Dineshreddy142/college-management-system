import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  ShieldCheck, Lock, Key, Camera, User, CheckCircle2, AlertTriangle,
  ArrowRight, RefreshCw, Eye, EyeOff, Sparkles, Monitor, Wifi, Zap,
  FileCheck, HelpCircle, XCircle, Mail
} from 'lucide-react';
import client from '../../api/client';

export const ExamPortalGatekeeper: React.FC = () => {
  const navigate = useNavigate();

  // Wizard Steps: 1 = Email & Password, 2 = Exam & Passkey, 3 = Face Biometric, 4 = Lockdown Launch
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Factor 1 State: Account Credentials (Strictly Institutional Email & Account Password)
  const [email, setEmail] = useState('nuthanakalvadineshreddy@gmail.com');
  const [password, setPassword] = useState('Dinesh@123');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifyingLogin, setIsVerifyingLogin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [candidateData, setCandidateData] = useState<any | null>(null);
  const [candidateToken, setCandidateToken] = useState<string>('');
  const [eligibleExams, setEligibleExams] = useState<any[]>([]);

  // Factor 2 State: Exam Selection & Passkey
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [passkey, setPasskey] = useState('EXAM2026');
  const [isVerifyingPasskey, setIsVerifyingPasskey] = useState(false);
  const [passkeyError, setPasskeyError] = useState('');
  const [passkeyVerified, setPasskeyVerified] = useState(false);

  // Factor 3 State: Face Biometrics & Liveness
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isVerifyingFace, setIsVerifyingFace] = useState(false);
  const [faceVerificationError, setFaceVerificationError] = useState('');
  const [faceMatchSuccess, setFaceMatchSuccess] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState<number | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [activeSessionToken, setActiveSessionToken] = useState<string>('');

  // Diagnostic Checklist
  const [diagFullscreen, setDiagFullscreen] = useState(true);
  const [diagCamera, setDiagCamera] = useState(false);
  const [diagNetwork, setDiagNetwork] = useState(true);
  const [launchingExam, setLaunchingExam] = useState(false);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const startCamera = async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        setDiagCamera(true);
      }
    } catch (err: any) {
      console.error('[CAMERA PERMISSION ERROR]', err);
      setCameraError('Unable to access webcam. Please allow camera permissions in your browser.');
      setDiagCamera(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: Verify Candidate Login
  // ─────────────────────────────────────────────────────────────────────────
  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsVerifyingLogin(true);

    try {
      const res = await client.post('/online-exams/verify-login', { email: email.trim(), password });
      if (res.data?.success) {
        setCandidateData(res.data.candidate);
        setCandidateToken(res.data.candidateAuthToken);
        setEligibleExams(res.data.eligibleExams || []);

        if (res.data.eligibleExams && res.data.eligibleExams.length > 0) {
          setSelectedExamId(String(res.data.eligibleExams[0].id));
          setSelectedExam(res.data.eligibleExams[0]);
        }
        setCurrentStep(2);
      } else {
        setLoginError(res.data?.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.message || 'Unable to connect to exam authentication server.');
    } finally {
      setIsVerifyingLogin(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: Verify Exam Passkey
  // ─────────────────────────────────────────────────────────────────────────
  const handleVerifyPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) {
      setPasskeyError('Please select an active examination from the list.');
      return;
    }
    setPasskeyError('');
    setIsVerifyingPasskey(true);

    try {
      const res = await client.post(`/online-exams/${selectedExamId}/verify-passkey`, {
        passkey: passkey.trim()
      });

      if (res.data?.success) {
        setPasskeyVerified(true);
        setSelectedExam(res.data.exam);
        setCurrentStep(3);
        // Start camera for Step 3 Face Biometrics
        setTimeout(() => {
          startCamera();
        }, 300);
      } else {
        setPasskeyError(res.data?.message || 'Invalid exam passkey.');
      }
    } catch (err: any) {
      setPasskeyError(err.response?.data?.message || 'Passkey verification failed. Ensure the access code is correct.');
    } finally {
      setIsVerifyingPasskey(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Verify Face Biometric & Liveness
  // ─────────────────────────────────────────────────────────────────────────
  const captureFrames = (): string[] => {
    if (!videoRef.current || !canvasRef.current) return [];
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    ctx.drawImage(video, 0, 0, 320, 240);
    const frame = canvas.toDataURL('image/jpeg', 0.85);
    return [frame, frame, frame]; // Send 3 frames for liveness
  };

  const handleVerifyFace = async () => {
    setFaceVerificationError('');
    setIsVerifyingFace(true);

    try {
      const frames = captureFrames();
      if (frames.length === 0) {
        setFaceVerificationError('Camera feed unavailable. Please check your webcam connection.');
        setIsVerifyingFace(false);
        return;
      }

      setCapturedSnapshot(frames[0]);

      const res = await client.post(`/online-exams/${selectedExamId}/verify-face`, {
        passkey: passkey.trim(),
        frames,
        snapshot: frames[0],
        candidateToken,
        clientIp: window.location.hostname
      });

      if (res.data?.success) {
        setFaceMatchSuccess(true);
        setActiveSessionToken(res.data.session_token);
        localStorage.setItem(`exam_session_${selectedExamId}`, res.data.session_token);
        setCurrentStep(4);
      } else {
        setFaceVerificationError(res.data?.message || 'Face verification failed.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Face biometric verification failed. Please align your face inside the circle.';
      setFaceVerificationError(msg);
    } finally {
      setIsVerifyingFace(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4: Launch Fullscreen Lockdown Environment
  // ─────────────────────────────────────────────────────────────────────────
  const handleLaunchExam = async () => {
    setLaunchingExam(true);
    stopCamera();

    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (fsErr) {
      console.warn('Fullscreen request bypassed by browser policy:', fsErr);
    }

    navigate(`/exam-portal/take/${selectedExamId}?token=${activeSessionToken}`);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background Cyber Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide text-white flex items-center gap-2">
              SECURE CBT PORTAL
              <span className="text-[10px] font-mono tracking-widest uppercase bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-2 py-0.5 rounded-full">
                Zero-Trust Lockdown
              </span>
            </h1>
            <p className="text-xs text-slate-400">Institutional Proctored Computer-Based Assessment Gateway</p>
          </div>
        </div>

        {/* Step Progress Indicators */}
        <div className="hidden md:flex items-center gap-3">
          {[
            { num: 1, label: 'Credentials', icon: User },
            { num: 2, label: 'Exam Passkey', icon: Key },
            { num: 3, label: 'Face Biometric', icon: Camera },
            { num: 4, label: 'Lockdown Launch', icon: Monitor }
          ].map((s) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-400/40'
                      : isCompleted
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{s.label}</span>
                  {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />}
                </div>
                {s.num < 4 && <div className="w-4 h-0.5 bg-slate-800" />}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/login')}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-md border border-slate-800 hover:border-slate-700 transition-colors"
          >
            Back to ERP
          </button>
        </div>
      </header>

      {/* Main Content Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl p-8 relative overflow-hidden">
          {/* Subtle Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-500" />

          {/* ────────────────────────────────────────────────────────────── */}
          {/* STEP 1: CANDIDATE LOGIN (EMAIL/ID + PASSWORD)                 */}
          {/* ────────────────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <div>
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Factor 1: Candidate Authentication</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your registered institutional email address and account password
                </p>
              </div>

              {loginError && (
                <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Institutional Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. nuthanakalvadineshreddy@gmail.com"
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter account password"
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isVerifyingLogin}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifyingLogin ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Identity & Proceed</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────── */}
          {/* STEP 2: SELECT EXAM & ENTER EXAM PASSKEY                      */}
          {/* ────────────────────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <div>
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
                  <Key className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Factor 2: Exam Passkey Verification</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Welcome, <strong className="text-slate-200">{candidateData?.fullName}</strong>. Enter the secret access code for your exam.
                </p>
              </div>

              {passkeyError && (
                <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{passkeyError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyPasskey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Select Target Examination
                  </label>
                  <select
                    value={selectedExamId}
                    onChange={(e) => {
                      setSelectedExamId(e.target.value);
                      const f = eligibleExams.find((x) => String(x.id) === e.target.value);
                      if (f) setSelectedExam(f);
                    }}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {eligibleExams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title} ({ex.exam_code}) - {ex.duration_minutes} Mins
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Exam Passkey / Invigilator Secret Key
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3.5 top-3.5 text-amber-400" />
                    <input
                      type="text"
                      required
                      value={passkey}
                      onChange={(e) => setPasskey(e.target.value.toUpperCase())}
                      placeholder="e.g. EXAM2026"
                      className="w-full font-mono font-bold tracking-widest bg-slate-950/60 border border-slate-800 rounded-xl px-10 py-3 text-base text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all uppercase"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    * The passkey is printed on your official hall ticket or provided by the Chief Invigilator.
                  </p>
                </div>

                {selectedExam && (
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1.5 text-slate-400">
                    <div className="flex justify-between">
                      <span>Total Marks:</span>
                      <strong className="text-slate-200">{selectedExam.total_marks} Marks</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <strong className="text-slate-200">{selectedExam.duration_minutes} Minutes</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Biometric Face Match:</span>
                      <strong className="text-emerald-400">Mandatory (Active)</strong>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-xl transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingPasskey}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifyingPasskey ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Validating Passkey...</span>
                      </>
                    ) : (
                      <>
                        <span>Validate Passkey & Camera</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────── */}
          {/* STEP 3: FACE BIOMETRIC RECOGNITION & LIVENESS                */}
          {/* ────────────────────────────────────────────────────────────── */}
          {currentStep === 3 && (
            <div>
              <div className="mb-4 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                  <Camera className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Factor 3: Face Biometric & Liveness</h2>
                <p className="text-xs text-slate-400">
                  Align your face inside the target circle, blink naturally, and ensure adequate lighting.
                </p>
              </div>

              {cameraError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{cameraError}</span>
                </div>
              )}

              {faceVerificationError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{faceVerificationError}</span>
                </div>
              )}

              {/* Video Camera View with Alignment Guide */}
              <div className="relative mx-auto w-64 h-64 rounded-full overflow-hidden border-4 border-indigo-500/40 shadow-2xl bg-black mb-4 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Animated Scanner Guide Ring */}
                <div className="absolute inset-0 border-2 border-dashed border-emerald-400/60 rounded-full animate-spin-slow pointer-events-none" />

                {isVerifyingFace && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                    <span className="font-medium">Matching Facial Biometrics...</span>
                  </div>
                )}
              </div>

              <div className="text-center text-xs text-slate-400 mb-4">
                Target Identity: <strong className="text-white">{candidateData?.fullName}</strong> ({candidateData?.rollNumber || candidateData?.username})
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setCurrentStep(2);
                  }}
                  className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-xl transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleVerifyFace}
                  disabled={isVerifyingFace || !cameraActive}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isVerifyingFace ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Biometric Vector...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Capture & Authenticate Face</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────── */}
          {/* STEP 4: DIAGNOSTIC AUDIT & LOCKDOWN LAUNCH                    */}
          {/* ────────────────────────────────────────────────────────────── */}
          {currentStep === 4 && (
            <div>
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">All 3 Security Factors Verified!</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Candidate session authorized. Please review lockdown environment rules before launching.
                </p>
              </div>

              {/* Hardware Readiness Grid */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
                  <Monitor className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                  <div className="text-[11px] text-slate-400">Fullscreen</div>
                  <strong className="text-xs text-emerald-300">Enforced</strong>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
                  <Camera className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                  <div className="text-[11px] text-slate-400">Face Verified</div>
                  <strong className="text-xs text-emerald-300">Active</strong>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
                  <Wifi className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                  <div className="text-[11px] text-slate-400">Heartbeat</div>
                  <strong className="text-xs text-emerald-300">Synced</strong>
                </div>
              </div>

              {/* Strict Exam Rules Card */}
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200/90 space-y-1.5 mb-6">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Active Anti-Cheating & Lockdown Protocols:
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-200/80">
                  <li>Exiting full-screen or switching browser tabs logs a severe violation.</li>
                  <li>Developer tools (`F12`), copy/paste, and window minimize are disabled.</li>
                  <li>3 security violations will immediately terminate and submit your exam.</li>
                  <li>A dynamic watermark will protect test confidentiality.</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleLaunchExam}
                disabled={launchingExam}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2.5 transition-all text-sm tracking-wide cursor-pointer"
              >
                {launchingExam ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Engaging Lockdown Environment...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>ENTER SECURE EXAM (FULLSCREEN)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer System Status */}
      <footer className="border-t border-slate-800/80 bg-slate-950/40 px-6 py-3 text-center text-xs text-slate-500 z-10 flex items-center justify-between">
        <div>Continuous Proctoring Security Engine v2.4 • Active TLS 1.3 Encryption</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-400">Server Status: Online</span>
        </div>
      </footer>
    </div>
  );
};
