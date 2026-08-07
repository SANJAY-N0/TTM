export interface CreateOrderDto {
  studentId?: string;
  studentName?: string;
  studentPhone?: string;
  canteenId: string;
  canteenName?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  paymentMethod: 'CASH' | 'UPI' | 'SPLIT' | 'CASHFREE';
}
