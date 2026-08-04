
import { MenuItem, Shop } from './types';

export const CANTEEN_INFO = {
  name: 'RAGA PVT LTD',
  address: 'S USMAN ROAD, T. NAGAR, CHENNAI, TAMIL NADU.',
  phone: '044 258636222',
  gstin: '33AAAGP0685F1ZH'
};

export const SHOPS: Shop[] = [
  { id: 's1', name: 'Main Canteen', image: 'https://images.unsplash.com/photo-1567529684892-0f296707f2a4?auto=format&fit=crop&q=80&w=400', location: 'Ground Floor, Block A' },
  { id: 's2', name: 'Snack Shack', image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80&w=400', location: 'Near Hostel Gate' }
];

// Fix: Added missing stock and threshold properties to comply with MenuItem interface
export const MENU_ITEMS: MenuItem[] = [];

export const CANCEL_WINDOW_MS = 20 * 60 * 1000;
