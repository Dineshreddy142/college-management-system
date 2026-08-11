import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router';
import {
  Eye, EyeOff, Loader2, GraduationCap, ShieldAlert, ScanFace,
  Sparkles, ShieldCheck, Lock, KeyRound, Monitor, Smartphone,
  Send, CheckCircle2, Shield, RefreshCw, UserPlus, UserCheck, User
} from 'lucide-react';
import { useAuth } from './AuthContext';
import client from '../../api/client';
import { FaceAuthModal } from '../../components/FaceAuthModal';
import { useDeviceType } from '../../hooks/useDeviceType';

export interface PortalLoginProps {
  role?: string;
}

const roleConfig: Record<string, { title: string, field: string, placeholder: string, icon: string, badge: string }> = {
  student: { title: 'Student Login', field: 'Email or Roll Number', placeholder: 'student@collegeerp.com', icon: '🎓', badge: 'Student Portal' },
  faculty: { title: 'Faculty Login', field: 'Email or Employee ID', placeholder: 'faculty@collegeerp.com', icon: '👨‍🏫', badge: 'Faculty Portal' },
  admin: { title: 'Administrator Login', field: 'Email', placeholder: 'admin@collegeerp.com', icon: '🛡️', badge: 'Admin Portal' },
  hod: { title: 'Head of Department Login', field: 'Email or Employee ID', placeholder: 'hod@collegeerp.com', icon: '🏛️', badge: 'HOD Portal' },
  parent: { title: 'Parent Login', field: 'Email or Parent ID', placeholder: 'parent@collegeerp.com', icon: '👨‍👩‍👧', badge: 'Parent Portal' },
  accountant: { title: 'Accountant Login', field: 'Email or Employee ID', placeholder: 'accounts@collegeerp.com', icon: '💰', badge: 'Accountant Portal' },
  librarian: { title: 'Librarian Login', field: 'Email or Employee ID', placeholder: 'librarian@collegeerp.com', icon: '📚', badge: 'Librarian Portal' },
  placement: { title: 'Placement Login', field: 'Email or Employee ID', placeholder: 'placement@collegeerp.com', icon: '🏢', badge: 'Placement Portal' },
  principal: { title: 'Principal Login', field: 'Email or Employee ID', placeholder: 'principal@collegeerp.com', icon: '👔', badge: 'Principal Portal' },
  office: { title: 'Office Staff Login', field: 'Email or Employee ID', placeholder: 'accounts@collegeerp.com', icon: '💼', badge: 'Office Portal' },
};

export const PortalLogin: React.FC<PortalLoginProps> = ({ role: propRole }) => {
  const { role: paramRole } = useParams<{ role: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const detectedDevice = useDeviceType();

  // Manual device override for preview/testing
  const [deviceOverride, setDeviceOverride] = useState<'auto' | 'desktop' | 'mobile'>('auto');
  const isMobile = deviceOverride === 'auto' ? detectedDevice.isMobile : deviceOverride === 'mobile';
  const isDesktop = !isMobile;
  
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
  
  // Login Mode: On Desktop -> 'authenticator' | 'password'. On Mobile -> 'face' | 'password'
  const [loginMethod, setLoginMethod] = useState<'authenticator' | 'face' | 'password'>(
    isMobile ? 'face' : 'authenticator'
  );

  // Synchronize default tab whenever device mode changes
  useEffect(() => {
    if (isDesktop && loginMethod === 'face') {
      setLoginMethod('authenticator');
    } else if (isMobile && loginMethod === 'authenticator') {
      setLoginMethod('face');
    }
  }, [isDesktop, isMobile]);

  // Standard Password Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [accountLocked, setAccountLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Registration Mode State
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regRole, setRegRole] = useState(effectiveRole);

  useEffect(() => {
    setRegRole(effectiveRole);
  }, [effectiveRole]);

  // Authenticator / 2FA Code State (Desktop Mode)
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devCodeHint, setDevCodeHint] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Face Authentication Modal Toggle (Mobile Mode)
  const [showFaceAuth, setShowFaceAuth] = useState(false);

  // Cooldown countdown timer for sending OTP
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setWarningMessage('');

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await client.post('/auth/register', {
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole || effectiveRole,
        identifier: regIdentifier.trim()
      });

      if (res.data && res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);
        handleNavigateDashboard(user.role);
      } else {
        setError(res.data?.message || 'Registration failed.');
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message && err.message.includes('Network Error')) {
        setError('Unable to reach backend server. Please verify your connection.');
      } else {
        setError(err.message || 'Registration failed. Please check your details and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateDashboard = (userRole: string) => {
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

  const handleFaceSuccess = (data: { token: string; user: any }) => {
    login(data.token, data.user);
    setShowFaceAuth(false);
    handleNavigateDashboard(data.user.role);
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

      handleNavigateDashboard(user.role);
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
            {isDesktop
              ? 'Workstation & Monitor Access: Sign in securely with two-factor Authenticator verification codes or password credentials.'
              : 'Mobile Smartphone Access: Sign in instantly with high-precision 3D Face Biometrics or password credentials.'}
          </p>

          {/* Dynamic Security Highlights based on Device Type */}
          <div className="flex flex-col gap-3 max-w-md">
            {isDesktop ? (
              <>
                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-3 text-xs text-white">
                  <ShieldCheck size={20} className="text-emerald-300 shrink-0" />
                  <div>
                    <span className="font-semibold block">Two-Factor Authenticator Protection</span>
                    <span className="text-blue-100 text-[11px]">Time-synchronized 6-digit security code authentication</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-3 text-xs text-white">
                  <Monitor size={20} className="text-cyan-300 shrink-0" />
                  <div>
                    <span className="font-semibold block">Laptop & External Monitor Optimization</span>
                    <span className="text-blue-100 text-[11px]">Enforces secure 2FA protocol across all desktop browsers</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-3 text-xs text-white">
                  <ScanFace size={20} className="text-cyan-300 shrink-0" />
                  <div>
                    <span className="font-semibold block">1-Click Mobile Face Biometrics</span>
                    <span className="text-blue-100 text-[11px]">Fast camera recognition tailored for smartphone screens</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-3 text-xs text-white">
                  <Sparkles size={20} className="text-amber-300 shrink-0" />
                  <div>
                    <span className="font-semibold block">Anti-Spoofing & Liveness Detection</span>
                    <span className="text-blue-100 text-[11px]">Blocks photo, replay, and screen impersonation attacks</span>
                  </div>
                </div>
              </>
            )}
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
        
        {/* Device Mode Switcher Pill (Preview / Testing Aid) */}
        <div className="w-full max-w-md mb-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 pl-2">
            {isDesktop ? (
              <>
                <Monitor size={15} className="text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Laptop / Desktop Mode</span>
              </>
            ) : (
              <>
                <Smartphone size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Mobile Smartphone Mode</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setDeviceOverride('desktop')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                isDesktop
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Test Laptop / Desktop login experience"
            >
              🖥️ Laptop
            </button>
            <button
              type="button"
              onClick={() => setDeviceOverride('mobile')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                isMobile
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Test Mobile Phone login experience"
            >
              📱 Mobile
            </button>
          </div>
        </div>

        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
          
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>{config.icon}</span>
                <span>{isRegisterMode ? `Create ${config.title.replace(' Login', '')} Account` : config.title}</span>
              </h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              {isRegisterMode
                ? `Sign up with your credentials to access the ${config.title.replace(' Login', '')} portal.`
                : isDesktop
                ? 'Laptop / PC detected: Authenticator Code or Password login required.'
                : 'Mobile device detected: 1-Click Face Biometrics or Password login available.'}
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

          {/* ============================================================ */}
          {/* REGISTRATION FORM (CREATE ACCOUNT MODE)                      */}
          {/* ============================================================ */}
          {isRegisterMode ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-in fade-in zoom-in duration-300">
              <div>
                <label className="block text-xs font-semibold mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm placeholder:text-slate-400"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <User size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder={config.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm placeholder:text-slate-400"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Send size={15} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">Account Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-medium"
                  >
                    <option value="student">🎓 Student</option>
                    <option value="faculty">👨‍🏫 Faculty</option>
                    <option value="admin">🛡️ Administrator</option>
                    <option value="hod">🏛️ Head of Dept</option>
                    <option value="parent">👨‍👩‍👧 Parent</option>
                    <option value="principal">🎓 Principal</option>
                    <option value="office">💼 Office Staff</option>
                    <option value="accountant">💰 Accountant</option>
                    <option value="librarian">📚 Librarian</option>
                    <option value="placement">🏢 Placement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {regRole === 'student' ? 'Roll Number' : regRole === 'parent' ? 'Phone / Child ID' : 'Employee ID'}
                  </label>
                  <input
                    type="text"
                    value={regIdentifier}
                    onChange={(e) => setRegIdentifier(e.target.value)}
                    placeholder={regRole === 'student' ? 'e.g. CS2026001' : 'e.g. EMP1024'}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm placeholder:text-slate-400 pr-12"
                    required
                    minLength={6}
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

              <div>
                <label className="block text-xs font-semibold mb-1">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm placeholder:text-slate-400"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                    <>
                      <UserPlus size={18} />
                      <span>Create Account & Sign In</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setWarningMessage('');
                      setIsRegisterMode(false);
                    }}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          ) : (
            <>
              {/* Primary / Secondary Method Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-6">
                {/* DESKTOP MODE: Authenticator Code Tab (Face Login is HIDDEN on Desktop) */}
                {isDesktop && (
                  <button
                    type="button"
                    onClick={() => setLoginMethod('authenticator')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      loginMethod === 'authenticator'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Shield size={16} />
                    <span>Authenticator Code</span>
                  </button>
                )}

                {/* MOBILE MODE: Face Login Tab (Only displayed on Mobile Phones) */}
                {isMobile && (
                  <button
                    type="button"
                    onClick={() => setLoginMethod('face')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      loginMethod === 'face'
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ScanFace size={16} />
                    <span>Face Biometrics</span>
                  </button>
                )}

                {/* Password Login Tab (Available on both) */}
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

              {/* ============================================================ */}
              {/* DESKTOP METHOD: AUTHENTICATOR CODE (TOTP / 2FA OTP)          */}
              {/* ============================================================ */}
              {isDesktop && loginMethod === 'authenticator' && (
                <form onSubmit={handleAuthenticatorSubmit} className="space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-start gap-3">
                    <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-900 dark:text-blue-200">
                      <p className="font-bold mb-0.5">Desktop Security Verification</p>
                      <p className="text-blue-700 dark:text-blue-300 text-[11px]">
                        Enter your registered account identifier and 6-digit Authenticator code (or click below to get code via email).
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">{config.field}</label>
                    <input
                      type="text"
                      value={authIdentifier}
                      onChange={(e) => setAuthIdentifier(e.target.value)}
                      placeholder={config.placeholder}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm placeholder:text-slate-400"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold">6-Digit Authenticator Code</label>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || cooldown > 0}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingOtp ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : cooldown > 0 ? (
                          <span>Resend in {cooldown}s</span>
                        ) : (
                          <>
                            <Send size={12} />
                            <span>Send Code to Email</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        value={authCode}
                        onChange={(e) => setAuthCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="e.g. 123456"
                        className="w-full px-4 py-3 text-center tracking-[0.4em] font-mono text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Lock size={16} />
                      </div>
                    </div>

                    {otpSent && (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                        <span>
                          Security code sent to <strong>{maskedEmail}</strong>.
                          {devCodeHint && <span className="ml-1 text-[11px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">Code: {devCodeHint}</span>}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Verify Code & Sign In'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <Link
                      to={`/update-email?role=${effectiveRole}`}
                      className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Update Email?</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setLoginMethod('password')}
                      className="font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Password sign in &rarr;
                    </button>
                  </div>
                </form>
              )}

              {/* ============================================================ */}
              {/* MOBILE METHOD: FACE BIOMETRICS HERO CARD                     */}
              {/* ============================================================ */}
              {isMobile && loginMethod === 'face' && (
                <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                  <div className="p-6 rounded-3xl bg-gradient-to-b from-indigo-50/60 to-blue-50/40 dark:from-slate-900 dark:to-slate-900/50 border border-indigo-100 dark:border-indigo-900/40 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 shadow-inner">
                      <ScanFace size={36} />
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Instant 3D Face Sign-In
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                      Look into your front camera to securely verify your 3D live facial signature.
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

                  <div className="flex items-center justify-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setLoginMethod('password')}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Sign in with password
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <Link
                      to={`/update-email?role=${effectiveRole}`}
                      className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Update Email
                    </Link>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* ALTERNATIVE METHOD: PASSWORD LOGIN FORM                      */}
              {/* ============================================================ */}
              {loginMethod === 'password' && (
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
                    <div className="flex items-center space-x-2">
                      <Link 
                        to={`/update-email?role=${effectiveRole}`} 
                        className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                        title="Update or change your registered account email address"
                      >
                        Update Email?
                      </Link>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <Link 
                        to={`/forgot-password?role=${effectiveRole}`} 
                        className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In with Password'}
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setLoginMethod(isDesktop ? 'authenticator' : 'face')}
                      className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {isDesktop ? '← Back to Authenticator Code' : '← Back to 3D Face Login'}
                    </button>
                  </div>
                </form>
              )}

              {/* CREATE ACCOUNT TOGGLE FOOTER */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setWarningMessage('');
                      setIsRegisterMode(true);
                    }}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    <UserPlus size={13} />
                    <span>Create Account</span>
                  </button>
                </p>
              </div>
            </>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 lg:hidden">
            &copy; {new Date().getFullYear()} College Management System. All rights reserved.
          </div>
        </div>
      </div>

      {/* SECURE FACE AUTHENTICATION MODAL (Triggered only in Mobile Mode) */}
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
