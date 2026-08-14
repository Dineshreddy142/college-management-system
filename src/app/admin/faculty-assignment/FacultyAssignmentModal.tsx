import React, { useState, useEffect } from 'react';
import { X, Save, UserCheck, Clock, AlertCircle, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import client from '../../../api/client';
import { AssignmentItem } from './FacultyAssignmentList';

interface FacultyAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignmentData: any) => Promise<void>;
  assignment?: AssignmentItem | null;
  departments: any[];
  programs: any[];
  regulations: any[];
  semesters: any[];
  sections: any[];
  faculties: any[];
}

export const FacultyAssignmentModal: React.FC<FacultyAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  assignment,
  departments,
  programs,
  regulations,
  semesters,
  sections,
  faculties
}) => {
  const isEdit = !!assignment;

  const [departmentId, setDepartmentId] = useState<string>('');
  const [programId, setProgramId] = useState<string>('');
  const [regulationId, setRegulationId] = useState<string>('');
  const [semesterId, setSemesterId] = useState<string>('');
  const [sectionId, setSectionId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [facultyId, setFacultyId] = useState<string>('');
  const [weeklyHours, setWeeklyHours] = useState<number>(3);
  const [status, setStatus] = useState<'Active' | 'Pending Approval'>('Active');

  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Selected faculty workload details
  const selectedFacultyObj = faculties.find(f => String(f.id) === String(facultyId));

  useEffect(() => {
    if (assignment) {
      setDepartmentId(String(assignment.department_id || ''));
      setProgramId(String(assignment.course_id || ''));
      setRegulationId(String(assignment.regulation_id || ''));
      setSemesterId(String(assignment.semester_id || ''));
      setSectionId(String(assignment.section_id || ''));
      setSubjectId(String(assignment.subject_id || ''));
      setFacultyId(String(assignment.faculty_id || ''));
      setWeeklyHours(assignment.weekly_hours || 3);
      setStatus(assignment.status === 'Pending Approval' ? 'Pending Approval' : 'Active');
    } else {
      if (departments.length > 0) setDepartmentId(String(departments[0].id));
      if (programs.length > 0) setProgramId(String(programs[0].id));
      if (regulations.length > 0) setRegulationId(String(regulations[0].id));
      if (semesters.length > 0) setSemesterId(String(semesters[0].id));
      if (sections.length > 0) setSectionId(String(sections[0].id));
      if (faculties.length > 0) setFacultyId(String(faculties[0].id));
      setSubjectId('');
      setWeeklyHours(3);
      setStatus('Active');
    }
    setError('');
  }, [assignment, isOpen, departments, programs, regulations, semesters, sections, faculties]);

  // Fetch subjects based on selected filters (Semester / Department / Program)
  useEffect(() => {
    if (isOpen) {
      fetchSubjectsForAssignment();
    }
  }, [isOpen, departmentId, programId, semesterId]);

  const fetchSubjectsForAssignment = async () => {
    setIsLoadingSubjects(true);
    try {
      const params: Record<string, string> = { status: 'Active' };
      if (departmentId && departmentId !== 'all') params.department_id = departmentId;
      if (programId && programId !== 'all') params.program_id = programId;
      if (semesterId && semesterId !== 'all') params.semester_id = semesterId;

      const res = await client.get('/subjects', { params });
      if (res.data) {
        const raw = Array.isArray(res.data) ? res.data : res.data.data || [];
        setAvailableSubjects(raw);
        if (raw.length > 0 && !subjectId) {
          setSubjectId(String(raw[0].id));
          setWeeklyHours(raw[0].lecture_hours || raw[0].practical_hours || 3);
        }
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!sectionId) {
      setError('Section is required.');
      return;
    }
    if (!subjectId) {
      setError('Subject selection is required.');
      return;
    }
    if (!facultyId) {
      setError('Faculty member assignment is required.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        department_id: departmentId ? Number(departmentId) : null,
        course_id: programId ? Number(programId) : null,
        regulation_id: regulationId ? Number(regulationId) : null,
        semester_id: semesterId ? Number(semesterId) : null,
        section_id: Number(sectionId),
        subject_id: Number(subjectId),
        faculty_id: Number(facultyId),
        weekly_hours: Number(weeklyHours) || 3,
        status
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save faculty assignment.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEdit ? `Edit Faculty Assignment #${assignment?.id}` : 'Assign Faculty Member to Subject'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Map teaching faculty to curriculum subjects for specific sections and semesters
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 font-medium border border-red-200 dark:border-red-900/40 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Academic Context Hierarchy */}
          <div className="space-y-3">
            <h4 className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Academic Context Alignment
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Program</label>
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Regulation</label>
                <select
                  value={regulationId}
                  onChange={(e) => setRegulationId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {regulations.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
                <select
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>{s.name || `Semester ${s.semester_number}`}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Subject & Section Selection */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Subject & Section Selection
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectId(e.target.value);
                    const sub = availableSubjects.find(s => String(s.id) === e.target.value);
                    if (sub) setWeeklyHours(sub.lecture_hours || sub.practical_hours || 3);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  required
                >
                  <option value="">-- Choose Subject --</option>
                  {availableSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      [{sub.code}] {sub.name} ({sub.category_name || 'CORE'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Class Section <span className="text-red-500">*</span>
                </label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  required
                >
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>Section {sec.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Faculty Assignment & Workload Gauge */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <h4 className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> Teaching Faculty Assignment
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Faculty Member <span className="text-red-500">*</span>
                </label>
                <select
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  required
                >
                  <option value="">-- Choose Faculty Member --</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.first_name} {f.last_name} ({f.department_name || 'Faculty'}) — {f.total_weekly_workload || 0}h assigned
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Weekly Teaching Hours
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>
            </div>

            {/* Selected Faculty Workload Indicator */}
            {selectedFacultyObj && (
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    {selectedFacultyObj.first_name} {selectedFacultyObj.last_name}
                  </p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400">
                    Currently teaching {selectedFacultyObj.assigned_subjects_count || 0} subjects
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-800 dark:text-amber-300 text-xs">
                    {selectedFacultyObj.total_weekly_workload || 0} hrs/week
                  </span>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">Current Workload Load</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Save Assignment' : 'Assign Faculty'}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
