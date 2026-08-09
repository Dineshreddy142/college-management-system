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
              <p>Hi Arjun! I'm your AI Campus Assistant. Here's what I can help you with today:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <button className="text-left px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                  📚 Help me with Data Structures
                </button>
                <button className="text-left px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                  💼 Prepare for TechNova interview
                </button>
                <button className="text-left px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                  📅 Create a study planner
                </button>
                <button className="text-left px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                  💰 What are my pending fees?
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end items-start gap-4">
            <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-sm max-w-[85%] text-sm shadow-sm">
              I need help understanding Quick Sort time complexity for my assignment.
            </div>
            <Avatar name="Arjun Sharma" size="md" />
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
              <Zap size={18} />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl rounded-tl-sm max-w-[85%] text-sm text-slate-700 dark:text-slate-300 shadow-sm space-y-3">
              <p>Quick Sort is a Divide and Conquer algorithm. Here is a breakdown of its time complexity:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Best Case: O(n log n)</strong> - When the pivot element always picks the middle element.</li>
                <li><strong>Average Case: O(n log n)</strong> - When the partition sizes are reasonably balanced.</li>
                <li><strong>Worst Case: O(n²)</strong> - When the pivot is the smallest or largest element, creating highly unbalanced partitions (e.g., sorting an already sorted array with the last element as pivot).</li>
              </ul>
              <p className="mt-2 text-xs text-slate-500">Source: Introduction to Algorithms, CS301 Notes</p>
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
