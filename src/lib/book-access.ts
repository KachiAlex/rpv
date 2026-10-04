export type BookAccessLevel = 'public' | 'restricted';

export interface BookAccessSettings {
  accessLevel?: BookAccessLevel;
  allowedUserIds?: string[] | null;
  allowedUserEmails?: string[] | null;
}

export interface BookReaderIdentity {
  userId?: string | null;
  userEmail?: string | null;
  role?: 'user' | 'admin' | null;
}

export function normalizeEmail(value?: string | null): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}

export function parseAllowedEmails(rawValue?: string | null): string[] {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(/[\n,]/)
    .map((entry) => normalizeEmail(entry))
    .filter((entry): entry is string => Boolean(entry));
}

export function isBookRestricted(book: BookAccessSettings | null | undefined): boolean {
  return book?.accessLevel === 'restricted';
}

export function canReadBook(
  book: BookAccessSettings | null | undefined,
  identity: BookReaderIdentity | null | undefined
): boolean {
  if (!isBookRestricted(book)) {
    return true;
  }

  if (identity?.role === 'admin') {
    return true;
  }

  const userId = identity?.userId?.trim();
  if (userId && Array.isArray(book?.allowedUserIds) && book.allowedUserIds.includes(userId)) {
    return true;
  }

  const userEmail = normalizeEmail(identity?.userEmail);
  if (userEmail && Array.isArray(book?.allowedUserEmails)) {
    return book.allowedUserEmails.map((email) => normalizeEmail(email)).includes(userEmail);
  }

  return false;
}
