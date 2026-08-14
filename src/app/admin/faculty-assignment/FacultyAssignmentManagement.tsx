import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, Plus, RefreshCw, CheckCircle2, AlertCircle, Clock, BookOpen, Layers, ShieldCheck } from 'lucide-react';
import client from '../../../api/client';
import { FacultyAssignmentFilters } from './FacultyAssignmentFilters';
import { FacultyAssignmentList, AssignmentItem } from './FacultyAssignmentList';
import { FacultyAssignmentModal } from './FacultyAssignmentModal';

export const FacultyAssignmentManagement: React.FC = () => {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [regulations, setRegulations] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [selectedRegulation, setSelectedRegulation] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchAssignments = useCallback(async () => {
    setIsLoadingAssignments(true);
    try {
      const params: Record<string, string> = {};
      if (selectedDepartment !== 'all') params.department_id = selectedDepartment;
      if (selectedProgram !== 'all') params.course_id = selectedProgram;
      if (selectedRegulation !== 'all') params.regulation_id = selectedRegulation;
      if (selectedSemester !== 'all') params.semester_id = selectedSemester;
      if (selectedSection !== 'all') params.section_id = selectedSection;
      if (selectedFaculty !== 'all') params.faculty_id = selectedFaculty;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await client.get('/faculty-assignments', { params });
      if (res.data) {
        const raw = Array.isArray(res.data) ? res.data : res.data.data || [];
        setAssignments(raw);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      showToast('Failed to load faculty subject assignments.', 'error');
    } finally {
      setIsLoadingAssignments(false);
    }
  }, [selectedDepartment, selectedProgram, selectedRegulation, selectedSemester, selectedSection, selectedFaculty, selectedStatus, searchTerm]);

  const fetchAvailableFaculty = useCallback(async () => {
    try {
      const res = await client.get('/faculty-assignments/available-faculty');
      if (res.data) {
        const raw = Array.isArray(res.data) ? res.data : res.data.data || [];
        setFaculties(raw);
      }
    } catch (err) {
      console.error('Error fetching teaching faculty:', err);
    }
  }, []);

  const fetchAcademicMetadata = useCallback(async () => {
    try {
      const [deptRes, progRes, regRes, semRes, secRes] = await Promise.allSettled([
        client.get('/v1/academic/departments'),
        client.get('/v1/academic/courses'),
        client.get('/regulations'),
        client.get('/v1/academic/semesters'),
        client.get('/academic/sections')
      ]);

      if (deptRes.status === 'fulfilled' && deptRes.value.data) {
        setDepartments(Array.isArray(deptRes.value.data) ? deptRes.value.data : deptRes.value.data.data || []);
      }
      if (progRes.status === 'fulfilled' && progRes.value.data) {
        setPrograms(Array.isArray(progRes.value.data) ? progRes.value.data : progRes.value.data.data || []);
      }
      if (regRes.status === 'fulfilled' && regRes.value.data) {
        setRegulations(Array.isArray(regRes.value.data) ? regRes.value.data : regRes.value.data.data || []);
      }
      if (semRes.status === 'fulfilled' && semRes.value.data) {
        setSemesters(Array.isArray(semRes.value.data) ? semRes.value.data : semRes.value.data.data || []);
      }
      if (secRes.status === 'fulfilled' && secRes.value.data) {
        setSections(Array.isArray(secRes.value.data) ? secRes.value.data : secRes.value.data.data || []);
      } else {
        setSections([{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }]);
      }
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  }, []);

  useEffect(() => {
    fetchAvailableFaculty();
    fetchAcademicMetadata();
  }, [fetchAvailableFaculty, fetchAcademicMetadata]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('all');
    setSelectedProgram('all');
    setSelectedRegulation('all');
    setSelectedSemester('all');
    setSelectedSection('all');
    setSelectedFaculty('all');
    setSelectedStatus('all');
  };

  const handleOpenAddModal = () => {
    setEditingAssignment(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (asg: AssignmentItem) => {
    setEditingAssignment(asg);
    setIsModalOpen(true);
  };

  const handleSaveAssignment = async (assignmentData: any) => {
    if (editingAssignment) {
      const res = await client.put(`/faculty-assignments/${editingAssignment.id}`, assignmentData);
      if (res.data && res.data.success) {
        showToast('Faculty assignment updated successfully.');
      } else {
        throw new Error(res.data?.message || 'Failed to update assignment');
      }
    } else {
      const res = await client.post('/faculty-assignments', assignmentData);
      if (res.data && res.data.success) {
        showToast('Faculty assigned to subject successfully.');
      } else {
        throw new Error(res.data?.message || 'Failed to create assignment');
      }
    }
    fetchAssignments();
    fetchAvailableFaculty();
  };

  const handleApproveAssignment = async (id: number) => {
    try {
      const res = await client.patch(`/faculty-assignments/${id}/approve`);
      if (res.data && res.data.success) {
        showToast('Faculty assignment approved.');
        fetchAssignments();
      }
    } catch (err: any) {
      showToast('Failed to approve assignment.', 'error');
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (window.confirm('Are you sure you want to remove this faculty subject assignment?')) {
      try {
        const res = await client.delete(`/faculty-assignments/${id}`);
        if (res.data && res.data.success) {
          showToast('Faculty assignment removed.');
          fetchAssignments();
          fetchAvailableFaculty();
        }
      } catch (err: any) {
        showToast('Failed to remove assignment.', 'error');
      }
    }
  };

  // Overview metrics
  const activeCount = assignments.filter(a => a.status === 'Active').length;
  const pendingCount = assignments.filter(a => a.status === 'Pending Approval').length;
  const uniqueFacultyAssignedCount = new Set(assignments.map(a => a.faculty_id)).size;

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
              <UserCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Faculty-to-Subject Assignment System
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Map teaching faculty to curriculum subjects for specific sections, semesters, and regulations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchAssignments(); fetchAvailableFaculty(); }}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Faculty</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Assignments</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{assignments.length}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Active Allocations</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{activeCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 shadow-xs">
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">Pending Approvals</p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">{pendingCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 shadow-xs">
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">Teaching Faculty Assigned</p>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">{uniqueFacultyAssignedCount} Faculty</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <FacultyAssignmentFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        selectedProgram={selectedProgram}
        onProgramChange={setSelectedProgram}
        selectedRegulation={selectedRegulation}
        onRegulationChange={setSelectedRegulation}
        selectedSemester={selectedSemester}
        onSemesterChange={setSelectedSemester}
        selectedSection={selectedSection}
        onSectionChange={setSelectedSection}
        selectedFaculty={selectedFaculty}
        onFacultyChange={setSelectedFaculty}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        departments={departments}
        programs={programs}
        regulations={regulations}
        semesters={semesters}
        sections={sections}
        faculties={faculties}
        onReset={handleResetFilters}
      />

      {/* Faculty Assignment Table */}
      <FacultyAssignmentList
        assignments={assignments}
        isLoading={isLoadingAssignments}
        onApprove={handleApproveAssignment}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteAssignment}
      />

      {/* Modal Form */}
      <FacultyAssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAssignment}
        assignment={editingAssignment}
        departments={departments}
        programs={programs}
        regulations={regulations}
        semesters={semesters}
        sections={sections}
        faculties={faculties}
      />

    </div>
  );
};
