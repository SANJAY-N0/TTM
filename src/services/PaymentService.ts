import { DatabaseService } from './DatabaseService';

export class PaymentService {
  private static instance: PaymentService;
  
  private constructor() {}

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  public async logPayment(paymentPayload: any) {
    const db = DatabaseService.getInstance();
    return db.insert('payments', paymentPayload);
  }
}
