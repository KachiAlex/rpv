import { create } from 'zustand';
import * as adminService from '../services/adminService';

interface AdminUser {
  uid: string;
  email: string;
  isAdmin: boolean;
  role: 'admin' | 'user';
}

interface AdminState {
  isAdmin: boolean;
  adminUser: AdminUser | null;
  loading: boolean;
  error: string | null;
  checkAdminStatus: (userId: string) => Promise<void>;
  getAdminUser: (userId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  isAdmin: false,
  adminUser: null,
  loading: false,
  error: null,

  checkAdminStatus: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const isAdmin = await adminService.checkAdminStatus(userId);
      set({ isAdmin, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  getAdminUser: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const adminUser = await adminService.getAdminUser(userId);
      set({ adminUser, isAdmin: !!adminUser, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
