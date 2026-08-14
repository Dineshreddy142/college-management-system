import React from 'react';
import { UserCheck, CheckCircle2, Clock, Trash2, Edit3, ShieldCheck, AlertCircle, BookOpen } from 'lucide-react';

export interface AssignmentItem {
  id: number;
  department_id?: number;
  department_name?: string;
  course_id?: number;
  program_name?: string;
  regulation_id?: number;
  regulation_name?: string;
  curriculum_id?: number;
  semester_id?: number;
  semester_name?: string;
  section_id: number;
  section_name: string;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  category_name?: string;
  offering_type?: string;
  faculty_id: number;
  first_name: string;
  last_name: string;
  faculty_email?: string;
  faculty_designation?: string;
  weekly_hours: number;
  status: 'Active' | 'Pending Approval' | 'Archived';
}

interface FacultyAssignmentListProps {
  assignments: AssignmentItem[];
  isLoading: boolean;
  onApprove: (id: number) => void;
  onEdit: (assignment: AssignmentItem) => void;
  onDelete: (id: number) => void;
}

export const FacultyAssignmentList: React.FC<FacultyAssignmentListProps> = ({
  assignments,
  isLoading,
  onApprove,
  onEdit,
  onDelete
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-12 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading faculty subject allocations...</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-12 text-center">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700/60 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
          <UserCheck className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-slate-800 dark:text-white">No Faculty Assignments Found</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
          No faculty-to-subject assignments match your current filters. Use the "Assign Faculty" button to map faculty to curriculum subjects.
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
              <th className="px-4 py-3.5">Subject & Category</th>
              <th className="px-4 py-3.5">Program & Regulation</th>
              <th className="px-4 py-3.5">Semester & Section</th>
              <th className="px-4 py-3.5">Assigned Faculty Member</th>
              <th className="px-4 py-3.5 text-center">Workload</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {assignments.map((asg) => {
              const isPending = asg.status === 'Pending Approval';

              return (
                <tr key={asg.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                  
                  {/* Subject & Category */}
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-slate-900 dark:text-white">{asg.subject_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/40">
                        {asg.subject_code}
                      </span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">
                        {asg.category_name || 'CORE'}
                      </span>
                    </div>
                  </td>

                  {/* Program & Regulation */}
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{asg.program_name || 'B.Tech'}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{asg.regulation_name || 'R23'}</p>
                  </td>

                  {/* Semester & Section */}
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{asg.semester_name || 'Semester'}</p>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/40">
                      Section {asg.section_name}
                    </span>
                  </td>

                  {/* Assigned Faculty Member */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs shrink-0">
                        {asg.first_name?.[0]}{asg.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{asg.first_name} {asg.last_name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{asg.faculty_designation || 'Faculty'} • {asg.department_name || 'Department'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Workload */}
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-bold text-slate-900 dark:text-white">{asg.weekly_hours || 3} hrs</span>
                    <p className="text-[10px] text-slate-400">per week</p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      isPending
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      {asg.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isPending && (
                        <button
                          onClick={() => onApprove(asg.id)}
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          title="Approve Faculty Assignment"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(asg)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                        title="Edit Assignment"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(asg.id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors"
                        title="Remove Assignment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
