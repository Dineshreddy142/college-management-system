import React from "react";
import { CampusLocation } from "../types";
import {
  X, ShieldAlert, PhoneCall, HeartPulse, Flame, MapPin,
  AlertTriangle, CheckCircle, Navigation, ArrowRight
} from "lucide-react";

interface EmergencyPanelProps {
  locations: CampusLocation[];
  onClose: () => void;
  onSelectLocation: (loc: CampusLocation) => void;
}

export const EmergencyPanel: React.FC<EmergencyPanelProps> = ({
  locations,
  onClose,
  onSelectLocation,
}) => {
  const emergencyLocations = locations.filter(
    (l) => l.category === "Emergency Services" || l.category === "Health & Medical"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-red-500 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Urgent Alert Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-red-600 flex items-center justify-center font-black text-xl shadow-lg shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-black text-lg sm:text-xl tracking-tight leading-tight">
                CAMPUS EMERGENCY DISPATCH & SAFETY
              </h2>
              <p className="text-xs text-red-100 font-medium">
                Immediate 24/7 Security, Medical Assistance & Evacuation Points
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rapid Call Action Buttons */}
        <div className="p-4 sm:p-6 bg-red-50 dark:bg-red-950/40 border-b border-red-100 dark:border-red-900/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="tel:+914427419999"
            className="p-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex items-center gap-3 shadow-lg shadow-red-600/30 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-red-100 uppercase tracking-wider block">
                24/7 Security Command Desk
              </span>
              <span className="text-base font-black tracking-wide">+91 (044) 2741-9999</span>
            </div>
          </a>

          <a
            href="tel:+914427417911"
            className="p-4 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white flex items-center gap-3 shadow-lg shadow-rose-700/30 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-rose-100 uppercase tracking-wider block">
                24/7 Medical & Ambulance Triage
              </span>
              <span className="text-base font-black tracking-wide">+91 (044) 2741-7911</span>
            </div>
          </a>
        </div>

        {/* Emergency Locations Roster */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Emergency Response Centers on Campus
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {emergencyLocations.map((loc) => (
              <div
                key={loc.id}
                onClick={() => {
                  onClose();
                  onSelectLocation(loc);
                }}
                className="p-3.5 rounded-2xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-800 hover:border-red-500 cursor-pointer shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                      {loc.buildingCode}
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      24/7 Standby
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {loc.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {loc.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  <span>Locate on Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>

          {/* Emergency Safety Protocol Summary */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Campus Evacuation Instructions:</span>
            </h4>
            <ul className="space-y-1 text-[11px]">
              <li>• In case of fire or tremor, <strong>do not use elevators</strong>. Use emergency exit stairs.</li>
              <li>• Walk swiftly to the nearest open assembly area: <strong>Central Quadrangle Lawn (Assembly Area Alpha)</strong>.</li>
              <li>• Follow designated faculty and student safety warden instructions.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
