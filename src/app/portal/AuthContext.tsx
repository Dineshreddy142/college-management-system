import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../../api/client';

type User = {
  id: number;
  username: string;
  name?: string;
  full_name?: string;
  email: string;
  role: string;
  must_change_password?: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  settings: Record<string, string>;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updatedFields: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  refetchSettings: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await client.get('/settings');
      setSettings(res.data);
    } catch (e) {
      console.error("Failed to fetch settings", e);
    }
  };

  useEffect(() => {
    const validateToken = async () => {
      await fetchSettings();
      if (token) {
        try {
          const res = await client.get('/validate-token');
          if (res.data?.data?.user) {
            setUser(res.data.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.data.user));
          }
        } catch (error) {
          console.error("Token validation failed", error);
          logout();
        }
      }
      setIsLoading(false);
    };
    validateToken();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updated = { ...prevUser, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, settings, login, logout, updateUser, isAuthenticated: !!user, isLoading, refetchSettings: fetchSettings }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
