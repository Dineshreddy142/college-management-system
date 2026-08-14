import React, { useState, useEffect, useCallback } from 'react';
import { Book, Link, Plus, RefreshCw, CheckCircle2, AlertCircle, Filter } from 'lucide-react';
import client from '../../../api/client';
import { RegulationList, RegulationItem } from './RegulationList';
import { RegulationFormModal } from './RegulationFormModal';
import { CurriculumList, CurriculumItem } from './CurriculumList';
import { CurriculumBuilderModal } from './CurriculumBuilderModal';
import { CurriculumDetailsModal } from './CurriculumDetailsModal';

export const CurriculumManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'curriculum' | 'regulations'>('curriculum');

  const [regulations, setRegulations] = useState<RegulationItem[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumItem[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  const [isLoadingRegs, setIsLoadingRegs] = useState(true);
  const [isLoadingCurrs, setIsLoadingCurrs] = useState(true);

  // Filters state
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterRegulation, setFilterRegulation] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');

  // Modal states
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [editingReg, setEditingReg] = useState<RegulationItem | null>(null);

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [activeCurriculum, setActiveCurriculum] = useState<CurriculumItem | null>(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingCurriculum, setViewingCurriculum] = useState<CurriculumItem | null>(null);

  const [isNewCurriculumModalOpen, setIsNewCurriculumModalOpen] = useState(false);
  const [newDepartmentId, setNewDepartmentId] = useState('');
  const [newProgramId, setNewProgramId] = useState('');
  const [newRegulationId, setNewRegulationId] = useState('');
  const [newSemesterId, setNewSemesterId] = useState('');
  const [newAcademicYearId, setNewAcademicYearId] = useState('');

  // Toast state
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchRegulations = useCallback(async () => {
    setIsLoadingRegs(true);
    try {
      const res = await client.get('/regulations');
      if (res.data) {
        const raw = Array.isArray(res.data) ? res.data : res.data.data || [];
        setRegulations(raw);
      }
    } catch (err) {
      console.error('Error fetching regulations:', err);
    } finally {
      setIsLoadingRegs(false);
    }
  }, []);

  const fetchAcademicMeta = useCallback(async () => {
    try {
      const [deptRes, progRes, semRes, ayRes] = await Promise.allSettled([
        client.get('/v1/academic/departments'),
        client.get('/v1/academic/courses'),
        client.get('/v1/academic/semesters'),
        client.get('/academic/academic-years')
      ]);

      if (deptRes.status === 'fulfilled' && deptRes.value.data) {
        const depts = Array.isArray(deptRes.value.data) ? deptRes.value.data : deptRes.value.data.data || [];
        setDepartments(depts);
        if (depts.length > 0 && !newDepartmentId) setNewDepartmentId(String(depts[0].id));
      }
      if (progRes.status === 'fulfilled' && progRes.value.data) {
        const progs = Array.isArray(progRes.value.data) ? progRes.value.data : progRes.value.data.data || [];
        setPrograms(progs);
        if (progs.length > 0 && !newProgramId) setNewProgramId(String(progs[0].id));
      }
      if (semRes.status === 'fulfilled' && semRes.value.data) {
        const sems = Array.isArray(semRes.value.data) ? semRes.value.data : semRes.value.data.data || [];
        setSemesters(sems);
        if (sems.length > 0 && !newSemesterId) setNewSemesterId(String(sems[0].id));
      }
      if (ayRes.status === 'fulfilled' && ayRes.value.data) {
        const ays = Array.isArray(ayRes.value.data) ? ayRes.value.data : ayRes.value.data.data || [];
        setAcademicYears(ays);
        if (ays.length > 0 && !newAcademicYearId) setNewAcademicYearId(String(ays[0].id));
      }
    } catch (err) {
      console.error('Error fetching academic metadata:', err);
    }
  }, [newDepartmentId, newProgramId, newSemesterId, newAcademicYearId]);

  const fetchCurriculums = useCallback(async () => {
    setIsLoadingCurrs(true);
    try {
      const params: Record<string, string> = {};
      if (filterDepartment !== 'all') params.department_id = filterDepartment;
      if (filterProgram !== 'all') params.course_id = filterProgram;
      if (filterRegulation !== 'all') params.regulation_id = filterRegulation;
      if (filterSemester !== 'all') params.semester_id = filterSemester;

      const res = await client.get('/curriculums', { params });
      if (res.data) {
        const raw = Array.isArray(res.data) ? res.data : res.data.data || [];
        setCurriculums(raw);
      }
    } catch (err) {
      console.error('Error fetching curriculums:', err);
      showToast('Failed to load semester curriculums.', 'error');
    } finally {
      setIsLoadingCurrs(false);
    }
  }, [filterDepartment, filterProgram, filterRegulation, filterSemester]);

  useEffect(() => {
    fetchRegulations();
    fetchAcademicMeta();
  }, [fetchRegulations, fetchAcademicMeta]);

  useEffect(() => {
    fetchCurriculums();
  }, [fetchCurriculums]);

  // Regulations Handlers
  const handleOpenAddReg = () => {
    setEditingReg(null);
    setIsRegModalOpen(true);
  };

  const handleOpenEditReg = (reg: RegulationItem) => {
    setEditingReg(reg);
    setIsRegModalOpen(true);
  };

  const handleSaveRegulation = async (regData: Partial<RegulationItem>) => {
    if (editingReg) {
      const res = await client.put(`/regulations/${editingReg.id}`, regData);
      if (res.data && res.data.success) {
        showToast(`Regulation '${regData.name}' updated successfully.`);
      }
    } else {
      const res = await client.post('/regulations', regData);
      if (res.data && res.data.success) {
        showToast(`Regulation '${regData.name}' created successfully.`);
      }
    }
    fetchRegulations();
  };

  // Curriculum Handlers
  const handleOpenBuilder = (curr: CurriculumItem) => {
    setActiveCurriculum(curr);
    setIsBuilderOpen(true);
  };

  const handleViewDetails = (curr: CurriculumItem) => {
    setViewingCurriculum(curr);
    setIsDetailsOpen(true);
  };

  const handleCreateNewCurriculumMatrix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramId || !newRegulationId || !newSemesterId) {
      showToast('Program, Regulation, and Semester are required.', 'error');
      return;
    }

    try {
      const res = await client.post('/curriculums', {
        department_id: newDepartmentId ? Number(newDepartmentId) : null,
        course_id: Number(newProgramId),
        regulation_id: Number(newRegulationId),
        academic_year_id: newAcademicYearId ? Number(newAcademicYearId) : null,
        semester_id: Number(newSemesterId),
        status: 'Active'
      });

      if (res.data && res.data.success) {
        showToast('New semester curriculum created successfully.');
        setIsNewCurriculumModalOpen(false);
        fetchCurriculums();
      } else {
        showToast(res.data?.message || 'Failed to create curriculum.', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'A curriculum mapping already exists for this combination.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${
          toastMessage.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
            : 'bg-red-950/90 text-red-200 border-red-500/40'
        }`}>
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
              <Link className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Curriculum & Subject Allocation System
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Structure academic regulations, map subjects to programs and semesters, and manage credit allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchRegulations(); fetchCurriculums(); }}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {activeTab === 'curriculum' ? (
            <button
              onClick={() => setIsNewCurriculumModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Curriculum Matrix</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddReg}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Regulation</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'curriculum'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Link className="w-4 h-4" />
          <span>Semester Curriculum Mapping ({curriculums.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('regulations')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'regulations'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Book className="w-4 h-4" />
          <span>Academic Regulations ({regulations.length})</span>
        </button>
      </div>

      {/* Tab 1: Curriculum Mapping View */}
      {activeTab === 'curriculum' && (
        <div className="space-y-4">
          
          {/* Filters Toolbar */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-3.5 flex flex-wrap gap-2.5 items-center">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mr-2">
              <Filter className="w-3.5 h-3.5 text-blue-500" />
              <span>Filter Matrix:</span>
            </div>

            <select
              value={filterRegulation}
              onChange={(e) => setFilterRegulation(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Regulations</option>
              {regulations.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Semesters</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>{s.name || `Semester ${s.semester_number}`}</option>
              ))}
            </select>
          </div>

          {/* Curriculum Matrix Table */}
          <CurriculumList
            curriculums={curriculums}
            isLoading={isLoadingCurrs}
            onOpenBuilder={handleOpenBuilder}
            onViewDetails={handleViewDetails}
            onCreateCurriculum={() => setIsNewCurriculumModalOpen(true)}
          />
        </div>
      )}

      {/* Tab 2: Regulations View */}
      {activeTab === 'regulations' && (
        <RegulationList
          regulations={regulations}
          isLoading={isLoadingRegs}
          onAddRegulation={handleOpenAddReg}
          onEditRegulation={handleOpenEditReg}
        />
      )}

      {/* Regulation Form Modal */}
      <RegulationFormModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        onSave={handleSaveRegulation}
        regulation={editingReg}
      />

      {/* Curriculum Builder Modal */}
      <CurriculumBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        curriculum={activeCurriculum}
        onRefresh={fetchCurriculums}
      />

      {/* Curriculum Details Modal */}
      <CurriculumDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        curriculum={viewingCurriculum}
      />

      {/* Create New Semester Curriculum Modal */}
      {isNewCurriculumModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <Link className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Curriculum Matrix</h3>
              </div>
              <button onClick={() => setIsNewCurriculumModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateNewCurriculumMatrix} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <select
                  value={newDepartmentId}
                  onChange={(e) => setNewDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Program / Course *</label>
                <select
                  value={newProgramId}
                  onChange={(e) => setNewProgramId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                >
                  <option value="">Select Program</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Academic Regulation *</label>
                <select
                  value={newRegulationId}
                  onChange={(e) => setNewRegulationId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                >
                  <option value="">Select Regulation</option>
                  {regulations.map(r => <option key={r.id} value={r.id}>{r.name} ({r.effective_year})</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Semester *</label>
                <select
                  value={newSemesterId}
                  onChange={(e) => setNewSemesterId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                >
                  <option value="">Select Semester</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name || `Semester ${s.semester_number}`}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Academic Year Level</label>
                <select
                  value={newAcademicYearId}
                  onChange={(e) => setNewAcademicYearId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">Select Year Level</option>
                  {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name || `Year ${ay.year_level}`}</option>)}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCurriculumModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md"
                >
                  Create Matrix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
