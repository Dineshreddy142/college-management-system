import { DollarSign, Download, CreditCard, Clock } from "lucide-react";
import { Card, Badge, Btn, PBar } from "../App";

export function FeesModule() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Fee Management</h2>
          <p className="text-sm text-slate-500">View and pay your college fees online.</p>
        </div>
        <Btn variant="primary" icon={<CreditCard size={14} />}>Pay Now</Btn>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl relative overflow-hidden border-0">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-blue-500/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <h3 className="text-slate-300 text-sm font-medium mb-1">Total Outstanding Fee</h3>
            <p className="text-3xl font-bold mb-6">₹45,000</p>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Paid: ₹85,000</span>
                  <span className="text-slate-300">Total: ₹1,30,000</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Pending Dues</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl">
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-200">Semester 6 Tuition Fee</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1"><Clock size={12}/> Due in 15 days</p>
              </div>
              <p className="font-bold text-amber-900 dark:text-amber-200">₹40,000</p>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Hostel Mess Fee (May)</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock size={12}/> Due in 20 days</p>
              </div>
              <p className="font-bold text-slate-900 dark:text-white">₹5,000</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Payment History</h3>
        <div className="space-y-2">
          {[
            { date: "Jan 10, 2024", type: "Semester 5 Tuition Fee", amount: "₹40,000", method: "UPI", id: "TXN12345678" },
            { date: "Aug 15, 2023", type: "Semester 4 Tuition Fee", amount: "₹40,000", method: "Credit Card", id: "TXN98765432" },
          ].map((tx, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600">
                  <DollarSign size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{tx.type}</p>
                  <p className="text-xs text-slate-500">{tx.date} • {tx.method} • Ref: {tx.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900 dark:text-white">{tx.amount}</span>
                <Btn variant="outline" size="sm" icon={<Download size={14}/>}>Receipt</Btn>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
