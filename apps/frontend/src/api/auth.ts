import { User } from '../types';

export const AuthAPI = {
  async login(credentials: { email?: string; rollNumber?: string; password?: string }): Promise<{ token: string; user: User }> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(err.message || 'Login failed');
    }
    return response.json();
  },

  async register(userData: Partial<User>): Promise<{ user: User }> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(err.message || 'Registration failed');
    }
    return response.json();
  },

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('timetomeal_auth_token');
    if (!token) return null;
    const response = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    return response.json();
  },

  logout(): void {
    localStorage.removeItem('timetomeal_auth_token');
    localStorage.removeItem('timetomeal_user');
  }
};
