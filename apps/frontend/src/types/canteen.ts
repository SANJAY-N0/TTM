export interface CanteenProfile {
  canteen_name: string;
  college_name: string;
  staff_name: string;
  phone: string;
  upi_id?: string;
}

export interface Canteen {
  id: string;
  name: string;
  college_id: string;
  is_online?: boolean;
}
