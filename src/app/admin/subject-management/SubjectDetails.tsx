import React from 'react';
import { X, BookOpen, Layers, Clock, ShieldCheck, UserCheck, Tag, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { SubjectItem } from './SubjectList';

interface SubjectDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  subject: SubjectItem | null;
}

export const SubjectDetails: React.FC<SubjectDetailsProps> = ({
  isOpen,
  onClose,
  subject
}) => {
  if (!isOpen || !subject) return null;

  const lecHours = subject.lecture_hours ?? subject.theory_hours ?? 3;
  const tutHours = subject.tutorial_hours ?? 0;
  const pracHours = subject.practical_hours ?? subject.lab_hours ?? 0;
  const totalHours = subject.total_hours || (lecHours + tutHours + pracHours);

  const internalMarks = subject.internal_marks ?? 40;
  const externalMarks = subject.external_marks ?? 60;
  const totalMarks = subject.total_marks ?? 100;
  const passingMarks = subject.passing_marks ?? 40;

  const allocatedFaculty = (subject as any).allocated_faculty || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                  {subject.code}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  subject.status === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                }`}>
                  {subject.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {subject.name} {subject.short_name && <span className="text-slate-400 font-normal">({subject.short_name})</span>}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
          
          {/* Key Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">Category</p>
              <p className="font-bold text-slate-900 dark:text-white mt-1">{subject.category_name || 'CORE'}</p>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">Credits</p>
              <p className="font-bold text-slate-900 dark:text-white mt-1">{subject.credits} Credits</p>
            </div>
            <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider">Weekly Workload</p>
              <p className="font-bold text-slate-900 dark:text-white mt-1">{totalHours} Hours/Week</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Total Marks</p>
              <p className="font-bold text-slate-900 dark:text-white mt-1">{totalMarks} Marks</p>
            </div>
          </div>

          {/* Academic Structure Specs */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" /> Academic Hierarchy Placement
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-slate-400 text-[10px]">Department</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{subject.department_name || 'General'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px]">Program / Course</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{subject.program_name || 'All Programs'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px]">Semester</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{subject.semester_name || 'Semester'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px]">Academic Year Level</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{subject.academic_year_name || 'Year Level'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px]">Regulation</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{subject.regulation || 'R23'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px]">Offering Type</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{subject.offering_type || 'Theory'}</p>
              </div>
            </div>
          </div>

          {/* Hours & Marks Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hours Breakdown */}
            <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Workload Breakdown
              </h4>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Lecture Hours (L):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{lecHours} hrs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Tutorial Hours (T):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{tutHours} hrs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Practical/Lab Hours (P):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{pracHours} hrs</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-1.5 font-bold">
                  <span>Total Weekly Hours:</span>
                  <span className="text-blue-600 dark:text-blue-400">{totalHours} hrs/week</span>
                </div>
              </div>
            </div>

            {/* Evaluation Scheme */}
            <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Evaluation Scheme
              </h4>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Internal Continuous Evaluation:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{internalMarks} Marks</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">End Semester Examination:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{externalMarks} Marks</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Minimum Passing Threshold:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{passingMarks} Marks</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-1.5 font-bold">
                  <span>Total Subject Weightage:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{totalMarks} Marks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Elective & Prerequisites */}
          {(subject.elective_group || subject.prerequisite) && (
            <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-500" /> Elective Group & Prerequisites
              </h4>
              {subject.elective_group && (
                <p><span className="font-semibold text-slate-700 dark:text-slate-300">Elective Bucket:</span> {subject.elective_group}</p>
              )}
              {subject.prerequisite && (
                <p><span className="font-semibold text-slate-700 dark:text-slate-300">Prerequisite Courses:</span> {subject.prerequisite}</p>
              )}
            </div>
          )}

          {/* Syllabus Description */}
          {subject.description && (
            <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" /> Syllabus Overview
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{subject.description}</p>
            </div>
          )}

          {/* Allocated Faculty Section */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Allocated Teaching Faculty ({allocatedFaculty.length})
            </h4>
            {allocatedFaculty.length === 0 ? (
              <p className="text-slate-400 text-xs italic">No faculty currently assigned to teach this subject.</p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {allocatedFaculty.map((f: any) => (
                  <div key={f.allocation_id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{f.first_name} {f.last_name}</p>
                      <p className="text-slate-400 text-[10px]">{f.faculty_email || 'No email'}</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium px-2 py-0.5 rounded-md text-[10px]">
                        Section: {f.section_name || 'Main'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{f.weekly_hours || 3} hrs/week</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 flex justify-end bg-slate-50/50 dark:bg-slate-900/40">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
};
