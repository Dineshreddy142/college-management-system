import React from 'react';
import { useNavigate } from 'react-router';
import { AlertOctagon, Ban, ArrowLeft } from 'lucide-react';

export const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-red-100 dark:border-red-900/50 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Ban size={32} />
        </div>
        <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          You do not have permission to access this portal. Please log in with the appropriate role.
        </p>
        <button 
          onClick={() => navigate(-1)} 
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-md shadow-red-500/20 transition-all flex justify-center items-center"
        >
          <ArrowLeft size={18} className="mr-2" /> Go Back
        </button>
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
