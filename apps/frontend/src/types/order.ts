export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled' | 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id?: string;
  menu_item_id?: string;
  item_id?: string;
  item_name?: string;
  name?: string;
  quantity: number;
  price: number;
  unit_price?: number;
}

export interface Order {
  id: string;
  order_number?: string;
  order_code?: string;
  token_number?: string;
  tokenNumber?: string;
  student_id?: string;
  student_name?: string;
  student_phone?: string;
  studentId?: string;
  studentName?: string;
  canteen_id?: string;
  canteen_name?: string;
  canteenId?: string;
  canteenName?: string;
  order_items: OrderItem[];
  items?: OrderItem[];
  total_amount: number;
  paid_amount?: number;
  totalAmount?: number;
  status?: OrderStatus;
  order_status?: OrderStatus;
  order_type?: string;
  payment_method?: string;
  paymentMethod?: string;
  payment_status?: string;
  paymentStatus?: string;
  created_at?: string;
  createdAt?: string;
  cancellation_reason?: string;
  student_details?: any;
  payments?: any[];
  cashfree_order_id?: string;
  cashfree_payment_id?: string;
}
