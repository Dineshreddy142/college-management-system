import { useState, useEffect } from "react";
import { Users, Search, Download, Mail, Phone, BookOpen, GraduationCap } from "lucide-react";
import { Card, Badge, Btn, Avatar } from "../App";
import client from "../../api/client";

interface StudentItem {
  id: number;
  roll_number: string;
  name: string;
  email: string;
  department_name?: string;
  semester?: number;
  phone?: string;
}

export function StudentsModule() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/student')
      .then(res => {
        const raw = res.data?.data || res.data || [];
        const mapped = raw.map((s: any) => ({
          id: s.id,
          roll_number: s.admission_number || s.roll_number || `STU${s.id}`,
          name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || s.username || 'Student',
          email: s.email || 'N/A',
          department_name: s.department_name || s.department || 'General',
          semester: s.semester || 1,
          phone: s.phone || 'N/A'
        }));
        setStudents(mapped);
      })
      .catch(err => {
        console.error("Failed to fetch students roster", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.department_name && s.department_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExportCSV = () => {
    const headers = ["Roll Number", "Name", "Department", "Semester", "Email", "Phone"];
    const rows = filtered.map(s => [
      `"${s.roll_number}"`,
      `"${s.name}"`,
      `"${s.department_name}"`,
      s.semester,
      `"${s.email}"`,
      `"${s.phone}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_roster.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
            Student Management
          </h2>
          <p className="text-sm text-slate-500">View live profiles and progress of enrolled students.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or roll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Btn variant="primary" icon={<Download size={14} />} onClick={handleExportCSV}>Export List</Btn>
        </div>
      </div>

      <Card className="p-5">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Loading student roster from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No enrolled students match your search filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(student => (
              <div 
                key={student.id} 
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={student.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">{student.name}</h4>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">{student.roll_number}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="info" size="sm">{student.department_name}</Badge>
                      <Badge variant="default" size="sm">Sem {student.semester}</Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </div>
                  {student.phone && student.phone !== 'N/A' && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400 flex-shrink-0" />
                      <span>{student.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
