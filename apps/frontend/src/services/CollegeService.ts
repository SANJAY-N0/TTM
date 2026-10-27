import { College } from '../types';

export const CollegeService = {
  async fetchColleges(): Promise<College[]> {
    const response = await fetch('/api/colleges');
    if (!response.ok) throw new Error('Failed to fetch colleges');
    return response.json();
  },

  async createCollege(data: Partial<College>): Promise<College> {
    const token = localStorage.getItem('timetomeal_auth_token');
    const response = await fetch('/api/colleges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create college');
    return response.json();
  }
};
