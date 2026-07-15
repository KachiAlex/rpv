"use client";
import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { UserService } from '@/lib/services/user-service';

export function useTheme() {
  const { user, isAuthenticated } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const userService = new UserService();

  useEffect(() => {
    // Load theme from user preferences
    if (isAuthenticated && user) {
      loadTheme();
    } else {
      // Load from localStorage or system preference
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null;
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        // Detect system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(prefersDark ? 'dark' : 'light');
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const resolved = prefersDark ? 'dark' : 'light';
      setResolvedTheme(resolved);
      
      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else {
      setResolvedTheme(theme);
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'auto') {
        if (e.matches) {
          root.classList.add('dark');
          setResolvedTheme('dark');
        } else {
          root.classList.remove('dark');
          setResolvedTheme('light');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const loadTheme = async () => {
    if (!user) return;
    
    try {
      const preferences = await userService.getPreferences(user.uid);
      setTheme(preferences.theme);
      localStorage.setItem('theme', preferences.theme);
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setThemePreference = async (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    if (isAuthenticated && user) {
      try {
        await userService.savePreferences(user.uid, { theme: newTheme });
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    }
  };

  return {
    theme,
    resolvedTheme,
    setTheme: setThemePreference,
    isDark: resolvedTheme === 'dark',
  };
}

