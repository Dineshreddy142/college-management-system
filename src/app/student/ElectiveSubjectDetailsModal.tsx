import React from 'react';
import { X, BookOpen, Layers, ShieldCheck, Clock, FileText, UserCheck, AlertTriangle } from 'lucide-react';

interface ElectiveSubjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: any | null;
}

export const ElectiveSubjectDetailsModal: React.FC<ElectiveSubjectDetailsModalProps> = ({
  isOpen,
  onClose,
  subject
}) => {
  if (!isOpen || !subject) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                  {subject.subject_code || subject.code}
                </span>
                <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                  {subject.category_name || 'ELECTIVE'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {subject.subject_name || subject.name}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Course Credits</p>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">{subject.mapped_credits || subject.credits || 3} Credits</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Offering Type</p>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">{subject.offering_type || 'Theory'}</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Elective Bucket</p>
              <p className="font-bold text-purple-600 dark:text-purple-400 mt-0.5">{subject.elective_group || 'Elective I'}</p>
            </div>
          </div>

          {subject.prerequisite && (
            <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-1">
              <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Prerequisite Course Required
              </p>
              <p className="text-amber-800 dark:text-amber-300">{subject.prerequisite}</p>
            </div>
          )}

          {subject.description && (
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-[11px]">
                <FileText className="w-3.5 h-3.5 text-blue-500" /> Course Description & Syllabus Outline
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {subject.description}
              </p>
            </div>
          )}

          {subject.faculty_first_name && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-[11px]">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Course Instructor
              </h4>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  {subject.faculty_first_name[0]}{subject.faculty_last_name?.[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{subject.faculty_first_name} {subject.faculty_last_name}</p>
                  <p className="text-[10px] text-slate-400">{subject.faculty_designation || 'Faculty Instructor'} ({subject.faculty_email})</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 flex justify-end bg-slate-50/50 dark:bg-slate-900/40">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
          >
            Close Overview
          </button>
        </div>

      </div>
    </div>
  );
};
