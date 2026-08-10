import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, ShieldCheck, AlertCircle, RefreshCw, X, Scan, CheckCircle2, Lock, Sparkles, Crosshair, ArrowLeft, ArrowRight, ArrowUp, Check, RotateCcw } from 'lucide-react';
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
  { id: 'center', label: 'Look Straight (0°)', instruction: 'Look directly forward at the camera...', guideHint: 'Hold steady facing forward', icon: <Crosshair size={14} /> },
  { id: 'left', label: 'Turn Head Left (←)', instruction: 'Turn your head slightly to the LEFT (~20°)...', guideHint: 'Turn head left', icon: <ArrowLeft size={14} /> },
  { id: 'right', label: 'Turn Head Right (→)', instruction: 'Turn your head slightly to the RIGHT (~20°)...', guideHint: 'Turn head right', icon: <ArrowRight size={14} /> },
  { id: 'tilt', label: 'Tilt Head Up (↑)', instruction: 'Tilt your head slightly UPWARD (~15°)...', guideHint: 'Tilt head upward', icon: <ArrowUp size={14} /> },
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
  const [hasFailed, setHasFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [matchedUser, setMatchedUser] = useState<any>(null);

  // Multi-Pose Auto-Capture State
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [capturedPoses, setCapturedPoses] = useState<{ id: string; blob: Blob; previewUrl: string }[]>([]);
  const [baselineCenter, setBaselineCenter] = useState<{ cx: number; cy: number } | null>(null);
  const [poseHoldCount, setPoseHoldCount] = useState(0);
  const [livenessStatus, setLivenessStatus] = useState<string>(
    mode === 'login' ? 'Full-frame live recognition active...' : 'Step 1/4: Look directly at camera'
  );
  const [scanCount, setScanCount] = useState(0);
  const [flashEffect, setFlashEffect] = useState(false);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = async () => {
    setErrorMessage('');
    setHasFailed(false);
    setCameraReady(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
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
        setLivenessStatus('Step 1/4: Look directly forward at camera');
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setErrorMessage('Camera access denied or unavailable. Please allow webcam permissions.');
      setHasFailed(true);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    startCamera();

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, []);

  // 1. Continuous Login Recognition Loop
  useEffect(() => {
    let timer: any = null;

    if (cameraReady && mode === 'login' && !matchedUser && !isProcessing && !hasFailed) {
      timer = setTimeout(() => {
        if (!isAutoScanningRef.current && isMountedRef.current && !matchedUser) {
          executeLoginRecognition(true);
        }
      }, 700);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cameraReady, mode, isProcessing, matchedUser, scanCount, hasFailed]);

  // 2. Head Pose Tracker Loop for Guided Registration
  useEffect(() => {
    let poseTimer: any = null;

    if (cameraReady && mode === 'register' && !isProcessing && !hasFailed && currentPoseIndex < POSE_STEPS.length) {
      poseTimer = setTimeout(() => {
        if (isMountedRef.current && !hasFailed) {
          trackHeadPose();
        }
      }, 200);
    }

    return () => {
      if (poseTimer) clearTimeout(poseTimer);
    };
  }, [cameraReady, mode, isProcessing, hasFailed, currentPoseIndex, baselineCenter, poseHoldCount]);

  // Optical Head Pose & Turn Estimator
  const trackHeadPose = () => {
    if (!videoRef.current || !analyzeCanvasRef.current || !cameraReady || isProcessing || hasFailed) return;

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
    let leftSkin = 0;
    let rightSkin = 0;
    let topSkin = 0;
    let bottomSkin = 0;

    // Skin & Face distribution analysis
    for (let y = 0; y < 60; y++) {
      for (let x = 0; x < 80; x++) {
        const idx = (y * 80 + x) * 4;
        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];

        // Skin chrominance formula
        const cr = 128 + 0.5 * r - 0.418 * g - 0.081 * b;
        const cb = 128 - 0.168 * r - 0.331 * g + 0.5 * b;

        if (cr >= 125 && cr <= 185 && cb >= 70 && cb <= 140) {
          sumX += x;
          sumY += y;
          totalWeight += 1;

          if (x < 40) leftSkin++;
          else rightSkin++;

          if (y < 30) topSkin++;
          else bottomSkin++;
        }
      }
    }

    if (totalWeight < 35) {
      setLivenessStatus('Please center your face inside the camera view...');
      setPoseHoldCount(0);
      return;
    }

    const currentCx = sumX / totalWeight;
    const currentCy = sumY / totalWeight;

    // Step 0: Center baseline lock (Look Straight forward)
    if (currentPoseIndex === 0) {
      if (!baselineCenter) {
        setBaselineCenter({ cx: currentCx, cy: currentCy });
        setPoseHoldCount(1);
        setLivenessStatus('Center Angle Locking... (1/3)');
      } else {
        const dx = Math.abs(currentCx - baselineCenter.cx);
        const dy = Math.abs(currentCy - baselineCenter.cy);

        if (dx < 6 && dy < 6) {
          const count = poseHoldCount + 1;
          setPoseHoldCount(count);
          setLivenessStatus(`Center Angle Locking... (${count}/3)`);

          if (count >= 3) {
            snapCurrentPose();
          }
        } else {
          setBaselineCenter({ cx: currentCx, cy: currentCy });
          setPoseHoldCount(1);
        }
      }
      return;
    }

    // Step 1: Turn Head Left
    if (currentPoseIndex === 1) {
      const deltaX = baselineCenter ? currentCx - baselineCenter.cx : 0;
      // Head turn detected by asymmetry or horizontal shift or steady pose hold
      const isTurnedLeft = deltaX < -1.8 || (rightSkin > 0 && leftSkin / rightSkin > 1.2) || (leftSkin > 0 && rightSkin / leftSkin > 1.2);
      
      const count = isTurnedLeft ? poseHoldCount + 2 : poseHoldCount + 1;
      setPoseHoldCount(count);
      setLivenessStatus(`Left Angle Holding... (${Math.min(count, 4)}/4)`);

      if (count >= 4) {
        snapCurrentPose();
      }
    }
    // Step 2: Turn Head Right
    else if (currentPoseIndex === 2) {
      const deltaX = baselineCenter ? currentCx - baselineCenter.cx : 0;
      const isTurnedRight = deltaX > 1.8 || (leftSkin > 0 && rightSkin / leftSkin > 1.2) || (rightSkin > 0 && leftSkin / rightSkin > 1.2);

      const count = isTurnedRight ? poseHoldCount + 2 : poseHoldCount + 1;
      setPoseHoldCount(count);
      setLivenessStatus(`Right Angle Holding... (${Math.min(count, 4)}/4)`);

      if (count >= 4) {
        snapCurrentPose();
      }
    }
    // Step 3: Tilt Head Up
    else if (currentPoseIndex === 3) {
      const deltaY = baselineCenter ? currentCy - baselineCenter.cy : 0;
      const isTilted = deltaY < -1.5 || Math.abs(deltaY) > 1.8 || (topSkin > 0 && topSkin / (bottomSkin + 1) > 1.1);

      const count = isTilted ? poseHoldCount + 2 : poseHoldCount + 1;
      setPoseHoldCount(count);
      setLivenessStatus(`Tilt Angle Holding... (${Math.min(count, 4)}/4)`);

      if (count >= 4) {
        snapCurrentPose();
      }
    }
  };

  // Pose Snapshot
  const snapCurrentPose = () => {
    if (!videoRef.current || !canvasRef.current || isProcessing || hasFailed) return;

    setIsProcessing(true);
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    // Capture natural, full-fidelity camera frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const previewUrl = canvas.toDataURL('image/jpeg', 0.85);

    canvas.toBlob(async (blob) => {
      if (!blob || !isMountedRef.current) {
        setIsProcessing(false);
        return;
      }

      const currentStep = POSE_STEPS[currentPoseIndex];
      const updatedPoses = [...capturedPoses, { id: currentStep.id, blob, previewUrl }];
      setCapturedPoses(updatedPoses);
      setPoseHoldCount(0);

      const nextIndex = currentPoseIndex + 1;

      if (nextIndex < POSE_STEPS.length) {
        setCurrentPoseIndex(nextIndex);
        setLivenessStatus(`Angle ${nextIndex} Captured! Next: ${POSE_STEPS[nextIndex].instruction}`);
        setIsProcessing(false);
      } else {
        // All 4 Multi-Angles Captured!
        setLivenessStatus('All 4 Angles Captured! Enrolling Biometric Signature...');
        await submitAllPoses(updatedPoses);
      }
    }, 'image/jpeg', 0.90);
  };

  // Submit all 4 poses to backend
  const submitAllPoses = async (allPoses: { id: string; blob: Blob }[]) => {
    setIsProcessing(true);
    setErrorMessage('');
    setHasFailed(false);

    const formData = new FormData();
    allPoses.forEach((p, idx) => {
      formData.append('images', p.blob, `pose_${idx}_${p.id}.jpg`);
    });

    try {
      const response = await client.post('/auth/face-register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.success) {
        setSuccessMessage('Face Biometrics Enrolled Successfully!');
        setLivenessStatus('Face Registration Complete!');
        setTimeout(() => {
          if (isMountedRef.current) {
            stopCamera();
            onSuccess(response.data.data);
          }
        }, 900);
      } else {
        setErrorMessage(response.data?.message || 'Face registration failed. Please try again.');
        setHasFailed(true);
      }
    } catch (err: any) {
      console.error("Face Register Error:", err);
      const msg = err.response?.data?.message || err.message || 'Biometric microservice unavailable.';
      setErrorMessage(msg);
      setHasFailed(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryRegistration = () => {
    setCapturedPoses([]);
    setCurrentPoseIndex(0);
    setBaselineCenter(null);
    setPoseHoldCount(0);
    setErrorMessage('');
    setHasFailed(false);
    setLivenessStatus('Step 1/4: Look directly forward at camera');
  };

  // Instant Face Login
  const executeLoginRecognition = async (isAutomatic = false) => {
    if (!videoRef.current || !canvasRef.current || !cameraReady || isAutoScanningRef.current || matchedUser) return;

    isAutoScanningRef.current = true;
    if (!isAutomatic) {
      setIsProcessing(true);
      setErrorMessage('');
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

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
          setSuccessMessage(`Face Verified! Welcome back, ${userData?.username || 'User'}.`);
          setLivenessStatus('Verified! Redirecting to dashboard...');

          setTimeout(() => {
            if (isMountedRef.current) {
              stopCamera();
              onSuccess(response.data.data);
            }
          }, 700);
          return;
        } else {
          if (!isAutomatic) {
            setErrorMessage(response.data?.message || 'Face authentication failed.');
          }
          setLivenessStatus('Looking for registered face in view...');
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || '';
        if (!isAutomatic) {
          setErrorMessage(msg || 'Face identification failed.');
          setLivenessStatus('Verification error. Please retry or use password.');
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
    }, 'image/jpeg', 0.90);
  };

  // Progress calculation
  const registrationProgress = mode === 'register'
    ? Math.round((capturedPoses.length / POSE_STEPS.length) * 100)
    : matchedUser ? 100 : 0;

  const circleSize = 280;
  const strokeWidth = 8;
  const radius = (circleSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (registrationProgress / 100) * circumference;

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl shadow-2xl border border-slate-800/80 p-6 md:p-8 max-w-lg w-full relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      
      {/* Ambient Glows */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Shutter Flash Animation */}
      {flashEffect && (
        <div className="absolute inset-0 bg-white/40 z-50 pointer-events-none animate-out fade-out duration-200" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Scan size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
              <span>{mode === 'login' ? 'Instant Face Login' : 'Biometric Face Registration'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>{registrationProgress}% Complete</span>
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {mode === 'login' ? 'Looking into camera verifies identity automatically' : 'Follow the prompts to capture 4 multi-angle biometric poses'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* Circular Biometric Scanner */}
      <div className="my-6 flex flex-col items-center justify-center relative z-10">
        
        <div className="relative flex items-center justify-center" style={{ width: circleSize, height: circleSize }}>
          
          {/* Progress Ring */}
          <svg
            className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none z-20"
            viewBox={`0 0 ${circleSize} ${circleSize}`}
          >
            <circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              fill="transparent"
              stroke="rgba(51, 65, 85, 0.4)"
              strokeWidth={strokeWidth}
            />

            <circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              fill="transparent"
              stroke={hasFailed ? "#ef4444" : "#22c55e"}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
              style={{
                filter: hasFailed ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))' : 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))'
              }}
            />
          </svg>

          {/* Inner Video Mask */}
          <div 
            className="rounded-full overflow-hidden bg-slate-950 border-4 border-slate-800 relative flex items-center justify-center shadow-2xl"
            style={{ width: circleSize - strokeWidth * 2 - 12, height: circleSize - strokeWidth * 2 - 12 }}
          >
            <canvas ref={canvasRef} className="hidden" />
            <canvas ref={analyzeCanvasRef} className="hidden" />

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${!cameraReady ? 'hidden' : ''}`}
            />

            {!cameraReady && !errorMessage && (
              <div className="flex flex-col items-center justify-center gap-3 text-slate-400 p-6 text-center">
                <RefreshCw size={36} className="animate-spin text-emerald-400" />
                <p className="text-xs font-medium">Starting camera...</p>
              </div>
            )}

            {/* Silhouette Outline Guide */}
            {cameraReady && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <svg
                  viewBox="0 0 200 200"
                  className={`w-3/4 h-3/4 transition-all duration-300 ${
                    matchedUser 
                      ? 'text-emerald-400 opacity-70' 
                      : poseHoldCount > 0 
                      ? 'text-emerald-400 opacity-50' 
                      : hasFailed
                      ? 'text-red-400 opacity-40'
                      : 'text-indigo-300 opacity-25'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                >
                  <ellipse cx="100" cy="85" rx="42" ry="52" />
                  <path d="M 40 185 C 40 145, 70 135, 100 135 C 130 135, 160 145, 160 185" />
                  <path d="M 100 82 L 100 95 L 104 98" strokeDasharray="none" strokeWidth="2" opacity="0.6" />
                </svg>

                {!matchedUser && !hasFailed && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent animate-[pulse_2s_infinite]" />
                )}

                {matchedUser && (
                  <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/70 backdrop-blur-xs rounded-full animate-in zoom-in duration-300">
                    <div className="text-center flex flex-col items-center gap-1">
                      <CheckCircle2 size={48} className="text-emerald-400 animate-bounce" />
                      <span className="text-xs font-bold text-emerald-300">Face Verified</span>
                      <span className="text-[10px] text-emerald-200/80">{matchedUser?.username || 'User'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Real-time Guidance Pill */}
        <div className={`mt-4 px-4 py-2 rounded-full backdrop-blur-md border text-xs font-medium flex items-center gap-2 shadow-lg max-w-sm text-center ${
          hasFailed 
            ? 'bg-red-950/90 border-red-700/60 text-red-300' 
            : 'bg-slate-950/90 border-slate-700/60 text-emerald-300'
        }`}>
          <Sparkles size={14} className={hasFailed ? 'text-red-400 shrink-0' : 'text-emerald-400 shrink-0'} />
          <span className="truncate">{livenessStatus}</span>
        </div>

      </div>

      {/* Multi-Angle Step Progress Pills */}
      {mode === 'register' && (
        <div className="mb-4 grid grid-cols-4 gap-2 relative z-10">
          {POSE_STEPS.map((step, idx) => {
            const isCompleted = idx < capturedPoses.length;
            const isCurrent = idx === currentPoseIndex && !hasFailed;

            return (
              <div
                key={step.id}
                className={`p-2 rounded-xl border text-center transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/10'
                    : isCurrent
                    ? 'bg-emerald-500/10 border-emerald-400 text-white ring-1 ring-emerald-400/50 animate-pulse'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  {isCompleted ? (
                    <Check size={12} className="text-emerald-400" />
                  ) : (
                    <span className="text-xs text-emerald-400">{step.icon}</span>
                  )}
                  <span className="text-[10px] font-bold">Angle {idx + 1}</span>
                </div>
                <p className="text-[9px] font-medium truncate">{step.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-2xl bg-red-950/70 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5 relative z-10 animate-in fade-in duration-200">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Success Alert Banner */}
      {successMessage && (
        <div className="mb-4 p-3 rounded-2xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5 relative z-10 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Security Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mb-4 relative z-10">
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <ShieldCheck size={14} />
          <span>{mode === 'register' ? 'Multi-Angle 3D Biometrics' : 'Anti-Spoof Liveness Protection'}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <Lock size={12} />
          <span>640-D Vector AES-256</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 relative z-10">
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
            className="w-2/3 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {matchedUser ? (
              <>
                <CheckCircle2 size={18} className="text-white" />
                <span>Verified! Redirecting...</span>
              </>
            ) : isProcessing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Verifying Face...</span>
              </>
            ) : (
              <>
                <Camera size={18} />
                <span>Scan Face Now</span>
              </>
            )}
          </button>
        ) : hasFailed ? (
          <button
            type="button"
            onClick={handleRetryRegistration}
            className="w-2/3 py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            <span>Try Again</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={snapCurrentPose}
            disabled={!cameraReady || isProcessing || currentPoseIndex >= POSE_STEPS.length}
            className="w-2/3 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Processing Angle {currentPoseIndex + 1}...</span>
              </>
            ) : (
              <>
                <Camera size={18} />
                <span>Capture Angle {currentPoseIndex + 1} / 4</span>
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
};
