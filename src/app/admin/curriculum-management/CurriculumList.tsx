import React from 'react';
import { BookOpen, Layers, Edit3, Eye, Plus, Sparkles, CheckCircle2 } from 'lucide-react';

export interface CurriculumItem {
  id: number;
  department_id?: number;
  department_name?: string;
  department_code?: string;
  course_id?: number;
  program_name?: string;
  regulation_id?: number;
  regulation_name?: string;
  academic_year_id?: number;
  academic_year_name?: string;
  semester_id?: number;
  semester_name?: string;
  semester_number?: number;
  total_credits?: number;
  calculated_total_credits?: number;
  total_subjects?: number;
  mapped_subjects_count?: number;
  status: 'Active' | 'Inactive';
}

interface CurriculumListProps {
  curriculums: CurriculumItem[];
  isLoading: boolean;
  onOpenBuilder: (curriculum: CurriculumItem) => void;
  onViewDetails: (curriculum: CurriculumItem) => void;
  onCreateCurriculum: () => void;
}

export const CurriculumList: React.FC<CurriculumListProps> = ({
  curriculums,
  isLoading,
  onOpenBuilder,
  onViewDetails,
  onCreateCurriculum
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Semester Curriculum Matrices</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure subject assignments, compulsory/elective rules, and credit weightages for each semester.
          </p>
        </div>
        <button
          onClick={onCreateCurriculum}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Semester Curriculum</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading semester curriculums...</p>
          </div>
        ) : curriculums.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700/60 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Curriculums Configured</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Start by creating a new semester curriculum matrix for a Department, Program, and Regulation.
            </p>
            <button
              onClick={onCreateCurriculum}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Curriculum</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700/80 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Program & Department</th>
                  <th className="px-5 py-3.5">Regulation</th>
                  <th className="px-5 py-3.5">Semester & Year Level</th>
                  <th className="px-5 py-3.5 text-center">Total Subjects</th>
                  <th className="px-5 py-3.5 text-center">Semester Credits</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {curriculums.map((curr) => {
                  const subjectCount = curr.mapped_subjects_count ?? curr.total_subjects ?? 0;
                  const creditSum = curr.calculated_total_credits ?? curr.total_credits ?? 0;

                  return (
                    <tr key={curr.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900 dark:text-white">{curr.program_name || 'B.Tech'}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{curr.department_name || 'General'}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/40">
                          {curr.regulation_name || 'R23'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{curr.semester_name || `Semester ${curr.semester_number || 1}`}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{curr.academic_year_name || 'Year Level'}</p>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-bold text-slate-900 dark:text-white">{subjectCount} Subjects</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                          {creditSum} Credits
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          curr.status === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${curr.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {curr.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewDetails(curr)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Inspect Semester Matrix"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenBuilder(curr)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold transition-colors flex items-center gap-1"
                            title="Build / Map Subjects"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Build Matrix</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
