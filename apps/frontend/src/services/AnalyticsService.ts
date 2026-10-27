import { DatabaseService } from './DatabaseService';

export class AnalyticsService {
  private static instance: AnalyticsService;
  
  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public async getCanteenRevenue(canteenId: string, startDate: Date, endDate: Date) {
    const db = DatabaseService.getInstance();
    const client = db.getClient();
    if (!client) return { totalRevenue: 0, orderCount: 0 };

    const { data } = await client
      .from('orders')
      .select('paid_amount')
      .eq('canteen_id', canteenId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('payment_status', 'paid');
      
    if (!data) return { totalRevenue: 0, orderCount: 0 };
    
    const totalRevenue = data.reduce((sum, order) => sum + (order.paid_amount || 0), 0);
    return { totalRevenue, orderCount: data.length };
  }
}
