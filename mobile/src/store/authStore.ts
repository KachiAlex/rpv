import { create } from 'zustand';
import { User } from 'firebase/auth';
import * as firebaseService from '../services/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
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
      const user = await firebaseService.signUp(email, password);
      set({ user, isAuthenticated: !!user, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const user = await firebaseService.signIn(email, password);
      set({ user, isAuthenticated: !!user, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await firebaseService.logout();
      set({ user: null, isAuthenticated: false, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  initializeAuth: () => {
    firebaseService.onAuthChange((user) => {
      set({ user, isAuthenticated: !!user });
    });
  },
}));
