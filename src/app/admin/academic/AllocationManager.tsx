import { useState, useEffect } from "react";
import { Search, Filter, Plus, Edit, Trash2, CheckCircle, Upload, Download, AlertCircle, Clock } from "lucide-react";
import { Card, Badge, Btn, Avatar, cn } from "../../App";

export function AllocationManager() {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("all");
  const [semester, setSemester] = useState("all");

  useEffect(() => {
    // In a real app, fetch from /api/academic/allocations
    setAllocations([
      { id: 1, subject: "Data Structures", code: "CS301", dept: "Computer Science", sem: "Sem 3", section: "A", faculty: "Dr. Ramesh Gupta", hours: 4, status: "Active" },
      { id: 2, subject: "Data Structures", code: "CS301", dept: "Computer Science", sem: "Sem 3", section: "B", faculty: "Prof. Priya Patel", hours: 4, status: "Active" },
      { id: 3, subject: "Operating Systems", code: "CS302", dept: "Computer Science", sem: "Sem 3", section: "A", faculty: "Dr. Ramesh Gupta", hours: 4, status: "Active" },
      { id: 4, subject: "Database Systems", code: "CS303", dept: "Computer Science", sem: "Sem 3", section: "A", faculty: "Prof. Anil Kumar", hours: 4, status: "Active" },
      { id: 5, subject: "Java Programming Lab", code: "CS304", dept: "Computer Science", sem: "Sem 3", section: "A", faculty: "Prof. Priya Patel", hours: 2, status: "Pending Approval" },
    ]);
  }, []);

  const handleApprove = (id: number) => {
    setAllocations(prev => prev.map(a => a.id === id ? { ...a, status: 'Active' } : a));
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to remove this allocation?")) {
      setAllocations(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleEdit = (id: number) => {
    alert(`Opening edit dialog for allocation ID: ${id}`);
  };

  const handleBulkAllocateClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        alert(`Successfully parsed ${file.name}. 45 allocations updated!`);
        
        const mockFaculties = ["Dr. Ramesh Gupta", "Prof. Priya Patel", "Prof. Anil Kumar", "Dr. Kavya Pillai", "Prof. Deepak Joshi", "Dr. Sunita Sharma", "Prof. Arun Mishra", "Dr. Vikram Singh", "Prof. Meera Iyer", "Dr. Rahul Verma"];
        const subjects = ["Data Structures", "Operating Systems", "Database Systems", "Computer Networks", "Software Engineering", "Machine Learning", "Artificial Intelligence", "Web Development", "Compiler Design", "Theory of Computation"];
        
        const newAllocations: any[] = [];
        let idCounter = 1001;
        
        for (let i = 0; i < subjects.length; i++) {
          for (let semOffset = 0; semOffset < 2; semOffset++) {
            for (let secOffset = 0; secOffset < 3; secOffset++) {
              const sem = `Sem ${3 + semOffset}`;
              const section = String.fromCharCode(65 + secOffset);
              const subject = subjects[i];
              const faculty = mockFaculties[(i + semOffset + secOffset) % mockFaculties.length];
              
              newAllocations.push({
                id: idCounter++,
                subject,
                code: `CS${300 + i}`,
                dept: "Computer Science",
                sem,
                section,
                faculty,
                hours: 3 + (idCounter % 2),
                status: idCounter % 5 === 0 ? "Pending Approval" : "Active"
              });
              
              if (newAllocations.length >= 45) break;
            }
            if (newAllocations.length >= 45) break;
          }
          if (newAllocations.length >= 45) break;
        }

        setAllocations(prev => {
          if (prev.some(a => a.id > 1000)) return prev; // Prevent duplicate additions
          
          const filteredNew = newAllocations.filter(na => 
            !prev.some(pa => pa.subject === na.subject && pa.sem === na.sem && pa.section === na.section)
          );
          
          return [...prev, ...filteredNew];
        });
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Subject Allocation</h2>
          <p className="text-sm text-slate-500">Assign faculty to subjects across different sections and semesters.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="outline" size="sm" icon={<Upload size={16} />} onClick={handleBulkAllocateClick}>Bulk Allocate</Btn>
          <Btn variant="primary" size="sm" icon={<Plus size={16} />}>New Allocation</Btn>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-900/20">
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search subject or faculty..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <select 
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical Eng">Mechanical Eng</option>
              <option value="Civil Eng">Civil Eng</option>
            </select>
            <select 
              value={semester}
              onChange={e => setSemester(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Semesters</option>
              <option value="Sem 3">Semester 3</option>
              <option value="Sem 4">Semester 4</option>
            </select>
            <Btn variant="outline" icon={<Filter size={14} />}>Filters</Btn>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
              <tr>
                <th className="px-5 py-4">Subject & Details</th>
                <th className="px-5 py-4">Section / Sem</th>
                <th className="px-5 py-4">Allocated Faculty</th>
                <th className="px-5 py-4">Weekly Hrs</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allocations.filter(a => {
                const matchesSearch = a.subject.toLowerCase().includes(searchTerm.toLowerCase()) || a.faculty.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesDept = department === "all" || a.dept === department;
                const matchesSem = semester === "all" || a.sem === semester;
                return matchesSearch && matchesDept && matchesSem;
              }).map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900 dark:text-white">{a.subject}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{a.code} • {a.dept}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="info" size="sm">Sec {a.section}</Badge>
                      <span className="text-xs text-slate-500">{a.sem}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={a.faculty} size="sm" />
                      <span className="font-medium text-slate-900 dark:text-slate-300">{a.faculty}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Clock size={14} /> {a.hours} hrs
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {a.status === 'Active' ? 
                      <Badge variant="success" size="sm">Allocated</Badge> : 
                      <Badge variant="warning" size="sm">Pending Approval</Badge>
                    }
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {a.status === 'Pending Approval' && <button onClick={() => handleApprove(a.id)} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-green-500 rounded-lg transition-colors" title="Approve"><CheckCircle size={15} /></button>}
                      <button onClick={() => handleEdit(a.id)} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500 rounded-lg transition-colors" title="Change Faculty"><Edit size={15} /></button>
                      <button onClick={() => handleDelete(a.id)} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 rounded-lg transition-colors" title="Remove Allocation"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
