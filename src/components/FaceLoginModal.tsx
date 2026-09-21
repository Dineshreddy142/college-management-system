import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, AlertCircle, X, RefreshCw, Lock, ShieldAlert, Sparkles, Cpu } from 'lucide-react';
import { faceAuthApi, FaceAuthUser } from '../services/faceAuthApi';
import { getResilientCameraStream, parseCameraError, createSimulatedCameraStream } from '../utils/cameraUtils';

interface FaceLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultIdentifier?: string;
  onLoginSuccess: (token: string, user: FaceAuthUser) => void;
}

type AuthState =
  | 'IDLE'
  | 'REQUESTING_CAMERA'
  | 'CAMERA_READY'
  | 'CAPTURING'
  | 'SUBMITTING'
  | 'SUCCESS'
  | 'FAILURE'
  | 'RATE_LIMITED'
  | 'DISABLED';

export const FaceLoginModal: React.FC<FaceLoginModalProps> = ({
  isOpen,
  onClose,
  defaultIdentifier = '',
  onLoginSuccess
}) => {
  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [authState, setAuthState] = useState<AuthState>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [challengeActionText, setChallengeActionText] = useState('Keep face centered and look directly at camera');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isSimulated, setIsSimulated] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const simulatedStopRef = useRef<(() => void) | null>(null);

  // Sync defaultIdentifier
  useEffect(() => {
    if (defaultIdentifier) {
      setIdentifier(defaultIdentifier);
    }
  }, [defaultIdentifier]);

  /**
   * Strictly releases camera hardware resources and MediaStream tracks.
   */
  const stopCameraStream = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (simulatedStopRef.current) {
      try {
        simulatedStopRef.current();
      } catch (e) {
        // Ignore
      }
      simulatedStopRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (e) {
        console.warn('Error stopping camera track:', e);
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Clean unmount teardown
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Teardown camera when modal closes or is disabled
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setAuthState('IDLE');
      setErrorMessage('');
      setIsSimulated(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  /**
   * Starts face-verification pipeline.
   */
  const handleStartVerification = async (useSimulated = false) => {
    if (!identifier.trim()) {
      setErrorMessage('Please enter your Email, Roll Number, or Employee ID');
      return;
    }

    setErrorMessage('');
    setAuthState('REQUESTING_CAMERA');

    try {
      // 1. Request camera media stream (or virtual demo camera)
      let stream: MediaStream;

      if (useSimulated) {
        const { stream: simStream, stop } = createSimulatedCameraStream();
        simulatedStopRef.current = stop;
        stream = simStream;
        setIsSimulated(true);
      } else {
        stream = await getResilientCameraStream();
        setIsSimulated(false);
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setAuthState('CAMERA_READY');

      // 2. Fetch single-use challenge nonce from server
      const challenge = await faceAuthApi.fetchChallengeNonce();
      
      const actionLabels: Record<string, string> = {
        BLINK_TWICE: 'Blink twice naturally',
        TURN_HEAD_RIGHT: 'Turn head slightly right',
        TURN_HEAD_LEFT: 'Turn head slightly left',
        SMILE: 'Smile naturally at camera'
      };
      setChallengeActionText(actionLabels[challenge.challengeAction] || 'Keep face centered and look directly at camera');

      // 3. Capture 3 video frames onto canvas
      setAuthState('CAPTURING');
      const capturedFrames: string[] = [];

      for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 350));

        if (canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = 640;
          canvas.height = 480;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (video && video.videoWidth > 0 && video.srcObject) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            } else {
              // Draw fallback face graphic if video element source is not rendering frames
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(0, 0, 640, 480);
              ctx.fillStyle = '#38bdf8';
              ctx.beginPath();
              ctx.arc(320, 220, 80, 0, Math.PI * 2);
              ctx.fill();
            }
            const base64Jpeg = canvas.toDataURL('image/jpeg', 0.85);
            capturedFrames.push(base64Jpeg);
          }
        }
      }

      // Stop camera feed immediately after capture completes
      stopCameraStream();

      if (capturedFrames.length === 0) {
        throw new Error('Failed to capture clear camera frame. Please try again.');
      }

      // 4. Submit nonced frame payload to server for 1:1 verification
      setAuthState('SUBMITTING');
      const result = await faceAuthApi.faceLogin(
        identifier.trim(),
        challenge.transactionId,
        challenge.nonce,
        capturedFrames
      );

      // 5. Verification Success
      setAuthState('SUCCESS');
      onLoginSuccess(result.token, result.user);

      // Close modal after short success animation
      timerRef.current = setTimeout(() => {
        onClose();
      }, 1200);

    } catch (err: any) {
      stopCameraStream();

      if (err.status === 429 || err.code === 'RATE_LIMITED') {
        setAuthState('RATE_LIMITED');
        setCooldownSeconds(err.remainingSeconds || 900);
        setErrorMessage(`Face login is temporarily locked due to multiple failed attempts. Please sign in using password.`);
      } else if (err.status === 503 || err.code === 'FEATURE_DISABLED') {
        setAuthState('DISABLED');
        setErrorMessage('Face authentication is currently disabled by administrator.');
      } else {
        setAuthState('FAILURE');
        const parsedMsg = parseCameraError(err);
        setErrorMessage(parsedMsg);
      }
    }
  };

  const handleClose = () => {
    stopCameraStream();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Hidden canvas for video frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-3xl p-6 shadow-2xl relative text-white">
        {/* Header Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close Modal"
        >
          <X size={18} />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 shadow-md">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Face ID Verification</h3>
            <p className="text-xs text-slate-400">
              {isSimulated ? 'Virtual Demo Camera Active' : 'EduERP Biometric Sign-In'}
            </p>
          </div>
        </div>

        {/* User Identifier Input */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Institutional Identifier (Roll No / Email / Employee ID)
          </label>
          <input
            type="text"
            placeholder="e.g. 21B01A0501 or user@university.edu"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={authState === 'CAPTURING' || authState === 'SUBMITTING' || authState === 'SUCCESS'}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
          />
        </div>

        {/* Video Viewport / Viewport States */}
        <div className="relative w-full h-64 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center mb-5">
          {/* Live Webcam Stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover transform -scale-x-100 ${
              authState === 'CAMERA_READY' || authState === 'CAPTURING' ? 'block' : 'hidden'
            }`}
          />

          {/* Positioning Reticle Guide */}
          {(authState === 'CAMERA_READY' || authState === 'CAPTURING') && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-44 h-56 border-2 border-dashed border-blue-400/70 rounded-[50px] shadow-[0_0_25px_rgba(59,130,246,0.3)] animate-pulse" />
            </div>
          )}

          {/* Viewport Overlay Text */}
          {authState === 'CAPTURING' && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-blue-950/80 backdrop-blur-md border border-blue-500/40 px-3.5 py-1.5 rounded-full text-xs font-medium text-blue-200 shadow-lg flex items-center gap-2">
              <RefreshCw size={12} className="animate-spin text-blue-400" />
              {challengeActionText}
            </div>
          )}

          {/* Idle / Permission States */}
          {authState === 'IDLE' && (
            <div className="text-center p-6 text-slate-400">
              <Camera size={44} className="mx-auto mb-2 text-slate-500 opacity-60" />
              <p className="text-xs text-slate-300">Click button below to enable camera and verify face</p>
            </div>
          )}

          {authState === 'REQUESTING_CAMERA' && (
            <div className="text-center p-6 text-blue-300">
              <RefreshCw size={36} className="mx-auto mb-2 animate-spin text-blue-400" />
              <p className="text-xs">Requesting camera permissions...</p>
            </div>
          )}

          {authState === 'SUBMITTING' && (
            <div className="text-center p-6 text-blue-300">
              <RefreshCw size={36} className="mx-auto mb-2 animate-spin text-blue-400" />
              <p className="text-xs font-semibold">Verifying biometrics with server...</p>
              <p className="text-[10px] text-slate-400 mt-1">Executing 1:1 match verification</p>
            </div>
          )}

          {authState === 'SUCCESS' && (
            <div className="text-center p-6 text-emerald-400">
              <CheckCircle2 size={48} className="mx-auto mb-2 text-emerald-400 animate-bounce" />
              <p className="text-sm font-bold text-white">Face Verified!</p>
              <p className="text-xs text-emerald-300/80 mt-0.5">Redirecting to portal...</p>
            </div>
          )}

          {authState === 'FAILURE' && (
            <div className="text-center p-6 text-rose-400">
              <AlertCircle size={44} className="mx-auto mb-2 text-rose-400" />
              <p className="text-xs font-medium text-rose-200">Camera / Verification Issue</p>
            </div>
          )}

          {authState === 'RATE_LIMITED' && (
            <div className="text-center p-6 text-amber-400">
              <ShieldAlert size={44} className="mx-auto mb-2 text-amber-400" />
              <p className="text-xs font-medium text-amber-200">Face Login Cooldown Active</p>
              <p className="text-[10px] text-slate-400 mt-1">Please sign in with password</p>
            </div>
          )}

          {authState === 'DISABLED' && (
            <div className="text-center p-6 text-slate-400">
              <Lock size={44} className="mx-auto mb-2 text-slate-500" />
              <p className="text-xs font-medium">Feature Disabled</p>
            </div>
          )}
        </div>

        {/* User-facing error messaging with retry and virtual camera actions */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-200 leading-relaxed space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-rose-500/20">
              <button
                onClick={() => handleStartVerification(false)}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium text-[11px] flex items-center gap-1 transition"
              >
                <RefreshCw size={10} /> Retry Hardware Camera
              </button>
              <button
                onClick={() => handleStartVerification(true)}
                className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 font-medium text-[11px] flex items-center gap-1 transition"
              >
                <Cpu size={10} /> Use Demo Virtual Camera
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {authState !== 'SUCCESS' && (
            <button
              onClick={() => handleStartVerification(false)}
              disabled={authState === 'REQUESTING_CAMERA' || authState === 'CAPTURING' || authState === 'SUBMITTING'}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all text-sm shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
            >
              {authState === 'IDLE' && <>Start Face Scan &rarr;</>}
              {authState === 'FAILURE' && <>Retry Face Scan &rarr;</>}
              {authState === 'RATE_LIMITED' && <>Retry Face Scan &rarr;</>}
              {(authState === 'REQUESTING_CAMERA' || authState === 'CAPTURING' || authState === 'SUBMITTING') && (
                <>Processing...</>
              )}
            </button>
          )}

          {/* Password Fallback Button */}
          <button
            onClick={handleClose}
            className="w-full py-2.5 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-colors text-xs flex items-center justify-center gap-1.5"
          >
            <Lock size={12} />
            Sign In with Password Instead
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaceLoginModal;
