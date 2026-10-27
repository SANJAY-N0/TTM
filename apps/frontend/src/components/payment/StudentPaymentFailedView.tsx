import React from 'react';
import { XCircle, RotateCcw, ArrowLeft, AlertCircle } from 'lucide-react';

interface StudentPaymentFailedViewProps {
  errorMessage?: string | null;
  onRetry: () => void;
  onCancel: () => void;
}

export const StudentPaymentFailedView: React.FC<StudentPaymentFailedViewProps> = ({
  errorMessage,
  onRetry,
  onCancel
}) => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 min-h-screen animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6 text-center">
        
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto border-4 border-rose-500/30 shadow-lg shadow-rose-500/20">
          <XCircle className="w-12 h-12 stroke-[2.5px]" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Payment Failed</h2>
          <p className="text-xs text-rose-500 font-extrabold mt-1">Your payment could not be completed.</p>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold leading-relaxed">
              {errorMessage}
            </p>
          </div>
        )}

        <p className="text-[11px] text-slate-400 font-medium">
          No charges were deducted or order tokens created. You can retry paying with Cashfree or choose a different payment method.
        </p>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Payment</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>

      </div>
    </div>
  );
};
