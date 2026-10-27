import React from 'react';
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react';

interface StudentPaymentPendingViewProps {
  onSimulateSuccess?: () => void;
}

export const StudentPaymentPendingView: React.FC<StudentPaymentPendingViewProps> = ({
  onSimulateSuccess
}) => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 min-h-screen animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6 text-center">
        
        {/* Animated Loader */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center border-4 border-emerald-500 shadow-xl shadow-emerald-500/20">
            <Loader2 className="w-10 h-10 animate-spin stroke-[2.5px]" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Checking Payment...</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            Waiting for payment confirmation...
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <p className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Dual-Strategy Verification Active
          </p>
          <p className="text-[11px] text-slate-400">
            Listening to Cashfree webhook events via Server-Sent Events & fallback 3-second status polling. Please do not close or refresh this tab.
          </p>
        </div>

        {/* Demo / Sandbox Simulation Button */}
        {onSimulateSuccess && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onSimulateSuccess}
              className="w-full py-3 px-4 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Simulate Payment Success (Demo Mode)</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
