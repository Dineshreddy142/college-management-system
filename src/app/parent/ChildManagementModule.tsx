import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { Card, Badge, Avatar, cn } from "../App";

export function ChildManagementModule() {
  const [activeChild, setActiveChild] = useState(1);

  const children = [
    {
      id: 1,
      name: "Arjun Sharma",
      roll: "CS2021001",
      course: "B.Tech Computer Science",
      semester: "Semester 6",
      section: "A",
      mentor: "Prof. D. Joshi",
      cgpa: 9.2,
      attendance: 88.4,
      status: "Active",
      lastAttendance: "Today 08:30 AM"
    },
    {
      id: 2,
      name: "Riya Sharma",
      roll: "ME2022045",
      course: "B.Tech Mechanical Engineering",
      semester: "Semester 4",
      section: "B",
      mentor: "Dr. K. Mehta",
      cgpa: 8.7,
      attendance: 92.1,
      status: "Active",
      lastAttendance: "Yesterday"
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Children</h2>
          <p className="text-sm text-slate-500">Manage and switch between your linked children's profiles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {children.map(child => (
          <Card 
            key={child.id} 
            className={cn(
              "p-5 cursor-pointer transition-all border-2",
              activeChild === child.id 
                ? "border-emerald-500 shadow-md bg-emerald-50/10 dark:bg-emerald-900/10" 
                : "border-transparent hover:border-slate-300 dark:hover:border-slate-600"
            )}
            hover
            onClick={() => setActiveChild(child.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <Avatar name={child.name} size="lg" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {child.name}
                    {activeChild === child.id && <CheckCircle size={16} className="text-emerald-500" />}
                  </h3>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">{child.roll}</p>
                </div>
              </div>
              <Badge variant="success">{child.status}</Badge>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Course</p>
                  <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{child.course}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Semester & Section</p>
                  <p className="font-medium text-slate-700 dark:text-slate-300">{child.semester} - Sec {child.section}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Last Attendance</p>
                  <p className="font-medium text-slate-900 dark:text-white text-xs">{child.lastAttendance}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Mentor</p>
                  <p className="font-medium text-slate-900 dark:text-white text-xs">{child.mentor}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 text-xs">CGPA: <strong className="text-slate-900 dark:text-white">{child.cgpa}</strong></span>
              <span className="text-slate-500 text-xs">Attendance: <strong className="text-emerald-600">{child.attendance}%</strong></span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
