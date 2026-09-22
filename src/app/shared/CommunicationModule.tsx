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
            <div className="p-4 text-center text-slate-400 text-xs">
              No recent conversations.
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900/20 items-center justify-center text-center p-6">
          <MessageSquare className="text-slate-300 dark:text-slate-700 mb-2" size={36} />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Select a contact to start messaging</p>
          <p className="text-xs text-slate-400 max-w-xs mt-1">Communicate directly with your faculty members, mentors, or administration.</p>
        </div>
      </Card>
    </div>
  );
}
