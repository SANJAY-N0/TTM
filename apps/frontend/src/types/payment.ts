export type PaymentMethod = 'CASH' | 'UPI' | 'SPLIT' | 'CASHFREE' | 'cashfree' | 'cod';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'paid' | 'pending_cash_payment' | 'advance_paid';

export interface PaymentTransaction {
  id: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_ref?: string;
  created_at: string;
}
