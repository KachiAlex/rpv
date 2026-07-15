# Requirements Document

## Introduction

The homepage translation dropdown currently displays hardcoded translation options (King James Version (KJV), NIV, ESV) that do not match the actual translations available in the application. The app contains RPV (Redemption Project Version), KJV, and ASV translations, but the homepage dropdown shows incorrect options, creating a disconnect between the UI and the actual data.

## Glossary

- **Translation**: A version of the Bible text in the application (e.g., RPV, KJV, ASV)
- **Homepage**: The main landing page of the RPV Bible application
- **Translation Dropdown**: The select element on the homepage that allows users to choose a Bible translation
- **Bible Store**: The Zustand store that manages Bible translations and application state
- **Dynamic Loading**: Loading translation options from the application's data store rather than hardcoded values

## Requirements

### Requirement 1

**User Story:** As a user visiting the homepage, I want to see the actual Bible translations available in the app in the dropdown, so that I can select from translations that actually exist and work.

#### Acceptance Criteria

1. WHEN the homepage loads THEN the translation dropdown SHALL display only translations that exist in the Bible store
2. WHEN translations are loaded from the store THEN the dropdown SHALL show the translation name and ID in a user-friendly format
3. WHEN no translations are available THEN the dropdown SHALL show a loading state or default message
4. WHEN a user selects a translation from the dropdown THEN the selection SHALL be preserved for search functionality
5. WHEN the translation list changes THEN the dropdown SHALL update automatically to reflect the current available translations

### Requirement 2

**User Story:** As a user, I want the translation dropdown to show meaningful names, so that I can easily identify which Bible version I'm selecting.

#### Acceptance Criteria

1. WHEN displaying translation options THEN the system SHALL show the full translation name (e.g., "Redemption Project Version (RPV)")
2. WHEN a translation has no books loaded THEN the system SHALL still display the translation but MAY indicate its status
3. WHEN translations are sorted THEN the system SHALL prioritize RPV first, followed by other translations alphabetically
4. WHEN displaying translation names THEN the system SHALL use consistent formatting across all dropdown options
5. WHEN a translation name is too long THEN the system SHALL truncate it appropriately while maintaining readability

### Requirement 3

**User Story:** As a developer, I want the homepage to use the same translation data as the rest of the app, so that there's consistency and no maintenance overhead from hardcoded values.

#### Acceptance Criteria

1. WHEN the homepage component initializes THEN the system SHALL connect to the Bible store to retrieve translations
2. WHEN translations are updated in the store THEN the homepage dropdown SHALL reflect those changes automatically
3. WHEN the store is loading translations THEN the dropdown SHALL show an appropriate loading state
4. WHEN there's an error loading translations THEN the system SHALL handle it gracefully with fallback options
5. WHEN the component unmounts THEN the system SHALL clean up any subscriptions or listeners properly

### Requirement 4

**User Story:** As a user, I want the search functionality to work with the selected translation, so that my search results come from the Bible version I chose.

#### Acceptance Criteria

1. WHEN a user selects a translation and performs a search THEN the search SHALL use the selected translation
2. WHEN no translation is explicitly selected THEN the system SHALL use the default translation (RPV)
3. WHEN a user changes the translation selection THEN the new selection SHALL be applied to subsequent searches
4. WHEN the search button is clicked THEN the system SHALL navigate to the search results with the selected translation
5. WHEN the translation selection is invalid THEN the system SHALL fallback to a valid default translation