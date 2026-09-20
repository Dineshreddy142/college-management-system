import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle, AlertCircle, RefreshCw, X, ShieldCheck, UserCheck } from 'lucide-react';
import { faceAuthApi } from '../services/faceAuthApi';

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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('CAMERA_CAPTURE');
      setErrorMessage(null);
      setIsLoading(false);
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

  const startCamera = async () => {
    stopCameraStream();
    setErrorMessage(null);

    try {
      const challenge = await faceAuthApi.fetchChallengeNonce();
      setChallengeAction(challenge.challengeAction || 'BLINK_TWICE');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('[CAMERA ERROR]:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser.');
      } else {
        setErrorMessage('Unable to access camera device. Please check your camera hardware.');
      }
    }
  };

  const captureFrames = (): string[] => {
    const video = videoRef.current;
    if (!video) return [];

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const frames: string[] = [];
    for (let i = 0; i < 3; i++) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      frames.push(dataUrl);
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
      await startCamera();
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
              <p className="text-xs text-slate-400">Secure 1:1 Biometric Registration</p>
            </div>
          </div>
          <button
            onClick={() => { stopCameraStream(); onClose(); }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
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
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/80 text-xs text-cyan-300 font-medium">
              Challenge: Keep steady and {challengeAction.replace('_', ' ').toLowerCase()}
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
