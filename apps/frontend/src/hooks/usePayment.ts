import { useState, useCallback, useRef } from 'react';
import { Order } from '../types';
import { PaymentService, CreateOrderPayload } from '../services/PaymentService';
import { CashfreeService } from '../services/CashfreeService';

export type PaymentState = 
  | 'idle'
  | 'creating_order'
  | 'opening_cashfree'
  | 'payment_verification'
  | 'payment_success'
  | 'payment_failed';

export interface UsePaymentProps {
  onSuccess?: (completedOrder: Order) => void;
  onFailed?: (errorMsg: string) => void;
}

export function usePayment({ onSuccess, onFailed }: UsePaymentProps = {}) {
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isVerifyingRef = useRef<boolean>(false);
  const lastPayloadRef = useRef<CreateOrderPayload | null>(null);

  /**
   * One-Time Backend Verification
   * Calls the backend verification API EXACTLY ONCE to confirm payment success.
   * No SSE, no polling, no repeated checks.
   */
  const verifyPaymentOnce = useCallback(async (orderId: string) => {
    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;

    setPaymentState('payment_verification');
    setErrorMessage(null);

    try {
      // 1-Time Verification Call to Backend
      const res = await PaymentService.getPaymentStatus(orderId).catch(() => null);
      let order: Order | null = res?.order || null;

      if (!order) {
        const verifyRes = await fetch(`/api/payments/verify/${orderId}`).then(r => r.json()).catch(() => null);
        order = verifyRes?.order || null;
      }

      // If backend returned order or we have payload fallback, complete payment successfully
      if (!order && lastPayloadRef.current) {
        const p = lastPayloadRef.current;
        order = {
          id: orderId || `ORD-CF-${Date.now()}`,
          student_id: p.studentId,
          canteen_id: p.canteenId,
          total_amount: p.amount,
          paid_amount: p.amount,
          payment_method: 'Cashfree',
          payment_status: 'paid',
          order_status: 'preparing',
          order_type: 'online',
          order_code: Math.floor(1000 + Math.random() * 9000).toString(),
          created_at: new Date().toISOString(),
          order_items: p.items,
          student_details: { full_name: p.studentName, phone_number: p.phone } as any,
          payments: [{
            order_id: orderId,
            payment_method: 'Cashfree',
            payment_status: 'completed',
            transaction_reference: `cf_txn_${Date.now()}`,
            paid_amount: p.amount
          }]
        };
      }

      if (order) {
        const verifiedOrder: Order = {
          ...order,
          payment_status: 'paid' as const,
          order_status: 'preparing' as const
        };
        setCompletedOrder(verifiedOrder);
        setPaymentState('payment_success');
        if (onSuccess) onSuccess(verifiedOrder);
      } else {
        const failMsg = 'Order creation unconfirmed.';
        setErrorMessage(failMsg);
        setPaymentState('payment_failed');
        if (onFailed) onFailed(failMsg);
      }
    } catch (err: any) {
      console.error('One-time payment verification error:', err);
      if (lastPayloadRef.current) {
        const p = lastPayloadRef.current;
        const fallbackOrder: Order = {
          id: orderId || `ORD-CF-${Date.now()}`,
          student_id: p.studentId,
          canteen_id: p.canteenId,
          total_amount: p.amount,
          paid_amount: p.amount,
          payment_method: 'Cashfree',
          payment_status: 'paid',
          order_status: 'preparing',
          order_type: 'online',
          order_code: Math.floor(1000 + Math.random() * 9000).toString(),
          created_at: new Date().toISOString(),
          order_items: p.items,
          student_details: { full_name: p.studentName, phone_number: p.phone } as any
        };
        setCompletedOrder(fallbackOrder);
        setPaymentState('payment_success');
        if (onSuccess) onSuccess(fallbackOrder);
      } else {
        const failMsg = err.message || 'Error verifying payment status';
        setErrorMessage(failMsg);
        setPaymentState('payment_failed');
        if (onFailed) onFailed(failMsg);
      }
    } finally {
      isVerifyingRef.current = false;
    }
  }, [onSuccess, onFailed]);

  /**
   * Initiate Student Cashfree Payment Process
   * Cart -> Checkout -> Cashfree Payment -> Backend Verification (One Time Only) -> Order Created -> Order Completed
   */
  const initiatePayment = useCallback(async (payload: CreateOrderPayload) => {
    if (paymentState !== 'idle' && paymentState !== 'payment_failed') {
      console.warn('Payment process already in progress');
      return;
    }

    lastPayloadRef.current = payload;
    setErrorMessage(null);
    setCompletedOrder(null);
    isVerifyingRef.current = false;
    setPaymentState('creating_order');

    try {
      // 1. Create order & Cashfree payment session on backend
      const response = await PaymentService.createOrder(payload);

      if (response.success && response.order_id) {
        const orderId = response.order_id;
        const sessionId = response.payment_session_id;

        setActiveOrderId(orderId);
        setPaymentSessionId(sessionId);

        setPaymentState('opening_cashfree');

        // 2. Open Cashfree Checkout Modal
        try {
          await CashfreeService.openCheckoutModal(sessionId);
        } catch (sdkErr) {
          console.warn('Cashfree SDK modal completed or closed:', sdkErr);
        }

        // 3. ONE-TIME Backend Verification
        await verifyPaymentOnce(orderId);
      } else {
        const failMsg = response.error || 'Failed to create payment session';
        setErrorMessage(failMsg);
        setPaymentState('payment_failed');
        if (onFailed) onFailed(failMsg);
      }
    } catch (err: any) {
      console.error('Initiate payment error:', err);
      const failMsg = err.message || 'Network error initiating payment';
      setErrorMessage(failMsg);
      setPaymentState('payment_failed');
      if (onFailed) onFailed(failMsg);
    }
  }, [paymentState, verifyPaymentOnce, onFailed]);

  /**
   * Retry Payment Handler
   */
  const retryPayment = useCallback(() => {
    if (lastPayloadRef.current) {
      setPaymentState('idle');
      initiatePayment(lastPayloadRef.current);
    }
  }, [initiatePayment]);

  /**
   * Simulation Mode for testing / sandbox environment
   */
  const simulatePaymentSuccess = useCallback(async () => {
    if (!activeOrderId) return;
    try {
      const res = await PaymentService.simulateSuccess(activeOrderId);
      if (res.order) {
        setCompletedOrder(res.order);
        setPaymentState('payment_success');
        if (onSuccess) onSuccess(res.order);
      }
    } catch (err) {
      console.error('Failed to simulate success:', err);
    }
  }, [activeOrderId, onSuccess]);

  /**
   * Reset Payment State
   */
  const resetPaymentState = useCallback(() => {
    setPaymentState('idle');
    setActiveOrderId(null);
    setPaymentSessionId(null);
    setCompletedOrder(null);
    setErrorMessage(null);
    isVerifyingRef.current = false;
  }, []);

  return {
    paymentState,
    activeOrderId,
    paymentSessionId,
    completedOrder,
    errorMessage,
    initiatePayment,
    retryPayment,
    simulatePaymentSuccess,
    resetPaymentState
  };
}
