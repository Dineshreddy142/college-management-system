import { Search, Book, Clock, AlertTriangle } from "lucide-react";
import { Card, Badge, Btn } from "../App";

export function LibraryModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Library</h2>
          <p className="text-sm text-slate-500">Track issued books and search the catalog.</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search book title or author..." className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Currently Issued (2)</h3>
          <div className="space-y-3">
            {[
              { title: "Introduction to Algorithms", author: "Thomas H. Cormen", due: "Today", fine: 0 },
              { title: "Operating System Concepts", author: "Abraham Silberschatz", due: "In 3 Days", fine: 0 },
            ].map((b, i) => (
              <div key={i} className={`p-4 border rounded-xl flex flex-col gap-3 ${b.due === 'Today' ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'}`}>
                <div className="flex gap-3">
                  <div className="w-10 h-14 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-slate-400 flex-shrink-0">
                    <Book size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm leading-tight">{b.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{b.author}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span className={`text-xs font-medium flex items-center gap-1 ${b.due === 'Today' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    <Clock size={12} /> Due {b.due}
                  </span>
                  <Btn variant="outline" size="sm">Renew</Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5 flex items-center gap-4 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <span className="font-bold text-lg">₹0</span>
            </div>
            <div>
              <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">No Pending Fines</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">You have returned all books on time this semester.</p>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Reading History</h3>
            <div className="space-y-2 text-sm">
              {[
                "Computer Networks (Tanenbaum) - Returned Jan 15",
                "Database System Concepts - Returned Dec 10",
                "Software Engineering (Sommerville) - Returned Nov 22"
              ].map((h, i) => (
                <div key={i} className="py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 text-slate-600 dark:text-slate-400">
                  {h}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
