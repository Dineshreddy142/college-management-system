import React from 'react';
import { Book, Plus, Edit3, CheckCircle2 } from 'lucide-react';

export interface RegulationItem {
  id: number;
  name: string;
  effective_year: number;
  description?: string;
  status: 'Active' | 'Inactive';
}

interface RegulationListProps {
  regulations: RegulationItem[];
  isLoading: boolean;
  onAddRegulation: () => void;
  onEditRegulation: (reg: RegulationItem) => void;
}

export const RegulationList: React.FC<RegulationListProps> = ({
  regulations,
  isLoading,
  onAddRegulation,
  onEditRegulation
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Academic Regulations</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define academic regulation frameworks (e.g. R24, R22, R20) that govern curriculum structure and grading policies.
          </p>
        </div>
        <button
          onClick={onAddRegulation}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Regulation</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading regulations...</p>
          </div>
        ) : regulations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No academic regulations configured.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700/80 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Regulation Code</th>
                  <th className="px-5 py-3.5">Effective Year</th>
                  <th className="px-5 py-3.5">Framework Description</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {regulations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-mono font-bold text-xs border border-blue-200 dark:border-blue-800/40">
                        {reg.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      Academic Year {reg.effective_year}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 max-w-md">
                      {reg.description || 'Standard Academic Framework'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        reg.status === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${reg.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {reg.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => onEditRegulation(reg)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                        title="Edit Regulation"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
