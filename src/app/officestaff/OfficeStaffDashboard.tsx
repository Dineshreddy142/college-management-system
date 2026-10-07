import React from 'react';

interface OfficeStaffDashboardProps {
  onNav?: (module: string) => void;
  theme?: string;
  toggleTheme?: () => void;
}

export function OfficeStaffDashboard({ onNav, theme, toggleTheme }: OfficeStaffDashboardProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6">
      {/* Blank canvas for building Office Staff Dashboard */}
    </div>
  );
}

export default OfficeStaffDashboard;
