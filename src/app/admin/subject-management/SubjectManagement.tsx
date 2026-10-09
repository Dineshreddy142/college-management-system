import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Download, Upload, RefreshCw, BookOpen, Layers, CheckCircle2, AlertCircle, Wand2 } from 'lucide-react';
import client from '../../../api/client';
import { SubjectCategoryList, SubjectCategory } from './SubjectCategoryList';
import { SubjectFilters } from './SubjectFilters';
import { SubjectList, SubjectItem } from './SubjectList';
import { SubjectForm } from './SubjectForm';
import { SubjectDetails } from './SubjectDetails';

export function normalizeListResponse<T = any>(response: any, preferredKeys: string[] = []): T[] {
  if (!response) return [];
  const payload = response.data !== undefined ? response.data : response;
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;

  if (typeof payload === 'object') {
    if (Array.isArray(payload.data)) return payload.data;

    if (payload.data && typeof payload.data === 'object') {
      for (const key of preferredKeys) {
        if (Array.isArray(payload.data[key])) return payload.data[key];
      }
      for (const key of ['departments', 'courses', 'programs', 'semesters', 'batches', 'academic_years', 'subjects', 'categories', 'items', 'rows', 'list']) {
        if (Array.isArray(payload.data[key])) return payload.data[key];
      }
    }

    for (const key of preferredKeys) {
      if (Array.isArray(payload[key])) return payload[key];
    }
    for (const key of ['departments', 'courses', 'programs', 'semesters', 'batches', 'academic_years', 'subjects', 'categories', 'items', 'rows', 'list']) {
      if (Array.isArray(payload[key])) return payload[key];
    }
  }

  return [];
}

export const SubjectManagement: React.FC = () => {
  const [categories, setCategories] = useState<SubjectCategory[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [viewingSubject, setViewingSubject] = useState<SubjectItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Toast / Notification banner
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const res = await client.get('/subject-categories');
      const cats = normalizeListResponse<SubjectCategory>(res, ['categories']);
      setCategories(cats);
    } catch (err) {
      console.warn('Categories notice:', err);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  // Meta load error tracking to distinguish API failure from legitimate empty lists
  const [metaError, setMetaError] = useState<string | null>(null);

  // Fetch Academic Meta (Departments, Programs, Semesters, Years)
  const fetchAcademicMeta = useCallback(async () => {
    setMetaError(null);
    try {
      const [deptRes, progRes, semRes, ayRes] = await Promise.allSettled([
        client.get('/v1/academic/departments?limit=100'),
        client.get('/v1/academic/courses?limit=100'),
        client.get('/v1/academic/semesters?limit=100'),
        client.get('/academic/academic-years')
      ]);

      const failedModules: string[] = [];

      if (deptRes.status === 'fulfilled') {
        setDepartments(normalizeListResponse(deptRes.value, ['departments']));
      } else {
        setDepartments([]);
        failedModules.push('Departments');
      }

      if (progRes.status === 'fulfilled') {
        setPrograms(normalizeListResponse(progRes.value, ['courses', 'programs']));
      } else {
        setPrograms([]);
        failedModules.push('Programs');
      }

      if (semRes.status === 'fulfilled') {
        setSemesters(normalizeListResponse(semRes.value, ['semesters']));
      } else {
        setSemesters([]);
        failedModules.push('Semesters');
      }

      if (ayRes.status === 'fulfilled') {
        setAcademicYears(normalizeListResponse(ayRes.value, ['academic_years', 'batches']));
      } else {
        setAcademicYears([]);
        failedModules.push('Academic Years');
      }

      if (failedModules.length > 0) {
        setMetaError(`Failed to load academic metadata from server for: ${failedModules.join(', ')}.`);
      }
    } catch (err) {
      console.warn('Academic meta notice:', err);
      setMetaError('Failed to fetch academic structure metadata.');
    }
  }, []);

  // Fetch Subjects with filters
  const fetchSubjects = useCallback(async () => {
    setIsLoadingSubjects(true);
    try {
      const params: Record<string, string> = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedDepartment !== 'all') params.department_id = selectedDepartment;
      if (selectedProgram !== 'all') params.program_id = selectedProgram;
      if (selectedSemester !== 'all') params.semester_id = selectedSemester;
      if (selectedAcademicYear !== 'all') params.academic_year_id = selectedAcademicYear;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await client.get('/subjects', { params });
      const rawData = normalizeListResponse<SubjectItem>(res, ['subjects']);
      setSubjects(rawData);
    } catch (err) {
      console.warn('Subjects notice:', err);
      setSubjects([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  }, [selectedCategory, selectedDepartment, selectedProgram, selectedSemester, selectedAcademicYear, selectedStatus, searchTerm]);

  useEffect(() => {
    fetchCategories();
    fetchAcademicMeta();
  }, [fetchCategories, fetchAcademicMeta]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedDepartment('all');
    setSelectedProgram('all');
    setSelectedSemester('all');
    setSelectedAcademicYear('all');
    setSelectedStatus('all');
  };

  const handleOpenAddForm = () => {
    setEditingSubject(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (subject: SubjectItem) => {
    setEditingSubject(subject);
    setIsFormOpen(true);
  };

  const handleViewSubject = async (subject: SubjectItem) => {
    try {
      const res = await client.get(`/subjects/${subject.id}`);
      if (res.data && res.data.data) {
        setViewingSubject(res.data.data);
      } else {
        setViewingSubject(subject);
      }
    } catch (err) {
      setViewingSubject(subject);
    }
    setIsDetailsOpen(true);
  };

  const handleSaveSubject = async (subjectData: Partial<SubjectItem>) => {
    if (editingSubject) {
      // Update
      const res = await client.put(`/subjects/${editingSubject.id}`, subjectData);
      if (res.data && res.data.success) {
        showToast(`Subject '${subjectData.code}' updated successfully.`);
      } else {
        throw new Error(res.data?.message || 'Failed to update subject');
      }
    } else {
      // Create
      const res = await client.post('/subjects', subjectData);
      if (res.data && res.data.success) {
        showToast(`Subject '${subjectData.code}' created successfully.`);
      } else {
        throw new Error(res.data?.message || 'Failed to create subject');
      }
    }
    fetchSubjects();
    fetchCategories();
  };

  const handleToggleStatus = async (subject: SubjectItem) => {
    const nextStatus = subject.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await client.patch(`/subjects/${subject.id}/status`, { status: nextStatus });
      if (res.data && res.data.success) {
        showToast(`Subject '${subject.code}' set to ${nextStatus}.`);
        fetchSubjects();
        fetchCategories();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update subject status.', 'error');
    }
  };

  const handleExportSubjects = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(subjects, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `Subjects_Export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Subjects list exported successfully.');
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Subject Category Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Define, structure, and categorize academic subjects across departments, programs, and semester regulations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSubjects}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            title="Refresh Subject Catalog"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleExportSubjects}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
          <button
            onClick={handleOpenAddForm}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {metaError && (
        <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>{metaError}</span>
          </div>
          <button
            onClick={() => fetchAcademicMeta()}
            className="text-[11px] font-bold text-amber-700 dark:text-amber-400 underline hover:no-underline"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Category Filter Cards */}
      <SubjectCategoryList
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(catCode) => setSelectedCategory(catCode)}
        isLoading={isLoadingCategories}
      />

      {/* Filters Toolbar */}
      <SubjectFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        selectedProgram={selectedProgram}
        onProgramChange={setSelectedProgram}
        selectedSemester={selectedSemester}
        onSemesterChange={setSelectedSemester}
        selectedAcademicYear={selectedAcademicYear}
        onAcademicYearChange={setSelectedAcademicYear}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        categories={categories}
        departments={departments}
        programs={programs}
        semesters={semesters}
        academicYears={academicYears}
        onReset={handleResetFilters}
      />

      {/* Data Table */}
      <SubjectList
        subjects={subjects}
        isLoading={isLoadingSubjects}
        onView={handleViewSubject}
        onEdit={handleOpenEditForm}
        onToggleStatus={handleToggleStatus}
      />

      {/* Form Modal */}
      <SubjectForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveSubject}
        subject={editingSubject}
        categories={categories}
        departments={departments}
        programs={programs}
        semesters={semesters}
        academicYears={academicYears}
      />

      {/* Details Modal */}
      <SubjectDetails
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        subject={viewingSubject}
      />

    </div>
  );
};
