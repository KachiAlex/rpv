import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('rpv_bible.db');

// Database version for migrations
const DB_VERSION = 1;

export async function initializeDatabase(): Promise<void> {
  try {
    // Create verses table with indexes for efficient searching
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS verses (
        id TEXT PRIMARY KEY,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        text TEXT NOT NULL,
        translation TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );
    `);

    // Create indexes for efficient searching
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_verses_book_chapter_verse 
      ON verses(book, chapter, verse);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_verses_translation 
      ON verses(translation);
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_verses_text_search 
      ON verses(text);
    `);

    // Create translations table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS translations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        abbreviation TEXT NOT NULL,
        language TEXT NOT NULL,
        isDownloaded INTEGER NOT NULL,
        size INTEGER NOT NULL,
        downloadedAt INTEGER
      );
    `);

    // Create preferences table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);

    // Create bookmarks table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        verseId TEXT NOT NULL,
        userId TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY (verseId) REFERENCES verses(id)
      );
    `);

    // Create index for bookmarks lookup
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_bookmarks_userId 
      ON bookmarks(userId);
    `);

    // Create offline queue table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_queue (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        data TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Create index for offline queue
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_offline_queue_synced 
      ON offline_queue(synced);
    `);

    // Create cache metadata table for tracking cache size and stats
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cache_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  verseCount: number;
  translationCount: number;
  bookmarkCount: number;
  queuedChanges: number;
}> {
  try {
    const verseCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM verses'
    );
    const translationCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM translations WHERE isDownloaded = 1'
    );
    const bookmarkCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM bookmarks'
    );
    const queuedChanges = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM offline_queue WHERE synced = 0'
    );

    return {
      verseCount: verseCount?.count || 0,
      translationCount: translationCount?.count || 0,
      bookmarkCount: bookmarkCount?.count || 0,
      queuedChanges: queuedChanges?.count || 0,
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      verseCount: 0,
      translationCount: 0,
      bookmarkCount: 0,
      queuedChanges: 0,
    };
  }
}

/**
 * Clear old cached verses (older than specified days)
 */
export async function clearOldCache(daysOld: number = 30): Promise<number> {
  try {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const result = await db.runAsync(
      'DELETE FROM verses WHERE timestamp < ?',
      [cutoffTime]
    );
    return result.changes || 0;
  } catch (error) {
    console.error('Error clearing old cache:', error);
    return 0;
  }
}

export async function cacheVerse(
  id: string,
  book: string,
  chapter: number,
  verse: number,
  text: string,
  translation: string
): Promise<void> {
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO verses (id, book, chapter, verse, text, translation, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, book, chapter, verse, text, translation, Date.now()]
    );
  } catch (error) {
    console.error('Error caching verse:', error);
    throw error;
  }
}

export async function getVerse(
  book: string,
  chapter: number,
  verse: number,
  translation: string
): Promise<any> {
  try {
    const result = await db.getFirstAsync(
      `SELECT * FROM verses WHERE book = ? AND chapter = ? AND verse = ? AND translation = ?`,
      [book, chapter, verse, translation]
    );
    return result;
  } catch (error) {
    console.error('Error getting verse:', error);
    throw error;
  }
}

export async function searchVerses(query: string, translation: string): Promise<any[]> {
  try {
    const results = await db.getAllAsync(
      `SELECT * FROM verses WHERE (text LIKE ? OR book LIKE ?) AND translation = ? LIMIT 50`,
      [`%${query}%`, `%${query}%`, translation]
    );
    return results;
  } catch (error) {
    console.error('Error searching verses:', error);
    throw error;
  }
}

export async function savePreference(key: string, value: string): Promise<void> {
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)`,
      [key, value]
    );
  } catch (error) {
    console.error('Error saving preference:', error);
    throw error;
  }
}

export async function getPreference(key: string): Promise<string | null> {
  try {
    const result = await db.getFirstAsync(
      `SELECT value FROM preferences WHERE key = ?`,
      [key]
    );
    return result?.value || null;
  } catch (error) {
    console.error('Error getting preference:', error);
    throw error;
  }
}

export async function addBookmark(
  id: string,
  verseId: string,
  userId: string
): Promise<void> {
  try {
    await db.runAsync(
      `INSERT INTO bookmarks (id, verseId, userId, createdAt) VALUES (?, ?, ?, ?)`,
      [id, verseId, userId, Date.now()]
    );
  } catch (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }
}

export async function getBookmarks(userId: string): Promise<any[]> {
  try {
    const results = await db.getAllAsync(
      `SELECT v.* FROM verses v
       JOIN bookmarks b ON v.id = b.verseId
       WHERE b.userId = ?
       ORDER BY b.createdAt DESC`,
      [userId]
    );
    return results;
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    throw error;
  }
}

export async function queueOfflineChange(
  id: string,
  action: string,
  data: any
): Promise<void> {
  try {
    await db.runAsync(
      `INSERT INTO offline_queue (id, action, data, createdAt) VALUES (?, ?, ?, ?)`,
      [id, action, JSON.stringify(data), Date.now()]
    );
  } catch (error) {
    console.error('Error queuing offline change:', error);
    throw error;
  }
}

export async function getOfflineQueue(): Promise<any[]> {
  try {
    const results = await db.getAllAsync(
      `SELECT * FROM offline_queue WHERE synced = 0 ORDER BY createdAt ASC`
    );
    return results;
  } catch (error) {
    console.error('Error getting offline queue:', error);
    throw error;
  }
}

export async function markQueueItemSynced(id: string): Promise<void> {
  try {
    await db.runAsync(
      `UPDATE offline_queue SET synced = 1 WHERE id = ?`,
      [id]
    );
  } catch (error) {
    console.error('Error marking queue item synced:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  verseCount: number;
  translationCount: number;
  bookmarkCount: number;
  queuedChanges: number;
}> {
  try {
    const verseCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM verses'
    );
    const translationCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM translations WHERE isDownloaded = 1'
    );
    const bookmarkCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM bookmarks'
    );
    const queuedChanges = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM offline_queue WHERE synced = 0'
    );

    return {
      verseCount: verseCount?.count || 0,
      translationCount: translationCount?.count || 0,
      bookmarkCount: bookmarkCount?.count || 0,
      queuedChanges: queuedChanges?.count || 0,
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      verseCount: 0,
      translationCount: 0,
      bookmarkCount: 0,
      queuedChanges: 0,
    };
  }
}

/**
 * Clear old cached verses (older than specified days)
 */
export async function clearOldCache(daysOld: number = 30): Promise<number> {
  try {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const result = await db.runAsync(
      'DELETE FROM verses WHERE timestamp < ?',
      [cutoffTime]
    );
    return result.changes || 0;
  } catch (error) {
    console.error('Error clearing old cache:', error);
    return 0;
  }
}
