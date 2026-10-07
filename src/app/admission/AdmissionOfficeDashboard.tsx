import React from 'react';
import { Sparkles, Plus, Layers, RefreshCw, FileText, Settings, UserPlus } from 'lucide-react';
import { useAuth } from '../portal/AuthContext';

interface AdmissionOfficeDashboardProps {
  onNav?: (module: string) => void;
  theme?: string;
  toggleTheme?: () => void;
}

export function AdmissionOfficeDashboard({ onNav, theme, toggleTheme }: AdmissionOfficeDashboardProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6 transition-colors duration-200">
      {/* Top Banner / Header */}
      <div className="max-w-7xl mx-auto mb-8 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Admission Module • Ready for Development</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Admission Office Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome, {user?.name || 'Admission Officer'}. This dashboard and database schema have been completely reset for a fresh build.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={() => {
              if (onNav) onNav('dashboard');
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Feature
          </button>
        </div>
      </div>

      {/* Fresh Canvas Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center min-h-[420px]">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 ring-8 ring-indigo-50/50 dark:ring-indigo-950/20">
            <Layers className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Fresh Admission Dashboard Canvas
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
            All database tables (`applications`, `admission_applications`, `admission_documents`, `admission_courses`, `seat_allocations`, `admission_fee_payments`, `admission_history`) have been dropped. 
            You can now start building your custom admission workflows, stats, forms, and database schemas from scratch.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full text-left">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-1">
                <UserPlus className="w-4 h-4" />
                <span>Step 1</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Define Application Schema</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">Create tables for candidate registrations & forms.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-1">
                <FileText className="w-4 h-4" />
                <span>Step 2</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Build API Handlers</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">Wire backend routes for submission & approval.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-1">
                <Settings className="w-4 h-4" />
                <span>Step 3</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Design UI Components</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">Add widgets, tables, filters & analytics.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdmissionOfficeDashboard;
