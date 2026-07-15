# React Native APK Build Design Document

## Overview

This design document outlines the architecture and implementation strategy for building a full-featured Android APK of the RPV Bible application using React Native. The application will maintain feature parity with the web version while providing native Android performance, offline capability, and a touch-optimized interface.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Native App                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Navigation  │  │     UI       │  │   Storage    │  │
│  │   Stack      │  │  Components  │  │   (SQLite)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Search     │  │  Translation │  │   Offline    │  │
│  │   Engine     │  │   Manager    │  │   Cache      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Firebase   │  │   Backend    │  │   Device     │  │
│  │   Services   │  │   API        │  │   APIs       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Stack, Tab, Drawer)
- **State Management**: Zustand (same as web app)
- **Local Storage**: SQLite (via expo-sqlite)
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **API Communication**: Axios with offline queue
- **UI Components**: React Native Paper or custom components
- **Build Tool**: Expo EAS Build for APK generation

## Components and Interfaces

### 1. Navigation Structure

```typescript
interface NavigationStack {
  Home: undefined;
  BibleSearch: { query?: string };
  BibleRead: { book: string; chapter: number };
  Bookmarks: undefined;
  Settings: undefined;
  Admin: undefined;
}
```

### 2. Bible Search Engine

```typescript
interface SearchEngine {
  search(query: string): Promise<SearchResult[]>;
  searchOffline(query: string): SearchResult[];
  getRecentSearches(): string[];
  clearSearchHistory(): void;
}

interface SearchResult {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}
```

### 3. Translation Manager

```typescript
interface TranslationManager {
  getAvailableTranslations(): Promise<Translation[]>;
  selectTranslation(id: string): Promise<void>;
  getCurrentTranslation(): Translation;
  downloadTranslation(id: string): Promise<void>;
  getLocalTranslations(): Translation[];
}

interface Translation {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  isDownloaded: boolean;
  size: number;
}
```

### 4. Offline Cache

```typescript
interface OfflineCache {
  initializeCache(): Promise<void>;
  cacheVerse(verse: Verse): Promise<void>;
  cacheBook(book: string, translation: string): Promise<void>;
  getVerse(book: string, chapter: number, verse: number): Promise<Verse | null>;
  searchCache(query: string): Promise<Verse[]>;
  getCacheSize(): Promise<number>;
  clearCache(): Promise<void>;
}

interface Verse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}
```

### 5. Firebase Integration

```typescript
interface FirebaseService {
  authenticate(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  saveBookmark(verse: Verse): Promise<void>;
  getBookmarks(): Promise<Verse[]>;
  syncPreferences(): Promise<void>;
  getPreferences(): Promise<UserPreferences>;
}

interface UserPreferences {
  fontSize: number;
  theme: 'light' | 'dark';
  translation: string;
  lastReadPosition: ReadPosition;
}

interface ReadPosition {
  book: string;
  chapter: number;
  verse: number;
}
```

## Data Models

### Verse Model
```typescript
interface Verse {
  id: string;
  book: string;
  bookNumber: number;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  timestamp: number;
}
```

### User Model
```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  preferences: UserPreferences;
  bookmarks: Verse[];
  lastSyncTime: number;
}
```

### Cache Schema (SQLite)
```sql
CREATE TABLE verses (
  id TEXT PRIMARY KEY,
  book TEXT,
  chapter INTEGER,
  verse INTEGER,
  text TEXT,
  translation TEXT,
  timestamp INTEGER
);

CREATE TABLE translations (
  id TEXT PRIMARY KEY,
  name TEXT,
  abbreviation TEXT,
  language TEXT,
  isDownloaded BOOLEAN,
  size INTEGER
);

CREATE TABLE preferences (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Search Consistency
*For any* search query, whether online or offline, the search results SHALL contain all matching verses in the cache or backend.
**Validates: Requirements 3.1, 3.4, 6.3**

### Property 2: Translation Persistence
*For any* selected translation, the app SHALL maintain that selection across app restarts and device rotations.
**Validates: Requirements 5.3**

### Property 3: Offline Availability
*For any* verse that has been cached, the app SHALL display it when offline without requiring network access.
**Validates: Requirements 6.2, 6.3**

### Property 4: Sync Consistency
*For any* user data change (bookmarks, preferences), the app SHALL eventually sync with Firebase when online.
**Validates: Requirements 7.2, 7.3, 7.5**

### Property 5: UI Responsiveness
*For any* user interaction, the app SHALL respond within 100ms without blocking the UI thread.
**Validates: Requirements 8.4**

### Property 6: Responsive Layout
*For any* screen size or orientation, the UI components SHALL adapt and remain readable.
**Validates: Requirements 8.1, 8.2**

### Property 7: Offline Queue Integrity
*For any* offline changes, the app SHALL preserve them in a queue and sync them in order when online.
**Validates: Requirements 6.4, 7.5**

### Property 8: Authentication State
*For any* authentication state change, the app SHALL update all screens to reflect the current user.
**Validates: Requirements 7.1**

### Property 9: Performance Under Load
*For any* large search result set (1000+ verses), the app SHALL render and scroll smoothly.
**Validates: Requirements 8.3, 8.4**

### Property 10: Data Integrity
*For any* app crash or force close, the app SHALL recover without data loss.
**Validates: Requirements 10.4**

## Error Handling

### Network Errors
- **No internet connection**: Display cached content, queue changes for sync
- **API timeout**: Retry with exponential backoff, show user-friendly error
- **Firebase auth failure**: Prompt user to re-authenticate

### Storage Errors
- **Insufficient storage**: Prompt user to free space or select translations to remove
- **Database corruption**: Rebuild cache from backend
- **Cache miss**: Fetch from backend and cache for future use

### Performance Issues
- **Slow search**: Show loading indicator, implement pagination
- **Memory pressure**: Clear old cache entries, reduce image resolution
- **Battery drain**: Reduce sync frequency, disable background updates

## Testing Strategy

### Unit Testing
- Search engine query parsing and matching
- Translation selection and persistence
- Offline cache operations
- Firebase sync logic
- UI component rendering

### Integration Testing
- End-to-end search workflow (online and offline)
- Translation switching with content updates
- Bookmark creation and sync
- Preference persistence across app restarts
- Offline to online transition

### Property-Based Testing
- Search results consistency across different queries
- Cache integrity after multiple operations
- Sync queue ordering and completion
- UI responsiveness under various loads

### Device Testing
- Real Android devices (phones and tablets)
- Different Android versions (API 24+)
- Various screen sizes and orientations
- Low-end devices with limited RAM
- Network conditions (WiFi, 4G, 3G, offline)

## Build and Deployment

### Build Process
1. Configure Expo project with Android settings
2. Set up signing certificate for release builds
3. Configure Firebase credentials
4. Build APK using Expo EAS Build
5. Test on real devices
6. Sign and optimize APK
7. Upload to Google Play Store

### Version Management
- Semantic versioning (MAJOR.MINOR.PATCH)
- Update version in app.json before each build
- Tag releases in Git
- Maintain changelog

### Distribution
- Google Play Store (primary)
- Direct APK download (secondary)
- Beta testing via Google Play Beta channel

## Performance Targets

- **App startup**: < 3 seconds
- **Search response**: < 500ms (online), < 100ms (offline)
- **Screen transition**: < 300ms
- **Scroll performance**: 60 FPS
- **Memory usage**: < 150MB
- **APK size**: < 50MB (compressed)

## Security Considerations

- Firebase authentication with email/password
- Encrypted local storage for sensitive data
- HTTPS for all API calls
- Secure token storage using device keychain
- Input validation and sanitization
- No hardcoded credentials or API keys

