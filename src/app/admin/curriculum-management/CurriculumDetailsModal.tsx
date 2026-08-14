import React, { useState, useEffect } from 'react';
import { X, BookOpen, Layers, Award, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import client from '../../../api/client';
import { CurriculumItem } from './CurriculumList';

interface CurriculumDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  curriculum: CurriculumItem | null;
}

export const CurriculumDetailsModal: React.FC<CurriculumDetailsModalProps> = ({
  isOpen,
  onClose,
  curriculum
}) => {
  const [details, setDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && curriculum) {
      fetchDetails();
    } else {
      setDetails(null);
    }
  }, [isOpen, curriculum]);

  const fetchDetails = async () => {
    if (!curriculum) return;
    setIsLoading(true);
    try {
      const res = await client.get(`/curriculums/${curriculum.id}`);
      if (res.data && res.data.data) {
        setDetails(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching curriculum details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !curriculum) return null;

  const mappedSubjects = details?.subjects || [];
  const totalCredits = details?.total_mapped_credits ?? curriculum.calculated_total_credits ?? curriculum.total_credits ?? 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                  {curriculum.regulation_name || 'R23'}
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {curriculum.program_name} — {curriculum.semester_name}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Semester Curriculum Specification Matrix
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">Regulation</p>
              <p className="font-bold text-slate-900 dark:text-white mt-1">{curriculum.regulation_name || 'R23'}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">Program</p>
              <p className="font-bold text-slate-900 dark:text-white mt-1">{curriculum.program_name || 'B.Tech'}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider">Semester Subjects</p>
              <p className="font-bold text-slate-900 dark:text-white mt-1">{mappedSubjects.length} Subjects</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Total Semester Credits</p>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-1">{totalCredits} Credits</p>
            </div>
          </div>

          {/* Mapped Subjects Data Table */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" /> Mapped Subject Course List
            </h4>

            {isLoading ? (
              <div className="p-6 text-center text-slate-400">Loading curriculum matrix details...</div>
            ) : mappedSubjects.length === 0 ? (
              <div className="p-6 text-center text-slate-400">No subjects currently mapped to this semester curriculum.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <thead className="bg-slate-100 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">Code & Name</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5 text-center">Offering Type</th>
                      <th className="px-4 py-2.5 text-center">Compulsory / Elective</th>
                      <th className="px-4 py-2.5 text-center">Workload (L-T-P)</th>
                      <th className="px-4 py-2.5 text-center">Credits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {mappedSubjects.map((sub: any) => (
                      <tr key={sub.mapping_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                        <td className="px-4 py-2.5">
                          <p className="font-bold text-slate-900 dark:text-white">{sub.subject_name}</p>
                          <p className="font-mono text-[10px] text-blue-600 dark:text-blue-400">{sub.subject_code}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                            {sub.category_name || 'CORE'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-400">
                          {sub.offering_type || 'Theory'}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {sub.is_compulsory ? (
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                              Compulsory
                            </span>
                          ) : (
                            <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                              Elective ({sub.elective_group || 'General'})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono text-[10px]">
                          L:{sub.lecture_hours || 3} T:{sub.tutorial_hours || 0} P:{sub.practical_hours || 0}
                        </td>
                        <td className="px-4 py-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {sub.mapped_credits} Cr
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
