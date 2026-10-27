export const PaymentAPI = {
  async createCashfreeOrder(paymentPayload: {
    orderId: string;
    orderAmount: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  }): Promise<{ paymentSessionId: string; cfOrderId: string }> {
    const token = localStorage.getItem('timetomeal_auth_token');
    const response = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        amount: paymentPayload.orderAmount,
        studentName: paymentPayload.customerName,
        phone: paymentPayload.customerPhone,
        paymentMethod: 'cashfree',
        orderType: 'online'
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Payment creation failed' }));
      throw new Error(err.message || 'Payment creation failed');
    }
    const data = await response.json();
    return { paymentSessionId: data.payment_session_id, cfOrderId: data.cashfree_order_id || data.order_id };
  },

  async verifyPaymentStatus(orderId: string): Promise<{ status: string; transactionId?: string }> {
    const token = localStorage.getItem('timetomeal_auth_token');
    const response = await fetch(`/api/payments/verify/${orderId}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!response.ok) {
      throw new Error('Payment verification failed');
    }
    return response.json();
  }
};
