import searchService from '../services/searchService';
import cacheService from '../services/cacheService';
import offlineQueueService from '../services/offlineQueueService';

describe('Search Workflow Integration', () => {
  it('should search and cache results', async () => {
    // Search for verses
    const results = await searchService.search({
      query: 'John 3:16',
      limit: 10,
    });

    // Cache results
    for (const result of results) {
      await cacheService.cacheVerse(result);
    }

    // Verify cached
    const cached = await cacheService.searchCached('John');
    expect(cached.length).toBeGreaterThan(0);
  });

  it('should handle offline to online transition', async () => {
    // Queue offline change
    await offlineQueueService.queueBookmarkAdd('verse-1', 'user-1');

    // Get queue
    const queue = await offlineQueueService.getQueue();
    expect(queue.length).toBeGreaterThan(0);

    // Clear queue (simulating sync)
    await offlineQueueService.clearQueue();
    const emptyQueue = await offlineQueueService.getQueue();
    expect(emptyQueue.length).toBe(0);
  });

  it('should maintain bookmark consistency', async () => {
    const bookmarkId = 'test-bookmark-1';
    const userId = 'test-user-1';

    // Add bookmark to queue
    await offlineQueueService.queueBookmarkAdd(bookmarkId, userId);

    // Verify in queue
    const queue = await offlineQueueService.getQueue();
    expect(queue.some((item) => item.type === 'bookmark_add')).toBe(true);

    // Remove bookmark
    await offlineQueueService.queueBookmarkRemove(bookmarkId, userId);

    // Verify removal queued
    const updatedQueue = await offlineQueueService.getQueue();
    expect(updatedQueue.some((item) => item.type === 'bookmark_remove')).toBe(true);
  });
});

describe('Offline Cache Workflow', () => {
  it('should cache and retrieve verses offline', async () => {
    const testVerse = {
      id: 'offline-test-1',
      book: 'Matthew',
      chapter: 5,
      verse: 7,
      text: 'Blessed are the merciful...',
      translation: 'KJV',
    };

    // Cache verse
    await cacheService.cacheVerse(testVerse);

    // Retrieve from cache
    const retrieved = await cacheService.getVerse('offline-test-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.text).toBe(testVerse.text);
  });

  it('should search cached data', async () => {
    // Cache multiple verses
    const verses = [
      {
        id: 'cache-1',
        book: 'Luke',
        chapter: 1,
        verse: 1,
        text: 'Forasmuch as many have taken in hand...',
        translation: 'KJV',
      },
      {
        id: 'cache-2',
        book: 'Luke',
        chapter: 1,
        verse: 2,
        text: 'Even as they delivered them unto us...',
        translation: 'KJV',
      },
    ];

    for (const verse of verses) {
      await cacheService.cacheVerse(verse);
    }

    // Search cache
    const results = await cacheService.searchCached('Luke');
    expect(results.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Preference Sync Workflow', () => {
  it('should queue preference updates', async () => {
    const userId = 'test-user-1';
    const preferences = {
      fontSize: 18,
      darkMode: true,
      notifications: false,
    };

    // Queue preference update
    await offlineQueueService.queuePreferenceUpdate(userId, preferences);

    // Verify in queue
    const queue = await offlineQueueService.getQueue();
    expect(queue.some((item) => item.type === 'preference_update')).toBe(true);
  });
});
