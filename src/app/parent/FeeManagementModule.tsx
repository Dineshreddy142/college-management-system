import { DollarSign, Download, AlertTriangle, CreditCard, CheckCircle, Clock } from "lucide-react";
import { Card, Badge, Btn, cn } from "../App";

export function FeeManagementModule() {
  const fees = [
    { item: "Tuition Fee (Sem 6)", amount: "₹45,000", dueDate: "15 Jan 2024", status: "Paid", paidOn: "10 Jan 2024" },
    { item: "Hostel Fee (Sem 6)", amount: "₹12,000", dueDate: "15 Jan 2024", status: "Paid", paidOn: "12 Jan 2024" },
    { item: "Examination Fee", amount: "₹5,800", dueDate: "10 May 2024", status: "Paid", paidOn: "05 May 2024" },
    { item: "Library Fine", amount: "₹500", dueDate: "25 May 2024", status: "Due", paidOn: null },
  ];

  const totalDue = 500;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Fee Management</h2>
          <p className="text-sm text-slate-500">View fee structures, track payments, and download receipts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-6 bg-gradient-to-br from-blue-600 to-indigo-600 text-white lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <DollarSign size={20} className="text-white" />
              </div>
              <Badge variant="warning" className="bg-white/20 text-white border-white/10">Due Soon</Badge>
            </div>
            <p className="text-blue-100 text-sm mb-1">Total Pending Amount</p>
            <h3 className="text-4xl font-bold">₹{totalDue.toLocaleString()}</h3>
          </div>
          
          <div className="mt-8 space-y-3">
            <button className="w-full py-3 bg-white text-blue-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-sm">
              <CreditCard size={18} /> Pay Now
            </button>
            <button className="w-full py-3 bg-white/10 text-white border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-colors">
              View Fee Structure
            </button>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden lg:col-span-2">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Transactions</h3>
            <Btn variant="outline" size="sm" icon={<Download size={14} />}>Statement</Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  <th className="p-4 font-medium text-center">Status</th>
                  <th className="p-4 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50 dark:divide-slate-800/50">
                {fees.map((fee, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-slate-900 dark:text-slate-200">{fee.item}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Clock size={12} /> Due: {fee.dueDate}
                      </p>
                    </td>
                    <td className="p-4 text-right font-medium text-slate-900 dark:text-slate-200">
                      {fee.amount}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center">
                        <Badge variant={fee.status === "Paid" ? "success" : "warning"} size="sm">
                          {fee.status}
                        </Badge>
                        {fee.status === "Paid" && fee.paidOn && (
                          <span className="text-[10px] text-slate-400 mt-1">on {fee.paidOn}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {fee.status === "Paid" ? (
                        <button className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Download Receipt">
                          <Download size={16} />
                        </button>
                      ) : (
                        <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors shadow-sm">
                          Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      
      {totalDue > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400">Payment Reminder</h4>
            <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
              You have a pending Library Fine of ₹500. Please clear the dues before 25 May 2024 to avoid late payment penalties and hall ticket blockages.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
