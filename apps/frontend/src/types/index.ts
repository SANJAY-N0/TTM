export * from './auth';
export * from './student';
export * from './payment';
export * from './order';
export * from './canteen';
export * from './analytics';
export * from './report';

export type AppRole = 'student' | 'staff' | 'admin' | 'superadmin';

export interface User {
  id: string;
  email?: string;
  role: AppRole | string;
  profile?: any;
  college_id?: string;
  canteen_id?: string;
  rollNumber?: string;
  name?: string;
  phone?: string;
}

export interface StudentProfile {
  name?: string;
  full_name?: string;
  register_number?: string;
  roll_number?: string;
  college?: string;
  hostel_name?: string;
  room_number?: string;
  phone_number?: string;
  phone?: string;
  avatar_url?: string;
  photo_url?: string;
}

export interface AdminProfile {
  name: string;
  department?: string;
  phone?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  item_name: string;
  price: number;
  category: string;
  canteen_id?: string;
  available?: boolean;
  availability?: boolean;
  is_available?: boolean;
  stock_online?: number;
  stock_offline?: number;
  image_url?: string;
  cloudinary_public_id?: string;
  description?: string;
  is_veg?: boolean;
}

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

export interface College {
  id: string;
  name: string;
  code: string;
  created_at?: string;
}
