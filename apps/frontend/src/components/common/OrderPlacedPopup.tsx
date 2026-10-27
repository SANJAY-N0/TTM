import React from 'react';
import { Check, Clock } from 'lucide-react';

interface OrderPlacedPopupProps {
  onClose: (tab: 'home' | 'orders') => void;
  orderCode?: string;
  orderId?: string;
}

const OrderPlacedPopup: React.FC<OrderPlacedPopupProps> = ({ onClose, orderCode, orderId }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-sm text-center shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col items-center">
        {/* Centered Emerald Check Circle */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <Check className="w-10 h-10 stroke-[4.5]" />
          </div>
        </div>

        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          ✅ Payment Successful
        </h2>
        
        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">
          🎉 Order Placed Successfully
        </p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
          Your order has been sent to the canteen.
        </p>

        {/* Token & Details Card */}
        <div className="mt-4 w-full bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-center space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Token Number</p>
          <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            #{orderCode || '991'}
          </p>
          {orderId && (
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 font-mono">Order Number: #{orderId}</p>
          )}
          <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Est. Preparation Time: 15-20 Mins</span>
          </div>
        </div>

        {/* Action Buttons: View Order Details & Back to Dashboard */}
        <div className="mt-6 w-full grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onClose('orders')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-600/20"
          >
            View Order Details
          </button>

          <button
            type="button"
            onClick={() => onClose('home')}
            className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderPlacedPopup;
