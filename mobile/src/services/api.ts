import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'rpv:authToken';
const USER_KEY = 'rpv:authUser';

export interface ApiUser {
  uid: string;
  email: string;
  displayName?: string;
  role: 'user' | 'admin';
}

let currentUser: ApiUser | null = null;
let currentToken: string | null = null;
const listeners = new Set<(user: ApiUser | null) => void>();

function notifyAuthChange(): void {
  listeners.forEach((cb) => {
    try {
      cb(currentUser);
    } catch {}
  });
}

async function storeSession(user: ApiUser, token: string): Promise<void> {
  currentUser = user;
  currentToken = token;
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
  notifyAuthChange();
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

/**
 * Restore the stored session. Call once at app startup.
 */
export async function initializeApi(): Promise<void> {
  try {
    const [token, rawUser] = await Promise.all([
      AsyncStorage.getItem(TOKEN_KEY),
      AsyncStorage.getItem(USER_KEY),
    ]);
    if (token && rawUser) {
      currentToken = token;
      currentUser = JSON.parse(rawUser);
    }
  } catch (error) {
    console.error('Error restoring session:', error);
  }
  notifyAuthChange();
}

export async function signUp(
  email: string,
  password: string,
  displayName?: string
): Promise<ApiUser> {
  const data = await apiFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
  await storeSession(data.user, data.token);
  return data.user;
}

export async function signIn(email: string, password: string): Promise<ApiUser> {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await storeSession(data.user, data.token);
  return data.user;
}

export async function logout(): Promise<void> {
  currentUser = null;
  currentToken = null;
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  notifyAuthChange();
}

/**
 * Firebase-compatible auth listener: fires immediately with the current
 * user and again whenever the session changes.
 */
export function onAuthChange(callback: (user: ApiUser | null) => void): () => void {
  listeners.add(callback);
  callback(currentUser);
  return () => listeners.delete(callback);
}

export function getCurrentUser(): ApiUser | null {
  return currentUser;
}

export function getAuthToken(): string | null {
  return currentToken;
}

// ---- Bookmarks ----

interface ServerBookmark {
  id: string;
  translation_id: string;
  book: string;
  chapter: number;
  verse: number;
  label: string | null;
  created_at: string;
}

export async function saveBookmark(
  _userId: string,
  _verseId: string,
  verseData: { book: string; chapter: number; verse: number; text?: string; translation?: string }
): Promise<string> {
  const data = await apiFetch('/api/user/', {
    method: 'POST',
    body: JSON.stringify({
      action: 'addBookmark',
      bookmark: {
        translationId: verseData.translation || 'RPV',
        book: verseData.book,
        chapter: verseData.chapter,
        verse: verseData.verse,
        label: null,
      },
    }),
  });
  return data.id;
}

export async function getBookmarks(_userId: string): Promise<any[]> {
  const data = await apiFetch('/api/user/?action=bookmarks');
  return (data.bookmarks as ServerBookmark[]).map((b) => ({
    id: String(b.id),
    bookmarkId: String(b.id),
    book: b.book,
    chapter: b.chapter,
    verse: b.verse,
    text: '',
    translation: b.translation_id,
    createdAt: b.created_at ? new Date(b.created_at) : undefined,
  }));
}

export async function removeBookmark(bookmarkId: string): Promise<void> {
  await apiFetch('/api/user/', {
    method: 'POST',
    body: JSON.stringify({ action: 'removeBookmark', bookmarkId }),
  });
}

// ---- Preferences ----

export async function savePreferences(_userId: string, preferences: any): Promise<void> {
  await apiFetch('/api/user/', {
    method: 'POST',
    body: JSON.stringify({ action: 'savePreferences', preferences }),
  });
}

export async function getPreferences(_userId: string): Promise<any> {
  const data = await apiFetch('/api/user/?action=preferences');
  const prefs = data.preferences;
  return prefs && Object.keys(prefs).length > 0 ? prefs : null;
}

// ---- Role ----

export async function getUserRole(): Promise<'user' | 'admin'> {
  // The role embedded in the JWT/session is authoritative — the
  // user_profiles row used by ?action=role may not exist yet.
  if (currentUser?.role === 'admin') return 'admin';
  try {
    const data = await apiFetch('/api/user/?action=role');
    return data.role === 'admin' ? 'admin' : 'user';
  } catch {
    return 'user';
  }
}
