import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Eye, EyeOff, Loader2, GraduationCap, ShieldAlert, ScanFace, Sparkles, ShieldCheck, Lock, KeyRound } from 'lucide-react';
import { useAuth } from './AuthContext';
import client from '../../api/client';
import { FaceAuthModal } from '../../components/FaceAuthModal';

const roleConfig: Record<string, { title: string, field: string, placeholder: string }> = {
  admin: { title: 'Administrator Login', field: 'Email', placeholder: 'admin@collegeerp.com' },
  hod: { title: 'Head of Department Login', field: 'Email or Employee ID', placeholder: 'hod@collegeerp.com' },
  faculty: { title: 'Faculty Login', field: 'Email or Employee ID', placeholder: 'faculty@collegeerp.com' },
  student: { title: 'Student Login', field: 'Email or Roll Number', placeholder: 'student@collegeerp.com' },
  parent: { title: 'Parent Login', field: 'Email or Parent ID', placeholder: 'parent@collegeerp.com' },
  accountant: { title: 'Accountant Login', field: 'Email or Employee ID', placeholder: 'accounts@collegeerp.com' },
  librarian: { title: 'Librarian Login', field: 'Email or Employee ID', placeholder: 'librarian@collegeerp.com' },
  placement: { title: 'Placement Login', field: 'Email or Employee ID', placeholder: 'placement@collegeerp.com' },
  principal: { title: 'Principal Login', field: 'Email or Employee ID', placeholder: 'principal@collegeerp.com' },
  office: { title: 'Office Staff Login', field: 'Email or Employee ID', placeholder: 'accounts@collegeerp.com' },
};

export const PortalLogin: React.FC = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const effectiveRole = ((import.meta as any).env?.VITE_PORTAL_NAME || role || 'admin').toLowerCase();
  const config = roleConfig[effectiveRole] || roleConfig.admin;
  
  // Login Mode: 'face' (Primary / Default) or 'password'
  const [loginMethod, setLoginMethod] = useState<'face' | 'password'>('face');

  // Standard Password Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [accountLocked, setAccountLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Face Authentication Modal Toggle
  const [showFaceAuth, setShowFaceAuth] = useState(false);

  const handleNavigateDashboard = (userRole: string) => {
    const rawRole = (userRole || role || 'admin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const roleMap: Record<string, string> = {
      admin: 'admin',
      student: 'student',
      faculty: 'faculty',
      hod: 'hod',
      parent: 'parent',
      accountant: 'accountant',
      librarian: 'librarian',
      placement: 'placement',
      placementofficer: 'placement',
      principal: 'admin',
      office: 'admin'
    };
    const dest = roleMap[rawRole] || 'admin';
    navigate(`/${dest}/dashboard`);
  };

  const handleFaceSuccess = (data: { token: string; user: any }) => {
    login(data.token, data.user);
    setShowFaceAuth(false);
    handleNavigateDashboard(data.user.role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setWarningMessage('');
    setAccountLocked(false);
    
    if (!identifier.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await client.post('/login', {
        identifier,
        password,
        role: effectiveRole,
        portalRole: effectiveRole
      });
      
      const { token, user } = res.data.data;
      login(token, user);
      
      if (rememberMe) {
        localStorage.setItem('remembered_user', identifier);
      } else {
        localStorage.removeItem('remembered_user');
      }

      handleNavigateDashboard(user.role);
    } catch (err: any) {
      const errData = err.response?.data || {};
      if (errData.accountLocked) {
        setAccountLocked(true);
        setError('Account temporarily locked due to multiple unsuccessful attempts. Please reset your password or contact an administrator.');
      } else if (errData.isWarning || errData.data?.isWarning) {
        setWarningMessage('⚠️ Security Warning: Repeated failed login attempts detected.');
        setError('');
      } else {
        setError(errData.message || 'Invalid credentials or unauthorized portal access.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      {/* Left side styling - Illustration / Welcome */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-12">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap size={24} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">EduERP</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Welcome to the <br/> {config.title.replace(' Login', '')}
          </h1>
          <p className="text-blue-100 text-lg max-w-md">
            Sign in instantly using high-security 3D Face Biometrics or standard password credentials.
          </p>

          <div className="mt-8 flex flex-col gap-3 max-w-sm">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-3 text-xs text-white">
              <ShieldCheck size={18} className="text-emerald-300 shrink-0" />
              <span>AES-256 Encrypted Biometric Vectors</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-3 text-xs text-white">
              <Sparkles size={18} className="text-amber-300 shrink-0" />
              <span>Anti-Spoofing: Photo & Screen Replays Blocked</span>
            </div>
          </div>
        </div>
        
        {/* Abstract decorative shapes */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-20 -right-20 w-72 h-72 bg-indigo-500/30 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-blue-100/60 text-sm">
          &copy; {new Date().getFullYear()} College Management System. All rights reserved.
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
          
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">{config.title}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Choose your preferred sign-in method
              </p>
            </div>
          </div>

          {/* Primary / Secondary Method Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setLoginMethod('face')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                loginMethod === 'face'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ScanFace size={16} />
              <span>Face Login (Primary)</span>
            </button>

            <button
              type="button"
              onClick={() => setLoginMethod('password')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                loginMethod === 'password'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound size={16} />
              <span>Password</span>
            </button>
          </div>

          {/* Account Locked Banner */}
          {accountLocked && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-sm border border-red-200 dark:border-red-900/50 flex items-start gap-3">
              <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold">Account Temporarily Locked</p>
                <p className="text-xs mt-1">
                  Multiple unsuccessful password attempts recorded. Use Face Biometrics or contact your administrator.
                </p>
              </div>
            </div>
          )}

          {/* Warning Banner */}
          {!accountLocked && warningMessage && (
            <div className="mb-5 p-3 rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-900/50 flex items-center gap-2">
              <ShieldAlert className="text-amber-600 shrink-0" size={16} />
              <span>{warningMessage}</span>
            </div>
          )}

          {/* Login Error Banner */}
          {!accountLocked && error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}

          {/* ============================================================ */}
          {/* PRIMARY METHOD: FACE BIOMETRICS HERO CARD */}
          {/* ============================================================ */}
          {loginMethod === 'face' && (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="p-6 rounded-3xl bg-gradient-to-b from-indigo-50/50 to-blue-50/30 dark:from-slate-900 dark:to-slate-900/50 border border-indigo-100 dark:border-indigo-900/40 text-center flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 animate-pulse">
                    <ScanFace size={40} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white shadow-md">
                    <ShieldCheck size={14} />
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  1-Click Instant Face Login
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Look into your webcam to instantly verify your 3D live facial signature.
                </p>

                <div className="w-full mt-6">
                  <button
                    type="button"
                    onClick={() => setShowFaceAuth(true)}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5"
                  >
                    <ScanFace size={20} />
                    <span>Scan Face to Sign In</span>
                  </button>
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setLoginMethod('password')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Or sign in with email & password &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* ALTERNATIVE METHOD: PASSWORD LOGIN FORM */}
          {/* ============================================================ */}
          {loginMethod === 'password' && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in zoom-in duration-300">
              <div>
                <label className="block text-sm font-medium mb-1.5">{config.field}</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={config.placeholder}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm placeholder:text-slate-400 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                  <span className="font-medium text-slate-600 dark:text-slate-300">Remember me</span>
                </label>
                <Link to={`/forgot-password?role=${role}`} className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Forgot Password?
                </Link>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Sign In with Password'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 lg:hidden">
            &copy; {new Date().getFullYear()} College Management System. All rights reserved.
          </div>
        </div>
      </div>

      {/* SECURE FACE AUTHENTICATION MODAL */}
      {showFaceAuth && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <FaceAuthModal
            mode="login"
            portalRole={effectiveRole}
            onSuccess={handleFaceSuccess}
            onCancel={() => setShowFaceAuth(false)}
          />
        </div>
      )}
    </div>
  );
};

