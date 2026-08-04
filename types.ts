
declare global {
  interface Window {}
}

export type OrderStatus = 'pending' | 'Accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type OrderType = 'online' | 'walk-in';
export type PaymentMethod = 'QR' | 'cash' | 'UPI' | 'card' | 'Cashfree' | 'cashfree' | 'cod' | string;

export interface Shop {
  id: string;
  name: string;
  image: string;
  location: string;
}

export interface MenuItem {
  id: string;
  canteen_id: string;
  item_name: string;
  price: number;
  category: 'breakfast' | 'lunch' | 'snacks' | 'milkshakes' | 'beverages' | string;
  availability: boolean;
  imageUrl: string;
  image_url?: string;
  image_public_id?: string;
  image_secure_url?: string;
  image_width?: number;
  image_height?: number;
  image_format?: string;
  image_bytes?: number;
  cloudinary_public_id?: string;
  stock_online: number;
  stock_offline: number;
  low_stock_threshold: number;
  description?: string;
  is_veg?: boolean;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  menu_item_id: string;
  item_name: string;
  price: number;
  quantity: number;
}

export interface StudentProfile {
  student_id: string;
  full_name: string;
  register_number: string;
  hostel_name: string;
  room_number: string;
  phone_number: string;
  photo_url?: string;
  profile_image_url?: string;
  profile_public_id?: string;
  google_id?: string;
  college_id?: string;
  college_name?: string;
  roll_number?: string;
  mobile_number?: string;
  department?: string;
  year?: string;
  section?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PrinterSettings {
  printer_name: string;
  printer_type: 'thermal' | 'normal';
  paper_size: '58mm' | '80mm';
  print_speed: 'low' | 'medium' | 'high';
  auto_cut: boolean;
  print_header_text: string;
  print_footer_text: string;
  show_logo: boolean;
  show_datetime: boolean;
  show_ordertype: boolean;
  show_prices: boolean;
  font_size: 'small' | 'medium' | 'large';
}

export interface PaymentSettings {
  qr_image_url?: string;
  qr_enabled: boolean;
  default_payment_mode: 'cash' | 'online' | 'mixed';
}

export interface College {
  id: string;
  college_name: string;
  college_code: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  contact_person: string;
  phone_number: string;
  email: string;
  status: 'active' | 'suspended';
  created_at: string;
  total_canteens?: number;
  total_students?: number;
  logo_url?: string;
}

export interface CanteenProfile {
  canteen_id: string;
  canteen_name: string;
  college_id: string;
  college_name: string;
  owner_name: string;
  email: string;
  phone_number: string;
  upi_id?: string;
  address?: string;
  contact_number?: string;
  logo_url?: string;
  is_online: boolean;
  status: 'active' | 'inactive';
  operating_hours: {
    open: string;
    close: string;
  };
  printer_settings: PrinterSettings;
  payment_settings: PaymentSettings;
  notification_settings?: {
    low_stock_threshold: number;
    enable_pwa_notifications: boolean;
  };
  bank_details?: BankDetails;
  device_settings?: DeviceIntegrationSettings;
  auto_sleep_settings?: AutoSleepSettings;
}

export interface BankDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  upiId: string;
}

export interface DeviceIntegrationSettings {
  thermalPrinter: { connected: boolean; name: string; paperSize: string };
  qrScanner: { connected: boolean; name: string };
  barcodeScanner: { connected: boolean; name: string };
}

export interface AutoSleepSettings {
  enabled: boolean;
  idleTimerMinutes: number; // 1, 2, 5, 10
}

export interface ReportReply {
  id: string;
  replyType?: 'email' | 'sms' | 'internal_note' | string;
  reply_by?: string;
  message: string;
  createdAt?: string;
  createdBy?: string;
  channel?: string;
}

export interface SystemReport {
  id: string;
  reportType?: 'Payment Dispute' | 'Uncollected Order' | 'Behavioral Issue' | 'System Abuse' | 'Quality Issue' | 'Other' | string;
  report_type?: string;
  subject: string;
  description: string;
  createdBy?: string;
  created_by?: string;
  againstType?: 'Student' | 'Canteen' | 'Order' | string;
  against_type?: string;
  againstUser?: string;
  against_user?: string;
  againstName?: string;
  dateTime?: string;
  created_at?: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'open' | 'in_progress' | 'resolved' | 'closed' | string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical' | 'low' | 'medium' | 'high' | 'urgent' | string;
  attachments?: string[];
  replies?: ReportReply[];
}

export interface AdminProfile {
  admin_id: string;
  full_name: string;
  roll_number: string;
  email: string;
}

export interface Payment {
  id?: string;
  order_id: string;
  payment_method: PaymentMethod;
  payment_status: 'partial' | 'completed' | 'failed' | string;
  transaction_reference?: string;
  paid_amount: number;
  cashfree_order_id?: string;
  cashfree_payment_id?: string;
  created_at?: string;
}

export interface Order {
  id: string;
  student_id: string | null;
  canteen_id: string;
  total_amount: number;
  paid_amount: number;
  payment_method?: string;
  payment_status?: 'paid' | 'advance_paid' | 'pending_cash_payment' | 'pending' | 'failed' | string;
  order_status: OrderStatus;
  order_type: OrderType;
  order_code: string;
  created_at: string;
  cashfree_order_id?: string;
  cashfree_payment_id?: string;
  token_number?: string;
  accepted_at?: string;
  estimated_ready_time?: string;
  // Relational data
  order_items?: OrderItem[];
  payments?: Payment[];
  student_details?: StudentProfile;
  canteen_details?: CanteenProfile;
}

export type AppRole = 'student' | 'staff' | 'admin';

export interface User {
  id: string;
  email: string;
  role: AppRole;
  password?: string;
  profile?: StudentProfile | CanteenProfile | AdminProfile;
  last_login?: string;
}
