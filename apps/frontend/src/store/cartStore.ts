import { MenuItem } from '../types';

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
}

export const createCartStore = () => {
  let items: CartItem[] = [];
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());

  return {
    getState: () => ({
      items,
      addItem: (item: MenuItem) => {
        const existing = items.find((i) => i.id === item.id);
        if (existing) {
          existing.quantity += 1;
        } else {
          items.push({ ...item, quantity: 1 });
        }
        notify();
      },
      removeItem: (itemId: string) => {
        items = items.filter((i) => i.id !== itemId);
        notify();
      },
      clearCart: () => {
        items = [];
        notify();
      },
      getTotalAmount: () => items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

export const cartStore = createCartStore();
