import React from 'react';
import { useNavigate } from 'react-router';
import { AlertOctagon, Ban, ArrowLeft, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from './AuthContext';

export const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-red-100 dark:border-red-900/50 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Ban size={32} />
        </div>
        <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-5">
          You do not have permission to access this portal with your current role.
        </p>

        {user && (
          <div className="mb-6 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-left">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Session</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
              <span>{user.name || user.full_name || user.username}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800">
                {user.role}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</div>
          </div>
        )}

        <div className="space-y-2.5">
          <button 
            onClick={() => navigate(-1)} 
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl font-semibold transition-all flex justify-center items-center gap-2 text-sm"
          >
            <ArrowLeft size={16} /> Go Back
          </button>

          {user && (
            <button 
              onClick={() => {
                logout();
                navigate('/admin/login');
              }} 
              className="w-full py-2 px-4 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all flex justify-center items-center gap-1.5"
            >
              <LogOut size={14} /> Switch Account / Log Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertOctagon size={32} />
        </div>
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <button 
          onClick={() => navigate(-1)} 
          className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-semibold shadow-md transition-all flex justify-center items-center"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};
