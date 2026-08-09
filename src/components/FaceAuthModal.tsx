import React, { useState, useRef, useEffect } from 'react';
import { Camera, ShieldCheck, AlertCircle, RefreshCw, X, Scan, CheckCircle2, Lock, Sparkles, UserCheck, Crosshair, ArrowLeft, ArrowRight, ArrowUp, Check } from 'lucide-react';
import client from '../api/client';

interface FaceAuthModalProps {
  mode: 'login' | 'register';
  portalRole?: string;
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

interface PoseStep {
  id: 'center' | 'left' | 'right' | 'tilt';
  label: string;
  instruction: string;
  guideHint: string;
  icon: React.ReactNode;
}

const POSE_STEPS: PoseStep[] = [
  { id: 'center', label: 'Look Center (0°)', instruction: 'Look directly forward at the camera...', guideHint: 'Hold steady facing forward', icon: <Crosshair size={14} /> },
  { id: 'left', label: 'Turn Head Left (←)', instruction: 'Slowly turn your head to the LEFT...', guideHint: 'Turn head left (~20°)', icon: <ArrowLeft size={14} /> },
  { id: 'right', label: 'Turn Head Right (→)', instruction: 'Slowly turn your head to the RIGHT...', guideHint: 'Turn head right (~20°)', icon: <ArrowRight size={14} /> },
  { id: 'tilt', label: 'Tilt Head Up/Down (↕)', instruction: 'Tilt your head slightly UP or DOWN...', guideHint: 'Tilt head up or down (~15°)', icon: <ArrowUp size={14} /> },
];

export const FaceAuthModal: React.FC<FaceAuthModalProps> = ({
  mode,
  portalRole,
  onSuccess,
  onCancel
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzeCanvasRef = useRef<HTMLCanvasElement>(null);
  const isAutoScanningRef = useRef(false);
  const isMountedRef = useRef(true);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [matchedUser, setMatchedUser] = useState<any>(null);

  // 3D Multi-Pose Auto-Capture State
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [capturedPoses, setCapturedPoses] = useState<{ id: string; blob: Blob }[]>([]);
  const [baselineCenter, setBaselineCenter] = useState<{ cx: number; cy: number } | null>(null);
  const [poseHoldCount, setPoseHoldCount] = useState(0);
  const [livenessStatus, setLivenessStatus] = useState<string>(
    mode === 'login' ? 'Full-frame live recognition active...' : 'Step 1/4: Look directly at camera'
  );
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    isMountedRef.current = true;
    startCamera();

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, []);

  // 1. Automatic Continuous Login Recognition Loop
  useEffect(() => {
    let timer: any = null;

    if (cameraReady && mode === 'login' && !matchedUser && !isProcessing) {
      timer = setTimeout(() => {
        if (!isAutoScanningRef.current && isMountedRef.current && !matchedUser) {
          executeLoginRecognition(true);
        }
      }, 250);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cameraReady, mode, isProcessing, matchedUser, scanCount]);

  // 2. Automatic 3D Multi-Angle Pose Tracker Loop for Registration
  useEffect(() => {
    let poseTimer: any = null;

    if (cameraReady && mode === 'register' && !isProcessing && currentPoseIndex < POSE_STEPS.length) {
      poseTimer = setTimeout(() => {
        if (isMountedRef.current) {
          trackHeadPoseAndAutoCapture();
        }
      }, 180);
    }

    return () => {
      if (poseTimer) clearTimeout(poseTimer);
    };
  }, [cameraReady, mode, isProcessing, currentPoseIndex, baselineCenter, poseHoldCount]);

  const startCamera = async () => {
    setErrorMessage('');
    setCameraReady(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 480 },
          height: { ideal: 360 },
          facingMode: 'user'
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraReady(true);
      if (mode === 'login') {
        setLivenessStatus('Instant auto-recognition active. Looking for registered face...');
      } else {
        setLivenessStatus('Step 1/4: Look directly forward (Auto-Capture Active)');
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setErrorMessage('Camera access denied or unavailable. Please grant webcam permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Optical Head Pose Estimator
  const trackHeadPoseAndAutoCapture = () => {
    if (!videoRef.current || !analyzeCanvasRef.current || !cameraReady || isProcessing) return;

    const video = videoRef.current;
    const canvas = analyzeCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 80;
    canvas.height = 60;
    ctx.drawImage(video, 0, 0, 80, 60);

    const imgData = ctx.getImageData(0, 0, 80, 60).data;

    let totalWeight = 0;
    let sumX = 0;
    let sumY = 0;

    // Skin & Face center of mass tracking in YCrCb
    for (let y = 0; y < 60; y++) {
      for (let x = 0; x < 80; x++) {
        const idx = (y * 80 + x) * 4;
        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];

        // Approximate skin chrominance
        const cr = 128 + 0.5 * r - 0.418 * g - 0.081 * b;
        const cb = 128 - 0.168 * r - 0.331 * g + 0.5 * b;

        if (cr >= 130 && cr <= 180 && cb >= 75 && cb <= 135) {
          sumX += x;
          sumY += y;
          totalWeight += 1;
        }
      }
    }

    if (totalWeight < 60) {
      // Face not detected in frame
      setLivenessStatus('Please center your face inside the camera view...');
      return;
    }

    const currentCx = sumX / totalWeight;
    const currentCy = sumY / totalWeight;

    // Step 0: Center baseline lock
    if (currentPoseIndex === 0) {
      if (!baselineCenter) {
        setBaselineCenter({ cx: currentCx, cy: currentCy });
        setPoseHoldCount(1);
      } else {
        const dx = Math.abs(currentCx - baselineCenter.cx);
        const dy = Math.abs(currentCy - baselineCenter.cy);

        if (dx < 4 && dy < 4) {
          const count = poseHoldCount + 1;
          setPoseHoldCount(count);
          setLivenessStatus(`Center Angle Locking... (${count}/3)`);

          if (count >= 3) {
            // Auto-capture Center Angle
            autoSnapCurrentPose();
          }
        } else {
          setBaselineCenter({ cx: currentCx, cy: currentCy });
          setPoseHoldCount(1);
        }
      }
      return;
    }

    if (!baselineCenter) return;

    const deltaX = currentCx - baselineCenter.cx;
    const deltaY = currentCy - baselineCenter.cy;

    // Step 1: Turn Head Left (horizontal displacement < -3.5px on 80x60 grid)
    if (currentPoseIndex === 1) {
      if (deltaX < -3.5) {
        const count = poseHoldCount + 1;
        setPoseHoldCount(count);
        setLivenessStatus(`Left Angle Locking... (${count}/3)`);
        if (count >= 3) {
          autoSnapCurrentPose();
        }
      } else {
        setPoseHoldCount(0);
        setLivenessStatus('Step 2/4: Turn your head slightly to the LEFT...');
      }
    }

    // Step 2: Turn Head Right (horizontal displacement > +3.5px)
    else if (currentPoseIndex === 2) {
      if (deltaX > 3.5) {
        const count = poseHoldCount + 1;
        setPoseHoldCount(count);
        setLivenessStatus(`Right Angle Locking... (${count}/3)`);
        if (count >= 3) {
          autoSnapCurrentPose();
        }
      } else {
        setPoseHoldCount(0);
        setLivenessStatus('Step 3/4: Turn your head slightly to the RIGHT...');
      }
    }

    // Step 3: Tilt Head Up or Down (|deltaY| > 3px or deltaX returning to center)
    else if (currentPoseIndex === 3) {
      if (Math.abs(deltaY) > 2.5 || Math.abs(deltaX) < 3.0) {
        const count = poseHoldCount + 1;
        setPoseHoldCount(count);
        setLivenessStatus(`Tilt Angle Locking... (${count}/3)`);
        if (count >= 3) {
          autoSnapCurrentPose();
        }
      } else {
        setPoseHoldCount(0);
        setLivenessStatus('Step 4/4: Tilt head slightly UP or DOWN...');
      }
    }
  };

  const autoSnapCurrentPose = () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 360;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    // Zero-out 100% background: Clip strictly to anatomical face geometry
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, canvas.height / 2, canvas.width * 0.38, canvas.height * 0.46, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsProcessing(false);
        return;
      }

      const currentStep = POSE_STEPS[currentPoseIndex];
      const updatedPoses = [...capturedPoses, { id: currentStep.id, blob }];
      setCapturedPoses(updatedPoses);
      setPoseHoldCount(0);

      const nextIndex = currentPoseIndex + 1;

      if (nextIndex < POSE_STEPS.length) {
        setCurrentPoseIndex(nextIndex);
        setLivenessStatus(`Angle ${nextIndex} Locked! Next: ${POSE_STEPS[nextIndex].instruction}`);
        setIsProcessing(false);
      } else {
        // All 4 3D Angles Automatically Captured!
        setLivenessStatus('All 4 3D Angles Locked! Fusing 3D Biometric Master Vector...');
        await submitAll3DPoses(updatedPoses);
      }
    }, 'image/jpeg', 0.90);
  };

  // Optical Motion Liveness against static photos
  const verifyLiveMotion = async (video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<boolean> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    canvas.width = 160;
    canvas.height = 120;

    ctx.drawImage(video, 0, 0, 160, 120);
    const d1 = ctx.getImageData(0, 0, 160, 120).data;

    await new Promise((r) => setTimeout(r, 90));

    ctx.drawImage(video, 0, 0, 160, 120);
    const d2 = ctx.getImageData(0, 0, 160, 120).data;

    let diff = 0;
    for (let i = 0; i < d1.length; i += 4) {
      diff += Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2]);
    }

    const avgDiff = diff / (d1.length / 4);
    return avgDiff >= 0.008;
  };

  // Instant Face Login
  const executeLoginRecognition = async (isAutomatic = false) => {
    if (!videoRef.current || !canvasRef.current || !cameraReady || isAutoScanningRef.current) return;

    isAutoScanningRef.current = true;
    if (!isAutomatic) {
      setIsProcessing(true);
      setErrorMessage('');
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const isLivePerson = await verifyLiveMotion(video, canvas);
    if (!isLivePerson) {
      if (!isAutomatic) {
        setErrorMessage('Anti-Spoof Alert: Static photo or frozen image detected. Please present a live human face.');
      }
      setLivenessStatus('Static image rejected. Live movement required...');
      isAutoScanningRef.current = false;
      if (!isAutomatic) setIsProcessing(false);
      return;
    }

    setLivenessStatus('Live face verified! Scanning biometric signature...');

    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 360;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      isAutoScanningRef.current = false;
      if (!isAutomatic) setIsProcessing(false);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob || !isMountedRef.current) {
        isAutoScanningRef.current = false;
        if (!isAutomatic) setIsProcessing(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', blob, 'face_capture.jpg');
      if (portalRole) {
        formData.append('portalRole', portalRole);
      }

      try {
        const response = await client.post('/auth/face-login', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data?.success) {
          const userData = response.data.data?.user || response.data.data;
          setMatchedUser(userData);
          setSuccessMessage(`Face Verified! Welcome back, ${userData?.username || 'User'}. Signing you in automatically...`);
          setLivenessStatus('Verified! Redirecting to dashboard...');

          setTimeout(() => {
            if (isMountedRef.current) {
              stopCamera();
              onSuccess(response.data.data);
            }
          }, 600);
          return;
        } else {
          if (!isAutomatic) {
            setErrorMessage(response.data?.message || 'Biometric verification failed.');
          }
          setLivenessStatus('Looking for registered face in full view...');
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || '';
        if (!isAutomatic) {
          setErrorMessage(msg);
          setLivenessStatus('Verification error. Please retry.');
        } else {
          if (err.response?.status === 401) {
            setLivenessStatus('Looking for registered face...');
          }
        }
      } finally {
        isAutoScanningRef.current = false;
        if (!isAutomatic) setIsProcessing(false);
        setScanCount((prev) => prev + 1);
      }
    }, 'image/jpeg', 0.85);
  };

  const submitAll3DPoses = async (allPoses: { id: string; blob: Blob }[]) => {
    const formData = new FormData();
    allPoses.forEach((p, idx) => {
      formData.append('images', p.blob, `pose_${idx}_${p.id}.jpg`);
    });

    try {
      const response = await client.post('/auth/face-register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.success) {
        setSuccessMessage('3D Multi-Angle Biometrics Auto-Enrolled Successfully!');
        setLivenessStatus('3D Enrollment Complete!');
        setTimeout(() => {
          stopCamera();
          onSuccess(response.data.data);
        }, 900);
      } else {
        setErrorMessage(response.data?.message || '3D face registration failed.');
        reset3DEnrollment();
      }
    } catch (err: any) {
      console.error("3D Register Error:", err);
      setErrorMessage(err.response?.data?.message || 'Biometric microservice unavailable.');
      reset3DEnrollment();
    } finally {
      setIsProcessing(false);
    }
  };

  const reset3DEnrollment = () => {
    setCapturedPoses([]);
    setCurrentPoseIndex(0);
    setBaselineCenter(null);
    setPoseHoldCount(0);
    setErrorMessage('');
    setLivenessStatus('Step 1/4: Look directly at camera');
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 p-6 max-w-xl w-full relative overflow-hidden animate-in fade-in zoom-in duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Scan size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span>{mode === 'login' ? 'Full-Screen Face Login' : 'Automatic 3D Face Enrollment'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Auto-Capture Active</span>
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {mode === 'login' ? 'Instant Automatic Sign-In on Face Match' : 'Simply move your head — 3D angles are captured automatically!'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* 3D Angle Multi-Step Auto-Progress Tracker for Registration */}
      {mode === 'register' && (
        <div className="my-4 grid grid-cols-4 gap-2">
          {POSE_STEPS.map((step, idx) => {
            const isCompleted = idx < capturedPoses.length;
            const isCurrent = idx === currentPoseIndex;

            return (
              <div
                key={step.id}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/10'
                    : isCurrent
                    ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400 animate-pulse'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  {isCompleted ? <Check size={14} className="text-emerald-400" /> : step.icon}
                  <span className="text-[11px] font-bold">Angle {idx + 1}</span>
                </div>
                <p className="text-[10px] font-medium truncate">{step.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Borderless Camera Viewport */}
      <div className="my-4 relative rounded-2xl bg-slate-950 overflow-hidden aspect-video border border-slate-800 flex items-center justify-center shadow-inner">
        
        {/* Hidden Canvases */}
        <canvas ref={canvasRef} className="hidden" />
        <canvas ref={analyzeCanvasRef} className="hidden" />

        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${!cameraReady ? 'hidden' : ''}`}
        />

        {/* Camera Loading State */}
        {!cameraReady && !errorMessage && (
          <div className="flex flex-col items-center gap-3 text-slate-400 p-6">
            <RefreshCw size={32} className="animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Starting automatic 3D head-tracking scanner...</p>
          </div>
        )}

        {/* Futuristic HUD & Dynamic Corner Target Brackets */}
        {cameraReady && (
          <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
            
            {/* Top HUD Line */}
            <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-indigo-300/80 bg-slate-950/40 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                <Crosshair size={12} className="text-indigo-400 animate-spin" />
                <span>3D-HEAD-POSE TRACKER // ACTIVE</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{mode === 'register' ? `ANGLE ${currentPoseIndex + 1}/4 AUTO-LOCK` : '640-D VECTOR ACTIVE'}</span>
              </div>
            </div>

            {/* Smart Corner Target Reticles */}
            <div className="absolute inset-8 pointer-events-none">
              <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 transition-all duration-300 ${
                matchedUser ? 'border-emerald-400 shadow-[0_0_15px_#34d399]' : 'border-indigo-400 shadow-[0_0_10px_#818cf8]'
              }`} />
              <div className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 transition-all duration-300 ${
                matchedUser ? 'border-emerald-400 shadow-[0_0_15px_#34d399]' : 'border-indigo-400 shadow-[0_0_10px_#818cf8]'
              }`} />
              <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 transition-all duration-300 ${
                matchedUser ? 'border-emerald-400 shadow-[0_0_15px_#34d399]' : 'border-indigo-400 shadow-[0_0_10px_#818cf8]'
              }`} />
              <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 transition-all duration-300 ${
                matchedUser ? 'border-emerald-400 shadow-[0_0_15px_#34d399]' : 'border-indigo-400 shadow-[0_0_10px_#818cf8]'
              }`} />

              {/* Sweeping Laser Line */}
              {!matchedUser && (
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] animate-[bounce_2.5s_infinite]" />
              )}

              {/* Center Target Indicator on Matched Face */}
              {matchedUser && (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/30 backdrop-blur-xs rounded-2xl animate-in zoom-in duration-300">
                  <div className="p-4 rounded-3xl bg-emerald-500/20 border border-emerald-400/40 text-center flex flex-col items-center gap-2 shadow-2xl">
                    <UserCheck size={44} className="text-emerald-400 animate-bounce" />
                    <span className="text-sm font-bold text-emerald-300">Face Verified: {matchedUser?.username || 'User'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Status Feedback Pill */}
            <div className="self-center z-10 px-4 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-slate-700/60 text-xs font-medium text-indigo-300 flex items-center gap-2 shadow-lg">
              <Sparkles size={13} className="text-indigo-400 shrink-0" />
              <span>{livenessStatus}</span>
            </div>

          </div>
        )}
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Success Alert Banner */}
      {successMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-green-400 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Security & Invariance Badges */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mb-5">
        <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
          <ShieldCheck size={14} />
          <span>{mode === 'register' ? 'Automatic 3D Head-Pose Auto-Capture Active' : 'Flexible Distance & Multi-Lighting Active'}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <Lock size={12} />
          <span>AES-256 Vector Encryption</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="w-1/3 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all"
        >
          Cancel
        </button>

        {mode === 'login' ? (
          <button
            type="button"
            onClick={() => executeLoginRecognition(false)}
            disabled={!cameraReady || isProcessing || !!matchedUser}
            className="w-2/3 py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {matchedUser ? (
              <>
                <CheckCircle2 size={18} className="text-emerald-300" />
                <span>Redirecting...</span>
              </>
            ) : isProcessing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Verifying Face...</span>
              </>
            ) : (
              <>
                <Camera size={18} />
                <span>Auto-Scanning Active</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={autoSnapCurrentPose}
            disabled={!cameraReady || isProcessing}
            className="w-2/3 py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Locking Angle {currentPoseIndex + 1}...</span>
              </>
            ) : (
              <>
                <Camera size={18} />
                <span>Auto-Tracking (Or Click to Snap Angle {currentPoseIndex + 1})</span>
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
};
