export interface DailyRevenue {
  date: string;
  total: number;
  orderCount: number;
}

export interface PopularItem {
  id: string;
  name: string;
  ordersCount: number;
}
