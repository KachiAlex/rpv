# RPV Bible App - Architecture Recommendations

## Current Architecture

### Technology Stack
- **Frontend Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **PDF/DOCX Parsing**: pdfjs-dist, mammoth
- **Icons**: lucide-react
- **Deployment**: Firebase Hosting (Static Export)
- **Database**: Currently in-memory (Zustand store)

### Current Structure
```
rpv-bible/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── read/page.tsx      # Bible reader
│   │   ├── admin/page.tsx     # Admin upload/editing
│   │   ├── projector/page.tsx # Projector display
│   │   └── remote/page.tsx     # Remote controller
│   ├── components/            # Reusable components
│   │   ├── navbar.tsx
│   │   └── footer.tsx
│   └── lib/                    # Business logic
│       ├── store.ts           # Zustand state management
│       ├── firebase.ts        # Firebase initialization
│       └── pdf-parser.ts      # Document parsing
```

## Recommended Architecture Improvements

### 1. Data Persistence Layer

#### Current Issue
- Data is stored only in browser memory (Zustand)
- Lost on page refresh
- No multi-device sync
- No backup/recovery

#### Recommended Solution: Firebase Firestore

**Structure:**
```
firestore/
├── translations/{translationId}/
│   ├── id: string
│   ├── name: string
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── books/{bookName}/
│       ├── name: string
│       └── chapters/{chapterNumber}/
│           ├── number: number
│           └── verses/{verseNumber}/
│               ├── number: number
│               └── text: string
```

**Benefits:**
- Persistent storage across sessions
- Real-time sync across devices
- Offline support with Firestore cache
- Automatic versioning (can add version history)
- Scalable to millions of verses

**Implementation:**
```typescript
// src/lib/firestore.ts
import { collection, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export async function saveTranslation(translation: Translation) {
  const docRef = doc(db, 'translations', translation.id);
  await setDoc(docRef, translation, { merge: true });
}

export function subscribeToTranslation(id: string, callback: (t: Translation) => void) {
  return onSnapshot(doc(db, 'translations', id), (snap) => {
    callback(snap.data() as Translation);
  });
}
```

### 2. State Management Architecture

#### Current: Zustand (Simple Store)
**Pros:**
- Simple and lightweight
- Good for small apps
- Easy to understand

**Cons:**
- No persistence built-in
- No server sync
- Manual state updates

#### Recommended: Hybrid Approach

**Option A: Zustand + Firebase Persistence**
```typescript
// Use Zustand with Firebase persistence middleware
const useBibleStore = create(
  persist(
    (set, get) => ({
      // ... state
    }),
    {
      name: 'bible-storage',
      storage: createFirestoreStorage(), // Custom storage
    }
  )
);
```

**Option B: React Query + Zustand**
- React Query for server state (Firestore)
- Zustand for client-only UI state
- Automatic caching and sync

**Recommended: Option A** (simpler, fits current architecture)

### 3. File Upload Architecture

#### Current: Client-Side Only
- PDF/DOCX parsed in browser
- Large files may cause memory issues
- No progress tracking
- No error recovery

#### Recommended: Hybrid Approach

**Small Files (< 5MB): Client-Side**
- Parse directly in browser
- Immediate feedback
- No server costs

**Large Files (> 5MB): Server-Side Processing**
- Upload to Firebase Storage
- Use Cloud Functions for parsing
- Process in background
- Notify user when complete

**Implementation:**
```typescript
// src/lib/upload-service.ts
export async function uploadDocument(file: File) {
  if (file.size > 5 * 1024 * 1024) {
    // Large file: upload to storage and process server-side
    return await uploadToFirebaseStorage(file);
  } else {
    // Small file: parse client-side
    return await parseDocument(file);
  }
}
```

### 4. Projection System Architecture

#### Current: localStorage + Firestore
- Simple channel-based sync
- Works for basic use cases

#### Recommended: Enhanced Real-Time System

**Firestore Structure:**
```
firestore/
├── channels/{channelId}/
│   ├── currentVerse: {
│   │     translation: string
│   │     book: string
│   │     chapter: number
│   │     verse: number
│   │     text: string
│   │   }
│   ├── history: array of verse references
│   └── createdAt: timestamp
```

**Features:**
- Real-time updates via Firestore listeners
- Version history (track verse changes)
- Multiple channels support
- Queue system for multiple verses

### 5. API Layer Architecture

#### Current: Direct Firestore Access
- Components directly access Firestore
- No abstraction layer

#### Recommended: Service Layer Pattern

```
src/
├── lib/
│   ├── services/
│   │   ├── translation-service.ts    # Translation CRUD
│   │   ├── upload-service.ts          # Document upload
│   │   ├── projection-service.ts      # Projection sync
│   │   └── verse-service.ts           # Verse operations
│   ├── repositories/
│   │   └── firestore-repository.ts    # Firestore abstraction
│   └── types/
│       └── index.ts                   # TypeScript types
```

**Benefits:**
- Separation of concerns
- Easy to test
- Easy to swap implementations
- Centralized error handling

**Example:**
```typescript
// src/lib/services/translation-service.ts
export class TranslationService {
  async getTranslation(id: string): Promise<Translation> {
    return await firestoreRepository.getTranslation(id);
  }
  
  async saveTranslation(translation: Translation): Promise<void> {
    await firestoreRepository.saveTranslation(translation);
    await this.invalidateCache(id);
  }
  
  async mergeTranslation(translation: Translation): Promise<void> {
    const existing = await this.getTranslation(translation.id);
    const merged = this.mergeTranslations(existing, translation);
    await this.saveTranslation(merged);
  }
}
```

### 6. Caching Strategy

#### Recommended: Multi-Layer Caching

**Layer 1: Browser Memory (Zustand)**
- Fastest access
- For active reading session
- Auto-expires on page refresh

**Layer 2: IndexedDB (Browser)**
- Persistent browser storage
- For offline access
- Cache recently accessed translations

**Layer 3: Firestore (Server)**
- Source of truth
- Full translation data
- Real-time sync

**Implementation:**
```typescript
// src/lib/cache-manager.ts
export class CacheManager {
  async getTranslation(id: string): Promise<Translation | null> {
    // 1. Check Zustand store (memory)
    // 2. Check IndexedDB (persistent)
    // 3. Fetch from Firestore
    // 4. Update all caches
  }
}
```

### 7. Error Handling Architecture

#### Current: Basic try-catch
- Errors shown via alerts
- No centralized error handling

#### Recommended: Error Boundary + Error Service

```typescript
// src/lib/services/error-service.ts
export class ErrorService {
  logError(error: Error, context: string) {
    // Log to Firebase Crashlytics
    // Send to monitoring service
    // Show user-friendly message
  }
}

// src/components/error-boundary.tsx
export class ErrorBoundary extends React.Component {
  // Catch React errors
  // Show user-friendly UI
  // Log errors
}
```

### 8. Performance Optimization

#### Current Issues
- All verses loaded at once
- No pagination
- Large documents may slow parsing

#### Recommended Optimizations

**1. Lazy Loading**
```typescript
// Load chapters on-demand
const chapter = await loadChapter(translationId, book, chapterNum);
```

**2. Virtual Scrolling**
- Use `react-window` or `react-virtual`
- Only render visible verses
- Handle thousands of verses efficiently

**3. Code Splitting**
```typescript
// Dynamic imports for heavy features
const PDFParser = lazy(() => import('@/lib/pdf-parser'));
```

**4. Image Optimization**
- Use Next.js Image component
- Optimize any book covers or illustrations

### 9. Security Architecture

#### Current: None (Client-Side Only)

#### Recommended: Firebase Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin-only access
    match /translations/{translationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   request.auth.token.admin == true;
    }
    
    // Public read, authenticated write
    match /channels/{channelId} {
      allow read: if true; // Public reading
      allow write: if request.auth != null;
    }
  }
}
```

### 10. Testing Architecture

#### Recommended: Multi-Level Testing

**Unit Tests:**
- Services and utilities
- Parsing logic
- State management

**Integration Tests:**
- API endpoints
- Firestore operations
- Component interactions

**E2E Tests:**
- Critical user flows
- Upload process
- Projection sync

**Tools:**
- Jest for unit tests
- React Testing Library for components
- Playwright for E2E tests

### 11. Deployment Architecture

#### Current: Static Export
- Simple deployment
- No server-side features

#### Recommended: Hybrid Deployment

**Option A: Static + Cloud Functions**
- Static site for frontend
- Cloud Functions for heavy processing
- Firestore for data

**Option B: Next.js Full Stack**
- Server-side rendering
- API routes for processing
- Better SEO

**Recommended: Option A** (simpler, lower cost)

### 12. Mobile App Architecture

#### Current: Web Only

#### Recommended: Progressive Web App (PWA)

**Features:**
- Installable on mobile
- Offline support
- Push notifications
- Native-like experience

**Implementation:**
```typescript
// next.config.mjs
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  // ... config
});
```

### 13. Monitoring & Analytics

#### Recommended: Firebase Analytics + Crashlytics

**Track:**
- User engagement
- Feature usage
- Error rates
- Performance metrics

**Implementation:**
```typescript
// src/lib/analytics.ts
import { logEvent } from 'firebase/analytics';

export function trackEvent(eventName: string, params: object) {
  logEvent(analytics, eventName, params);
}
```

## Migration Path

### Phase 1: Data Persistence (Priority: High)
1. Set up Firestore database
2. Create migration script from Zustand to Firestore
3. Update store to sync with Firestore
4. Test offline functionality

### Phase 2: Service Layer (Priority: Medium)
1. Create service layer abstraction
2. Move business logic to services
3. Update components to use services
4. Add error handling

### Phase 3: Performance (Priority: Medium)
1. Implement lazy loading
2. Add virtual scrolling
3. Optimize bundle size
4. Add caching layer

### Phase 4: Security & Testing (Priority: Low)
1. Add Firestore security rules
2. Set up authentication
3. Add unit tests
4. Add E2E tests

## Architecture Decision Records (ADR)

### ADR-001: Why Zustand over Redux?
- Simpler API
- Less boilerplate
- Good TypeScript support
- Sufficient for app size

### ADR-002: Why Firestore over SQL?
- Flexible schema (books vary in structure)
- Real-time sync built-in
- Easy offline support
- Serverless (no server management)

### ADR-003: Why Static Export?
- Lower hosting costs
- Better performance
- Simpler deployment
- CDN distribution

## Recommended File Structure

```
rpv-bible/
├── src/
│   ├── app/                    # Next.js pages
│   ├── components/            # UI components
│   │   ├── ui/                # Reusable UI primitives
│   │   └── features/         # Feature-specific components
│   ├── lib/
│   │   ├── services/          # Business logic services
│   │   ├── repositories/      # Data access layer
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Utility functions
│   │   └── types/             # TypeScript types
│   ├── stores/                # Zustand stores
│   └── config/                # Configuration files
├── public/                     # Static assets
├── tests/                      # Test files
└── docs/                       # Documentation
```

## Summary

**Current State:** Simple, functional, client-side only
**Recommended State:** Production-ready with persistence, security, and scalability

**Key Improvements:**
1. ✅ Add Firestore for data persistence
2. ✅ Implement service layer pattern
3. ✅ Add caching strategy
4. ✅ Enhance error handling
5. ✅ Add security rules
6. ✅ Optimize performance
7. ✅ Add PWA support
8. ✅ Implement monitoring

**Priority Order:**
1. **High**: Data persistence (Firestore)
2. **Medium**: Service layer, performance optimization
3. **Low**: Testing, advanced features

This architecture will scale from hundreds to millions of verses while maintaining good performance and user experience.

