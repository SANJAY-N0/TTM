import React, { useState, useMemo, useEffect } from 'react';
import { OrderItem, Order, CanteenProfile } from '../../types';
import { 
  Banknote, QrCode, Layers, CheckCircle2, ChevronLeft, 
  Copy, Check, ShoppingBag, Store, Printer
} from 'lucide-react';
import QRCode from 'react-qr-code';

export interface CanteenPaymentCheckoutViewProps {
  cart: OrderItem[];
  totalAmount: number;
  canteenProfile?: CanteenProfile;
  canteenUpiId?: string;
  onCompletePayment: (paymentDetails: {
    paymentMethod: 'Cash' | 'UPI' | 'Split';
    cashAmount: number;
    upiAmount: number;
    receivedCash?: number;
    changeGiven?: number;
  }) => Promise<Order | null>;
  onCancel: () => void;
  onBackToDashboard: () => void;
  onContinueBilling: () => void;
}

type PaymentMethodType = 'cash' | 'upi' | 'split';

export const CanteenPaymentCheckoutView: React.FC<CanteenPaymentCheckoutViewProps> = ({
  cart,
  totalAmount,
  canteenProfile,
  canteenUpiId = 'timetomeal@hdfcbank',
  onCompletePayment,
  onCancel,
  onBackToDashboard,
  onContinueBilling
}) => {
  // Unique Bill Number on mount
  const [billNumber] = useState<string>(() => `BILL-${Math.floor(100000 + Math.random() * 900000)}`);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('upi');
  
  // Cash Payment state
  const [cashReceived, setCashReceived] = useState<string>('');
  
  // Split Payment state
  const [splitCashInput, setSplitCashInput] = useState<string>('');

  // Execution & Completion states (Instant execution, no spinner)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Print helper for thermal receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  // Automatic Receipt Printing upon instant payment completion
  useEffect(() => {
    if (completedOrder) {
      const timer = setTimeout(() => {
        handlePrintReceipt();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [completedOrder]);

  // Cash Calculations
  const cashReceivedNum = Number(cashReceived) || 0;
  const changeGiven = Math.max(0, cashReceivedNum - totalAmount);
  const isCashSufficient = cashReceivedNum >= totalAmount;

  // Split Calculations
  const splitCashNum = Number(splitCashInput) || 0;
  const splitUpiNum = Math.max(0, totalAmount - splitCashNum);
  const isSplitValid = splitCashNum > 0 && splitCashNum < totalAmount;

  // UPI QR String Generator
  const canteenName = canteenProfile?.canteen_name || 'TimeToMeal Canteen';

  const upiQrString = useMemo(() => {
    const targetAmount = paymentMethod === 'split' ? splitUpiNum : totalAmount;
    const note = paymentMethod === 'split' ? `Split Bill ${billNumber}` : `Bill ${billNumber}`;
    return `upi://pay?pa=${encodeURIComponent(canteenUpiId)}&pn=${encodeURIComponent(canteenName)}&am=${targetAmount}&cu=INR&tn=${encodeURIComponent(note)}`;
  }, [canteenUpiId, canteenName, paymentMethod, splitUpiNum, totalAmount, billNumber]);

  // Copy UPI ID helper
  const handleCopyUpi = () => {
    navigator.clipboard.writeText(canteenUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // ONE-CLICK INSTANT PAYMENT EXECUTION (NO POPUP CONFIRMATION, NO SPINNER)
  const handleConfirmPayment = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let resultOrder: Order | null = null;

      if (paymentMethod === 'cash') {
        if (!isCashSufficient) {
          alert('Cash received is less than total bill amount.');
          setIsSubmitting(false);
          return;
        }
        resultOrder = await onCompletePayment({
          paymentMethod: 'Cash',
          cashAmount: totalAmount,
          upiAmount: 0,
          receivedCash: cashReceivedNum,
          changeGiven
        });
      } else if (paymentMethod === 'upi') {
        resultOrder = await onCompletePayment({
          paymentMethod: 'UPI',
          cashAmount: 0,
          upiAmount: totalAmount
        });
      } else if (paymentMethod === 'split') {
        if (splitCashNum <= 0 || splitCashNum >= totalAmount) {
          alert('Please enter a valid cash amount for split payment.');
          setIsSubmitting(false);
          return;
        }
        resultOrder = await onCompletePayment({
          paymentMethod: 'Split',
          cashAmount: splitCashNum,
          upiAmount: splitUpiNum
        });
      }

      if (resultOrder) {
        setCompletedOrder(resultOrder);
      }
    } catch (error) {
      console.error('Failed to complete payment:', error);
      alert('Error recording payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // INSTANT PAYMENT SUCCESSFUL PAGE
  // ----------------------------------------------------
  if (completedOrder) {
    const formattedDate = new Date(completedOrder.created_at || Date.now()).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    return (
      <div className="h-screen w-full bg-slate-100 dark:bg-slate-950 p-4 flex flex-col items-center justify-center font-sans overflow-hidden">
        
        {/* Printable Thermal Receipt (Visible only during window.print()) */}
        <div className="hidden print:block print:w-full print:max-w-xs print:p-2 print:text-black print:font-mono">
          <div className="text-center space-y-1 pb-2 border-b border-black">
            <h2 className="text-lg font-black">{canteenName}</h2>
            <p className="text-xs">Counter Billing Receipt</p>
            <p className="text-xs">Date: {formattedDate}</p>
          </div>
          <div className="py-2 border-b border-black text-center">
            <p className="text-xs font-bold uppercase">Token Number</p>
            <p className="text-3xl font-black">#{completedOrder.order_code || '---'}</p>
            <p className="text-xs">Bill No: {billNumber}</p>
          </div>
          <div className="py-2 border-b border-black space-y-1">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs font-bold">
                <span>{item.quantity}x {item.item_name}</span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 text-xs space-y-1">
            <div className="flex justify-between font-black">
              <span>Total Amount Paid:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <span className="uppercase">{paymentMethod}</span>
            </div>
          </div>
          <p className="text-center text-[10px] mt-4 font-bold uppercase">*** Thank You! Visit Again ***</p>
        </div>

        {/* On-Screen Kiosk Success Card */}
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 text-center print:hidden">
          
          {/* Success Header Badges */}
          <div className="space-y-2">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 rounded-3xl flex items-center justify-center border-4 border-emerald-100 dark:border-emerald-900/60 mx-auto shadow-md">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
                <span>✅ Payment Successful</span>
              </h2>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
                <span>✅ Order Completed</span>
              </p>
            </div>
          </div>

          {/* Token & Bill Details Box */}
          <div className="grid grid-cols-2 gap-3 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/50">
            <div className="space-y-0.5 text-center border-r border-emerald-200 dark:border-emerald-900/50 pr-2">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Token Number</span>
              <span className="text-4xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                #{completedOrder.order_code || '---'}
              </span>
            </div>
            <div className="space-y-0.5 text-center pl-2">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Bill Number</span>
              <span className="text-base font-black text-slate-800 dark:text-slate-200 font-mono">
                {billNumber}
              </span>
            </div>
          </div>

          {/* Detailed Transaction Breakdown */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-left">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-200 dark:border-slate-800 pb-1.5">
              Order Items ({cart.length})
            </span>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>{item.quantity}× {item.item_name}</span>
                  <span className="font-mono text-slate-900 dark:text-white">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-2 space-y-1 text-xs">
              <div className="flex justify-between font-black text-slate-900 dark:text-white">
                <span>Amount Paid:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-bold">
                <span>Payment Method:</span>
                <span className="uppercase text-slate-900 dark:text-slate-200 font-black">{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-bold">
                <span>Date & Time:</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* EXACTLY THREE ACTION BUTTONS: Print Receipt, Continue Billing, Back to Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <button
              onClick={handlePrintReceipt}
              className="py-3.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
            >
              <Printer className="w-4 h-4 text-emerald-500" />
              <span>Print Receipt</span>
            </button>

            <button
              onClick={onContinueBilling}
              className="py-3.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Continue Billing</span>
            </button>

            <button
              onClick={onBackToDashboard}
              className="py-3.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-md"
            >
              <Store className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // FULLSCREEN POS PAYMENT CHECKOUT VIEW (NO PAGE SCROLLING, NO FULLSCREEN BUTTON ON PAGE)
  // ----------------------------------------------------
  // ----------------------------------------------------
  // FULLSCREEN POS PAYMENT CHECKOUT VIEW (ZERO SCROLLBAR, POS KIOSK FIT)
  // ----------------------------------------------------
  return (
    <div className="h-full w-full max-h-[calc(100vh-4rem)] overflow-hidden bg-slate-100 dark:bg-slate-950 p-2 sm:p-3 font-sans flex flex-col justify-between select-none">
      
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between shrink-0 mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold transition-all cursor-pointer"
            title="Back to POS"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Counter Payment Checkout</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              {canteenName} • Bill: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">{billNumber}</span>
            </p>
          </div>
        </div>

        {/* Total Payable Block */}
        <div className="text-right pl-3">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Total Payable</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">₹{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Main Content Grid (Full Height Stretch, 12-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
        
        {/* Left Column: Bill Summary & Item Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-0 h-full overflow-hidden">
          <div className="space-y-2 flex-1 flex flex-col min-h-0 overflow-hidden">
            
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between items-center shrink-0">
              <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-500" />
                <span>Bill Summary</span>
              </h3>
              <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[11px] font-black rounded-full border border-emerald-200/50">
                {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            {/* Item List (Scrollable within fixed height container) */}
            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">{item.item_name}</p>
                    <p className="text-[11px] text-slate-500 font-bold mt-0.5">Qty: <span className="text-slate-900 dark:text-white font-mono">{item.quantity}</span> × ₹{item.price}</p>
                  </div>
                  <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white font-mono shrink-0">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Amount Totals Panel */}
          <div className="border-t-2 border-slate-100 dark:border-slate-800 pt-2 space-y-1 shrink-0 mt-1.5">
            <div className="flex justify-between text-xs text-slate-500 font-bold">
              <span>Subtotal</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-bold">
              <span>GST / Taxes</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹0.00 (Exempted)</span>
            </div>
            <div className="flex justify-between items-center text-lg sm:text-xl font-black text-slate-900 dark:text-white pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-800">
              <span>Payable Total</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: POS Payment Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-0 h-full overflow-hidden">
          
          {/* Payment Method Selector Cards */}
          <div className="shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5 px-0.5">
              Select Counter Payment Method
            </span>
            <div className="grid grid-cols-3 gap-2">
              
              {/* CASH BUTTON */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-2.5 sm:p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-md ring-2 ring-emerald-500/20 scale-[1.01]'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-6 h-6 text-emerald-500" />
                <span className="font-black text-[11px] sm:text-xs uppercase tracking-wider">1. Cash</span>
              </button>

              {/* UPI BUTTON */}
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-2.5 sm:p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  paymentMethod === 'upi'
                    ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300 shadow-md ring-2 ring-sky-500/20 scale-[1.01]'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-6 h-6 text-sky-500" />
                <span className="font-black text-[11px] sm:text-xs uppercase tracking-wider">2. Direct UPI</span>
              </button>

              {/* SPLIT PAYMENT BUTTON */}
              <button
                type="button"
                onClick={() => setPaymentMethod('split')}
                className={`p-2.5 sm:p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  paymentMethod === 'split'
                    ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300 shadow-md ring-2 ring-purple-500/20 scale-[1.01]'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-6 h-6 text-purple-500" />
                <span className="font-black text-[11px] sm:text-xs uppercase tracking-wider">3. Split Payment</span>
              </button>

            </div>
          </div>

          {/* ------------------------------------------------ */}
          {/* TAB 1: CASH PAYMENT FLOW */}
          {/* ------------------------------------------------ */}
          {paymentMethod === 'cash' && (
            <div className="flex-1 flex flex-col justify-between my-1.5 animate-in fade-in duration-200 bg-slate-50 dark:bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 min-h-0 overflow-hidden">
              
              <div className="space-y-2.5 flex-1 flex flex-col justify-center min-h-0">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-500" />
                    <span>Cash Received from Customer</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">POS Quick Tender</span>
                </div>

                {/* Cash Input with Currency Prefix */}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-2xl sm:text-3xl font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono shadow-inner"
                    autoFocus
                  />
                </div>

                {/* Quick Denomination Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCashReceived(totalAmount.toString())}
                    className="py-2 bg-white dark:bg-slate-900 hover:bg-emerald-50 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-black text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer shadow-2xs"
                  >
                    Exact (₹{totalAmount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceived((cashReceivedNum + 50).toString())}
                    className="py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
                  >
                    +₹50
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceived((cashReceivedNum + 100).toString())}
                    className="py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
                  >
                    +₹100
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceived((cashReceivedNum + 500).toString())}
                    className="py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
                  >
                    +₹500
                  </button>
                </div>

                {/* Balance / Change Calculation Display */}
                <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isCashSufficient
                    ? 'bg-emerald-100/70 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
                }`}>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider block">
                      {isCashSufficient ? 'Balance / Change to Return' : 'Remaining Cash Needed'}
                    </span>
                    <span className="text-[10px] font-semibold opacity-80">
                      {isCashSufficient ? 'Hand over change to student' : 'Waiting for full cash amount'}
                    </span>
                  </div>
                  <span className="text-2xl font-black font-mono">
                    ₹{isCashSufficient ? changeGiven.toFixed(2) : (totalAmount - cashReceivedNum).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Complete Cash Payment Button (Fixed at Bottom) */}
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={!isCashSufficient || isSubmitting}
                className={`w-full py-3 sm:py-3.5 rounded-xl font-black text-sm uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 mt-1.5 ${
                  isCashSufficient
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98]'
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Complete Payment (Cash)</span>
              </button>
            </div>
          )}

          {/* ------------------------------------------------ */}
          {/* TAB 2: DIRECT UPI PAYMENT FLOW */}
          {/* ------------------------------------------------ */}
          {paymentMethod === 'upi' && (
            <div className="flex-1 flex flex-col justify-between my-1.5 animate-in fade-in duration-200 bg-slate-50 dark:bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center min-h-0 overflow-hidden">
              
              <div className="flex items-center justify-between text-left border-b border-slate-200 dark:border-slate-800 pb-1.5 shrink-0">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-sky-500" />
                    <span>Scan & Pay via Canteen UPI</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold">Owner UPI ID from Canteen Settings</p>
                </div>
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">{canteenUpiId}</span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-0.5 hover:text-emerald-500 text-slate-400 transition-colors cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Centered POS QR Code Display */}
              <div className="flex-1 flex flex-col items-center justify-center py-1 min-h-0 overflow-hidden">
                <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-md flex items-center justify-center shrink-0">
                  <QRCode
                    value={upiQrString}
                    size={150}
                    level="M"
                    className="w-36 h-36 sm:w-40 sm:h-40"
                  />
                </div>
                <div className="mt-2 flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs shrink-0">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payable Amount:</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Received Button (Fixed at Bottom) */}
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="w-full py-3 sm:py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shrink-0 mt-1.5"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Payment Received</span>
              </button>
            </div>
          )}

          {/* ------------------------------------------------ */}
          {/* TAB 3: SPLIT PAYMENT FLOW */}
          {/* ------------------------------------------------ */}
          {paymentMethod === 'split' && (
            <div className="flex-1 flex flex-col justify-between my-1.5 animate-in fade-in duration-200 bg-slate-50 dark:bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 min-h-0 overflow-hidden">
              
              <div className="space-y-2 shrink-0">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-500" />
                    <span>Split Cash + UPI Payment</span>
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">Custom Cash Portion</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Cash Input */}
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Enter Cash Portion
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">₹</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={splitCashInput}
                        onChange={(e) => setSplitCashInput(e.target.value)}
                        className="w-full pl-7 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-lg font-black text-slate-900 dark:text-white outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Auto Calculated Remaining UPI Portion */}
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Remaining UPI Portion
                    </label>
                    <div className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 rounded-lg flex items-center justify-between font-mono">
                      <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold">UPI Needed:</span>
                      <span className="text-lg font-black text-purple-700 dark:text-purple-300">₹{splitUpiNum.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic QR Code for remaining UPI Amount */}
              {splitUpiNum > 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 my-1 min-h-0 overflow-hidden">
                  <QRCode
                    value={upiQrString}
                    size={120}
                    level="M"
                    className="w-28 h-28 sm:w-32 sm:h-32"
                  />
                  <p className="text-[10px] text-slate-600 font-black uppercase tracking-wider mt-1 font-mono">
                    Scan QR for Remaining UPI: ₹{splitUpiNum.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Complete Split Payment Button (Fixed at Bottom) */}
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={!isSplitValid || isSubmitting}
                className={`w-full py-3 sm:py-3.5 rounded-xl font-black text-sm uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 mt-1.5 ${
                  isSplitValid
                    ? 'bg-purple-600 hover:bg-purple-700 text-white active:scale-[0.98]'
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm & Complete Split Payment</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default CanteenPaymentCheckoutView;
