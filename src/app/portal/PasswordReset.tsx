import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import client from '../../api/client';

export const PasswordReset: React.FC = () => {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || '';
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Request, 2: Reset
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    
    try {
      const res = await client.post('/forgot-password', { identifier });
      setMessage(res.data.message);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    
    try {
      const res = await client.post('/reset-password', { identifier, otp, newPassword });
      setMessage(res.data.message);
      setTimeout(() => {
        navigate(`/${role || 'admin'}/login`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
        <button 
          onClick={() => navigate(role ? `/${role}/login` : '/')} 
          className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="mr-2 transform group-hover:-translate-x-1 transition-transform" /> 
          Back to Login
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <KeyRound size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Reset Password</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Secure your account</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-900/50">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-3 rounded-xl bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm font-medium border border-green-100 dark:border-green-900/50">
            {message}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequest} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Identifier (Email / ID)</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your registered ID or Email"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP (Use 123456 for demo)"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm tracking-widest"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
