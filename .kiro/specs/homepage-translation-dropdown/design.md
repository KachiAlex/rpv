# Design Document

## Overview

This design outlines the implementation for updating the homepage translation dropdown to dynamically load and display actual Bible translations from the application store instead of hardcoded values. The solution will integrate with the existing Zustand store and provide a seamless user experience.

## Architecture

The solution follows a reactive architecture pattern where the homepage component subscribes to the Bible store and automatically updates when translations change. This ensures consistency across the application and eliminates maintenance overhead from hardcoded values.

### Component Architecture
```
HomePage Component
├── useBibleStore() hook
├── Translation Dropdown Component
│   ├── Loading State
│   ├── Translation Options
│   └── Error Handling
└── Search Integration
```

### Data Flow
1. Homepage component mounts and connects to Bible store
2. Store loads translations (from cache or Firestore)
3. Component receives translations and updates dropdown
4. User selects translation and performs search
5. Search uses selected translation for results

## Components and Interfaces

### Homepage Component Updates
- Convert from static component to client component ("use client")
- Add Bible store integration using useBibleStore hook
- Implement translation selection state management
- Add loading and error states for better UX

### Translation Dropdown Interface
```typescript
interface TranslationOption {
  id: string;
  name: string;
  displayName: string;
  isAvailable: boolean;
  bookCount?: number;
}

interface TranslationDropdownProps {
  translations: Translation[];
  selectedId: string;
  onSelectionChange: (id: string) => void;
  isLoading: boolean;
  error?: string;
}
```

### Store Integration
- Use existing `useBibleStore` hook
- Subscribe to `translations`, `current`, and `loadTranslations` 
- Handle loading states and error conditions
- Ensure translations are loaded on component mount

## Data Models

### Translation Display Format
```typescript
const formatTranslationName = (translation: Translation): string => {
  // RPV -> "Redemption Project Version (RPV)"
  // kjv -> "King James Version (KJV)" 
  // asv -> "American Standard Version (ASV)"
  
  const nameMap = {
    'RPV': 'Redemption Project Version (RPV)',
    'kjv': 'King James Version (KJV)',
    'asv': 'American Standard Version (ASV)'
  };
  
  return nameMap[translation.id] || `${translation.name} (${translation.id.toUpperCase()})`;
};
```

### Translation Sorting Logic
1. RPV always first (primary translation)
2. Other translations sorted alphabetically by display name
3. Translations with no books shown but marked as "Loading" or "Empty"

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

<function_calls>
<invoke name="prework">
<parameter name="featureName">homepage-translation-dropdown

Property 1: Dropdown options match store translations
*For any* Bible store state, the dropdown options should exactly match the translations available in the store
**Validates: Requirements 1.1**

Property 2: Translation names follow consistent format
*For any* translation in the dropdown, the display name should follow the pattern "Full Name (ID)" or use the predefined name mapping
**Validates: Requirements 1.2, 2.1, 2.4**

Property 3: Translation selection persists for search
*For any* valid translation selection, the selected value should be preserved and used for subsequent search operations
**Validates: Requirements 1.4, 4.1**

Property 4: Dropdown updates with store changes
*For any* change to the translations in the store, the dropdown should automatically reflect those changes
**Validates: Requirements 1.5, 3.2**

Property 5: RPV translation appears first
*For any* list of translations that includes RPV, RPV should appear as the first option in the dropdown
**Validates: Requirements 2.3**

Property 6: Search uses selected translation
*For any* translation selection and search action, the search should use the selected translation as a parameter
**Validates: Requirements 4.1, 4.3, 4.4**

## Error Handling

### Translation Loading Errors
- Display fallback message when translations fail to load
- Provide retry mechanism for failed loads
- Show cached translations if available during network errors

### Invalid Selection Handling
- Default to RPV if selected translation becomes unavailable
- Validate translation exists before using for search
- Handle edge cases where store is empty or corrupted

### Component Lifecycle Errors
- Graceful degradation if store connection fails
- Proper cleanup of subscriptions on unmount
- Error boundaries to prevent component crashes

## Testing Strategy

### Unit Testing
- Test translation name formatting function with various inputs
- Test component rendering with different store states
- Test event handlers for dropdown selection changes
- Test error handling with simulated failure conditions

### Property-Based Testing
The testing strategy will use Jest with React Testing Library for unit tests and property-based testing for universal properties. Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage.

**Property-based testing requirements:**
- Use Jest and React Testing Library for the testing framework
- Configure each property-based test to run 100+ iterations
- Tag each test with the corresponding design property number
- Generate random translation data for comprehensive testing
- Test component behavior across various store states

### Integration Testing
- Test homepage integration with Bible store
- Test search functionality with selected translations
- Test component behavior during store loading states
- Test navigation to search results with translation parameters

## Implementation Notes

### Performance Considerations
- Memoize translation formatting to avoid recalculation
- Use React.memo for dropdown component to prevent unnecessary re-renders
- Debounce store subscriptions if needed for performance

### Accessibility
- Ensure dropdown is keyboard navigable
- Add proper ARIA labels for screen readers
- Maintain focus management during loading states

### Browser Compatibility
- Use standard HTML select element for maximum compatibility
- Fallback gracefully if JavaScript is disabled
- Test across major browsers and mobile devices