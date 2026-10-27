import { useState, useEffect, useCallback } from 'react';
import { OrderAPI } from '../api/order';
import { Order } from '../types';

export const useOrders = (filterParams?: { canteenId?: string; studentId?: string; status?: string }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await OrderAPI.getOrders(filterParams);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterParams?.canteenId, filterParams?.studentId, filterParams?.status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    const updated = await OrderAPI.updateOrderStatus(orderId, status);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    return updated;
  };

  return { orders, loading, refreshOrders: fetchOrders, updateStatus };
};
