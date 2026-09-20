import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router';
import {
  Eye, EyeOff, Loader2, GraduationCap, ShieldAlert,
  Sparkles, ShieldCheck, Lock, KeyRound, Monitor,
  Send, CheckCircle2, Shield, RefreshCw, UserPlus, UserCheck, User
} from 'lucide-react';
import { useAuth } from './AuthContext';
import client from '../../api/client';
import { PasskeyAuthModal } from '../../components/PasskeyAuthModal';
import { useDeviceType } from '../../hooks/useDeviceType';

export interface PortalLoginProps {
  role?: string;
}

const roleConfig: Record<string, { title: string, field: string, placeholder: string, icon: string, badge: string }> = {
  student: { title: 'Student Login', field: 'Email or Roll Number', placeholder: 'Enter your email or Roll No', icon: '🎓', badge: 'Student Portal' },
  faculty: { title: 'Faculty Login', field: 'Email or Employee ID', placeholder: 'Enter your email or Faculty ID', icon: '👨‍🏫', badge: 'Faculty Portal' },
  admin: { title: 'Administrator Login', field: 'Email or Username', placeholder: 'Enter administrator email', icon: '🛡️', badge: 'Admin Portal' },
  hod: { title: 'Head of Department Login', field: 'Email or Employee ID', placeholder: 'Enter your institutional email', icon: '🏛️', badge: 'HOD Portal' },
  parent: { title: 'Parent Login', field: 'Email or Parent ID', placeholder: 'Enter registered parent email', icon: '👨‍👩‍👧', badge: 'Parent Portal' },
  accountant: { title: 'Accountant Login', field: 'Email or Employee ID', placeholder: 'Enter accountant email', icon: '💰', badge: 'Accountant Portal' },
  librarian: { title: 'Librarian Login', field: 'Email or Employee ID', placeholder: 'Enter librarian email', icon: '📚', badge: 'Librarian Portal' },
  placement: { title: 'Placement Login', field: 'Email or Employee ID', placeholder: 'Enter placement officer email', icon: '🏢', badge: 'Placement Portal' },
  principal: { title: 'Principal Login', field: 'Email or Employee ID', placeholder: 'Enter principal email', icon: '👔', badge: 'Principal Portal' },
  office: { title: 'Office Staff Login', field: 'Email or Employee ID', placeholder: 'Enter office staff email', icon: '💼', badge: 'Office Portal' },
};

export const PortalLogin: React.FC<PortalLoginProps> = ({ role: propRole }) => {
  const { role: paramRole } = useParams<{ role: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isMobile, isDesktop } = useDeviceType();
  
  // Extract role from URL pathname (e.g. /student/login -> 'student')
  const getRoleFromPath = (pathname: string): string => {
    const validRoles = ['admin', 'student', 'faculty', 'hod', 'parent', 'principal', 'office', 'accountant', 'librarian', 'placement'];
    const segments = pathname.toLowerCase().split('/').filter(Boolean);
    for (const segment of segments) {
      if (validRoles.includes(segment)) {
        return segment;
      }
    }
    return '';
  };

  const getSubdomainRole = (): string => {
    if (typeof window === 'undefined') return '';
    const host = window.location.hostname.toLowerCase();
    const parts = host.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1] === 'localhost')) {
      const sub = parts[0];
      const validRoles = ['admin', 'student', 'faculty', 'hod', 'parent', 'principal', 'office', 'accountant', 'librarian', 'placement'];
      if (validRoles.includes(sub)) {
        return sub;
      }
    }
    return '';
  };

  const pathRole = getRoleFromPath(location.pathname);
  const subdomainRole = getSubdomainRole();
  const envRole = ((import.meta as any).env?.VITE_PORTAL_NAME || '').toLowerCase();

  // Priority order: 1. explicit prop -> 2. Route param -> 3. Pathname segments -> 4. Subdomain -> 5. Env var -> 6. Default
  const effectiveRole = (
    propRole ||
    paramRole ||
    pathRole ||
    subdomainRole ||
    envRole ||
    'student'
  ).toLowerCase();

  const config = roleConfig[effectiveRole] || roleConfig.student;

  // Standard Password Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [accountLocked, setAccountLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Authenticator / 2FA Code State (Desktop Mode)
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devCodeHint, setDevCodeHint] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleNavigateDashboard = (userRole: string, mustChangePassword?: boolean) => {
    if (mustChangePassword) {
      navigate('/force-change-password');
      return;
    }
    const rawRole = (userRole || effectiveRole || 'student').toLowerCase().replace(/[^a-z0-9]/g, '');
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
    const dest = roleMap[rawRole] || 'student';
    navigate(`/${dest}/dashboard`);
  };

  // Request Authenticator Code via Email
  const handleSendOtp = async () => {
    const targetIdentifier = authIdentifier.trim() || identifier.trim();
    if (!targetIdentifier) {
      setError('Please enter your email or username to receive the Authenticator code.');
      return;
    }

    setError('');
    setIsSendingOtp(true);
    try {
      const res = await client.post('/auth/send-login-otp', {
        identifier: targetIdentifier,
        portalRole: effectiveRole,
      });

      setOtpSent(true);
      setMaskedEmail(res.data.data?.maskedEmail || 'your email');
      if (res.data.data?.devCode) {
        setDevCodeHint(res.data.data.devCode);
      }
      setCooldown(60); // 60s cooldown
    } catch (err: any) {
      const errData = err.response?.data || {};
      setError(errData.message || 'Failed to dispatch authenticator code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Submit Authenticator Code Login (Desktop / Laptop)
  const handleAuthenticatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setWarningMessage('');
    setAccountLocked(false);

    const targetIdentifier = authIdentifier.trim() || identifier.trim();
    if (!targetIdentifier || !authCode.trim()) {
      setError('Please provide your identifier and 6-digit Authenticator code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await client.post('/auth/authenticator-login', {
        identifier: targetIdentifier,
        code: authCode.trim(),
        portalRole: effectiveRole,
      });

      const { token, user } = res.data.data;
      login(token, user);

      if (rememberMe) {
        localStorage.setItem('remembered_user', targetIdentifier);
      }

      handleNavigateDashboard(user.role, user.must_change_password);
    } catch (err: any) {
      const errData = err.response?.data || {};
      if (errData.accountLocked) {
        setAccountLocked(true);
        setError('Account temporarily locked due to multiple unsuccessful attempts.');
      } else {
        setError(errData.message || 'Invalid or expired Authenticator code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Standard Password Login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

      handleNavigateDashboard(user.role, user.must_change_password);
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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-10">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl border border-white/20 text-2xl">
              {config.icon}
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block">EduERP</span>
              <span className="text-xs text-blue-200 uppercase tracking-wider font-semibold">{config.badge}</span>
            </div>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
            Welcome to the <br/> {config.title.replace(' Login', '')} Portal
          </h1>

          <p className="text-blue-100/90 text-base max-w-md leading-relaxed mb-8">
            Sign in securely with your institutional credentials to access your ERP dashboard, academic records, and portal services.
          </p>

          <div className="flex flex-col gap-3 max-w-md">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-3 text-xs text-white">
              <ShieldCheck size={20} className="text-emerald-300 shrink-0" />
              <div>
                <span className="font-semibold block">Secure Enterprise Authentication</span>
                <span className="text-blue-100 text-[11px]">Protected by encrypted session management and role-based controls</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Abstract decorative shapes */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-20 -right-20 w-72 h-72 bg-indigo-500/25 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-blue-200/70 text-xs">
          &copy; {new Date().getFullYear()} College Management System. All rights reserved.
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative">

        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-5 sm:p-8">
          
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>{config.icon}</span>
                <span>{config.title}</span>
              </h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Sign in with your username or email and password.
            </p>
          </div>

          {/* Quick Portal Switcher Selector */}
          <div className="mb-5 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
              <span>Portal:</span>
            </span>
            <select
              value={effectiveRole}
              onChange={(e) => {
                setError('');
                setWarningMessage('');
                navigate(`/${e.target.value}/login`);
              }}
              className="w-full text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="student">🎓 Student Portal</option>
              <option value="faculty">👨‍🏫 Faculty Portal</option>
              <option value="admin">🛡️ Administrator Portal</option>
              <option value="hod">🏛️ Head of Dept (HOD) Portal</option>
              <option value="parent">👨‍👩‍👧 Parent Portal</option>
              <option value="placement">🏢 Placement Portal</option>
              <option value="librarian">📚 Librarian Portal</option>
              <option value="accountant">💰 Accountant Portal</option>
              <option value="principal">👔 Principal Portal</option>
              <option value="office">💼 Office Staff Portal</option>
            </select>
          </div>

          {/* Account Locked Banner */}
          {accountLocked && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-sm border border-red-200 dark:border-red-900/50 flex items-start gap-3">
              <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold">Account Temporarily Locked</p>
                <p className="text-xs mt-1">
                  Multiple unsuccessful attempts recorded. Please contact your administrator or reset your password.
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

          {/* Error Banner */}
          {!accountLocked && error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}

          {/* Standard Password Login Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4 animate-in fade-in zoom-in duration-300">
            <div>
              <label className="block text-xs font-semibold mb-1.5">{config.field}</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={config.placeholder}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm placeholder:text-slate-400 pr-12"
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

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
                <span className="font-medium text-slate-600 dark:text-slate-300">Remember me</span>
              </label>
              <Link 
                to={`/forgot-password?role=${effectiveRole}`} 
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 lg:hidden">
            &copy; {new Date().getFullYear()} College Management System. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

