# RPV Bible APK Build Guide

## Prerequisites

1. **Node.js** (v16+)
2. **Expo CLI**: `npm install -g expo-cli`
3. **EAS CLI**: `npm install -g eas-cli`
4. **Android SDK** (for local testing)
5. **Firebase Project** with Android app configured
6. **Google Play Console Account** (for production release)

## Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment

Create `.env.local` with Firebase credentials:

```
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Set Up EAS

```bash
eas login
eas build:configure
```

## Building

### Development Build

For testing with Expo Go:

```bash
npm start
```

Scan QR code with Expo Go app on your device.

### Preview APK

For internal testing:

```bash
./scripts/build.sh preview
```

Or manually:

```bash
eas build --platform android --profile preview
```

### Production APK

For Google Play Store release:

```bash
./scripts/build.sh production
```

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
# Increment patch (1.0.0 -> 1.0.1)
node scripts/version.js increment patch

# Increment minor (1.0.0 -> 1.1.0)
node scripts/version.js increment minor

# Increment major (1.0.0 -> 2.0.0)
node scripts/version.js increment major
```

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

## Signing

### Automatic Signing (Recommended)

EAS handles signing automatically:

```bash
eas build --platform android --profile production
```

### Manual Signing

If you need to sign manually:

1. Create keystore:
```bash
keytool -genkey -v -keystore rpv-bible.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias rpv-bible
```

2. Configure in `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "keystore": "rpv-bible.keystore"
      }
    }
  }
}
```

## Optimization

### APK Size Optimization

1. **Enable Minification**:
   - Already configured in `eas.json`

2. **Remove Unused Code**:
   ```bash
   npm run lint
   npm run build
   ```

3. **Optimize Assets**:
   - Compress images
   - Remove unused fonts
   - Minimize bundle size

### Performance Optimization

1. **Code Splitting**: Already implemented
2. **Lazy Loading**: Already implemented
3. **Caching**: Already implemented
4. **Offline Support**: Already implemented

## Google Play Store Release

### 1. Create Google Play Console Account

Visit: https://play.google.com/console

### 2. Create App

1. Click "Create app"
2. Enter app name: "RPV Bible"
3. Select category: "Books & Reference"
4. Accept declarations

### 3. Configure App Listing

1. **App Details**:
   - Title: RPV Bible
   - Short description: Study Scripture with confidence
   - Full description: Complete Bible app with search, reading, and bookmarks

2. **Graphics**:
   - Icon (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Screenshots (up to 8)
   - Video (optional)

3. **Content Rating**:
   - Fill out questionnaire
   - Get rating certificate

4. **Pricing & Distribution**:
   - Set as free
   - Select countries
   - Content guidelines

### 4. Upload APK

1. Go to "Release" > "Production"
2. Click "Create new release"
3. Upload signed APK/App Bundle
4. Add release notes
5. Review and publish

### 5. Monitor Release

1. Check crash reports
2. Monitor user reviews
3. Track performance metrics
4. Plan updates

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

### APK Won't Install

1. Check Android version compatibility
2. Verify signing certificate
3. Check device storage
4. Try uninstalling previous version

### Firebase Connection Issues

1. Verify Firebase credentials in `.env.local`
2. Check Firebase project settings
3. Verify Android package name matches
4. Check Firestore security rules

## Release Checklist

- [ ] Version number updated
- [ ] Release notes written
- [ ] All tests passing
- [ ] Firebase configured
- [ ] Environment variables set
- [ ] APK built and tested
- [ ] Google Play Console account ready
- [ ] App listing complete
- [ ] Screenshots uploaded
- [ ] Content rating obtained
- [ ] APK signed
- [ ] Release published
- [ ] Monitoring set up

## Support

For issues:
1. Check EAS documentation: https://docs.expo.dev/eas/
2. Check Firebase documentation: https://firebase.google.com/docs
3. Check Google Play Console help: https://support.google.com/googleplay/android-developer

## Next Steps

After release:
1. Monitor crash reports
2. Respond to user reviews
3. Plan next features
4. Schedule updates
