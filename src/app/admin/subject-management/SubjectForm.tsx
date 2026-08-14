import React, { useState, useEffect } from 'react';
import { X, Save, BookOpen, Clock, Award, ShieldCheck, AlertCircle } from 'lucide-react';
import { SubjectItem } from './SubjectList';
import { SubjectCategory } from './SubjectCategoryList';

interface SubjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subjectData: Partial<SubjectItem>) => Promise<void>;
  subject?: SubjectItem | null;
  categories: SubjectCategory[];
  departments: any[];
  programs: any[];
  semesters: any[];
  academicYears: any[];
}

export const SubjectForm: React.FC<SubjectFormProps> = ({
  isOpen,
  onClose,
  onSave,
  subject,
  categories,
  departments,
  programs,
  semesters,
  academicYears
}) => {
  const isEdit = !!subject;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [categoryId, setCategoryId] = useState<number | string>('');
  const [departmentId, setDepartmentId] = useState<number | string>('');
  const [courseId, setCourseId] = useState<number | string>('');
  const [semesterId, setSemesterId] = useState<number | string>('');
  const [academicYearId, setAcademicYearId] = useState<number | string>('');
  const [regulation, setRegulation] = useState('R23');
  const [credits, setCredits] = useState<number>(3);
  const [lectureHours, setLectureHours] = useState<number>(3);
  const [tutorialHours, setTutorialHours] = useState<number>(0);
  const [practicalHours, setPracticalHours] = useState<number>(0);
  const [internalMarks, setInternalMarks] = useState<number>(40);
  const [externalMarks, setExternalMarks] = useState<number>(60);
  const [passingMarks, setPassingMarks] = useState<number>(40);
  const [offeringType, setOfferingType] = useState('Theory');
  const [electiveGroup, setElectiveGroup] = useState('');
  const [prerequisite, setPrerequisite] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (subject) {
      setCode(subject.code || '');
      setName(subject.name || '');
      setShortName(subject.short_name || '');
      setCategoryId(subject.category_id || (categories[0]?.id ?? ''));
      setDepartmentId(subject.department_id || '');
      setCourseId(subject.course_id || '');
      setSemesterId(subject.semester_id || '');
      setAcademicYearId(subject.academic_year_id || '');
      setRegulation(subject.regulation || 'R23');
      setCredits(subject.credits || 3);
      setLectureHours(subject.lecture_hours ?? subject.theory_hours ?? 3);
      setTutorialHours(subject.tutorial_hours ?? 0);
      setPracticalHours(subject.practical_hours ?? subject.lab_hours ?? 0);
      setInternalMarks(subject.internal_marks ?? 40);
      setExternalMarks(subject.external_marks ?? 60);
      setPassingMarks(subject.passing_marks ?? 40);
      setOfferingType(subject.offering_type || 'Theory');
      setElectiveGroup(subject.elective_group || '');
      setPrerequisite(subject.prerequisite || '');
      setDescription(subject.description || '');
      setStatus(subject.status === 'Inactive' ? 'Inactive' : 'Active');
    } else {
      setCode('');
      setName('');
      setShortName('');
      setCategoryId(categories[0]?.id ?? '');
      setDepartmentId(departments[0]?.id ?? '');
      setCourseId(programs[0]?.id ?? '');
      setSemesterId(semesters[0]?.id ?? '');
      setAcademicYearId(academicYears[0]?.id ?? '');
      setRegulation('R23');
      setCredits(3);
      setLectureHours(3);
      setTutorialHours(0);
      setPracticalHours(0);
      setInternalMarks(40);
      setExternalMarks(60);
      setPassingMarks(40);
      setOfferingType('Theory');
      setElectiveGroup('');
      setPrerequisite('');
      setDescription('');
      setStatus('Active');
    }
    setError('');
  }, [subject, isOpen, categories, departments, programs, semesters, academicYears]);

  if (!isOpen) return null;

  const calculatedTotalHours = (Number(lectureHours) || 0) + (Number(tutorialHours) || 0) + (Number(practicalHours) || 0);
  const calculatedTotalMarks = (Number(internalMarks) || 0) + (Number(externalMarks) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Subject Code is required.');
      return;
    }
    if (!name.trim()) {
      setError('Subject Name is required.');
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        short_name: shortName.trim(),
        category_id: categoryId ? Number(categoryId) : undefined,
        department_id: departmentId ? Number(departmentId) : undefined,
        course_id: courseId ? Number(courseId) : undefined,
        semester_id: semesterId ? Number(semesterId) : undefined,
        academic_year_id: academicYearId ? Number(academicYearId) : undefined,
        regulation: regulation.trim(),
        credits: Number(credits) || 3,
        lecture_hours: Number(lectureHours) || 0,
        tutorial_hours: Number(tutorialHours) || 0,
        practical_hours: Number(practicalHours) || 0,
        total_hours: calculatedTotalHours,
        internal_marks: Number(internalMarks) || 0,
        external_marks: Number(externalMarks) || 0,
        total_marks: calculatedTotalMarks,
        passing_marks: Number(passingMarks) || 0,
        offering_type: offeringType,
        elective_group: electiveGroup.trim(),
        prerequisite: prerequisite.trim(),
        description: description.trim(),
        status
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save subject.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEdit ? `Edit Subject: ${subject?.code}` : 'Create New Academic Subject'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure subject classification, credits, workload, and evaluation metrics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 text-xs font-medium border border-red-200 dark:border-red-900/40 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Basic Specifications
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. CS301"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Data Structures and Algorithms"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Short Name
                </label>
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="e.g. DSA"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Offering Type
                </label>
                <select
                  value={offeringType}
                  onChange={(e) => setOfferingType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Theory">Theory</option>
                  <option value="Practical">Practical (Lab)</option>
                  <option value="Theory + Practical">Theory + Practical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Academic Structure Hierarchy */}
          <div className="space-y-4 border-t border-slate-100 dark:border-slate-700/60 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Academic Structure Alignment
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All / Interdepartmental</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Program / Course
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Programs</option>
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Semester
                </label>
                <select
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Semester</option>
                  {semesters.map((sem) => (
                    <option key={sem.id} value={sem.id}>
                      {sem.name || `Semester ${sem.semester_number}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Year Level
                </label>
                <select
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Year Level</option>
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name || `Year ${ay.year_level}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Regulation / Curriculum Code
                </label>
                <input
                  type="text"
                  value={regulation}
                  onChange={(e) => setRegulation(e.target.value)}
                  placeholder="e.g. R23"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Elective Group (If applicable)
                </label>
                <input
                  type="text"
                  value={electiveGroup}
                  onChange={(e) => setElectiveGroup(e.target.value)}
                  placeholder="e.g. PE-1 / Group A"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Credits & Workload Breakdown */}
          <div className="space-y-4 border-t border-slate-100 dark:border-slate-700/60 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Credits & Weekly Hours Breakdown
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Credits
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="20"
                  value={credits}
                  onChange={(e) => setCredits(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lecture (L)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={lectureHours}
                  onChange={(e) => setLectureHours(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tutorial (T)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={tutorialHours}
                  onChange={(e) => setTutorialHours(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Practical (P)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={practicalHours}
                  onChange={(e) => setPracticalHours(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Hours
                </label>
                <input
                  type="text"
                  value={`${calculatedTotalHours} hrs/wk`}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Evaluation & Marks Scheme */}
          <div className="space-y-4 border-t border-slate-100 dark:border-slate-700/60 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Examination & Evaluation Marks Scheme
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Internal Marks
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={internalMarks}
                  onChange={(e) => setInternalMarks(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  External Marks
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={externalMarks}
                  onChange={(e) => setExternalMarks(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Marks
                </label>
                <input
                  type="text"
                  value={calculatedTotalMarks}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Passing Marks
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Prerequisites & Description */}
          <div className="space-y-4 border-t border-slate-100 dark:border-slate-700/60 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prerequisite Subjects
              </label>
              <input
                type="text"
                value={prerequisite}
                onChange={(e) => setPrerequisite(e.target.value)}
                placeholder="e.g. Programming in C, Mathematics-I"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject Syllabus Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter brief description of subject objectives, topics covered, or syllabus summary..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                className="w-full sm:w-48 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive (Deactivated)</option>
              </select>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Save Changes' : 'Create Subject'}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
