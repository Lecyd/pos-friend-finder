import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/data/mock-data';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<Pick<User, 'name' | 'phone' | 'address' | 'photoUrl'>>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredUsers = (): User[] => {
  const saved = localStorage.getItem('gv_users');
  return saved ? JSON.parse(saved) : mockUsers;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('gv_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email: string, _password: string) => {
    const users = getStoredUsers();
    const found = users.find(u => u.email === email && u.active);
    if (found) {
      setUser(found);
      localStorage.setItem('gv_user', JSON.stringify(found));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('gv_user');
  }, []);

  const updateProfile = useCallback((data: Partial<Pick<User, 'name' | 'phone' | 'address' | 'photoUrl'>>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem('gv_user', JSON.stringify(updated));
      const users = getStoredUsers();
      const updatedUsers = users.map(u => u.id === updated.id ? { ...u, ...data } : u);
      localStorage.setItem('gv_users', JSON.stringify(updatedUsers));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
