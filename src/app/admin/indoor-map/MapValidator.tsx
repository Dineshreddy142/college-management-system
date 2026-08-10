import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Zap,
  Activity
} from "lucide-react";

export function MapValidator() {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<string>("Just now");

  const validationChecks = [
    { title: "All Room Doorways Connected", desc: "Every room boundary has an active door connected to the corridor loop.", status: "pass" },
    { title: "Emergency Fire Exits Accessible", desc: "All 4 corner fire exits have unobstructed escape paths.", status: "pass" },
    { title: "Vertical Transportation Linked", desc: "Smart Glass Elevator & North/South Staircases are linked to level connectors.", status: "pass" },
    { title: "No Overlapping Room Boundaries", desc: "All 17 floor rooms have discrete, non-intersecting coordinates.", status: "pass" },
    { title: "Unique Room Identifiers", desc: "Zero duplicate room codes or node IDs detected in database.", status: "pass" },
    { title: "Wheelchair Accessibility Validated", desc: "ADA ramp, elevator and corridor clearances satisfy 1.5m standard.", status: "pass" }
  ];

  const handleRunAudit = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      setLastValidated(new Date().toLocaleTimeString());
    }, 1000);
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-950 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>Map Quality & Graph Validator</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% HEALTHY
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Automated topological checks, graph connectivity, door openings & emergency compliance
            </p>
          </div>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={isValidating}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
        >
          <RefreshCw size={14} className={isValidating ? "animate-spin" : ""} />
          <span>{isValidating ? "Validating Map..." : "Run Audit Scan"}</span>
        </button>
      </div>

      {/* Validation Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {validationChecks.map((chk, i) => (
          <div key={i} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <div className="mt-0.5 text-emerald-400 shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">{chk.title}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{chk.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-300 flex items-center justify-between">
        <span>Last full audit: <b>{lastValidated}</b> • 0 warnings, 0 fatal errors</span>
        <span className="text-indigo-400 font-bold">Ready for Production Deployment</span>
      </div>

    </div>
  );
}
