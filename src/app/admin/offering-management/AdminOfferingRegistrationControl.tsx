import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Users, Plus, CheckCircle2, AlertCircle, RefreshCw, Lock, Unlock, Download, Filter, Search, UserCheck, ShieldAlert, Award, AlertTriangle, Layers, X, Wand2, Calendar, Sparkles } from 'lucide-react';
import client from '../../../api/client';

export const AdminOfferingRegistrationControl: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OFFERINGS' | 'WINDOWS' | 'ASSIGNMENTS'>('OFFERINGS');

  // Data States
  const [offerings, setOfferings] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [regulations, setRegulations] = useState<any[]>([]);
  const [subjectVersions, setSubjectVersions] = useState<any[]>([]);
  const [cbcsWindows, setCbcsWindows] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal States
  const [isCreateOfferingOpen, setIsCreateOfferingOpen] = useState(false);
  const [isAssignFacultyOpen, setIsAssignFacultyOpen] = useState(false);
  const [isCreateWindowOpen, setIsCreateWindowOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);

  const [selectedOfferingForFaculty, setSelectedOfferingForFaculty] = useState<any>(null);
  const [selectedWindowForAllocation, setSelectedWindowForAllocation] = useState<any>(null);
  const [isProcessingAllocation, setIsProcessingAllocation] = useState(false);
  const [allocationResult, setAllocationResult] = useState<any>(null);

  // Form States
  const [newOffering, setNewOffering] = useState({
    subjectVersionId: '',
    semesterId: '1',
    sectionId: '',
    departmentId: '1',
    regulationId: '1',
    maxStudents: '60'
  });

  const [newWindow, setNewWindow] = useState({
    title: 'Semester 5 CBCS Elective Selection Window 2026',
    semesterId: '5',
    departmentId: '1',
    regulationId: '1',
    startDatetime: '2026-10-01T09:00',
    endDatetime: '2026-10-15T23:59',
    minCredits: '16',
    maxCredits: '26'
  });

  const [facultyAssignmentForm, setFacultyAssignmentForm] = useState({
    facultyId: '',
    componentType: 'THEORY'
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchOfferings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await client.get('/academic/subject-offerings');
      if (res.data) {
        const raw = Array.isArray(res.data?.data?.offerings)
          ? res.data.data.offerings
          : (Array.isArray(res.data?.offerings) ? res.data.offerings : []);
        setOfferings(raw);
      }
    } catch (err) {
      console.error('Error fetching offerings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCBCSWindows = useCallback(async () => {
    try {
      const res = await client.get('/academic/cbcs/windows');
      if (res.data && res.data.data?.windows) {
        setCbcsWindows(res.data.data.windows);
      }
    } catch (err) {
      console.warn('CBCS Windows fetch notice:', err);
    }
  }, []);

  const fetchMetadata = useCallback(async () => {
    try {
      const [dRes, semRes, secRes, regRes, facRes] = await Promise.allSettled([
        client.get('/v1/academic/departments'),
        client.get('/v1/academic/semesters'),
        client.get('/academic/sections'),
        client.get('/academic/regulations'),
        client.get('/academic/available-faculty')
      ]);

      if (dRes.status === 'fulfilled' && dRes.value.data) {
        const raw = dRes.value.data;
        setDepartments(Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []));
      }
      if (semRes.status === 'fulfilled' && semRes.value.data) {
        const raw = semRes.value.data;
        setSemesters(Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []));
      }
      if (secRes.status === 'fulfilled' && secRes.value.data) {
        const raw = secRes.value.data;
        setSections(Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []));
      }
      if (regRes.status === 'fulfilled' && regRes.value.data) {
        const raw = regRes.value.data;
        setRegulations(Array.isArray(raw?.data?.regulations) ? raw.data.regulations : (Array.isArray(raw?.regulations) ? raw.regulations : []));
      }
      if (facRes.status === 'fulfilled' && facRes.value.data) {
        const raw = facRes.value.data;
        setFaculties(Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []));
      }
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  }, []);

  const fetchSubjectVersions = useCallback(async (regId: string) => {
    if (!regId) return;
    try {
      const res = await client.get(`/academic/subject-versions?regulationId=${regId}`);
      if (res.data) {
        const raw = Array.isArray(res.data?.data?.versions) ? res.data.data.versions : (Array.isArray(res.data?.versions) ? res.data.versions : []);
        setSubjectVersions(raw);
      }
    } catch (err) {
      console.error('Error fetching subject versions:', err);
    }
  }, []);

  useEffect(() => {
    fetchOfferings();
    fetchMetadata();
    fetchCBCSWindows();
  }, [fetchOfferings, fetchMetadata, fetchCBCSWindows]);

  useEffect(() => {
    if (newOffering.regulationId) {
      fetchSubjectVersions(newOffering.regulationId);
    }
  }, [newOffering.regulationId, fetchSubjectVersions]);

  const handleCreateOfferingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOffering.subjectVersionId || !newOffering.sectionId || !newOffering.semesterId) {
      showToast('Please select Subject Version, Semester, and Section.', 'error');
      return;
    }

    try {
      const res = await client.post('/academic/subject-offerings', {
        academicYearId: 1,
        semesterId: Number(newOffering.semesterId),
        regulationId: Number(newOffering.regulationId),
        departmentId: Number(newOffering.departmentId),
        courseId: 1,
        sectionId: Number(newOffering.sectionId),
        subjectVersionId: Number(newOffering.subjectVersionId),
        maxStudents: Number(newOffering.maxStudents)
      });

      if (res.data && res.data.success) {
        showToast('Subject offering created successfully!');
        setIsCreateOfferingOpen(false);
        fetchOfferings();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create subject offering.', 'error');
    }
  };

  const handleCreateWindowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await client.post('/academic/cbcs/windows', {
        title: newWindow.title,
        semesterId: Number(newWindow.semesterId),
        departmentId: Number(newWindow.departmentId),
        regulationId: Number(newWindow.regulationId),
        startDatetime: newWindow.startDatetime,
        endDatetime: newWindow.endDatetime,
        minCredits: Number(newWindow.minCredits),
        maxCredits: Number(newWindow.maxCredits)
      });

      if (res.data && res.data.success) {
        showToast('CBCS Choice Registration Window created successfully!');
        setIsCreateWindowOpen(false);
        fetchCBCSWindows();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create CBCS window.', 'error');
    }
  };

  const handleAssignFacultySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyAssignmentForm.facultyId || !selectedOfferingForFaculty) {
      showToast('Please select a faculty member.', 'error');
      return;
    }

    try {
      const res = await client.post(`/academic/subject-offerings/${selectedOfferingForFaculty.id}/faculty`, {
        facultyId: Number(facultyAssignmentForm.facultyId),
        componentType: facultyAssignmentForm.componentType
      });

      if (res.data && res.data.success) {
        showToast('Faculty assigned to offering successfully!');
        setIsAssignFacultyOpen(false);
        fetchOfferings();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to assign faculty.', 'error');
    }
  };

  const handleRunAutomatedAllocation = async () => {
    if (!selectedWindowForAllocation) return;
    setIsProcessingAllocation(true);
    try {
      const res = await client.post(`/academic/cbcs/windows/${selectedWindowForAllocation.id}/process-allocation`);
      if (res.data && res.data.success) {
        setAllocationResult(res.data.data);
        showToast('Automated CGPA Merit-Cum-Choice Allocation completed successfully!');
        fetchCBCSWindows();
        fetchOfferings();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to run CGPA automated allocation.', 'error');
    } finally {
      setIsProcessingAllocation(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${
          toastMessage.type === 'success' ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40' : 'bg-red-950/90 text-red-200 border-red-500/40'
        }`}>
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs opacity-70">Dismiss</button>
        </div>
      )}

      {/* Page Title & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <span>CBCS Governance & Automated Choice Allocation</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage Choice-Based Credit System (CBCS) registration windows, set section capacity caps, assign faculty, and execute CGPA merit-based seat allocation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (cbcsWindows.length > 0) {
                setSelectedWindowForAllocation(cbcsWindows[0]);
                setIsAllocationModalOpen(true);
              } else {
                showToast('Please create a CBCS Registration Window first.', 'error');
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Wand2 className="w-4 h-4" />
            <span>Run CGPA Merit Allocation</span>
          </button>

          <button
            onClick={() => setIsCreateWindowOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>New CBCS Window</span>
          </button>

          <button
            onClick={() => setIsCreateOfferingOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Offering</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('OFFERINGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'OFFERINGS'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Active Subject Offerings ({offerings.length})
        </button>

        <button
          onClick={() => setActiveTab('WINDOWS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'WINDOWS'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          CBCS Choice Windows ({cbcsWindows.length})
        </button>
      </div>

      {/* TAB 1: OFFERINGS TABLE */}
      {activeTab === 'OFFERINGS' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Active Term Subject Offerings</h2>
            <button onClick={fetchOfferings} className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh List
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4">Offering Code</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">L-T-P Matrix</th>
                  <th className="py-3 px-4">Section / Dept</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Assigned Faculty</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Loading subject offerings...</td>
                  </tr>
                ) : (Array.isArray(offerings) ? offerings : []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No subject offerings created yet.</td>
                  </tr>
                ) : (
                  (Array.isArray(offerings) ? offerings : []).map((off: any) => (
                    <tr key={off.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{off.offering_code}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{off.subject_name}</div>
                        <div className="text-[10px] text-slate-400">{off.subject_code} • {off.offering_type || 'Theory'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg font-mono font-bold text-[11px]">
                          L:{off.lecture_hours || 3} T:{off.tutorial_hours || 0} P:{off.practical_hours || 0} = {off.credits || 3.0} Cr
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Section {off.section_name}</span>
                        <div className="text-[10px] text-slate-400">{off.department_name}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <span className={off.current_students >= off.max_students ? 'text-red-500 font-bold' : 'text-emerald-600 font-bold'}>
                          {off.current_students} / {off.max_students}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 dark:text-slate-200 font-semibold">{off.assigned_faculty || 'Unassigned'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => { setSelectedOfferingForFaculty(off); setIsAssignFacultyOpen(true); }}
                          className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 cursor-pointer"
                        >
                          Assign Faculty
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CBCS CHOICE WINDOWS TABLE */}
      {activeTab === 'WINDOWS' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">CBCS Registration Choice Windows</h2>
            <button onClick={fetchCBCSWindows} className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh List
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4">Window Title</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4">Credit Bounds</th>
                  <th className="py-3 px-4">Applicants</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cbcsWindows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No CBCS registration windows configured yet.</td>
                  </tr>
                ) : (
                  cbcsWindows.map((win: any) => (
                    <tr key={win.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{win.title}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">Semester {win.semester_number || win.semester_id}</td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        <div>From: {new Date(win.start_datetime).toLocaleDateString()}</div>
                        <div>To: {new Date(win.end_datetime).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        Min {win.min_credits} Cr • Max {win.max_credits} Cr
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {win.students_applied || 0} Students
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          win.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          win.status === 'ALLOCATION_PROCESSED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {win.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => { setSelectedWindowForAllocation(win); setIsAllocationModalOpen(true); }}
                          className="px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-bold hover:bg-purple-100 cursor-pointer"
                        >
                          Process Allocation
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Create Offering Modal */}
      {isCreateOfferingOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Create New Subject Offering</h3>
              <button onClick={() => setIsCreateOfferingOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOfferingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Regulation</label>
                <select
                  value={newOffering.regulationId}
                  onChange={e => setNewOffering(prev => ({ ...prev, regulationId: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                >
                  {(Array.isArray(regulations) ? regulations : []).map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.effective_year})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Subject Master</label>
                <select
                  value={newOffering.subjectVersionId}
                  onChange={e => setNewOffering(prev => ({ ...prev, subjectVersionId: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                >
                  <option value="">Select Subject Version...</option>
                  {(Array.isArray(subjectVersions) ? subjectVersions : []).map((sv: any) => (
                    <option key={sv.id} value={sv.id}>{sv.subject_code} — {sv.subject_name} ({sv.credits} Cr)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
                  <select
                    value={newOffering.semesterId}
                    onChange={e => setNewOffering(prev => ({ ...prev, semesterId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    {(Array.isArray(semesters) ? semesters : []).map((s: any) => (
                      <option key={s.id} value={s.id}>Semester {s.name || s.id}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Section</label>
                  <select
                    value={newOffering.sectionId}
                    onChange={e => setNewOffering(prev => ({ ...prev, sectionId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    <option value="">Select Section...</option>
                    {(Array.isArray(sections) ? sections : []).map((sec: any) => (
                      <option key={sec.id} value={sec.id}>Section {sec.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Max Student Capacity Cap</label>
                <input
                  type="number"
                  value={newOffering.maxStudents}
                  onChange={e => setNewOffering(prev => ({ ...prev, maxStudents: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreateOfferingOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold">Create Offering</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create CBCS Window Modal */}
      {isCreateWindowOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">New CBCS Choice Window</h3>
              <button onClick={() => setIsCreateWindowOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWindowSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Window Title</label>
                <input
                  type="text"
                  value={newWindow.title}
                  onChange={e => setNewWindow(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Semester</label>
                  <select
                    value={newWindow.semesterId}
                    onChange={e => setNewWindow(prev => ({ ...prev, semesterId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    {(Array.isArray(semesters) ? semesters : []).map((s: any) => (
                      <option key={s.id} value={s.id}>Semester {s.name || s.id}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <select
                    value={newWindow.departmentId}
                    onChange={e => setNewWindow(prev => ({ ...prev, departmentId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    {(Array.isArray(departments) ? departments : []).map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Start Datetime</label>
                  <input
                    type="datetime-local"
                    value={newWindow.startDatetime}
                    onChange={e => setNewWindow(prev => ({ ...prev, startDatetime: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">End Datetime</label>
                  <input
                    type="datetime-local"
                    value={newWindow.endDatetime}
                    onChange={e => setNewWindow(prev => ({ ...prev, endDatetime: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Min Credits</label>
                  <input
                    type="number"
                    value={newWindow.minCredits}
                    onChange={e => setNewWindow(prev => ({ ...prev, minCredits: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Max Credits</label>
                  <input
                    type="number"
                    value={newWindow.maxCredits}
                    onChange={e => setNewWindow(prev => ({ ...prev, maxCredits: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreateWindowOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">Create Window</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Assign Faculty Modal */}
      {isAssignFacultyOpen && selectedOfferingForFaculty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Assign Faculty Member</h3>
              <button onClick={() => setIsAssignFacultyOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Assigning faculty to offering <strong className="text-slate-900 dark:text-white">{selectedOfferingForFaculty.subject_name}</strong> (Section {selectedOfferingForFaculty.section_name})
            </p>

            <form onSubmit={handleAssignFacultySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Faculty Member</label>
                <select
                  value={facultyAssignmentForm.facultyId}
                  onChange={e => setFacultyAssignmentForm(prev => ({ ...prev, facultyId: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                >
                  <option value="">Select Faculty...</option>
                  {(Array.isArray(faculties) ? faculties : []).map((f: any) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.department_code || 'Dept'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Component Type</label>
                <select
                  value={facultyAssignmentForm.componentType}
                  onChange={e => setFacultyAssignmentForm(prev => ({ ...prev, componentType: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                >
                  <option value="THEORY">Theory</option>
                  <option value="LABORATORY">Laboratory</option>
                  <option value="TUTORIAL">Tutorial</option>
                  <option value="MAIN">Main</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAssignFacultyOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold">Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Automated CGPA Allocation Engine Modal */}
      {isAllocationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-600" />
                <span>Automated CGPA Merit-Cum-Choice Engine</span>
              </h3>
              <button onClick={() => setIsAllocationModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-300">
                <p className="font-bold">Execution Target Window:</p>
                <p className="text-sm font-semibold">{selectedWindowForAllocation?.title || 'Active Window'}</p>
                <p className="mt-1 text-[11px]">
                  Sorts all student preferences by <strong>CGPA (Descending)</strong> and fills section seat capacities transparently.
                </p>
              </div>

              {allocationResult && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2 text-emerald-900 dark:text-emerald-300">
                  <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400">Allocation Completed Successfully!</p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    <div>Students Processed: <span className="font-bold">{allocationResult.studentsProcessed}</span></div>
                    <div>Seats Allocated: <span className="font-bold">{allocationResult.totalAllocated}</span></div>
                    <div>Pref #1 Success: <span className="font-bold">{allocationResult.preference1Success}</span></div>
                    <div>Unallocated: <span className="font-bold">{allocationResult.unallocatedCount}</span></div>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAllocationModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isProcessingAllocation}
                  onClick={handleRunAutomatedAllocation}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingAllocation ? (
                    <span>Executing CGPA Merit Algorithm...</span>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Execute Allocation Engine</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
