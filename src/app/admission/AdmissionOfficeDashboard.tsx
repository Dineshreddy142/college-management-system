import React from 'react';

interface AdmissionOfficeDashboardProps {
  onNav?: (module: string) => void;
  theme?: string;
  toggleTheme?: () => void;
}

export function AdmissionOfficeDashboard({ onNav, theme, toggleTheme }: AdmissionOfficeDashboardProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6">
      {/* Blank canvas for building Admission Office Dashboard */}
    </div>
  );
}

export default AdmissionOfficeDashboard;
