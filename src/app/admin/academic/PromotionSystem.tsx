import { useState } from "react";
import { Users, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, Btn, Badge, PBar } from "../../App";

export function PromotionSystem() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handlePromote = () => {
    setLoading(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 20;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setLoading(false);
        setStep(3);
      }
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Batch Promotion System</h2>
        <p className="text-sm text-slate-500 mt-2">Promote students to the next academic year or semester.</p>
      </div>

      <div className="flex justify-between items-center mb-8 relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 -z-10 -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-0 h-1 bg-blue-500 -z-10 -translate-y-1/2 transition-all duration-500" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
        
        {[
          { num: 1, label: "Select Criteria" },
          { num: 2, label: "Verify Students" },
          { num: 3, label: "Complete" }
        ].map(s => (
          <div key={s.num} className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-950 px-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s.num ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
              {s.num}
            </div>
            <span className={`text-xs font-medium ${step >= s.num ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">From <ArrowRight size={16} /></h3>
              <div className="space-y-3">
                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Current Academic Session: 2024-2025</option>
                </select>
                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>B.Tech - Computer Science</option>
                </select>
                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Year 1 - Semester 2</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">Promote To <CheckCircle size={16} /></h3>
              <div className="space-y-3">
                <select className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-700 dark:text-blue-400">
                  <option>Next Academic Session: 2025-2026</option>
                </select>
                <div className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed">
                  B.Tech - Computer Science (Auto)
                </div>
                <select className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-700 dark:text-blue-400">
                  <option>Year 2 - Semester 3</option>
                </select>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Btn variant="primary" onClick={() => setStep(2)}>Review Students <ArrowRight size={16} className="ml-2" /></Btn>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-800 dark:text-amber-400">
            <AlertTriangle size={24} className="flex-shrink-0" />
            <div>
              <h4 className="font-semibold">Review before promoting</h4>
              <p className="text-sm mt-1 opacity-90">120 students will be promoted to <strong>Year 2, Semester 3</strong>. This action will automatically generate their curriculum map and update their portal access.</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium">Processing promotions...</p>
              <div className="w-64"><PBar value={progress} /></div>
            </div>
          ) : (
            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <Btn variant="outline" onClick={() => setStep(1)}>Back</Btn>
              <Btn variant="primary" onClick={handlePromote}>Confirm & Promote 120 Students</Btn>
            </div>
          )}
        </Card>
      )}

      {step === 3 && (
        <Card className="p-10 text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 mx-auto rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Promotion Successful!</h2>
          <p className="text-slate-500 max-w-md mx-auto">120 students have been successfully promoted. Their academic records, curriculum, and dashboards have been updated.</p>
          <div className="pt-6">
            <Btn variant="primary" onClick={() => setStep(1)}>Promote Another Batch</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
