import { create } from 'zustand';
import { ApiUser } from '../services/api';
import * as apiService from '../services/api';

interface AuthState {
  user: ApiUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: ApiUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,

  signUp: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const user = await apiService.signUp(email, password);
      set({ user, isAuthenticated: !!user, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const user = await apiService.signIn(email, password);
      set({ user, isAuthenticated: !!user, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await apiService.logout();
      set({ user: null, isAuthenticated: false, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setUser: (user: ApiUser | null) => {
    set({ user, isAuthenticated: !!user });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  initializeAuth: () => {
    apiService.onAuthChange((user) => {
      set({ user, isAuthenticated: !!user });
    });
  },
}));
