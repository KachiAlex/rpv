# Requirements Document

## Introduction

This feature adds publish/unpublish functionality for individual books within translations on the admin page, allowing administrators to control which books are visible to end users. This provides granular content management capabilities for controlling the availability of uploaded Bible books.

## Glossary

- **Book**: An individual book of the Bible (e.g., Genesis, Matthew) within a translation
- **Translation**: A Bible translation containing multiple books
- **Admin_User**: A user with administrative privileges who can manage book publication status
- **End_User**: A regular user who views and reads Bible books
- **Published_Book**: A book that is visible to end users within a translation
- **Unpublished_Book**: A book that is hidden from end users but still accessible to admins

## Requirements

### Requirement 1: Book Publication Status

**User Story:** As an admin user, I want to control which books within each translation are visible to end users, so that I can manage content availability and hide incomplete or problematic books.

#### Acceptance Criteria

1. THE Book_Model SHALL include a published boolean field with default value true
2. WHEN a book is uploaded, THE System SHALL set published to true by default
3. WHEN a book is unpublished, THE System SHALL set published to false
4. WHEN a book is published, THE System SHALL set published to true
5. THE System SHALL persist book publication status changes to Firestore immediately

### Requirement 2: Admin Book Publication Controls

**User Story:** As an admin user, I want to see publish/unpublish buttons for each book within translations, so that I can easily control individual book visibility.

#### Acceptance Criteria

1. THE Admin_Page SHALL display all books within each translation regardless of publication status
2. WHEN displaying books in admin, THE System SHALL show publication status clearly for each book
3. WHEN a book is published, THE Admin_Page SHALL display an "Unpublish" button for that book
4. WHEN a book is unpublished, THE Admin_Page SHALL display a "Publish" button for that book
5. WHEN admin clicks publish/unpublish button, THE System SHALL toggle the book's publication status
6. WHEN book publication status changes, THE Admin_Page SHALL update the button text immediately
7. THE System SHALL show visual indicators for published vs unpublished books

### Requirement 3: End User Book Filtering

**User Story:** As an end user, I want to only see published books within translations, so that I don't encounter incomplete or problematic content.

#### Acceptance Criteria

1. WHEN loading translations for end users, THE System SHALL filter books to only show published books
2. WHEN a book is unpublished, THE System SHALL immediately hide it from end users
3. WHEN a book is published, THE System SHALL immediately show it to end users
4. THE Homepage SHALL only display translations that have at least one published book
5. THE Search_Page SHALL only search within published books
6. THE Read_Page SHALL only allow access to published books

### Requirement 4: Admin Book Management View

**User Story:** As an admin user, I want to see a comprehensive list of all books within each translation with their publication status, so that I can manage content effectively.

#### Acceptance Criteria

1. THE Admin_Page SHALL display a book management section for each translation
2. WHEN displaying books, THE System SHALL show book name and publication status
3. WHEN displaying books, THE System SHALL show chapter count and verse count for each book
4. WHEN displaying books, THE System SHALL group books by translation
5. THE Admin_Page SHALL allow bulk publish/unpublish actions for multiple books within a translation
6. THE Admin_Page SHALL show summary statistics (published vs unpublished books per translation)

### Requirement 5: Book Publication Status Persistence

**User Story:** As an admin user, I want book publication status changes to persist across sessions, so that my content management decisions are maintained.

#### Acceptance Criteria

1. WHEN book publication status is changed, THE System SHALL update Firestore immediately
2. WHEN admin refreshes the page, THE System SHALL maintain book publication status
3. WHEN end users refresh the page, THE System SHALL respect current book publication status
4. THE System SHALL handle book publication status in the optimized cache manager
5. THE System SHALL sync book publication status across all cache layers

### Requirement 6: Error Handling and Feedback

**User Story:** As an admin user, I want clear feedback when book publication status changes, so that I know my actions were successful.

#### Acceptance Criteria

1. WHEN book publication status change succeeds, THE System SHALL show success feedback
2. WHEN book publication status change fails, THE System SHALL show error message
3. WHEN network is offline, THE System SHALL queue book publication status changes
4. WHEN coming back online, THE System SHALL process queued book publication changes
5. THE System SHALL prevent multiple simultaneous publication status changes for same book