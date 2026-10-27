import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MenuItem, Order, OrderItem, User as AppUser, CanteenProfile, PaymentMethod } from '../../types';
import { getSafeFoodImage, handleImageError } from '../../utils/image';
import { playNotificationSound } from '../../utils/sound';
import { 
  Search, Plus, Minus, X, CreditCard, Banknote, Printer, Download,
  ChevronLeft, ShoppingCart, CheckCircle2, ChevronDown, IndianRupee,
  Keyboard, Filter, Zap, Trash2, ArrowRight, ShieldCheck, ChevronRight, 
  Wallet, Sparkles, Clock, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { CanteenPaymentCheckoutView } from './CanteenPaymentCheckoutView';

interface WalkInOrderViewProps {
  user: AppUser;
  menu: MenuItem[];
  onBack: () => void;
  onPlaceOrder: (order: Order) => void;
}

type PaymentOption = 'cash' | 'upi' | 'split';
type UpiGateway = 'Cashfree';

const POS_CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'beverage', label: 'Beverages' },
];

export const WalkInOrderView: React.FC<WalkInOrderViewProps> = ({ user, menu, onBack, onPlaceOrder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeMobileView, setActiveMobileView] = useState<'catalog' | 'cart'>('catalog');

  // POS Dedicated Payment Page State
  const [showPosPaymentPage, setShowPosPaymentPage] = useState(false);
  
  // Modal and Step States
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [isPaymentSelectorOpen, setIsPaymentSelectorOpen] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentOption>('cash');
  const [selectedUpiGateway, setSelectedUpiGateway] = useState<UpiGateway>('Cashfree');
  
  // Split payment inputs
  const [splitCashInput, setSplitCashInput] = useState<string>('');
  
  // Dedicated Payment Page State
  const [paymentState, setPaymentState] = useState<{
    orderId: string;
    orderCode: string;
    totalAmount: number;
    cashAmount: number;
    upiAmount: number;
    paymentMethod: 'Cash' | 'UPI' | 'Split';
    gateway: UpiGateway;
    upiQrString: string;
    status: 'waiting' | 'success' | 'failed' | 'timeout';
    timeLeft: number; // in seconds
    transactionId?: string;
    referenceId?: string;
  } | null>(null);

  // Receipt printed flag (mandated rule: Print first, then Start Next Bill)
  const [hasPrinted, setHasPrinted] = useState(false);

  // General completed state for Cash-only fast checks
  const [orderComplete, setOrderComplete] = useState<Order | null>(null);

  const canteenProfile = user.profile as CanteenProfile;

  // Filter menu items by search, category & diet
  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesDiet = 
        dietFilter === 'all' ? true :
        dietFilter === 'veg' ? item.is_veg === true :
        item.is_veg === false;
      return matchesSearch && matchesCategory && matchesDiet;
    });
  }, [menu, searchTerm, selectedCategory, dietFilter]);

  const addToCart = useCallback((item: MenuItem) => {
    if (!item.availability || item.stock_offline <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(i => i.menu_item_id === item.id);
      if (existing) {
        return prev.map(i => i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        menu_item_id: item.id,
        item_name: item.item_name,
        price: item.price,
        quantity: 1
      }];
    });
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.menu_item_id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.menu_item_id !== id));
  };

  const clearCart = () => setCart([]);

  // Keyboard Shortcuts Handler (Ctrl+1 to Ctrl+9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.ctrlKey || e.altKey) {
        const keyNum = parseInt(e.key, 10);
        if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 9) {
          e.preventDefault();
          const targetItem = filteredMenu[keyNum - 1];
          if (targetItem) {
            addToCart(targetItem);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredMenu, addToCart]);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal;

  // Split calculations
  const splitCashAmount = Number(splitCashInput) || 0;
  const splitUpiAmount = Math.max(0, total - splitCashAmount);

  // Countdown timer for UPI/Split QR Code
  useEffect(() => {
    if (!paymentState || paymentState.status !== 'waiting') return;

    const interval = setInterval(() => {
      setPaymentState(prev => {
        if (!prev) return null;
        if (prev.timeLeft <= 1) {
          clearInterval(interval);
          return { ...prev, timeLeft: 0, status: 'timeout' };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentState]);

  // Polling for UPI/Split order completion (every 2 seconds)
  useEffect(() => {
    if (!paymentState || paymentState.status !== 'waiting') return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status/${paymentState.orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order && data.order.payment_status === 'paid') {
            clearInterval(pollInterval);
            
            setPaymentState(prev => prev ? {
              ...prev,
              status: 'success',
              transactionId: data.order.cashfree_payment_id || `TXN_${Math.floor(100000 + Math.random() * 900000)}`,
              referenceId: data.order.cashfree_order_id || prev.orderId
            } : null);

            // Notify parent context of new order
            const completedOrder: Order = {
              id: paymentState.orderId,
              student_id: null,
              canteen_id: canteenProfile.canteen_id || 'c1',
              total_amount: paymentState.totalAmount,
              paid_amount: paymentState.totalAmount,
              order_status: 'delivered',
              order_type: 'walk-in',
              order_code: paymentState.orderCode,
              created_at: new Date().toISOString(),
              payment_method: paymentState.paymentMethod,
              payment_status: 'paid',
              order_items: [...cart],
              canteen_details: canteenProfile,
              payments: [{
                order_id: paymentState.orderId,
                payment_method: paymentState.paymentMethod === 'Split' ? 'UPI' : 'Cashfree',
                payment_status: 'completed',
                paid_amount: paymentState.totalAmount
              }]
            };

            onPlaceOrder(completedOrder);
            playNotificationSound('payment_success');
          }
        }
      } catch (err) {
        console.warn('Error polling order status:', err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [paymentState, cart, canteenProfile, onPlaceOrder]);

  // SSE Listener for real-time payment updates on POS screen
  useEffect(() => {
    if (!paymentState || paymentState.status !== 'waiting') return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/payments/stream');
      eventSource.addEventListener('payment_update', (e: MessageEvent) => {
        try {
          const updatedOrder: Order = JSON.parse(e.data);
          if (updatedOrder && updatedOrder.id === paymentState.orderId && updatedOrder.payment_status === 'paid') {
            setPaymentState(prev => prev ? {
              ...prev,
              status: 'success',
              transactionId: updatedOrder.cashfree_payment_id || `TXN_${Math.floor(100000 + Math.random() * 900000)}`,
              referenceId: updatedOrder.cashfree_order_id || prev.orderId
            } : null);

            const completedOrder: Order = {
              id: paymentState.orderId,
              student_id: null,
              canteen_id: canteenProfile.canteen_id || 'c1',
              total_amount: paymentState.totalAmount,
              paid_amount: paymentState.totalAmount,
              order_status: 'delivered',
              order_type: 'walk-in',
              order_code: paymentState.orderCode,
              created_at: new Date().toISOString(),
              payment_method: paymentState.paymentMethod,
              payment_status: 'paid',
              order_items: [...cart],
              canteen_details: canteenProfile,
              payments: [{
                order_id: paymentState.orderId,
                payment_method: paymentState.paymentMethod === 'Split' ? 'UPI' : 'Cashfree',
                payment_status: 'completed',
                paid_amount: paymentState.totalAmount
              }]
            };

            onPlaceOrder(completedOrder);
            playNotificationSound('payment_success');
          }
        } catch (err) {
          console.warn('Walk-in SSE parse error:', err);
        }
      });
    } catch (err) {
      console.warn('Walk-in SSE error:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [paymentState, cart, canteenProfile, onPlaceOrder]);

  // Fetch Canteen Owner UPI ID from settings
  const getCanteenUpiId = () => {
    try {
      const saved = localStorage.getItem('hb_bank_details');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.upi_id) return parsed.upi_id;
      }
    } catch (e) {
      console.warn('Error reading bank details:', e);
    }
    return (canteenProfile as any)?.upi_id || 'timetomeal@hdfcbank';
  };

  // Proceed to open POS Payment Checkout Page
  const handleConfirmOrder = () => {
    if (cart.length === 0) return;
    setShowPosPaymentPage(true);
  };

  const handleProceedToPayment = () => {
    if (cart.length === 0) return;
    setShowPosPaymentPage(true);
  };

  // Create payment order API handler for UPI/Split
  const triggerOnlinePayment = async (mode: 'upi' | 'split') => {
    setIsProcessing(true);
    try {
      const isSplitMode = mode === 'split';
      const cashAmt = isSplitMode ? splitCashAmount : 0;
      const upiAmt = isSplitMode ? splitUpiAmount : total;

      const payload = {
        amount: total,
        studentId: null,
        studentName: 'Walk-in Counter Guest',
        phone: '9999999999',
        canteenId: canteenProfile.canteen_id || 'c1',
        items: cart,
        orderType: 'walk-in',
        paymentMethod: isSplitMode ? 'Split' : selectedUpiGateway,
        gateway: selectedUpiGateway,
        cashAmount: cashAmt,
        upiAmount: upiAmt
      };

      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Order creation failed');
      const data = await res.json();

      if (data.success) {
        setIsPaymentSelectorOpen(false);
        setHasPrinted(false);

        const upiId = "9488116549@pthdfc";
        const merchant = "Canteen Bite";
        const note = "Food Payment";
        const customUpiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchant)}&am=${upiAmt}&cu=INR&tr=${data.order_id}&tn=${encodeURIComponent(note)}`;

        setPaymentState({
          orderId: data.order_id,
          orderCode: data.order.order_code || `W-${Math.floor(1000 + Math.random() * 9000)}`,
          totalAmount: total,
          cashAmount: cashAmt,
          upiAmount: upiAmt,
          paymentMethod: isSplitMode ? 'Split' : 'UPI',
          gateway: selectedUpiGateway,
          upiQrString: customUpiString,
          status: 'waiting',
          timeLeft: 300 // 5 Minutes
        });
        playNotificationSound('payment_received');
      }
    } catch (err) {
      console.error(err);
      alert('Error initializing UPI Payment session. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Fast cash checkout completion
  const handleCashCheckout = async (received: number) => {
    if (received < total) return;
    setIsProcessing(true);
    try {
      const payload = {
        amount: total,
        studentId: null,
        studentName: 'Walk-in Counter Guest',
        phone: '9999999999',
        canteenId: canteenProfile.canteen_id || 'c1',
        items: cart,
        orderType: 'walk-in',
        paymentMethod: 'Cash',
        cashAmount: total,
        upiAmount: 0
      };

      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Cash order creation failed');
      const data = await res.json();

      if (data.success) {
        const completedOrder: Order = {
          id: data.order_id,
          student_id: null,
          canteen_id: canteenProfile.canteen_id || 'c1',
          total_amount: total,
          paid_amount: total,
          order_status: 'delivered',
          order_type: 'walk-in',
          order_code: data.order.order_code || `W-${Math.floor(1000 + Math.random() * 9000)}`,
          created_at: new Date().toISOString(),
          payment_method: 'Cash',
          payment_status: 'paid',
          order_items: [...cart],
          canteen_details: canteenProfile,
          payments: [{
            order_id: data.order_id,
            payment_method: 'cash',
            payment_status: 'completed',
            paid_amount: total
          }]
        };

        onPlaceOrder(completedOrder);
        setOrderComplete(completedOrder);
        setIsPaymentSelectorOpen(false);
        setHasPrinted(false);
        playNotificationSound('payment_success');
      }
    } catch (err) {
      console.error(err);
      alert('Error finalizing cash transaction.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Simulating payment success for local sandbox/testing
  const handleSimulateSuccess = async () => {
    if (!paymentState) return;
    try {
      const res = await fetch('/api/payments/simulate-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: paymentState.orderId })
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentState(prev => prev ? {
          ...prev,
          status: 'success',
          transactionId: data.order?.cashfree_payment_id || `SIM_TXN_${Math.floor(100000 + Math.random() * 900000)}`,
          referenceId: data.order?.cashfree_order_id || prev.orderId
        } : null);

        const completedOrder: Order = {
          id: paymentState.orderId,
          student_id: null,
          canteen_id: canteenProfile.canteen_id || 'c1',
          total_amount: paymentState.totalAmount,
          paid_amount: paymentState.totalAmount,
          order_status: 'delivered',
          order_type: 'walk-in',
          order_code: paymentState.orderCode,
          created_at: new Date().toISOString(),
          payment_method: paymentState.paymentMethod,
          payment_status: 'paid',
          order_items: [...cart],
          canteen_details: canteenProfile,
          payments: [{
            order_id: paymentState.orderId,
            payment_method: paymentState.paymentMethod === 'Split' ? 'UPI' : 'Cashfree',
            payment_status: 'completed',
            paid_amount: paymentState.totalAmount
          }]
        };
        onPlaceOrder(completedOrder);
        playNotificationSound('payment_success');
      }
    } catch (err) {
      console.warn('Simulation failed:', err);
    }
  };

  // Cancel and go back to billing (cart kept intact)
  const handleCancelPayment = () => {
    setPaymentState(null);
  };

  // Force poll update manually
  const handleForcePoll = async () => {
    if (!paymentState) return;
    try {
      const res = await fetch(`/api/payments/status/${paymentState.orderId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.order && data.order.payment_status === 'paid') {
          setPaymentState(prev => prev ? {
            ...prev,
            status: 'success',
            transactionId: data.order.cashfree_payment_id || `TXN_${Math.floor(100000 + Math.random() * 900000)}`,
            referenceId: data.order.cashfree_order_id || prev.orderId
          } : null);
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Format countdown timer
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle Receipt Printing & Enable Next Bill
  const handlePrintReceipt = () => {
    window.print();
    setHasPrinted(true);
  };

  const resetAllAndStartNext = () => {
    setCart([]);
    setOrderComplete(null);
    setPaymentState(null);
    setHasPrinted(false);
  };

  // Automated Receipt Printing & Start Next Bill on payment completion
  // (Removed auto-printing as per user request to speed up flow)
  useEffect(() => {
    // Left empty or we can just remove it entirely.
  }, [paymentState?.status, hasPrinted]);

  useEffect(() => {
    // Left empty or we can just remove it entirely.
  }, [orderComplete, hasPrinted]);

  const isSuccess = paymentState?.status === 'success';
  const isTimeout = paymentState?.status === 'timeout';
  const isWaiting = paymentState?.status === 'waiting';

  return (
    <div className="font-sans h-full overflow-hidden flex flex-col flex-1">
      
      {/* SCREEN RENDERER */}
      <div className="print:hidden h-full overflow-hidden flex flex-col flex-1">
        {showPosPaymentPage ? (
          <CanteenPaymentCheckoutView
            cart={cart}
            totalAmount={total}
            canteenProfile={canteenProfile}
            canteenUpiId={getCanteenUpiId()}
            onCompletePayment={async (details) => {
              const payload = {
                amount: total,
                studentId: null,
                studentName: 'Walk-in Counter Guest',
                phone: '9999999999',
                canteenId: canteenProfile?.canteen_id || 'c1',
                items: cart,
                orderType: 'walk-in',
                paymentMethod: details.paymentMethod,
                cashAmount: details.cashAmount,
                upiAmount: details.upiAmount
              };

              const res = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              if (!res.ok) throw new Error('Order creation failed');
              const data = await res.json();

              if (data.success) {
                const completedOrder: Order = {
                  id: data.order_id,
                  student_id: undefined,
                  canteen_id: canteenProfile?.canteen_id || 'c1',
                  total_amount: total,
                  paid_amount: total,
                  order_status: 'delivered',
                  order_type: 'walk-in',
                  order_code: data.order?.order_code || `W-${Math.floor(1000 + Math.random() * 9000)}`,
                  created_at: new Date().toISOString(),
                  payment_method: details.paymentMethod,
                  payment_status: 'paid',
                  order_items: [...cart],
                  canteen_details: canteenProfile,
                  payments: [{
                    order_id: data.order_id,
                    payment_method: details.paymentMethod,
                    payment_status: 'completed',
                    paid_amount: total
                  }]
                };

                onPlaceOrder(completedOrder);
                playNotificationSound('payment_success');
                return completedOrder;
              }
              return null;
            }}
            onCancel={() => setShowPosPaymentPage(false)}
            onBackToDashboard={() => {
              setShowPosPaymentPage(false);
              clearCart();
              onBack();
            }}
            onContinueBilling={() => {
              setShowPosPaymentPage(false);
              clearCart();
            }}
          />
        ) : paymentState ? (
          <div className="min-h-[85vh] bg-slate-50 p-4 pb-24 sm:p-4 flex flex-col items-center justify-center font-sans">
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row animate-in fade-in duration-200">
              
              {/* Left Column: Order Summary Info */}
              <div className="p-4 md:w-1/2 bg-slate-900 text-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-1 bg-[#e14b18] text-white text-xs font-black rounded-lg">
                      TOKEN #{paymentState.orderCode}
                    </span>
                    <span className="text-slate-400 text-xs font-semibold">
                      Order: {paymentState.orderId.substring(0, 15)}...
                    </span>
                  </div>

                  <h2 className="text-xl font-extrabold tracking-tight text-white mb-2">Counter Walk-In Bill</h2>
                  <div className="border-t border-slate-800 my-3"></div>

                  {/* Items Summary list */}
                  <div className="space-y-2 max-h-48 overflow-y-auto mb-4 pr-1">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-medium">
                        <span className="text-slate-300">
                          <span className="font-bold text-white mr-1.5">{item.quantity}x</span>
                          {item.item_name}
                        </span>
                        <span className="text-slate-200">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Total Amount:</span>
                    <span className="text-lg font-black text-white">₹{paymentState.totalAmount.toFixed(2)}</span>
                  </div>
                  
                  {paymentState.paymentMethod === 'Split' && (
                    <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                      <div className="flex justify-between text-slate-400">
                        <span>Cash Portion (Paid):</span>
                        <span className="font-bold text-white">₹{paymentState.cashAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400">
                        <span>UPI Portion (To Pay):</span>
                        <span className="font-black">₹{paymentState.upiAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Gateway Selected:</span>
                    <span className="font-bold text-emerald-400 uppercase tracking-wider">{paymentState.gateway}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Status & QR Code */}
              <div className="p-4 md:w-1/2 flex flex-col items-center justify-center bg-white">
                
                {/* Waiting for payment state */}
                {isWaiting && (
                  <div className="w-full flex flex-col items-center text-center space-y-4">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
                      Waiting for Payment...
                    </div>

                    {/* Simulated/Real QR Code Container */}
                    <div className="p-3 bg-white border-2 border-dashed border-slate-200 rounded-2xl shadow-xs">
                      {paymentState.upiQrString ? (
                        <div className="flex flex-col items-center justify-center p-1">
                          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                            <QRCode 
                              value={paymentState.upiQrString}
                              size={160}
                              level="M"
                              className="w-40 h-40"
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider flex items-center gap-1">
                            <ScanIcon /> Scan to Pay ₹{paymentState.paymentMethod === 'Split' ? paymentState.upiAmount : paymentState.totalAmount}
                          </span>
                        </div>
                      ) : (
                        <div className="w-40 h-40 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-xs text-slate-400 font-bold">
                          Loading QR Code...
                        </div>
                      )}
                    </div>

                    {/* Countdown Timer */}
                    <div className="flex items-center gap-1.5 text-slate-700 text-sm font-black">
                      <Clock className="w-4 h-4 text-[#e14b18]" />
                      <span>QR expires in: </span>
                      <span className="font-mono text-[#e14b18]">{formatTime(paymentState.timeLeft)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col w-full gap-2 pt-2">
                      <button 
                        onClick={handleSimulateSuccess}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer animate-pulse"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Confirm Payment & Complete Bill
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={handleForcePoll}
                          className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Refresh Status
                        </button>
                        <button 
                          onClick={handleCancelPayment}
                          className="py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Cancel Payment
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success state */}
                {isSuccess && (
                  <div className="w-full flex flex-col items-center text-center space-y-4 py-4 animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-md animate-bounce">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-900">Payment Successful</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                        Total Paid: ₹{paymentState.totalAmount.toFixed(2)}
                      </p>
                    </div>

                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-left text-xs space-y-1.5 font-medium">
                      <div className="flex justify-between text-slate-500">
                        <span>Transaction ID:</span>
                        <span className="font-mono text-slate-900 font-bold">{paymentState.transactionId || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Reference Ref:</span>
                        <span className="font-mono text-slate-900 font-bold">{paymentState.referenceId?.substring(0, 16) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Method:</span>
                        <span className="text-slate-900 font-black uppercase">{paymentState.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Time:</span>
                        <span className="text-slate-900 font-semibold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex flex-col w-full gap-2 pt-2">
                      <button 
                        onClick={handlePrintReceipt}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" /> Print / Download Receipt
                      </button>
                      
                      <button 
                        onClick={resetAllAndStartNext}
                        className="w-full py-3 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer bg-[#e14b18] hover:bg-[#c93f12]"
                      >
                        <Plus className="w-4 h-4" /> Start Next Bill
                      </button>
                    </div>
                  </div>
                )}

                {/* Timeout state */}
                {isTimeout && (
                  <div className="w-full flex flex-col items-center text-center space-y-4 py-4 animate-in fade-in duration-200">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-xs">
                      <AlertCircle className="w-9 h-9" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-900">QR Code Expired</h3>
                      <p className="text-xs text-slate-500 font-semibold">The 5-minute payment session has timed out.</p>
                    </div>

                    <div className="flex flex-col w-full gap-2 pt-2">
                      <button 
                        onClick={() => triggerOnlinePayment(paymentState.paymentMethod === 'Split' ? 'split' : 'upi')}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" /> Generate New QR Code
                      </button>
                      <button 
                        onClick={handleCancelPayment}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-all cursor-pointer"
                      >
                        Cancel Payment
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>
        ) : orderComplete ? (
          <div className="min-h-[80vh] flex items-center justify-center p-4 pb-24 sm:p-4 font-sans">
            <div className="bg-white w-full max-w-sm rounded-2xl p-4 border border-slate-200 shadow-xl flex flex-col items-center animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 text-center">Order Completed</h2>
              <p className="text-slate-500 font-semibold text-xs tracking-wider uppercase mt-0.5 mb-4">
                Token #{orderComplete.order_code}
              </p>
              
              <div className="w-full bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200 space-y-2 text-xs">
                {orderComplete.order_items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between font-medium text-slate-700">
                    <span>{item.quantity}x {item.item_name}</span>
                    <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-2 flex flex-col gap-1">
                  <div className="flex justify-between font-bold text-sm text-slate-900">
                    <span>Total Paid</span>
                    <span className="text-emerald-600">₹{orderComplete.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-medium text-slate-500">
                    <span>Payment</span>
                    <span className="uppercase text-slate-800 font-bold">{orderComplete.payment_method}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col w-full gap-2">
                <button 
                  onClick={handlePrintReceipt}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print / Download Receipt
                </button>
                
                <button 
                  onClick={resetAllAndStartNext}
                  className="w-full py-3 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer bg-[#e14b18] hover:bg-[#c93f12]"
                >
                  <Plus className="w-4 h-4" /> Start Next Bill
                </button>

                <button 
                  onClick={onBack}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-all cursor-pointer"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 font-sans text-slate-800">
      
      {/* COMPACT TOOLBAR & FILTERS */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Search Bar & Diet Toggle */}
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input 
              type="text" 
              placeholder="Search items or press Ctrl+1..9..." 
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Diet Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium shrink-0">
            <button
              onClick={() => setDietFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                dietFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietFilter('veg')}
              className={`px-2 py-1 rounded-md text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                dietFilter === 'veg' ? 'bg-white text-emerald-700 font-bold shadow-2xs' : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Veg
            </button>
            <button
              onClick={() => setDietFilter('non-veg')}
              className={`px-2 py-1 rounded-md text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                dietFilter === 'non-veg' ? 'bg-white text-red-700 font-bold shadow-2xs' : 'text-slate-500 hover:text-red-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Non-Veg
            </button>
          </div>
        </div>

        {/* Right: Quick Category Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 shrink-0">
          {POS_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

      </div>

      {/* POS MAIN DUAL COLUMN VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        
        {/* LEFT PRODUCT CATALOG GRID (8 COLS ON DESKTOP) */}
        <div className={`lg:col-span-7 xl:col-span-8 space-y-2 ${
          activeMobileView === 'catalog' ? 'block' : 'hidden lg:block'
        }`}>
          
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-600">
              Menu Catalog ({filteredMenu.length} items)
            </span>
            <span className="text-[11px] text-slate-400">
              Click item to add • <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px]">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px]">1..9</kbd>
            </span>
          </div>

          {filteredMenu.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 space-y-2">
              <p className="text-xs font-semibold text-slate-600">No menu items match criteria</p>
              <button onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setDietFilter('all'); }} className="text-xs text-emerald-600 font-bold hover:underline">
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 max-h-[calc(100vh-175px)] overflow-y-auto pr-1">
              {filteredMenu.map((item, index) => {
                const isOutOfStock = !item.availability || item.stock_offline <= 0;
                const shortcutNum = index < 9 ? index + 1 : null;
                const isVeg = item.is_veg !== false;
                const cartQuantity = cart.find(c => c.menu_item_id === item.id)?.quantity || 0;

                return (
                  <button 
                    key={item.id}
                    onClick={() => addToCart(item)}
                    disabled={isOutOfStock}
                    className={`bg-white border rounded-xl p-2 flex flex-col justify-between transition-all relative text-left group hover:border-emerald-500 hover:shadow-sm ${
                      cartQuantity > 0 ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/20' : 'border-slate-200'
                    } ${
                      isOutOfStock ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer active:scale-98'
                    }`}
                  >
                    {/* Top Row: Shortcut & Cart Count Badge */}
                    <div className="flex items-center justify-between w-full mb-1">
                      {shortcutNum ? (
                        <span className="px-1 py-0.2 bg-slate-900 text-emerald-400 text-[9px] font-bold rounded">
                          Ctrl+{shortcutNum}
                        </span>
                      ) : <span />}

                      {cartQuantity > 0 && (
                        <span className="px-1.5 py-0.2 bg-emerald-600 text-white font-bold text-[10px] rounded-full">
                          {cartQuantity} in cart
                        </span>
                      )}
                    </div>

                    {/* Compact Image */}
                    <div className="w-full h-20 bg-slate-100 rounded-lg overflow-hidden relative mb-1.5">
                      <img 
                        src={getSafeFoodImage(item.imageUrl || item.image_url, item.item_name)} 
                        onError={(e) => handleImageError(e, item.item_name)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                        alt={item.item_name} 
                      />
                      
                      <span className={`absolute top-1 left-1 w-2.5 h-2.5 rounded-full border border-white ${
                        isVeg ? 'bg-emerald-500' : 'bg-red-500'
                      }`} title={isVeg ? 'Veg' : 'Non-Veg'} />

                      <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-slate-900/80 text-white text-[9px] font-medium">
                        Qty: {item.stock_offline}
                      </span>

                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
                          <span className="text-white font-bold text-[10px] uppercase tracking-wider bg-red-600 px-1.5 py-0.5 rounded">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Name & Price */}
                    <div>
                      <h4 className="font-semibold text-slate-800 text-xs truncate leading-snug">
                        {item.item_name}
                      </h4>
                      <div className="flex items-center justify-between mt-0.5 pt-0.5 border-t border-slate-100">
                        <span className="text-emerald-700 font-bold text-xs">₹{item.price}</span>
                        <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                          <Plus className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT FIXED COUNTER BILL PANEL (4 COLS ON DESKTOP) */}
        <div className={`lg:col-span-5 xl:col-span-4 lg:sticky lg:top-2 ${
          activeMobileView === 'cart' ? 'block' : 'hidden lg:block'
        }`}>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[60vh] lg:h-[calc(100vh-140px)]">
            
            {/* Header */}
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs tracking-tight">Counter Bill</span>
                <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 rounded-full text-[10px] font-bold">
                  {cart.reduce((a, b) => a + b.quantity, 0)} items
                </span>
              </div>

              {cart.length > 0 && (
                <button 
                  onClick={clearCart}
                  className="text-[11px] text-slate-400 hover:text-red-400 font-medium transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Scrollable Cart Item List */}
            <div className="p-3 overflow-y-auto flex-1 space-y-1.5 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <ShoppingCart className="w-8 h-8 text-slate-200 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">Bill is currently empty</p>
                  <p className="text-[10px] text-slate-400">Select items from the menu catalog on the left</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.menu_item_id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h5 className="font-semibold text-slate-800 text-xs truncate leading-tight">{item.item_name}</h5>
                      <p className="text-[10px] text-slate-500">₹{item.price} x {item.quantity} = <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span></p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
                        <button 
                          onClick={() => updateQuantity(item.menu_item_id, -1)}
                          className="w-4 h-4 bg-white rounded text-slate-600 hover:text-red-600 flex items-center justify-center shadow-2xs cursor-pointer"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="font-bold text-xs w-5 text-center text-slate-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.menu_item_id, 1)}
                          className="w-4 h-4 bg-white rounded text-slate-600 hover:text-emerald-600 flex items-center justify-center shadow-2xs cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.menu_item_id)}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bill Calculations & Checkout Button */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2.5 shrink-0">
              
              {/* Amounts */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-800">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                  <span className="font-bold text-slate-900 text-sm">Grand Total</span>
                  <span className="font-extrabold text-lg text-emerald-600">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Proceed Action */}
              <button
                type="button"
                disabled={cart.length === 0 || isProcessing}
                onClick={handleConfirmOrder}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Confirm Order (₹{total.toFixed(2)})
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>

          </div>
        </div>

      </div>

      {/* STEP 0: ORDER SUMMARY */}
      {showOrderSummary && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[9998] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
            
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <h2 className="font-black text-xl tracking-tight">Order Summary</h2>
              <button 
                onClick={() => setShowOrderSummary(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Order Number</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">Pending</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Token</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">Pending</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Selected Items</h3>
                <div className="space-y-3">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                      <div className="flex-1 pr-4">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-slate-500 font-medium">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white shrink-0">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 shrink-0">
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Subtotal</span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">GST</span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">Included</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                  <span className="text-slate-900 dark:text-white font-black">Total Amount</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowOrderSummary(false)}
                  className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={handleProceedToPayment}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  Proceed to Payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* STEP 1: PAYMENT METHOD SELECTION DIALOG / MODAL */}
      {isPaymentSelectorOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-b-none rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 pb-safe">
            
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm tracking-tight">Select Payment Method</h3>
              </div>
              <button 
                onClick={() => setIsPaymentSelectorOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content & Selector */}
            <div className="p-4 space-y-4">
              
              {/* Grand total display */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Due:</span>
                <span className="text-xl font-black text-emerald-600">₹{total.toFixed(2)}</span>
              </div>

              {/* Three selection options */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMode('cash')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedPaymentMode === 'cash'
                      ? 'border-emerald-500 bg-emerald-50/20 text-emerald-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <Banknote className="w-6 h-6 shrink-0" />
                  <span className="text-xs font-black">Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMode('upi')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedPaymentMode === 'upi'
                      ? 'border-emerald-500 bg-emerald-50/20 text-emerald-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-6 h-6 shrink-0" />
                  <span className="text-xs font-black">UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPaymentMode('split');
                    setSplitCashInput(Math.floor(total / 2).toString());
                  }}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedPaymentMode === 'split'
                      ? 'border-emerald-500 bg-emerald-50/20 text-emerald-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <Layers className="w-6 h-6 shrink-0" />
                  <span className="text-xs font-black">Split Pay</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-3"></div>

              {/* DYNAMIC SCREEN 1: CASH PAYMENT OPTIONS */}
              {selectedPaymentMode === 'cash' && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-600">Enter Cash Received</span>
                    {splitCashAmount >= total && (
                      <span className="text-emerald-700 font-black">
                        Change Due: ₹{(splitCashAmount - total).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="number"
                        placeholder={`Min ₹${total.toFixed(2)}`}
                        value={splitCashInput}
                        onChange={(e) => setSplitCashInput(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      {[50, 100, 200, 500].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSplitCashInput(amt.toString())}
                          className="px-2.5 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-black rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={splitCashAmount < total || isProcessing}
                    onClick={() => handleCashCheckout(splitCashAmount)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm Cash Payment (₹{total.toFixed(2)})
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* DYNAMIC SCREEN 2: UPI SELECTION SCREEN */}
              {selectedPaymentMode === 'upi' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-extrabold text-slate-600">Payment Gateway Provider</span>
                    <div className="w-full">
                      <div className="py-2 px-3 rounded-lg text-xs font-bold bg-emerald-600 text-white border border-emerald-600 shadow-2xs flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Cashfree Payment Gateway</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => triggerOnlinePayment('upi')}
                    className="w-full py-3 bg-[#e14b18] hover:bg-[#c93f12] text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        Launch Cashfree Online Payment (₹{total.toFixed(2)})
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* DYNAMIC SCREEN 3: SPLIT PAYMENT OPTIONS */}
              {selectedPaymentMode === 'split' && (
                <div className="space-y-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-extrabold text-slate-600">Cash Received Amount</span>
                      <div className="relative mt-1">
                        <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                        <input
                          type="number"
                          placeholder="Cash Part"
                          value={splitCashInput}
                          onChange={(e) => setSplitCashInput(e.target.value)}
                          className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="font-extrabold text-slate-600">Remaining Cashfree UPI Part</span>
                      <div className="relative mt-1">
                        <span className="block w-full py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-emerald-600 text-center">
                          ₹{splitUpiAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Gateway for UPI Part</span>
                    <div className="w-full">
                      <div className="py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white border border-emerald-600 shadow-2xs flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Cashfree Payment Gateway</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={splitUpiAmount <= 0 || splitCashAmount >= total || isProcessing}
                    onClick={() => triggerOnlinePayment('split')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        Generate UPI QR for ₹{splitUpiAmount.toFixed(2)}
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}
      </div>
      )}
      </div>

      {/* HIGH-FIDELITY POS THERMAL RECEIPT (Only visible during print) */}
      <div className="print-area hidden print:block font-mono text-slate-900 text-xs max-w-[80mm] mx-auto p-4 space-y-4 bg-white border border-slate-200 rounded-lg shadow-xs">
        <div className="text-center space-y-1">
          <h1 className="text-sm font-extrabold tracking-tight uppercase text-slate-900">
            {canteenProfile?.canteen_name || 'TimeToMeal Canteen'}
          </h1>
          <p className="text-[9px] text-slate-600">
            {canteenProfile?.address || 'Campus Hostel Canteen'}
          </p>
          {canteenProfile?.contact_number && (
            <p className="text-[9px] text-slate-600">
              Ph: {canteenProfile.contact_number}
            </p>
          )}
          <p className="text-[9px] text-slate-400 border-b border-dashed border-slate-300 pb-2">
            -----------------------------------------
          </p>
        </div>

        <div className="space-y-1.5 text-[10px]">
          <div className="flex justify-between font-black text-xs text-slate-900">
            <span>TOKEN NUMBER:</span>
            <span className="text-sm font-black bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              #{paymentState?.orderCode || orderComplete?.order_code || 'W-00'}
            </span>
          </div>
          <div className="flex justify-between pt-1">
            <span>Date/Time:</span>
            <span className="font-medium">
              {new Date().toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Bill/Order ID:</span>
            <span className="font-mono text-[9px] text-slate-600">
              {paymentState?.orderId || orderComplete?.id || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Customer Type:</span>
            <span className="font-bold">Counter Walk-In</span>
          </div>
          <p className="text-[9px] text-slate-400 border-b border-dashed border-slate-300 pb-2">
            -----------------------------------------
          </p>
        </div>

        {/* Item details */}
        <div className="space-y-1 text-[10px]">
          <div className="grid grid-cols-12 font-bold uppercase border-b border-slate-200 pb-1 mb-1 text-slate-900">
            <span className="col-span-2">Qty</span>
            <span className="col-span-7">Item Name</span>
            <span className="col-span-3 text-right">Amount</span>
          </div>
          {(paymentState ? cart : orderComplete?.order_items || []).map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 py-0.5 text-slate-800">
              <span className="col-span-2 font-bold">{item.quantity}x</span>
              <span className="col-span-7 truncate">{item.item_name}</span>
              <span className="col-span-3 text-right font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <p className="text-[9px] text-slate-400 border-b border-dashed border-slate-300 pt-1 pb-2">
            -----------------------------------------
          </p>
        </div>

        {/* Financial summary */}
        <div className="space-y-1 text-[10px] font-medium text-slate-800">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{(paymentState ? total : orderComplete?.total_amount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs font-black pt-1 border-t border-dashed border-slate-200 text-slate-900">
            <span>GRAND TOTAL:</span>
            <span className="text-xs font-black text-emerald-700">₹{(paymentState ? total : orderComplete?.total_amount || 0).toFixed(2)}</span>
          </div>
          <p className="text-[9px] text-slate-400 border-b border-dashed border-slate-300 pt-1 pb-2">
            -----------------------------------------
          </p>
        </div>

        {/* Payment details */}
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between font-bold text-slate-900">
            <span>Payment Method:</span>
            <span className="uppercase text-emerald-700 font-extrabold">
              {paymentState?.paymentMethod || orderComplete?.payment_method || 'CASH'}
            </span>
          </div>
          {paymentState?.paymentMethod === 'Split' && (
            <div className="pl-3 space-y-0.5 text-[9px] text-slate-600 font-semibold">
              <div className="flex justify-between">
                <span>- Cash Portion (Paid):</span>
                <span>₹{paymentState.cashAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>- UPI Portion (QR Paid):</span>
                <span>₹{paymentState.upiAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
          {paymentState?.transactionId && (
            <div className="flex justify-between text-[9px] text-slate-500 pt-0.5">
              <span>Txn ID:</span>
              <span className="font-mono font-bold text-slate-700">{paymentState.transactionId}</span>
            </div>
          )}
          <p className="text-[9px] text-slate-400 border-b border-dashed border-slate-300 pt-1 pb-2">
            -----------------------------------------
          </p>
        </div>

        <div className="text-center space-y-2 pt-1">
          <p className="text-[10px] font-black uppercase text-slate-700">Thank You! Visit Again</p>
          <p className="text-[8px] text-slate-400">TimeToMeal Smart POS Cloud System</p>
          
          {/* A mock thermal receipt barcode using styled HTML lines */}
          <div className="flex justify-center items-center gap-[1.2px] h-6 pt-1 opacity-60">
            {[1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2].map((w, i) => (
              <div 
                key={i} 
                className="bg-black h-full" 
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
          <p className="text-[7px] tracking-[3px] font-mono text-slate-400 pt-0.5">
            {(paymentState?.orderId || orderComplete?.id || '00000000').substring(0, 12).toUpperCase()}
          </p>
        </div>
      </div>

      {/* Mobile view floating toggle bar */}
      <div className="lg:hidden fixed bottom-18 left-4 right-4 z-30 flex gap-2">
        <button
          onClick={() => setActiveMobileView('catalog')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md border transition-all ${
            activeMobileView === 'catalog'
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          Catalog ({filteredMenu.length})
        </button>
        <button
          onClick={() => setActiveMobileView('cart')}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md border transition-all relative ${
            activeMobileView === 'cart'
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          <ShoppingCart className="w-4 h-4 animate-bounce" />
          Bill ({cart.reduce((a, b) => a + b.quantity, 0)})
          {cart.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          )}
        </button>
      </div>

    </div>
  );
};

// Simple visual ScanIcon and Scan label support
const ScanIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scan text-emerald-600 animate-pulse">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
    <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
    <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
  </svg>
);

export default WalkInOrderView;
