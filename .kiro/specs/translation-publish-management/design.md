# Design Document: Book Publish Management

## Overview

This design implements a publish/unpublish system for individual Bible books within translations, allowing administrators to control which books are visible to end users. The system extends the existing Book data model with a publication status field and provides admin controls for managing book visibility at a granular level.

## Architecture

### Data Model Changes

The Book type will be extended to include publication status:

```typescript
export type Book = { 
  name: string; 
  chapters: Chapter[];
  published?: boolean; // NEW: Publication status (defaults to true)
};

export type Translation = { 
  id: string; 
  name: string; 
  books: Book[]; // Books now include publication status
  createdAt?: Date;
  updatedAt?: Date;
};
```

### Component Architecture

```
Admin Page
├── BookManagementSection (NEW)
│   ├── TranslationBookList
│   │   ├── TranslationGroup
│   │   │   ├── BookCard (enhanced)
│   │   │   │   ├── BookPublicationStatusBadge
│   │   │   │   └── BookPublishToggleButton
│   │   │   └── BulkBookActions (optional)
│   │   └── TranslationSummary
│   └── BookPublicationControls
└── Existing Upload/Edit Sections
```

### Service Layer Updates

```
TranslationService (enhanced)
├── toggleBookPublicationStatus()
├── getTranslationsWithPublishedBooks()
├── getAllTranslationsForAdmin()
├── bulkUpdateBookPublicationStatus()
└── filterPublishedBooks()

OptimizedCacheManager (enhanced)
├── filterTranslationsWithPublishedBooks()
└── updateBookPublicationStatus()

OptimizedFirestoreRepository (enhanced)
├── updateBookPublicationStatus()
└── getTranslationsWithBookFiltering()
```

## Components and Interfaces

### 1. BookManagementSection Component

```typescript
interface BookManagementProps {
  translations: Translation[];
  onBookPublicationToggle: (translationId: string, bookName: string, published: boolean) => Promise<void>;
  onBulkBookPublicationUpdate: (translationId: string, bookNames: string[], published: boolean) => Promise<void>;
}
```

**Responsibilities:**
- Display all translations with their books and publication status
- Provide individual book publish/unpublish controls
- Show book metadata (chapter count, verse count)
- Handle bulk operations for books within translations
- Show translation-level summaries (published vs unpublished books)

### 2. BookPublishToggleButton Component

```typescript
interface BookPublishToggleButtonProps {
  translationId: string;
  bookName: string;
  published: boolean;
  loading?: boolean;
  onToggle: (translationId: string, bookName: string, published: boolean) => Promise<void>;
}
```

**Responsibilities:**
- Display current book publication status
- Handle book publish/unpublish actions
- Show loading state during operations
- Provide visual feedback for success/error

### 3. BookPublicationStatusBadge Component

```typescript
interface BookPublicationStatusBadgeProps {
  published: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**Responsibilities:**
- Visual indicator of book publication status
- Consistent styling across the application

### 4. TranslationGroup Component

```typescript
interface TranslationGroupProps {
  translation: Translation;
  onBookPublicationToggle: (translationId: string, bookName: string, published: boolean) => Promise<void>;
  onBulkBookPublicationUpdate: (translationId: string, bookNames: string[], published: boolean) => Promise<void>;
}
```

**Responsibilities:**
- Group books by translation
- Show translation name and summary statistics
- Provide bulk actions for all books in translation

## Data Models

### Enhanced Book Model

```typescript
export type Book = { 
  name: string; 
  chapters: Chapter[];
  published?: boolean; // Default: true
};
```

### Book Publication Status Update Request

```typescript
interface BookPublicationStatusUpdate {
  translationId: string;
  bookName: string;
  published: boolean;
  updatedAt: Date;
}
```

### Translation Summary

```typescript
interface TranslationSummary {
  translationId: string;
  translationName: string;
  totalBooks: number;
  publishedBooks: number;
  unpublishedBooks: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

<function_calls>
<invoke name="prework">
<parameter name="featureName">translation-publish-management

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Book Publication Default State
*For any* newly created book, the published field should be set to true by default
**Validates: Requirements 1.1, 1.2**

### Property 2: Book Publication Toggle
*For any* book, toggling its publication status should result in the opposite boolean value
**Validates: Requirements 1.3, 1.4**

### Property 3: Publication Status Persistence
*For any* book publication status change, querying Firestore immediately after should return the updated status
**Validates: Requirements 1.5, 5.1**

### Property 4: Admin View Completeness
*For any* translation, the admin view should display all books regardless of their publication status
**Validates: Requirements 2.1**

### Property 5: Admin Button State Consistency
*For any* book, if published is true then admin view shows "Unpublish" button, if published is false then admin view shows "Publish" button
**Validates: Requirements 2.3, 2.4**

### Property 6: End User Book Filtering
*For any* end user query, all returned books should have published status set to true
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 7: Translation Visibility Rule
*For any* translation displayed to end users, it should contain at least one book with published status true
**Validates: Requirements 3.4**

### Property 8: Search Content Filtering
*For any* search query result, all returned content should come from books with published status true
**Validates: Requirements 3.5**

### Property 9: Book Access Control
*For any* attempt to access a book with published status false by end users, the system should deny access
**Validates: Requirements 3.6**

### Property 10: Book Grouping Consistency
*For any* admin view, books should be grouped under their respective translation and display correct metadata
**Validates: Requirements 4.2, 4.3, 4.4**

### Property 11: Bulk Operation Consistency
*For any* bulk publish/unpublish operation on multiple books, all selected books should have the same final publication status
**Validates: Requirements 4.5**

### Property 12: Summary Statistics Accuracy
*For any* translation, the displayed published/unpublished book counts should match the actual counts in the data
**Validates: Requirements 4.6**

### Property 13: Cache Synchronization
*For any* book publication status change, all cache layers should reflect the same updated status
**Validates: Requirements 5.4, 5.5**

### Property 14: Session Persistence
*For any* book publication status, refreshing the page should maintain the same status
**Validates: Requirements 5.2, 5.3**

### Property 15: Feedback Consistency
*For any* publication status change operation, success should show success feedback and failure should show error feedback
**Validates: Requirements 6.1, 6.2**

### Property 16: Offline Queue Behavior
*For any* publication status change made while offline, the change should be queued and processed when connectivity returns
**Validates: Requirements 6.3, 6.4**

### Property 17: Concurrency Control
*For any* book, simultaneous publication status changes should be handled without data corruption
**Validates: Requirements 6.5**

## Error Handling

### Publication Status Update Failures
- Network connectivity issues during status updates
- Firestore write permission errors
- Concurrent modification conflicts
- Invalid book or translation references

**Mitigation Strategies:**
- Retry mechanism with exponential backoff
- Offline queue for status changes
- Optimistic UI updates with rollback on failure
- Validation of book/translation existence before updates

### Cache Inconsistency
- Cache layers becoming out of sync with Firestore
- Stale publication status in different cache levels
- Race conditions during cache updates

**Mitigation Strategies:**
- Cache invalidation on publication status changes
- Consistent cache update ordering
- Cache versioning and validation
- Fallback to Firestore on cache misses

### UI State Management
- Button states not reflecting actual publication status
- Loading states not clearing after operations
- Bulk operation partial failures

**Mitigation Strategies:**
- State synchronization after all operations
- Timeout handling for loading states
- Granular error reporting for bulk operations
- UI state validation against data source

## Testing Strategy

### Unit Testing
- Test individual book publication status changes
- Test filtering logic for published/unpublished books
- Test cache update mechanisms
- Test UI component state management
- Test error handling scenarios

### Property-Based Testing
- Use property-based testing framework (e.g., fast-check for TypeScript)
- Generate random book/translation combinations
- Test publication status invariants across operations
- Verify filtering consistency across different query types
- Test cache synchronization properties
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: book-publish-management, Property {number}: {property_text}**

### Integration Testing
- Test end-to-end publication status workflows
- Test admin UI interactions with backend services
- Test cache layer integration
- Test offline/online synchronization
- Test concurrent user scenarios

### Performance Testing
- Test publication status filtering performance with large datasets
- Test cache performance with frequent status changes
- Test bulk operation performance
- Test UI responsiveness during status updates

The testing approach ensures both specific examples work correctly (unit tests) and universal properties hold across all inputs (property-based tests), providing comprehensive coverage of the book publication management system.