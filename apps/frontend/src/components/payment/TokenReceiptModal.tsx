import React from 'react';
import { Order } from '../../types';
import { Printer, Download, X, CheckCircle2, Utensils, QrCode, Clock } from 'lucide-react';

interface TokenReceiptModalProps {
  order: Order;
  onClose: () => void;
}

export const TokenReceiptModal: React.FC<TokenReceiptModalProps> = ({ order, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const receiptText = `
========================================
           TIME TO MEAL
    Campus Canteen Pre-order Token
========================================
College: ${order.student_details?.college_name || 'PSG College of Technology'}
Canteen: PSG Main Food Court
Order Code: #${order.order_code || 'ORD-991'}
Token Number: #${order.order_code || 'TOKEN-991'}
Queue Position: #3 in Queue
Estimated Time: 15-20 Mins

ITEMS ORDERED:
${order.order_items.map(item => `- ${item.item_name} x ${item.quantity} (₹${item.price * item.quantity})`).join('\n')}

TOTAL AMOUNT: ₹${order.total_amount}
PAYMENT METHOD: Paid via Cashfree Online Gateway
TRANSACTION ID: ${order.payments?.[0]?.transaction_reference || 'cf_tx_' + Date.now()}
DATE & TIME: ${new Date(order.created_at || Date.now()).toLocaleString()}
========================================
    Please present this token at counter
========================================
`;

    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `TimeToMeal_Token_${order.order_code || 'ORD'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-token-receipt, #printable-token-receipt * {
            visibility: visible;
          }
          #printable-token-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 relative">
        {/* Header Action Buttons */}
        <div className="flex items-center justify-between no-print border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-500" />
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white">Official Receipt</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Receipt Box */}
        <div id="printable-token-receipt" className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-5 text-center font-sans">
          
          {/* Logo & Header */}
          <div className="space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Utensils className="w-6 h-6" />
            </div>
            <h2 className="text-base font-black text-slate-950 dark:text-white uppercase tracking-wider mt-2">Time To Meal</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {order.student_details?.college_name || 'PSG College of Technology'}
            </p>
            <p className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">PSG Central Food Court</p>
          </div>

          {/* Token Highlight */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Token Number</p>
            <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
              #{order.order_code || '991'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-1 text-[10px] text-slate-500 font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Est. Ready in 15 mins • #3 in Queue</span>
            </div>
          </div>

          {/* Order Details List */}
          <div className="text-left text-xs space-y-2 border-t border-b border-slate-200 dark:border-slate-800 py-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Order Summary</p>
            {order.order_items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center font-bold">
                <span className="text-slate-800 dark:text-slate-200">{item.item_name} × {item.quantity}</span>
                <span className="text-slate-950 dark:text-white font-mono">₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-2 text-sm font-black">
              <span className="text-slate-900 dark:text-white uppercase tracking-wider">Total Paid</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">₹{order.total_amount}</span>
            </div>
          </div>

          {/* Verification QR Representation */}
          <div className="flex items-center justify-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <QrCode className="w-10 h-10 text-slate-900 dark:text-white shrink-0" />
            <div className="text-left text-[9px] font-mono text-slate-500">
              <p className="font-bold text-slate-900 dark:text-white">VERIFIED CASHFREE PAYMENT</p>
              <p>Txn Ref: {order.payments?.[0]?.transaction_reference || 'cf_txn_' + Date.now()}</p>
              <p>{new Date(order.created_at || Date.now()).toLocaleString()}</p>
            </div>
          </div>

          <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
            Thank you for ordering with TimeToMeal!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 no-print">
          <button
            onClick={handleDownload}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>

          <button
            onClick={handlePrint}
            className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Token</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenReceiptModal;
