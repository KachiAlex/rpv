# Requirements Document - Red Theme Homepage Restoration

## Introduction

The user reports that the red-themed homepage is not displaying correctly, showing a white/gray theme instead. This spec will systematically restore and ensure proper deployment of the red-themed RPV homepage.

## Glossary

- **Red Theme**: The original RPV homepage design with red sidebar (#a9291c), red buttons, and gold banner
- **White Theme**: The incorrect homepage showing "A unique way to read and project the Bible" with basic styling
- **RPV Homepage**: The correct homepage with "RPV Study & Projection" branding and red color scheme
- **Firebase Deployment**: The hosting platform where the site is deployed

## Requirements

### Requirement 1: Verify Current Homepage Code

**User Story:** As a developer, I want to verify the homepage code contains the red theme, so that I can confirm the issue is not in the source code.

#### Acceptance Criteria

1. THE Homepage Component SHALL contain the red sidebar with bg-[#a9291c] class
2. THE Homepage Component SHALL contain "RPV Study & Projection" branding text
3. THE Homepage Component SHALL contain red search button with bg-[#a9291c] class
4. THE Homepage Component SHALL contain gold banner with bg-[#ffd700] class
5. THE Homepage Component SHALL use PageWrap with withSidebar prop

### Requirement 2: Ensure Proper Build Process

**User Story:** As a developer, I want to ensure the build process includes the red theme, so that the deployment contains the correct styling.

#### Acceptance Criteria

1. WHEN building the application, THE Build Process SHALL compile without errors
2. WHEN building the application, THE Build Process SHALL include Tailwind CSS classes for red theme
3. THE Generated CSS SHALL contain the #a9291c color definitions
4. THE Generated HTML SHALL contain the red theme class names
5. THE Build Output SHALL be placed in the 'out' directory for Firebase hosting

### Requirement 3: Deploy Correct Version to Firebase

**User Story:** As a user, I want to see the red-themed homepage when visiting the site, so that I can access the proper RPV interface.

#### Acceptance Criteria

1. WHEN deploying to Firebase, THE Deployment SHALL use the correct build output
2. WHEN visiting the homepage, THE User SHALL see a red sidebar with "RPV Study & Projection"
3. WHEN visiting the homepage, THE User SHALL see red-themed buttons and form elements
4. WHEN visiting the homepage, THE User SHALL see the gold banner at the top
5. THE Deployed Site SHALL NOT show "A unique way to read and project the Bible" heading

### Requirement 4: Verify Deployment Success

**User Story:** As a developer, I want to verify the deployment worked correctly, so that users see the intended design.

#### Acceptance Criteria

1. THE Firebase Hosting URL SHALL serve the red-themed homepage
2. WHEN accessing the site in incognito mode, THE User SHALL see the red theme
3. WHEN checking browser developer tools, THE CSS SHALL contain red theme classes
4. THE Page Source SHALL contain the correct RPV branding text
5. THE Site SHALL load with optimized performance from backend improvements

### Requirement 5: Handle Caching Issues

**User Story:** As a user, I want to see the updated homepage immediately, so that caching doesn't prevent me from seeing the correct design.

#### Acceptance Criteria

1. WHEN the site is updated, THE Firebase CDN SHALL serve the new version
2. WHEN clearing browser cache, THE User SHALL see the updated red theme
3. THE Deployment SHALL include cache-busting mechanisms if needed
4. THE Site SHALL work correctly across different browsers and devices
5. IF caching persists, THE System SHALL provide alternative access methods