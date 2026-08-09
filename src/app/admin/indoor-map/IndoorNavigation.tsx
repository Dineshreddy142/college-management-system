import { useState } from "react";
import { Card, Btn, Badge } from "../../App";
import { MapPin, Navigation, Clock, Activity } from "lucide-react";

export default function IndoorNavigation() {
  const [startPoint, setStartPoint] = useState("");
  const [endPoint, setEndPoint] = useState("");
  const [pathGenerated, setPathGenerated] = useState(false);

  const handleGeneratePath = () => {
    if (startPoint && endPoint) {
      setPathGenerated(true);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-180px)]">
      {/* Sidebar Controls */}
      <Card className="w-full md:w-80 p-5 flex flex-col gap-6 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Navigation</h2>
          <p className="text-sm text-slate-500">Find the shortest path between any two rooms or waypoints.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start Location</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              <select 
                value={startPoint}
                onChange={e => { setStartPoint(e.target.value); setPathGenerated(false); }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select current room...</option>
                <option value="ent">Main Entrance</option>
                <option value="g01">CS First Year (G-01)</option>
                <option value="lib">Library (1-02)</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Destination</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
              <select 
                value={endPoint}
                onChange={e => { setEndPoint(e.target.value); setPathGenerated(false); }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select destination...</option>
                <option value="ent">Main Entrance</option>
                <option value="g01">CS First Year (G-01)</option>
                <option value="lib">Library (1-02)</option>
              </select>
            </div>
          </div>

          <Btn onClick={handleGeneratePath} className="w-full justify-center" icon={<Navigation size={16} />}>
            Generate Shortest Path
          </Btn>
        </div>

        {pathGenerated && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="font-semibold text-sm uppercase text-slate-500">Route Summary</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="text-slate-500 mb-1 flex items-center gap-1.5 text-xs"><Activity size={14}/> Distance</div>
                <div className="font-semibold text-lg">145m</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="text-slate-500 mb-1 flex items-center gap-1.5 text-xs"><Clock size={14}/> Est. Time</div>
                <div className="font-semibold text-lg">2 min</div>
              </div>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 p-3 rounded-xl text-sm border border-indigo-100 dark:border-indigo-800/50">
              <p className="font-medium mb-1">Directions:</p>
              <ol className="list-decimal pl-4 space-y-1 text-xs">
                <li>Head straight down Corridor A</li>
                <li>Turn left at the stairs</li>
                <li>Go up to First Floor</li>
                <li>Destination is on your right</li>
              </ol>
            </div>
          </div>
        )}
      </Card>

      {/* Map Preview Area */}
      <Card className="flex-1 relative overflow-hidden bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
        {pathGenerated ? (
          <div className="absolute inset-0 p-8 flex items-center justify-center">
             {/* Mock SVG Map for preview */}
             <svg width="100%" height="100%" viewBox="0 0 800 600" className="opacity-80">
                <rect x="100" y="100" width="600" height="400" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-300 dark:text-slate-600" />
                <rect x="100" y="100" width="200" height="150" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 dark:text-slate-500" />
                <rect x="500" y="350" width="200" height="150" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 dark:text-slate-500" />
                
                {/* Highlighted Path */}
                <path d="M 200 175 L 200 300 L 600 300 L 600 425" fill="none" stroke="#3b82f6" strokeWidth="6" strokeDasharray="10, 10" className="animate-[dash_1s_linear_infinite]" />
                
                {/* Start Node */}
                <circle cx="200" cy="175" r="10" fill="#10b981" />
                <text x="220" y="180" fill="currentColor" fontSize="14" fontWeight="bold">Start</text>

                {/* End Node */}
                <circle cx="600" cy="425" r="10" fill="#f43f5e" />
                <text x="620" y="430" fill="currentColor" fontSize="14" fontWeight="bold">Destination</text>
             </svg>
             <style>{`
                @keyframes dash {
                  to { stroke-dashoffset: -20; }
                }
             `}</style>
          </div>
        ) : (
          <div className="text-center text-slate-400">
            <Navigation size={48} className="mx-auto mb-4 opacity-20" />
            <p>Select start and destination to generate a path.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
