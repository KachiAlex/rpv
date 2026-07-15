# React Native APK Build - Quick Start Guide

## Current Status
**Tasks Completed**: 1-8 (out of 12)
**Progress**: ~67% complete

## What's Been Built

### Core Features ✅
- ✅ Expo project setup with TypeScript
- ✅ Navigation system (tabs, drawer, stack)
- ✅ Bible search engine with offline support
- ✅ Offline cache system with SQLite
- ✅ Translation management
- ✅ Bible reading interface
- ✅ Firebase authentication
- ✅ Bookmark sync with Firestore
- ✅ Preference management
- ✅ Responsive UI utilities

### Screens Implemented ✅
- **HomeScreen**: Dashboard with feature overview
- **SearchScreen**: Full-featured verse search
- **ReadScreen**: Bible reader with navigation
- **BookmarksScreen**: Bookmark management
- **SettingsScreen**: User preferences and auth
- **AuthScreen**: Login/signup interface
- **TranslationScreen**: Translation selection

## Quick Setup

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Configure Environment
Create `.env.local` in the mobile directory:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Run Development Server
```bash
npm start
```

### 4. Test on Device/Emulator
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## Key Files to Know

### State Management (Zustand)
- `mobile/src/store/authStore.ts` - Authentication state
- `mobile/src/store/bookmarkStore.ts` - Bookmark management
- `mobile/src/store/preferencesStore.ts` - User preferences

### Services
- `mobile/src/services/firebase.ts` - Firebase integration
- `mobile/src/services/searchService.ts` - Search functionality
- `mobile/src/services/database.ts` - SQLite database
- `mobile/src/services/cacheService.ts` - Offline caching
- `mobile/src/services/translationService.ts` - Translation management
- `mobile/src/services/bibleReaderService.ts` - Bible reading

### Utilities
- `mobile/src/utils/responsive.ts` - Responsive design utilities
- `mobile/src/hooks/useResponsive.ts` - Responsive hooks

## Testing the App

### Authentication Flow
1. Launch app → AuthScreen appears
2. Click "Don't have an account? Sign Up"
3. Enter email and password
4. Click "Create Account"
5. After signup, main app loads

### Search Feature
1. Go to Search tab
2. Type a verse reference (e.g., "John 3:16")
3. Results appear with verse text
4. Tap a result to view details

### Reading Bible
1. Go to Read tab
2. Select translation from dropdown
3. Navigate chapters with prev/next buttons
4. Adjust font size with +/- buttons
5. Bookmark verses by tapping bookmark icon

### Bookmarks
1. Go to Bookmarks tab
2. View all saved bookmarks
3. Tap delete icon to remove
4. Bookmarks sync to Firebase when online

### Settings
1. Go to Settings tab
2. View signed-in user email
3. Toggle dark mode and notifications
4. Click Logout to sign out

## Responsive Design

The app automatically adapts to:
- **Small phones** (< 375px): Compact layouts
- **Medium phones** (375-414px): Standard layouts
- **Large phones** (414-600px): Spacious layouts
- **Tablets** (> 600px): Multi-column layouts
- **Landscape**: Optimized horizontal layouts

## Offline Support

The app works offline with:
- Cached verses from previous searches
- Offline bookmark queue (syncs when online)
- Offline preference queue (syncs when online)
- Local translation data

## Next Steps

### Task 9: Admin Features
- Admin authentication
- Admin-only screens
- Blog management
- Analytics dashboard

### Task 10: Build & Deployment
- Configure EAS Build
- Set up Android signing
- Create build scripts
- Optimize APK size

### Task 11: Testing & QA
- Unit tests for services
- Integration tests
- Device testing
- Performance testing

### Task 12: Release
- Production build
- Google Play Store setup
- Release management

## Common Commands

```bash
# Start development server
npm start

# Run on Android emulator
npm run android

# Run on iOS simulator
npm run ios

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Troubleshooting

### Firebase Not Initializing
- Check `.env.local` has all required keys
- Verify Firebase project is active
- Check internet connection

### Bookmarks Not Syncing
- Ensure user is authenticated
- Check Firestore security rules
- Verify offline queue is processing

### Search Not Working
- Check backend API is running
- Verify search service configuration
- Check offline cache has data

### Responsive Layout Issues
- Test on different screen sizes
- Check useResponsive hook is working
- Verify responsive utilities are applied

## Architecture Overview

```
App
├── Firebase & Database Init
├── Auth State Init
└── RootNavigator
    ├── AuthScreen (if not authenticated)
    └── DrawerNavigator (if authenticated)
        ├── TabNavigator
        │   ├── HomeScreen
        │   ├── SearchScreen
        │   ├── ReadScreen
        │   ├── BookmarksScreen
        │   └── SettingsScreen
        ├── TranslationScreen
        └── SettingsScreen
```

## Performance Tips

- Use FlatList for long lists
- Implement pagination for large datasets
- Cache frequently accessed data
- Lazy load images
- Minimize re-renders with Zustand
- Use responsive utilities for efficient layouts

## Security Notes

- Firebase auth handles password security
- Firestore rules should be configured
- Sensitive data should be encrypted
- API keys should be in environment variables
- Never commit .env.local to version control

## Support

For issues or questions:
1. Check the spec files in `.kiro/specs/react-native-apk-build/`
2. Review service implementations
3. Check Firebase console for errors
4. Test on real device if possible
5. Check network requests in browser DevTools

## Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Firebase Docs](https://firebase.google.com/docs)
- [React Navigation Docs](https://reactnavigation.org/)
- [Zustand Docs](https://github.com/pmndrs/zustand)
