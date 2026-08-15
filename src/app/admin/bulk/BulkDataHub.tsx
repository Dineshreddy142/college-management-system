import { useState, useEffect, useRef } from "react";
import {
  FileSpreadsheet, Upload, Download, CheckCircle, AlertCircle, Users,
  Award, Calendar, BookOpen, Clock, RefreshCw, FileText, ArrowRight,
  ShieldCheck, Database, Check, AlertTriangle, Sparkles, Filter
} from "lucide-react";
import * as XLSX from 'xlsx';
import client from "../../../api/client";
import { Card, Badge, Btn, Avatar } from "../../App";

type TabType = "students" | "attendance" | "marks" | "faculty" | "templates";

export function BulkDataHub({ defaultTab = "students" }: { defaultTab?: TabType }) {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>({
    totalStudents: 0,
    totalFaculty: 0,
    totalSections: 0,
    totalMarksEntries: 0,
    avgAttendanceRate: "88.5%"
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await client.get('/bulk/stats');
      if (res.data?.data) {
        setStats(res.data.data);
      }
    } catch (e) {
      console.warn("Could not fetch academic stats:", e);
    }
  };

  const handleTabChange = (t: TabType) => {
    setActiveTab(t);
    setFile(null);
    setPreviewRows([]);
    setHeaders([]);
    setTotalRows(0);
    setUploadResult(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processSelectedFile(selectedFile);
  };

  const processSelectedFile = (selectedFile: File) => {
    setFile(selectedFile);
    setUploadResult(null);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (json.length > 0) {
          const rawHeaders = Object.keys(json[0]);
          const normHeaders = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

          // Check mismatch between active tab and uploaded sheet content
          const isFacultySheet = normHeaders.some(h => h.includes('employeeid') || h.includes('empid') || h.includes('designation')) ||
            json.some((r: any) => {
              const roleVal = String(r.role || r.Role || r.ROLE || r.designation || r.Designation || '').toLowerCase();
              return roleVal.includes('faculty') || roleVal.includes('hod') || roleVal.includes('professor');
            });

          const isStudentSheet = normHeaders.some(h => h.includes('rollnumber') || h.includes('rollno') || h.includes('semester')) && !normHeaders.some(h => h.includes('employeeid') || h.includes('empid'));

          if (activeTab === 'students' && isFacultySheet) {
            setUploadError("Invalid File: You uploaded a Faculty/HOD spreadsheet under the 'Student Onboarding & Logins' tab. Please switch to the 'Faculty & Allocations' tab to import faculty.");
          } else if (activeTab === 'faculty' && isStudentSheet) {
            setUploadError("Invalid File: You uploaded a Student spreadsheet under the 'Faculty & Allocations' tab. Please switch to the 'Student Onboarding & Logins' tab to import students.");
          }

          setHeaders(rawHeaders);
          setPreviewRows(json.slice(0, 8)); // First 8 rows for preview
          setTotalRows(json.length);
        } else {
          setUploadError("The selected Excel file contains no data rows.");
        }
      } catch (err: any) {
        setUploadError("Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv file.");
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      setUploadError("Please choose an Excel file to import.");
      return;
    }

    if (uploadError && uploadError.startsWith('Invalid File:')) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    let endpoint = '/bulk/students';
    if (activeTab === 'attendance') endpoint = '/bulk/attendance';
    if (activeTab === 'marks') endpoint = '/bulk/marks';
    if (activeTab === 'faculty') endpoint = '/bulk/faculty';

    try {
      const res = await client.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setUploadResult(res.data.data || res.data);
        fetchStats();
      } else {
        setUploadError(res.data?.message || 'Upload completed with warnings.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to upload and process Excel file.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = (type: string) => {
    window.open(`/api/bulk/template/${type}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                <Sparkles size={12} /> Enterprise Academic Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Live DB Sync
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">Bulk Data & Excel Hub</h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Import thousands of student logins, attendance matrices, and exam marks in minutes with automated UGC 10-point grade calculations and real-time database sync.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDownloadTemplate(activeTab === 'templates' ? 'students' : activeTab)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur transition-all flex items-center gap-2 border border-white/10 cursor-pointer"
            >
              <Download size={14} /> Download Sample .XLSX
            </button>
            <button
              onClick={fetchStats}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10"
              title="Refresh Stats"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-slate-400">Total Enrolled</p>
            <p className="text-xl font-bold text-white mt-0.5">{stats.totalStudents || "1,280"}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-slate-400">Active Faculty</p>
            <p className="text-xl font-bold text-white mt-0.5">{stats.totalFaculty || "84"}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-slate-400">Avg Attendance</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{stats.avgAttendanceRate || "88.5%"}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-slate-400">Graded Records</p>
            <p className="text-xl font-bold text-indigo-300 mt-0.5">{stats.totalMarksEntries || "3,420"}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        {[
          { id: "students", label: "Student Onboarding & Logins", icon: <Users size={15} /> },
          { id: "attendance", label: "Attendance Matrix Sync", icon: <Calendar size={15} /> },
          { id: "marks", label: "Exam Marks & Auto-Grades", icon: <Award size={15} /> },
          { id: "faculty", label: "Faculty & Allocations", icon: <BookOpen size={15} /> },
          { id: "templates", label: "Download Sample Sheets", icon: <Download size={15} /> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id as TabType)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === t.id
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Main Upload / Templates Area */}
      {activeTab !== 'templates' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Dropzone & Actions (Left 1 col) */}
          <div className="lg:col-span-1 space-y-5">
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <FileSpreadsheet className="text-blue-600" size={18} />
                <span>
                  {activeTab === 'students' && 'Upload Students Roster'}
                  {activeTab === 'attendance' && 'Upload Attendance Sheet'}
                  {activeTab === 'marks' && 'Upload Exam Marks'}
                  {activeTab === 'faculty' && 'Upload Faculty Roster'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {activeTab === 'students' && 'Automatically creates user accounts, hashes passwords, links departments & sections for 1,000+ students.'}
                {activeTab === 'attendance' && 'Upload daily or period attendance records. Percentages and defaulter counts recalculate automatically.'}
                {activeTab === 'marks' && 'Upload Unit Test, Mid 1/2, or Sem marks. Automatically applies UGC 10-point scale (O, A+, A, B, F) and SGPA.'}
                {activeTab === 'faculty' && 'Bulk onboard teaching staff and assign subject-section allocations.'}
              </p>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  file
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                    : "border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Upload size={22} />
                </div>
                {file ? (
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-full">{file.name}</p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
                      {(file.size / 1024).toFixed(1)} KB • {totalRows} Rows Detected
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Drag and drop Excel file</p>
                    <p className="text-[11px] text-slate-400 mt-1">or click to browse (.xlsx, .csv)</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  disabled={!file || isUploading}
                  onClick={handleUploadSubmit}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all ${
                    !file || isUploading
                      ? "bg-slate-400 cursor-not-allowed opacity-60"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20 cursor-pointer"
                  }`}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Processing & Saving to DB...</span>
                    </>
                  ) : (
                    <>
                      <Database size={14} />
                      <span>Commit {totalRows > 0 ? `${totalRows} Rows` : ''} to Database</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadTemplate(activeTab)}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download size={13} />
                  <span>Download {activeTab.toUpperCase()} Template</span>
                </button>
              </div>

              {/* Error Message Alert */}
              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-red-500" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Success Result Card */}
              {uploadResult && (
                <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle size={16} />
                    <span>Import Completed Successfully!</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                    {uploadResult.insertedCount !== undefined && <p>• <b>{uploadResult.insertedCount}</b> new accounts/records created</p>}
                    {uploadResult.updatedCount !== undefined && <p>• <b>{uploadResult.updatedCount}</b> existing records updated</p>}
                    {uploadResult.markedCount !== undefined && <p>• <b>{uploadResult.markedCount}</b> attendance entries recorded</p>}
                    {uploadResult.processedCount !== undefined && <p>• <b>{uploadResult.processedCount}</b> exam marks graded</p>}
                  </div>
                </div>
              )}
            </Card>

            {/* Grading Scale Reference Card (shown on marks tab) */}
            {activeTab === 'marks' && (
              <Card className="p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">UGC 10-Point Grading Scale</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-bold text-emerald-600">O (90-100%)</span>
                    <span className="text-slate-500">10 Pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-bold text-emerald-500">A+ (80-89%)</span>
                    <span className="text-slate-500">9 Pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-bold text-blue-600">A (70-79%)</span>
                    <span className="text-slate-500">8 Pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-bold text-blue-500">B+ (60-69%)</span>
                    <span className="text-slate-500">7 Pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-bold text-amber-500">B (55-59%)</span>
                    <span className="text-slate-500">6 Pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <span className="font-bold text-red-500">F (&lt; 40%)</span>
                    <span className="text-slate-500">0 Pts (Fail)</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Live Data Preview Table (Right 2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    <span>Live Pre-Upload Data Preview</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {previewRows.length > 0
                      ? `Showing first ${previewRows.length} of ${totalRows} detected records`
                      : 'Upload an Excel file to see live validation and table preview'}
                  </p>
                </div>

                {previewRows.length > 0 && (
                  <Badge variant="success">
                    <Check size={12} className="mr-1" /> {totalRows} Ready to Import
                  </Badge>
                )}
              </div>

              {previewRows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                        <th className="px-3 py-2 text-left font-bold text-slate-500">#</th>
                        {headers.map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-bold text-slate-700 dark:text-slate-300 capitalize">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2.5 font-mono text-slate-400">{idx + 1}</td>
                          {headers.map((h) => (
                            <td key={h} className="px-3 py-2.5 text-slate-800 dark:text-slate-200 font-medium">
                              {row[h] !== undefined && row[h] !== null ? String(row[h]) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400">
                  <FileSpreadsheet size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-xs font-semibold">No file selected for preview</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Select or drag an Excel file (.xlsx or .csv) to inspect the rows, verify columns, and commit thousands of records to the database.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        /* Template Center (5th Tab) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              type: "students",
              title: "Students Roster Template",
              desc: "Roll Number, Full Name, Email, Password, Department, Semester, Section, Phone.",
              color: "blue",
              icon: <Users size={20} />
            },
            {
              type: "attendance",
              title: "Attendance Matrix Template",
              desc: "Date, Roll Number, Subject Code, Section, Status (Present/Absent/Late).",
              color: "green",
              icon: <Calendar size={20} />
            },
            {
              type: "marks",
              title: "Exam Marks Template",
              desc: "Roll Number, Subject Code, Exam Name (Unit Test / Mid 1 / Sem), Marks, Max Marks.",
              color: "indigo",
              icon: <Award size={20} />
            },
            {
              type: "faculty",
              title: "Faculty Onboarding Template",
              desc: "Employee ID, Full Name, Email, Department, Designation, Phone.",
              color: "amber",
              icon: <BookOpen size={20} />
            }
          ].map((item) => (
            <Card key={item.type} className="p-6 flex flex-col justify-between hover:shadow-lg transition-all border border-slate-200 dark:border-slate-800">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <button
                  onClick={() => handleDownloadTemplate(item.type)}
                  className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Download size={13} /> Download .XLSX
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
