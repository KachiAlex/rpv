export async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('rpv:authToken');
}

export function getCurrentUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('rpv:authUser');
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data.email || null;
  } catch {
    return null;
  }
}
