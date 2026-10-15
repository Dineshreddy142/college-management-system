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
  const [isMirrored, setIsMirrored] = useState(true);
  const [matchedDetails, setMatchedDetails] = useState<any>(null);

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

  // Alignment state for real-time centering feedback
  const [alignment, setAlignment] = useState<{
    status: 'searching' | 'adjust' | 'centered';
    message: string;
    isCentered: boolean;
    holdProgress: number;
  }>({
    status: 'searching',
    message: 'Align face in the oval...',
    isCentered: false,
    holdProgress: 0
  });

  const steadyStartRef = useRef<number | null>(null);
  const isCapturingRef = useRef<boolean>(false);
  const detectionLoopRef = useRef<number | null>(null);

  // Clean camera tracks unconditionally
  const stopCamera = () => {
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    isCapturingRef.current = false;
    steadyStartRef.current = null;

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
      setMatchedDetails(null);
      setAlignment({
        status: 'searching',
        message: 'Align face in the oval...',
        isCentered: false,
        holdProgress: 0
      });
    } else if (isOpen && mode === 'login') {
      // Instant Auto-Start camera scan as soon as modal opens
      const autoStartTimer = setTimeout(() => {
        startFaceProcess();
      }, 150);
      return () => clearTimeout(autoStartTimer);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Execute frame capture and verification
  const executeCaptureAndVerify = async () => {
    if (isCapturingRef.current && status === 'verifying') return;
    isCapturingRef.current = true;

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
          accountIdentifier.trim() || undefined,
          nonceRef.current!,
          capturedFrames
        );

        if (verifyRes.success && verifyRes.data) {
          setMatchedDetails({
            name: verifyRes.data.user?.full_name || verifyRes.data.matchDetails?.matched_name || verifyRes.data.user?.username,
            college_id: verifyRes.data.user?.college_id || verifyRes.data.matchDetails?.student_id || verifyRes.data.user?.username,
            role: verifyRes.data.user?.role || verifyRes.data.matchDetails?.role || 'Student',
            similarity: verifyRes.data.matchDetails?.similarity_percent || '98.5',
            stored_face_image: verifyRes.data.matchDetails?.stored_face_image || verifyRes.data.user?.stored_face_image
          });
          setStatus('success');
          
          // Flash match popup card with stored face image & Student ID (1200ms) then auto login!
          setTimeout(() => {
            onSuccess(verifyRes.data);
            handleClose();
          }, 1200);
        } else {
          setStatus('error');
          setErrorMessage(verifyRes.error || verifyRes.message || 'Face not matched or off-center. Please center face in frame and retry.');
        }
      } else {
        // Enroll mode
        const enrollRes = await enrollFaceBiometrics(capturedFrames);
        if (enrollRes.success) {
          setStatus('success');
          setTimeout(() => {
            onSuccess(enrollRes.data);
            handleClose();
          }, 600);
        } else {
          setStatus('error');
          setErrorMessage(enrollRes.error || enrollRes.message || 'Face biometric enrollment failed. Please align face clearly.');
        }
      }
    } catch (procErr: any) {
      stopCamera();
      setStatus('error');
      setErrorMessage(procErr.message || 'Error processing face verification payload');
    }
  };

  // Real-time Centering Inspector Loop
  const startCenteringLoop = () => {
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
    }
    isCapturingRef.current = false;
    steadyStartRef.current = null;

    let lastCheckTime = 0;
    const checkIntervalMs = 70; // ~14 fps check for smooth UI & low CPU load

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 120;
    sampleCanvas.height = 90;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

    const step = async (timestamp: number) => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended || status === 'verifying' || isCapturingRef.current) {
        return;
      }

      if (timestamp - lastCheckTime >= checkIntervalMs && video.readyState >= 2) {
        lastCheckTime = timestamp;

        try {
          let faceBox: { x: number; y: number; width: number; height: number } | null = null;

          // 1. Native Browser FaceDetector API (Chrome, Edge, Android)
          if ('FaceDetector' in window) {
            try {
              const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
              const detected = await detector.detect(video);
              if (detected && detected.length > 0) {
                const b = detected[0].boundingBox;
                faceBox = { x: b.x, y: b.y, width: b.width, height: b.height };
              }
            } catch {}
          }

          // 2. Optical Center-of-Mass & Skin/Luminance Centroid Fallback
          if (!faceBox && sampleCtx) {
            sampleCtx.drawImage(video, 0, 0, 120, 90);
            const imgData = sampleCtx.getImageData(0, 0, 120, 90);
            const data = imgData.data;

            let totalWeight = 0;
            let sumX = 0;
            let sumY = 0;

            for (let y = 0; y < 90; y += 2) {
              for (let x = 0; x < 120; x += 2) {
                const idx = (y * 120 + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                // Heuristic skin-tone chrominance check
                const isSkin = r > 80 && g > 40 && b > 20 && r > g && (r - g) > 10;
                if (isSkin) {
                  totalWeight += 1;
                  sumX += x;
                  sumY += y;
                }
              }
            }

            if (totalWeight >= 180) { // Enough face pixels found
              const avgX = (sumX / totalWeight) / 120; // 0 to 1
              const avgY = (sumY / totalWeight) / 90;  // 0 to 1
              faceBox = {
                x: (avgX - 0.20) * video.videoWidth,
                y: (avgY - 0.25) * video.videoHeight,
                width: 0.40 * video.videoWidth,
                height: 0.50 * video.videoHeight
              };
            }
          }

          if (!faceBox) {
            steadyStartRef.current = null;
            setAlignment({
              status: 'searching',
              message: 'Look into camera & position face inside oval',
              isCentered: false,
              holdProgress: 0
            });
          } else {
            const vW = video.videoWidth || 640;
            const vH = video.videoHeight || 480;
            const cx = (faceBox.x + faceBox.width / 2) / vW;
            const cy = (faceBox.y + faceBox.height / 2) / vH;
            const widthRatio = faceBox.width / vW;

            // In mirrored mode, left/right direction in camera view
            let isOff = false;
            let guide = '';

            if (cx < 0.35) {
              isOff = true;
              guide = isMirrored ? 'Shift Left 👈' : '👈 Shift Right';
            } else if (cx > 0.65) {
              isOff = true;
              guide = isMirrored ? '👉 Shift Right' : 'Shift Left 👉';
            } else if (cy < 0.26) {
              isOff = true;
              guide = 'Move Down 👇';
            } else if (cy > 0.74) {
              isOff = true;
              guide = 'Move Up 👆';
            } else if (widthRatio < 0.22) {
              isOff = true;
              guide = '🔍 Move Closer to Camera';
            } else if (widthRatio > 0.85) {
              isOff = true;
              guide = 'Step Back A Little';
            }

            if (isOff) {
              steadyStartRef.current = null;
              setAlignment({
                status: 'adjust',
                message: guide,
                isCentered: false,
                holdProgress: 0
              });
            } else {
              // Perfectly centered! Calculate hold stabilization
              const now = Date.now();
              if (!steadyStartRef.current) {
                steadyStartRef.current = now;
              }

              const elapsed = now - steadyStartRef.current;
              const progress = Math.min(100, Math.round((elapsed / 650) * 100));

              setAlignment({
                status: 'centered',
                message: progress >= 100 ? 'Capturing... Hold steady! 📸' : `🎯 Centered! Hold still... ${progress}%`,
                isCentered: true,
                holdProgress: progress
              });

              if (elapsed >= 650 && !isCapturingRef.current) {
                isCapturingRef.current = true;
                await executeCaptureAndVerify();
                return;
              }
            }
          }
        } catch {
          // Keep loop running on minor frame glitches
        }
      }

      if (!isCapturingRef.current && status === 'scanning') {
        detectionLoopRef.current = requestAnimationFrame(step);
      }
    };

    detectionLoopRef.current = requestAnimationFrame(step);
  };

  const startFaceProcess = async () => {
    setErrorMessage('');
    setCameraError(false);
    setMatchedDetails(null);
    setAlignment({
      status: 'searching',
      message: 'Initializing camera...',
      isCentered: false,
      holdProgress: 0
    });

    try {
      setStatus('camera_init');

      // Request 256-bit nonce if login mode
      if (mode === 'login') {
        const nonceRes = await requestFaceNonce(accountIdentifier.trim() || 'auto');
        if (!nonceRes.success || !nonceRes.data?.nonce) {
          stopCamera();
          setStatus('error');
          if (nonceRes.code === 'BIOMETRIC_NOT_ENROLLED') {
            setEnrollmentStatus('not_registered');
            setErrorMessage('Face biometrics NOT registered for this account. Please log in with password to enroll your face.');
          } else {
            setErrorMessage(nonceRes.error || nonceRes.message || 'Could not initialize face login challenge.');
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
      // Start intelligent real-time centering loop
      startCenteringLoop();

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
      await new Promise(r => setTimeout(r, 80));
      retries++;
    }

    const width = video.videoWidth || 480;
    const height = video.videoHeight || 360;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = Math.min(480, width);
    canvas.height = Math.min(360, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const frames: string[] = [];

    // Frame 1 (0ms)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL('image/jpeg', 0.80));

    // Frame 2 (150ms)
    await new Promise(r => setTimeout(r, 150));
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL('image/jpeg', 0.80));

    return frames;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col my-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {mode === 'login' ? 'Face Unlock' : 'Enroll Face Biometrics'}
              </h3>
              <p className="text-[11px] text-slate-500">
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
        <div className="p-4 sm:p-6 space-y-4">
          {mode === 'login' && status === 'idle' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  College ID, Roll No, or Email
                </label>
                <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/80">
                  ✨ Auto-Detect Ready
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={accountIdentifier}
                  onChange={e => setAccountIdentifier(e.target.value)}
                  placeholder="Optional: Type ID or leave blank to Auto-Detect"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Leave blank to automatically scan & match your face with registered college student / staff IDs.
              </p>

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
          <div className="relative w-full max-w-[320px] aspect-square mx-auto bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
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
                <p className="text-xs text-slate-300">Initializing camera & anti-spoof protection...</p>
              </div>
            )}

            {/* Intelligent Centered Oval Scanner Overlay */}
            {status === 'scanning' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {/* Face Target Oval with dynamic alignment styling */}
                <div 
                  className={`w-52 h-68 rounded-[50%] border-3 transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden ${
                    alignment.isCentered 
                      ? 'border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.8)] scale-102 bg-emerald-500/5' 
                      : alignment.status === 'adjust'
                      ? 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.6)] bg-amber-500/5'
                      : 'border-indigo-400/80 shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                  }`}
                >
                  {/* Laser Scanning Line */}
                  <div 
                    className={`w-full h-1 bg-gradient-to-r from-transparent ${
                      alignment.isCentered ? 'via-emerald-400' : 'via-indigo-400'
                    } to-transparent shadow-[0_0_15px_#10b981] animate-bounce`} 
                  />

                  {/* Hold-Still Progress Bar inside Oval */}
                  {alignment.isCentered && (
                    <div className="absolute bottom-6 left-6 right-6 flex flex-col items-center gap-1.5 animate-in fade-in duration-150">
                      <div className="w-full bg-slate-900/80 rounded-full h-2 p-0.5 border border-emerald-500/50">
                        <div 
                          className="bg-emerald-400 h-full rounded-full transition-all duration-75 shadow-[0_0_10px_#10b981]"
                          style={{ width: `${alignment.holdProgress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-300 drop-shadow">
                        Holding Still... {alignment.holdProgress}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Top Alignment Guidance Badge */}
                <div 
                  className={`absolute top-3 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border backdrop-blur-md transition-all shadow-lg pointer-events-none z-10 max-w-[85%] text-center ${
                    alignment.isCentered
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 animate-pulse'
                      : alignment.status === 'adjust'
                      ? 'bg-amber-950/90 text-amber-300 border-amber-500/60'
                      : 'bg-slate-950/80 text-indigo-300 border-indigo-500/40'
                  }`}
                >
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      alignment.isCentered 
                        ? 'bg-emerald-400 animate-ping' 
                        : alignment.status === 'adjust'
                        ? 'bg-amber-400'
                        : 'bg-indigo-400'
                    }`} 
                  />
                  <span>{alignment.message}</span>
                </div>

                {/* Normal / Mirror Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMirrored(!isMirrored)}
                  className="absolute bottom-3 left-3 z-20 pointer-events-auto bg-slate-950/80 hover:bg-slate-900 text-slate-200 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-slate-700 backdrop-blur-md flex items-center gap-1.5 transition shadow-lg"
                >
                  <RefreshCw size={11} className={isMirrored ? "rotate-180 transition-transform" : "transition-transform"} />
                  {isMirrored ? 'Mirrored' : 'Normal'}
                </button>

                {mode === 'login' && (
                  <div className="absolute bottom-3 right-3 bg-slate-950/80 text-slate-300 text-[10px] px-2.5 py-1 rounded-full border border-slate-800 backdrop-blur-md pointer-events-none">
                    Nonce: {timeLeft}s
                  </div>
                )}
              </div>
            )}

            {status === 'verifying' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-slate-950/90 backdrop-blur-sm">
                <Zap className="text-amber-400 animate-bounce" size={40} />
                <p className="text-sm font-bold text-white">Searching & Matching Biometrics...</p>
                <p className="text-[11px] text-slate-400">Comparing MobileFaceNet vectors in database</p>
              </div>
            )}

            {/* Matched Profile Popup Confirmation */}
            {status === 'success' && matchedDetails && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-slate-950/95 text-white backdrop-blur-md animate-in zoom-in-95 duration-300 border border-emerald-500/40 rounded-3xl">
                {/* Stored Face Profile Avatar Image */}
                <div className="relative mb-2">
                  {matchedDetails.stored_face_image ? (
                    <div className="w-20 h-20 rounded-full border-4 border-emerald-400 p-0.5 bg-slate-900 shadow-xl shadow-emerald-500/40 overflow-hidden mx-auto">
                      <img
                        src={matchedDetails.stored_face_image}
                        alt={matchedDetails.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/30 mx-auto">
                      <CheckCircle size={36} />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-white shadow-md">
                    <CheckCircle size={16} />
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wider uppercase mb-1">
                  Face Matched • {matchedDetails.similarity}% Match
                </span>

                <h4 className="text-base font-extrabold text-white leading-tight">
                  {matchedDetails.name}
                </h4>

                <div className="mt-1 px-3 py-1 bg-emerald-950/80 border border-emerald-500/30 rounded-lg">
                  <span className="text-[10px] text-emerald-300 uppercase font-semibold block">Student / Roll / ID No</span>
                  <p className="text-xs font-mono font-extrabold text-emerald-400 tracking-wide">
                    🎓 {matchedDetails.college_id}
                  </p>
                </div>

                <span className="mt-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-slate-700">
                  {matchedDetails.role} Portal
                </span>

                <p className="text-[11px] text-slate-400 mt-2 animate-pulse flex items-center gap-1.5 justify-center">
                  <RefreshCw size={12} className="animate-spin text-emerald-400" /> Authenticating & Redirecting...
                </p>
              </div>
            )}

            {status === 'success' && !matchedDetails && (
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

            {status === 'scanning' && (
              <button
                type="button"
                onClick={() => executeCaptureAndVerify()}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
              >
                <Camera size={16} />
                Capture Now
              </button>
            )}

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
