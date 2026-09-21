import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle, AlertCircle, RefreshCw, X, ShieldCheck, UserCheck, VideoOff, Cpu } from 'lucide-react';
import { faceAuthApi } from '../services/faceAuthApi';
import { getResilientCameraStream, parseCameraError, createSimulatedCameraStream } from '../utils/cameraUtils';

interface FaceEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const FaceEnrollmentModal: React.FC<FaceEnrollmentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'CAMERA_CAPTURE' | 'PROCESSING' | 'SUCCESS'>('CAMERA_CAPTURE');
  const [challengeAction, setChallengeAction] = useState<string>('BLINK_TWICE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simulatedStopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('CAMERA_CAPTURE');
      setErrorMessage(null);
      setIsLoading(false);
      setIsSimulated(false);
      startCamera();
    } else {
      stopCameraStream();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (simulatedStopRef.current) {
      try {
        simulatedStopRef.current();
      } catch (e) {
        // Ignore
      }
      simulatedStopRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          // Ignore track stop errors
        }
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async (forceSimulated = false) => {
    stopCameraStream();
    setErrorMessage(null);

    // 1. Fetch challenge nonce first
    try {
      const challenge = await faceAuthApi.fetchChallengeNonce();
      setChallengeAction(challenge.challengeAction || 'BLINK_TWICE');
    } catch (err: any) {
      console.error('[CHALLENGE NONCE ERROR]:', err);
      // Challenge nonce error is a server issue, not camera hardware
      setErrorMessage(err.message || 'Unable to connect to Face ID server. Please try again.');
      return;
    }

    // 2. Acquire camera stream or virtual mode
    if (forceSimulated) {
      try {
        const { stream, stop } = createSimulatedCameraStream();
        simulatedStopRef.current = stop;
        mediaStreamRef.current = stream;
        setIsSimulated(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        return;
      } catch (e: any) {
        console.error('[VIRTUAL CAMERA ERROR]:', e);
      }
    }

    try {
      const stream = await getResilientCameraStream();
      mediaStreamRef.current = stream;
      setIsSimulated(false);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('[CAMERA ERROR]:', err);
      const friendlyMsg = parseCameraError(err);
      setErrorMessage(friendlyMsg);
    }
  };

  const captureFrames = (): string[] => {
    const video = videoRef.current;
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const frames: string[] = [];

    if (video && video.videoWidth > 0 && video.srcObject) {
      for (let i = 0; i < 3; i++) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        frames.push(dataUrl);
      }
    } else {
      // Draw fallback simulated canvas frame if video element stream is blank/simulated
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(320, 220, 80, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        frames.push(canvas.toDataURL('image/jpeg', 0.85));
      }
    }

    return frames;
  };

  const handleEnrollCapture = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setStep('PROCESSING');

    try {
      const challenge = await faceAuthApi.fetchChallengeNonce();
      const frames = captureFrames();

      if (frames.length === 0) {
        throw new Error('Failed to capture camera frames. Please ensure camera is active.');
      }

      await faceAuthApi.enrollFace(challenge.nonce, frames);
      
      stopCameraStream();
      setStep('SUCCESS');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('[ENROLLMENT ERROR]:', err);
      setErrorMessage(err.message || 'Face enrollment failed. Please try again.');
      setStep('CAMERA_CAPTURE');
      await startCamera(isSimulated);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Face ID Enrollment</h3>
              <p className="text-xs text-slate-400">
                {isSimulated ? 'Virtual Demo Camera Active' : 'Secure 1:1 Biometric Registration'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { stopCameraStream(); onClose(); }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert with Retry / Demo Fallback */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2 text-red-300 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-red-500/20">
              <button
                onClick={() => startCamera(false)}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 font-semibold text-[11px] flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3 h-3" /> Retry Hardware Camera
              </button>
              <button
                onClick={() => startCamera(true)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 font-semibold text-[11px] flex items-center gap-1 transition"
              >
                <Cpu className="w-3 h-3" /> Use Demo Virtual Camera
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Camera Capture */}
        {(step === 'CAMERA_CAPTURE' || step === 'PROCESSING') && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-slate-300">
              Position your face in the center frame and look directly into the camera.
            </p>

            <div className="relative w-full aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute inset-0 border-2 border-cyan-400/40 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-44 h-56 rounded-[50%] border-2 border-dashed border-cyan-400/70 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse" />
              </div>

              {isSimulated && (
                <div className="absolute top-2 left-2 bg-cyan-950/80 backdrop-blur-md border border-cyan-500/30 px-2.5 py-1 rounded-md text-[10px] text-cyan-300 font-bold flex items-center gap-1.5">
                  <Cpu className="w-3 h-3" /> Virtual Camera Active
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/80 text-xs text-cyan-300 font-medium flex items-center justify-between">
              <span>Challenge: Keep steady and {challengeAction.replace('_', ' ').toLowerCase()}</span>
              {!isSimulated && (
                <button
                  onClick={() => startCamera(true)}
                  className="text-[10px] text-slate-400 hover:text-cyan-300 underline"
                  title="Switch to virtual camera for testing"
                >
                  Switch to Virtual Camera
                </button>
              )}
            </div>

            <button
              onClick={handleEnrollCapture}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 font-bold text-sm transition shadow-lg shadow-cyan-950 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Encrypting & Registering...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" /> Capture & Register Face
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: Success */}
        {step === 'SUCCESS' && (
          <div className="py-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <UserCheck className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-lg text-white">Face ID Registered!</h4>
            <p className="text-xs text-slate-400">
              Your biometric face profile is encrypted and ready for 1:1 sign-in.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceEnrollmentModal;
