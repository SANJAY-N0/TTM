import React from 'react';
import { Order } from '../../types';
import { CheckCircle, Clock, FileText, LayoutDashboard, ShieldCheck, Hash, CreditCard } from 'lucide-react';

interface StudentPaymentSuccessViewProps {
  order: Order;
  onViewOrderDetails: () => void;
  onBackToDashboard: () => void;
}

export const StudentPaymentSuccessView: React.FC<StudentPaymentSuccessViewProps> = ({
  order,
  onViewOrderDetails,
  onBackToDashboard
}) => {
  const orderNumber = order.id || order.order_number || 'ORD-' + Math.floor(100000 + Math.random() * 900000);
  const tokenNumber = order.order_code || order.token_number || order.tokenNumber || '---';
  const amountPaid = order.paid_amount || order.total_amount || 0;
  const paymentMethod = 'Cashfree';

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 min-h-screen animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6 text-center">
        
        {/* Green Success Badge & Header */}
        <div className="space-y-2">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-500/30 shadow-lg shadow-emerald-500/20 animate-bounce">
            <CheckCircle className="w-12 h-12 stroke-[2.5px]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-1.5">
              <span>✅ Payment Successful</span>
            </h2>
            <h3 className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center justify-center gap-1">
              <span>🎉 Order Placed Successfully</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
              Your order has been sent to the canteen.
            </p>
          </div>
        </div>

        {/* Token Number Card */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-5 rounded-3xl border border-emerald-200 dark:border-emerald-900/50 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Token Number</p>
          <p className="text-5xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
            #{tokenNumber}
          </p>
          <div className="flex items-center justify-center gap-1.5 pt-2 text-xs font-black text-emerald-800 dark:text-emerald-300">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Estimated Preparation Time: 15-20 Mins</span>
          </div>
        </div>

        {/* Order Info Summary */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5 text-left text-xs font-bold">
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider">
              <Hash className="w-3.5 h-3.5 text-slate-400" /> Order Number:
            </span>
            <span className="font-mono text-slate-900 dark:text-white font-extrabold truncate max-w-[180px]">{orderNumber}</span>
          </div>

          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Amount Paid:
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm font-mono">₹{amountPaid.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Payment Method:
            </span>
            <span className="text-slate-900 dark:text-white font-bold">{paymentMethod}</span>
          </div>
        </div>

        {/* EXACTLY TWO ACTION BUTTONS: View Details & Back to Dashboard */}
        <div className="flex flex-col gap-3 pt-2 w-full">
          <button
            type="button"
            onClick={onViewOrderDetails}
            className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>View Details</span>
          </button>

          <button
            type="button"
            onClick={onBackToDashboard}
            className="w-full py-4 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default StudentPaymentSuccessView;
