import React, { useState, useEffect } from 'react';
import { X, Save, Book, AlertCircle } from 'lucide-react';
import { RegulationItem } from './RegulationList';

interface RegulationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (regData: Partial<RegulationItem>) => Promise<void>;
  regulation?: RegulationItem | null;
}

export const RegulationFormModal: React.FC<RegulationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  regulation
}) => {
  const isEdit = !!regulation;

  const [name, setName] = useState('');
  const [effectiveYear, setEffectiveYear] = useState<number>(new Date().getFullYear());
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (regulation) {
      setName(regulation.name || '');
      setEffectiveYear(regulation.effective_year || new Date().getFullYear());
      setDescription(regulation.description || '');
      setStatus(regulation.status || 'Active');
    } else {
      setName('');
      setEffectiveYear(new Date().getFullYear());
      setDescription('');
      setStatus('Active');
    }
    setError('');
  }, [regulation, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Regulation Name is required (e.g. R24).');
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        name: name.trim().toUpperCase(),
        effective_year: Number(effectiveYear) || new Date().getFullYear(),
        description: description.trim(),
        status
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save regulation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Book className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isEdit ? `Edit Regulation: ${regulation?.name}` : 'Add Academic Regulation'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 font-medium border border-red-200 dark:border-red-900/40 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Regulation Name / Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. R24"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Effective Academic Year <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="2000"
              max="2100"
              value={effectiveYear}
              onChange={(e) => setEffectiveYear(parseInt(e.target.value) || new Date().getFullYear())}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Framework Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter curriculum model notes (e.g. Outcome Based Education Model)..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isEdit ? 'Save Changes' : 'Create Regulation'}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
