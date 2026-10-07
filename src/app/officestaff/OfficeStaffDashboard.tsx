import React from 'react';
import { Sparkles, Plus, Layers, RefreshCw, FileCheck2, CreditCard, UserSearch } from 'lucide-react';
import { useAuth } from '../portal/AuthContext';

interface OfficeStaffDashboardProps {
  onNav?: (module: string) => void;
  theme?: string;
  toggleTheme?: () => void;
}

export function OfficeStaffDashboard({ onNav, theme, toggleTheme }: OfficeStaffDashboardProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6 transition-colors duration-200">
      {/* Top Banner / Header */}
      <div className="max-w-7xl mx-auto mb-8 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Office Staff Module • Ready for Development</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Office Staff Executive Control
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome, {user?.name || 'Office Staff'}. This dashboard has been cleared and reset for a fresh build.
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Feature
          </button>
        </div>
      </div>

      {/* Fresh Canvas Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center min-h-[420px]">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4 ring-8 ring-cyan-50/50 dark:ring-cyan-950/20">
            <Layers className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Fresh Office Staff Dashboard Canvas
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
            The previous desk buttons, certificate release forms, and counter fee components have been cleared. 
            You can now build your custom office staff workflows and desk operations from scratch.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full text-left">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-medium text-sm mb-1">
                <FileCheck2 className="w-4 h-4" />
                <span>Certificate Issuer</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Build Custom Verification</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">Design Bonafide & TC workflows.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-medium text-sm mb-1">
                <CreditCard className="w-4 h-4" />
                <span>Counter Fees</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Cash Receipts & Counter Payments</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">Implement counter fee collection forms.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/60 dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-medium text-sm mb-1">
                <UserSearch className="w-4 h-4" />
                <span>Desk Lookup</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Student Desk Directory</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">Quick student lookup & request queues.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OfficeStaffDashboard;
