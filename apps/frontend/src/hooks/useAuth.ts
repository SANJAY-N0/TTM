import { useState, useEffect } from 'react';
import { AuthAPI } from '../api/auth';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    AuthAPI.getCurrentUser()
      .then((currUser) => setUser(currUser))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const res = await AuthAPI.login(credentials);
      localStorage.setItem('timetomeal_auth_token', res.token);
      setUser(res.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    AuthAPI.logout();
    setUser(null);
  };

  return { user, loading, login, logout };
};
