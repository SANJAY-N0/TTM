import React from 'react';
import { Check } from 'lucide-react';

interface OrderPlacedPopupProps {
  onClose: (tab: 'home' | 'orders') => void;
  orderCode?: string;
}

const OrderPlacedPopup: React.FC<OrderPlacedPopupProps> = ({ onClose, orderCode }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-[92%] max-w-sm text-center shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col items-center">
        {/* Centered Emerald Check Circle */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-[#059669] rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 animate-bounce">
            <Check className="w-12 h-12 stroke-[4.5]" />
          </div>
        </div>

        {/* Heading to match reference image */}
        <h2 className="text-[24px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
          Order Placed Successfully
        </h2>
        
        {/* Subtitle to match reference image */}
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed max-w-[270px]">
          Your order has been confirmed and is now being prepared.
        </p>

        {orderCode && (
          <div className="mt-4 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-[#059669] dark:text-emerald-400 font-bold text-xs rounded-full border border-emerald-100 dark:border-emerald-900/30">
            Order Code: {orderCode}
          </div>
        )}

        {/* Buttons to match reference image */}
        <div className="mt-8 w-full space-y-3">
          <button
            type="button"
            onClick={() => onClose('orders')}
            className="w-full bg-[#059669] hover:bg-[#047857] active:scale-[0.98] text-white py-3.5 rounded-full font-semibold text-base transition-all cursor-pointer shadow-md shadow-emerald-600/10"
          >
            Track your Order
          </button>

          <button
            type="button"
            onClick={() => onClose('home')}
            className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-700 dark:text-slate-300 py-3.5 rounded-full font-semibold text-base transition-all cursor-pointer"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderPlacedPopup;
