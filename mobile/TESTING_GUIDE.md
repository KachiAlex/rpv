# RPV Bible Testing Guide

## Test Setup

### Install Test Dependencies

```bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
```

### Configure Jest

Jest is already configured in `jest.config.js` and `jest.setup.js`.

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Specific Test File

```bash
npm test -- services.test.ts
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

## Test Structure

### Unit Tests

Located in `src/__tests__/services.test.ts`

Tests individual services:
- Search service
- Translation service
- Cache service
- Firebase service
- Offline queue service

### Integration Tests

Located in `src/__tests__/integration.test.ts`

Tests workflows:
- Search and cache workflow
- Offline to online transition
- Bookmark consistency
- Preference sync

## Manual Testing

### Test on Android Emulator

1. Start emulator:
```bash
emulator -avd <emulator_name>
```

2. Run app:
```bash
npm start
```

3. Press `a` to open in Android emulator

### Test on Physical Device

1. Enable USB debugging on device
2. Connect device via USB
3. Run app:
```bash
npm start
```

4. Scan QR code with Expo Go app

### Test Scenarios

#### Authentication
- [ ] Sign up with valid email
- [ ] Sign up with invalid email
- [ ] Sign up with mismatched passwords
- [ ] Sign in with valid credentials
- [ ] Sign in with invalid credentials
- [ ] Logout
- [ ] Session persistence

#### Search
- [ ] Search for verse reference (e.g., "John 3:16")
- [ ] Search for keyword (e.g., "love")
- [ ] View search results
- [ ] View recent searches
- [ ] Clear search history

#### Reading
- [ ] Navigate chapters (prev/next)
- [ ] Switch translations
- [ ] Adjust font size
- [ ] Bookmark verse
- [ ] Copy verse
- [ ] View bookmarks

#### Offline
- [ ] Search offline
- [ ] Read offline
- [ ] Add bookmark offline
- [ ] Sync when online

#### Responsive Design
- [ ] Test on small phone (< 375px)
- [ ] Test on medium phone (375-414px)
- [ ] Test on large phone (414-600px)
- [ ] Test on tablet (> 600px)
- [ ] Test landscape orientation
- [ ] Test orientation change

#### Performance
- [ ] Measure app startup time
- [ ] Measure search response time
- [ ] Check memory usage
- [ ] Check battery drain

## Device Testing Checklist

### Android Versions
- [ ] Android 8.0 (API 26)
- [ ] Android 9.0 (API 28)
- [ ] Android 10.0 (API 29)
- [ ] Android 11.0 (API 30)
- [ ] Android 12.0 (API 31)
- [ ] Android 13.0 (API 33)

### Screen Sizes
- [ ] Small phone (4.5")
- [ ] Medium phone (5.5")
- [ ] Large phone (6.5")
- [ ] Tablet (7")
- [ ] Tablet (10")

### Network Conditions
- [ ] WiFi
- [ ] 4G LTE
- [ ] 3G
- [ ] Offline

### Battery States
- [ ] Full battery
- [ ] Low battery (< 20%)
- [ ] Battery saver mode

## Performance Testing

### Startup Time

```bash
npm test -- --testNamePattern="startup"
```

Target: < 2 seconds

### Search Response Time

```bash
npm test -- --testNamePattern="search"
```

Target: < 500ms

### Memory Usage

Monitor in Android Studio:
1. Open Android Studio
2. Connect device
3. Go to Profiler
4. Monitor memory usage

Target: < 100MB

### Battery Drain

Monitor in Android Studio:
1. Open Android Studio
2. Connect device
3. Go to Profiler
4. Monitor battery usage

Target: < 5% per hour

## Debugging

### Enable Debug Logging

```bash
export DEBUG=*
npm start
```

### Use React DevTools

1. Install React DevTools browser extension
2. Run app with `npm start`
3. Open browser DevTools
4. Go to React tab

### Use Android Studio Debugger

1. Open Android Studio
2. Connect device
3. Go to Debug > Attach Debugger to Android Process
4. Select app process

### View Logs

```bash
adb logcat | grep RPVBible
```

## Continuous Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

## Test Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Known Issues

### Firebase Emulator

To test Firebase locally:

```bash
firebase emulators:start
```

Then update `.env.local`:

```
FIREBASE_EMULATOR_HOST=localhost:9099
```

### Network Issues

If tests fail due to network:

1. Check internet connection
2. Verify Firebase credentials
3. Check firewall settings
4. Try running tests offline

## Troubleshooting

### Tests Won't Run

1. Clear cache:
```bash
npm test -- --clearCache
```

2. Reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

3. Check Node version:
```bash
node --version
```

### Tests Timeout

Increase timeout in test:

```typescript
it('should do something', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Firebase Connection Fails

1. Verify credentials in `.env.local`
2. Check Firebase project settings
3. Verify Android package name
4. Check Firestore security rules

## Best Practices

1. **Write tests as you code** - Don't leave testing for later
2. **Test edge cases** - Not just happy paths
3. **Use descriptive names** - Make tests self-documenting
4. **Keep tests isolated** - Each test should be independent
5. **Mock external services** - Don't rely on real APIs
6. **Test user workflows** - Not just individual functions
7. **Maintain test data** - Keep test fixtures up to date
8. **Review test coverage** - Aim for > 80%

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)
- [Firebase Testing](https://firebase.google.com/docs/emulator-suite)
- [Android Testing](https://developer.android.com/training/testing)
