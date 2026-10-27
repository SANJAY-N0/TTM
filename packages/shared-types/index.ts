export type UserRole = 'ADMIN' | 'COLLEGE_ADMIN' | 'CANTEEN_STAFF' | 'STUDENT';

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'UPI' | 'SPLIT' | 'CASHFREE';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
