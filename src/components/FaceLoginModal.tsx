import React, { useState, useEffect, useRef } from 'react';
import { Camera, ShieldCheck, AlertCircle, RefreshCw, X, CheckCircle, Zap, UserX, UserCheck } from 'lucide-react';
import { requestFaceNonce, verifyFaceLogin, enrollFaceBiometrics, getFaceAuthStatus } from '../api/faceAuthApi';

interface FaceLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  identifier?: string;
  mode?: 'login' | 'enroll';
  onSuccess: (data?: any) => void;
}

export function FaceLoginModal({
  isOpen,
  onClose,
  identifier = '',
  mode = 'login',
  onSuccess
}: FaceLoginModalProps) {
  const [accountIdentifier, setAccountIdentifier] = useState(identifier);
  const [status, setStatus] = useState<'idle' | 'camera_init' | 'scanning' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'idle' | 'checking' | 'registered' | 'not_registered'>('idle');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nonceRef = useRef<string | null>(null);
  const timerRef = useRef<any>(null);

  // Sync prop identifier
  useEffect(() => {
    if (identifier) setAccountIdentifier(identifier);
  }, [identifier]);

  // Check enrollment status when account identifier changes in login mode
  useEffect(() => {
    if (isOpen && mode === 'login' && accountIdentifier.trim()) {
      const timeoutId = setTimeout(() => {
        checkUserRegistration(accountIdentifier.trim());
      }, 400);
      return () => clearTimeout(timeoutId);
    }
  }, [accountIdentifier, isOpen, mode]);

  const checkUserRegistration = async (id: string) => {
    if (!id) return;
    setEnrollmentStatus('checking');
    try {
      const res = await getFaceAuthStatus(id);
      if (res.success && res.data) {
        if (res.data.is_enrolled) {
          setEnrollmentStatus('registered');
        } else {
          setEnrollmentStatus('not_registered');
        }
      } else {
        setEnrollmentStatus('idle');
      }
    } catch {
      setEnrollmentStatus('idle');
    }
  };

  // Clean camera tracks unconditionally
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setStatus('idle');
      setErrorMessage('');
      setEnrollmentStatus('idle');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const startFaceProcess = async () => {
    setErrorMessage('');
    setCameraError(false);

    if (mode === 'login' && !accountIdentifier.trim()) {
      setErrorMessage('Please enter your account email, username, or roll number');
      return;
    }

    try {
      setStatus('camera_init');

      // Request 256-bit nonce if login mode
      if (mode === 'login') {
        const nonceRes = await requestFaceNonce(accountIdentifier.trim());
        if (!nonceRes.success || !nonceRes.data?.nonce) {
          stopCamera();
          setStatus('error');
          if (nonceRes.code === 'BIOMETRIC_NOT_ENROLLED') {
            setEnrollmentStatus('not_registered');
            setErrorMessage('Face biometrics NOT registered for this account. Please log in with password to enroll your face.');
          } else {
            setErrorMessage(nonceRes.error || 'Could not initialize face login challenge.');
          }
          return;
        }
        nonceRef.current = nonceRes.data.nonce;
        setTimeLeft(15);

        // Start 15-second timer
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              stopCamera();
              setStatus('error');
              setErrorMessage('15-second face challenge expired. Please click Retry.');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      // Initialize WebCam with video constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus('scanning');

      // Allow camera stream video dimensions to stabilize before frame sampling
      setTimeout(async () => {
        try {
          const capturedFrames = await captureFramesFromVideo();
          stopCamera();

          if (capturedFrames.length === 0) {
            setStatus('error');
            setErrorMessage('Camera feed not ready or face frame capture failed. Please retry.');
            return;
          }

          setStatus('verifying');

          if (mode === 'login') {
            const verifyRes = await verifyFaceLogin(
              accountIdentifier.trim(),
              nonceRef.current!,
              capturedFrames
            );

            if (verifyRes.success && verifyRes.data) {
              setStatus('success');
              setTimeout(() => {
                onSuccess(verifyRes.data);
                handleClose();
              }, 800);
            } else {
              setStatus('error');
              setErrorMessage(verifyRes.error || verifyRes.message || 'Face verification failed');
            }
          } else {
            // Enroll mode
            const enrollRes = await enrollFaceBiometrics(capturedFrames);
            if (enrollRes.success) {
              setStatus('success');
              setTimeout(() => {
                onSuccess(enrollRes.data);
                handleClose();
              }, 800);
            } else {
              setStatus('error');
              setErrorMessage(enrollRes.error || enrollRes.message || 'Face biometric enrollment failed');
            }
          }
        } catch (procErr: any) {
          stopCamera();
          setStatus('error');
          setErrorMessage(procErr.message || 'Error processing face verification payload');
        }
      }, 1200);

    } catch (camErr: any) {
      stopCamera();
      setStatus('error');
      setCameraError(true);
      if (camErr.name === 'NotAllowedError' || camErr.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access denied. Please grant browser camera permissions and retry.');
      } else {
        setErrorMessage(camErr.message || 'Camera initialization error');
      }
    }
  };

  const captureFramesFromVideo = async (): Promise<string[]> => {
    const video = videoRef.current;
    if (!video) return [];

    let retries = 0;
    while ((!video.videoWidth || !video.videoHeight || video.readyState < 2) && retries < 10) {
      await new Promise(r => setTimeout(r, 200));
      retries++;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = Math.min(640, width);
    canvas.height = Math.min(480, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const frames: string[] = [];

    // Frame 1
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL('image/jpeg', 0.85));

    // Delay 300ms for temporal motion liveness delta across video stream
    await new Promise(r => setTimeout(r, 300));

    // Frame 2
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL('image/jpeg', 0.85));

    return frames;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {mode === 'login' ? 'Face Unlock' : 'Enroll Face Biometrics'}
              </h3>
              <p className="text-xs text-slate-500">
                {mode === 'login' ? 'Instant passwordless AI face verification' : 'Register your facial profile'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {mode === 'login' && status === 'idle' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Account Email, Username, or Roll Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={accountIdentifier}
                  onChange={e => setAccountIdentifier(e.target.value)}
                  placeholder="e.g. CS2021001 or admin@college.edu"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Registration Status Indicator Badge */}
              {accountIdentifier.trim() && (
                <div className="flex items-center gap-2 pt-1">
                  {enrollmentStatus === 'checking' && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <RefreshCw size={12} className="animate-spin" /> Checking registration status...
                    </span>
                  )}
                  {enrollmentStatus === 'registered' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <UserCheck size={14} /> Face Registered & Ready
                    </span>
                  )}
                  {enrollmentStatus === 'not_registered' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <UserX size={14} /> Face Not Registered
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Camera Scanner Box */}
          <div className="relative w-full aspect-square bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${status === 'scanning' ? 'opacity-100' : 'opacity-0 absolute'}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {status === 'idle' && (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-indigo-500/50 flex items-center justify-center bg-indigo-500/10 text-indigo-400 animate-pulse">
                  <Camera size={36} />
                </div>
                <p className="text-xs text-slate-400">Position your face inside the circle & click start</p>
              </div>
            )}

            {status === 'camera_init' && (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                <RefreshCw className="text-indigo-500 animate-spin" size={36} />
                <p className="text-xs text-slate-300">Initializing camera & 256-bit challenge...</p>
              </div>
            )}

            {/* Mobile-Style Oval Scanner Overlay */}
            {status === 'scanning' && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Face Target Oval */}
                <div className="w-56 h-72 rounded-[50%] border-2 border-indigo-400/80 shadow-[0_0_30px_rgba(99,102,241,0.3)] flex flex-col items-center justify-center relative overflow-hidden animate-pulse">
                  {/* Laser Scanning Line */}
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_15px_#818cf8] animate-bounce" />
                </div>

                <div className="absolute top-4 left-4 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-semibold text-emerald-400 flex items-center gap-2 border border-slate-800">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Scanning Face...
                </div>

                {mode === 'login' && (
                  <div className="absolute bottom-4 right-4 bg-slate-950/80 text-slate-300 text-[10px] px-3 py-1 rounded-full border border-slate-800 backdrop-blur-md">
                    Nonce: {timeLeft}s
                  </div>
                )}
              </div>
            )}

            {status === 'verifying' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-slate-950/90 backdrop-blur-sm">
                <Zap className="text-amber-400 animate-bounce" size={40} />
                <p className="text-sm font-bold text-white">Matching Facial Vectors...</p>
                <p className="text-[11px] text-slate-400">Comparing 512-d MobileFaceNet embeddings</p>
              </div>
            )}

            {status === 'success' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-emerald-950/95 text-emerald-300 backdrop-blur-sm animate-in zoom-in-95 duration-200">
                <CheckCircle size={52} className="text-emerald-400 animate-bounce" />
                <p className="text-base font-bold text-white">Face Verified!</p>
                <p className="text-xs text-emerald-300">Authenticating session...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-red-950/95 text-red-300 backdrop-blur-sm">
                <AlertCircle size={44} className="text-red-400 animate-bounce" />
                <p className="text-sm font-bold text-white">
                  {enrollmentStatus === 'not_registered' ? 'Face Not Registered' : 'Verification Failed'}
                </p>
              </div>
            )}
          </div>

          {/* Error Display */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleClose}
              className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>

            {(status === 'idle' || status === 'error') && (
              <button
                onClick={startFaceProcess}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
              >
                <ShieldCheck size={16} />
                {status === 'error' ? 'Retry Face Scan' : mode === 'login' ? 'Start Face Unlock' : 'Start Face Enrollment'}
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span>AES-256-GCM Encrypted Biometrics</span>
          <span>MobileFaceNet 512-d AI</span>
        </div>
      </div>
    </div>
  );
}
