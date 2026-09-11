'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getAuthToken, setAuthToken, clearAuthToken } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  targetRole?: string;
  seniority?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, name: string, password?: string, targetRole?: string, seniority?: string) => Promise<void>;
  updateUser: (updatedUser: User, newToken?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = getAuthToken();
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('trao_user') : null;

    if (!savedToken || !savedUser) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    try {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    } catch {
      clearAuthToken();
      setIsLoading(false);
      return;
    }

    // Trust the stored session only until the server confirms it. Without this
    // an expired token renders a signed-in shell where every request 401s.
    api
      .getMe()
      .then((res) => {
        if (cancelled) return;
        setUser(res.user as User);
        localStorage.setItem('trao_user', JSON.stringify(res.user));
      })
      .catch(() => {
        if (cancelled) return;
        clearAuthToken();
        setUser(null);
        setToken(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('trao_session_expired', onExpired);
    return () => window.removeEventListener('trao_session_expired', onExpired);
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setToken(res.token);
      setUser(res.user);
      setAuthToken(res.token);
      localStorage.setItem('trao_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, name: string, password?: string, targetRole?: string, seniority?: string) => {
    setIsLoading(true);
    try {
      const res = await api.register(email, name, password, targetRole, seniority);
      setToken(res.token);
      setUser(res.user);
      setAuthToken(res.token);
      localStorage.setItem('trao_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updatedUser: User, newToken?: string) => {
    setUser(updatedUser);
    localStorage.setItem('trao_user', JSON.stringify(updatedUser));
    if (newToken) {
      setToken(newToken);
      setAuthToken(newToken);
    }
  };

  const logout = () => {
    clearAuthToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('trao_user');
    }
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
