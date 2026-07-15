import { create } from 'zustand';
import * as firebaseService from '../services/firebase';
import offlineQueueService from '../services/offlineQueueService';

interface UserPreferences {
  fontSize: number;
  darkMode: boolean;
  selectedTranslation: string;
  notifications: boolean;
  autoSync: boolean;
}

interface PreferencesState {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
  loadPreferences: (userId: string) => Promise<void>;
  savePreferences: (userId: string, preferences: Partial<UserPreferences>) => Promise<void>;
  updatePreference: <K extends keyof UserPreferences>(
    userId: string,
    key: K,
    value: UserPreferences[K]
  ) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  fontSize: 16,
  darkMode: false,
  selectedTranslation: 'KJV',
  notifications: true,
  autoSync: true,
};

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: DEFAULT_PREFERENCES,
  loading: false,
  error: null,

  loadPreferences: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const prefs = await firebaseService.getPreferences(userId);
      set({
        preferences: prefs || DEFAULT_PREFERENCES,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  savePreferences: async (userId: string, newPrefs: Partial<UserPreferences>) => {
    set({ loading: true, error: null });
    try {
      const updated = { ...get().preferences, ...newPrefs };
      await firebaseService.savePreferences(userId, updated);
      set({ preferences: updated, loading: false });

      // Queue for offline sync
      await offlineQueueService.queuePreferenceUpdate(userId, updated);
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updatePreference: async (userId: string, key: keyof UserPreferences, value: any) => {
    const updated = { ...get().preferences, [key]: value };
    await get().savePreferences(userId, { [key]: value });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
