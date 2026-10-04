/**
 * Detect if the app is running inside a Capacitor native shell.
 */
export function isCapacitor(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return !!(
    w.Capacitor?.isNativePlatform?.() === true ||
    w?.navigator?.userAgent?.includes('Capacitor') ||
    w?.navigator?.userAgent?.includes('NativeShell')
  );
}
