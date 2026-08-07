import { z } from 'zod';

export const RegisterStudentSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  phone: z.string().optional(),
  roll_number: z.string().min(3, { message: 'Roll number is required' }),
  college_id: z.string().optional()
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, { message: 'Password is required' }),
  role: z.enum(['STUDENT', 'CANTEEN', 'SUPER_ADMIN']).optional()
});

export const CreateMealSchema = z.object({
  canteen_id: z.string(),
  item_name: z.string().min(2),
  category: z.string().default('General'),
  price: z.number().positive(),
  discount_price: z.number().optional(),
  image_url: z.string().url().optional(),
  is_veg: z.boolean().default(true),
  stock_online: z.number().nonnegative().default(100)
});

export const CreateOrderSchema = z.object({
  student_id: z.string(),
  canteen_id: z.string(),
  total_amount: z.number().positive(),
  payment_method: z.enum(['CASH', 'CASHFREE', 'RAZORPAY', 'PHONEPE', 'GOOGLE_PAY', 'PAYTM', 'UPI_QR', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING']),
  items: z.array(z.object({
    meal_id: z.string(),
    item_name: z.string(),
    quantity: z.number().int().positive(),
    price_per_unit: z.number().positive()
  })).min(1)
});

export const VerifyPaymentSchema = z.object({
  order_id: z.string(),
  payment_id: z.string().optional(),
  signature: z.string().optional()
});
