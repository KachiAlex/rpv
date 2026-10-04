interface ReadingProgress {
  page: number;
  updatedAt: number;
}

const STORAGE_KEY = 'rpv-reading-progress';

export function getReadingProgress(bookId: string): ReadingProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw) as Record<string, ReadingProgress>;
    return all[bookId] || null;
  } catch {
    return null;
  }
}

export function setReadingProgress(bookId: string, page: number): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: Record<string, ReadingProgress> = raw ? JSON.parse(raw) : {};
    all[bookId] = { page, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore storage errors
  }
}
