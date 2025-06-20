/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserLogin, UserCreate } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        } catch {
          localStorage.removeItem('access_token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: UserLogin) => {
    const tokenData = await authApi.login(credentials);
    localStorage.setItem('access_token', tokenData.access_token);
    const userData = await authApi.getCurrentUser();
    setUser(userData);
  };

  const register = async (userData: UserCreate) => {
    const _newUser = await authApi.register(userData);
    // Auto-login after registration
    await login({ email: userData.email, password: userData.password });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 