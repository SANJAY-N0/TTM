import { DatabaseService } from './DatabaseService';

export class OrderService {
  private static instance: OrderService;
  
  private constructor() {}

  public static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  public async autoAcceptOrder(orderId: string, totalAmount: number, targetStatus: string) {
    const db = DatabaseService.getInstance();
    const updatePayload = {
      paid_amount: totalAmount,
      order_status: targetStatus,
      payment_status: 'paid',
      accepted_at: new Date().toISOString()
    };
    
    return db.update('orders', 'id', orderId, updatePayload);
  }

  public async createOrder(orderPayload: any) {
    const db = DatabaseService.getInstance();
    return db.insert('orders', orderPayload);
  }
}
