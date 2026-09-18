import React, { useState, useEffect } from 'react';
import { 
  ScanFace, ShieldCheck, Fingerprint, KeyRound, Smartphone, Laptop, 
  CheckCircle2, AlertCircle, Loader2, X, ArrowRight, ShieldAlert, Lock
} from 'lucide-react';
import { checkWebAuthnCapability, registerPasskey, authenticatePasskey } from '../services/webauthn';

interface PasskeyAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'register' | 'login';
  identifier?: string;
  onSuccess?: (userData?: any) => void;
  onFallbackToPassword?: () => void;
}

export const PasskeyAuthModal: React.FC<PasskeyAuthModalProps> = ({
  isOpen,
  onClose,
  mode,
  identifier: initialIdentifier = '',
  onSuccess,
  onFallbackToPassword,
}) => {
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'info' | 'success' | 'error', title: string, desc: string } | null>(null);
  const [capability, setCapability] = useState<{ supported: boolean, hasPlatformAuthenticator: boolean }>({ supported: true, hasPlatformAuthenticator: true });

  useEffect(() => {
    setIdentifier(initialIdentifier);
    checkWebAuthnCapability().then(res => setCapability(res));
  }, [initialIdentifier, isOpen]);

  if (!isOpen) return null;

  const handleRegister = async () => {
    if (!identifier && mode === 'register') {
      setStatusMsg({
        type: 'error',
        title: 'College ID Required',
        desc: 'Please enter your College ID, Student Roll No, or Email address.',
      });
      return;
    }

    setLoading(true);
    setStatusMsg({
      type: 'info',
      title: 'Verify on Your Device',
      desc: 'Use Face ID, Touch ID, Fingerprint, or Device PIN to authorize biometric passkey registration.',
    });

    try {
      const res = await registerPasskey(identifier);
      setStatusMsg({
        type: 'success',
        title: 'Passkey Registered Successfully!',
        desc: 'Your mobile/device hardware is now linked to your College ID. You can now sign in seamlessly with Face ID / Fingerprint.',
      });
      setTimeout(() => {
        if (onSuccess) onSuccess(res);
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Passkey Registration Error:', err);
      const isCancelled = err.name === 'NotAllowedError' || err.message?.includes('canceled');
      setStatusMsg({
        type: 'error',
        title: isCancelled ? 'Biometric Verification Cancelled' : 'Registration Failed',
        desc: isCancelled 
          ? 'Verification was cancelled. Tap below to try again or choose password login.' 
          : (err.message || 'Failed to register biometric passkey.'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setStatusMsg({
        type: 'error',
        title: 'College ID / Username Required',
        desc: 'Please enter your Roll Number, Employee ID, or Email to continue.',
      });
      return;
    }

    setLoading(true);
    setStatusMsg({
      type: 'info',
      title: 'Awaiting Biometric Confirmation',
      desc: 'Verify using your device Face ID, Fingerprint, or Device Passcode.',
    });

    try {
      const data = await authenticatePasskey(identifier);
      setStatusMsg({
        type: 'success',
        title: 'Biometric Verification Successful!',
        desc: 'Redirecting to your role dashboard...',
      });
      setTimeout(() => {
        if (onSuccess) onSuccess(data);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Passkey Login Error:', err);
      const isCancelled = err.name === 'NotAllowedError' || err.message?.includes('canceled');
      setStatusMsg({
        type: 'error',
        title: isCancelled ? 'Verification Cancelled' : 'Authentication Failed',
        desc: isCancelled 
          ? 'You cancelled the device prompt. You can try again or log in with your password.' 
          : (err.message || 'Biometric authentication failed.'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Top Decorative Blob */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose} 
          disabled={loading}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-5">
          {mode === 'register' ? <ScanFace size={28} /> : <Fingerprint size={28} />}
        </div>

        {/* Title */}
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          {mode === 'register' ? 'Register Biometric / Passkey' : 'Login with Face / Biometric'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {mode === 'register' 
            ? 'Link your smartphone or laptop hardware (Face ID, Touch ID, Device PIN) to your College ID.'
            : 'Authenticate securely using your device native biometric hardware without typing passwords.'}
        </p>

        {/* Status Alert Banner */}
        {statusMsg && (
          <div className={`mt-4 p-4 rounded-2xl border text-xs flex items-start gap-3 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
              : statusMsg.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900/50'
          }`}>
            {statusMsg.type === 'success' && <CheckCircle2 size={18} className="flex-shrink-0 text-emerald-600 mt-0.5" />}
            {statusMsg.type === 'error' && <AlertCircle size={18} className="flex-shrink-0 text-rose-600 mt-0.5" />}
            {statusMsg.type === 'info' && <Loader2 size={18} className="flex-shrink-0 text-blue-600 animate-spin mt-0.5" />}
            <div>
              <p className="font-bold">{statusMsg.title}</p>
              <p className="mt-0.5 opacity-90">{statusMsg.desc}</p>
            </div>
          </div>
        )}

        {/* Form Inputs */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              College ID / Student Roll No / Email
            </label>
            <input
              type="text"
              placeholder="e.g. CS2021001 or admin@techuniv.edu"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading || (mode === 'login' && !!initialIdentifier)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Large Action Button */}
          <button
            onClick={mode === 'register' ? handleRegister : handleLogin}
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Verifying on Device...</span>
              </>
            ) : mode === 'register' ? (
              <>
                <ScanFace size={18} />
                <span>Register Biometric Passkey</span>
              </>
            ) : (
              <>
                <Fingerprint size={18} />
                <span>Login with Face / Biometric</span>
              </>
            )}
          </button>

          {/* Secure Fallback Option */}
          {onFallbackToPassword && (
            <button
              onClick={() => {
                onClose();
                onFallbackToPassword();
              }}
              disabled={loading}
              className="w-full py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lock size={13} />
              <span>Use standard Password / PIN login fallback</span>
            </button>
          )}

          {/* Hardware Security Notice */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>FIDO2 / WebAuthn Hardware Security Guarantee</span>
            </div>
            <p>
              Your face and biometric data remain exclusively stored in your mobile device secure enclave. Zero biometric images or vectors are sent to our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
