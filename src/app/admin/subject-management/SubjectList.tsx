import React from 'react';
import { Eye, Edit3, Power, BookOpen, Layers, Award, Globe, Beaker, FileCode, Sparkles, AlertTriangle } from 'lucide-react';

export interface SubjectItem {
  id: number;
  code: string;
  name: string;
  short_name?: string;
  category_id?: number;
  category_name?: string;
  category_code?: string;
  department_id?: number;
  department_name?: string;
  department_code?: string;
  course_id?: number;
  program_name?: string;
  semester_id?: number;
  semester_name?: string;
  academic_year_id?: number;
  academic_year_name?: string;
  regulation?: string;
  credits: number;
  lecture_hours?: number;
  tutorial_hours?: number;
  practical_hours?: number;
  theory_hours?: number;
  lab_hours?: number;
  total_hours?: number;
  internal_marks?: number;
  external_marks?: number;
  total_marks?: number;
  passing_marks?: number;
  offering_type?: string;
  elective_group?: string;
  prerequisite?: string;
  description?: string;
  status: 'Active' | 'Inactive' | 'Archived';
}

interface SubjectListProps {
  subjects: SubjectItem[];
  isLoading: boolean;
  onView: (subject: SubjectItem) => void;
  onEdit: (subject: SubjectItem) => void;
  onToggleStatus: (subject: SubjectItem) => void;
}

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  FOUNDATION: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  CORE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  PROFESSIONAL_ELECTIVE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  OPEN_ELECTIVE: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  LABORATORY: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  PROJECT: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  VALUE_ADDED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
};

export const SubjectList: React.FC<SubjectListProps> = ({
  subjects,
  isLoading,
  onView,
  onEdit,
  onToggleStatus
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-12 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading subjects catalog...</p>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-12 text-center">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700/60 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-slate-800 dark:text-white">No Subjects Found</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
          No subject records match your current search term or category filters. Try adjusting your filter parameters or create a new subject.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700/80 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3.5">Code & Name</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Department & Program</th>
              <th className="px-4 py-3.5">Semester</th>
              <th className="px-4 py-3.5 text-center">Credits & Hours</th>
              <th className="px-4 py-3.5 text-center">Marks (Int / Ext)</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {subjects.map((sub) => {
              const categoryCode = sub.category_code || 'CORE';
              const badgeStyle = CATEGORY_BADGE_STYLES[categoryCode] || 'bg-slate-100 text-slate-700 border-slate-200';
              const isInactive = sub.status === 'Inactive';

              const lecHours = sub.lecture_hours ?? sub.theory_hours ?? 3;
              const tutHours = sub.tutorial_hours ?? 0;
              const pracHours = sub.practical_hours ?? sub.lab_hours ?? 0;

              return (
                <tr
                  key={sub.id}
                  className={`hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors ${
                    isInactive ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/20' : ''
                  }`}
                >
                  {/* Code & Name */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{sub.name}</span>
                        {sub.short_name && (
                          <span className="text-[10px] text-slate-400 font-normal">({sub.short_name})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/40">
                          {sub.code}
                        </span>
                        {sub.offering_type && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            • {sub.offering_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badgeStyle}`}>
                      {sub.category_name || 'CORE'}
                    </span>
                  </td>

                  {/* Department & Program */}
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{sub.department_name || 'General'}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{sub.program_name || 'All Programs'}</p>
                  </td>

                  {/* Semester */}
                  <td className="px-4 py-3.5">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {sub.semester_name || 'Unassigned'}
                    </span>
                  </td>

                  {/* Credits & Hours */}
                  <td className="px-4 py-3.5 text-center">
                    <p className="font-semibold text-slate-900 dark:text-white">{sub.credits} Credits</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      L:{lecHours} T:{tutHours} P:{pracHours} ({sub.total_hours || (lecHours + tutHours + pracHours)}h)
                    </p>
                  </td>

                  {/* Marks (Int / Ext) */}
                  <td className="px-4 py-3.5 text-center">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {sub.internal_marks ?? 40} / {sub.external_marks ?? 60}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Total: {sub.total_marks ?? 100} (Pass: {sub.passing_marks ?? 40})
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        sub.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {sub.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onView(sub)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                        title="View Full Subject Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(sub)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors"
                        title="Edit Subject"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(sub)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          sub.status === 'Active'
                            ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        }`}
                        title={sub.status === 'Active' ? 'Soft Deactivate Subject' : 'Activate Subject'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
