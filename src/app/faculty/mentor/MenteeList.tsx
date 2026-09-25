import { useState, useEffect } from "react";
import client from "../../../api/client";
import { Search, Filter, Mail, Phone, ChevronRight, User, MoreVertical } from "lucide-react";
import { Card, Badge, Avatar, Btn } from "../../App";

export function MenteeList({ onSelect }: { onSelect?: (id: number) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [mentees, setMentees] = useState<any[]>([]);

  useEffect(() => {
    client.get('/students').then(res => {
      const list = (res.data || []).map((s: any) => ({
        id: s.id,
        name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || 'Student',
        roll: s.admission_number || `STU${s.id}`,
        year: s.semester ? Math.ceil(s.semester / 2) : 1,
        dept: s.department_name || "Computer Science",
        cgpa: s.cgpa ? parseFloat(s.cgpa) : 0,
        attendance: 0,
        status: "safe",
        phone: s.phone || "N/A"
      }));
      setMentees(list);
    }).catch(console.error);
  }, []);

  const filteredMentees = mentees.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.roll.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Mentee Directory</h2>
          <p className="text-sm text-slate-500">View and manage all students assigned to you.</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
          <div className="relative w-full sm:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or roll number..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="all">All Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
            <Btn variant="outline" icon={<Filter size={14} />}>Filters</Btn>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredMentees.length === 0 ? (
            <p className="text-xs text-slate-400 p-8 text-center">No assigned mentees found.</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Student</th>
                  <th className="px-5 py-4 font-medium">Academic Info</th>
                  <th className="px-5 py-4 font-medium">Performance</th>
                  <th className="px-5 py-4 font-medium">Contact</th>
                  <th className="px-5 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMentees.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} size="md" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{m.name}</p>
                          <p className="text-xs text-slate-500">{m.roll}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-900 dark:text-slate-300">Year {m.year}</p>
                      <p className="text-xs text-slate-500">{m.dept}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 mb-1">
                        <Badge variant={m.cgpa >= 8 ? "success" : m.cgpa >= 6 ? "info" : "error"} size="sm">CGPA: {m.cgpa}</Badge>
                        <Badge variant={m.attendance >= 75 ? "success" : "error"} size="sm">{m.attendance}%</Badge>
                      </div>
                      {m.status === 'risk' && <span className="text-[10px] text-red-500 font-medium">Academic Risk Detected</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500 rounded-lg transition-colors"><Mail size={14} /></button>
                        <button className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-green-500 rounded-lg transition-colors"><Phone size={14} /></button>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Btn variant="outline" size="sm" onClick={() => onSelect?.(m.id)}>View Profile</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
