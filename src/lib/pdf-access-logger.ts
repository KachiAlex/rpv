import { getApiUrl } from './api-config';

interface AccessLogInput {
  bookId: string;
  bookTitle: string;
  accessType: 'view' | 'page_turn' | 'download_attempt';
  pageNumber?: number;
}

/**
 * Log PDF access for security and analytics via API
 */
export async function logPdfAccess(data: AccessLogInput) {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('rpv:authToken') : null;

    const res = await fetch(getApiUrl('/api/books/log-access/'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookId: data.bookId,
        accessType: data.accessType,
        pageNumber: data.pageNumber,
      }),
    });

    if (!res.ok) {
      console.error('Log access API error:', res.status);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error('Error logging PDF access:', error);
    return null;
  }
}

/**
 * Log page view
 */
export async function logPageView(bookId: string, bookTitle: string, pageNumber: number) {
  return logPdfAccess({
    bookId,
    bookTitle,
    accessType: 'page_turn',
    pageNumber,
  });
}

/**
 * Log book view
 */
export async function logBookView(bookId: string, bookTitle: string) {
  return logPdfAccess({
    bookId,
    bookTitle,
    accessType: 'view',
  });
}

/**
 * Log download attempt (blocked)
 */
export async function logDownloadAttempt(bookId: string, bookTitle: string) {
  return logPdfAccess({
    bookId,
    bookTitle,
    accessType: 'download_attempt',
  });
}
