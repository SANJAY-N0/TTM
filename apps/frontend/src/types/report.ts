export interface FinancialReport {
  period: 'daily' | 'weekly' | 'monthly';
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}
