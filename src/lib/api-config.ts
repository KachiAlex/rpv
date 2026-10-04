/**
 * Returns the full API URL for a given path.
 * Uses NEXT_PUBLIC_API_BASE_URL if set (needed for Capacitor builds),
 * otherwise falls back to relative path for standard web deployment.
 */
export function getApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // If base URL is set, concatenate; otherwise use relative
  if (base) {
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${normalizedBase}${normalizedPath}`;
  }
  return normalizedPath;
}
