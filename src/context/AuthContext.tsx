import React, { createContext, useContext, useState, useEffect } from 'react';

type User = {
  email: string;
  role: 'Admin' | 'User';
  token: string;
  name?: string;
  nick_name?: string;
};

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('kartal_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('kartal_user', JSON.stringify(userData));
    localStorage.setItem('kartal_token', userData.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kartal_user');
    localStorage.removeItem('kartal_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
