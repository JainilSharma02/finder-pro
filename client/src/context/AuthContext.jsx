import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lfp_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Validate token & fetch fresh user on app load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('lfp_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Safety timeout — if backend doesn't respond in 10s, unblock the UI
      const safetyTimer = setTimeout(() => {
        console.warn('[AuthContext] Backend timeout — unblocking UI');
        setLoading(false);
      }, 10000);

      try {
        const res = await authApi.getMe();
        clearTimeout(safetyTimer);
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('lfp_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        clearTimeout(safetyTimer);
        console.warn('Session expired or invalid, logging out');
        localStorage.removeItem('lfp_token');
        localStorage.removeItem('lfp_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token, user: loggedUser } = res.data;
    localStorage.setItem('lfp_token', token);
    localStorage.setItem('lfp_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    const { token, user: newUser } = res.data;
    localStorage.setItem('lfp_token', token);
    localStorage.setItem('lfp_user', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lfp_token');
    localStorage.removeItem('lfp_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const updated = { ...prev, ...patch };
      localStorage.setItem('lfp_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
