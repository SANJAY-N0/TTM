import { Order } from '../types';

export const OrderAPI = {
  async getOrders(params?: { studentId?: string; canteenId?: string; status?: string }): Promise<Order[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const url = `/api/orders${query ? `?${query}` : ''}`;
    const token = localStorage.getItem('timetomeal_auth_token');
    const response = await fetch(url, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    return response.json();
  },

  async createOrder(orderData: {
    studentId?: string;
    studentName?: string;
    studentPhone?: string;
    canteenId?: string;
    canteenName?: string;
    items: Array<{ id: string; name: string; quantity: number; price: number }>;
    totalAmount: number;
    paymentMethod: string;
  }): Promise<Order> {
    const token = localStorage.getItem('timetomeal_auth_token');
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(orderData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Failed to create order' }));
      throw new Error(err.message || 'Failed to create order');
    }
    return response.json();
  },

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const token = localStorage.getItem('timetomeal_auth_token');
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error('Failed to update order status');
    }
    return response.json();
  },

  async getOrderById(orderId: string): Promise<Order> {
    const token = localStorage.getItem('timetomeal_auth_token');
    const response = await fetch(`/api/orders/${orderId}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch order details');
    }
    return response.json();
  }
};
