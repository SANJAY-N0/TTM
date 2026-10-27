import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().optional(),
  username: z.string().optional(),
  identifier: z.string().optional(),
  password: z.string().min(1, { message: 'Password is required' }),
  role: z.enum(['STUDENT', 'CANTEEN_OWNER', 'CANTEEN', 'ADMIN', 'SUPER_ADMIN']).optional()
});

export const GoogleAuthSchema = z.object({
  email: z.string().email({ message: 'Valid Google email is required' }),
  name: z.string().optional(),
  picture: z.string().optional(),
  googleId: z.string().optional()
});

export const RegisterStudentSchema = z.object({
  full_name: z.string().min(2, { message: 'Full name must be at least 2 characters' }),
  college_email: z.string().email({ message: 'Valid college email is required' }),
  roll_number: z.string().min(1, { message: 'Roll number / Register number is required' }),
  gender: z.string().min(1, { message: 'Gender is required' }),
  mobile_number: z.string().regex(/^[0-9]{10}$/, { message: 'Mobile number must be exactly 10 digits' }),
  college_id: z.string().min(1, { message: 'College is required' }),
  department_id: z.string().min(1, { message: 'Department is required' }),
  year_of_study: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) || 1 : val),
  academic_year_id: z.string().optional(),
  section: z.string().optional().default(''),
  stay_classification: z.enum(['HOSTELLER', 'DAY', 'hosteller', 'day']).default('HOSTELLER'),
  terms_accepted: z.boolean().refine(val => val === true, { message: 'You must accept the Terms and Conditions to proceed' }),
  terms_version: z.string().optional().default('1.0')
});

export const CreateCanteenAccountSchema = z.object({
  canteen_id: z.string().min(1, { message: 'Canteen ID is required' }),
  college_id: z.string().min(1, { message: 'College ID is required' }),
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  email: z.string().email().optional(),
  initial_password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional()
});

export const CreateCanteenSchema = z.object({
  name: z.string().min(2, { message: 'Canteen name is required' }),
  college_id: z.string().min(1, { message: 'Assigned college is required' }),
  code: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional(),
  logo_url: z.string().optional(),
  banner_url: z.string().optional(),
  operating_hours: z.string().optional(),
  opening_time: z.string().optional(),
  closing_time: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active')
});

export const CreateCollegeSchema = z.object({
  name: z.string().min(2, { message: 'College name is required' }),
  code: z.string().min(2, { message: 'College code is required' }),
  official_email_domain: z.string().min(3, { message: 'Official email domain is required (e.g., college.ac.in)' }),
  city: z.string().optional(),
  state: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active')
});

export const CreateDepartmentSchema = z.object({
  college_id: z.string().min(1, { message: 'College ID is required' }),
  department_code: z.string().min(1, { message: 'Department code is required' }),
  department_name: z.string().min(2, { message: 'Department name is required' }),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active')
});

export const CreateAcademicYearSchema = z.object({
  college_id: z.string().min(1, { message: 'College ID is required' }),
  year_name: z.string().min(1, { message: 'Year name is required (e.g. I Year, II Year)' }),
  year_number: z.number().int().positive().default(1),
  status: z.enum(['active', 'inactive']).default('active')
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
