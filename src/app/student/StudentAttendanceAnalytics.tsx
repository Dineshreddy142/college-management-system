import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, AlertTriangle, ShieldCheck, Download, RefreshCw, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import client from '../../api/client';

export const StudentAttendanceAnalytics: React.FC = () => {
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttendanceSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await client.get('/attendance/student/summary');
      if (res.data) {
        setSummaryData(res.data);
      }
    } catch (err) {
      console.error('Error fetching student attendance summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendanceSummary();
  }, [fetchAttendanceSummary]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-12 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Calculating subject-wise attendance analytics...</p>
      </div>
    );
  }

  const overallPct = summaryData?.overall_percentage || 100.0;
  const minThreshold = summaryData?.minimum_threshold || 75.0;
  const isShortage = summaryData?.is_shortage || false;
  const subjectBreakdown = summaryData?.subject_breakdown || [];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
              <UserCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Attendance Analytics & Recovery Calculator
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Subject-wise breakdown and attendance shortage recovery calculations based on official college records.
          </p>
        </div>

        <button
          onClick={fetchAttendanceSummary}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Shortage Alert Banner (If overall or subject shortage) */}
      {isShortage && (
        <div className="p-4 rounded-2xl bg-red-950/90 text-red-100 border border-red-500/40 shadow-xl flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-red-200">Attendance Shortage Warning</h4>
              <p className="text-xs text-red-300">
                Your overall attendance ({overallPct}%) is below the minimum required threshold ({minThreshold}%). Review the subject breakdown below for recovery targets.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Gauge + Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Circular Gauge Card */}
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-6 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-700" strokeWidth="3" />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                className={isShortage ? "text-red-500" : "text-emerald-500"}
                strokeWidth="3.5"
                strokeDasharray={`${overallPct}, 100`}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{overallPct}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Overall</span>
            </div>
          </div>

          <div className="mt-3">
            <h4 className={`text-xs font-extrabold px-3 py-1 rounded-full inline-block ${
              isShortage ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
            }`}>
              {isShortage ? 'Attendance Shortage Risk' : 'Good Academic Standing'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">Minimum requirement: {minThreshold}%</p>
          </div>
        </div>

        {/* Subject Breakdown Table */}
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-6 md:col-span-2 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" /> Subject-wise Attendance Breakdown
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-3 py-2.5">Subject</th>
                  <th className="px-3 py-2.5 text-center">P / Abs / Total</th>
                  <th className="px-3 py-2.5 text-center">Percentage</th>
                  <th className="px-3 py-2.5 text-right">Recovery Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subjectBreakdown.map((sub: any) => {
                  const isSubShortage = sub.is_shortage;

                  return (
                    <tr key={sub.subject_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                      <td className="px-3 py-3">
                        <p className="font-bold text-slate-900 dark:text-white">{sub.subject_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                            {sub.subject_code}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {sub.faculty_first_name ? `${sub.faculty_first_name} ${sub.faculty_last_name || ''}` : 'Faculty Assigned'}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center font-medium">
                        <span className="text-emerald-600 font-bold">{sub.present_count} P</span> / <span className="text-red-500 font-bold">{sub.absent_count} A</span> / <span className="text-slate-700 dark:text-slate-300 font-bold">{sub.total_eligible_sessions} Total</span>
                      </td>

                      <td className="px-3 py-3 text-center">
                        <span className={`font-extrabold ${isSubShortage ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {sub.percentage}%
                        </span>
                      </td>

                      <td className="px-3 py-3 text-right">
                        {isSubShortage ? (
                          <span className="text-[11px] font-extrabold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded-lg border border-red-200 dark:border-red-900/40 inline-block">
                            Attend next {sub.classes_required_for_threshold} classes
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Satisfied
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
