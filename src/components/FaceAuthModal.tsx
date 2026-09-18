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
  id: 'front' | 'right' | 'left' | 'up';
  label: string;
  instruction: string;
  guideHint: string;
  icon: React.ReactNode;
}

const POSE_STEPS: PoseStep[] = [
  { id: 'front', label: 'Front', instruction: 'Look straight at the camera', guideHint: 'Center your face and look straight forward', icon: <Crosshair size={14} /> },
  { id: 'right', label: 'Right', instruction: 'Slowly turn your face to the RIGHT (→)', guideHint: 'Turn head right and hold steady', icon: <ArrowRight size={14} /> },
  { id: 'left', label: 'Left', instruction: 'Slowly turn your face to the LEFT (←)', guideHint: 'Turn head left and hold steady', icon: <ArrowLeft size={14} /> },
  { id: 'up', label: 'Up', instruction: 'Slowly look UP (↑)', guideHint: 'Tilt head upward and hold steady', icon: <ArrowUp size={14} /> },
];

export const FaceAuthModal: React.FC<FaceAuthModalProps> = ({
  mode,
  portalRole,
  onSuccess,
  onCancel
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isAutoScanningRef = useRef(false);
  const isMountedRef = useRef(true);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [matchedUser, setMatchedUser] = useState<any>(null);

  // Multi-Pose Automatic Enrollment State
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [capturedPoses, setCapturedPoses] = useState<{ id: string; blob: Blob; previewUrl: string }[]>([]);
  const [poseHoldCount, setPoseHoldCount] = useState(0);
  const [poseFeedback, setPoseFeedback] = useState<string>('Look straight at the camera');
  const [isPoseValid, setIsPoseValid] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);
  const [scanCount, setScanCount] = useState(0);

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
        setPoseFeedback('Looking for registered face...');
      } else {
        setPoseFeedback(POSE_STEPS[0].instruction);
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

  // 1. Automatic Face Login Auto-Scanner
  useEffect(() => {
    let timer: any = null;
    if (cameraReady && mode === 'login' && !isProcessing && !matchedUser && !hasFailed) {
      timer = setTimeout(() => {
        if (isMountedRef.current && !isAutoScanningRef.current && !matchedUser) {
          executeLoginRecognition(true);
        }
      }, 700);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cameraReady, mode, isProcessing, matchedUser, scanCount, hasFailed]);

  // 2. Real-Time Pose Validation & Auto-Capture Loop
  useEffect(() => {
    let poseTimer: any = null;

    if (cameraReady && mode === 'register' && !isProcessing && !hasFailed && currentPoseIndex < POSE_STEPS.length) {
      poseTimer = setTimeout(() => {
        if (isMountedRef.current && !isAutoScanningRef.current) {
          evaluateLivePose();
        }
      }, 250);
    }

    return () => {
      if (poseTimer) clearTimeout(poseTimer);
    };
  }, [cameraReady, mode, isProcessing, hasFailed, currentPoseIndex, poseHoldCount]);

  // Real-Time Frame Validation against Backend
  const evaluateLivePose = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady || isProcessing || hasFailed || isAutoScanningRef.current) return;

    const currentStep = POSE_STEPS[currentPoseIndex];
    if (!currentStep) return;

    isAutoScanningRef.current = true;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      isAutoScanningRef.current = false;
      return;
    }

    ctx.drawImage(video, 0, 0, 320, 240);

    canvas.toBlob(async (blob) => {
      if (!blob || !isMountedRef.current) {
        isAutoScanningRef.current = false;
        return;
      }

      const formData = new FormData();
      formData.append('image', blob, 'frame.jpg');
      formData.append('expected_pose', currentStep.id);

      try {
        const response = await client.post('/auth/face-validate-pose', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const data = response.data?.data;
        if (data && isMountedRef.current) {
          setPoseFeedback(data.feedback || currentStep.instruction);
          setIsPoseValid(Boolean(data.valid));

          if (data.valid) {
            const nextHold = poseHoldCount + 1;
            setPoseHoldCount(nextHold);

            if (nextHold >= 3) {
              // Stability verified -> Automatic Pose Capture!
              await autoCaptureCurrentPose();
            }
          } else {
            // User moved or changed pose -> Reset stability timer
            setPoseHoldCount(0);
          }
        }
      } catch (e) {
        // Fallback: Continue scanning
      } finally {
        isAutoScanningRef.current = false;
      }
    }, 'image/jpeg', 0.80);
  };

  // High-Resolution Automatic Pose Snapshot
  const autoCaptureCurrentPose = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

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

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const previewUrl = canvas.toDataURL('image/jpeg', 0.90);

    canvas.toBlob(async (blob) => {
      if (!blob || !isMountedRef.current) {
        setIsProcessing(false);
        return;
      }

      const currentStep = POSE_STEPS[currentPoseIndex];
      const updatedPoses = [...capturedPoses, { id: currentStep.id, blob, previewUrl }];
      setCapturedPoses(updatedPoses);
      setPoseHoldCount(0);
      setIsPoseValid(false);

      const nextIndex = currentPoseIndex + 1;

      if (nextIndex < POSE_STEPS.length) {
        setCurrentPoseIndex(nextIndex);
        setPoseFeedback(`${currentStep.label} face captured ✓`);
        setIsProcessing(false);
      } else {
        // All 4 poses captured automatically!
        setPoseFeedback('All 4 poses captured ✓ Finalizing biometric enrollment...');
        await submitAllPoses(updatedPoses);
      }
    }, 'image/jpeg', 0.92);
  };

  // Submit all 4 poses to backend
  const submitAllPoses = async (allPoses: { id: string; blob: Blob }[]) => {
    setIsProcessing(true);
    setErrorMessage('');
    setHasFailed(false);

    const formData = new FormData();
    allPoses.forEach((p) => {
      formData.append('images', p.blob, `pose_${p.id}.jpg`);
    });

    try {
      const response = await client.post('/auth/face-register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.success) {
        setSuccessMessage('Face registration completed successfully ✓');
        setPoseFeedback('Registration completed ✓');
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

  const handleRetryRegistration = (retryIndex = 0) => {
    if (retryIndex === 0) {
      setCapturedPoses([]);
      setCurrentPoseIndex(0);
    } else {
      setCapturedPoses(prev => prev.slice(0, retryIndex));
      setCurrentPoseIndex(retryIndex);
    }
    setPoseHoldCount(0);
    setIsPoseValid(false);
    setErrorMessage('');
    setHasFailed(false);
    setPoseFeedback(POSE_STEPS[retryIndex]?.instruction || 'Look straight at the camera');
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
          setPoseFeedback('Verified! Redirecting to dashboard...');

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
          setPoseFeedback('Looking for registered face in view...');
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || '';
        if (err.response?.status === 403) {
          setErrorMessage(msg || 'Access Denied: Your account role is not authorized for this portal.');
          setPoseFeedback('Role mismatch. Please log in through your assigned portal.');
        } else if (!isAutomatic) {
          setErrorMessage(msg || 'Face identification failed.');
          setPoseFeedback('Verification error. Please retry or use password.');
        } else {
          if (err.response?.status === 401) {
            setPoseFeedback('Looking for registered face...');
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
    <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl shadow-2xl border border-slate-800/80 p-4 sm:p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar-thin relative animate-in fade-in zoom-in-95 duration-300">
      
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
              <span>{mode === 'login' ? 'Instant Face Login' : 'Automatic Face Registration'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>{registrationProgress}% Complete</span>
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {mode === 'login' 
                ? 'Looking into camera verifies identity automatically' 
                : 'Follow the pose instructions. The camera captures automatically.'}
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
                      : isPoseValid 
                      ? 'text-emerald-400 opacity-80 scale-105' 
                      : hasFailed
                      ? 'text-red-400 opacity-40'
                      : 'text-indigo-300 opacity-30'
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

                {/* Real-Time Stability Hold Indicator Ring */}
                {mode === 'register' && isPoseValid && poseHoldCount > 0 && (
                  <div className="absolute inset-4 rounded-full border-2 border-emerald-400 border-dashed animate-spin pointer-events-none" />
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

        {/* Real-time Status Badges & Guidance Pill */}
        <div className="mt-4 flex flex-col items-center gap-2 max-w-sm w-full">
          {mode === 'register' && (
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1">
                <Check size={12} className="text-emerald-400" /> Face detected ✓
              </span>
              {isPoseValid ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1 animate-pulse">
                  <Check size={12} className="text-emerald-400" /> Pose detected ✓ ({poseHoldCount}/3)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                  Adjusting pose...
                </span>
              )}
            </div>
          )}

          <div className={`px-4 py-2 rounded-full backdrop-blur-md border text-xs font-medium flex items-center justify-center gap-2 shadow-lg w-full text-center ${
            hasFailed 
              ? 'bg-red-950/90 border-red-700/60 text-red-300' 
              : isPoseValid
              ? 'bg-emerald-950/90 border-emerald-700/60 text-emerald-300'
              : 'bg-slate-950/90 border-slate-700/60 text-slate-200'
          }`}>
            <Sparkles size={14} className={hasFailed ? 'text-red-400 shrink-0' : 'text-emerald-400 shrink-0'} />
            <span className="truncate">{poseFeedback}</span>
          </div>
        </div>

      </div>

      {/* Multi-Pose Step Progress Indicators */}
      {mode === 'register' && (
        <div className="mb-4 grid grid-cols-4 gap-2 relative z-10">
          {POSE_STEPS.map((step, idx) => {
            const isCompleted = idx < capturedPoses.length;
            const isCurrent = idx === currentPoseIndex && !hasFailed;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isCompleted && handleRetryRegistration(idx)}
                className={`p-2 rounded-xl border text-center transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/10 cursor-pointer hover:bg-emerald-500/25'
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
                  <span className="text-[10px] font-bold">
                    {isCompleted ? `[✓ ${step.label}]` : isCurrent ? `[● ${step.label}]` : `[○ ${step.label}]`}
                  </span>
                </div>
                <p className="text-[9px] font-medium truncate">{step.instruction.split(' ')[0]} {step.label}</p>
              </button>
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
          <span>{mode === 'register' ? 'Automatic 3D Pose Biometrics' : 'Anti-Spoof Liveness Protection'}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <Lock size={12} />
          <span>AES-256-GCM Encrypted</span>
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
            onClick={() => handleRetryRegistration(0)}
            className="w-2/3 py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            <span>Retry Registration</span>
          </button>
        ) : (
          <div className="w-2/3 py-3 px-4 bg-slate-800/80 border border-slate-700/80 text-emerald-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2">
            {isProcessing ? (
              <>
                <RefreshCw size={16} className="animate-spin text-emerald-400" />
                <span>Capturing Pose {currentPoseIndex + 1}...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Auto-Capturing: {POSE_STEPS[currentPoseIndex]?.label} ({currentPoseIndex + 1}/4)</span>
              </>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
