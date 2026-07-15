# Implementation Plan: Book Publish Management

## Overview

Implement book-level publish/unpublish functionality allowing administrators to control which individual books within translations are visible to end users. This provides granular content management at the book level rather than translation level.

## Tasks

- [-] 1. Update Data Models and Types
  - [x] 1.1 Extend Book type with published field
    - Add `published?: boolean` field to Book type in src/lib/types/index.ts
    - Set default value to true for backward compatibility
    - _Requirements: 1.1, 1.2_

  - [ ]* 1.2 Write property test for Book model
    - **Property 1: Book Publication Default State**
    - **Validates: Requirements 1.1, 1.2**

- [x] 2. Update Repository Layer
  - [x] 2.1 Enhance OptimizedFirestoreRepository for book publication
    - Add updateBookPublicationStatus method
    - Add getTranslationsWithBookFiltering method
    - Handle book-level updates within translations
    - _Requirements: 1.5, 5.1_

  - [ ]* 2.2 Write property test for repository book operations
    - **Property 3: Publication Status Persistence**
    - **Validates: Requirements 1.5, 5.1**

- [x] 3. Update Service Layer
  - [x] 3.1 Enhance TranslationService for book management
    - Add toggleBookPublicationStatus method
    - Add getTranslationsWithPublishedBooks method
    - Add filterPublishedBooks utility method
    - Add bulkUpdateBookPublicationStatus method
    - _Requirements: 1.3, 1.4, 3.1, 4.5_

  - [ ]* 3.2 Write property tests for service layer
    - **Property 2: Book Publication Toggle**
    - **Property 6: End User Book Filtering**
    - **Property 11: Bulk Operation Consistency**
    - **Validates: Requirements 1.3, 1.4, 3.1, 4.5**

- [x] 4. Update Cache Management
  - [x] 4.1 Enhance OptimizedCacheManager for book publication
    - Add filterTranslationsWithPublishedBooks method
    - Add updateBookPublicationStatus method
    - Handle cache invalidation for book status changes
    - _Requirements: 5.4, 5.5_

  - [ ]* 4.2 Write property test for cache synchronization
    - **Property 13: Cache Synchronization**
    - **Validates: Requirements 5.4, 5.5**

- [x] 5. Update Store and State Management
  - [x] 5.1 Add book publication methods to useBibleStore
    - Add toggleBookPublicationStatus action
    - Add bulkUpdateBookPublicationStatus action
    - Update existing methods to filter published books for end users
    - _Requirements: 2.5, 3.2, 3.3_

  - [ ]* 5.2 Write property test for store operations
    - **Property 14: Session Persistence**
    - **Validates: Requirements 5.2, 5.3**

- [x] 6. Create Book Publication UI Components
  - [x] 6.1 Create BookPublicationStatusBadge component
    - Visual indicator for published/unpublished status
    - Support different sizes (sm, md, lg)
    - Consistent styling with design system
    - _Requirements: 2.2, 2.7_

  - [x] 6.2 Create BookPublishToggleButton component
    - Toggle button for publish/unpublish actions
    - Loading state during operations
    - Success/error feedback
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

  - [ ]* 6.3 Write property tests for UI components
    - **Property 5: Admin Button State Consistency**
    - **Property 15: Feedback Consistency**
    - **Validates: Requirements 2.3, 2.4, 6.1, 6.2**

- [x] 7. Create Book Management Section
  - [x] 7.1 Create TranslationGroup component
    - Group books by translation
    - Show translation name and summary statistics
    - Provide bulk actions for books within translation
    - _Requirements: 4.1, 4.4, 4.6_

  - [x] 7.2 Create BookCard component
    - Display book name, chapter count, verse count
    - Show publication status badge
    - Include publish/unpublish toggle button
    - _Requirements: 4.2, 4.3_

  - [x] 7.3 Create BookManagementSection component
    - Main container for book management UI
    - Handle book publication toggle events
    - Handle bulk operations
    - _Requirements: 2.1, 4.5_

  - [ ]* 7.4 Write property tests for book management UI
    - **Property 4: Admin View Completeness**
    - **Property 10: Book Grouping Consistency**
    - **Property 12: Summary Statistics Accuracy**
    - **Validates: Requirements 2.1, 4.2, 4.3, 4.4, 4.6**

- [x] 8. Integrate Book Management into Admin Page
  - [x] 8.1 Add BookManagementSection to admin page
    - Import and render BookManagementSection component
    - Wire up event handlers for book publication actions
    - Add loading states and error handling
    - _Requirements: 2.1, 6.1, 6.2_

  - [x] 8.2 Update admin page layout
    - Position book management section appropriately
    - Ensure responsive design
    - Maintain existing upload/edit functionality
    - _Requirements: 4.1_

- [x] 9. Update End User Filtering
  - [x] 9.1 Update homepage translation filtering
    - Filter translations to only show those with published books
    - Update translation dropdown to exclude empty translations
    - _Requirements: 3.4_

  - [x] 9.2 Update search functionality
    - Filter search results to only include published books
    - Update search indexing to respect publication status
    - _Requirements: 3.5_

  - [x] 9.3 Update read page access control
    - Prevent access to unpublished books
    - Show appropriate error messages for unpublished content
    - Redirect to available content when possible
    - _Requirements: 3.6_

  - [ ]* 9.4 Write property tests for end user filtering
    - **Property 7: Translation Visibility Rule**
    - **Property 8: Search Content Filtering**
    - **Property 9: Book Access Control**
    - **Validates: Requirements 3.4, 3.5, 3.6**

- [x] 10. Add Offline Support
  - [x] 10.1 Implement offline queue for publication changes
    - Queue book publication status changes when offline
    - Process queued changes when connectivity returns
    - Handle queue persistence across sessions
    - _Requirements: 6.3, 6.4_

  - [ ]* 10.2 Write property test for offline behavior
    - **Property 16: Offline Queue Behavior**
    - **Validates: Requirements 6.3, 6.4**

- [x] 11. Add Concurrency Control
  - [x] 11.1 Implement optimistic locking for book updates
    - Prevent simultaneous publication status changes
    - Handle concurrent modification conflicts
    - Provide user feedback for conflicts
    - _Requirements: 6.5_

  - [ ]* 11.2 Write property test for concurrency control
    - **Property 17: Concurrency Control**
    - **Validates: Requirements 6.5**

- [x] 12. Final Integration and Testing
  - [x] 12.1 End-to-end testing
    - Test complete book publication workflows
    - Test admin and end user experiences
    - Test error scenarios and edge cases
    - _Requirements: All_

  - [x] 12.2 Performance optimization
    - Optimize book filtering queries
    - Optimize cache performance
    - Test with large datasets
    - _Requirements: 3.1, 5.4_

  - [x] 12.3 Issue Resolution
    - Fixed published books not showing content
    - Verified unpublished books are hidden from end users
    - Tested offline functionality
    - Deployed to production

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Focus on book-level granularity rather than translation-level
- Maintain backward compatibility with existing data
- Ensure published=true default for all existing books