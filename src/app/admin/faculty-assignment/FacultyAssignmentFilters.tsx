import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';

interface FacultyAssignmentFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (val: string) => void;
  selectedProgram: string;
  onProgramChange: (val: string) => void;
  selectedRegulation: string;
  onRegulationChange: (val: string) => void;
  selectedSemester: string;
  onSemesterChange: (val: string) => void;
  selectedSection: string;
  onSectionChange: (val: string) => void;
  selectedFaculty: string;
  onFacultyChange: (val: string) => void;
  selectedStatus: string;
  onStatusChange: (val: string) => void;
  departments: any[];
  programs: any[];
  regulations: any[];
  semesters: any[];
  sections: any[];
  faculties: any[];
  onReset: () => void;
}

export const FacultyAssignmentFilters: React.FC<FacultyAssignmentFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedDepartment,
  onDepartmentChange,
  selectedProgram,
  onProgramChange,
  selectedRegulation,
  onRegulationChange,
  selectedSemester,
  onSemesterChange,
  selectedSection,
  onSectionChange,
  selectedFaculty,
  onFacultyChange,
  selectedStatus,
  onStatusChange,
  departments,
  programs,
  regulations,
  semesters,
  sections,
  faculties,
  onReset
}) => {
  const hasActiveFilters =
    searchTerm ||
    selectedDepartment !== 'all' ||
    selectedProgram !== 'all' ||
    selectedRegulation !== 'all' ||
    selectedSemester !== 'all' ||
    selectedSection !== 'all' ||
    selectedFaculty !== 'all' ||
    selectedStatus !== 'all';

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
          <Filter className="w-4 h-4 text-blue-500" />
          <span>Filters & Search Toolbar</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
        {/* Search Bar */}
        <div className="relative xl:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by subject, code, or faculty name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Department Filter */}
        <div>
          <select
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Program Filter */}
        <div>
          <select
            value={selectedProgram}
            onChange={(e) => onProgramChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Regulation Filter */}
        <div>
          <select
            value={selectedRegulation}
            onChange={(e) => onRegulationChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Regulations</option>
            {regulations.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Semester Filter */}
        <div>
          <select
            value={selectedSemester}
            onChange={(e) => onSemesterChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Semesters</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>{s.name || `Semester ${s.semester_number}`}</option>
            ))}
          </select>
        </div>

        {/* Section Filter */}
        <div>
          <select
            value={selectedSection}
            onChange={(e) => onSectionChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sections</option>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>Section {sec.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
