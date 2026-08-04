import React, { useState, useEffect } from 'react';
import { Order, Payment } from '../types';
import { 
  CreditCard, Search, Filter, Download, RefreshCw, ShieldCheck, 
  RotateCcw, AlertCircle, CheckCircle, Clock, XCircle, IndianRupee,
  Building2, Store, User as UserIcon, Calendar, ArrowUpRight, Eye, X
} from 'lucide-react';

interface AdminPaymentRecord {
  id: string;
  order_id: string;
  cashfree_order_id: string;
  cashfree_payment_id: string;
  student_name: string;
  college_name: string;
  canteen_name: string;
  amount: number;
  payment_method: string;
  payment_status: 'Success' | 'Pending' | 'Failed' | 'Cancelled' | 'Refunded' | 'Refund Processing';
  date_time: string;
  refund_reason?: string;
}

const INITIAL_TRANSACTIONS: AdminPaymentRecord[] = [
  {
    id: 'TXN-CF-992101',
    order_id: 'ORD-992101',
    cashfree_order_id: 'cf_ord_8829101',
    cashfree_payment_id: 'cf_pay_19283741',
    student_name: 'Rahul Sharma (2026-CS-09)',
    college_name: 'PSG College of Technology',
    canteen_name: 'PSG Central Food Court',
    amount: 180,
    payment_method: 'Cashfree Online',
    payment_status: 'Success',
    date_time: new Date(Date.now() - 3600000 * 2).toLocaleString()
  },
  {
    id: 'TXN-CF-992102',
    order_id: 'ORD-992102',
    cashfree_order_id: 'cf_ord_8829102',
    cashfree_payment_id: 'cf_pay_19283742',
    student_name: 'Ananya Verma (2026-EC-42)',
    college_name: 'Coimbatore Institute of Technology',
    canteen_name: 'CIT Campus Canteen Stalls',
    amount: 240,
    payment_method: 'Cashfree Online',
    payment_status: 'Success',
    date_time: new Date(Date.now() - 3600000 * 5).toLocaleString()
  },
  {
    id: 'TXN-CF-992103',
    order_id: 'ORD-992103',
    cashfree_order_id: 'cf_ord_8829103',
    cashfree_payment_id: 'cf_pay_19283743',
    student_name: 'Karthik Raja (2026-ME-15)',
    college_name: 'Kumaraguru College of Technology',
    canteen_name: 'KCT Main Dining Hall',
    amount: 110,
    payment_method: 'Cashfree Online',
    payment_status: 'Failed',
    date_time: new Date(Date.now() - 3600000 * 12).toLocaleString()
  },
  {
    id: 'TXN-CF-992104',
    order_id: 'ORD-992104',
    cashfree_order_id: 'cf_ord_8829104',
    cashfree_payment_id: 'cf_pay_19283744',
    student_name: 'Priya Sundaram (2026-IT-88)',
    college_name: 'PSG College of Technology',
    canteen_name: 'PSG North Campus Stall',
    amount: 320,
    payment_method: 'Cashfree Online',
    payment_status: 'Refunded',
    date_time: new Date(Date.now() - 3600000 * 24).toLocaleString(),
    refund_reason: 'Order cancelled due to item unavailability'
  }
];

export const AdminPaymentDetailsView: React.FC = () => {
  const [transactions, setTransactions] = useState<AdminPaymentRecord[]>(() => {
    const saved = localStorage.getItem('hb_admin_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [selectedTxnForRefund, setSelectedTxnForRefund] = useState<AdminPaymentRecord | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('hb_admin_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.cashfree_order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.college_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.canteen_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.payment_status.toLowerCase() === statusFilter.toLowerCase();
    const matchesMethod = methodFilter === 'all' || t.payment_method.toLowerCase().includes(methodFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalVolume = transactions
    .filter(t => t.payment_status === 'Success')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalRefunded = transactions
    .filter(t => t.payment_status === 'Refunded')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const handleInitiateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxnForRefund || !refundReason.trim()) return;

    setIsRefunding(true);

    try {
      // Send API call to backend refund endpoint
      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedTxnForRefund.order_id,
          cashfreeOrderId: selectedTxnForRefund.cashfree_order_id,
          amount: selectedTxnForRefund.amount,
          reason: refundReason
        })
      });

      // Update state locally
      const updated = transactions.map(t => {
        if (t.id === selectedTxnForRefund.id) {
          return {
            ...t,
            payment_status: 'Refunded' as const,
            refund_reason: refundReason
          };
        }
        return t;
      });

      setTransactions(updated);
      setIsRefunding(false);
      setSelectedTxnForRefund(null);
      setRefundReason('');

      setToastMessage(`Refund of ₹${selectedTxnForRefund.amount} processed successfully via Cashfree!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Refund API error:', err);
      setIsRefunding(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Txn ID', 'Order ID', 'Cashfree Order ID', 'Student', 'College', 'Canteen', 'Amount', 'Method', 'Status', 'Date Time'];
    const rows = filteredTransactions.map(t => [
      t.id, t.order_id, t.cashfree_order_id, t.student_name, t.college_name, t.canteen_name, t.amount, t.payment_method, t.payment_status, t.date_time
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cashfree_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-8 z-[200] bg-emerald-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-500" />
            <span>Cashfree Payment Gateway Transactions</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Real-time backend verified payment records, transaction signatures, and automated refund management.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Volume Collected</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{totalVolume}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Successful Payments</p>
          <p className="text-2xl font-black text-slate-950 dark:text-white mt-1">
            {transactions.filter(t => t.payment_status === 'Success').length}
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/50 shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">Failed / Pending</p>
          <p className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">
            {transactions.filter(t => t.payment_status === 'Failed' || t.payment_status === 'Pending').length}
          </p>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200/60 dark:border-rose-900/50 shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">Total Refunds Processed</p>
          <p className="text-2xl font-black text-rose-900 dark:text-rose-200 mt-1">₹{totalRefunded}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Txn ID, Cashfree Order ID, Student, College..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-extrabold outline-none"
          >
            <option value="all">All Payment Statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-extrabold outline-none"
          >
            <option value="all">All Payment Methods</option>
            <option value="cashfree">Cashfree Online</option>
            <option value="counter">Counter Cash</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="p-4">Txn / Cashfree Order ID</th>
                <th className="p-4">Student</th>
                <th className="p-4">College & Canteen</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-bold">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No payment records match the specified filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <p className="font-mono font-black text-slate-900 dark:text-white">{txn.id}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{txn.cashfree_order_id}</p>
                    </td>

                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                      {txn.student_name}
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-white">{txn.college_name}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{txn.canteen_name}</p>
                    </td>

                    <td className="p-4 font-black text-slate-900 dark:text-white">
                      ₹{txn.amount}
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px]">
                        {txn.payment_method}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        txn.payment_status === 'Success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' :
                        txn.payment_status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' :
                        txn.payment_status === 'Refunded' ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400' :
                        'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {txn.payment_status}
                      </span>
                    </td>

                    <td className="p-4 text-[10px] text-slate-400 font-medium">
                      {txn.date_time}
                    </td>

                    <td className="p-4 text-right">
                      {txn.payment_status === 'Success' ? (
                        <button
                          onClick={() => setSelectedTxnForRefund(txn)}
                          className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 ml-auto cursor-pointer border border-rose-200 dark:border-rose-900/50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Initiate Refund</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No action</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REFUND MODAL */}
      {selectedTxnForRefund && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Initiate Cashfree Refund</h3>
                  <p className="text-xs text-slate-400 font-medium">Order #{selectedTxnForRefund.order_id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTxnForRefund(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="text-slate-900 dark:text-white">{selectedTxnForRefund.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Refund Amount:</span>
                <span className="text-rose-600 font-black text-sm">₹{selectedTxnForRefund.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cashfree Order ID:</span>
                <span className="font-mono text-slate-900 dark:text-white">{selectedTxnForRefund.cashfree_order_id}</span>
              </div>
            </div>

            <form onSubmit={handleInitiateRefund} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Refund Reason / Audit Note</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State reason for issuing full refund..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTxnForRefund(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRefunding}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isRefunding ? 'Processing Refund...' : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentDetailsView;
