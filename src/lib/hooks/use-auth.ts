"use client";
import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '@/lib/api-config';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  isAnonymous: boolean;
  getIdToken: () => Promise<string>;
  toJSON: () => Record<string, unknown>;
}

const TOKEN_KEY = 'rpv:authToken';
const USER_KEY = 'rpv:authUser';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredUser(): AppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      ...data,
      getIdToken: async () => getStoredToken() || '',
      toJSON: () => data,
    };
  } catch {
    return null;
  }
}

function storeAuth(token: string, user: { uid: string; email: string; displayName: string; role: string }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch(getApiUrl('/api/auth/login/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      storeAuth(data.token, data.user);
      const appUser: AppUser = {
        uid: data.user.uid,
        email: data.user.email,
        displayName: data.user.displayName,
        emailVerified: true,
        isAnonymous: false,
        getIdToken: async () => getStoredToken() || '',
        toJSON: () => data.user,
      };
      setUser(appUser);
      return appUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setError(null);
    try {
      const res = await fetch(getApiUrl('/api/auth/signup/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sign up failed');

      storeAuth(data.token, data.user);
      const appUser: AppUser = {
        uid: data.user.uid,
        email: data.user.email,
        displayName: data.user.displayName,
        emailVerified: true,
        isAnonymous: false,
        getIdToken: async () => getStoredToken() || '',
        toJSON: () => data.user,
      };
      setUser(appUser);
      return appUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    clearAuth();
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (_email: string) => {
    setError('Password reset is not yet available. Please contact support.');
    throw new Error('Password reset not available');
  }, []);

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    logout,
    resetPassword,
    isAuthenticated: !!user,
  };
}

