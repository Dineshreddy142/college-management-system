import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import {
  ArrowLeft, Loader2, Mail, KeyRound, CheckCircle2, ShieldAlert,
  Send, Lock, RefreshCw, Sparkles, UserCheck, ShieldCheck
} from 'lucide-react';
import client from '../../api/client';

export interface UpdateEmailProps {
  role?: string;
}

const ROLE_DISPLAY: Record<string, { name: string; placeholder: string; icon: string }> = {
  student: { name: 'Student Portal', placeholder: 'Roll Number or Student Email', icon: '🎓' },
  faculty: { name: 'Faculty Portal', placeholder: 'Employee ID or Faculty Email', icon: '👨‍🏫' },
  admin: { name: 'Admin Portal', placeholder: 'Admin Email or Username', icon: '🛡️' },
  hod: { name: 'HOD Portal', placeholder: 'Employee ID or HOD Email', icon: '🏛️' },
  parent: { name: 'Parent Portal', placeholder: 'Parent ID or Email', icon: '👨‍👩‍👧' },
  placement: { name: 'Placement Portal', placeholder: 'Placement ID or Email', icon: '🏢' },
  librarian: { name: 'Librarian Portal', placeholder: 'Librarian ID or Email', icon: '📚' },
  accountant: { name: 'Accountant Portal', placeholder: 'Accountant ID or Email', icon: '💰' },
  principal: { name: 'Principal Portal', placeholder: 'Principal ID or Email', icon: '👔' },
  office: { name: 'Office Staff Portal', placeholder: 'Employee ID or Email', icon: '💼' },
};

export const UpdateEmail: React.FC<UpdateEmailProps> = ({ role: propRole }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlRole = searchParams.get('role') || '';
  const currentRole = (propRole || urlRole || 'student').toLowerCase();
  const roleInfo = ROLE_DISPLAY[currentRole] || ROLE_DISPLAY.student;

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Info, 2: OTP verify, 3: Success
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devCodeHint, setDevCodeHint] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Request Email Update Verification Code
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!identifier.trim() || !password.trim() || !newEmail.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setError('Please enter a valid new email address format.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await client.post('/auth/request-email-update-otp', {
        identifier: identifier.trim(),
        password,
        newEmail: newEmail.trim(),
        portalRole: currentRole,
      });

      if (res.data && res.data.success) {
        setMaskedEmail(res.data.data?.maskedEmail || newEmail.trim());
        if (res.data.data?.devCode) {
          setDevCodeHint(res.data.data.devCode);
        }
        setMessage(`Verification code dispatched to ${newEmail.trim()}`);
        setStep(2);
        setCooldown(60);
      } else {
        setError(res.data?.message || 'Failed to initiate email change.');
      }
    } catch (err: any) {
      console.error('Request email OTP error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to dispatch verification code.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Confirm OTP & Update Email
  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await client.post('/auth/confirm-email-update', {
        identifier: identifier.trim(),
        password,
        newEmail: newEmail.trim(),
        otp: otp.trim(),
        portalRole: currentRole,
      });

      if (res.data && res.data.success) {
        setMessage('Your email address has been updated successfully!');
        setStep(3);
      } else {
        setError(res.data?.message || 'Email update confirmation failed.');
      }
    } catch (err: any) {
      console.error('Confirm email update error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to verify code and update email.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setError('');
    setIsLoading(true);
    try {
      const res = await client.post('/auth/request-email-update-otp', {
        identifier: identifier.trim(),
        password,
        newEmail: newEmail.trim(),
        portalRole: currentRole,
      });
      if (res.data && res.data.success) {
        setMessage(`New verification code sent to ${newEmail.trim()}`);
        if (res.data.data?.devCode) {
          setDevCodeHint(res.data.data.devCode);
        }
        setCooldown(60);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-4 sm:p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 sm:p-8">
        
        {/* Back Link */}
        <button
          onClick={() => navigate(`/${currentRole}/login`)}
          className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft size={16} className="mr-1.5 transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to {roleInfo.name} Login</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-500/20">
            {roleInfo.icon}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Update Registered Email</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{roleInfo.name}</p>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 text-xs font-medium border border-red-200 dark:border-red-900/50 flex items-start gap-2">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message && step !== 3 && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {/* STEP 1: Provide Credentials & New Email */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200">
              <p className="font-semibold mb-0.5">🔒 Secure Email Update</p>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                Provide your current account identifier and password to authorize your new email address.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">
                Current Account Identifier
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={roleInfo.placeholder}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">Account Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">New Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="newemail@example.com"
                  className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm placeholder:text-slate-400"
                  required
                />
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                A 6-digit confirmation code will be sent to this email address.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                  <>
                    <Send size={16} />
                    <span>Send Verification Code</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Verify 6-digit OTP sent to New Email */}
        {step === 2 && (
          <form onSubmit={handleConfirmOtp} className="space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
              <p className="font-semibold mb-0.5">Verification Code Sent</p>
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                Please enter the 6-digit code dispatched to <strong>{maskedEmail}</strong>.
              </p>
              {devCodeHint && (
                <span className="mt-1.5 inline-block text-[11px] font-mono font-bold bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded text-blue-800 dark:text-blue-200">
                  Demo Code: {devCodeHint}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold">6-Digit Verification Code</label>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading || cooldown > 0}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cooldown > 0 ? (
                    <span>Resend in {cooldown}s</span>
                  ) : (
                    <>
                      <RefreshCw size={12} />
                      <span>Resend Code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 123456"
                  className="w-full px-4 py-3 text-center tracking-[0.4em] font-mono text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                  required
                />
                <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Verify & Update Email</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                &larr; Change Email Address or Identifier
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success Confirmation */}
        {step === 3 && (
          <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Email Updated Successfully!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Your registered email address has been updated to <strong>{newEmail}</strong>.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              You can now use your new email address to sign in, receive Authenticator 2FA codes, and reset your password.
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate(`/${currentRole}/login`)}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to {roleInfo.name} Login &rarr;</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UpdateEmail;
