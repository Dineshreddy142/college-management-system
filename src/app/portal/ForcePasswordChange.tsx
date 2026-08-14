import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldAlert, ArrowRight, LogOut } from 'lucide-react';
import { useAuth } from './AuthContext';
import client from '../../api/client';

export const ForcePasswordChange: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password requirement checks
  const isMinLength = newPassword.length >= 6;
  const isDifferentFromCurrent = newPassword.length > 0 && newPassword !== currentPassword;
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;
  const hasLetterAndNum = /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword);

  const isFormValid = isMinLength && isDifferentFromCurrent && isMatching && currentPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Please enter your current/default password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from your current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await client.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (res.data && res.data.success) {
        setSuccess('Password updated successfully! Redirecting to your dashboard...');
        
        // Update user state so must_change_password becomes false
        updateUser({ must_change_password: false });

        const userRole = (user?.role || 'student').toLowerCase().replace(/[^a-z0-9]/g, '');
        const roleMap: Record<string, string> = {
          admin: 'admin',
          student: 'student',
          faculty: 'faculty',
          hod: 'hod',
          parent: 'parent',
          accountant: 'accountant',
          librarian: 'librarian',
          placement: 'placement',
          principal: 'admin',
          office: 'admin'
        };
        const dest = roleMap[userRole] || 'student';

        setTimeout(() => {
          navigate(`/${dest}/dashboard`, { replace: true });
        }, 1500);
      } else {
        setError(res.data?.message || 'Failed to update password. Please check your current password.');
      }
    } catch (err: any) {
      console.error('Password change error:', err);
      const errMsg = err.response?.data?.message || 'An error occurred while updating your password. Please try again.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-lg bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-slate-700/80 shadow-2xl p-6 sm:p-8 z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-slate-700/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Mandatory Security Update</h1>
              <p className="text-xs text-slate-400">First-Time Login Password Reset</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all border border-slate-600/50"
            title="Sign out of account"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        {/* Informational Alert Box */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-sm flex gap-3 items-start">
          <KeyRound className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300">Welcome, {user?.name || user?.full_name || 'Student/User'}!</p>
            <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
              Your account was assigned a default temporary password. To secure your account and protect college records, you must create a new personal password before accessing the dashboard.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/50 border border-red-500/40 text-red-300 text-sm flex items-center gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Current / Default Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current default password"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              New Personal Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Realtime Password Criteria */}
          <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-700/60 text-xs space-y-1.5 mt-2">
            <p className="font-semibold text-slate-400 mb-1">Password Requirements:</p>
            <div className={`flex items-center gap-2 ${isMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${isMinLength ? 'opacity-100' : 'opacity-40'}`} />
              <span>At least 6 characters long</span>
            </div>
            <div className={`flex items-center gap-2 ${isDifferentFromCurrent ? 'text-emerald-400' : 'text-slate-500'}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${isDifferentFromCurrent ? 'opacity-100' : 'opacity-40'}`} />
              <span>Different from current default password</span>
            </div>
            <div className={`flex items-center gap-2 ${isMatching ? 'text-emerald-400' : 'text-slate-500'}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${isMatching ? 'opacity-100' : 'opacity-40'}`} />
              <span>Passwords match</span>
            </div>
            {newPassword.length > 0 && (
              <div className={`flex items-center gap-2 ${hasLetterAndNum ? 'text-emerald-400' : 'text-amber-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${hasLetterAndNum ? 'opacity-100' : 'opacity-40'}`} />
                <span>Includes letters and numbers (recommended)</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className={`w-full mt-4 py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              isFormValid && !isLoading
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-70'
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Save Password & Access Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
};
