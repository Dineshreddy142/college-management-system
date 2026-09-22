import { Zap, Send, Sparkles } from "lucide-react";
import { Card, Badge, Avatar } from "../App";

export function AIAssistantModule() {
  return (
    <div className="space-y-5 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Campus Assistant</h2>
            <Badge variant="info">Beta</Badge>
          </div>
          <p className="text-sm text-slate-500">Get help with academics, placements, and campus queries.</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900 dark:to-slate-900 border-blue-100 dark:border-slate-800">
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          <div className="flex justify-center mb-8">
            <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 text-xs text-slate-500 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500" /> Today
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
              <Zap size={18} />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl rounded-tl-sm max-w-[85%] text-sm text-slate-700 dark:text-slate-300 shadow-sm space-y-3">
              <p>Hello! I'm your AI Campus Assistant. How can I help you today?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <button className="text-left px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                  📚 Academic Queries & Support
                </button>
                <button className="text-left px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                  💼 Placement Preparation
                </button>
                <button className="text-left px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                  📅 Timetable & Schedule Info
                </button>
                <button className="text-left px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                  💰 Fee Status & Guidelines
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex items-center max-w-4xl mx-auto shadow-sm rounded-xl">
            <input type="text" placeholder="Ask about academics, attendance, or campus life..." className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
            <button className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Send size={16} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
