import { clsx, type ClassValue } from 'clsx';

/**
 * Utility function to concatenate class names with clsx
 * Provides a clean way to conditionally apply classes
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}