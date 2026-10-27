import { MenuItem } from '../types';

export const MenuAPI = {
  async getMenuItems(canteenId?: string): Promise<MenuItem[]> {
    const url = `/api/menu${canteenId ? `?canteenId=${canteenId}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch menu items');
    }
    return response.json();
  },

  async toggleAvailability(itemId: string, available: boolean): Promise<MenuItem> {
    const token = localStorage.getItem('timetomeal_auth_token');
    const response = await fetch(`/api/menu/${itemId}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ available }),
    });
    if (!response.ok) {
      throw new Error('Failed to update item availability');
    }
    return response.json();
  },

  async saveMenuItem(item: Partial<MenuItem>): Promise<MenuItem> {
    const token = localStorage.getItem('timetomeal_auth_token');
    const isEdit = Boolean(item.id);
    const url = isEdit ? `/api/menu/${item.id}` : '/api/menu';
    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      throw new Error('Failed to save menu item');
    }
    return response.json();
  }
};
