import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Download, Search, CheckCircle2, RefreshCw, Filter, Layers, UserCheck } from 'lucide-react';
import client from '../../api/client';

export const FacultySubjectOfferings: React.FC = () => {
  const [offerings, setOfferings] = useState<any[]>([]);
  const [selectedOffering, setSelectedOffering] = useState<any>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAssignedOfferings = async () => {
    setIsLoading(true);
    try {
      const res = await client.get('/faculty/my-offered-subjects');
      if (res.data) {
        const raw = Array.isArray(res.data?.data?.offerings)
          ? res.data.data.offerings
          : (Array.isArray(res.data?.offerings) ? res.data.offerings : []);
        setOfferings(raw);
        if (raw.length > 0 && !selectedOffering) {
          setSelectedOffering(raw[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching faculty assigned offerings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEnrolledStudents = async (offeringId: number) => {
    setIsLoadingStudents(true);
    try {
      const res = await client.get(`/faculty/subjects/${offeringId}/students`);
      if (res.data) {
        const raw = Array.isArray(res.data?.data?.students)
          ? res.data.data.students
          : (Array.isArray(res.data?.students) ? res.data.students : []);
        setEnrolledStudents(raw);
      }
    } catch (err) {
      console.error('Error fetching enrolled students:', err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchAssignedOfferings();
  }, []);

  useEffect(() => {
    if (selectedOffering?.offering_id) {
      fetchEnrolledStudents(selectedOffering.offering_id);
    }
  }, [selectedOffering]);

  const handleExportRosterCSV = () => {
    if (enrolledStudents.length === 0) return;
    const headers = 'Roll Number,Student Name,Email,Category,Status\n';
    const rows = enrolledStudents.map(s => `"${s.roll_number || ''}","${s.name || ''}","${s.email || ''}","${s.registration_category || ''}","${s.enrollment_status || ''}"`).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Enrolled_Students_${selectedOffering?.subject_code || 'Subject'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = (Array.isArray(enrolledStudents) ? enrolledStudents : []).filter(s => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.roll_number && s.roll_number.toLowerCase().includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span>My Assigned Subject Offerings</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            View course sections assigned to you, monitor enrolled student capacity, and export section rosters.
          </p>
        </div>

        <button
          onClick={fetchAssignedOfferings}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Offerings</span>
        </button>
      </div>

      {/* Offerings Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(Array.isArray(offerings) ? offerings : []).map((off: any) => {
          const isSelected = selectedOffering?.offering_id === off.offering_id;
          return (
            <div
              key={off.offering_id}
              onClick={() => setSelectedOffering(off)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                }`}>
                  {off.subject_code}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  Section {off.section_name}
                </span>
              </div>

              <h3 className="font-bold text-sm mt-2">{off.subject_name}</h3>

              <div className={`mt-3 pt-2 border-t text-[11px] flex items-center justify-between ${
                isSelected ? 'border-white/20 text-indigo-100' : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                <span>{off.component_type || 'THEORY'}</span>
                <span className="flex items-center gap-1 font-bold">
                  <Users className="w-3.5 h-3.5" />
                  {off.current_students} / {off.max_students} Enrolled
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Offering Roster */}
      {selectedOffering && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-500" />
                <span>Enrolled Student Roster — {selectedOffering.subject_name} (Section {selectedOffering.section_name})</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Total Enrolled: {enrolledStudents.length} Students
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-60">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <button
                onClick={handleExportRosterCSV}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoadingStudents ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">Loading student roster...</td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">No enrolled students found.</td>
                  </tr>
                ) : (
                  filteredStudents.map((st: any) => (
                    <tr key={st.student_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{st.roll_number}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{st.name}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{st.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                          {st.registration_category || 'REGULAR'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                          {st.enrollment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
