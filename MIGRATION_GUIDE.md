# Migration Guide: Zustand to Firestore

## Overview

This guide explains how to migrate from in-memory Zustand store to Firestore persistence.

## What Changed

### 1. New Service Layer
- **Repository Pattern**: `FirestoreRepository` handles all Firestore operations
- **Service Layer**: `TranslationService` and `ProjectionService` provide business logic
- **Type Safety**: Centralized types in `src/lib/types/index.ts`

### 2. Store Updates
- Store now syncs with Firestore automatically
- Real-time updates via Firestore listeners
- Fallback to localStorage for demo mode (when Firebase not configured)

### 3. Async Operations
- All data operations are now async
- Components must handle loading states
- Error handling via try/catch

## Setup Steps

### 1. Firebase Configuration

Ensure your `.env.local` has Firebase config:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 3. Initialize Firestore Collections

Firestore will auto-create collections on first write. No manual setup needed.

## Migration Process

### Automatic Migration
- The app automatically loads from Firestore on startup
- If Firestore is not configured, falls back to sample data
- Existing data in Zustand is preserved in memory

### Manual Migration (if needed)

If you have existing data in the app:

1. Export current data from Zustand:
```typescript
const { translations } = useBibleStore.getState();
console.log(JSON.stringify({ translations }));
```

2. Import via Admin page:
- Go to Admin page
- Use the "Upload Document" feature
- Or use "Quick Edit Verse" to manually add verses

## API Changes

### Store Actions

**Before:**
```typescript
importJson({ translations: [...] });
mergeTranslation(translation);
addOrUpdateVerse({ ... });
```

**After:**
```typescript
await importJson({ translations: [...] });
await mergeTranslation(translation);
await addOrUpdateVerse({ ... });
```

### Loading Translations

**Before:**
```typescript
loadSample();
```

**After:**
```typescript
await loadTranslations(); // Loads from Firestore
// Or fallback:
loadSample(); // Sample data only
```

## Testing

### Test Firestore Connection
1. Open browser console
2. Check for Firebase initialization messages
3. Check Network tab for Firestore requests

### Test Offline Mode
1. Disable network in DevTools
2. App should show cached data
3. Changes should queue and sync when online

## Troubleshooting

### Error: "Firebase not initialized"
- Check `.env.local` file exists
- Verify all Firebase config values are set
- Restart dev server after adding env vars

### Error: "Permission denied"
- Check Firestore security rules
- Ensure user is authenticated (if rules require it)
- Deploy rules: `firebase deploy --only firestore:rules`

### Data Not Persisting
- Check browser console for errors
- Verify Firestore write permissions
- Check Firestore console for data

### Real-time Updates Not Working
- Check Firestore listeners are active
- Verify network connectivity
- Check browser console for errors

## Rollback Plan

If you need to rollback:

1. The app still works without Firestore (fallback mode)
2. Remove Firestore calls from store
3. Use original Zustand-only implementation

## Next Steps

1. ✅ Firestore integration complete
2. ⏭️ Add authentication (for admin features)
3. ⏭️ Add offline persistence (IndexedDB)
4. ⏭️ Add error monitoring
5. ⏭️ Add performance monitoring

## Support

For issues or questions:
- Check Firebase console for errors
- Review Firestore security rules
- Check browser console for errors
- Verify environment variables

