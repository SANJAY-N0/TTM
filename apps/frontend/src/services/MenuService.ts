import { MenuAPI } from '../api/menu';
import { MenuItem } from '../types';

export const MenuService = {
  async fetchMenuForCanteen(canteenId: string): Promise<MenuItem[]> {
    return MenuAPI.getMenuItems(canteenId);
  },

  async setItemAvailability(itemId: string, available: boolean): Promise<MenuItem> {
    return MenuAPI.toggleAvailability(itemId, available);
  },

  async saveMenuItem(item: Partial<MenuItem>): Promise<MenuItem> {
    return MenuAPI.saveMenuItem(item);
  }
};
