# React Native APK Build Testing Guide

## Current Status

✅ **Setup Complete**:
- All source files created and verified
- Asset files generated (icon, splash, adaptive-icon, favicon)
- Environment variables configured (.env file created)
- EAS configuration ready (eas.json)
- Build scripts prepared (build.sh, version.js)
- Testing framework configured (Jest, testing libraries)

## Prerequisites for Testing

Before running the build, ensure you have:

1. **Node.js** (v16+)
   ```bash
   node --version
   ```

2. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

3. **EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

4. **Android SDK** (for local testing)
   - Download from: https://developer.android.com/studio
   - Set ANDROID_HOME environment variable

5. **Firebase Project** (already configured)
   - Project ID: redemptionprojectversion
   - Credentials in mobile/.env

## Step 1: Install Dependencies

```bash
cd mobile
npm install --legacy-peer-deps
```

**Note**: Using `--legacy-peer-deps` due to React 18 vs React 19 compatibility in testing libraries.

## Step 2: Verify Installation

```bash
npm list expo
npm list react-native
npm list firebase
```

## Step 3: Run Unit Tests

```bash
npm test
```

This will run:
- `src/__tests__/services.test.ts` - Service unit tests
- `src/__tests__/integration.test.ts` - Integration tests

Expected output: All tests should pass

## Step 4: Run Linting

```bash
npm run lint
```

Verify no TypeScript or ESLint errors.

## Step 5: Build Preview APK

### Option A: Using Build Script

```bash
./scripts/build.sh preview
```

### Option B: Using EAS CLI Directly

```bash
eas build --platform android --profile preview
```

**Note**: Requires EAS login
```bash
eas login
```

## Step 6: Build Production APK

### Option A: Using Build Script

```bash
./scripts/build.sh production
```

### Option B: Using EAS CLI Directly

```bash
eas build --platform android --profile production
```

## Step 7: Test on Device/Emulator

### Using Expo Go (Development)

```bash
npm start
```

Then:
- Scan QR code with Expo Go app on device
- Or press `a` for Android emulator

### Using Built APK

1. Download APK from EAS build
2. Install on device:
   ```bash
   adb install app-release.apk
   ```
3. Launch app and test features

## Testing Checklist

### Authentication
- [ ] Sign up with valid email
- [ ] Sign in with valid credentials
- [ ] Logout
- [ ] Session persists after app restart

### Search
- [ ] Search for verse reference (e.g., "John 3:16")
- [ ] Search for keyword (e.g., "love")
- [ ] View search results
- [ ] Switch translations

### Reading
- [ ] Navigate chapters (prev/next)
- [ ] Adjust font size
- [ ] Bookmark verse
- [ ] View bookmarks

### Offline
- [ ] Search offline
- [ ] Read offline
- [ ] Sync when online

### UI/UX
- [ ] Test on small phone (< 375px)
- [ ] Test on large phone (> 600px)
- [ ] Test landscape orientation
- [ ] Test orientation change

## Build Profiles

### Development
- Type: APK
- Distribution: Internal
- Use: Local testing with Expo Go
- Command: `eas build --profile development`

### Preview
- Type: APK
- Distribution: Internal
- Use: Testing before production
- Command: `eas build --profile preview`

### Production
- Type: App Bundle
- Distribution: Store
- Use: Google Play Store release
- Command: `eas build --profile production`

## Version Management

### Get Current Version
```bash
node scripts/version.js get
```

### Set Version
```bash
node scripts/version.js set 1.0.0
```

### Increment Version
```bash
# Patch: 1.0.0 -> 1.0.1
node scripts/version.js increment patch

# Minor: 1.0.0 -> 1.1.0
node scripts/version.js increment minor

# Major: 1.0.0 -> 2.0.0
node scripts/version.js increment major
```

## Troubleshooting

### Build Fails

1. Check EAS logs:
   ```bash
   eas build:list
   eas build:view <build-id>
   ```

2. Verify credentials:
   ```bash
   eas credentials
   ```

3. Clear cache:
   ```bash
   eas build:cache:remove
   ```

### Tests Won't Run

1. Clear Jest cache:
   ```bash
   npm test -- --clearCache
   ```

2. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

### Firebase Connection Issues

1. Verify credentials in mobile/.env
2. Check Firebase project settings
3. Verify Android package name: `com.rpvbible.app`
4. Check Firestore security rules

## Next Steps

1. **Install dependencies** (Step 1)
2. **Run tests** (Step 3)
3. **Build preview APK** (Step 5)
4. **Test on device** (Step 7)
5. **Build production APK** (Step 6)
6. **Release to Play Store** (see RELEASE_GUIDE.md)

## Files Reference

- `mobile/package.json` - Dependencies and scripts
- `mobile/app.json` - Expo configuration
- `mobile/eas.json` - EAS build configuration
- `mobile/.env` - Environment variables
- `mobile/scripts/build.sh` - Build automation script
- `mobile/scripts/version.js` - Version management
- `mobile/BUILD_GUIDE.md` - Detailed build guide
- `mobile/TESTING_GUIDE.md` - Testing procedures
- `mobile/RELEASE_GUIDE.md` - Release procedures

## Support

For issues:
1. Check EAS documentation: https://docs.expo.dev/eas/
2. Check Firebase documentation: https://firebase.google.com/docs
3. Check React Native documentation: https://reactnative.dev/docs/getting-started
4. Check Expo documentation: https://docs.expo.dev/

