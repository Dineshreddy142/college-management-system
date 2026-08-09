import { MessageSquare, Search, Send } from "lucide-react";
import { Card, Avatar } from "../App";

export function CommunicationModule() {
  return (
    <div className="space-y-5 h-[calc(100vh-120px)] flex flex-col">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Communication</h2>
        <p className="text-sm text-slate-500">Chat with your faculty, mentor, or administration.</p>
      </div>

      <Card className="flex-1 flex overflow-hidden">
        <div className="w-1/3 border-r border-slate-100 dark:border-slate-800 flex flex-col min-w-[200px]">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search..." className="pl-9 pr-3 py-2 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {[
              { name: "Dr. Ramesh Gupta", role: "Faculty", msg: "Please submit it by tomorrow.", time: "10:30 AM" },
              { name: "Prof. D. Joshi", role: "Mentor", msg: "Let's discuss your project.", time: "Yesterday" },
              { name: "Admin Office", role: "Support", msg: "Your fee receipt is generated.", time: "Mon" },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border-b border-slate-50 dark:border-slate-800/50">
                <Avatar name={c.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.name}</p>
                    <span className="text-[10px] text-slate-400">{c.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{c.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900/20">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
            <Avatar name="Dr. Ramesh Gupta" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Dr. Ramesh Gupta</p>
              <p className="text-xs text-slate-500">Faculty (CS)</p>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="flex justify-end">
              <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-sm max-w-[80%] text-sm">
                Sir, regarding the Data Structures assignment, can I submit a ZIP file containing all code files?
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-2xl rounded-tl-sm max-w-[80%] text-sm text-slate-900 dark:text-white">
                Yes Arjun, a ZIP file is fine. Please submit it by tomorrow.
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="relative flex items-center">
              <input type="text" placeholder="Type a message..." className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
