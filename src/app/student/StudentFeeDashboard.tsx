import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Download, CreditCard, CheckCircle2, AlertCircle, RefreshCw, FileText, ShieldCheck, History } from 'lucide-react';
import client from '../../api/client';

export const StudentFeeDashboard: React.FC = () => {
  const [feeAccount, setFeeAccount] = useState<any | null>(null);
  const [feeItems, setFeeItems] = useState<any[]>([]);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pay Now Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'ONLINE' | 'BANK_TRANSFER' | 'CARD'>('UPI');
  const [txnRef, setTxnRef] = useState('');
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  // Receipt Modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchFeeAccountDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const [accRes, histRes] = await Promise.allSettled([
        client.get('/fees/my-account'),
        client.get('/fees/my-history')
      ]);

      if (accRes.status === 'fulfilled' && accRes.value.data) {
        setFeeAccount(accRes.value.data.account);
        setFeeItems(accRes.value.data.fee_items || []);
        setScholarships(accRes.value.data.scholarships || []);
      }

      if (histRes.status === 'fulfilled' && histRes.value.data?.data) {
        setPaymentHistory(histRes.value.data.data);
      }
    } catch (err) {
      console.error('Error fetching student fee account details:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeeAccountDetails();
  }, [fetchFeeAccountDetails]);

  const handleOpenPayModal = () => {
    setTxnRef(`TXN${Date.now()}`);
    setIsPayModalOpen(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPay(true);
    try {
      const res = await client.post('/fees/payment/process', {
        payment_method: paymentMethod,
        transaction_reference: txnRef
      });

      if (res.data && res.data.success) {
        showToast(res.data.message || 'Payment processed successfully!');
        setIsPayModalOpen(false);
        fetchFeeAccountDetails();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Payment processing failed.', 'error');
    } finally {
      setIsProcessingPay(false);
    }
  };

  const handleOpenReceiptModal = async (paymentId: number) => {
    setIsReceiptModalOpen(true);
    setIsLoadingReceipt(true);
    try {
      const res = await client.get(`/fees/receipt/${paymentId}`);
      if (res.data && res.data.data) {
        setActiveReceipt(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load receipt details.', 'error');
    } finally {
      setIsLoadingReceipt(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-12 text-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading student fee account statement...</p>
      </div>
    );
  }

  const totalCharges = parseFloat(feeAccount?.total_charges) || 0;
  const totalPaid = parseFloat(feeAccount?.total_paid) || 0;
  const outstanding = parseFloat(feeAccount?.outstanding_balance) || 0;
  const scholarshipsTotal = parseFloat(feeAccount?.total_scholarships) || 0;

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${
          toastMessage.type === 'success' ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40' : 'bg-red-950/90 text-red-200 border-red-500/40'
        }`}>
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs opacity-70">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Student Fee Account Statement
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time fee item breakdown, scholarship waivers, verified payments, and receipt history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFeeAccountDetails}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Statement</span>
          </button>

          {outstanding > 0 && (
            <button
              onClick={handleOpenPayModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Outstanding Dues</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Assigned */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Fee Assigned</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">₹{totalCharges.toLocaleString('en-IN')}</p>
        </div>

        {/* Total Paid */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 p-5 shadow-xs">
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Paid Amount</p>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
        </div>

        {/* Outstanding */}
        <div className={`rounded-2xl border p-5 shadow-xs ${
          outstanding > 0 ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40' : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40'
        }`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding Dues</p>
          <p className={`text-2xl font-extrabold mt-1 ${outstanding > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            ₹{outstanding.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Scholarships */}
        <div className="bg-purple-50/50 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-900/40 p-5 shadow-xs">
          <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Scholarship Waivers</p>
          <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">₹{scholarshipsTotal.toLocaleString('en-IN')}</p>
        </div>

      </div>

      {/* Fee Breakdown Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-500" /> Fee Category Breakdown Statement
        </h3>

        <div className="overflow-x-auto">
          {feeItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No fee structure items assigned to your account.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Fee Category</th>
                  <th className="px-4 py-3 text-center">Due Date</th>
                  <th className="px-4 py-3 text-right">Amount (₹)</th>
                  <th className="px-4 py-3 text-right">Paid (₹)</th>
                  <th className="px-4 py-3 text-right">Remaining (₹)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {feeItems.map((item) => {
                  const amt = parseFloat(item.amount) || 0;
                  const paid = parseFloat(item.paid_amount) || 0;
                  const rem = amt - paid;
                  const isPaid = item.status === 'PAID';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {item.category_name}
                      </td>

                      <td className="px-4 py-3 text-center text-slate-500 font-medium">
                        {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                        ₹{amt.toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{paid.toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3 text-right font-extrabold text-amber-600 dark:text-amber-400">
                        ₹{rem.toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isPaid ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4 text-purple-500" /> Payment & Receipt History
        </h3>

        <div className="overflow-x-auto">
          {paymentHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No payment transaction records found.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Receipt Number</th>
                  <th className="px-4 py-3">Payment Date</th>
                  <th className="px-4 py-3">Method & Txn Ref</th>
                  <th className="px-4 py-3 text-right">Amount (₹)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paymentHistory.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                      {pay.receipt_number}
                    </td>

                    <td className="px-4 py-3 text-slate-500 font-medium">
                      {new Date(pay.payment_date).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                      {pay.payment_method} • {pay.transaction_reference}
                    </td>

                    <td className="px-4 py-3 text-right font-extrabold text-slate-900 dark:text-white">
                      ₹{parseFloat(pay.amount).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                        {pay.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenReceiptModal(pay.id)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300"
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pay Now Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Process Verified Fee Payment</h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl">
                <span className="text-[10px] text-emerald-600 font-bold uppercase">Calculated Payable Amount</span>
                <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">₹{outstanding.toLocaleString('en-IN')}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="ONLINE">Online NetBanking</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Reference Number</label>
                <input
                  type="text"
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button type="button" onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={isProcessingPay} className="px-4 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Official Payment Receipt</h3>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => window.print()} className="px-2 py-1 bg-purple-600 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                  <Download className="w-3 h-3" /> Print
                </button>
                <button onClick={() => setIsReceiptModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {isLoadingReceipt ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading receipt details...</div>
              ) : activeReceipt ? (
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">College Management ERP</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Official Fee Payment Receipt</p>
                  </div>

                  <div className="space-y-1.5">
                    <p><span className="text-slate-400 font-bold">Receipt Number: </span><span className="font-mono font-bold text-purple-600">{activeReceipt.receipt_number}</span></p>
                    <p><span className="text-slate-400 font-bold">Student Name: </span><span className="font-bold text-slate-900 dark:text-white">{activeReceipt.first_name} {activeReceipt.last_name}</span></p>
                    <p><span className="text-slate-400 font-bold">Roll Number: </span><span className="font-mono font-bold">{activeReceipt.roll_number || activeReceipt.admission_number}</span></p>
                    <p><span className="text-slate-400 font-bold">Department: </span><span>{activeReceipt.department_name || 'Engineering'}</span></p>
                    <p><span className="text-slate-400 font-bold">Payment Method: </span><span>{activeReceipt.payment_method} ({activeReceipt.transaction_reference})</span></p>
                    <p><span className="text-slate-400 font-bold">Payment Date: </span><span>{new Date(activeReceipt.payment_date).toLocaleString()}</span></p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="font-bold text-slate-500">Amount Paid:</span>
                    <span className="text-xl font-extrabold text-emerald-600">₹{parseFloat(activeReceipt.amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
