# Quick Build Start - 5 Minutes

## Prerequisites Check

```bash
# Check Node.js
node --version  # Should be v16+

# Check npm
npm --version   # Should be v7+

# Install Expo CLI (if not already installed)
npm install -g expo-cli

# Install EAS CLI (if not already installed)
npm install -g eas-cli
```

## Step 1: Install Dependencies (2 minutes)

```bash
cd mobile
npm install --legacy-peer-deps
```

**Note**: The `--legacy-peer-deps` flag is needed due to React version compatibility in testing libraries.

## Step 2: Verify Setup (1 minute)

```bash
# Check if dependencies installed
npm list expo
npm list react-native
npm list firebase

# Run linting
npm run lint
```

## Step 3: Run Tests (1 minute)

```bash
npm test
```

Expected: All tests pass ✅

## Step 4: Build Preview APK (30+ minutes)

### Option A: Using EAS (Recommended)

```bash
# Login to EAS (first time only)
eas login

# Build preview APK
eas build --platform android --profile preview
```

### Option B: Using Build Script

```bash
./scripts/build.sh preview
```

## Step 5: Download & Test APK

1. Go to https://expo.dev/builds
2. Find your build
3. Download the APK
4. Install on Android device:
   ```bash
   adb install app-release.apk
   ```

## Step 6: Build Production APK (30+ minutes)

```bash
eas build --platform android --profile production
```

---

## Troubleshooting

### npm install fails
```bash
# Clear cache and try again
npm cache clean --force
npm install --legacy-peer-deps
```

### Tests fail
```bash
# Clear Jest cache
npm test -- --clearCache
```

### Build fails
```bash
# Check EAS logs
eas build:list
eas build:view <build-id>

# Clear EAS cache
eas build:cache:remove
```

### Firebase connection issues
- Verify `.env` file has correct credentials
- Check Firebase project settings
- Verify Android package name: `com.rpvbible.app`

---

## Success Indicators

✅ **Dependencies installed**: `npm list` shows all packages  
✅ **Tests pass**: `npm test` shows all tests passing  
✅ **Linting passes**: `npm run lint` shows no errors  
✅ **APK builds**: EAS shows successful build  
✅ **APK installs**: Device shows app installed  
✅ **App launches**: App opens and shows home screen  

---

## Next Steps

1. Follow steps 1-3 above
2. Run `eas build --platform android --profile preview`
3. Test APK on device
4. Run `eas build --platform android --profile production`
5. See `RELEASE_GUIDE.md` for Play Store release

---

## Time Estimates

| Step | Time |
|------|------|
| Install dependencies | 2-5 min |
| Run tests | 1-2 min |
| Build preview APK | 20-30 min |
| Download & test | 5-10 min |
| Build production APK | 20-30 min |
| **Total** | **50-80 min** |

---

## Commands Reference

```bash
# Development
npm start                    # Start dev server
npm run android             # Run on Android emulator

# Testing
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # With coverage

# Linting
npm run lint               # Check for errors

# Building
npm run build:android      # Build with EAS
npm run build:android:preview  # Preview build
npm run submit:android     # Submit to Play Store

# Version Management
node scripts/version.js get              # Get current version
node scripts/version.js set 1.0.0        # Set version
node scripts/version.js increment patch  # Increment patch
node scripts/version.js increment minor  # Increment minor
node scripts/version.js increment major  # Increment major
```

---

## Important Files

- `mobile/.env` - Environment variables (Firebase credentials)
- `mobile/app.json` - Expo configuration
- `mobile/eas.json` - EAS build profiles
- `mobile/package.json` - Dependencies and scripts
- `mobile/BUILD_GUIDE.md` - Detailed build guide
- `mobile/TESTING_GUIDE.md` - Testing procedures
- `mobile/RELEASE_GUIDE.md` - Release procedures

---

## Support

For detailed information, see:
- `BUILD_GUIDE.md` - Complete build guide
- `TESTING_GUIDE.md` - Testing procedures
- `RELEASE_GUIDE.md` - Release procedures
- `REACT_NATIVE_BUILD_TEST_GUIDE.md` - Testing guide
- `REACT_NATIVE_BUILD_READINESS_REPORT.md` - Readiness report

