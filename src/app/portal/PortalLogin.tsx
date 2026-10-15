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
import { FaceLoginModal } from '../../components/FaceLoginModal';
import { useDeviceType } from '../../hooks/useDeviceType';

export interface PortalLoginProps {
  role?: string;
}

const roleConfig: Record<string, { title: string, field: string, placeholder: string, icon: string, badge: string }> = {
  student: { title: 'Student Login', field: 'Email or Roll Number', placeholder: 'Enter your email or Roll No', icon: '🎓', badge: 'Student Portal' },
  faculty: { title: 'Faculty Login', field: 'Email or Employee ID', placeholder: 'Enter your email or Faculty ID', icon: '👨‍🏫', badge: 'Faculty Portal' },
  admin: { title: 'Administrator Login', field: 'Email or Username', placeholder: 'Enter administrator email', icon: '🛡️', badge: 'Admin Portal' },
  hod: { title: 'Head of Department Login', field: 'Email or Employee ID', placeholder: 'Enter your institutional email', icon: '🏛️', badge: 'HOD Portal' },
  dean: { title: 'Dean Login', field: 'Email or Employee ID', placeholder: 'Enter Dean email', icon: '🎓', badge: 'Dean Portal' },
  chancellor: { title: 'Chancellor Login', field: 'Email or Officer ID', placeholder: 'Enter Chancellor email', icon: '🏛️', badge: 'Chancellor Portal' },
  vicechancellor: { title: 'Vice Chancellor Login', field: 'Email or Officer ID', placeholder: 'Enter Vice Chancellor email', icon: '🏛️', badge: 'VC Portal' },
  registrar: { title: 'Registrar Login', field: 'Email or Officer ID', placeholder: 'Enter Registrar email', icon: '📋', badge: 'Registrar Portal' },
  coe: { title: 'Controller of Examinations Login', field: 'Email or Officer ID', placeholder: 'Enter COE email', icon: '📝', badge: 'COE Portal' },
  parent: { title: 'Parent Login', field: 'Email or Parent ID', placeholder: 'Enter registered parent email', icon: '👨‍👩‍👧', badge: 'Parent Portal' },
  accountant: { title: 'Accountant Login', field: 'Email or Employee ID', placeholder: 'Enter accountant email', icon: '💰', badge: 'Accountant Portal' },
  librarian: { title: 'Librarian Login', field: 'Email or Employee ID', placeholder: 'Enter librarian email', icon: '📚', badge: 'Librarian Portal' },
  placement: { title: 'Placement Login', field: 'Email or Employee ID', placeholder: 'Enter placement officer email', icon: '🏢', badge: 'Placement Portal' },
  principal: { title: 'Principal Login', field: 'Email or Employee ID', placeholder: 'Enter principal email', icon: '👔', badge: 'Principal Portal' },
  office: { title: 'Office Staff Login', field: 'Email or Employee ID', placeholder: 'Enter office staff email', icon: '💼', badge: 'Office Portal' },
  admission: { title: 'Admission Officer Login', field: 'Email or Officer ID', placeholder: 'Enter admission officer email', icon: '📝', badge: 'Admission Portal' },
};

export const PortalLogin: React.FC<PortalLoginProps> = ({ role: propRole }) => {
  const { role: paramRole } = useParams<{ role: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isMobile, isDesktop } = useDeviceType();
  
  // Extract role from URL pathname (e.g. /student/login -> 'student')
  const getRoleFromPath = (pathname: string): string => {
    const validRoles = ['admin', 'student', 'faculty', 'hod', 'dean', 'chancellor', 'vicechancellor', 'registrar', 'coe', 'parent', 'principal', 'office', 'accountant', 'librarian', 'placement'];
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
      const validRoles = ['admin', 'student', 'faculty', 'hod', 'dean', 'chancellor', 'vicechancellor', 'registrar', 'coe', 'parent', 'principal', 'office', 'accountant', 'librarian', 'placement'];
      if (validRoles.includes(sub)) {
        return sub;
      }
    }
    return '';
  };

  const pathRole = getRoleFromPath(location.pathname);
  const subdomainRole = getSubdomainRole();
  const envRole = ((import.meta as any).env?.VITE_PORTAL_NAME || '').toLowerCase();

  const effectiveRole = (
    propRole ||
    paramRole ||
    pathRole ||
    subdomainRole ||
    envRole ||
    'student'
  ).toLowerCase();

  const defaultConfig = {
    title: 'University Portal Login',
    field: 'Email, Username, or Institutional ID',
    placeholder: 'Enter your Email or ID (e.g. STU202601, CH202601)',
    icon: '🏛️',
    badge: 'Institutional Portal Login'
  };

  const isGenericLogin = location.pathname === '/login' || (!propRole && !paramRole && !pathRole);
  const config = isGenericLogin ? defaultConfig : (roleConfig[effectiveRole] || defaultConfig);

  // Standard Password Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [accountLocked, setAccountLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [loginMode, setLoginMode] = useState<'password' | 'face' | 'otp'>('password');

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
      chancellor: 'chancellor',
      vicechancellor: 'vicechancellor',
      registrar: 'registrar',
      coe: 'coe',
      controllerofexaminations: 'coe',
      dean: 'dean',
      hod: 'hod',
      student: 'student',
      faculty: 'faculty',
      parent: 'parent',
      accountant: 'accountant',
      librarian: 'librarian',
      placement: 'placement',
      placementofficer: 'placement',
      principal: 'admin',
      office: 'officestaff',
      officestaff: 'officestaff',
      staff: 'officestaff',
      admission: 'admission',
      admissionofficer: 'admission'
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
    <div className="min-h-screen flex bg-[#F1F5F9] dark:bg-slate-950 text-[#0F172A] dark:text-white">
      {/* Left side branding - Institutional Welcome */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#102A43] text-white p-12 flex-col justify-between relative border-r border-[#243B53]">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-xs">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block">EduERP</span>
              <span className="text-xs text-slate-300 uppercase tracking-wider font-medium">{config.badge}</span>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
              Integrated University Management ERP
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              Unified institutional portal for students, faculty, department leadership, and administration. Sign in with your verified credentials.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-[#243B53]/80 border border-white/10 flex items-center gap-3 text-xs">
                <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-white">Enterprise Role-Based Access Control</span>
                  <span className="text-slate-300 text-[11px]">Strict multi-tier authorization & encrypted telemetry audit logs</span>
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#243B53]/80 border border-white/10 flex items-center gap-3 text-xs">
                <KeyRound size={18} className="text-sky-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-white">Biometric & Multi-Factor Support</span>
                  <span className="text-slate-300 text-[11px]">Optional WebAuthn passkeys and verified AI facial telemetry</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-slate-400 text-xs flex items-center justify-between border-t border-white/10 pt-4">
          <span>&copy; {new Date().getFullYear()} University Management System</span>
          <span>Version 2.4 Enterprise</span>
        </div>
      </div>

      {/* Right side - Login Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-8 min-h-screen overflow-y-auto">

        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-8 my-auto">
          
          {/* Mobile Branding Header */}
          <div className="lg:hidden flex items-center justify-between mb-6 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#2563EB] text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-xs">
                <GraduationCap size={18} />
              </div>
              <div>
                <span className="font-bold text-sm text-[#0F172A] dark:text-white leading-none block">EduERP System</span>
                <span className="text-[10px] font-semibold text-[#2563EB] dark:text-blue-400 uppercase tracking-wider">{config.badge}</span>
              </div>
            </div>
          </div>

          {/* Card Header */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#102A43] dark:text-white tracking-tight">
              {config.title}
            </h2>
            <p className="text-[#64748B] dark:text-slate-400 text-xs mt-1">
              Sign in with your institutional email, roll number, or employee ID.
            </p>
          </div>

          {/* Account Locked Banner */}
          {accountLocked && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-[#B91C1C] dark:bg-red-950/40 dark:text-red-300 text-xs border border-red-200 dark:border-red-900/50 flex items-start gap-2.5">
              <ShieldAlert className="text-[#B91C1C] shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-semibold">Account Temporarily Locked</p>
                <p className="text-[11px] mt-0.5">
                  Multiple unsuccessful attempts recorded. Please contact your administrator or reset your password.
                </p>
              </div>
            </div>
          )}

          {/* Warning Banner */}
          {!accountLocked && warningMessage && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 text-[#B45309] dark:bg-amber-950/40 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-900/50 flex items-center gap-2">
              <ShieldAlert className="text-[#B45309] shrink-0" size={16} />
              <span>{warningMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {!accountLocked && error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-[#B91C1C] dark:bg-red-900/30 dark:text-red-400 text-xs font-medium border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          {/* Standard Login Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] dark:text-slate-300 mb-1.5">{config.field}</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={config.placeholder}
                className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all text-sm text-[#0F172A] dark:text-white placeholder:text-[#64748B]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all text-sm text-[#0F172A] dark:text-white placeholder:text-[#64748B] pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] dark:hover:text-slate-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] border-[#E2E8F0] dark:border-slate-600 bg-white dark:bg-slate-900"
                />
                <span className="font-medium text-[#64748B] dark:text-slate-300">Remember me</span>
              </label>
              <Link 
                to={`/forgot-password?role=${effectiveRole}`} 
                className="font-medium text-[#2563EB] hover:text-[#1D4ED8] dark:text-blue-400"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white rounded-lg font-medium text-sm shadow-xs transition-colors flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
              </button>

              {effectiveRole !== 'admin' ? (
                <button
                  type="button"
                  onClick={() => setShowFaceModal(true)}
                  className="w-full py-2 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-[#243B53] dark:text-slate-200 border border-[#E2E8F0] dark:border-slate-700 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck size={16} className="text-[#2563EB] dark:text-blue-400" />
                  <span>Instant Face Verification Login</span>
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1 font-medium">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>Institutional IAM & Session Encryption Enforced</span>
                </div>
              )}
            </div>
          </form>

          <FaceLoginModal
            isOpen={showFaceModal}
            onClose={() => setShowFaceModal(false)}
            identifier={identifier || authIdentifier}
            mode="login"
            onSuccess={(data) => {
              if (data?.token && data?.user) {
                login(data.token, data.user);
                handleNavigateDashboard(data.user.role, data.user.must_change_password);
              }
            }}
          />

          <div className="mt-6 pt-4 border-t border-[#E2E8F0] dark:border-slate-800 text-center text-[11px] text-[#64748B] dark:text-slate-400">
            &copy; {new Date().getFullYear()} University Management System. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

