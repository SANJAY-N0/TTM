import { Canteen } from '../types';

export const CanteenAPI = {
  async getCanteens(collegeId?: string): Promise<Canteen[]> {
    const url = `/api/canteens${collegeId ? `?collegeId=${collegeId}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch canteens');
    }
    return response.json();
  },

  async updateCanteenSettings(canteenId: string, settings: Partial<Canteen>): Promise<Canteen> {
    const token = localStorage.getItem('timetomeal_auth_token');
    const response = await fetch(`/api/canteens/${canteenId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      throw new Error('Failed to update canteen settings');
    }
    return response.json();
  }
};
