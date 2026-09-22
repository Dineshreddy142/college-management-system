import { useState } from "react";
import { User, Mail, Phone, MapPin, Briefcase, Download, ArrowLeft, BrainCircuit, BarChart3, Clock } from "lucide-react";
import { Card, Badge, Avatar, Btn, StatCard } from "../../App";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function MenteeDetails({ onBack }: { onBack?: () => void }) {
  const [showAI, setShowAI] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {onBack && (
          <button onClick={onBack} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Student Details</h2>
          <p className="text-sm text-slate-500">Comprehensive overview of Priya Patel</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-1 border-t-4 border-t-indigo-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-bl-full -mr-10 -mt-10" />
          
          <div className="flex flex-col items-center text-center mt-4">
            <Avatar name="Priya Patel" size="xl" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">Priya Patel</h3>
            <p className="text-sm text-slate-500">CS2021045 • Semester 6</p>
            
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              <Badge variant="error" size="sm">Academic Risk</Badge>
              <Badge variant="warning" size="sm">Low Attendance</Badge>
            </div>
            
            <div className="w-full mt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Mail size={16} /> priya.p@student.edu
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Phone size={16} /> +91 87654 32109
              </div>
              <div className="flex flex-col text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-3 mb-1"><MapPin size={16} /> Parent Contact</div>
                <span className="ml-7 text-xs">Mr. Patel (+91 99988 77766)</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
            <Btn variant="outline" size="sm" icon={<Download size={14} />} className="w-full justify-center">Report</Btn>
            <Btn variant="primary" size="sm" onClick={() => setShowAI(true)} icon={<BrainCircuit size={14} />} className="w-full justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 hover:from-purple-700 hover:to-indigo-700">AI Analyze</Btn>
          </div>
        </Card>

        <div className="md:col-span-2 space-y-6">
          {showAI && (
            <Card className="p-5 border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-900/10 shadow-inner">
              <div className="flex gap-3 mb-3">
                <BrainCircuit className="text-purple-600" />
                <h3 className="font-semibold text-purple-900 dark:text-purple-300">AI Risk Analysis & Recommendations</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc pl-9">
                <li><strong>Observation:</strong> Steady decline in CGPA from 7.5 (Sem 3) to 5.8 (Sem 5).</li>
                <li><strong>Correlation:</strong> High absence in Operating Systems and Data Structures correlates with low marks.</li>
                <li><strong>Action:</strong> Schedule a parent meeting to discuss attendance. Recommend remedial classes for Data Structures.</li>
              </ul>
              <div className="mt-4 pl-9">
                <Btn variant="primary" size="sm">Schedule Meeting Now</Btn>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Current CGPA" value="N/A" subtitle="Cumulative CGPA" color="blue" icon={<BarChart3 size={19} />} />
            <StatCard title="Attendance" value="N/A" subtitle="Current session" color="amber" icon={<Clock size={19} />} />
          </div>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Academic Progress</h3>
            <p className="text-xs text-slate-400 py-8 text-center">No academic progress records available.</p>
          </Card>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Briefcase size={16} className="text-indigo-500" /> Placement Readiness
              </h3>
              <p className="text-xs text-slate-500 mb-4">Based on current academic standing.</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Super Dream</span>
                  <Badge variant="error" size="sm">Not Eligible</Badge>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Dream</span>
                  <Badge variant="error" size="sm">Not Eligible</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Mass</span>
                  <Badge variant="warning" size="sm">At Risk</Badge>
                </div>
              </div>
            </Card>
            
            <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-100 dark:border-amber-900/30">
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-500 mb-3">Pending Actions</h3>
              <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200/80">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Library fee pending: ₹150</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 2 internal assignments due</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> No mentor interaction in 30 days</li>
              </ul>
              <Btn variant="primary" size="sm" className="mt-4 bg-amber-500 hover:bg-amber-600 text-white border-0 w-full justify-center">Resolve Now</Btn>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
