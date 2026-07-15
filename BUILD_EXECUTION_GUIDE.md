# React Native APK Build - Execution Guide

**Date**: January 3, 2026  
**Project**: RPV Bible Mobile App  
**Status**: Ready for Build Execution

---

## System Verification

✅ **Node.js**: v20.19.6 (Required: v16+)  
✅ **npm**: 11.7.0 (Required: v7+)  
✅ **Expo CLI**: Ready to install  
✅ **EAS CLI**: Ready to install  

---

## Build Execution Steps

### Step 1: Install Global Tools (First Time Only)

```bash
npm install -g expo-cli
npm install -g eas-cli
```

### Step 2: Install Project Dependencies

```bash
cd mobile
npm install --legacy-peer-deps
```

**Why `--legacy-peer-deps`?**
- React 18 vs React 19 compatibility in testing libraries
- Allows installation to proceed without peer dependency conflicts

**Expected Time**: 2-5 minutes

### Step 3: Verify Installation

```bash
npm list expo
npm list react-native
npm list firebase
```

### Step 4: Run Tests

```bash
npm test
```

**Expected Output**: All tests pass ✅

### Step 5: Check Linting

```bash
npm run lint
```

**Expected Output**: No errors ✅

### Step 6: Build Preview APK

```bash
# First time only - login to EAS
eas login

# Build preview APK
eas build --platform android --profile preview
```

**Expected Time**: 20-30 minutes

### Step 7: Download & Test APK

1. Go to https://expo.dev/builds
2. Find your build
3. Download the APK
4. Install on Android device:
   ```bash
   adb install app-release.apk
   ```

### Step 8: Build Production APK

```bash
eas build --platform android --profile production
```

**Expected Time**: 20-30 minutes

---

## Build Profiles

### Development
- **Type**: APK
- **Distribution**: Internal
- **Use**: Local testing with Expo Go
- **Command**: `eas build --profile development`

### Preview
- **Type**: APK
- **Distribution**: Internal
- **Use**: Testing before production
- **Command**: `eas build --profile preview`

### Production
- **Type**: App Bundle
- **Distribution**: Store
- **Use**: Google Play Store release
- **Command**: `eas build --profile production`

---

## Configuration Files

### mobile/.env
```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyDYTudeKDSvY_IrwI5nookV0cv828uAAvU
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=redemptionprojectversion.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=redemptionprojectversion
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=redemptionprojectversion.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=262491376013
EXPO_PUBLIC_FIREBASE_APP_ID=1:262491376013:web:edc2194e6bb7819294d5c4
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_API_TIMEOUT=30000
EXPO_PUBLIC_APP_ENV=development
```

### mobile/app.json
- App name: RPV Bible
- Package name: com.rpvbible.app
- Version: 1.0.0
- Permissions: INTERNET, READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE

### mobile/eas.json
- Three build profiles configured
- Automatic signing enabled
- Firebase integration configured

---

## Testing Checklist

### Pre-Build
- [ ] Node.js v16+ installed
- [ ] npm v7+ installed
- [ ] Expo CLI installed
- [ ] EAS CLI installed
- [ ] Android SDK installed (for local testing)

### Build Setup
- [ ] Dependencies installed
- [ ] Tests passing
- [ ] Linting passing
- [ ] EAS account created

### Build Execution
- [ ] Preview APK built
- [ ] APK installed on device
- [ ] App launches

### Feature Testing
- [ ] Authentication works
- [ ] Search works
- [ ] Bible reading works
- [ ] Bookmarks work
- [ ] Offline mode works
- [ ] Translations work
- [ ] Settings work
- [ ] Admin panel works

### Production Build
- [ ] Production APK built
- [ ] APK signed
- [ ] Version updated
- [ ] Ready for Play Store

---

## Troubleshooting

### npm install fails
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

### Tests fail
```bash
npm test -- --clearCache
```

### Build fails
```bash
eas build:list
eas build:view <build-id>
eas build:cache:remove
```

### Firebase connection issues
- Verify `.env` file has correct credentials
- Check Firebase project settings
- Verify Android package name: `com.rpvbible.app`

---

## Time Estimates

| Task | Time |
|------|------|
| Install global tools | 2-3 min |
| Install dependencies | 2-5 min |
| Run tests | 1-2 min |
| Build preview APK | 20-30 min |
| Download & test | 5-10 min |
| Build production APK | 20-30 min |
| **Total** | **50-80 min** |

---

## Success Criteria

✅ **Build is successful** when:
1. All dependencies install without errors
2. All tests pass
3. Linting passes with no errors
4. APK builds without errors
5. APK installs on Android device
6. All features work on device

---

## Key Commands Reference

```bash
# Install global tools
npm install -g expo-cli
npm install -g eas-cli

# Install dependencies
npm install --legacy-peer-deps

# Run tests
npm test

# Check linting
npm run lint

# Build preview APK
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production

# Get current version
node scripts/version.js get

# Increment version
node scripts/version.js increment patch
```

---

## Project Structure

```
mobile/
├── src/                    # Source code (40+ files)
│   ├── screens/           # 8 screen components
│   ├── services/          # 8 service modules
│   ├── store/             # 4 state stores
│   ├── navigation/        # Navigation setup
│   ├── __tests__/         # Tests
│   └── utils/             # Utilities
├── scripts/               # Build scripts
├── assets/                # App assets
├── app.json              # Expo config
├── eas.json              # EAS build profiles
├── package.json          # Dependencies
├── .env                  # Environment variables
└── BUILD_GUIDE.md        # Build guide
```

---

## Features Ready for Testing

✅ Authentication (Firebase)
✅ Bible search (multiple translations)
✅ Bible reading (chapter navigation)
✅ Bookmarks (cloud sync)
✅ Offline support (SQLite cache)
✅ Translation management
✅ User preferences (cloud sync)
✅ Admin dashboard
✅ Responsive design (all screen sizes)

---

## Next Steps

1. **Install global tools** (2-3 min)
2. **Install dependencies** (2-5 min)
3. **Run tests** (1-2 min)
4. **Build preview APK** (20-30 min)
5. **Test on device** (5-10 min)
6. **Build production APK** (20-30 min)

---

## Support

For questions:
1. Check `mobile/QUICK_BUILD_START.md` for quick answers
2. See `mobile/BUILD_GUIDE.md` for detailed instructions
3. Review `REACT_NATIVE_TESTING_INDEX.md` for documentation index

---

## Status

| Component | Status |
|-----------|--------|
| Source Code | ✅ Complete |
| Configuration | ✅ Complete |
| Assets | ✅ Complete |
| Build Infrastructure | ✅ Complete |
| Testing Framework | ✅ Complete |
| Documentation | ✅ Complete |
| **Overall** | **✅ READY** |

---

**Ready to Build**: ✅ YES

**Estimated Time to First APK**: 30-45 minutes

