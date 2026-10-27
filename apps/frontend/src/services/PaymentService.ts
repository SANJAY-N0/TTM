import { Order, OrderItem, StudentProfile } from '../types';

export interface CreateOrderPayload {
  amount: number;
  studentId: string;
  studentName: string;
  phone: string;
  canteenId: string;
  items: OrderItem[];
  orderType: 'online' | 'walk-in';
  paymentMethod: string;
  orderCode?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  order_id: string;
  cashfree_order_id: string;
  payment_session_id: string;
  upi_qr_string?: string;
  amount: number;
  is_mock?: boolean;
  order: Order;
  error?: string;
}

export interface PaymentStatusResponse {
  order?: Order;
  error?: string;
}

export const PaymentService = {
  /**
   * Creates a new payment order on the backend
   */
  async createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    const token = localStorage.getItem('timetomeal_auth_token');
    const response = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Order creation failed' }));
      throw new Error(err.error || err.message || 'Order creation failed');
    }

    return response.json();
  },

  /**
   * Fetches payment status of a specific order
   */
  async getPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    const token = localStorage.getItem('timetomeal_auth_token');
    const response = await fetch(`/api/payments/status/${orderId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payment status for order ${orderId}`);
    }

    return response.json();
  },

  /**
   * Force payment simulation for testing / demo mode
   */
  async simulateSuccess(orderId: string): Promise<{ success: boolean; order?: Order }> {
    const response = await fetch('/api/payments/simulate-success', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });

    if (!response.ok) {
      throw new Error('Simulation failed');
    }

    return response.json();
  }
};
