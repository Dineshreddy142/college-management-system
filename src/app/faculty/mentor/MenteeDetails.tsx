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
          <p className="text-sm text-slate-500">Mentee Overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-1 border-t-4 border-t-indigo-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-bl-full -mr-10 -mt-10" />
          
          <div className="flex flex-col items-center text-center mt-4">
            <Avatar name="Student" size="xl" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">Student Profile</h3>
            <p className="text-sm text-slate-500">Mentee Record</p>
            
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              <Badge variant="info" size="sm">Active Mentee</Badge>
            </div>
            
            <div className="w-full mt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Mail size={16} /> student@college.edu
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Phone size={16} /> Contact Available
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
              <p className="text-sm text-slate-600 dark:text-slate-400 pl-9">No risk patterns identified for this student profile.</p>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Current CGPA" value="0.0" subtitle="Cumulative CGPA" color="blue" icon={<BarChart3 size={19} />} />
            <StatCard title="Attendance" value="0%" subtitle="Current session" color="amber" icon={<Clock size={19} />} />
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
              <p className="text-xs text-slate-500 mb-4">Based on academic standing.</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Eligibility</span>
                  <Badge variant="info" size="sm">Pending Evaluation</Badge>
                </div>
              </div>
            </Card>
            
            <Card className="p-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Pending Actions</h3>
              <p className="text-xs text-slate-400">No pending action items for this student.</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
