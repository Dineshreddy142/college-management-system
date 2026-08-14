import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, CheckCircle2, AlertCircle, BookOpen, Layers, Award, Sparkles } from 'lucide-react';
import client from '../../../api/client';
import { CurriculumItem } from './CurriculumList';

interface CurriculumBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  curriculum: CurriculumItem | null;
  onRefresh: () => void;
}

export const CurriculumBuilderModal: React.FC<CurriculumBuilderModalProps> = ({
  isOpen,
  onClose,
  curriculum,
  onRefresh
}) => {
  const [mappedSubjects, setMappedSubjects] = useState<any[]>([]);
  const [availableCatalog, setAvailableCatalog] = useState<any[]>([]);
  const [searchCatalog, setSearchCatalog] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // Mapping options for new subject to add
  const [isCompulsory, setIsCompulsory] = useState(true);
  const [isElective, setIsElective] = useState(false);
  const [isLab, setIsLab] = useState(false);
  const [electiveGroup, setElectiveGroup] = useState('');
  const [customCredits, setCustomCredits] = useState<number>(3);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch mapped subjects and available catalog subjects
  useEffect(() => {
    if (isOpen && curriculum) {
      fetchCurriculumData();
      fetchSubjectCatalog();
    } else {
      setMappedSubjects([]);
      setError('');
      setSuccess('');
    }
  }, [isOpen, curriculum]);

  const fetchCurriculumData = async () => {
    if (!curriculum) return;
    setIsLoading(true);
    try {
      const res = await client.get(`/curriculums/${curriculum.id}`);
      if (res.data && res.data.data) {
        setMappedSubjects(res.data.data.subjects || []);
      }
    } catch (err) {
      console.error('Error fetching mapped subjects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjectCatalog = async () => {
    try {
      const res = await client.get('/subjects', { params: { status: 'Active' } });
      if (res.data) {
        const raw = Array.isArray(res.data) ? res.data : res.data.data || [];
        setAvailableCatalog(raw);
      }
    } catch (err) {
      console.error('Error fetching subject catalog:', err);
    }
  };

  if (!isOpen || !curriculum) return null;

  const totalCalculatedCredits = mappedSubjects.reduce((acc, sub) => acc + (parseFloat(sub.mapped_credits) || 0), 0);

  const handleAddSubjectToCurriculum = async () => {
    setError('');
    setSuccess('');

    if (!selectedSubjectId) {
      setError('Please select a subject from the catalog to add.');
      return;
    }

    const selectedSubject = availableCatalog.find(s => String(s.id) === String(selectedSubjectId));
    if (!selectedSubject) return;

    setIsSaving(true);
    try {
      const res = await client.post(`/curriculums/${curriculum.id}/subjects`, {
        subject_id: Number(selectedSubjectId),
        is_compulsory: isCompulsory ? 1 : 0,
        is_elective: isElective ? 1 : 0,
        is_lab: isLab ? 1 : 0,
        elective_group: electiveGroup.trim(),
        credits: Number(customCredits) || selectedSubject.credits || 3.0
      });

      if (res.data && res.data.success) {
        setSuccess(`Subject '${selectedSubject.code} - ${selectedSubject.name}' mapped to curriculum.`);
        setSelectedSubjectId('');
        setElectiveGroup('');
        fetchCurriculumData();
        onRefresh();
      } else {
        setError(res.data?.message || 'Failed to map subject.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to map subject to curriculum.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveSubject = async (subjectId: number, subjectCode: string) => {
    setError('');
    setSuccess('');
    try {
      const res = await client.delete(`/curriculums/${curriculum.id}/subjects/${subjectId}`);
      if (res.data && res.data.success) {
        setSuccess(`Subject '${subjectCode}' unmapped from curriculum.`);
        fetchCurriculumData();
        onRefresh();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unmap subject.');
    }
  };

  const unmappedCatalogOptions = availableCatalog.filter(
    catSub => !mappedSubjects.some(ms => ms.subject_id === catSub.id) &&
      (searchCatalog === '' || catSub.code.toLowerCase().includes(searchCatalog.toLowerCase()) || catSub.name.toLowerCase().includes(searchCatalog.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
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
                Curriculum Builder & Semester Subject Allocation Matrix
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matrix Metrics Banner */}
        <div className="px-6 py-3 bg-blue-600 text-white flex items-center justify-between text-xs font-semibold shadow-inner">
          <div className="flex items-center gap-4">
            <span>Total Mapped Subjects: <strong>{mappedSubjects.length}</strong></span>
            <span>Compulsory: <strong>{mappedSubjects.filter(s => s.is_compulsory).length}</strong></span>
            <span>Electives: <strong>{mappedSubjects.filter(s => s.is_elective).length}</strong></span>
            <span>Labs: <strong>{mappedSubjects.filter(s => s.is_lab).length}</strong></span>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
            Total Semester Credits: {totalCalculatedCredits} Credits
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 font-medium border border-red-200 dark:border-red-900/40 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          {/* Add Subject to Matrix Selector */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-500" /> Map Subject from Phase 1 Subject Catalog
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Subject from Catalog
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    const sub = availableCatalog.find(s => String(s.id) === e.target.value);
                    if (sub) {
                      setCustomCredits(sub.credits || 3);
                      setIsLab(sub.offering_type === 'Practical');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Subject from Phase 1 Catalog --</option>
                  {unmappedCatalogOptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      [{sub.code}] {sub.name} ({sub.category_name || 'CORE'}) - {sub.credits} Cr
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Credits Assignment
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="15"
                  value={customCredits}
                  onChange={(e) => setCustomCredits(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Classification Checkboxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCompulsory}
                  onChange={(e) => {
                    setIsCompulsory(e.target.checked);
                    if (e.target.checked) setIsElective(false);
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Compulsory Subject</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isElective}
                  onChange={(e) => {
                    setIsElective(e.target.checked);
                    if (e.target.checked) setIsCompulsory(false);
                  }}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Elective Subject</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLab}
                  onChange={(e) => setIsLab(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Laboratory Subject</span>
              </label>

              <div>
                <input
                  type="text"
                  value={electiveGroup}
                  onChange={(e) => setElectiveGroup(e.target.value)}
                  placeholder="Elective Group (e.g. PE-1)"
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleAddSubjectToCurriculum}
                disabled={isSaving || !selectedSubjectId}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  selectedSubjectId && !isSaving
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Add Subject to Semester Matrix</span>
              </button>
            </div>
          </div>

          {/* Mapped Subjects Data Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold">
              <span>Mapped Subjects ({mappedSubjects.length})</span>
              <span className="text-slate-500 text-[11px] font-normal">Drag or unmap items as needed</span>
            </div>

            {mappedSubjects.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No subjects mapped to this semester curriculum yet. Use the selector above to add subjects.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Code & Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-center">Type / Classification</th>
                      <th className="px-4 py-3 text-center">Elective Group</th>
                      <th className="px-4 py-3 text-center">Credits</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {mappedSubjects.map((sub) => (
                      <tr key={sub.mapping_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 dark:text-white">{sub.subject_name}</p>
                          <p className="font-mono text-[10px] text-blue-600 dark:text-blue-400">{sub.subject_code}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                            {sub.category_name || 'CORE'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {sub.is_compulsory ? (
                              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                                Compulsory
                              </span>
                            ) : null}
                            {sub.is_elective ? (
                              <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                                Elective
                              </span>
                            ) : null}
                            {sub.is_lab ? (
                              <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                                Lab
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                          {sub.elective_group || '—'}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {sub.mapped_credits} Cr
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemoveSubject(sub.subject_id, sub.subject_code)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors"
                            title="Unmap Subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 flex justify-end bg-slate-50/50 dark:bg-slate-900/40">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
          >
            Done & Save Matrix
          </button>
        </div>

      </div>
    </div>
  );
};
