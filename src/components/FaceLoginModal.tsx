import React, { useState, useEffect, useRef } from 'react';
import { Camera, ShieldCheck, AlertCircle, RefreshCw, X, CheckCircle, Zap } from 'lucide-react';
import { requestFaceNonce, verifyFaceLogin, enrollFaceBiometrics } from '../api/faceAuthApi';

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
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nonceRef = useRef<string | null>(null);
  const timerRef = useRef<any>(null);

  // Sync prop identifier
  useEffect(() => {
    if (identifier) setAccountIdentifier(identifier);
  }, [identifier]);

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
          setErrorMessage(nonceRes.error || 'Could not initialize face login challenge.');
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

      // Initialize WebCam
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus('scanning');

      // Sample 2 frames over 300ms for temporal liveness
      setTimeout(async () => {
        try {
          const capturedFrames = await captureFramesFromVideo();
          stopCamera();

          if (capturedFrames.length === 0) {
            setStatus('error');
            setErrorMessage('Could not capture clear video frames from camera');
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
              setErrorMessage(verifyRes.error || verifyRes.message || 'Face authentication verification failed');
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
      }, 1000);

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
    if (!video || !video.videoWidth || !video.videoHeight) return [];

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = Math.min(640, video.videoWidth);
    canvas.height = Math.min(480, video.videoHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const frames: string[] = [];

    // Frame 1
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL('image/jpeg', 0.85));

    // Delay 250ms for real temporal motion liveness delta across video stream
    await new Promise(r => setTimeout(r, 250));

    // Frame 2
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL('image/jpeg', 0.85));

    return frames;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {mode === 'login' ? 'Face Authentication' : 'Enroll Face Biometrics'}
              </h3>
              <p className="text-xs text-slate-500">
                {mode === 'login' ? 'Secure passwordless 1:1 verification' : 'Register your biometric profile'}
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
              <input
                type="text"
                value={accountIdentifier}
                onChange={e => setAccountIdentifier(e.target.value)}
                placeholder="e.g. CS2021001 or admin@college.edu"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Camera Container */}
          <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${status === 'scanning' ? 'block' : 'hidden'}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {status === 'idle' && (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
                <Camera className="text-slate-600 dark:text-slate-500 mb-1" size={40} />
                <p className="text-xs text-slate-400">Click below to activate camera and start scanning</p>
              </div>
            )}

            {status === 'camera_init' && (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                <RefreshCw className="text-indigo-500 animate-spin" size={32} />
                <p className="text-xs text-slate-300">Initializing camera & 256-bit challenge...</p>
              </div>
            )}

            {status === 'scanning' && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 border-2 border-indigo-500/50 rounded-2xl">
                <div className="flex justify-between items-center bg-slate-950/60 backdrop-blur-sm px-3 py-1.5 rounded-full w-fit text-[11px] font-semibold text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-2" />
                  Scanning Face...
                </div>
                {mode === 'login' && (
                  <div className="self-end bg-slate-950/70 text-slate-300 text-[10px] px-2.5 py-1 rounded-full border border-slate-800">
                    Nonce: {timeLeft}s remaining
                  </div>
                )}
              </div>
            )}

            {status === 'verifying' && (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 bg-slate-950/90">
                <Zap className="text-amber-400 animate-bounce" size={36} />
                <p className="text-xs font-semibold text-white">Verifying 512-d Biometric Similarity...</p>
                <p className="text-[10px] text-slate-400">Liveness motion & AES-256 GCM check</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-2 bg-emerald-950/90 text-emerald-300">
                <CheckCircle size={44} className="text-emerald-400" />
                <p className="text-sm font-bold">Face Verified!</p>
                <p className="text-[10px]">Authenticating user session...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-2 bg-red-950/90 text-red-300">
                <AlertCircle size={36} className="text-red-400" />
                <p className="text-xs font-semibold">Verification Failed</p>
              </div>
            )}
          </div>

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Controls */}
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
                {status === 'error' ? 'Retry Face Scan' : mode === 'login' ? 'Start Face Login' : 'Start Face Enrollment'}
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span>AES-256-GCM Encrypted Biometrics</span>
          <span>UltraFace + MobileFaceNet</span>
        </div>
      </div>
    </div>
  );
}
