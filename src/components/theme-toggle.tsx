"use client";
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/hooks/use-theme';

export function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('auto');
    } else {
      setTheme('light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
      title={`Theme: ${theme} (${isDark ? 'dark' : 'light'})`}
    >
      {isDark ? (
        <Sun size={20} className="text-neutral-600 dark:text-neutral-300" />
      ) : (
        <Moon size={20} className="text-neutral-600 dark:text-neutral-300" />
      )}
    </button>
  );
}

