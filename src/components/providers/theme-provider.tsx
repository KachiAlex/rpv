"use client";
import { useEffect } from 'react';
import { useTheme } from '@/lib/hooks/use-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  useEffect(() => {
    // Theme is applied in the useTheme hook
    // This component just ensures the hook runs
  }, [theme]);

  return <>{children}</>;
}
